import Anthropic from "@anthropic-ai/sdk";

export interface InstagramImageAnalysis {
  image_type: string;
  composition: {
    shot_type: string;
    camera_style: string;
    angle: string;
    framing: string;
    focus_priority: string[];
  };
  scene: {
    setting: string;
    environment: {
      foreground: string[];
      midground: string[];
      background: string[];
    };
    lighting: {
      type: string;
      quality: string;
      direction: string;
      effect: string;
    };
    atmosphere: string[];
  };
  situation: {
    apparent_activity: string;
    likely_context: string[];
    interaction_with_scene: string;
  };
  subject: {
    count: number;
    presentation: string;
    placement: string;
    body_orientation: string;
  };
  pose: {
    head_position: string;
    shoulders: string;
    neck_posture: string;
    overall_pose_style: string[];
  };
  facial_expression: {
    expression_type: string;
    mouth: string;
    eyes: string;
    brows: string;
    emotion_impression: string[];
  };
  outfit: {
    overall_style: string[];
    top: {
      type: string;
      fit: string;
      color: string;
      features: string[];
      style_effect: string;
    };
  };
  accessories: {
    jewelry: Array<{
      type: string;
      placement: string;
      style: string;
    }>;
    other_accessories: string[];
  };
  environmental_details: {
    interior_elements: string[];
    exterior_elements: string[];
  };
  image_reading_summary: {
    primary_story: string;
    main_visual_themes: string[];
  };
  [key: string]: any;
}

export async function analyzeInstagramImage(
  imageSource: string | Buffer,
  apiKey: string
): Promise<InstagramImageAnalysis> {
  const client = new Anthropic({ apiKey });

  let imageData: {
    type: "base64" | "url";
    media_type?: string;
    data?: string;
    url?: string;
  };

  // Déterminer si c'est une URL ou un buffer
  if (typeof imageSource === "string" && imageSource.startsWith("http")) {
    imageData = {
      type: "url",
      url: imageSource,
    };
  } else if (typeof imageSource === "string") {
    // Assume c'est du base64
    imageData = {
      type: "base64",
      media_type: "image/jpeg",
      data: imageSource,
    };
  } else {
    // C'est un buffer
    imageData = {
      type: "base64",
      media_type: "image/jpeg",
      data: imageSource.toString("base64"),
    };
  }

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source:
              imageData.type === "url"
                ? {
                    type: "url",
                    url: imageData.url!,
                  }
                : {
                    type: "base64",
                    media_type: imageData.media_type!,
                    data: imageData.data!,
                  },
          },
          {
            type: "text",
            text: `Analyse this image in exhaustive JSON detail. Don't exceed 6000 characters. Detail the exact identical situation, the outfit, the facial expressions, the clothes, the accessories. Don't describe the model detail such as the hair color, the eyes color and dont describe the copywriting on the photo.

Return ONLY valid JSON, no other text. Use this structure:
{
  "image_type": "...",
  "visible_format": {"note": "..."},
  "orientation": "...",
  "composition": {...},
  "scene": {...},
  "situation": {...},
  "subject": {...},
  "pose": {...},
  "facial_expression": {...},
  "appearance": {...},
  "outfit": {...},
  "accessories": {...},
  "environmental_details": {...},
  "image_reading_summary": {...}
}`,
          },
        ],
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  try {
    const analysis: InstagramImageAnalysis = JSON.parse(content.text);
    return analysis;
  } catch (e) {
    throw new Error(
      `Failed to parse Claude response as JSON: ${content.text.substring(0, 200)}`
    );
  }
}

export function buildHiggsFieldPrompt(
  analysis: InstagramImageAnalysis,
  keepSmile: boolean = true
): string {
  const basePrompt = `Use the provided images strictly as a reference for the same model (identity, face, body proportions, hair color). The things you need to change are listed here (clothes, place etc)${keepSmile ? " keep the same smile" : ""}.

Here is the detailed image analysis to replicate:

${JSON.stringify(analysis, null, 2)}`;

  return basePrompt;
}

export interface HiggsFieldGenerationConfig {
  model: string;
  aspectRatio: string;
  quality?: string;
}

export const DEFAULT_CAROUSEL_CONFIG: HiggsFieldGenerationConfig = {
  model: "nano_banana_pro",
  aspectRatio: "9:16",
  quality: "2k",
};

export async function prepareHiggsFieldPayload(
  analysis: InstagramImageAnalysis,
  headImageRef: string,
  bodyImageRef: string,
  config: HiggsFieldGenerationConfig = DEFAULT_CAROUSEL_CONFIG
) {
  const prompt = buildHiggsFieldPrompt(analysis);

  return {
    model: config.model,
    aspectRatio: config.aspectRatio,
    prompt,
    medias: [
      {
        value: headImageRef,
        role: "reference_identity", // pour la tête
      },
      {
        value: bodyImageRef,
        role: "reference_body", // pour le corps
      },
    ],
    quality: config.quality,
    fullPromptForHiggsfield: {
      step1_upload: "Upload these 2 images in Higgsfield chat (in order: head, body)",
      step2_paste_prompt: prompt,
      step3_generate: "Generate with nano_banana_pro, 9:16, quality 2k",
    },
  };
}

import Anthropic from "@anthropic-ai/sdk";

export interface ImageAnalysis {
  analysis: string;
  prompts: Array<{
    style: string;
    prompt: string;
    details: string;
  }>;
}

export interface GenerateImagesParams {
  prompts: Array<{ style: string; prompt: string }>;
  model?: string;
  aspectRatio?: string;
  count?: number;
}

export async function analyzeImageAndGeneratePrompts(
  imageUrl: string,
  styles: string[],
  apiKey: string
): Promise<ImageAnalysis> {
  const client = new Anthropic({ apiKey });

  const stylesText = styles.join(", ");

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "url",
              url: imageUrl,
            },
          },
          {
            type: "text",
            text: `Tu es expert en prompt engineering et analyse visuelle pour la génération d'images IA (Higgsfield, Midjourney, DALL-E).

Analyse cette image en détail et génère des prompts structurés pour chaque style suivant : ${stylesText}

Pour chaque style, tu dois :
1. Décrire précisément le contenu, la composition et l'ambiance de l'image actuelle
2. Adapter le style tout en gardant la structure et l'essence
3. Mentionner les éléments visuels clés (couleurs, textures, éclairage, composition, format)
4. Rendre le prompt optimisé pour la génération d'images IA

Réponds UNIQUEMENT avec du JSON valide (pas d'autres textes) :
{
  "analysis": "Description détaillée de l'image",
  "prompts": [
    {
      "style": "minimal",
      "prompt": "prompt détaillé et structuré",
      "details": "éléments clés: couleurs, style, composition"
    }
  ]
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
    const analysis: ImageAnalysis = JSON.parse(content.text);
    return analysis;
  } catch (e) {
    throw new Error(`Failed to parse Claude response: ${content.text}`);
  }
}

export function buildHiggsFieldPayload(
  analysis: ImageAnalysis,
  model: string = "soul_2",
  aspectRatio: string = "9:16"
) {
  return {
    model,
    aspectRatio,
    prompts: analysis.prompts.map((p) => ({
      style: p.style,
      prompt: p.prompt,
      details: p.details,
    })),
    totalPrompts: analysis.prompts.length,
    instructions:
      "Utilise Higgsfield generate_image pour chaque prompt avec les paramètres ci-dessus",
  };
}

export function formatPromptsForDisplay(analysis: ImageAnalysis): string {
  let output = "# Analyse de l'Image\n\n";
  output += `${analysis.analysis}\n\n`;
  output += "## Prompts Générés\n\n";

  analysis.prompts.forEach((p, index) => {
    output += `### ${index + 1}. Style: ${p.style}\n`;
    output += `**Prompt:** ${p.prompt}\n`;
    output += `**Détails:** ${p.details}\n\n`;
  });

  return output;
}

export function createHiggsFieldInstructions(analysis: ImageAnalysis): string {
  let instructions = "## Instructions pour Générer les Images avec Higgsfield\n\n";
  instructions +=
    "Utilise le tool `mcp__Higgsfield__generate_image` pour chaque prompt ci-dessous.\n\n";

  analysis.prompts.forEach((p, index) => {
    instructions += `### Image ${index + 1}: ${p.style.toUpperCase()}\n`;
    instructions += "```json\n";
    instructions += JSON.stringify(
      {
        params: {
          model: "soul_2",
          prompt: p.prompt,
          aspect_ratio: "9:16",
          count: 1,
        },
      },
      null,
      2
    );
    instructions += "\n```\n";
  });

  return instructions;
}

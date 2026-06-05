import { InstagramImageAnalysis } from "./carousel-automation";

export interface HiggsFieldGenerationResult {
  jobId: string;
  status: "processing" | "completed" | "failed";
  imageUrl?: string;
  error?: string;
  timestamp: string;
}

export interface VariationRequest {
  previousImageJobId: string;
  variationPrompt: string;
  keepIdentity: boolean;
}

/**
 * Format du prompt pour Higgsfield en 3 étapes:
 * 1. Upload images (tête + corp)
 * 2. Colle le prompt complet
 * 3. Génère avec les paramètres
 */
export function formatHiggsFieldInstructions(
  analysis: InstagramImageAnalysis,
  headImageUrl: string,
  bodyImageUrl: string
): string {
  const fullPrompt = `Use the provided images strictly as a reference for the same model (identity, face, body proportions, hair color). The things you need to change are listed here (clothes, place etc) keep the same smile:

${JSON.stringify(analysis, null, 2)}`;

  return `## 🎨 Higgsfield Generation Instructions

### Step 1: Upload Reference Images
- Upload 1st image: HEAD photo (just the face)
- Upload 2nd image: BODY photo (without the head, full body)

### Step 2: Paste This Prompt in Higgsfield Chat
\`\`\`
${fullPrompt}
\`\`\`

### Step 3: Generate with These Settings
- Model: nano_banana_pro
- Aspect Ratio: 9:16
- Quality: 2k
- Count: 1

### Image URLs for reference:
- Head: ${headImageUrl}
- Body: ${bodyImageUrl}`;
}

/**
 * Formatte un prompt de variation simple pour Higgsfield
 * Utilisé après la première génération pour les variations
 */
export function formatVariationPrompt(
  generatedImageUrl: string,
  variationPrompt: string,
  keepIdentity: boolean = true
): string {
  return `${keepIdentity ? "Keep the same person. " : ""}${variationPrompt}

Reference image: ${generatedImageUrl}

Settings: nano_banana_pro, 9:16, quality 2k`;
}

/**
 * Génère les instructions pour un carousel complet
 */
export interface CarouselVariationConfig {
  variation: string;
  description: string;
}

export function generateCarouselPlan(
  variations: CarouselVariationConfig[]
): string {
  let plan = `## 📸 Carousel Generation Plan

**Total images needed:** ${variations.length + 1} (1 original + ${variations.length} variations)

### Original Image
1. Use the previous generation result

### Variations to Generate:
`;

  variations.forEach((v, index) => {
    plan += `${index + 1}. **${v.description}**\n   Prompt: "${v.variation}"\n`;
  });

  plan += `\n### How to Generate Each Variation:
1. In Higgsfield, upload the previous generated image
2. Add the variation prompt (e.g., "make her smile")
3. Generate with same settings (nano_banana_pro, 9:16, 2k)
4. Save the result`;

  return plan;
}

/**
 * Structure pour tracker une génération de carousel
 */
export interface CarouselSession {
  sessionId: string;
  instagramImageAnalysis: InstagramImageAnalysis;
  referenceImages: {
    headUrl: string;
    bodyUrl: string;
  };
  generations: {
    original?: HiggsFieldGenerationResult;
    variations: Record<string, HiggsFieldGenerationResult>;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Crée une nouvelle session de carousel
 */
export function createCarouselSession(
  analysis: InstagramImageAnalysis,
  headUrl: string,
  bodyUrl: string
): CarouselSession {
  return {
    sessionId: `carousel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    instagramImageAnalysis: analysis,
    referenceImages: {
      headUrl,
      bodyUrl,
    },
    generations: {
      variations: {},
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Génère le JSON complet pour transférer les données à Higgsfield
 */
export function exportCarouselConfig(
  session: CarouselSession,
  variations: CarouselVariationConfig[] = []
): Record<string, any> {
  return {
    sessionId: session.sessionId,
    analysis: session.instagramImageAnalysis,
    referenceImages: session.referenceImages,
    originalImageGeneration: {
      model: "nano_banana_pro",
      aspectRatio: "9:16",
      quality: "2k",
      prompt: `Use the provided images strictly as a reference for the same model (identity, face, body proportions, hair color). The things you need to change are listed here (clothes, place etc) keep the same smile.\n\n${JSON.stringify(session.instagramImageAnalysis, null, 2)}`,
    },
    variations: variations.map((v) => ({
      name: v.description,
      prompt: v.variation,
      model: "nano_banana_pro",
      aspectRatio: "9:16",
      quality: "2k",
    })),
    instructions: {
      step1: "Upload head and body reference images to Higgsfield",
      step2: "Paste the originalImageGeneration.prompt",
      step3: "Generate the original image",
      step4: "For each variation, upload the previous generated image and paste the variation prompt",
    },
  };
}

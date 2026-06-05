import { NextRequest } from "next/server";
import {
  analyzeImageAndGeneratePrompts,
  buildHiggsFieldPayload,
  createHiggsFieldInstructions,
  formatPromptsForDisplay,
} from "@/lib/image-automation";

export const runtime = "edge";

interface ImageAutomationRequest {
  imageUrl: string;
  styles?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body: ImageAutomationRequest = await req.json();
    const {
      imageUrl,
      styles = ["minimal", "professional", "creative", "luxury"],
    } = body;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "imageUrl manquante" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "Clé API Anthropic manquante. Configure ANTHROPIC_API_KEY dans .env.local",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const analysis = await analyzeImageAndGeneratePrompts(
      imageUrl,
      styles,
      apiKey
    );

    const higgsFieldPayload = buildHiggsFieldPayload(analysis);
    const instructions = createHiggsFieldInstructions(analysis);
    const formattedPrompts = formatPromptsForDisplay(analysis);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Analyse et génération de prompts réussie",
        data: {
          imageUrl,
          analysis: analysis.analysis,
          prompts: analysis.prompts,
          formattedDisplay: formattedPrompts,
          higgsFieldPayload,
          instructions,
          nextStep:
            "Copie chaque prompt et utilise-le avec mcp__Higgsfield__generate_image",
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

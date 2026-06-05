import { NextRequest } from "next/server";
import {
  analyzeInstagramImage,
  buildHiggsFieldPrompt,
} from "@/lib/carousel-automation";
import {
  formatHiggsFieldInstructions,
  createCarouselSession,
  exportCarouselConfig,
} from "@/lib/higgsfield-orchestrator";

export const runtime = "edge";

interface PrepareRequest {
  instagramImageUrl: string;
  headImageUrl: string;
  bodyImageUrl: string;
  variations?: Array<{ variation: string; description: string }>;
}

export async function POST(req: NextRequest) {
  try {
    const body: PrepareRequest = await req.json();
    const {
      instagramImageUrl,
      headImageUrl,
      bodyImageUrl,
      variations = [],
    } = body;

    if (!instagramImageUrl || !headImageUrl || !bodyImageUrl) {
      return new Response(
        JSON.stringify({
          error: "instagramImageUrl, headImageUrl, and bodyImageUrl are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Analyser l'image Instagram
    console.log("📸 Analyzing Instagram image...");
    const analysis = await analyzeInstagramImage(instagramImageUrl, apiKey);

    // Créer une session de carousel
    const session = createCarouselSession(analysis, headImageUrl, bodyImageUrl);

    // Formater les instructions pour Higgsfield
    const higgsFieldInstructions = formatHiggsFieldInstructions(
      analysis,
      headImageUrl,
      bodyImageUrl
    );

    // Exporter la configuration complète
    const carouselConfig = exportCarouselConfig(session, variations);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Carousel session prepared successfully",
        data: {
          sessionId: session.sessionId,
          analysis,
          higgsFieldInstructions,
          carouselConfig,
          referenceImages: {
            head: headImageUrl,
            body: bodyImageUrl,
          },
          variationsCount: variations.length,
          nextSteps: [
            "1. Copy the higgsFieldInstructions above",
            "2. Go to Higgsfield",
            "3. Follow the 3-step instructions",
            "4. Once you have the generated image, use /api/carousel/variation to create variations",
          ],
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Carousel prepare error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

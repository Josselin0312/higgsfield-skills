import { NextRequest } from "next/server";
import {
  analyzeInstagramImage,
  prepareHiggsFieldPayload,
  DEFAULT_CAROUSEL_CONFIG,
} from "@/lib/carousel-automation";

export const runtime = "edge";

interface AnalyzeRequest {
  imageUrl?: string;
  imageBase64?: string;
  headImageRef?: string;
  bodyImageRef?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequest = await req.json();
    const { imageUrl, imageBase64, headImageRef, bodyImageRef } = body;

    if (!imageUrl && !imageBase64) {
      return new Response(
        JSON.stringify({
          error: "Either imageUrl or imageBase64 is required",
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
        JSON.stringify({
          error: "ANTHROPIC_API_KEY not configured",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const imageSource = imageUrl || imageBase64!;
    const analysis = await analyzeInstagramImage(imageSource, apiKey);

    let higgsFieldPayload = null;
    if (headImageRef && bodyImageRef) {
      higgsFieldPayload = await prepareHiggsFieldPayload(
        analysis,
        headImageRef,
        bodyImageRef,
        DEFAULT_CAROUSEL_CONFIG
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Image analyzed successfully",
        data: {
          analysis,
          higgsFieldPayload,
          nextSteps: higgsFieldPayload
            ? [
                "1. Upload head image to Higgsfield",
                "2. Upload body image to Higgsfield",
                "3. Paste the prompt provided above",
                "4. Generate with nano_banana_pro, 9:16, quality 2k",
                "5. Once generated, use /api/carousel/generate-variation for variations",
              ]
            : [
                "1. Provide headImageRef and bodyImageRef to get Higgsfield payload",
                "2. Or use this analysis to manually set up Higgsfield",
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
    console.error("Carousel analyze error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

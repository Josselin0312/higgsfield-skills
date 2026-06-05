import { NextRequest } from "next/server";
import { formatVariationPrompt } from "@/lib/higgsfield-orchestrator";

export const runtime = "edge";

interface VariationRequest {
  previousGeneratedImageUrl: string;
  variationPrompt: string;
  description: string;
  keepIdentity?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body: VariationRequest = await req.json();
    const {
      previousGeneratedImageUrl,
      variationPrompt,
      description,
      keepIdentity = true,
    } = body;

    if (!previousGeneratedImageUrl || !variationPrompt) {
      return new Response(
        JSON.stringify({
          error: "previousGeneratedImageUrl and variationPrompt are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Formater le prompt de variation
    const formattedPrompt = formatVariationPrompt(
      previousGeneratedImageUrl,
      variationPrompt,
      keepIdentity
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Variation prompt prepared",
        data: {
          variationDescription: description,
          variationPrompt,
          formattedPromptForHiggsfield: formattedPrompt,
          instructions: [
            "1. In Higgsfield, upload the previously generated image",
            "2. Clear the chat (remove old text and images)",
            "3. Paste this prompt:",
            `\`\`\`\n${formattedPrompt}\n\`\`\``,
            "4. Generate with nano_banana_pro, 9:16, 2k",
            "5. Save the result and use for next variation if needed",
          ],
          nextStep:
            "Copy the formattedPromptForHiggsfield and paste in Higgsfield",
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
    console.error("Carousel variation error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

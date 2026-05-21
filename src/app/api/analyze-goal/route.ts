import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

const SCENE_PROMPT = `Analyse this image in exhaustive JSON detail. Don't exceed 6000 characters. Detail the exact identitique situation, the outfit, the facial expressions, the clothes, the accessories. Don't describe the model detail such as the hair color, the eyes color and dont describe the copywriting on the photo`;

const REPRO_PREFIX = `Reproduce this exact scene with the provided reference person (body + face from reference images). Keep identical: composition, lighting, pose, setting, outfit, styling, mood and atmosphere. Do not change anything about the scene — only replace the person with the reference. Scene JSON description:\n\n`;

export async function POST(req: NextRequest) {
  try {
    const { goalImage } = await req.json();

    if (!goalImage) {
      return NextResponse.json({ error: "Aucune image Goal fournie" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY manquante dans .env.local" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const [header, data] = goalImage.split(",");
    const mediaType = (header.match(/:(.*?);/)?.[1] ?? "image/jpeg") as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data },
            },
            { type: "text", text: SCENE_PROMPT },
          ],
        },
      ],
    });

    const analysis =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ prompt: REPRO_PREFIX + analysis });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[analyze-goal]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

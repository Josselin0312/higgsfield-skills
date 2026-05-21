import { NextRequest, NextResponse } from "next/server";
import { HiggsfieldClient } from "@higgsfield/client";
import { createHiggsfieldClient } from "@higgsfield/client/v2";

export const runtime = "nodejs";
export const maxDuration = 300;

const ASPECT_RATIO: Record<string, string> = {
  "1024x1024": "1:1",
  "1080x1350": "4:5",
  "1080x1920": "9:16",
  "1920x1080": "16:9",
  "1200x800": "3:2",
  "800x1200": "2:3",
};

async function uploadBase64(base64: string): Promise<string> {
  const v1 = new HiggsfieldClient({
    apiKey: process.env.HIGGSFIELD_KEY_ID!,
    apiSecret: process.env.HIGGSFIELD_KEY_SECRET!,
  });
  const [header, data] = base64.split(",");
  const format = header.includes("png") ? "png" : header.includes("webp") ? "webp" : "jpeg";
  const buffer = Buffer.from(data, "base64");
  return v1.uploadImage(buffer, format as "jpeg" | "png" | "webp");
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, resolution, count, imageInput = [], imageReproduction = [] } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt requis" }, { status: 400 });
    }

    const client = createHiggsfieldClient({
      credentials: `${process.env.HIGGSFIELD_KEY_ID}:${process.env.HIGGSFIELD_KEY_SECRET}`,
      maxPollTime: 240000,
      pollInterval: 3000,
    });

    const aspect_ratio = ASPECT_RATIO[resolution] ?? "1:1";

    // Upload all base64 reference images to get hosted URLs
    const allBase64Refs = [...imageInput, ...imageReproduction].filter(Boolean);
    const uploadedUrls = await Promise.all(
      allBase64Refs.map((img: string) =>
        img.startsWith("data:") ? uploadBase64(img) : Promise.resolve(img)
      )
    );

    const input_images = uploadedUrls.map((url) => ({
      type: "image_url" as const,
      image_url: url,
    }));

    // Run `count` generations in parallel (capped at 8 for performance)
    const actualCount = Math.min(count, 8);
    const results = await Promise.allSettled(
      Array.from({ length: actualCount }, async () => {
        const body: Record<string, unknown> = { prompt, aspect_ratio };
        if (input_images.length > 0) body.input_images = input_images;

        const response = await client.subscribe("nano-banana-pro/text-to-image", {
          input: body,
          withPolling: true,
        });

        if (response.status === "completed") {
          return response.images?.[0]?.url ?? null;
        }
        return null;
      })
    );

    const images = results
      .filter((r): r is PromiseFulfilledResult<string | null> => r.status === "fulfilled")
      .map((r) => r.value)
      .filter((u): u is string => !!u);

    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r) => String(r.reason));

    return NextResponse.json({ images, errors: errors.length ? errors : undefined });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[image-generate]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

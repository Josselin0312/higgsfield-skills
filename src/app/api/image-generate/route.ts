import { NextRequest, NextResponse } from "next/server";
import { createHiggsfieldClient } from "@higgsfield/client/v2";

export const runtime = "nodejs";
export const maxDuration = 300;

const ASPECT_RATIO: Record<string, string> = {
  "1024x1024": "1:1",
  "1080x1350": "4:5",
  "1080x1920": "9:16",
  "1920x1080": "16:9",
  "1200x800":  "3:2",
  "800x1200":  "2:3",
};

const RESOLUTION_MAP: Record<string, string> = {
  "1K": "1k",
  "2K": "2k",
  "4K": "4k",
};

function makeClient() {
  return createHiggsfieldClient({
    apiKey: process.env.HIGGSFIELD_KEY_ID ?? "",
    apiSecret: process.env.HIGGSFIELD_KEY_SECRET ?? "",
    timeout: 120000,
    maxPollTime: 240000,
    pollInterval: 4000,
  });
}

function extractId(url: string): string {
  return url.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, resolution, quality, count, inputImages = [] } = await req.json();

    if (!prompt?.trim()) return NextResponse.json({ error: "Prompt requis" }, { status: 400 });

    const aspect_ratio = ASPECT_RATIO[resolution] ?? "1:1";
    const res_param = RESOLUTION_MAP[quality] ?? "1k";
    const actualCount = Math.min(Math.max(1, count), 8);
    const client = makeClient();

    // nano_banana_2 is the actual model behind "NanoBananaPRO"
    // V2 API format (from real generation history): input_images:[{id,type:"media_input",url}]
    const input: Record<string, unknown> = {
      prompt,
      aspect_ratio,
      resolution: res_param,
      batch_size: 1,
    };

    if (inputImages.length > 0) {
      input.input_images = inputImages.map((img: { id?: string; url: string }) => ({
        id: img.id ?? extractId(img.url),
        type: "media_input",
        url: img.url,
      }));
      console.log("[image-generate] with", inputImages.length, "image(s):", JSON.stringify(input.input_images[0]));
    }

    console.log("[image-generate] endpoint: v1/text2image/nano-banana-2");

    const generateOne = async (): Promise<string | null> => {
      const result = await client.subscribe("v1/text2image/nano-banana-2", { input, withPolling: true });
      const r = result as Record<string, unknown>;
      const results = r.results as Record<string, string> | undefined;
      return results?.rawUrl ?? (r.rawUrl as string) ?? null;
    };

    const firstUrl = await generateOne();
    const images: string[] = firstUrl ? [firstUrl] : [];

    if (actualCount > 1) {
      const rest = await Promise.allSettled(
        Array.from({ length: actualCount - 1 }, generateOne)
      );
      rest.forEach((r) => { if (r.status === "fulfilled" && r.value) images.push(r.value); });
    }

    if (images.length === 0) {
      return NextResponse.json({ error: "Aucune image générée" }, { status: 500 });
    }

    return NextResponse.json({ images });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[image-generate]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

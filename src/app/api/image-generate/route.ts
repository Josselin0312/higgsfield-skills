import { NextRequest, NextResponse } from "next/server";
import { HiggsfieldClient } from "@higgsfield/client";

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
  return new HiggsfieldClient({
    apiKey: process.env.HIGGSFIELD_KEY_ID ?? "",
    apiSecret: process.env.HIGGSFIELD_KEY_SECRET ?? "",
    timeout: 120000,
    maxPollTime: 240000,
    pollInterval: 4000,
  });
}

async function uploadImage(client: HiggsfieldClient, base64: string): Promise<string> {
  const [header, data] = base64.split(",");
  const contentType = (header.match(/:(.*?);/)?.[1] ?? "image/jpeg") as "image/jpeg" | "image/png" | "image/webp";
  const format = contentType.split("/")[1] as "jpeg" | "png" | "webp";
  const buffer = Buffer.from(data, "base64");
  return client.uploadImage(buffer, format);
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, resolution, quality, count, imageInput = [], imageReproduction = [] } = await req.json();

    if (!prompt?.trim()) return NextResponse.json({ error: "Prompt requis" }, { status: 400 });

    const aspect_ratio = ASPECT_RATIO[resolution] ?? "1:1";
    const res_param = RESOLUTION_MAP[quality] ?? "1k";
    const actualCount = Math.min(Math.max(1, count), 8);
    const client = makeClient();

    // Upload reference images
    const refImages: string[] = imageInput.length > 0 ? imageInput : imageReproduction;
    let input_images: Array<{ type: string; image_url: string }> = [];

    if (refImages.length > 0) {
      console.log("[image-generate] uploading", refImages.length, "image(s)...");
      try {
        const urls = await Promise.all(
          refImages.map((img: string) =>
            img.startsWith("data:") ? uploadImage(client, img) : Promise.resolve(img)
          )
        );
        input_images = urls.map((url) => {
        // Extract UUID from CDN URL filename: .../USER/UUID.ext
        const id = url.split("/").pop()?.replace(/\.[^.]+$/, "") ?? url;
        return { id, type: "media_input", url };
      });
        console.log("[image-generate] uploaded:", urls.map(u => u.slice(0, 60)));
      } catch (uploadErr) {
        console.error("[image-generate] upload failed, continuing without ref images:", uploadErr);
      }
    }

    // Try with input_images if we have them, fall back to empty for text-to-image
    const params: Record<string, unknown> = {
      prompt,
      aspect_ratio,
      resolution: res_param,
    };
    if (input_images.length > 0) {
      params.input_images = input_images;
    }

    console.log("[image-generate] generating, aspect:", aspect_ratio, "refs:", input_images.length);

    const generateOne = async (): Promise<string | null> => {
      const jobSet = await client.generate("/v1/text2image/nano-banana", params, { withPolling: true });
      const job = jobSet.jobs?.[0];
      return job?.results?.raw?.url ?? null;
    };

    const firstUrl = await generateOne();
    const images: string[] = firstUrl ? [firstUrl] : [];

    if (actualCount > 1) {
      const rest = await Promise.allSettled(
        Array.from({ length: actualCount - 1 }, generateOne)
      );
      rest.forEach((r) => { if (r.status === "fulfilled" && r.value) images.push(r.value); });
    }

    return NextResponse.json({ images });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[image-generate]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

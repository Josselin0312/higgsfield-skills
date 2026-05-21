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

export async function POST(req: NextRequest) {
  try {
    const { prompt, resolution, quality, count, inputImages = [] } = await req.json();

    if (!prompt?.trim()) return NextResponse.json({ error: "Prompt requis" }, { status: 400 });

    const aspect_ratio = ASPECT_RATIO[resolution] ?? "1:1";
    const res_param = RESOLUTION_MAP[quality] ?? "1k";
    const actualCount = Math.min(Math.max(1, count), 8);
    const client = makeClient();

    const params: Record<string, unknown> = {
      prompt,
      aspect_ratio,
      resolution: res_param,
    };

    if (inputImages.length > 0) {
      params.input_images = inputImages;
      console.log("[image-generate] using", inputImages.length, "pre-uploaded image(s):", JSON.stringify(inputImages[0]));
    }

    console.log("[image-generate] generating, aspect:", aspect_ratio, "refs:", inputImages.length);

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

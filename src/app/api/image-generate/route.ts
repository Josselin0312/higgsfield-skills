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

// Extract UUID from CDN URL filename: .../user_XXX/UUID.ext
function extractId(url: string): string {
  return url.split("/").pop()?.replace(/\.[^.]+$/, "") ?? crypto.randomUUID();
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, resolution, quality, count, inputImages = [] } = await req.json();

    if (!prompt?.trim()) return NextResponse.json({ error: "Prompt requis" }, { status: 400 });

    const aspect_ratio = ASPECT_RATIO[resolution] ?? "1:1";
    const res_param = RESOLUTION_MAP[quality] ?? "1k";
    const actualCount = Math.min(Math.max(1, count), 8);
    const client = makeClient();

    // Build input — nano_banana_pro uses medias array (V2 API format)
    const input: Record<string, unknown> = { prompt, aspect_ratio, resolution: res_param };

    if (inputImages.length > 0) {
      // inputImages from frontend: [{id, type:"media_input", url}]
      // nano_banana_pro expects: medias:[{role:"image", data:{id,type,url}}]
      input.medias = inputImages.map((img: { id?: string; url: string; type?: string }) => ({
        role: "image",
        data: {
          id: img.id ?? extractId(img.url),
          type: "media_input",
          url: img.url,
        },
      }));
      console.log("[image-generate] nano_banana_pro with", inputImages.length, "image(s)");
    } else {
      console.log("[image-generate] nano_banana_pro text-only");
    }

    const generateOne = async (): Promise<string | null> => {
      const result = await client.subscribe("/nano_banana_pro", { input, withPolling: true });
      // V2 response: {status, results:{rawUrl, minUrl}} or {rawUrl} depending on polling
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

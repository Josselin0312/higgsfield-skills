import { NextRequest, NextResponse } from "next/server";
import { submitGeneration } from "@/lib/higgsfield";

export const runtime = "nodejs";
export const maxDuration = 30;

const ASPECT_RATIO: Record<string, string> = {
  "1024x1024": "1:1",
  "1080x1350": "4:5",
  "1080x1920": "9:16",
  "1920x1080": "16:9",
  "1200x800":  "3:2",
  "800x1200":  "2:3",
};

const MODEL_MAP: Record<string, string> = {
  "NanobananaPRO":    "nano_banana_pro",
  "Soul 2":           "soul_2",
  "Marketing Studio": "marketing_studio_image",
};

async function handleGenerate(
  prompt: string,
  model: string,
  resolution: string,
  quality: string,
  count: number,
  inputImages: Array<{ url: string }>
) {
  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt requis" }, { status: 400 });
  }

  const params = {
    model: MODEL_MAP[model] ?? "nano_banana_pro",
    prompt: prompt.trim(),
    aspect_ratio: ASPECT_RATIO[resolution] ?? "1:1",
    resolution: quality === "4K" ? "4k" : quality === "2K" ? "2k" : "1k",
    ...(inputImages.length > 0 ? {
      medias: inputImages.map(img => ({ role: "image", value: img.url })),
    } : {}),
  };

  const actualCount = Math.min(Math.max(1, count ?? 1), 4);
  const settled = await Promise.allSettled(
    Array.from({ length: actualCount }, () => submitGeneration(params))
  );

  const jobIds = settled
    .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
    .map(r => r.value);

  if (jobIds.length === 0) {
    const err = settled.find(r => r.status === "rejected") as PromiseRejectedResult | undefined;
    return NextResponse.json(
      { error: err?.reason?.message ?? "Soumission échouée" },
      { status: 500 }
    );
  }

  return NextResponse.json({ jobIds });
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, model = "NanobananaPRO", resolution, quality, count, inputImages = [] } = await req.json() as {
      prompt: string;
      model?: string;
      resolution: string;
      quality: string;
      count: number;
      inputImages?: Array<{ url: string }>;
    };
    return handleGenerate(prompt, model, resolution, quality, count, inputImages);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[generate-image POST]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const bodyParam = req.nextUrl.searchParams.get("body");
    if (!bodyParam) return NextResponse.json({ error: "body manquant" }, { status: 400 });
    const { prompt, model = "NanobananaPRO", resolution, quality, count, inputImages = [] } = JSON.parse(bodyParam) as {
      prompt: string;
      model?: string;
      resolution: string;
      quality: string;
      count: number;
      inputImages?: Array<{ url: string }>;
    };
    return handleGenerate(prompt, model, resolution, quality, count, inputImages);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[generate-image GET]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

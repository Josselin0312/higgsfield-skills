import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

interface GenParams {
  model: string;
  prompt: string;
  aspect_ratio: string;
  quality: string;
  medias?: Array<{ role: string; value: string }>;
}

async function submitViaAnthropicMCP(params: GenParams): Promise<string> {
  const response = await (client.beta.messages as Record<string, unknown> & {
    create: (opts: unknown) => Promise<{ content: Array<{ type: string; text?: string }> }>;
  }).create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    mcp_servers: [{
      type: "url",
      url: "https://mcp.higgsfield.ai/mcp",
      name: "higgsfield",
      authorization_token: `Key ${process.env.HIGGSFIELD_KEY_ID}:${process.env.HIGGSFIELD_KEY_SECRET}`,
    }],
    system: 'Call generate_image immediately with the provided params. After the tool executes, output ONLY valid JSON: {"job_id":"<id from result>"}. No other text.',
    messages: [{
      role: "user",
      content: `Generate image with these params: ${JSON.stringify(params)}`,
    }],
    betas: ["mcp-client-2025-04-04"],
  });

  console.log("[generate-image] response content:", JSON.stringify(response.content, null, 2));

  const text = (response.content ?? [])
    .filter(b => b.type === "text")
    .map(b => b.text ?? "")
    .join("")
    .trim();

  try {
    const parsed = JSON.parse(text) as { job_id?: string };
    if (parsed.job_id) return parsed.job_id;
  } catch { /* not JSON */ }

  const m = text.match(/"?job_id"?\s*:?\s*"([a-zA-Z0-9_\-]+)"/);
  if (m?.[1]) return m[1];

  throw new Error(`Pas de job_id dans la réponse Anthropic: ${text.slice(0, 300)}`);
}

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

  const higgsModel = MODEL_MAP[model] ?? "nano_banana_pro";
  const params: GenParams = {
    model: higgsModel,
    prompt: prompt.trim(),
    aspect_ratio: ASPECT_RATIO[resolution] ?? "1:1",
    quality: quality === "4K" ? "4k" : quality === "2K" ? "2k" : "1k",
    ...(inputImages.length > 0 ? {
      medias: inputImages.map(img => ({ role: "image", value: img.url })),
    } : {}),
  };

  const actualCount = Math.min(Math.max(1, count ?? 1), 4);
  const settled = await Promise.allSettled(
    Array.from({ length: actualCount }, () => submitViaAnthropicMCP(params))
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

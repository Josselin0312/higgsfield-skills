import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const BASE = "https://platform.higgsfield.ai";

function auth() {
  return `Key ${process.env.HIGGSFIELD_KEY_ID}:${process.env.HIGGSFIELD_KEY_SECRET}`;
}

async function tryPost(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data: unknown;
  try { data = await res.json(); } catch { data = await res.text(); }
  return { status: res.status, data };
}

export async function GET() {
  const prompt = "a red apple";
  const base = { prompt, aspect_ratio: "1:1", resolution: "1k" };
  const withModel = { ...base, model: "nano_banana_pro" };

  const results = await Promise.all([
    tryPost("/nano_banana_pro",              base),
    tryPost("/nano_banana_2",               base),
    tryPost("/nano-banana-pro",             base),
    tryPost("/nano-banana-pro/text-to-image", base),
    tryPost("/nano-banana/pro/text-to-image", base),
    tryPost("/generate",                    withModel),
    tryPost("/generate/image",              withModel),
    tryPost("/v1/generate",                 withModel),
    tryPost("/v1/images/generate",          withModel),
  ]);

  return NextResponse.json({
    "/nano_banana_pro":                results[0],
    "/nano_banana_2":                  results[1],
    "/nano-banana-pro":                results[2],
    "/nano-banana-pro/text-to-image":  results[3],
    "/nano-banana/pro/text-to-image":  results[4],
    "/generate (model in body)":       results[5],
    "/generate/image (model in body)": results[6],
    "/v1/generate (model in body)":    results[7],
    "/v1/images/generate (model in body)": results[8],
  });
}

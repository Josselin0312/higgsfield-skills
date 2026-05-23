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

  // Test 1: third-party model path (known to work per SDK docs)
  const thirdParty = await tryPost("/bytedance/seedream/v4/text-to-image", {
    prompt, aspect_ratio: "1:1",
  });

  // Test 2: fnf.higgsfield.ai with Key auth
  async function tryFnf(path: string, body: unknown) {
    const res = await fetch(`https://fnf.higgsfield.ai${path}`, {
      method: "POST",
      headers: { Authorization: auth(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    let data: unknown;
    try { data = await res.json(); } catch { data = await res.text(); }
    return { status: res.status, data };
  }

  const fnfResults = await Promise.all([
    tryFnf("/generate/image", withModel),
    tryFnf("/v1/images/generate", withModel),
    tryFnf("/generate", withModel),
  ]);

  return NextResponse.json({
    "platform — /bytedance/seedream/v4/text-to-image": thirdParty,
    "fnf — /generate/image": fnfResults[0],
    "fnf — /v1/images/generate": fnfResults[1],
    "fnf — /generate": fnfResults[2],
  });
}

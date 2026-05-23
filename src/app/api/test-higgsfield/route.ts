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

  // Get Clerk JWT for fnf.higgsfield.ai
  const clerkClient = process.env.HIGGSFIELD_CLERK_CLIENT ?? "";
  const sessionId   = process.env.HIGGSFIELD_SESSION_ID ?? "";

  let jwt = "";
  let jwtError = "";
  try {
    const clerkRes = await fetch(
      `https://clerk.higgsfield.ai/v1/client/sessions/${sessionId}/tokens`,
      {
        method: "POST",
        headers: {
          "Cookie": `__client=${clerkClient}`,
          "Origin": "https://higgsfield.ai",
          "Referer": "https://higgsfield.ai/",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    const clerkData = await clerkRes.json() as Record<string, unknown>;
    jwt = (clerkData.jwt as string) ?? "";
    if (!jwt) jwtError = JSON.stringify(clerkData).slice(0, 200);
  } catch (e) {
    jwtError = String(e);
  }

  if (!jwt) return NextResponse.json({ error: "JWT failed", detail: jwtError });

  async function tryFnfJwt(path: string, body: unknown) {
    const res = await fetch(`https://fnf.higgsfield.ai${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
        "Origin": "https://higgsfield.ai",
        "Referer": "https://higgsfield.ai/",
      },
      body: JSON.stringify(body),
    });
    let data: unknown;
    try { data = await res.json(); } catch { data = await res.text(); }
    return { status: res.status, data };
  }

  const fnfResults = await Promise.all([
    tryFnfJwt("/generate/image", withModel),
    tryFnfJwt("/v1/images/generate", withModel),
    tryFnfJwt("/v2/generate/image", withModel),
  ]);

  return NextResponse.json({
    "fnf+JWT — /generate/image":       fnfResults[0],
    "fnf+JWT — /v1/images/generate":   fnfResults[1],
    "fnf+JWT — /v2/generate/image":    fnfResults[2],
  });
}

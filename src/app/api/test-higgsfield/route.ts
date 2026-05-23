import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const BASE = "https://platform.higgsfield.ai";

function keyAuth() {
  return `Key ${process.env.HIGGSFIELD_KEY_ID}:${process.env.HIGGSFIELD_KEY_SECRET}`;
}

async function tryPost(url: string, body: unknown, auth: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data: unknown;
  try { data = await res.json(); } catch { data = await res.text(); }
  return { status: res.status, data };
}

async function getClerkJwt(): Promise<string> {
  const res = await fetch(
    `https://clerk.higgsfield.ai/v1/client/sessions/${process.env.HIGGSFIELD_SESSION_ID}/tokens`,
    {
      method: "POST",
      headers: {
        "Cookie": `__client=${process.env.HIGGSFIELD_CLERK_CLIENT}`,
        "Origin": "https://higgsfield.ai",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  const data = await res.json() as Record<string, unknown>;
  return (data.jwt as string) ?? "";
}

export async function GET() {
  const jwt = await getClerkJwt();
  const bearerJwt = `Bearer ${jwt}`;
  const keyHeader = keyAuth();
  const body = { prompt: "a red apple", aspect_ratio: "1:1", resolution: "1k" };

  const results = await Promise.all([
    // Balance endpoints — POST since GET returned 405
    tryPost(`${BASE}/balance`, {}, keyHeader),
    tryPost(`${BASE}/v1/balance`, {}, keyHeader),
    tryPost(`${BASE}/credits`, {}, keyHeader),
    // fnf.higgsfield.ai with JWT — try correct nano_banana paths
    tryPost("https://fnf.higgsfield.ai/nano_banana_pro", body, bearerJwt),
    tryPost("https://fnf.higgsfield.ai/google/nano_banana_pro", body, bearerJwt),
    tryPost("https://fnf.higgsfield.ai/reve/text-to-image", body, bearerJwt),
    // platform with JWT (test different paths)
    tryPost(`${BASE}/reve/text-to-image`, body, bearerJwt),
    tryPost(`${BASE}/nano_banana_pro`, body, bearerJwt),
  ]);

  return NextResponse.json({
    "jwt_ok": !!jwt,
    "POST platform/balance (key)":            results[0],
    "POST platform/v1/balance (key)":          results[1],
    "POST platform/credits (key)":             results[2],
    "POST fnf/nano_banana_pro (jwt)":          results[3],
    "POST fnf/google/nano_banana_pro (jwt)":   results[4],
    "POST fnf/reve/text-to-image (jwt)":       results[5],
    "POST platform/reve/text-to-image (jwt)":  results[6],
    "POST platform/nano_banana_pro (jwt)":     results[7],
  });
}

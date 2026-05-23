import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const BASE = "https://platform.higgsfield.ai";
const id  = () => process.env.HIGGSFIELD_KEY_ID  ?? "";
const sec = () => process.env.HIGGSFIELD_KEY_SECRET ?? "";

async function tryPost(url: string, body: unknown, headers: Record<string, string>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  let data: unknown;
  try { data = await res.json(); } catch { data = await res.text(); }
  return { status: res.status, data };
}

export async function GET() {
  const body = { prompt: "a red apple", aspect_ratio: "1:1", resolution: "1k" };

  // SDK v1 uses custom headers: hf-api-key + hf-secret
  const hfHeaders = { "hf-api-key": id(), "hf-secret": sec() };
  // SDK v2 uses Authorization: Key id:secret
  const keyHeaders = { "Authorization": `Key ${id()}:${sec()}` };

  const results = await Promise.all([
    tryPost(`${BASE}/nano_banana_pro`,              body, hfHeaders),
    tryPost(`${BASE}/nano_banana_2`,                body, hfHeaders),
    tryPost(`${BASE}/reve/text-to-image`,           body, hfHeaders),
    tryPost(`${BASE}/google/nano_banana_pro`,       body, hfHeaders),
    tryPost(`${BASE}/nano_banana_pro`,              body, keyHeaders),
    // Also try v1 endpoint paths with both auth formats
    tryPost(`${BASE}/v1/text2image/nano_banana_pro`, body, hfHeaders),
    tryPost(`${BASE}/v1/text2image/nano_banana_pro`, body, keyHeaders),
    // Check requests status endpoint to confirm polling still works
    { status: "skipped", data: "placeholder" },
  ]);

  return NextResponse.json({
    "hf-headers /nano_banana_pro":           results[0],
    "hf-headers /nano_banana_2":             results[1],
    "hf-headers /reve/text-to-image":        results[2],
    "hf-headers /google/nano_banana_pro":    results[3],
    "Key-auth  /nano_banana_pro (baseline)": results[4],
    "hf-headers /v1/text2image/nano_banana_pro": results[5],
    "Key-auth  /v1/text2image/nano_banana_pro":  results[6],
  });
}

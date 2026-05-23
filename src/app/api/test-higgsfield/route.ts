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

async function tryMcp(authHeader: string, extraAccept?: string) {
  const accept = extraAccept ?? "application/json, text/event-stream";
  const res = await fetch("https://mcp.higgsfield.ai/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader,
      "Accept": accept,
    },
    body: JSON.stringify({
      jsonrpc: "2.0", method: "tools/call", id: 1,
      params: {
        name: "generate_image",
        arguments: { params: { model: "nano_banana_pro", prompt: "a red apple", aspect_ratio: "1:1", resolution: "1k", get_cost: true } }
      }
    }),
  });
  const raw = await res.text();
  let data: unknown;
  try { data = JSON.parse(raw); } catch { data = raw.slice(0, 500); }
  return { status: res.status, data };
}

export async function GET() {
  const prompt = "a red apple";
  const body = { prompt, aspect_ratio: "1:1", resolution: "1k" };

  // Test platform.higgsfield.ai REST paths
  const platformResults = await Promise.all([
    tryPost("/nano_banana_pro", body),
    tryPost("/nano_banana_2", body),
    tryPost("/v1/nano_banana_pro", body),
    tryPost("/v1/image/generate", { ...body, model: "nano_banana_pro" }),
    tryPost("/v1/generate", { ...body, model: "nano_banana_pro" }),
    tryPost("/api/v1/generate", { ...body, model: "nano_banana_pro" }),
    tryPost("/generate", { ...body, model: "nano_banana_pro" }),
    tryPost("/images/generate", { ...body, model: "nano_banana_pro" }),
  ]);

  const bearer = `Bearer ${process.env.HIGGSFIELD_KEY_ID}:${process.env.HIGGSFIELD_KEY_SECRET}`;

  // Test provider-prefixed paths (pattern: {provider}/{model}/{task})
  const providerResults = await Promise.all([
    tryPost("/google/nano_banana_pro", body),
    tryPost("/google/nano_banana_pro/text-to-image", body),
    tryPost("/nano_banana_pro/text-to-image", body),
    tryPost("/nano-banana-pro", body),
    tryPost("/nano-banana-pro/text-to-image", body),
    tryPost("/nano_banana_2/text-to-image", body),
    tryPost("/bytedance/seedream/v4/text-to-image", { ...body, model: "bytedance/seedream/v4/text-to-image" }),
    tryPost("/reve/text-to-image", body),
  ]);

  return NextResponse.json({
    "google/nano_banana_pro":                  providerResults[0],
    "google/nano_banana_pro/text-to-image":    providerResults[1],
    "nano_banana_pro/text-to-image":           providerResults[2],
    "nano-banana-pro":                         providerResults[3],
    "nano-banana-pro/text-to-image":           providerResults[4],
    "nano_banana_2/text-to-image":             providerResults[5],
    "bytedance/seedream/v4/text-to-image":     providerResults[6],
    "reve/text-to-image":                      providerResults[7],
  });
}

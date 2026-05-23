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

async function tryMcp(authHeader: string) {
  const res = await fetch("https://mcp.higgsfield.ai/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader,
    },
    body: JSON.stringify({
      jsonrpc: "2.0", method: "tools/call", id: 1,
      params: {
        name: "generate_image",
        arguments: { params: { model: "nano_banana_pro", prompt: "a red apple", aspect_ratio: "1:1", resolution: "1k" } }
      }
    }),
  });
  let data: unknown;
  try { data = await res.json(); } catch { data = await res.text(); }
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

  // Test MCP endpoint directly
  const mcpKey    = await tryMcp(auth());
  const mcpBearer = await tryMcp(`Bearer ${process.env.HIGGSFIELD_KEY_ID}:${process.env.HIGGSFIELD_KEY_SECRET}`);

  return NextResponse.json({
    "platform — /nano_banana_pro":           platformResults[0],
    "platform — /nano_banana_2":             platformResults[1],
    "platform — /v1/nano_banana_pro":        platformResults[2],
    "platform — /v1/image/generate":         platformResults[3],
    "platform — /v1/generate":               platformResults[4],
    "platform — /api/v1/generate":           platformResults[5],
    "platform — /generate":                  platformResults[6],
    "platform — /images/generate":           platformResults[7],
    "mcp — Key auth":                        mcpKey,
    "mcp — Bearer auth":                     mcpBearer,
  });
}

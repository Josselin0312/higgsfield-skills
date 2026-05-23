import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const BASE = "https://platform.higgsfield.ai";

function keyAuth() {
  return `Key ${process.env.HIGGSFIELD_KEY_ID}:${process.env.HIGGSFIELD_KEY_SECRET}`;
}

async function getClerkJwt(): Promise<{ jwt: string; error?: string }> {
  const clerkClient = process.env.HIGGSFIELD_CLERK_CLIENT ?? "";
  const sessionId   = process.env.HIGGSFIELD_SESSION_ID ?? "";
  try {
    const res = await fetch(
      `https://clerk.higgsfield.ai/v1/client/sessions/${sessionId}/tokens`,
      {
        method: "POST",
        headers: {
          "Cookie": `__client=${clerkClient}`,
          "Origin": "https://higgsfield.ai",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    const data = await res.json() as Record<string, unknown>;
    const jwt = (data.jwt as string) ?? "";
    return jwt ? { jwt } : { jwt: "", error: JSON.stringify(data).slice(0, 200) };
  } catch (e) {
    return { jwt: "", error: String(e) };
  }
}

async function mcpCall(authHeader: string, body: unknown) {
  const res = await fetch("https://mcp.higgsfield.ai/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader,
      "Accept": "application/json, text/event-stream",
    },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  // Parse SSE lines
  const lines = raw.split('\n').filter(l => l.startsWith('data: '));
  const parsed = lines.map(l => { try { return JSON.parse(l.slice(6)); } catch { return l; } });
  return { status: res.status, data: parsed.length ? parsed : raw.slice(0, 500) };
}

const MCP_INIT = { jsonrpc: "2.0", method: "initialize", id: 0, params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1" } } };
const MCP_COST = { jsonrpc: "2.0", method: "tools/call", id: 1, params: { name: "generate_image", arguments: { params: { model: "nano_banana_pro", prompt: "a red apple", aspect_ratio: "1:1", resolution: "1k", get_cost: true } } } };

export async function GET() {
  // 1. Get Clerk JWT
  const { jwt, error: jwtError } = await getClerkJwt();

  // 2. Test MCP with Clerk JWT Bearer token
  let mcpClerkInit: unknown = "JWT missing";
  let mcpClerkCost: unknown = "JWT missing";
  if (jwt) {
    const bearer = `Bearer ${jwt}`;
    [mcpClerkInit, mcpClerkCost] = await Promise.all([
      mcpCall(bearer, MCP_INIT),
      mcpCall(bearer, MCP_COST),
    ]);
  }

  // 3. Test REST API with Clerk JWT on platform
  let restClerkResult: unknown = "JWT missing";
  if (jwt) {
    const res = await fetch(`${BASE}/nano_banana_pro`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "a red apple", aspect_ratio: "1:1", resolution: "1k" }),
    });
    let d: unknown; try { d = await res.json(); } catch { d = await res.text(); }
    restClerkResult = { status: res.status, data: d };
  }

  return NextResponse.json({
    "jwt_obtained": !!jwt,
    "jwt_error": jwtError ?? null,
    "mcp — Clerk JWT — initialize": mcpClerkInit,
    "mcp — Clerk JWT — generate_image (preflight)": mcpClerkCost,
    "platform — Bearer JWT — /nano_banana_pro": restClerkResult,
    "platform — Key auth — /reve/text-to-image": await (async () => {
      const res = await fetch(`${BASE}/reve/text-to-image`, {
        method: "POST",
        headers: { Authorization: keyAuth(), "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "a red apple", aspect_ratio: "1:1", resolution: "1k" }),
      });
      let d: unknown; try { d = await res.json(); } catch { d = await res.text(); }
      return { status: res.status, data: d };
    })(),
  });
}

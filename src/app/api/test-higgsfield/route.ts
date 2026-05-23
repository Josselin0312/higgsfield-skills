import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

async function getClerkJwt(): Promise<string> {
  const clerkClient = process.env.HIGGSFIELD_CLERK_CLIENT ?? "";
  const sessionId   = process.env.HIGGSFIELD_SESSION_ID ?? "";
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
  return (data.jwt as string) ?? "";
}

async function mcpPost(bearer: string, body: unknown, sessionId?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": bearer,
    "Accept": "application/json, text/event-stream",
  };
  if (sessionId) headers["Mcp-Session-Id"] = sessionId;

  const res = await fetch("https://mcp.higgsfield.ai/mcp", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  // Capture session ID from response headers
  const respSessionId = res.headers.get("Mcp-Session-Id") ?? res.headers.get("mcp-session-id") ?? "";

  const raw = await res.text();
  const lines = raw.split('\n').filter(l => l.startsWith('data: '));
  const parsed = lines.map(l => { try { return JSON.parse(l.slice(6)); } catch { return l; } });

  return {
    status: res.status,
    sessionId: respSessionId,
    data: parsed.length ? parsed : raw.slice(0, 500),
    allHeaders: Object.fromEntries(res.headers.entries()),
  };
}

export async function GET() {
  const jwt = await getClerkJwt();
  if (!jwt) return NextResponse.json({ error: "JWT failed" });

  const bearer = `Bearer ${jwt}`;

  // Step 1: Initialize — capture session ID from response headers
  const initResult = await mcpPost(bearer, {
    jsonrpc: "2.0", method: "initialize", id: 0,
    params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1" } }
  });

  const mcpSessionId = initResult.sessionId;

  // Step 2: tools/call with session ID
  const genResult = await mcpPost(bearer, {
    jsonrpc: "2.0", method: "tools/call", id: 1,
    params: {
      name: "generate_image",
      arguments: {
        params: {
          model: "nano_banana_pro",
          prompt: "a red apple on a white table",
          aspect_ratio: "1:1",
          resolution: "1k",
        }
      }
    }
  }, mcpSessionId || undefined);

  return NextResponse.json({
    "step1_init_status": initResult.status,
    "step1_session_id_header": mcpSessionId || "(none)",
    "step1_all_headers": initResult.allHeaders,
    "step2_generate_status": genResult.status,
    "step2_session_id_used": mcpSessionId || "(none)",
    "step2_data": genResult.data,
  });
}

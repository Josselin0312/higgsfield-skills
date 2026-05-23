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

export async function GET() {
  const jwt = await getClerkJwt();
  if (!jwt) return NextResponse.json({ error: "JWT failed" });

  const bearer = `Bearer ${jwt}`;

  // Real generation via MCP + Clerk JWT — no get_cost, actual job submission
  const res = await fetch("https://mcp.higgsfield.ai/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": bearer,
      "Accept": "application/json, text/event-stream",
    },
    body: JSON.stringify({
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
    }),
  });

  const raw = await res.text();
  const lines = raw.split('\n').filter(l => l.startsWith('data: '));
  const parsed = lines.map(l => { try { return JSON.parse(l.slice(6)); } catch { return l; } });

  return NextResponse.json({
    http_status: res.status,
    sse_lines: parsed,
    raw_preview: raw.slice(0, 2000),
  });
}

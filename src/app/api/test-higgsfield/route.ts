import { NextResponse } from "next/server";
import https from "https";

export const runtime = "nodejs";
export const maxDuration = 120;

const CLERK_CLIENT = process.env.HIGGSFIELD_CLERK_CLIENT ?? "";
const SESSION_ID   = process.env.HIGGSFIELD_SESSION_ID ?? "";

async function getFreshJWT(): Promise<{ ok: boolean; jwt?: string; error?: string }> {
  try {
    const res = await fetch(
      `https://clerk.higgsfield.ai/v1/client/sessions/${SESSION_ID}/tokens`,
      {
        method: "POST",
        headers: {
          "Cookie": `__client=${CLERK_CLIENT}`,
          "Origin": "https://higgsfield.ai",
          "Referer": "https://higgsfield.ai/",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    const data = await res.json() as Record<string, unknown>;
    if (data.jwt) return { ok: true, jwt: data.jwt as string };
    return { ok: false, error: `status ${res.status}: ${JSON.stringify(data).slice(0, 200)}` };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

function mcpPost(body: unknown, jwt: string): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve) => {
    const payload = JSON.stringify(body);
    const req = https.request({
      hostname: "mcp.higgsfield.ai",
      path: "/mcp",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        "Accept": "application/json, text/event-stream",
        "Authorization": `Bearer ${jwt}`,
      },
      timeout: 110000,
    }, (res) => {
      const ct = res.headers["content-type"] ?? "";
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        if (ct.includes("text/event-stream")) {
          const lines = raw.split("\n");
          let lastValid: unknown = null;
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const json = line.slice(6).trim();
              if (json && json !== "[DONE]") {
                try { lastValid = JSON.parse(json); } catch { /* skip */ }
              }
            }
          }
          resolve({ status: res.statusCode ?? 0, data: lastValid ?? { raw: raw.slice(0, 500) } });
        } else {
          try { resolve({ status: res.statusCode ?? 0, data: JSON.parse(raw) }); }
          catch { resolve({ status: res.statusCode ?? 0, data: raw.slice(0, 300) }); }
        }
      });
    });
    req.on("error", (e) => resolve({ status: -1, data: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ status: -2, data: "timeout" }); });
    req.write(payload);
    req.end();
  });
}

export async function GET() {
  const tokenResult = await getFreshJWT();
  if (!tokenResult.ok || !tokenResult.jwt) {
    return NextResponse.json({ error: "JWT refresh failed", detail: tokenResult.error });
  }

  const jwt = tokenResult.jwt;

  const init = await mcpPost({ jsonrpc: "2.0", method: "initialize", id: 1, params: {
    protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1.0" }
  }}, jwt);

  const gen = await mcpPost({ jsonrpc: "2.0", method: "tools/call", id: 2, params: {
    name: "generate_image",
    arguments: { params: { model: "nano_banana_pro", prompt: "a woman walking in Paris", aspect_ratio: "1:1" } }
  }}, jwt);

  return NextResponse.json({ tokenRefresh: "ok", init, gen });
}

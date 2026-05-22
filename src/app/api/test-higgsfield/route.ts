import { NextResponse } from "next/server";
import https from "https";

export const runtime = "nodejs";
export const maxDuration = 120;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";

const CCR_URL = "https://api.anthropic.com/v2/ccr-sessions/cse_01WCSTZL9J21d5SBhnwQpJoD/mcp?mcp_url=https%3A%2F%2Fmcp.higgsfield.ai%2Fmcp&mcp_server_id=e9a62de2-1f4c-599e-b868-f39d4b4726b8&toolbox_mcp_server_id=c178aafb-b1b4-4edb-8dce-d398985af22d";

function ccrPost(body: unknown): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve) => {
    const url = new URL(CCR_URL);
    const payload = JSON.stringify(body);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        "Accept": "application/json, text/event-stream",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "X-Session-UUID": "cse_01WCSTZL9J21d5SBhnwQpJoD",
        "X-MCP-Server-ID": "c178aafb-b1b4-4edb-8dce-d398985af22d",
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
  const init = await ccrPost({ jsonrpc: "2.0", method: "initialize", id: 1, params: {
    protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1.0" }
  }});

  const gen = await ccrPost({ jsonrpc: "2.0", method: "tools/call", id: 2, params: {
    name: "generate_image",
    arguments: { params: { model: "nano_banana_pro", prompt: "a woman walking in Paris", aspect_ratio: "1:1" } }
  }});

  return NextResponse.json({ init, gen });
}

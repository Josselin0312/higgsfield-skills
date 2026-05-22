import { NextResponse } from "next/server";
import https from "https";

export const runtime = "nodejs";
export const maxDuration = 120;

const HIGGSFIELD_TOKEN = process.env.HIGGSFIELD_TOKEN ?? "";

function mcpPost(body: unknown): Promise<{ status: number; data: unknown; raw?: string }> {
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
        "Authorization": `Bearer ${HIGGSFIELD_TOKEN}`,
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
          if (lastValid) resolve({ status: res.statusCode ?? 0, data: lastValid });
          else resolve({ status: res.statusCode ?? 0, data: null, raw: raw.slice(0, 800) });
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
  const init = await mcpPost({ jsonrpc: "2.0", method: "initialize", id: 1, params: {
    protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1.0" }
  }});

  const gen = await mcpPost({ jsonrpc: "2.0", method: "tools/call", id: 2, params: {
    name: "generate_image",
    arguments: { params: { model: "nano_banana_pro", prompt: "a woman walking in Paris", aspect_ratio: "1:1" } }
  }});

  return NextResponse.json({ init, gen });
}

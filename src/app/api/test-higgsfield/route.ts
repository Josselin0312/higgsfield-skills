import { NextResponse } from "next/server";
import https from "https";

export const runtime = "nodejs";

const KEY_SECRET = process.env.HIGGSFIELD_KEY_SECRET ?? "";

function mcpPost(body: unknown): Promise<{ status: number; data: unknown }> {
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
        "Authorization": `Bearer ${KEY_SECRET}`,
      },
      timeout: 15000,
    }, (res) => {
      const ct = res.headers["content-type"] ?? "";
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        if (ct.includes("text/event-stream")) {
          const lines = raw.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const json = line.slice(6).trim();
              if (json && json !== "[DONE]") {
                try { return resolve({ status: res.statusCode ?? 0, data: JSON.parse(json) }); } catch { /* skip */ }
              }
            }
          }
          resolve({ status: res.statusCode ?? 0, data: { raw: raw.slice(0, 500) } });
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
  // Step 1: initialize
  const init = await mcpPost({ jsonrpc: "2.0", method: "initialize", id: 1, params: {
    protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1.0" }
  }});

  // Step 2: list tools
  const tools = await mcpPost({ jsonrpc: "2.0", method: "tools/list", id: 2 });

  // Step 3: generate (get_cost only — no credits used)
  const gen = await mcpPost({ jsonrpc: "2.0", method: "tools/call", id: 3, params: {
    name: "generate_image",
    arguments: { params: { model: "nano_banana_2", prompt: "a woman in Paris", aspect_ratio: "1:1", get_cost: true } }
  }});

  return NextResponse.json({ init, tools, gen });
}

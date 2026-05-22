import { NextResponse } from "next/server";
import https from "https";

export const runtime = "nodejs";
export const maxDuration = 120;

const KEY_ID     = process.env.HIGGSFIELD_KEY_ID ?? "";
const KEY_SECRET = process.env.HIGGSFIELD_KEY_SECRET ?? "";

function post(hostname: string, path: string, body: unknown, auth: string): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve) => {
    const payload = JSON.stringify(body);
    const req = https.request({
      hostname,
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        "Accept": "application/json, text/event-stream",
        "Authorization": auth,
      },
      timeout: 30000,
    }, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode ?? 0, data: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode ?? 0, data: raw.slice(0, 300) }); }
      });
    });
    req.on("error", (e) => resolve({ status: -1, data: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ status: -2, data: "timeout" }); });
    req.write(payload);
    req.end();
  });
}

export async function GET() {
  const keyAuth   = `Key ${KEY_ID}:${KEY_SECRET}`;
  const bearerKey = `Bearer ${KEY_SECRET}`;

  // Test 1: v2 REST — nano-banana-pro text-to-image
  const v2NbPro = await post(
    "platform.higgsfield.ai",
    "/nano-banana-pro/text-to-image",
    { prompt: "a woman in Paris", aspect_ratio: "1:1" },
    keyAuth
  );

  // Test 2: v2 REST — nano-banana-2 text-to-image
  const v2Nb2 = await post(
    "platform.higgsfield.ai",
    "/nano-banana-2/text-to-image",
    { prompt: "a woman in Paris", aspect_ratio: "1:1" },
    keyAuth
  );

  // Test 3: v2 REST — list available models/endpoints
  const v2Models = await post(
    "platform.higgsfield.ai",
    "/models",
    {},
    keyAuth
  );

  // Test 4: MCP init — Bearer KEY_SECRET (old working format)
  const mcpInit = await post(
    "mcp.higgsfield.ai",
    "/mcp",
    { jsonrpc: "2.0", method: "initialize", id: 1, params: {
      protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1.0" }
    }},
    bearerKey
  );

  return NextResponse.json({ v2NbPro, v2Nb2, v2Models, mcpInit });
}

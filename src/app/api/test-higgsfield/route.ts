import { NextResponse } from "next/server";
import https from "https";

export const runtime = "nodejs";

const KEY_ID = process.env.HIGGSFIELD_KEY_ID ?? "";
const KEY_SECRET = process.env.HIGGSFIELD_KEY_SECRET ?? "";

function post(hostname: string, path: string, body: unknown, headers: Record<string, string>): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve) => {
    const payload = JSON.stringify(body);
    const req = https.request({
      hostname, path, method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload), ...headers },
      timeout: 12000,
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

const V1H = { "hf-api-key": KEY_ID, "hf-secret": KEY_SECRET };
const V2H = { "Authorization": `Key ${KEY_ID}:${KEY_SECRET}` };
const MCP_BODY = { jsonrpc: "2.0", method: "tools/list", id: 1 };

export async function GET() {
  const tests = [
    // mcp.higgsfield.ai — le vrai serveur Higgsfield
    { label: "MCP V2 auth tools/list",       host: "mcp.higgsfield.ai", path: "/mcp", body: MCP_BODY, headers: V2H },
    { label: "MCP V1 auth tools/list",       host: "mcp.higgsfield.ai", path: "/mcp", body: MCP_BODY, headers: V1H },
    { label: "MCP no auth tools/list",       host: "mcp.higgsfield.ai", path: "/mcp", body: MCP_BODY, headers: {} },
    // Appel direct generate_image via MCP JSON-RPC
    { label: "MCP V2 generate_image",        host: "mcp.higgsfield.ai", path: "/mcp", headers: V2H, body: {
      jsonrpc: "2.0", method: "tools/call", id: 2,
      params: { name: "generate_image", arguments: { params: { model: "nano_banana_2", prompt: "a woman in a city", aspect_ratio: "1:1", get_cost: true } } }
    }},
    // nano-banana sur platform avec empty input_images (test)
    { label: "V1 nano-banana prompt réel empty[]", host: "platform.higgsfield.ai", path: "/v1/text2image/nano-banana", headers: V1H, body: {
      params: { prompt: "a beautiful woman standing in Paris, photorealistic, cinematic", aspect_ratio: "1:1", resolution: "1k", input_images: [] }
    }},
  ];

  const results = await Promise.all(
    tests.map(async (t) => {
      const r = await post(t.host, t.path, t.body, t.headers);
      return { label: t.label, status: r.status, data: r.data };
    })
  );

  const working = results.filter(r => r.status !== 404 && r.status !== 403 && r.status !== -1 && r.status !== -2);
  return NextResponse.json({ working, all: results });
}

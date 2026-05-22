import { NextResponse } from "next/server";
import https from "https";

export const runtime = "nodejs";

const KEY_ID = process.env.HIGGSFIELD_KEY_ID ?? "";
const KEY_SECRET = process.env.HIGGSFIELD_KEY_SECRET ?? "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";

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

const MCP_BODY = { jsonrpc: "2.0", method: "tools/list", id: 1 };

export async function GET() {
  const tests = [
    // Différents formats de token pour mcp.higgsfield.ai
    { label: "MCP Bearer KEY_SECRET",           host: "mcp.higgsfield.ai", path: "/mcp", body: MCP_BODY, headers: { "Authorization": `Bearer ${KEY_SECRET}` } },
    { label: "MCP Bearer KEY_ID:KEY_SECRET",    host: "mcp.higgsfield.ai", path: "/mcp", body: MCP_BODY, headers: { "Authorization": `Bearer ${KEY_ID}:${KEY_SECRET}` } },
    { label: "MCP Bearer KEY_ID",               host: "mcp.higgsfield.ai", path: "/mcp", body: MCP_BODY, headers: { "Authorization": `Bearer ${KEY_ID}` } },
    { label: "MCP Bearer ANTHROPIC_KEY",        host: "mcp.higgsfield.ai", path: "/mcp", body: MCP_BODY, headers: { "Authorization": `Bearer ${ANTHROPIC_KEY}` } },
    { label: "MCP X-API-Key KEY_SECRET",        host: "mcp.higgsfield.ai", path: "/mcp", body: MCP_BODY, headers: { "X-API-Key": KEY_SECRET } },
    // Appel Anthropic API avec mcp_servers — beta
    { label: "Anthropic beta mcp_servers",      host: "api.anthropic.com", path: "/v1/messages", body: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        mcp_servers: [{ type: "url", name: "higgsfield", url: "https://mcp.higgsfield.ai/mcp", authorization_token: KEY_SECRET }],
        messages: [{ role: "user", content: "List available tools from higgsfield MCP server. Just say what tools are available." }]
      }, headers: {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "mcp-client-2025-04-04"
      }
    },
  ];

  const results = await Promise.all(
    tests.map(async (t) => {
      const r = await post(t.host, t.path, t.body, t.headers);
      return { label: t.label, status: r.status, data: r.data };
    })
  );

  const working = results.filter(r => r.status !== 401 && r.status !== 403 && r.status !== 404 && r.status !== -1 && r.status !== -2);
  return NextResponse.json({ working, all: results.map(r => ({ label: r.label, status: r.status, snippet: JSON.stringify(r.data).slice(0, 150) })) });
}

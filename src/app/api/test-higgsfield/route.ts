import { NextResponse } from "next/server";
import https from "https";

export const runtime = "nodejs";
export const maxDuration = 120;

const KEY_ID     = process.env.HIGGSFIELD_KEY_ID ?? "";
const KEY_SECRET = process.env.HIGGSFIELD_KEY_SECRET ?? "";
const TOKEN      = process.env.HIGGSFIELD_TOKEN ?? "";

function req(hostname: string, path: string, method: string, body: unknown, auth: string): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve) => {
    const payload = method === "GET" ? "" : JSON.stringify(body);
    const headers: Record<string, string | number> = {
      "Accept": "application/json",
      "Authorization": auth,
    };
    if (method !== "GET") {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(payload);
    }
    const r = https.request({ hostname, path, method, headers, timeout: 20000 }, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode ?? 0, data: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode ?? 0, data: raw.slice(0, 200) }); }
      });
    });
    r.on("error", (e) => resolve({ status: -1, data: e.message }));
    r.on("timeout", () => { r.destroy(); resolve({ status: -2, data: "timeout" }); });
    if (method !== "GET") r.write(payload);
    r.end();
  });
}

export async function GET() {
  const keyAuth    = `Key ${KEY_ID}:${KEY_SECRET}`;
  const bearerKey  = `Bearer ${KEY_SECRET}`;
  const bearerJwt  = `Bearer ${TOKEN}`;

  const [
    // fnf.higgsfield.ai avec différents formats d'auth
    fnfKeyWorkspace,
    fnfKeyGenerate,
    fnfBearerKeyWorkspace,
    fnfJwtWorkspace,
    // MCP avec clé secrète
    mcpBearerKey,
  ] = await Promise.all([
    req("fnf.higgsfield.ai", "/workspaces/details", "GET", null, keyAuth),
    req("fnf.higgsfield.ai", "/generations", "GET", null, keyAuth),
    req("fnf.higgsfield.ai", "/workspaces/details", "GET", null, bearerKey),
    req("fnf.higgsfield.ai", "/workspaces/details", "GET", null, bearerJwt),
    req("mcp.higgsfield.ai", "/mcp", "POST",
      { jsonrpc: "2.0", method: "initialize", id: 1, params: {
        protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1.0" }
      }},
      bearerKey
    ),
  ]);

  return NextResponse.json({
    "fnf Key ID:SECRET /workspaces/details": fnfKeyWorkspace,
    "fnf Key ID:SECRET /generations": fnfKeyGenerate,
    "fnf Bearer SECRET /workspaces/details": fnfBearerKeyWorkspace,
    "fnf Bearer JWT /workspaces/details": fnfJwtWorkspace,
    "mcp Bearer SECRET init": mcpBearerKey,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";

export const runtime = "nodejs";

const MCP_URL =
  "https://api.anthropic.com/v2/ccr-sessions/cse_01GXDJAa3epZEUUdAAJuYMCq/mcp" +
  "?mcp_url=https%3A%2F%2Fmcp.higgsfield.ai%2Fmcp" +
  "&mcp_server_id=938ea723-3447-50a9-b4b3-716bd9b26848" +
  "&toolbox_mcp_server_id=c178aafb-b1b4-4edb-8dce-d398985af22d";

const SESSION_ID = "cse_01GXDJAa3epZEUUdAAJuYMCq";
const SERVER_ID  = "c178aafb-b1b4-4edb-8dce-d398985af22d";
const TOKEN_FILE = "/home/claude/.claude/remote/.session_ingress_token";

async function getToken(): Promise<string> {
  try {
    return (await fs.readFile(TOKEN_FILE, "utf8")).trim();
  } catch {
    const t = process.env.ANTHROPIC_API_KEY;
    if (!t) throw new Error("Pas de token auth disponible");
    return t;
  }
}

async function mcpPost(method: string, params: unknown, id: number) {
  const token = await getToken();
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "Authorization": `Bearer ${token}`,
      "X-Session-UUID": SESSION_ID,
      "X-MCP-Server-ID": SERVER_ID,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ jsonrpc: "2.0", method, id, params }),
  });
  const ct = res.headers.get("content-type") ?? "";
  const raw = await res.text();
  if (ct.includes("text/event-stream")) {
    for (const line of raw.split("\n")) {
      if (line.startsWith("data: ")) {
        try { return JSON.parse(line.slice(6).trim()); } catch { /* skip */ }
      }
    }
    throw new Error("SSE vide");
  }
  return JSON.parse(raw);
}

async function handleUpload(content_type: string, filename?: string) {
  const ext = (content_type ?? "image/jpeg").split("/")[1] ?? "jpg";
  const rpc = await mcpPost("tools/call", {
    name: "media_upload",
    arguments: { filename: filename ?? `upload.${ext}`, content_type: content_type ?? "image/jpeg" },
  }, 1) as Record<string, unknown>;

  const result = rpc?.result as Record<string, unknown> | undefined;
  const uploads = (result?.structuredContent as Record<string, unknown>)?.uploads as Array<Record<string, unknown>> | undefined;
  const upload = uploads?.[0];

  if (!upload) return NextResponse.json({ error: "media_upload failed" }, { status: 500 });

  return NextResponse.json({
    upload_url: upload.upload_url,
    media_id: upload.media_id,
    public_url: upload.url,
  });
}

export async function GET(req: NextRequest) {
  const content_type = req.nextUrl.searchParams.get("content_type") ?? "image/jpeg";
  const filename = req.nextUrl.searchParams.get("filename") ?? undefined;
  return handleUpload(content_type, filename);
}

export async function POST(req: NextRequest) {
  const { content_type, filename } = await req.json();
  return handleUpload(content_type, filename);
}

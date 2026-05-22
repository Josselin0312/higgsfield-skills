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

async function handleConfirm(media_id: string) {
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
    body: JSON.stringify({
      jsonrpc: "2.0", method: "tools/call", id: 2,
      params: { name: "media_confirm", arguments: { media_id, type: "image" } },
    }),
  });

  const ct = res.headers.get("content-type") ?? "";
  const raw = await res.text();
  let rpc: unknown;
  if (ct.includes("text/event-stream")) {
    for (const line of raw.split("\n")) {
      if (line.startsWith("data: ")) { try { rpc = JSON.parse(line.slice(6).trim()); } catch { /* skip */ } }
    }
  } else {
    rpc = JSON.parse(raw);
  }

  return NextResponse.json({ ok: true, rpc });
}

export async function GET(req: NextRequest) {
  const media_id = req.nextUrl.searchParams.get("media_id");
  if (!media_id) return NextResponse.json({ error: "media_id manquant" }, { status: 400 });
  return handleConfirm(media_id);
}

export async function POST(req: NextRequest) {
  const { media_id } = await req.json();
  return handleConfirm(media_id);
}

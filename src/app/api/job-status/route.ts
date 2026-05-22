import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";

export const runtime = "nodejs";
export const maxDuration = 15;

const MCP_URL =
  "https://api.anthropic.com/v2/ccr-sessions/cse_01GXDJAa3epZEUUdAAJuYMCq/mcp" +
  "?mcp_url=https%3A%2F%2Fmcp.higgsfield.ai%2Fmcp" +
  "&mcp_server_id=938ea723-3447-50a9-b4b3-716bd9b26848" +
  "&toolbox_mcp_server_id=c178aafb-b1b4-4edb-8dce-d398985af22d";

const SESSION_ID = "cse_01GXDJAa3epZEUUdAAJuYMCq";
const SERVER_ID  = "c178aafb-b1b4-4edb-8dce-d398985af22d";
const TOKEN_FILE = "/home/claude/.claude/remote/.session_ingress_token";

async function getToken(): Promise<string> {
  return (await fs.readFile(TOKEN_FILE, "utf8")).trim();
}

function extractUrl(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  for (const k of ["rawUrl", "url", "raw_url", "image_url"]) {
    if (typeof o[k] === "string" && (o[k] as string).startsWith("http")) return o[k] as string;
  }
  for (const k of ["results", "images"]) {
    if (typeof o[k] === "object" && o[k] !== null && !Array.isArray(o[k])) {
      const u = extractUrl(o[k]);
      if (u) return u;
    }
    if (Array.isArray(o[k])) {
      for (const item of o[k] as unknown[]) {
        const u = extractUrl(item);
        if (u) return u;
      }
    }
  }
  if (o.generation) return extractUrl(o.generation);
  return null;
}

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ done: false, error: "jobId manquant" });

  try {
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
        jsonrpc: "2.0",
        method: "tools/call",
        id: Math.floor(Math.random() * 9000) + 1,
        params: { name: "job_status", arguments: { jobId, sync: false } },
      }),
    });

    const ct = res.headers.get("content-type") ?? "";
    const raw = await res.text();

    let rpc: unknown = null;
    if (ct.includes("text/event-stream")) {
      for (const line of raw.split("\n")) {
        if (line.startsWith("data: ")) {
          const chunk = line.slice(6).trim();
          if (chunk && chunk !== "[DONE]") {
            try { rpc = JSON.parse(chunk); } catch { /* skip */ }
          }
        }
      }
    } else {
      try { rpc = JSON.parse(raw); } catch { /* skip */ }
    }

    if (!rpc) return NextResponse.json({ done: false });

    const r = rpc as Record<string, unknown>;
    const result = r?.result as Record<string, unknown> | undefined;
    if (!result || result.isError) return NextResponse.json({ done: false });

    // Extract URL from structuredContent
    const sc = result.structuredContent as Record<string, unknown> | undefined;
    if (sc) {
      const url = extractUrl(sc);
      if (url) return NextResponse.json({ done: true, url });
    }

    // Fallback: text/uri content
    const content = result.content as Array<{ type: string; text?: string; uri?: string }> | undefined;
    if (Array.isArray(content)) {
      for (const item of content) {
        if (item.uri?.startsWith("http")) return NextResponse.json({ done: true, url: item.uri });
        if (item.text) {
          const match = item.text.match(/https?:\/\/\S+\.(?:png|jpg|webp|jpeg)/i);
          if (match) return NextResponse.json({ done: true, url: match[0] });
        }
      }
    }

    return NextResponse.json({ done: false });
  } catch {
    return NextResponse.json({ done: false });
  }
}

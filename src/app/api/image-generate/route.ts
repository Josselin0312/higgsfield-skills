import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";

export const runtime = "nodejs";
export const maxDuration = 300;

const MCP_URL =
  "https://api.anthropic.com/v2/ccr-sessions/cse_01GXDJAa3epZEUUdAAJuYMCq/mcp" +
  "?mcp_url=https%3A%2F%2Fmcp.higgsfield.ai%2Fmcp" +
  "&mcp_server_id=938ea723-3447-50a9-b4b3-716bd9b26848" +
  "&toolbox_mcp_server_id=c178aafb-b1b4-4edb-8dce-d398985af22d";

const SESSION_ID = "cse_01GXDJAa3epZEUUdAAJuYMCq";
const SERVER_ID  = "c178aafb-b1b4-4edb-8dce-d398985af22d";
const TOKEN_FILE = "/home/claude/.claude/remote/.session_ingress_token";

const ASPECT_RATIO: Record<string, string> = {
  "1024x1024": "1:1",
  "1080x1350": "4:5",
  "1080x1920": "9:16",
  "1920x1080": "16:9",
  "1200x800":  "3:2",
  "800x1200":  "2:3",
};

async function getToken(): Promise<string> {
  return (await fs.readFile(TOKEN_FILE, "utf8")).trim();
}

async function mcpPost(token: string, method: string, params: unknown, id: number): Promise<unknown> {
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
    let last: unknown = null;
    for (const line of raw.split("\n")) {
      if (line.startsWith("data: ")) {
        const chunk = line.slice(6).trim();
        if (chunk && chunk !== "[DONE]") {
          try { last = JSON.parse(chunk); } catch { /* skip */ }
        }
      }
    }
    if (!last) throw new Error("SSE vide: " + raw.slice(0, 300));
    return last;
  }

  return JSON.parse(raw);
}

function extractUrl(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  for (const k of ["rawUrl", "url", "raw_url", "image_url"]) {
    if (typeof o[k] === "string" && (o[k] as string).startsWith("http")) return o[k] as string;
  }
  for (const k of ["results", "images"]) {
    if (typeof o[k] === "object" && o[k] !== null) {
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

function getRpcResult(rpc: unknown): Record<string, unknown> | null {
  const r = rpc as Record<string, unknown>;
  if (r?.error) {
    const e = r.error as Record<string, unknown>;
    throw new Error("MCP error: " + (e.message ?? JSON.stringify(e)));
  }
  const result = r?.result as Record<string, unknown> | undefined;
  if (result?.isError) {
    const content = result.content as Array<{ type: string; text: string }>;
    throw new Error(content?.find(c => c.type === "text")?.text ?? "Erreur MCP");
  }
  return result ?? null;
}

async function pollJob(jobId: string): Promise<string | null> {
  const token = await getToken();
  const rpc = await mcpPost(token, "tools/call", {
    name: "job_status",
    arguments: { jobId, sync: true },
  }, Math.floor(Math.random() * 9000) + 100);

  const result = getRpcResult(rpc);
  if (!result) return null;

  // Try structuredContent first (most reliable)
  const sc = result.structuredContent as Record<string, unknown> | undefined;
  if (sc) {
    const url = extractUrl(sc);
    if (url) return url;
  }

  // Fallback: grep URL from text content
  const content = result.content as Array<{ type: string; text?: string; uri?: string }> | undefined;
  if (Array.isArray(content)) {
    for (const item of content) {
      if (item.uri?.startsWith("http")) return item.uri;
      if (item.text) {
        const match = item.text.match(/https?:\/\/\S+\.(?:png|jpg|webp|jpeg)/i);
        if (match) return match[0];
      }
    }
  }

  return null;
}

async function generateOne(params: Record<string, unknown>): Promise<string | null> {
  const token = await getToken();
  const rpc = await mcpPost(token, "tools/call", {
    name: "generate_image",
    arguments: { params },
  }, 2);

  const result = getRpcResult(rpc);
  if (!result) return null;

  // Get job ID from structuredContent
  const sc = result.structuredContent as Record<string, unknown> | undefined;
  const results = sc?.results as Array<Record<string, unknown>> | undefined;
  const jobId = results?.[0]?.id as string | undefined;

  if (!jobId) {
    // Maybe image was returned immediately
    const url = extractUrl(sc ?? result);
    return url;
  }

  return await pollJob(jobId);
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, resolution, quality, count, inputImages = [] } = await req.json();
    if (!prompt?.trim()) return NextResponse.json({ error: "Prompt requis" }, { status: 400 });

    const params: Record<string, unknown> = {
      model: "nano_banana_pro",
      prompt,
      aspect_ratio: ASPECT_RATIO[resolution] ?? "1:1",
      resolution: quality === "4K" ? "4k" : quality === "2K" ? "2k" : "1k",
    };

    if ((inputImages as unknown[]).length > 0) {
      params.medias = (inputImages as { id: string; url: string }[]).map(img => ({
        role: "image",
        value: img.url, // URL CDN publique Higgsfield
      }));
    }

    const actualCount = Math.min(Math.max(1, count ?? 1), 4);
    const first = await generateOne(params);
    const images: string[] = first ? [first] : [];

    if (actualCount > 1) {
      const rest = await Promise.allSettled(
        Array.from({ length: actualCount - 1 }, () => generateOne(params))
      );
      rest.forEach(r => { if (r.status === "fulfilled" && r.value) images.push(r.value); });
    }

    if (images.length === 0) return NextResponse.json({ error: "Aucune image générée" }, { status: 500 });

    return NextResponse.json({ images });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[image-generate]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";

export const runtime = "nodejs";
export const maxDuration = 30;

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

async function mcpPost(token: string, params: unknown, id: number): Promise<unknown> {
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
    body: JSON.stringify({ jsonrpc: "2.0", method: "tools/call", id, params }),
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
    if (!last) throw new Error("SSE vide");
    return last;
  }
  return JSON.parse(raw);
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

async function submitJob(params: Record<string, unknown>): Promise<string> {
  const token = await getToken();
  const rpc = await mcpPost(token, {
    name: "generate_image",
    arguments: { params },
  }, Math.floor(Math.random() * 9000) + 1);

  const result = getRpcResult(rpc);
  if (!result) throw new Error("generate_image: no result");

  const sc = result.structuredContent as Record<string, unknown> | undefined;
  const results = sc?.results as Array<Record<string, unknown>> | undefined;
  const jobId = results?.[0]?.id as string | undefined;
  if (!jobId) throw new Error("generate_image: no jobId in response");

  return jobId;
}

async function handleGenerate(prompt: string, resolution: string, quality: string, count: unknown, inputImages: unknown[]) {
  if (!prompt?.trim()) return NextResponse.json({ error: "Prompt requis" }, { status: 400 });

  const params: Record<string, unknown> = {
    model: "nano_banana_pro",
    prompt,
    aspect_ratio: ASPECT_RATIO[resolution] ?? "1:1",
    resolution: quality === "4K" ? "4k" : quality === "2K" ? "2k" : "1k",
  };

  if (inputImages.length > 0) {
    params.medias = (inputImages as { url: string }[]).map(img => ({
      role: "image",
      value: img.url,
    }));
  }

  const actualCount = Math.min(Math.max(1, (count as number) ?? 1), 4);
  const settled = await Promise.allSettled(
    Array.from({ length: actualCount }, () => submitJob(params))
  );
  const jobIds = settled
    .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
    .map(r => r.value);

  if (jobIds.length === 0) {
    const err = settled.find(r => r.status === "rejected") as PromiseRejectedResult | undefined;
    return NextResponse.json({ error: err?.reason?.message ?? "Submit échoué" }, { status: 500 });
  }

  return NextResponse.json({ jobIds });
}

export async function GET(req: NextRequest) {
  try {
    const bodyParam = req.nextUrl.searchParams.get("body");
    if (!bodyParam) return NextResponse.json({ error: "body manquant" }, { status: 400 });
    const { prompt, resolution, quality, count, inputImages = [] } = JSON.parse(bodyParam);
    return handleGenerate(prompt, resolution, quality, count, inputImages);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[image-generate GET]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, resolution, quality, count, inputImages = [] } = await req.json();
    return handleGenerate(prompt, resolution, quality, count, inputImages);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[image-generate]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

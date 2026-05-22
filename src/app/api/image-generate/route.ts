import { NextRequest, NextResponse } from "next/server";
import https from "https";

export const runtime = "nodejs";
export const maxDuration = 300;

const ASPECT_RATIO: Record<string, string> = {
  "1024x1024": "1:1",
  "1080x1350": "4:5",
  "1080x1920": "9:16",
  "1920x1080": "16:9",
  "1200x800":  "3:2",
  "800x1200":  "2:3",
};

const RESOLUTION_MAP: Record<string, string> = {
  "1K": "1k",
  "2K": "2k",
  "4K": "4k",
};

const KEY_SECRET = process.env.HIGGSFIELD_KEY_SECRET ?? "";

function mcpCall(body: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
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
      timeout: 270000,
    }, (res) => {
      const ct = res.headers["content-type"] ?? "";
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        if (ct.includes("text/event-stream")) {
          // Server may stream multiple events; take the last valid JSON
          const lines = raw.split("\n");
          let lastValid: unknown = null;
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const json = line.slice(6).trim();
              if (json && json !== "[DONE]") {
                try { lastValid = JSON.parse(json); } catch { /* skip */ }
              }
            }
          }
          if (lastValid) resolve(lastValid);
          else reject(new Error("No SSE data: " + raw.slice(0, 500)));
        } else {
          try { resolve(JSON.parse(raw)); }
          catch { reject(new Error("Parse error: " + raw.slice(0, 200))); }
        }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("MCP timeout")); });
    req.write(payload);
    req.end();
  });
}

function extractUrl(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  for (const key of ["rawUrl", "url", "image_url", "imageUrl"]) {
    if (typeof o[key] === "string" && (o[key] as string).startsWith("http")) {
      return o[key] as string;
    }
  }
  for (const key of ["results", "images"]) {
    if (Array.isArray(o[key])) {
      for (const item of o[key] as unknown[]) {
        const url = extractUrl(item);
        if (url) return url;
      }
    }
  }
  if (o.result && typeof o.result === "object") return extractUrl(o.result);
  return null;
}

function extractContentText(result: unknown): string | null {
  const rpcResult = (result as Record<string, unknown>)?.result as Record<string, unknown> | undefined;
  const content = rpcResult?.content;
  if (Array.isArray(content)) {
    return content.find((c: Record<string, unknown>) => c.type === "text")?.text as string ?? null;
  }
  return null;
}

async function pollJob(jobId: string): Promise<string | null> {
  const maxAttempts = 15;
  const intervalMs = 4000;
  for (let i = 0; i < maxAttempts; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, intervalMs));
    try {
      const result = await mcpCall({
        jsonrpc: "2.0", method: "tools/call", id: 100 + i,
        params: { name: "show_generations", arguments: { size: 20 } }
      });
      const text = extractContentText(result);
      if (text) {
        const parsed = JSON.parse(text);
        const gens = parsed?.generations ?? parsed?.results ?? [];
        const job = Array.isArray(gens)
          ? (gens as Record<string, unknown>[]).find(g => g.id === jobId)
          : null;
        if (job?.status === "completed") {
          const url = extractUrl(job);
          if (url) return url;
        }
      }
    } catch (e) {
      console.error("[image-generate] poll attempt", i, "failed:", e);
    }
  }
  return null;
}

async function generateImage(params: Record<string, unknown>): Promise<string | null> {
  await mcpCall({ jsonrpc: "2.0", method: "initialize", id: 1, params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "slidein", version: "1.0" }
  }});

  const result = await mcpCall({
    jsonrpc: "2.0", method: "tools/call", id: 2,
    params: { name: "generate_image", arguments: { params } }
  }) as Record<string, unknown>;

  const rpcResult = result?.result as Record<string, unknown> | undefined;

  if (result?.error) {
    const e = result.error as Record<string, unknown>;
    throw new Error(`MCP error: ${e.message ?? JSON.stringify(e)}`);
  }

  if (rpcResult?.isError) {
    const content = rpcResult.content as Array<{type: string; text: string}> | undefined;
    const msg = content?.find(c => c.type === "text")?.text ?? "Unknown error";
    throw new Error(`Generate error: ${msg}`);
  }

  const text = extractContentText(result);
  if (!text) {
    console.error("[image-generate] no text content, raw result:", JSON.stringify(result).slice(0, 500));
    return null;
  }

  try {
    const parsed = JSON.parse(text);
    const url = extractUrl(parsed);
    if (url) return url;

    const jobId = (parsed?.results as Record<string, unknown>[])?.[0]?.id ?? parsed?.id;
    const status = (parsed?.results as Record<string, unknown>[])?.[0]?.status ?? parsed?.status;
    if (jobId && status === "pending") {
      console.log("[image-generate] job pending, polling:", jobId);
      return await pollJob(jobId as string);
    }
  } catch {
    const match = text.match(/https?:\/\/[^\s"']+\.(?:png|jpg|webp)/i);
    if (match) return match[0];
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, resolution, quality, count, inputImages = [] } = await req.json();

    if (!prompt?.trim()) return NextResponse.json({ error: "Prompt requis" }, { status: 400 });

    const aspect_ratio = ASPECT_RATIO[resolution] ?? "1:1";
    const res_param = RESOLUTION_MAP[quality] ?? "1k";
    const actualCount = Math.min(Math.max(1, count), 4);

    const params: Record<string, unknown> = {
      model: "nano_banana_pro",
      prompt,
      aspect_ratio,
      resolution: res_param,
    };

    if (inputImages.length > 0) {
      params.medias = inputImages.map((img: { id?: string; url: string }) => ({
        role: "image",
        value: img.url,
      }));
      console.log("[image-generate] with", inputImages.length, "reference image(s)");
    }

    console.log("[image-generate] calling MCP generate_image, model: nano_banana_pro");

    const generateOne = () => generateImage(params);

    const firstUrl = await generateOne();
    const images: string[] = firstUrl ? [firstUrl] : [];

    if (actualCount > 1) {
      const rest = await Promise.allSettled(
        Array.from({ length: actualCount - 1 }, generateOne)
      );
      rest.forEach((r) => { if (r.status === "fulfilled" && r.value) images.push(r.value); });
    }

    if (images.length === 0) {
      return NextResponse.json({ error: "Aucune image générée" }, { status: 500 });
    }

    return NextResponse.json({ images });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[image-generate]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

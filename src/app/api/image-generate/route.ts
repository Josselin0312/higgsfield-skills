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

const KEY_ID  = process.env.HIGGSFIELD_KEY_ID ?? "";
const KEY_SECRET = process.env.HIGGSFIELD_KEY_SECRET ?? "";

// Call mcp.higgsfield.ai via MCP JSON-RPC over SSE
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
          // Parse SSE: find data: {...} lines
          const lines = raw.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const json = line.slice(6).trim();
              if (json && json !== "[DONE]") {
                try { return resolve(JSON.parse(json)); } catch { /* skip */ }
              }
            }
          }
          reject(new Error("No data in SSE response: " + raw.slice(0, 200)));
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

async function generateImage(params: Record<string, unknown>): Promise<string | null> {
  // 1. Initialize MCP session
  await mcpCall({ jsonrpc: "2.0", method: "initialize", id: 1, params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "slidein", version: "1.0" }
  }});

  // 2. Call generate_image tool
  const result = await mcpCall({
    jsonrpc: "2.0",
    method: "tools/call",
    id: 2,
    params: {
      name: "generate_image",
      arguments: { params }
    }
  }) as Record<string, unknown>;

  // 3. Extract image URL from result
  const content = (result?.result as Record<string, unknown>)?.content;
  const text = Array.isArray(content)
    ? content.find((c: Record<string, unknown>) => c.type === "text")?.text
    : typeof content === "string" ? content : null;

  if (!text) return null;

  // Parse result to find URL
  try {
    const parsed = JSON.parse(text as string);
    const items = parsed?.results ?? parsed?.images ?? [parsed];
    for (const item of items) {
      const url = item?.rawUrl ?? item?.url ?? item?.results?.rawUrl;
      if (url) return url as string;
    }
  } catch {
    // Try regex fallback
    const match = (text as string).match(/https?:\/\/[^\s"']+\.(?:png|jpg|webp)/i);
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
      model: "nano_banana_2",
      prompt,
      aspect_ratio,
      resolution: res_param,
    };

    if (inputImages.length > 0) {
      params.medias = inputImages.map((img: { id?: string; url: string }) => ({
        role: "image",
        value: img.url,
      }));
      console.log("[image-generate] MCP with", inputImages.length, "image(s)");
    }

    console.log("[image-generate] calling mcp.higgsfield.ai generate_image");

    const generateOne = async (): Promise<string | null> => {
      return generateImage(params);
    };

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

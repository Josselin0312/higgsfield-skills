import { NextResponse } from "next/server";
import { HiggsfieldClient } from "@higgsfield/client";

export const runtime = "nodejs";

function makeClient() {
  return new HiggsfieldClient({
    apiKey: process.env.HIGGSFIELD_KEY_ID ?? "",
    apiSecret: process.env.HIGGSFIELD_KEY_SECRET ?? "",
    timeout: 30000,
    maxPollTime: 30000,
    pollInterval: 4000,
  });
}

const PUBLIC_IMG = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Gatto_europeo4.jpg/320px-Gatto_europeo4.jpg";

export async function GET() {
  const client = makeClient();
  const results: Record<string, unknown>[] = [];

  const tests = [
    // nano-banana-2 variants (what MCP actually used)
    { endpoint: "/v1/text2image/nano-banana-2", label: "nb2 no images", params: { prompt: "test", aspect_ratio: "1:1" } },
    { endpoint: "/v1/text2image/nano-banana-2", label: "nb2 empty images", params: { prompt: "test", aspect_ratio: "1:1", input_images: [] } },
    { endpoint: "/v1/text2image/nano-banana-2", label: "nb2 public image", params: { prompt: "test", aspect_ratio: "1:1", resolution: "1k", batch_size: 1, input_images: [{ type: "image_url", image_url: PUBLIC_IMG }] } },
    // image2image endpoint variant
    { endpoint: "/v1/image2image/nano-banana", label: "img2img nano-banana", params: { prompt: "test", aspect_ratio: "1:1", input_images: [{ type: "image_url", image_url: PUBLIC_IMG }] } },
    // nano-banana-pro
    { endpoint: "/v1/text2image/nano-banana-pro", label: "nb-pro", params: { prompt: "test", aspect_ratio: "1:1", input_images: [{ type: "image_url", image_url: PUBLIC_IMG }] } },
  ];

  for (const t of tests) {
    try {
      const jobSet = await client.generate(t.endpoint, t.params, { withPolling: false });
      results.push({ label: t.label, endpoint: t.endpoint, status: "ok", data: jobSet });
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string; data?: unknown };
      results.push({ label: t.label, endpoint: t.endpoint, status: e.statusCode ?? "error", message: e.message });
    }
  }

  return NextResponse.json({ results });
}

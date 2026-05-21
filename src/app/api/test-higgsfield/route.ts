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

const PUBLIC_TEST_IMAGE = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Gatto_europeo4.jpg/320px-Gatto_europeo4.jpg";

export async function GET() {
  const client = makeClient();
  const results: Record<string, unknown>[] = [];

  const tests = [
    // Test 1: no input_images (expect 422 - missing field)
    { label: "no input_images", params: { prompt: "test person", aspect_ratio: "1:1" } },
    // Test 2: empty input_images array
    { label: "empty input_images []", params: { prompt: "test person", aspect_ratio: "1:1", input_images: [] } },
    // Test 3: public URL image
    { label: "public image URL", params: { prompt: "test person", aspect_ratio: "1:1", input_images: [{ type: "image_url", image_url: PUBLIC_TEST_IMAGE }] } },
    // Test 4: public URL + resolution
    { label: "public image + resolution 1k", params: { prompt: "test person", aspect_ratio: "1:1", resolution: "1k", input_images: [{ type: "image_url", image_url: PUBLIC_TEST_IMAGE }] } },
  ];

  for (const t of tests) {
    try {
      const jobSet = await client.generate("/v1/text2image/nano-banana", t.params, { withPolling: false });
      results.push({ label: t.label, status: "ok", data: jobSet });
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string; data?: unknown };
      results.push({ label: t.label, status: e.statusCode ?? "error", message: e.message, data: e.data });
    }
  }

  return NextResponse.json({ results });
}

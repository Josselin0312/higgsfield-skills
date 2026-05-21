import { NextResponse } from "next/server";
import https from "https";

export const runtime = "nodejs";

const BASE_HOST = "platform.higgsfield.ai";

function httpsPost(path: string, headers: Record<string, string>, body: unknown): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(
      {
        hostname: BASE_HOST,
        path,
        method: "POST",
        headers: { ...headers, "Content-Length": Buffer.byteLength(payload) },
        timeout: 15000,
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try { resolve({ status: res.statusCode ?? 0, data: JSON.parse(raw) }); }
          catch { resolve({ status: res.statusCode ?? 0, data: raw }); }
        });
      }
    );
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
    req.on("error", (err) => reject(new Error(err.message)));
    req.write(payload);
    req.end();
  });
}

export async function GET() {
  const v1Headers = {
    "hf-api-key": process.env.HIGGSFIELD_KEY_ID ?? "",
    "hf-secret": process.env.HIGGSFIELD_KEY_SECRET ?? "",
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const v2Headers = {
    Authorization: `Key ${process.env.HIGGSFIELD_KEY_ID}:${process.env.HIGGSFIELD_KEY_SECRET}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const tests = [
    // V1 format (hf-api-key/hf-secret) + { params: {...} }
    { label: "V1 /v1/text2image/nano-banana-pro", path: "/v1/text2image/nano-banana-pro", headers: v1Headers, body: { params: { prompt: "test", width_and_height: "1536x1536", quality: "720p", batch_size: 1 } } },
    { label: "V1 /v1/text2image/nano-banana-2", path: "/v1/text2image/nano-banana-2", headers: v1Headers, body: { params: { prompt: "test", width_and_height: "1536x1536", quality: "720p", batch_size: 1 } } },
    { label: "V1 /v1/text2image/nano-banana", path: "/v1/text2image/nano-banana", headers: v1Headers, body: { params: { prompt: "test", width_and_height: "1536x1536", quality: "720p", batch_size: 1 } } },
    { label: "V1 /v1/text2image/nano_banana_pro", path: "/v1/text2image/nano_banana_pro", headers: v1Headers, body: { params: { prompt: "test", width_and_height: "1536x1536", quality: "720p", batch_size: 1 } } },
    // V2 format (Authorization: Key) + { input: {...} }
    { label: "V2 nano-banana-pro/text-to-image", path: "/nano-banana-pro/text-to-image", headers: v2Headers, body: { input: { prompt: "test", aspect_ratio: "1:1" } } },
    { label: "V2 nano-banana-2/text-to-image", path: "/nano-banana-2/text-to-image", headers: v2Headers, body: { input: { prompt: "test", aspect_ratio: "1:1" } } },
    { label: "V2 nano-banana-pro/standard", path: "/nano-banana-pro/standard", headers: v2Headers, body: { input: { prompt: "test", aspect_ratio: "1:1" } } },
  ];

  const results = await Promise.all(
    tests.map(async (t) => {
      try {
        const res = await httpsPost(t.path, t.headers, t.body);
        return { label: t.label, status: res.status, data: res.data };
      } catch (err) {
        return { label: t.label, status: "error", data: err instanceof Error ? err.message : String(err) };
      }
    })
  );

  const working = results.filter((r) => r.status !== 404 && r.status !== "error");

  return NextResponse.json({ working, all: results });
}

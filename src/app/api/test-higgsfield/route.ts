import { NextResponse } from "next/server";
import https from "https";

export const runtime = "nodejs";

const BASE_HOST = "platform.higgsfield.ai";

function authV2() {
  return `Key ${process.env.HIGGSFIELD_KEY_ID}:${process.env.HIGGSFIELD_KEY_SECRET}`;
}

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
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout 15s")); });
    req.on("error", (err) => reject(new Error(`Connexion: ${err.message}`)));
    req.write(payload);
    req.end();
  });
}

export async function GET() {
  const v2Headers = {
    Authorization: authV2(),
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const candidates = [
    "/higgsfield-ai/nano-banana-pro/standard",
    "/higgsfield-ai/nano-banana-2-pro/standard",
    "/higgsfield-ai/nano-banana-2/standard",
    "/higgsfield-ai/nano-banana/standard",
    "/higgsfield-ai/nanobanana-pro/standard",
    "/higgsfield-ai/nanobanana2pro/standard",
    "/higgsfield-ai/nano_banana_pro/standard",
    "/higgsfield-ai/nb-pro/standard",
  ];

  const body = { prompt: "test", aspect_ratio: "1:1", resolution: "720p" };

  const results = await Promise.all(
    candidates.map(async (path) => {
      try {
        const res = await httpsPost(path, v2Headers, body);
        return { path, status: res.status, data: res.data };
      } catch (err) {
        return { path, status: "error", data: err instanceof Error ? err.message : String(err) };
      }
    })
  );

  // Highlight anything that's NOT 404
  const working = results.filter((r) => r.status !== 404 && r.status !== "error");

  return NextResponse.json({ working, all: results });
}

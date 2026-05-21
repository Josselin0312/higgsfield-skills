import { NextResponse } from "next/server";
import https from "https";

export const runtime = "nodejs";

const BASE_HOST = "platform.higgsfield.ai";

function v1Headers() {
  return {
    "hf-api-key": process.env.HIGGSFIELD_KEY_ID ?? "",
    "hf-secret": process.env.HIGGSFIELD_KEY_SECRET ?? "",
    "Content-Type": "application/json",
    Accept: "application/json",
  };
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
    req.on("error", (err) => reject(new Error(`Connexion échouée: ${err.message}`)));
    req.write(payload);
    req.end();
  });
}

export async function GET() {
  const results: Record<string, unknown> = {
    keyId: process.env.HIGGSFIELD_KEY_ID ? `${process.env.HIGGSFIELD_KEY_ID.slice(0, 8)}...` : "MANQUANT",
    keySecret: process.env.HIGGSFIELD_KEY_SECRET ? "présent" : "MANQUANT",
    endpoints: [],
  };

  const tests = [
    {
      label: "Soul V1 (hf-api-key/hf-secret)",
      path: "/v1/text2image/soul",
      headers: v1Headers(),
      body: { params: { prompt: "test", width_and_height: "1536x1536", quality: "720p", batch_size: 1 } },
    },
  ];

  const endpointResults = [];
  for (const t of tests) {
    try {
      const res = await httpsPost(t.path, t.headers, t.body);
      endpointResults.push({ endpoint: t.label, status: res.status, response: res.data });
    } catch (err) {
      endpointResults.push({ endpoint: t.label, status: "error", error: err instanceof Error ? err.message : String(err) });
    }
  }

  results.endpoints = endpointResults;
  return NextResponse.json(results);
}

import { NextResponse } from "next/server";
import https from "https";

export const runtime = "nodejs";

const BASE_HOST = "platform.higgsfield.ai";

function authHeader() {
  return `Key ${process.env.HIGGSFIELD_KEY_ID}:${process.env.HIGGSFIELD_KEY_SECRET}`;
}

function httpsPost(path: string, body: unknown): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(
      {
        hostname: BASE_HOST,
        path,
        method: "POST",
        headers: {
          Authorization: authHeader(),
          "Content-Type": "application/json",
          Accept: "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
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
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout 15s — le serveur Higgsfield ne répond pas")); });
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

  const endpoints = [
    "/higgsfield-ai/soul/standard",
    "/higgsfield-ai/nano-banana-2/standard",
    "/higgsfield-ai/nano-banana-pro/standard",
  ];

  const endpointResults = [];
  for (const endpoint of endpoints) {
    try {
      const res = await httpsPost(endpoint, {
        prompt: "test connection",
        aspect_ratio: "1:1",
        resolution: "720p",
      });
      endpointResults.push({ endpoint, status: res.status, ok: res.status < 500 });
    } catch (err) {
      endpointResults.push({ endpoint, status: "error", error: err instanceof Error ? err.message : String(err) });
    }
  }

  results.endpoints = endpointResults;
  return NextResponse.json(results);
}

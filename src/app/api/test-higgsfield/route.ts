import { NextResponse } from "next/server";
import https from "https";

export const runtime = "nodejs";

const KEY_ID = process.env.HIGGSFIELD_KEY_ID ?? "";
const KEY_SECRET = process.env.HIGGSFIELD_KEY_SECRET ?? "";
const HF_IMG = "https://d8j0ntlcm91z4.cloudfront.net/user_3C2oykwvPsJcjrjbFKJ9v1TZm2E/hf_20260521_211012_5bc0ca56-28d9-466c-83ba-8169581e2e4c.png";

function post(hostname: string, path: string, body: unknown, headers: Record<string, string>): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve) => {
    const payload = JSON.stringify(body);
    const req = https.request({
      hostname, path, method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload), ...headers },
      timeout: 12000,
    }, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode ?? 0, data: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode ?? 0, data: raw.slice(0, 200) }); }
      });
    });
    req.on("error", (e) => resolve({ status: -1, data: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ status: -2, data: "timeout" }); });
    req.write(payload);
    req.end();
  });
}

const V1H = { "hf-api-key": KEY_ID, "hf-secret": KEY_SECRET };
const V2H = { "Authorization": `Key ${KEY_ID}:${KEY_SECRET}` };

export async function GET() {
  const tests: { label: string; host: string; path: string; body: unknown; headers: Record<string, string> }[] = [
    // ---- platform.higgsfield.ai ----
    // V1 nano-banana: text only (empty input_images)
    { label: "V1 nano-banana empty[]", host: "platform.higgsfield.ai", path: "/v1/text2image/nano-banana", body: { params: { prompt: "a woman in a city", aspect_ratio: "1:1", input_images: [] } }, headers: V1H },
    // V2 nano-banana-2 — different path styles
    { label: "V2 /nano_banana_2", host: "platform.higgsfield.ai", path: "/nano_banana_2", body: { prompt: "test", aspect_ratio: "1:1" }, headers: V2H },
    { label: "V2 /v2/text2image/nano-banana-2", host: "platform.higgsfield.ai", path: "/v2/text2image/nano-banana-2", body: { prompt: "test", aspect_ratio: "1:1" }, headers: V2H },
    { label: "V2 /v1/generate/nano_banana_2", host: "platform.higgsfield.ai", path: "/v1/generate/nano_banana_2", body: { prompt: "test", aspect_ratio: "1:1" }, headers: V2H },
    { label: "V2 /generate/nano_banana_2", host: "platform.higgsfield.ai", path: "/generate/nano_banana_2", body: { prompt: "test", aspect_ratio: "1:1" }, headers: V2H },
    // V1 nano-banana-2 (params wrapped)
    { label: "V1 params /v1/text2image/nano-banana-2", host: "platform.higgsfield.ai", path: "/v1/text2image/nano-banana-2", body: { params: { prompt: "test", aspect_ratio: "1:1" } }, headers: V1H },
    // ---- app.higgsfield.ai ----
    { label: "app.higgsfield.ai /nano_banana_2 V2", host: "app.higgsfield.ai", path: "/nano_banana_2", body: { prompt: "test", aspect_ratio: "1:1" }, headers: V2H },
    { label: "app.higgsfield.ai /v1/text2image/nano-banana-2 V1", host: "app.higgsfield.ai", path: "/v1/text2image/nano-banana-2", body: { params: { prompt: "test", aspect_ratio: "1:1" } }, headers: V1H },
    // ---- api.higgsfield.ai ----
    { label: "api.higgsfield.ai /nano_banana_2 V2", host: "api.higgsfield.ai", path: "/nano_banana_2", body: { prompt: "test", aspect_ratio: "1:1" }, headers: V2H },
    { label: "api.higgsfield.ai /v1/text2image/nano-banana-2 V1", host: "api.higgsfield.ai", path: "/v1/text2image/nano-banana-2", body: { params: { prompt: "test", aspect_ratio: "1:1" } }, headers: V1H },
    // V1 nano-banana AVEC image (test si CDN URL valide)
    { label: "V1 nano-banana + image_url HF", host: "platform.higgsfield.ai", path: "/v1/text2image/nano-banana", body: { params: { prompt: "reproduce this scene", aspect_ratio: "1:1", input_images: [{ type: "image_url", image_url: HF_IMG }] } }, headers: V1H },
  ];

  const results = await Promise.all(
    tests.map(async (t) => {
      const r = await post(t.host, t.path, t.body, t.headers);
      return { label: t.label, status: r.status, data: r.data };
    })
  );

  // Highlight anything that's NOT 404/403
  const working = results.filter(r => r.status !== 404 && r.status !== 403 && r.status !== -1 && r.status !== -2);

  return NextResponse.json({ working, all: results });
}

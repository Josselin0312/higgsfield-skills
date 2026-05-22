import { NextResponse } from "next/server";
import { HiggsfieldClient, createHiggsfieldClient } from "@higgsfield/client";
import https from "https";

export const runtime = "nodejs";

// Real Higgsfield CDN URL from actual generation history (always accessible)
const REAL_HF_IMG = "https://d8j0ntlcm91z4.cloudfront.net/user_3C2oykwvPsJcjrjbFKJ9v1TZm2E/hf_20260521_211012_5bc0ca56-28d9-466c-83ba-8169581e2e4c.png";

function makeV1Client() {
  return new HiggsfieldClient({
    apiKey: process.env.HIGGSFIELD_KEY_ID ?? "",
    apiSecret: process.env.HIGGSFIELD_KEY_SECRET ?? "",
    timeout: 15000,
    maxPollTime: 10000,
    pollInterval: 3000,
    maxRetries: 0,
  });
}

function makeV2Client() {
  return createHiggsfieldClient({
    apiKey: process.env.HIGGSFIELD_KEY_ID ?? "",
    apiSecret: process.env.HIGGSFIELD_KEY_SECRET ?? "",
    timeout: 15000,
    maxPollTime: 10000,
    pollInterval: 3000,
    maxRetries: 0,
  });
}

// Raw https request to test endpoint directly (bypasses SDK wrapping)
function rawPost(path: string, body: unknown, authV2 = false): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve) => {
    const payload = JSON.stringify(body);
    const headers: Record<string, string | number> = {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
    };
    if (authV2) {
      headers["Authorization"] = `Key ${process.env.HIGGSFIELD_KEY_ID}:${process.env.HIGGSFIELD_KEY_SECRET}`;
    } else {
      headers["hf-api-key"] = process.env.HIGGSFIELD_KEY_ID ?? "";
      headers["hf-secret"] = process.env.HIGGSFIELD_KEY_SECRET ?? "";
    }
    const r = https.request({ hostname: "platform.higgsfield.ai", path, method: "POST", headers, timeout: 15000 }, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode ?? 0, data: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode ?? 0, data: raw }); }
      });
    });
    r.on("error", (e) => resolve({ status: -1, data: e.message }));
    r.on("timeout", () => { r.destroy(); resolve({ status: -2, data: "timeout" }); });
    r.write(payload);
    r.end();
  });
}

export async function GET() {
  const results: Record<string, unknown>[] = [];

  // --- V1 SDK tests (wraps body in { params: {...} }) ---
  const v1Client = makeV1Client();
  const v1Tests = [
    { label: "V1 nano-banana no images", endpoint: "/v1/text2image/nano-banana", params: { prompt: "test", aspect_ratio: "1:1" } },
    { label: "V1 nano-banana image_url real", endpoint: "/v1/text2image/nano-banana", params: { prompt: "test", aspect_ratio: "1:1", input_images: [{ type: "image_url", image_url: REAL_HF_IMG }] } },
    { label: "V1 nano-banana-2 no images", endpoint: "/v1/text2image/nano-banana-2", params: { prompt: "test", aspect_ratio: "1:1" } },
    { label: "V1 nano-banana-2 image_url real", endpoint: "/v1/text2image/nano-banana-2", params: { prompt: "test", aspect_ratio: "1:1", input_images: [{ type: "image_url", image_url: REAL_HF_IMG }] } },
    { label: "V1 nano-banana-2 media_input real", endpoint: "/v1/text2image/nano-banana-2", params: { prompt: "test", aspect_ratio: "1:1", input_images: [{ id: "5bc0ca56-28d9-466c-83ba-8169581e2e4c", type: "media_input", url: REAL_HF_IMG }] } },
  ];

  for (const t of v1Tests) {
    try {
      const jobSet = await v1Client.generate(t.endpoint, t.params, { withPolling: false });
      results.push({ label: t.label, status: "ok", data: jobSet });
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string; data?: unknown };
      results.push({ label: t.label, status: e.statusCode ?? "error", message: e.message, data: e.data });
    }
  }

  // --- V2 SDK tests (sends body directly, Authorization: Key header) ---
  const v2Client = makeV2Client();
  const v2Tests = [
    // nano_banana_pro (what the user actually uses)
    { label: "V2 /nano_banana_pro no images", endpoint: "/nano_banana_pro", input: { prompt: "test", aspect_ratio: "1:1" } },
    { label: "V2 /nano_banana_pro medias real", endpoint: "/nano_banana_pro", input: { prompt: "test", aspect_ratio: "1:1", medias: [{ role: "image", value: REAL_HF_IMG }] } },
    { label: "V2 /nano-banana-pro no images", endpoint: "/nano-banana-pro", input: { prompt: "test", aspect_ratio: "1:1" } },
    { label: "V2 /v1/text2image/nano-banana-pro no images", endpoint: "/v1/text2image/nano-banana-pro", input: { prompt: "test", aspect_ratio: "1:1" } },
    { label: "V2 /v1/text2image/nano-banana-pro medias real", endpoint: "/v1/text2image/nano-banana-pro", input: { prompt: "test", aspect_ratio: "1:1", medias: [{ role: "image", value: REAL_HF_IMG }] } },
    // nano_banana_2 fallback
    { label: "V2 /nano_banana_2 no images", endpoint: "/nano_banana_2", input: { prompt: "test", aspect_ratio: "1:1" } },
    { label: "V2 /nano_banana_2 medias real", endpoint: "/nano_banana_2", input: { prompt: "test", aspect_ratio: "1:1", medias: [{ role: "image", value: REAL_HF_IMG }] } },
    { label: "V2 /v1/text2image/nano-banana-2 no images", endpoint: "/v1/text2image/nano-banana-2", input: { prompt: "test", aspect_ratio: "1:1" } },
    { label: "V2 /v1/text2image/nano-banana-2 medias real", endpoint: "/v1/text2image/nano-banana-2", input: { prompt: "test", aspect_ratio: "1:1", medias: [{ role: "image", value: REAL_HF_IMG }] } },
  ];

  for (const t of v2Tests) {
    try {
      const result = await v2Client.subscribe(t.endpoint, { input: t.input, withPolling: false });
      results.push({ label: t.label, status: "ok", data: result });
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string; data?: unknown };
      results.push({ label: t.label, status: e.statusCode ?? "error", message: e.message, data: e.data });
    }
  }

  // --- Raw https tests (direct control over body format) ---
  const rawTests = [
    // V2 auth — nano_banana_pro
    { label: "RAW V2 /nano_banana_pro medias", path: "/nano_banana_pro", body: { prompt: "test", aspect_ratio: "1:1", medias: [{ role: "image", value: REAL_HF_IMG }] }, v2: true },
    { label: "RAW V2 /v1/text2image/nano-banana-pro medias", path: "/v1/text2image/nano-banana-pro", body: { prompt: "test", aspect_ratio: "1:1", medias: [{ role: "image", value: REAL_HF_IMG }] }, v2: true },
    // V2 auth — nano_banana_2
    { label: "RAW V2 /nano_banana_2 medias", path: "/nano_banana_2", body: { prompt: "test", aspect_ratio: "1:1", medias: [{ role: "image", value: REAL_HF_IMG }] }, v2: true },
    { label: "RAW V2 /v1/text2image/nano-banana-2 medias", path: "/v1/text2image/nano-banana-2", body: { prompt: "test", aspect_ratio: "1:1", medias: [{ role: "image", value: REAL_HF_IMG }] }, v2: true },
    // V1 auth — nano-banana with real HF CDN image
    { label: "RAW V1 /v1/text2image/nano-banana image_url real", path: "/v1/text2image/nano-banana", body: { params: { prompt: "test", aspect_ratio: "1:1", input_images: [{ type: "image_url", image_url: REAL_HF_IMG }] } }, v2: false },
  ];

  for (const t of rawTests) {
    const result = await rawPost(t.path, t.body, t.v2);
    results.push({ label: t.label, status: result.status, data: result.data });
  }

  return NextResponse.json({ results });
}

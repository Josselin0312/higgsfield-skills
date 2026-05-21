import { NextRequest, NextResponse } from "next/server";
import https from "https";

export const runtime = "nodejs";
export const maxDuration = 300;

const BASE_HOST = "platform.higgsfield.ai";

const ASPECT_RATIO: Record<string, string> = {
  "1024x1024": "1:1",
  "1080x1350": "4:5",
  "1080x1920": "9:16",
  "1920x1080": "16:9",
  "1200x800": "3:2",
  "800x1200": "2:3",
};

const QUALITY_MAP: Record<string, string> = {
  "1K": "720p",
  "2K": "1080p",
  "4K": "4k",
};

const MODEL_ENDPOINTS = [
  "/higgsfield-ai/nano-banana-2/standard",
  "/higgsfield-ai/nano-banana-pro/standard",
  "/higgsfield-ai/nano_banana_2/standard",
  "/higgsfield-ai/nano-banana/standard",
];

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
        timeout: 30000,
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
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timeout (30s)")); });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

function httpsGet(path: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: BASE_HOST,
        path,
        method: "GET",
        headers: { Authorization: authHeader(), Accept: "application/json" },
        timeout: 15000,
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try { resolve(JSON.parse(raw)); }
          catch { resolve(raw); }
        });
      }
    );
    req.on("timeout", () => { req.destroy(); reject(new Error("Poll timeout")); });
    req.on("error", reject);
    req.end();
  });
}

async function uploadBase64(base64: string): Promise<string> {
  const [header, data] = base64.split(",");
  const contentType = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";

  const urlRes = await httpsPost("/files/generate-upload-url", { content_type: contentType });
  if (urlRes.status >= 400) throw new Error(`Upload URL error ${urlRes.status}: ${JSON.stringify(urlRes.data)}`);
  const { upload_url, public_url } = urlRes.data as { upload_url: string; public_url: string };

  // PUT to upload_url (may be S3, use standard fetch)
  const buffer = Buffer.from(data, "base64");
  await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: buffer,
  });

  return public_url;
}

async function pollResult(requestId: string, maxMs = 240000): Promise<string | null> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 4000));
    try {
      const data = await httpsGet(`/requests/${requestId}/status`) as Record<string, unknown>;
      if (data.status === "completed") {
        const images = data.images as Array<{ url: string }> | undefined;
        const video = data.video as { url: string } | undefined;
        return images?.[0]?.url ?? video?.url ?? null;
      }
      if (data.status === "failed" || data.status === "nsfw") return null;
    } catch { /* continue polling */ }
  }
  return null;
}

async function generateOne(endpoint: string, body: Record<string, unknown>): Promise<string | null> {
  const res = await httpsPost(endpoint, body);
  if (res.status >= 400) throw new Error(`${res.status}: ${JSON.stringify(res.data)}`);

  const data = res.data as Record<string, unknown>;
  const images = data.images as Array<{ url: string }> | undefined;
  if (images?.[0]?.url) return images[0].url;

  const requestId = (data.request_id ?? data.id) as string | undefined;
  if (requestId) return pollResult(requestId);

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, resolution, quality, count, imageInput = [], imageReproduction = [] } = await req.json();

    if (!prompt?.trim()) return NextResponse.json({ error: "Prompt requis" }, { status: 400 });

    const aspect_ratio = ASPECT_RATIO[resolution] ?? "1:1";
    const res_quality = QUALITY_MAP[quality] ?? "1080p";

    // Upload reference images
    const allRefs = [...imageInput, ...imageReproduction].filter(Boolean);
    const uploadedUrls = await Promise.all(
      allRefs.map((img: string) =>
        img.startsWith("data:") ? uploadBase64(img) : Promise.resolve(img)
      )
    );
    const input_images = uploadedUrls.map((url) => ({ type: "image_url", image_url: url }));

    const body: Record<string, unknown> = { prompt, aspect_ratio, resolution: res_quality };
    if (input_images.length > 0) body.input_images = input_images;

    // Try each endpoint until one works
    let lastError = "";
    let workingEndpoint = "";
    for (const endpoint of MODEL_ENDPOINTS) {
      try {
        const firstUrl = await generateOne(endpoint, body);
        workingEndpoint = endpoint;

        const actualCount = Math.min(count, 8);
        const images: string[] = firstUrl ? [firstUrl] : [];

        if (actualCount > 1) {
          const rest = await Promise.allSettled(
            Array.from({ length: actualCount - 1 }, () => generateOne(workingEndpoint, body))
          );
          rest.forEach((r) => { if (r.status === "fulfilled" && r.value) images.push(r.value); });
        }

        return NextResponse.json({ images, endpoint: workingEndpoint });
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.error(`[image-generate] "${endpoint}" →`, lastError);
      }
    }

    return NextResponse.json({ error: `Échec. Dernière erreur: ${lastError}` }, { status: 500 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[image-generate]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

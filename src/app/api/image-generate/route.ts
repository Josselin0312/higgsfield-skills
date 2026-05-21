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
  "1200x800":  "3:2",
  "800x1200":  "2:3",
};

const SOUL_SIZE: Record<string, string> = {
  "1024x1024": "1536x1536",
  "1080x1350": "1152x1536",
  "1080x1920": "1152x2048",
  "1920x1080": "2048x1152",
  "1200x800":  "2048x1536",
  "800x1200":  "1536x2048",
};

const QUALITY_MAP: Record<string, string> = {
  "1K": "720p",
  "2K": "1080p",
  "4K": "1080p",
};

function v1Headers() {
  return {
    "hf-api-key": process.env.HIGGSFIELD_KEY_ID ?? "",
    "hf-secret": process.env.HIGGSFIELD_KEY_SECRET ?? "",
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function httpsRequest(
  method: string,
  path: string,
  headers: Record<string, string>,
  body?: unknown,
  timeoutMs = 120000
): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const payload = body !== undefined ? JSON.stringify(body) : undefined;
    const req = https.request(
      {
        hostname: BASE_HOST,
        path,
        method,
        headers: {
          ...headers,
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        },
        timeout: timeoutMs,
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
    req.on("timeout", () => { req.destroy(); reject(new Error(`Timeout ${timeoutMs / 1000}s`)); });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function uploadBase64(base64: string): Promise<string> {
  const [header, data] = base64.split(",");
  const contentType = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";

  const urlRes = await httpsRequest("POST", "/files/generate-upload-url", v1Headers(), { content_type: contentType });
  if (urlRes.status >= 400) throw new Error(`Upload URL error ${urlRes.status}: ${JSON.stringify(urlRes.data)}`);
  const { upload_url, public_url } = urlRes.data as { upload_url: string; public_url: string };

  const buffer = Buffer.from(data, "base64");
  const uploadUrl = new URL(upload_url);
  await new Promise<void>((resolve, reject) => {
    const req = https.request(
      {
        hostname: uploadUrl.hostname,
        path: uploadUrl.pathname + uploadUrl.search,
        method: "PUT",
        headers: { "Content-Type": contentType, "Content-Length": buffer.length },
        timeout: 120000,
      },
      (res) => { res.resume(); res.on("end", resolve); }
    );
    req.on("timeout", () => { req.destroy(); reject(new Error("Upload timeout")); });
    req.on("error", reject);
    req.write(buffer);
    req.end();
  });

  return public_url;
}

async function pollResult(requestId: string, maxMs = 240000): Promise<string | null> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 4000));
    try {
      const res = await httpsRequest("GET", `/requests/${requestId}/status`, v1Headers(), undefined, 15000);
      const data = res.data as Record<string, unknown>;
      if (data.status === "completed") {
        const images = data.images as Array<{ url: string }> | undefined;
        const video = data.video as { url: string } | undefined;
        return images?.[0]?.url ?? video?.url ?? null;
      }
      if (data.status === "failed" || data.status === "nsfw") return null;
    } catch { /* continue */ }
  }
  return null;
}

async function generateOne(params: Record<string, unknown>): Promise<string | null> {
  const res = await httpsRequest("POST", "/v1/text2image/nano-banana", v1Headers(), { params });
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

    // nano-banana requires input_images — use Image Input, fallback to Goal image
    const refImages: string[] = imageInput.length > 0 ? imageInput : imageReproduction;
    if (refImages.length === 0) {
      return NextResponse.json({ error: "Ajoute au moins une image dans 'Image Input' (photo de référence de la personne)" }, { status: 400 });
    }

    const aspect_ratio = ASPECT_RATIO[resolution] ?? "1:1";
    const width_and_height = SOUL_SIZE[resolution] ?? "1536x1536";
    const q = QUALITY_MAP[quality] ?? "1080p";
    const actualCount = Math.min(Math.max(1, count), 8);

    // Upload reference images to Higgsfield CDN
    const uploadedUrls = await Promise.all(
      refImages.map((img: string) =>
        img.startsWith("data:") ? uploadBase64(img) : Promise.resolve(img)
      )
    );
    const input_images = uploadedUrls.map((url) => ({ type: "image_url", image_url: url }));

    const params: Record<string, unknown> = {
      prompt,
      aspect_ratio,
      width_and_height,
      quality: q,
      batch_size: 1,
      input_images,
    };

    // Generate first image
    const firstUrl = await generateOne(params);
    const images: string[] = firstUrl ? [firstUrl] : [];

    // Generate remaining in parallel
    if (actualCount > 1) {
      const rest = await Promise.allSettled(
        Array.from({ length: actualCount - 1 }, () => generateOne(params))
      );
      rest.forEach((r) => { if (r.status === "fulfilled" && r.value) images.push(r.value); });
    }

    return NextResponse.json({ images });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[image-generate]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

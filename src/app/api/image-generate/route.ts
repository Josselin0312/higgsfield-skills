import { NextRequest, NextResponse } from "next/server";
import https from "https";

export const runtime = "nodejs";
export const maxDuration = 300;

const BASE_HOST = "platform.higgsfield.ai";

// Map user resolution to Soul API width_and_height
const SOUL_SIZE: Record<string, string> = {
  "1024x1024": "1536x1536",
  "1080x1350": "1152x1536",
  "1080x1920": "1152x2048",
  "1920x1080": "2048x1152",
  "1200x800":  "2048x1536",
  "800x1200":  "1536x2048",
};

// Soul quality: 720p or 1080p only
const SOUL_QUALITY: Record<string, string> = {
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
  body?: unknown
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
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout 30s")); });
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
        timeout: 30000,
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

async function createSoulId(imageUrls: string[]): Promise<string | null> {
  const input_images = imageUrls.map((url) => ({ type: "image_url", image_url: url }));
  const res = await httpsRequest("POST", "/v1/custom-references", v1Headers(), {
    name: "ref-" + Date.now(),
    input_images,
  });
  if (res.status >= 400) return null;

  const data = res.data as Record<string, unknown>;
  const id = (data.id ?? data.request_id) as string | undefined;
  if (!id) return null;

  // Poll until SoulId is ready (up to 120s)
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    const poll = await httpsRequest("GET", `/v1/custom-references/${id}`, v1Headers()) as { status: number; data: Record<string, unknown> };
    const status = (poll.data as Record<string, unknown>).status as string | undefined;
    if (status === "completed") return id;
    if (status === "failed") return null;
  }
  return null;
}

async function pollResult(requestId: string, maxMs = 240000): Promise<string | null> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 4000));
    try {
      const res = await httpsRequest("GET", `/requests/${requestId}/status`, v1Headers());
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

async function generateSoul(params: Record<string, unknown>): Promise<string | null> {
  const res = await httpsRequest("POST", "/v1/text2image/soul", v1Headers(), { params });
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

    const width_and_height = SOUL_SIZE[resolution] ?? "1536x2048";
    const q = SOUL_QUALITY[quality] ?? "1080p";
    const actualCount = Math.min(Math.max(1, count), 8);

    // Upload reference images (Image Input)
    let soulIdRef: string | null = null;
    const allRefs = [...imageInput, ...imageReproduction].filter(Boolean);
    if (allRefs.length > 0) {
      try {
        const uploadedUrls = await Promise.all(
          allRefs.map((img: string) =>
            img.startsWith("data:") ? uploadBase64(img) : Promise.resolve(img)
          )
        );
        soulIdRef = await createSoulId(uploadedUrls);
      } catch (err) {
        console.error("[image-generate] SoulId creation failed, continuing without reference:", err);
      }
    }

    const soulParams: Record<string, unknown> = {
      prompt,
      width_and_height,
      quality: q,
      batch_size: 1,
    };
    if (soulIdRef) {
      soulParams.custom_reference_id = soulIdRef;
      soulParams.custom_reference_strength = 1.0;
    }

    // Generate first image
    const firstUrl = await generateSoul(soulParams);
    const images: string[] = firstUrl ? [firstUrl] : [];

    // Generate remaining images in parallel
    if (actualCount > 1) {
      const rest = await Promise.allSettled(
        Array.from({ length: actualCount - 1 }, () => generateSoul(soulParams))
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

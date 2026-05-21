import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const BASE = "https://platform.higgsfield.ai";

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

// Candidates in order — all follow higgsfield-ai/{model}/standard pattern
const MODEL_ENDPOINTS = [
  "higgsfield-ai/nano-banana-2/standard",
  "higgsfield-ai/nano-banana-pro/standard",
  "higgsfield-ai/nano_banana_2/standard",
  "higgsfield-ai/nano-banana/standard",
];

function authHeader() {
  return `Key ${process.env.HIGGSFIELD_KEY_ID}:${process.env.HIGGSFIELD_KEY_SECRET}`;
}

async function uploadBase64(base64: string): Promise<string> {
  const [header, data] = base64.split(",");
  const contentType = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const buffer = Buffer.from(data, "base64");

  // Step 1: get upload URL
  const urlRes = await fetch(`${BASE}/files/generate-upload-url`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content_type: contentType }),
  });
  if (!urlRes.ok) throw new Error(`Upload URL error ${urlRes.status}: ${await urlRes.text()}`);
  const { upload_url, public_url } = await urlRes.json();

  // Step 2: PUT the file
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
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(`${BASE}/requests/${requestId}/status`, {
      headers: { Authorization: authHeader() },
    });
    if (!res.ok) continue;
    const data = await res.json();
    if (data.status === "completed") {
      return data.images?.[0]?.url ?? data.video?.url ?? null;
    }
    if (data.status === "failed" || data.status === "nsfw") return null;
  }
  return null;
}

async function generateOne(
  endpoint: string,
  body: Record<string, unknown>
): Promise<string | null> {
  const res = await fetch(`${BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${res.status}: ${txt}`);
  }

  const data = await res.json();

  // Immediate result
  if (data.images?.[0]?.url) return data.images[0].url;

  // Async — poll
  const requestId = data.request_id ?? data.id;
  if (requestId) return pollResult(requestId);

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, resolution, quality, count, imageInput = [], imageReproduction = [] } =
      await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt requis" }, { status: 400 });
    }

    // Quick connectivity test
    try {
      const ping = await fetch(`${BASE}/health`, {
        method: "GET",
        headers: { Authorization: authHeader() },
        signal: AbortSignal.timeout(8000),
      });
      console.log("[image-generate] ping status:", ping.status);
    } catch (pingErr: unknown) {
      const cause = (pingErr as any)?.cause;
      const detail = `${pingErr instanceof Error ? pingErr.message : String(pingErr)}${cause ? ` | ${cause?.message ?? cause?.code ?? cause}` : ""}`;
      return NextResponse.json({ error: `Connexion Higgsfield impossible: ${detail}` }, { status: 502 });
    }

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

    const body: Record<string, unknown> = {
      prompt,
      aspect_ratio,
      resolution: res_quality,
    };
    if (input_images.length > 0) body.input_images = input_images;

    // Try each endpoint until one succeeds
    let lastError = "";
    let workingEndpoint = "";
    for (const endpoint of MODEL_ENDPOINTS) {
      try {
        const firstUrl = await generateOne(endpoint, body);
        workingEndpoint = endpoint;

        // Generate remaining count-1 in parallel using the working endpoint
        const actualCount = Math.min(count, 8);
        const images: string[] = firstUrl ? [firstUrl] : [];

        if (actualCount > 1) {
          const rest = await Promise.allSettled(
            Array.from({ length: actualCount - 1 }, () => generateOne(workingEndpoint, body))
          );
          rest.forEach((r) => {
            if (r.status === "fulfilled" && r.value) images.push(r.value);
          });
        }

        return NextResponse.json({ images, endpoint: workingEndpoint });
      } catch (err) {
        const cause = (err as any)?.cause;
        lastError = `${err instanceof Error ? err.message : String(err)}${cause ? ` | cause: ${cause?.message ?? cause?.code ?? cause}` : ""}`;
        console.error(`[image-generate] "${endpoint}" →`, lastError);
      }
    }

    return NextResponse.json(
      { error: `Échec tous les endpoints. Dernière erreur: ${lastError}` },
      { status: 500 }
    );
  } catch (err: unknown) {
    const cause = (err as any)?.cause;
    const msg = `${err instanceof Error ? err.message : String(err)}${cause ? ` (cause: ${cause?.message ?? cause})` : ""}`;
    console.error("[image-generate]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

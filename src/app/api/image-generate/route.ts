import { NextRequest, NextResponse } from "next/server";
import { HiggsfieldClient } from "@higgsfield/client";

export const runtime = "nodejs";
export const maxDuration = 300;

const ASPECT_RATIO: Record<string, string> = {
  "1024x1024": "1:1",
  "1080x1350": "4:5",
  "1080x1920": "9:16",
  "1920x1080": "16:9",
  "1200x800": "3:2",
  "800x1200": "2:3",
};

// Candidate endpoints — ordered by most likely based on Higgsfield CLI model slug "nano_banana_2"
const ENDPOINTS = [
  "nano_banana_2/text-to-image",
  "/v1/text2image/nano_banana_2",
  "nano-banana-2/text-to-image",
  "/v1/generate/nano_banana_2",
  "nano_banana_2",
  "nano-banana-pro/text-to-image",
  "/v1/text2image/nano-banana-pro",
];

function makeClient() {
  return new HiggsfieldClient({
    apiKey: process.env.HIGGSFIELD_KEY_ID!,
    apiSecret: process.env.HIGGSFIELD_KEY_SECRET!,
  });
}

async function uploadBase64(client: HiggsfieldClient, base64: string): Promise<string> {
  const [header, data] = base64.split(",");
  const format = header.includes("png") ? "png" : header.includes("webp") ? "webp" : "jpeg";
  const buffer = Buffer.from(data, "base64");
  return client.uploadImage(buffer, format as "jpeg" | "png" | "webp");
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, resolution, count, imageInput = [], imageReproduction = [] } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt requis" }, { status: 400 });
    }

    const client = makeClient();
    const aspect_ratio = ASPECT_RATIO[resolution] ?? "1:1";

    // Upload reference images to get hosted URLs
    const allBase64Refs = [...imageInput, ...imageReproduction].filter(Boolean);
    const uploadedUrls = await Promise.all(
      allBase64Refs.map((img: string) =>
        img.startsWith("data:") ? uploadBase64(client, img) : Promise.resolve(img)
      )
    );

    const input_images = uploadedUrls.map((url) => ({
      type: "image_url" as const,
      image_url: url,
    }));

    // Try each endpoint until one works
    let lastError = "";
    for (const endpoint of ENDPOINTS) {
      try {
        const body: Record<string, unknown> = { prompt, aspect_ratio };
        if (input_images.length > 0) body.input_images = input_images;

        const jobSet = await client.generate(endpoint, body, { withPolling: true });

        // Success — collect images from all jobs
        const images: string[] = [];
        const actualCount = Math.min(count, 8);

        // First result already obtained, generate remaining in parallel if count > 1
        const allJobSets = [jobSet];
        if (actualCount > 1) {
          const rest = await Promise.allSettled(
            Array.from({ length: actualCount - 1 }, () =>
              client.generate(endpoint, body, { withPolling: true })
            )
          );
          rest.forEach((r) => {
            if (r.status === "fulfilled") allJobSets.push(r.value);
          });
        }

        for (const js of allJobSets) {
          for (const job of js.jobs) {
            const url = job.results?.raw?.url ?? job.results?.url ?? null;
            if (url) images.push(url);
          }
        }

        return NextResponse.json({ images, endpoint });
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.error(`[image-generate] endpoint "${endpoint}" failed:`, lastError);
        // Continue to next endpoint
      }
    }

    // All endpoints failed
    return NextResponse.json(
      { error: `Tous les endpoints ont échoué. Dernière erreur: ${lastError}` },
      { status: 500 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[image-generate] outer error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

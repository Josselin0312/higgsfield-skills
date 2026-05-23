import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const BASE = "https://platform.higgsfield.ai";

function auth() {
  return `Key ${process.env.HIGGSFIELD_KEY_ID}:${process.env.HIGGSFIELD_KEY_SECRET}`;
}

async function tryPost(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data: unknown;
  try { data = await res.json(); } catch { data = await res.text(); }
  return { status: res.status, data };
}

export async function GET() {
  const prompt = "a red apple";
  const base = { prompt, aspect_ratio: "1:1", resolution: "1k" };
  const withModel = { ...base, model: "nano_banana_pro" };

  const results = await Promise.all([
    tryPost("/requests",               withModel),
    tryPost("/v1/requests",            withModel),
    tryPost("/image/generate",         withModel),
    tryPost("/api/generate",           withModel),
    tryPost("/v2/generate",            withModel),
    tryPost("/v1/image/generate",      withModel),
    tryPost("/jobs",                   withModel),
    tryPost("/v1/jobs",                withModel),
    tryPost("/submit",                 withModel),
  ]);

  return NextResponse.json({
    "/requests":          results[0],
    "/v1/requests":       results[1],
    "/image/generate":    results[2],
    "/api/generate":      results[3],
    "/v2/generate":       results[4],
    "/v1/image/generate": results[5],
    "/jobs":              results[6],
    "/v1/jobs":           results[7],
    "/submit":            results[8],
  });
}

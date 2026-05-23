import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const BASE = "https://platform.higgsfield.ai";

function keyAuth() {
  return `Key ${process.env.HIGGSFIELD_KEY_ID}:${process.env.HIGGSFIELD_KEY_SECRET}`;
}

async function tryGet(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: keyAuth() },
  });
  let data: unknown;
  try { data = await res.json(); } catch { data = await res.text(); }
  return { status: res.status, data };
}

async function tryPost(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { Authorization: keyAuth(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data: unknown;
  try { data = await res.json(); } catch { data = await res.text(); }
  return { status: res.status, data };
}

export async function GET() {
  const body = { prompt: "a red apple", aspect_ratio: "1:1", resolution: "1k" };

  const results = await Promise.all([
    // Discover available models / routes
    tryGet("/models"),
    tryGet("/v1/models"),
    tryGet("/api/models"),
    tryGet("/"),
    tryGet("/v1"),
    // Known model paths
    tryPost("/higgsfield/nano_banana_pro", body),
    tryPost("/higgsfield-ai/nano_banana_pro", body),
    tryPost("/nano_banana_pro/v1/text-to-image", body),
    // Try reve with more credits context
    tryPost("/reve/text-to-image", body),
    tryPost("/reve", body),
  ]);

  return NextResponse.json({
    "GET /models":                          results[0],
    "GET /v1/models":                       results[1],
    "GET /api/models":                      results[2],
    "GET /":                                results[3],
    "GET /v1":                              results[4],
    "POST /higgsfield/nano_banana_pro":     results[5],
    "POST /higgsfield-ai/nano_banana_pro":  results[6],
    "POST /nano_banana_pro/v1/text-to-image": results[7],
    "POST /reve/text-to-image":             results[8],
    "POST /reve":                           results[9],
  });
}

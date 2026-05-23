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
    // POST on discovery endpoints (405 on GET means POST exists)
    tryPost("/models", {}),
    tryPost("/v1/models", {}),
    tryPost("/api/models", {}),
    tryPost("/", {}),
    tryPost("/v1", {}),
    // Check balance via REST API
    tryGet("/balance"),
    tryGet("/v1/balance"),
    tryGet("/credits"),
    // More nano_banana_pro variants
    tryPost("/nano_banana_pro", { ...body, model: "nano_banana_pro" }),
    tryPost("/image/nano_banana_pro", body),
  ]);

  return NextResponse.json({
    "POST /models":           results[0],
    "POST /v1/models":        results[1],
    "POST /api/models":       results[2],
    "POST /":                 results[3],
    "POST /v1":               results[4],
    "GET /balance":           results[5],
    "GET /v1/balance":        results[6],
    "GET /credits":           results[7],
    "POST /nano_banana_pro (with model field)": results[8],
    "POST /image/nano_banana_pro": results[9],
  });
}

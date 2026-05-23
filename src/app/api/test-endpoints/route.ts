import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BASE = "https://platform.higgsfield.ai";
const AUTH = `Key ${process.env.HIGGSFIELD_KEY_ID}:${process.env.HIGGSFIELD_KEY_SECRET}`;
const BODY = JSON.stringify({ prompt: "test", aspect_ratio: "1:1", resolution: "1k" });
const BODY_WITH_MODEL = JSON.stringify({ model: "nano_banana_pro", prompt: "test", aspect_ratio: "1:1", resolution: "1k" });

const TESTS = [
  { label: "POST /nano_banana_2",        url: `${BASE}/nano_banana_2`,        body: BODY },
  { label: "POST /nano_banana_pro",       url: `${BASE}/nano_banana_pro`,       body: BODY },
  { label: "POST /soul_2",               url: `${BASE}/soul_2`,               body: BODY },
  { label: "POST /image_auto",           url: `${BASE}/image_auto`,           body: BODY },
  { label: "POST /generate (body model)",url: `${BASE}/generate`,             body: BODY_WITH_MODEL },
  { label: "POST /v1/generate",          url: `${BASE}/v1/generate`,          body: BODY_WITH_MODEL },
  { label: "GET  /models",               url: `${BASE}/models`,               body: null },
];

export async function GET() {
  const results = await Promise.all(
    TESTS.map(async ({ label, url, body }) => {
      try {
        const res = await fetch(url, {
          method: body ? "POST" : "GET",
          headers: { Authorization: AUTH, "Content-Type": "application/json" },
          ...(body ? { body } : {}),
        });
        const text = await res.text();
        return { label, status: res.status, response: text.slice(0, 200) };
      } catch (e) {
        return { label, status: "error", response: String(e) };
      }
    })
  );

  return NextResponse.json(results, { status: 200 });
}

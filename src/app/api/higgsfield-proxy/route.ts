import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const BASE = "https://platform.higgsfield.ai";

// Secure proxy: browser sends the request body, server adds the auth header and forwards
export async function POST(req: NextRequest) {
  const { path, method = "POST", body } = await req.json();

  if (!path?.startsWith("/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const auth = `Key ${process.env.HIGGSFIELD_KEY_ID}:${process.env.HIGGSFIELD_KEY_SECRET}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { data = text; }

  return NextResponse.json(data, { status: res.status });
}

// Also expose credentials for the client to poll status
export async function GET(req: NextRequest) {
  const path = new URL(req.url).searchParams.get("path");
  if (!path?.startsWith("/requests/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const auth = `Key ${process.env.HIGGSFIELD_KEY_ID}:${process.env.HIGGSFIELD_KEY_SECRET}`;
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: auth, Accept: "application/json" },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

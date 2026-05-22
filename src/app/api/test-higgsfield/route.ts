import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const CLERK_CLIENT = process.env.HIGGSFIELD_CLERK_CLIENT ?? "";
const SESSION_ID   = process.env.HIGGSFIELD_SESSION_ID ?? "";

async function getFreshJWT(): Promise<string> {
  const res = await fetch(
    `https://clerk.higgsfield.ai/v1/client/sessions/${SESSION_ID}/tokens`,
    {
      method: "POST",
      headers: {
        "Cookie": `__client=${CLERK_CLIENT}`,
        "Origin": "https://higgsfield.ai",
        "Referer": "https://higgsfield.ai/",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  const data = await res.json() as Record<string, unknown>;
  if (!data.jwt) throw new Error(`No JWT: ${JSON.stringify(data).slice(0, 200)}`);
  return data.jwt as string;
}

async function fnf(jwt: string, path: string, body?: unknown) {
  const res = await fetch(`https://fnf.higgsfield.ai${path}`, {
    method: body !== undefined ? "POST" : "GET",
    headers: {
      "Authorization": `Bearer ${jwt}`,
      "Content-Type": "application/json",
      "Origin": "https://higgsfield.ai",
      "Referer": "https://higgsfield.ai/",
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  let data: unknown;
  try { data = await res.json(); } catch { data = await res.text(); }
  return { status: res.status, data };
}

export async function GET() {
  const jwt = await getFreshJWT();
  const prompt = "a woman walking in Paris";
  const body = { model: "nano_banana_pro", prompt, aspect_ratio: "1:1" };

  const [a, b, c, d, e] = await Promise.all([
    fnf(jwt, "/generate"),
    fnf(jwt, "/v1/generate"),
    fnf(jwt, "/generate/image", body),
    fnf(jwt, "/v1/images/generate", body),
    fnf(jwt, "/v2/generate/image", body),
  ]);

  return NextResponse.json({
    "/generate GET": a,
    "/v1/generate GET": b,
    "/generate/image POST": c,
    "/v1/images/generate POST": d,
    "/v2/generate/image POST": e,
  });
}

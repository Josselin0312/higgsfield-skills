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
    method: body ? "POST" : "GET",
    headers: {
      "Authorization": `Bearer ${jwt}`,
      "Content-Type": "application/json",
      "Origin": "https://higgsfield.ai",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data: unknown;
  try { data = await res.json(); } catch { data = await res.text(); }
  return { status: res.status, data };
}

export async function GET() {
  const jwt = await getFreshJWT();

  const [workspace, generations, generate] = await Promise.all([
    fnf(jwt, "/workspaces/details"),
    fnf(jwt, "/generations?limit=5"),
    fnf(jwt, "/generations", {
      model: "nano_banana_pro",
      prompt: "a woman walking in Paris",
      aspect_ratio: "1:1",
    }),
  ]);

  return NextResponse.json({ jwtOk: true, workspace, generations, generate });
}

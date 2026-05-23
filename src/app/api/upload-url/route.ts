import { NextRequest, NextResponse } from "next/server";
import { getUploadUrl } from "@/lib/higgsfield";

export const runtime = "nodejs";

async function handle(contentType: string) {
  try {
    const { upload_url, public_url } = await getUploadUrl(contentType);
    return NextResponse.json({ upload_url, public_url, media_id: public_url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[upload-url]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const contentType = req.nextUrl.searchParams.get("content_type") ?? "image/jpeg";
  return handle(contentType);
}

export async function POST(req: NextRequest) {
  const { content_type } = await req.json();
  return handle(content_type ?? "image/jpeg");
}

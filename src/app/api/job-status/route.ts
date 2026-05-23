import { NextRequest, NextResponse } from "next/server";
import { getRequestStatus } from "@/lib/higgsfield";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ done: false, error: "jobId manquant" });

  try {
    const data = await getRequestStatus(jobId);

    if (data.status === "completed" && data.images?.[0]?.url) {
      return NextResponse.json({ done: true, url: data.images[0].url });
    }
    if (data.status === "failed" || data.status === "nsfw") {
      return NextResponse.json({ done: false, error: `Génération ${data.status}` });
    }
    return NextResponse.json({ done: false });
  } catch {
    return NextResponse.json({ done: false });
  }
}

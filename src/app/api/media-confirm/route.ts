import { NextResponse } from "next/server";

export const runtime = "nodejs";

// L'API REST Higgsfield ne nécessite pas de confirmation après upload
// Cette route existe pour la compatibilité avec le frontend
export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST() {
  return NextResponse.json({ ok: true });
}

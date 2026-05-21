import { NextRequest, NextResponse } from "next/server";
import https from "https";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { content_type } = await req.json();

  return new Promise<NextResponse>((resolve) => {
    const payload = JSON.stringify({ content_type });
    const r = https.request({
      hostname: "platform.higgsfield.ai",
      path: "/files/generate-upload-url",
      method: "POST",
      headers: {
        "hf-api-key": process.env.HIGGSFIELD_KEY_ID ?? "",
        "hf-secret": process.env.HIGGSFIELD_KEY_SECRET ?? "",
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
      timeout: 15000,
    }, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try {
          resolve(NextResponse.json(JSON.parse(raw), { status: res.statusCode ?? 500 }));
        } catch {
          resolve(NextResponse.json({ error: raw }, { status: 500 }));
        }
      });
    });
    r.on("error", (e) => resolve(NextResponse.json({ error: e.message }, { status: 500 })));
    r.on("timeout", () => { r.destroy(); resolve(NextResponse.json({ error: "timeout" }, { status: 500 })); });
    r.write(payload);
    r.end();
  });
}

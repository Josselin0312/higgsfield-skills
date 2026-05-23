const BASE = "https://platform.higgsfield.ai";

function auth(): string {
  const id = process.env.HIGGSFIELD_KEY_ID;
  const secret = process.env.HIGGSFIELD_KEY_SECRET;
  if (!id || !secret) throw new Error("HIGGSFIELD_KEY_ID ou HIGGSFIELD_KEY_SECRET manquant dans .env.local");
  return `Key ${id}:${secret}`;
}

export async function getUploadUrl(contentType: string): Promise<{ upload_url: string; public_url: string }> {
  const res = await fetch(`${BASE}/files/generate-upload-url`, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify({ content_type: contentType }),
  });
  if (!res.ok) throw new Error(`Higgsfield upload-url: ${res.status} — ${await res.text()}`);
  return res.json();
}

export async function submitGeneration(params: {
  model?: string;
  prompt: string;
  aspect_ratio: string;
  resolution: string;
  medias?: Array<{ role: string; value: string }>;
}): Promise<string> {
  const { model = "nano_banana_pro", ...rest } = params;
  const res = await fetch(`${BASE}/${model}`, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify(rest),
  });
  if (!res.ok) throw new Error(`Higgsfield generate: ${res.status} — ${await res.text()}`);
  const data = await res.json() as { request_id?: string };
  if (!data.request_id) throw new Error(`Higgsfield: pas de request_id — ${JSON.stringify(data)}`);
  return data.request_id;
}

export async function getRequestStatus(requestId: string): Promise<{
  status: string;
  images?: Array<{ url: string }>;
  video?: { url: string };
}> {
  const res = await fetch(`${BASE}/requests/${requestId}/status`, {
    headers: { Authorization: auth() },
  });
  if (!res.ok) throw new Error(`Higgsfield status: ${res.status}`);
  return res.json();
}

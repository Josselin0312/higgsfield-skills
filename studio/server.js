import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { exec } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

const HF = 'https://platform.higgsfield.ai';
const hfHeaders = (creds) => ({
  'Authorization': `Key ${creds}`,
  'Content-Type': 'application/json',
});

// ─── Upload image to Higgsfield via presigned S3 URL ─────────────────────────
app.post('/api/upload', upload.single('image'), async (req, res) => {
  const creds = req.body.credentials;
  if (!creds) return res.status(400).json({ error: 'Clé API manquante' });

  try {
    // 1. Request a presigned upload URL from Higgsfield
    const initRes = await fetch(`${HF}/v1/media`, {
      method: 'POST',
      headers: hfHeaders(creds),
      body: JSON.stringify({
        filename: req.file.originalname || 'photo.jpg',
        content_type: req.file.mimetype || 'image/jpeg',
      }),
    });

    const initData = await initRes.json();
    if (!initRes.ok) return res.status(400).json({ error: 'Erreur upload init', detail: initData });

    const { id, upload_url } = initData;

    // 2. Upload bytes directly to S3 presigned URL (no auth header needed)
    const s3Res = await fetch(upload_url, {
      method: 'PUT',
      body: req.file.buffer,
      headers: { 'Content-Type': req.file.mimetype || 'image/jpeg' },
    });
    if (!s3Res.ok) return res.status(400).json({ error: `Échec upload S3: ${s3Res.status}` });

    // 3. Confirm the upload
    const confirmRes = await fetch(`${HF}/v1/media/${id}/confirm`, {
      method: 'POST',
      headers: hfHeaders(creds),
    });
    const confirmData = await confirmRes.json();
    if (!confirmRes.ok) return res.status(400).json({ error: 'Erreur confirmation', detail: confirmData });

    res.json({ mediaId: id, previewUrl: confirmData.url || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Launch image generation jobs ────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  const { credentials, prompt, mediaIds, aspectRatio, count, model, resolution } = req.body;
  if (!credentials) return res.status(400).json({ error: 'Clé API manquante' });

  const modelId = model || 'nano_banana_2';
  const ratio = aspectRatio || '4:5';
  const qty = Math.min(parseInt(count) || 1, 20);
  const res_val = resolution || '1k';

  const launchOne = () =>
    fetch(`${HF}/v1/generate`, {
      method: 'POST',
      headers: hfHeaders(credentials),
      body: JSON.stringify({
        model: modelId,
        prompt,
        aspect_ratio: ratio,
        resolution: res_val,
        medias: mediaIds.map((id) => ({ value: id, role: 'image' })),
      }),
    }).then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(JSON.stringify(data));
      return data;
    });

  try {
    // Launch in batches of 5 to respect rate limits
    const BATCH = 5;
    const allJobIds = [];

    for (let i = 0; i < qty; i += BATCH) {
      const batchSize = Math.min(BATCH, qty - i);
      const batchResults = await Promise.all(Array.from({ length: batchSize }, launchOne));
      for (const r of batchResults) {
        const jobId = r.id || r.request_id || r.job_id;
        if (jobId) allJobIds.push(jobId);
      }
      if (i + BATCH < qty) await new Promise((resolve) => setTimeout(resolve, 800));
    }

    if (allJobIds.length === 0) {
      return res.status(400).json({ error: 'Aucun job lancé', raw: 'Vérifie ta clé API' });
    }

    res.json({ jobIds: allJobIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Poll status for multiple jobs at once ────────────────────────────────────
app.post('/api/status', async (req, res) => {
  const { credentials, jobIds } = req.body;
  if (!credentials || !jobIds?.length) return res.status(400).json({ error: 'Paramètres manquants' });

  const authH = { Authorization: `Key ${credentials}` };

  const checkOne = async (jobId) => {
    try {
      const r = await fetch(`${HF}/requests/${jobId}/status`, { headers: authH });
      const data = await r.json();
      const status = (data.status || data.state || '').toLowerCase();

      if (status === 'completed') {
        // Try to get result URL from status response or dedicated result endpoint
        let url =
          data.url ||
          data.results?.[0]?.url ||
          data.jobs?.[0]?.results?.raw?.url ||
          data.output?.[0];

        if (!url) {
          const rr = await fetch(`${HF}/requests/${jobId}/result`, { headers: authH });
          if (rr.ok) {
            const rd = await rr.json();
            url =
              rd.url ||
              rd.results?.[0]?.url ||
              rd.jobs?.[0]?.results?.raw?.url ||
              rd.output?.[0];
          }
        }
        return { jobId, status: 'completed', url };
      }

      if (status === 'failed' || status === 'error' || status === 'nsfw') {
        return { jobId, status: 'failed', error: data.error || data.message || status };
      }

      return { jobId, status: status || 'pending' };
    } catch (e) {
      return { jobId, status: 'error', error: e.message };
    }
  };

  const results = await Promise.all(jobIds.map(checkOne));
  res.json({ results });
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = 3000;
app.listen(PORT, () => {
  console.log('\n');
  console.log('  ✨ Influencer Content Studio');
  console.log('  ─────────────────────────────');
  console.log(`  → http://localhost:${PORT}`);
  console.log('\n  (garde cette fenêtre ouverte)\n');

  const openCmd =
    process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  setTimeout(() => exec(`${openCmd} http://localhost:${PORT}`), 1200);
});

// ── Config types de contenu ───────────────────────────────────────────────
const CONTENT_TYPES = {
  instagram: { label: 'Instagram', icon: '◻', sub: 'Carousel 3–4 images', min: 3, max: 4, ratio: '4:5' },
  tiktok:    { label: 'TikTok',    icon: '▶', sub: 'Carousel 2–6 images', min: 2, max: 6, ratio: '9:16' },
  threads:   { label: 'Threads',   icon: '⊕', sub: 'Repost TikTok',       min: 2, max: 6, ratio: '9:16' },
  histoire:  { label: 'Histoire',  icon: '◈', sub: 'Séquence narrative',  min: 4, max: 10, ratio: '9:16' },
};

// ── État ──────────────────────────────────────────────────────────────────
let currentInfId    = null;
let currentInfData  = null;
let currentType     = null;
let statusFilter    = 'all';
let pollTimer       = null;
let soulPollTimer   = null;
let viewerImages    = [];
let viewerIndex     = 0;
let importFilesList = [];

// ── Boot ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadInfluencers);

// ── Influenceurs ──────────────────────────────────────────────────────────
async function loadInfluencers() {
  let list = [];
  try {
    list = await api('/api/influencers');
  } catch (e) {
    // backend not ready yet — show empty
  }

  const nav = document.getElementById('inf-nav');
  nav.innerHTML = list.map(i => `
    <div class="inf-item ${i.id === currentInfId ? 'active' : ''}"
         data-id="${i.id}" onclick="selectInfluencer(${i.id})">
      <div class="inf-item-dot">${esc(i.name[0].toUpperCase())}</div>
      ${esc(i.name)}
    </div>
  `).join('');

  if (!list.length) {
    show('screen-empty');
    document.getElementById('gen-section').style.display = 'none';
    return;
  }
  if (!currentInfId) selectInfluencer(list[0].id);
}

async function selectInfluencer(id) {
  currentInfId  = id;
  currentType   = null;

  clearInterval(pollTimer);
  clearInterval(soulPollTimer);

  document.querySelectorAll('.inf-item').forEach(el =>
    el.classList.toggle('active', +el.dataset.id === id));
  document.querySelectorAll('.gen-nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('validate-nav-row').classList.remove('active');

  const inf = await api(`/api/influencers/${id}`);
  currentInfData = inf;

  document.getElementById('top-avatar').textContent = inf.name[0].toUpperCase();
  document.getElementById('top-name').textContent   = inf.name;
  document.getElementById('top-sub').textContent    = [inf.handle, inf.niche].filter(Boolean).join(' · ');

  document.getElementById('gen-section').style.display = 'block';
  show('screen-inf');
  await loadInfluencerHome();
}

async function loadInfluencerHome() {
  if (!currentInfId) return;

  // Stats par type
  let stats = {};
  try {
    stats = await api(`/api/influencers/${currentInfId}/stats`);
  } catch (e) { /* ignore */ }

  const statsRow = document.getElementById('inf-stats');
  statsRow.innerHTML = Object.entries(CONTENT_TYPES).map(([type, cfg]) => {
    const s = stats[type] || { total: 0, done: 0 };
    return `
      <div class="stat-card" onclick="selectContentType('${type}')">
        <div class="stat-type">
          <span class="stat-dot ${type}"></span>${cfg.label}
        </div>
        <div class="stat-number">${s.total || 0}</div>
        <div class="stat-label">posts générés</div>
      </div>
    `;
  }).join('');

  // Badge "À valider"
  await refreshValidateBadge();

  // Soul Character
  await renderSoulSection();

  // Dernières générations (tous types)
  let posts = [];
  try {
    posts = await api(`/api/influencers/${currentInfId}/posts?limit=8`);
  } catch (e) { /* ignore */ }

  const grid  = document.getElementById('recent-grid');
  const empty = document.getElementById('recent-empty');

  const thumbUrls = posts.flatMap(p => (p.image_urls || []).slice(0, 1)).filter(Boolean);
  if (!thumbUrls.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = posts.flatMap(p => {
    const url = (p.image_urls || [])[0];
    if (!url) return [];
    const allUrls = JSON.stringify(p.image_urls || [url]).replace(/"/g, '&quot;');
    const isSquare = p.content_type === 'instagram';
    return [`
      <div style="border-radius:10px;overflow:hidden;background:#fff;border:1px solid var(--border)">
        <img src="${url}"
             style="width:100%;aspect-ratio:${isSquare ? '4/5' : '9/16'};object-fit:cover;display:block;cursor:zoom-in"
             onclick="openViewer(${allUrls}, 0)" loading="lazy" />
      </div>
    `];
  }).join('');
}

// ── À valider badge ───────────────────────────────────────────────────────
async function refreshValidateBadge() {
  if (!currentInfId) return;
  try {
    const pending = await api(`/api/influencers/${currentInfId}/posts/to-validate`);
    const count   = Array.isArray(pending) ? pending.length : 0;
    const badge   = document.getElementById('validate-badge');
    badge.textContent = count;
    badge.className   = 'validate-badge' + (count === 0 ? ' zero' : '');
  } catch (e) { /* ignore */ }
}

// ── Soul Character ────────────────────────────────────────────────────────
async function renderSoulSection() {
  if (!currentInfId) return;

  let soul = null;
  try {
    soul = await api(`/api/influencers/${currentInfId}/soul/status`);
  } catch (e) { /* no soul yet */ }

  const status  = soul ? soul.status : 'none'; // 'none' | 'training' | 'ready'
  const display = document.getElementById('soul-status-display');
  const body    = document.getElementById('soul-body');

  // Status indicator in header
  if (status === 'ready') {
    display.innerHTML = `<div class="soul-ready-badge">✓ Prêt</div>`;
    body.innerHTML    = `<p style="font-size:13px;color:var(--muted)">
      Ton Soul Character est entraîné et sera utilisé automatiquement à la génération.
    </p>`;
  } else if (status === 'training') {
    display.innerHTML = `
      <div class="soul-training-badge">
        <div class="spin"></div>
        En cours d'entraînement…
      </div>`;
    body.innerHTML = `<p style="font-size:13px;color:var(--muted)">
      L'entraînement est en cours, cela peut prendre quelques minutes. La page se mettra à jour automatiquement.
    </p>`;
    // poll
    clearInterval(soulPollTimer);
    soulPollTimer = setInterval(() => pollSoulStatus(currentInfId), 10000);
  } else {
    // none — show upload zone
    display.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted)">
        <span class="soul-status-dot none"></span> Non configuré
      </div>`;
    body.innerHTML = `
      <div class="soul-upload-row">
        <div class="soul-drop-zone" id="soul-drop-face"
             ondragover="soulDragOver(event,'soul-drop-face')"
             ondragleave="soulDragLeave('soul-drop-face')"
             ondrop="soulDrop(event,'soul-drop-face','soul-face-input')">
          <input type="file" id="soul-face-input" accept="image/*"
                 onchange="soulFileSelected(this,'soul-drop-face','soul-face-name')" />
          <div class="soul-drop-icon">🙂</div>
          <div class="soul-drop-label">Photo visage</div>
          <div class="soul-drop-hint" id="soul-face-name">JPG ou PNG, gros plan</div>
        </div>
        <div class="soul-drop-zone" id="soul-drop-body"
             ondragover="soulDragOver(event,'soul-drop-body')"
             ondragleave="soulDragLeave('soul-drop-body')"
             ondrop="soulDrop(event,'soul-drop-body','soul-body-input')">
          <input type="file" id="soul-body-input" accept="image/*"
                 onchange="soulFileSelected(this,'soul-drop-body','soul-body-name')" />
          <div class="soul-drop-icon">🧍</div>
          <div class="soul-drop-label">Photo corps entier</div>
          <div class="soul-drop-hint" id="soul-body-name">JPG ou PNG, corps entier</div>
        </div>
      </div>
      <button class="soul-upload-btn" onclick="uploadSoulPhotos()">
        Lancer l'entraînement Soul Character
      </button>
    `;
  }
}

function soulDragOver(e, zoneId) {
  e.preventDefault();
  document.getElementById(zoneId).classList.add('drag-over');
}

function soulDragLeave(zoneId) {
  document.getElementById(zoneId).classList.remove('drag-over');
}

function soulDrop(e, zoneId, inputId) {
  e.preventDefault();
  document.getElementById(zoneId).classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (!file) return;
  const input = document.getElementById(inputId);
  // Assign file to the input
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  const nameId = inputId.replace('-input', '-name');
  document.getElementById(nameId).textContent = file.name;
  document.getElementById(zoneId).classList.add('has-file');
}

function soulFileSelected(input, zoneId, nameId) {
  if (!input.files.length) return;
  document.getElementById(nameId).textContent = input.files[0].name;
  document.getElementById(zoneId).classList.add('has-file');
}

async function uploadSoulPhotos() {
  const faceInput = document.getElementById('soul-face-input');
  const bodyInput = document.getElementById('soul-body-input');

  if (!faceInput || !bodyInput) return;
  if (!faceInput.files.length || !bodyInput.files.length) {
    toast('Sélectionne les deux photos (visage + corps)', true);
    return;
  }

  const fd = new FormData();
  fd.append('face_photo', faceInput.files[0]);
  fd.append('body_photo', bodyInput.files[0]);

  try {
    await apiFd(`/api/influencers/${currentInfId}/soul/upload`, fd);
    toast('Entraînement Soul Character lancé !');
    await renderSoulSection();
  } catch (e) {
    toast(e.message || 'Erreur upload Soul', true);
  }
}

async function pollSoulStatus(iid) {
  if (iid !== currentInfId) { clearInterval(soulPollTimer); return; }
  try {
    const soul = await api(`/api/influencers/${iid}/soul/status`);
    if (soul && soul.status !== 'training') {
      clearInterval(soulPollTimer);
      await renderSoulSection();
      if (soul.status === 'ready') toast('Soul Character prêt !');
    }
  } catch (e) { /* ignore */ }
}

// ── Type de contenu ───────────────────────────────────────────────────────
function selectContentType(type) {
  currentType  = type;
  statusFilter = 'all';

  document.querySelectorAll('.gen-nav-item').forEach(b =>
    b.classList.toggle('active', b.dataset.type === type));
  document.querySelectorAll('.inf-item').forEach(b => b.classList.remove('active'));
  document.getElementById('validate-nav-row').classList.remove('active');

  const cfg = CONTENT_TYPES[type];
  const badge = document.getElementById('ct-badge');
  badge.className   = `content-type-badge ${type}`;
  badge.textContent = cfg.icon;
  document.getElementById('ct-title').textContent = cfg.label;
  document.getElementById('ct-sub').textContent   = cfg.sub + ' · ' + cfg.ratio;

  // Show histoire-specific button, JSON import button
  document.getElementById('btn-script').style.display      = type === 'histoire' ? '' : 'none';
  document.getElementById('btn-import-json').style.display = '';

  // Reset filter buttons
  document.querySelectorAll('.filter').forEach((b, i) => b.classList.toggle('active', i === 0));
  show('screen-gen');
  loadPosts();
}

// ── Posts ─────────────────────────────────────────────────────────────────
async function loadPosts() {
  if (!currentInfId || !currentType) return;
  clearInterval(pollTimer);

  const q    = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
  let posts  = [];
  try {
    posts = await api(`/api/influencers/${currentInfId}/posts?content_type=${currentType}${q}`);
  } catch (e) {
    toast('Impossible de charger les posts', true);
    return;
  }

  const grid  = document.getElementById('posts-grid');
  const empty = document.getElementById('posts-empty');

  if (!posts.length) {
    grid.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = posts.map(renderPost).join('');

  const hasPending = posts.some(p => p.status === 'pending' || p.status === 'generating');
  if (hasPending) pollTimer = setInterval(loadPosts, 6000);
}

function renderPost(p) {
  const imgs     = p.image_urls || [];
  const cfg      = CONTENT_TYPES[p.content_type] || {};
  const isSquare = p.content_type === 'instagram';
  const imgClass = isSquare ? 'post-img-sq' : 'post-img';
  const allUrls  = JSON.stringify(imgs).replace(/"/g, '&quot;');

  let imagesHtml;
  if ((p.status === 'done' || p.status === 'to_validate') && imgs.length) {
    imagesHtml = `<div class="post-images">
      ${imgs.map((url, i) => `
        <img class="${imgClass}" src="${url}" loading="lazy"
             onclick='openViewer(${allUrls}, ${i})' />
      `).join('')}
    </div>`;
  } else {
    const info = {
      generating: ['badge-gen',  '<div class="spin"></div>', 'Génération en cours…'],
      pending:    ['badge-pend', '',                         'En attente…'],
      failed:     ['badge-fail', '✕',                        'Échec'],
    }[p.status] || ['badge-pend', '', '—'];
    imagesHtml = `<div class="post-placeholder">${info[1]}<span>${info[2]}</span></div>`;
  }

  const badge = {
    done:        `<span class="badge badge-done">✓ Terminé</span>`,
    to_validate: `<span class="badge badge-gen">À valider</span>`,
    generating:  `<span class="badge badge-gen"><div class="spin"></div> En cours</span>`,
    pending:     `<span class="badge badge-pend">En attente</span>`,
    failed:      `<span class="badge badge-fail">✕ Échec</span>`,
  }[p.status] || '';

  // Soul warning
  const soulWarning = (p.soul_used === false && (p.status === 'done' || p.status === 'to_validate'))
    ? `<span class="badge-no-soul">⚠ Généré sans Soul</span>` : '';

  return `
    <div class="post-card">
      <div class="post-card-header">
        <div class="post-card-prompt" title="${esc(p.prompt)}">${esc(p.prompt || '—')}</div>
        <div style="display:flex;gap:6px;align-items:center;flex-shrink:0;">
          ${soulWarning}
          ${badge}
        </div>
      </div>
      ${imagesHtml}
      <div class="post-card-date">${imgs.length} image${imgs.length !== 1 ? 's' : ''} · ${fmtDate(p.created_at)}</div>
    </div>
  `;
}

function setFilter(f, btn) {
  statusFilter = f;
  document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadPosts();
}

// ── Modals génération ─────────────────────────────────────────────────────
function openSingleModal() {
  const cfg = CONTENT_TYPES[currentType];
  document.getElementById('modal-type-header').textContent   = cfg.label + ' · ' + cfg.sub;
  document.getElementById('modal-single-title').textContent  = 'Nouveau post ' + cfg.label;
  document.getElementById('s-prompt').value = '';

  const sel = document.getElementById('s-count');
  sel.innerHTML = '';
  for (let i = cfg.min; i <= cfg.max; i++) {
    const opt = document.createElement('option');
    opt.value       = i;
    opt.textContent = `${i} image${i > 1 ? 's' : ''}`;
    if (i === cfg.max) opt.selected = true;
    sel.appendChild(opt);
  }
  openModal('single');
}

async function submitSingle(e) {
  e.preventDefault();
  const btn = e.target.querySelector('[type="submit"]');
  btn.disabled = true; btn.textContent = 'Lancement…';
  try {
    await api(`/api/influencers/${currentInfId}/posts`, 'POST', {
      content_type: currentType,
      prompt:       document.getElementById('s-prompt').value,
      image_count:  +document.getElementById('s-count').value,
      model:        document.getElementById('s-model').value,
    });
    closeModal('single');
    e.target.reset();
    toast('Post en cours de génération');
    loadPosts();
  } catch (err) {
    toast(err.message || 'Erreur de génération', true);
  } finally {
    btn.disabled = false; btn.textContent = 'Générer';
  }
}

function openBulkModal() {
  const cfg = CONTENT_TYPES[currentType];
  document.getElementById('modal-bulk-type-header').textContent = cfg.label + ' · ' + cfg.sub;
  document.getElementById('modal-bulk-title').textContent       = 'Génération en masse — ' + cfg.label;
  document.getElementById('b-prompts').value = '';
  document.getElementById('b-count').textContent = '0 posts';

  const sel = document.getElementById('b-count-img');
  sel.innerHTML = '';
  for (let i = cfg.min; i <= cfg.max; i++) {
    const opt = document.createElement('option');
    opt.value       = i;
    opt.textContent = `${i} image${i > 1 ? 's' : ''} / post`;
    if (i === cfg.max) opt.selected = true;
    sel.appendChild(opt);
  }
  openModal('bulk');
}

function countBulkPrompts() {
  const n = getBulkPrompts().length;
  document.getElementById('b-count').textContent = `${n} post${n !== 1 ? 's' : ''}`;
}

function getBulkPrompts() {
  return document.getElementById('b-prompts').value
    .split('\n').map(l => l.trim()).filter(Boolean);
}

async function submitBulk(e) {
  e.preventDefault();
  const prompts = getBulkPrompts();
  if (!prompts.length) { toast('Ajoute au moins un prompt', true); return; }

  const btn = document.getElementById('bulk-submit-btn');
  btn.disabled = true; btn.textContent = 'Lancement…';

  try {
    await api(`/api/influencers/${currentInfId}/posts/bulk`, 'POST', {
      content_type: currentType,
      prompts,
      image_count:  +document.getElementById('b-count-img').value,
      model:        document.getElementById('b-model').value,
    });
    closeModal('bulk');
    e.target.reset();
    document.getElementById('b-count').textContent = '0 posts';
    toast(`${prompts.length} posts lancés`);
    loadPosts();
  } catch (err) {
    toast(err.message || 'Erreur de génération en masse', true);
  } finally {
    btn.disabled = false; btn.textContent = 'Lancer';
  }
}

// ── JSON Import ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const jsonInput = document.getElementById('json-input');
  if (jsonInput) jsonInput.addEventListener('input', updateJsonCount);
});

function updateJsonCount() {
  const raw = document.getElementById('json-input').value.trim();
  let count = 0;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      count = parsed.filter(x => x && (typeof x === 'string' || x.prompt)).length;
    } else if (parsed && typeof parsed === 'object') {
      count = 1;
    }
  } catch (e) { /* invalid JSON */ }
  document.getElementById('json-count').textContent = `${count} prompt${count !== 1 ? 's' : ''} détecté${count !== 1 ? 's' : ''}`;
}

async function submitJsonImport(e) {
  e.preventDefault();
  const raw = document.getElementById('json-input').value.trim();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    toast('JSON invalide — vérifie la syntaxe', true);
    return;
  }

  // Normalise: array of strings, array of objects, or single object
  let json_prompts;
  if (Array.isArray(parsed)) {
    json_prompts = parsed.map(item => {
      if (typeof item === 'string') return item;
      if (item && item.prompt) return item.prompt;
      return String(item);
    }).filter(Boolean);
  } else if (parsed && typeof parsed === 'object') {
    json_prompts = parsed.prompt ? [parsed.prompt] : [JSON.stringify(parsed)];
  } else {
    toast('Format non reconnu', true);
    return;
  }

  if (!json_prompts.length) { toast('Aucun prompt trouvé dans le JSON', true); return; }

  const btn = document.getElementById('json-submit-btn');
  btn.disabled = true; btn.textContent = 'Import…';

  try {
    await api(`/api/influencers/${currentInfId}/posts/import-json`, 'POST', {
      content_type: currentType,
      json_prompts,
    });
    closeModal('json');
    document.getElementById('json-input').value = '';
    document.getElementById('json-count').textContent = '0 prompts détectés';
    toast(`${json_prompts.length} posts importés depuis JSON`);
    loadPosts();
  } catch (err) {
    toast(err.message || 'Erreur import JSON', true);
  } finally {
    btn.disabled = false; btn.textContent = 'Importer et générer';
  }
}

// ── Script histoire ────────────────────────────────────────────────────────
function countScriptFrames() {
  const n = getScriptFrames().length;
  document.getElementById('sc-count').textContent = `${n} frame${n !== 1 ? 's' : ''}`;
}

function getScriptFrames() {
  return document.getElementById('sc-frames').value
    .split('\n').map(l => l.trim()).filter(Boolean);
}

async function submitScript(e) {
  e.preventDefault();
  const frames = getScriptFrames();
  if (!frames.length) { toast('Ajoute au moins une ligne de script', true); return; }

  const btn = document.getElementById('script-submit-btn');
  btn.disabled = true; btn.textContent = 'Lancement…';

  try {
    await api(`/api/influencers/${currentInfId}/posts/script`, 'POST', {
      content_type: 'histoire',
      frames,
      image_count:  +document.getElementById('sc-count-img').value,
      model:        document.getElementById('sc-model').value,
    });
    closeModal('script');
    e.target.reset();
    document.getElementById('sc-count').textContent = '0 frames';
    toast(`Histoire lancée — ${frames.length} frames`);
    loadPosts();
  } catch (err) {
    toast(err.message || 'Erreur script histoire', true);
  } finally {
    btn.disabled = false; btn.textContent = "Générer l'histoire";
  }
}

// ── Import images externes ─────────────────────────────────────────────────
function importDragOver(e) {
  e.preventDefault();
  document.getElementById('import-drop-zone').classList.add('drag-over');
}

function importDragLeave(e) {
  document.getElementById('import-drop-zone').classList.remove('drag-over');
}

function importDrop(e) {
  e.preventDefault();
  document.getElementById('import-drop-zone').classList.remove('drag-over');
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  if (!files.length) { toast('Aucune image détectée', true); return; }

  // Assign to the file input
  const input = document.getElementById('import-files');
  const dt    = new DataTransfer();
  files.forEach(f => dt.items.add(f));
  input.files = dt.files;
  importFilesList = files;
  updateImportFileList();
}

function importFilesSelected(e) {
  importFilesList = Array.from(e.target.files);
  updateImportFileList();
}

function updateImportFileList() {
  const el = document.getElementById('import-file-list');
  if (!importFilesList.length) { el.textContent = ''; return; }
  el.textContent = `${importFilesList.length} fichier${importFilesList.length !== 1 ? 's' : ''} sélectionné${importFilesList.length !== 1 ? 's' : ''} : ` +
    importFilesList.map(f => f.name).join(', ');
}

async function submitImageImport(e) {
  e.preventDefault();
  const files = document.getElementById('import-files').files;
  if (!files.length) { toast('Sélectionne au moins une image', true); return; }

  const fd = new FormData();
  Array.from(files).forEach(f => fd.append('images', f));
  fd.append('content_type', document.getElementById('import-content-type').value);
  const prompt = document.getElementById('import-prompt').value.trim();
  if (prompt) fd.append('prompt', prompt);

  const btn = document.getElementById('import-submit-btn');
  btn.disabled = true; btn.textContent = 'Import…';

  try {
    await apiFd(`/api/influencers/${currentInfId}/posts/import-image`, fd);
    closeModal('import');
    e.target.reset();
    importFilesList = [];
    document.getElementById('import-file-list').textContent = '';
    toast(`${files.length} image${files.length !== 1 ? 's' : ''} importée${files.length !== 1 ? 's' : ''}`);
    loadPosts();
  } catch (err) {
    toast(err.message || 'Erreur import images', true);
  } finally {
    btn.disabled = false; btn.textContent = 'Importer';
  }
}

// ── Validation queue ───────────────────────────────────────────────────────
async function showValidateScreen() {
  document.querySelectorAll('.gen-nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.inf-item').forEach(b => b.classList.remove('active'));
  document.getElementById('validate-nav-row').classList.add('active');

  show('screen-validate');
  await loadValidationQueue();
}

async function loadValidationQueue() {
  if (!currentInfId) return;

  let pending = [];
  try {
    pending = await api(`/api/influencers/${currentInfId}/posts/to-validate`);
  } catch (e) {
    toast('Impossible de charger la file de validation', true);
    return;
  }

  const queue = document.getElementById('validate-queue');
  const empty = document.getElementById('validate-empty');
  const sub   = document.getElementById('validate-top-sub');

  sub.textContent = pending.length
    ? `${pending.length} carrousel${pending.length !== 1 ? 's' : ''} en attente`
    : 'Aucun carrousel en attente';

  if (!pending.length) {
    queue.innerHTML = '';
    queue.style.display  = 'none';
    empty.style.display  = 'flex';
    document.getElementById('validate-badge').textContent = '0';
    document.getElementById('validate-badge').className   = 'validate-badge zero';
    return;
  }

  empty.style.display  = 'none';
  queue.style.display  = 'flex';

  const count = pending.length;
  const badge = document.getElementById('validate-badge');
  badge.textContent = count;
  badge.className   = 'validate-badge';

  queue.innerHTML = pending.map(p => renderValidateCard(p)).join('');
}

function renderValidateCard(p) {
  const imgs     = p.image_urls || [];
  const isSquare = p.content_type === 'instagram';
  const imgClass = 'validate-img' + (isSquare ? ' sq' : '');
  const cfg      = CONTENT_TYPES[p.content_type] || {};
  const allUrls  = JSON.stringify(imgs).replace(/"/g, '&quot;');

  const imagesHtml = imgs.length
    ? imgs.map((url, i) => `
        <img class="${imgClass}" src="${url}" loading="lazy"
             onclick='openViewer(${allUrls}, ${i})' />
      `).join('')
    : '<p style="color:var(--muted);font-size:13px;padding:8px 0">Aucune image</p>';

  const typeBadge = cfg.label
    ? `<span class="badge badge-pend" style="font-size:11px">${cfg.icon || ''} ${cfg.label}</span>`
    : '';

  const soulWarning = p.soul_used === false
    ? `<span class="badge-no-soul">⚠ Sans Soul</span>` : '';

  return `
    <div class="validate-card" id="validate-card-${p.id}">
      <div class="validate-card-header">
        <div class="validate-card-meta">
          ${typeBadge}
          <div class="validate-card-prompt" title="${esc(p.prompt)}">${esc(p.prompt || '—')}</div>
          ${soulWarning}
        </div>
      </div>
      <div class="validate-card-images">${imagesHtml}</div>
      <div class="validate-card-date">${imgs.length} image${imgs.length !== 1 ? 's' : ''} · ${fmtDate(p.created_at)}</div>
      <div class="validate-card-actions">
        <button class="btn-approve" onclick="approvePost(${p.id})">✓ Valider</button>
        <button class="btn-reject"  onclick="rejectPost(${p.id})">✕ Rejeter</button>
      </div>
    </div>
  `;
}

async function approvePost(pid) {
  await validatePost(pid, 'approve');
}

async function rejectPost(pid) {
  await validatePost(pid, 'reject');
}

async function validatePost(pid, action) {
  const card = document.getElementById(`validate-card-${pid}`);
  if (card) {
    card.style.opacity = '0.5';
    card.style.pointerEvents = 'none';
  }
  try {
    await api(`/api/posts/${pid}/validate`, 'POST', { action });
    toast(action === 'approve' ? 'Post validé !' : 'Post rejeté');
    // Remove card from DOM immediately, then refresh badge
    if (card) card.remove();
    await refreshValidateBadge();

    // If queue is now empty, show empty state
    const remaining = document.querySelectorAll('.validate-card');
    if (!remaining.length) {
      document.getElementById('validate-queue').style.display  = 'none';
      document.getElementById('validate-empty').style.display  = 'flex';
      document.getElementById('validate-top-sub').textContent  = 'Aucun carrousel en attente';
    }
  } catch (err) {
    toast(err.message || 'Erreur lors de la validation', true);
    if (card) {
      card.style.opacity = '1';
      card.style.pointerEvents = '';
    }
  }
}

// ── Ajouter influenceur ───────────────────────────────────────────────────
async function submitAddInf(e) {
  e.preventDefault();
  const btn = e.target.querySelector('[type="submit"]');
  btn.disabled = true; btn.textContent = 'Création…';
  try {
    const inf = await api('/api/influencers', 'POST', {
      name:        document.getElementById('ai-name').value,
      handle:      document.getElementById('ai-handle').value || null,
      niche:       document.getElementById('ai-niche').value  || null,
      style_notes: document.getElementById('ai-style').value  || null,
    });
    closeModal('add-inf');
    e.target.reset();
    toast(`Influenceur "${inf.name}" créé`);
    await loadInfluencers();
    selectInfluencer(inf.id);
  } catch (err) {
    toast(err.message || 'Erreur création influenceur', true);
  } finally {
    btn.disabled = false; btn.textContent = 'Créer';
  }
}

// ── Viewer ────────────────────────────────────────────────────────────────
function openViewer(urls, index) {
  viewerImages = typeof urls === 'string' ? JSON.parse(urls) : (Array.isArray(urls) ? urls : [urls]);
  viewerIndex  = Math.max(0, Math.min(index, viewerImages.length - 1));
  updateViewer();
  openModal('viewer');
}

function updateViewer() {
  document.getElementById('viewer-img').src = viewerImages[viewerIndex];
  document.getElementById('viewer-counter').textContent =
    viewerImages.length > 1 ? `${viewerIndex + 1} / ${viewerImages.length}` : '';
}

function viewerNav(dir) {
  if (!viewerImages.length) return;
  viewerIndex = (viewerIndex + dir + viewerImages.length) % viewerImages.length;
  updateViewer();
}

// ── Modals ────────────────────────────────────────────────────────────────
function openModal(name) {
  const el = document.getElementById(`modal-${name}`);
  if (!el) return;
  el.style.display = 'flex';
  el.classList.add('open');

  // Pre-fill content type for json modal
  if (name === 'json' && currentType) {
    const cfg = CONTENT_TYPES[currentType];
    document.getElementById('modal-json-type-header').textContent = cfg.label + ' · ' + cfg.sub;
  }

  // Pre-select content type in import modal
  if (name === 'import' && currentType) {
    const sel = document.getElementById('import-content-type');
    if (sel) sel.value = currentType;
  }
}

function closeModal(name) {
  const el = document.getElementById(`modal-${name}`);
  if (!el) return;
  el.style.display = 'none';
  el.classList.remove('open');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.overlay.open').forEach(m => {
      m.style.display = 'none';
      m.classList.remove('open');
    });
  }
  if (e.key === 'ArrowLeft'  && document.getElementById('modal-viewer').classList.contains('open')) viewerNav(-1);
  if (e.key === 'ArrowRight' && document.getElementById('modal-viewer').classList.contains('open')) viewerNav(1);
});

// ── Helpers ───────────────────────────────────────────────────────────────
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

function fmtDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function toast(msg, err = false) {
  const el = document.createElement('div');
  el.className   = 'toast' + (err ? ' toast-err' : '');
  el.textContent = msg;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

async function api(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : null,
  };
  const r = await fetch(path, opts);
  if (r.status === 204) return null;
  const data = await r.json();
  if (!r.ok) throw new Error(data.detail || data.message || 'Erreur serveur');
  return data;
}

async function apiFd(path, formData) {
  const r = await fetch(path, { method: 'POST', body: formData });
  if (r.status === 204) return null;
  const data = await r.json();
  if (!r.ok) throw new Error(data.detail || data.message || 'Erreur serveur');
  return data;
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

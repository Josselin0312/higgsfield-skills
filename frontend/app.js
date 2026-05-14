// ── Config types de contenu ───────────────────────────────────────────────
const CONTENT_TYPES = {
  instagram: { label: 'Instagram', icon: '◻', sub: 'Carousel 3–4 images', min: 3, max: 4, ratio: '4:5' },
  tiktok:    { label: 'TikTok',    icon: '▶', sub: 'Carousel 2–6 images', min: 2, max: 6, ratio: '9:16' },
  threads:   { label: 'Threads',   icon: '⊕', sub: 'Repost TikTok',       min: 2, max: 6, ratio: '9:16' },
  histoire:  { label: 'Histoire',  icon: '◈', sub: 'Séquence narrative',  min: 4, max: 10, ratio: '9:16' },
};

// ── État ──────────────────────────────────────────────────────────────────
let currentInfId   = null;
let currentType    = null;
let statusFilter   = 'all';
let pollTimer      = null;
let viewerImages   = [];
let viewerIndex    = 0;

// ── Boot ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadInfluencers);

// ── Influenceurs ──────────────────────────────────────────────────────────
async function loadInfluencers() {
  const list = await api('/api/influencers');
  const nav  = document.getElementById('inf-nav');
  nav.innerHTML = list.map(i => `
    <div class="inf-item ${i.id === currentInfId ? 'active' : ''}"
         data-id="${i.id}" onclick="selectInfluencer(${i.id})">
      <div class="inf-item-dot">${i.name[0].toUpperCase()}</div>
      ${esc(i.name)}
    </div>
  `).join('');

  if (!list.length) { show('screen-empty'); return; }
  if (!currentInfId) selectInfluencer(list[0].id);
}

async function selectInfluencer(id) {
  currentInfId = id;
  currentType  = null;

  document.querySelectorAll('.inf-item').forEach(el =>
    el.classList.toggle('active', +el.dataset.id === id));
  document.querySelectorAll('.gen-nav-item').forEach(b => b.classList.remove('active'));

  const inf = await api(`/api/influencers/${id}`);
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
  const stats = await api(`/api/influencers/${currentInfId}/stats`);
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

  // Dernières générations (tous types)
  const posts = await api(`/api/influencers/${currentInfId}/posts?limit=8`);
  const grid  = document.getElementById('recent-grid');
  const empty = document.getElementById('recent-empty');

  if (!posts.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = posts.flatMap(p => (p.image_urls || []).slice(0, 1)).filter(Boolean).map(url => `
    <div style="border-radius:10px;overflow:hidden;background:#fff;border:1px solid var(--border)">
      <img src="${url}" style="width:100%;aspect-ratio:9/16;object-fit:cover;display:block;cursor:zoom-in"
           onclick="openViewer(['${url}'], 0)" loading="lazy" />
    </div>
  `).join('');
}

// ── Type de contenu ───────────────────────────────────────────────────────
function selectContentType(type) {
  currentType  = type;
  statusFilter = 'all';

  document.querySelectorAll('.gen-nav-item').forEach(b =>
    b.classList.toggle('active', b.dataset.type === type));
  document.querySelectorAll('.inf-item').forEach(b => b.classList.remove('active'));

  const cfg = CONTENT_TYPES[type];
  const badge = document.getElementById('ct-badge');
  badge.className = `content-type-badge ${type}`;
  badge.textContent = cfg.icon;
  document.getElementById('ct-title').textContent = cfg.label;
  document.getElementById('ct-sub').textContent   = cfg.sub + ' · ' + cfg.ratio;

  document.querySelectorAll('.filter').forEach((b, i) => b.classList.toggle('active', i === 0));
  show('screen-gen');
  loadPosts();
}

// ── Posts ─────────────────────────────────────────────────────────────────
async function loadPosts() {
  if (!currentInfId || !currentType) return;
  clearInterval(pollTimer);

  const q = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
  const posts = await api(`/api/influencers/${currentInfId}/posts?content_type=${currentType}${q}`);

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
  const imgs  = p.image_urls || [];
  const cfg   = CONTENT_TYPES[p.content_type] || {};
  const isSquare = p.content_type === 'instagram';
  const imgClass = isSquare ? 'post-img-sq' : 'post-img';
  const allUrls  = JSON.stringify(imgs).replace(/"/g, '&quot;');

  let imagesHtml;
  if (p.status === 'done' && imgs.length) {
    imagesHtml = `<div class="post-images">
      ${imgs.map((url, i) => `
        <img class="${imgClass}" src="${url}" loading="lazy"
             onclick='openViewer(${allUrls}, ${i})' />
      `).join('')}
    </div>`;
  } else {
    const info = {
      generating: ['badge-gen', '<div class="spin"></div>', 'Génération en cours…'],
      pending:    ['badge-pend', '', 'En attente…'],
      failed:     ['badge-fail', '✕', 'Échec'],
    }[p.status] || ['badge-pend', '', '—'];
    imagesHtml = `<div class="post-placeholder">${info[1]}<span>${info[2]}</span></div>`;
  }

  const badge = {
    done:       `<span class="badge badge-done">✓ Terminé</span>`,
    generating: `<span class="badge badge-gen"><div class="spin"></div> En cours</span>`,
    pending:    `<span class="badge badge-pend">En attente</span>`,
    failed:     `<span class="badge badge-fail">✕ Échec</span>`,
  }[p.status] || '';

  return `
    <div class="post-card">
      <div class="post-card-header">
        <div class="post-card-prompt" title="${esc(p.prompt)}">${esc(p.prompt)}</div>
        ${badge}
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
  document.getElementById('modal-type-header').textContent = cfg.label + ' · ' + cfg.sub;
  document.getElementById('modal-single-title').textContent = 'Nouveau post ' + cfg.label;
  document.getElementById('s-prompt').value = '';

  // Remplir select count
  const sel = document.getElementById('s-count');
  sel.innerHTML = '';
  for (let i = cfg.min; i <= cfg.max; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${i} image${i > 1 ? 's' : ''}`;
    if (i === cfg.max) opt.selected = true;
    sel.appendChild(opt);
  }
  openModal('single');
}

async function submitSingle(e) {
  e.preventDefault();
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
}

function openBulkModal() {
  const cfg = CONTENT_TYPES[currentType];
  document.getElementById('modal-bulk-type-header').textContent = cfg.label + ' · ' + cfg.sub;
  document.getElementById('modal-bulk-title').textContent = 'Génération en masse — ' + cfg.label;
  document.getElementById('b-prompts').value = '';
  document.getElementById('b-count').textContent = '0 posts';

  const sel = document.getElementById('b-count-img');
  sel.innerHTML = '';
  for (let i = cfg.min; i <= cfg.max; i++) {
    const opt = document.createElement('option');
    opt.value = i;
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
      image_count: +document.getElementById('b-count-img').value,
      model:       document.getElementById('b-model').value,
    });
    closeModal('bulk');
    e.target.reset();
    document.getElementById('b-count').textContent = '0 posts';
    toast(`${prompts.length} posts lancés`);
    loadPosts();
  } finally {
    btn.disabled = false; btn.textContent = 'Lancer';
  }
}

// ── Ajouter influenceur ───────────────────────────────────────────────────
async function submitAddInf(e) {
  e.preventDefault();
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
}

// ── Viewer ────────────────────────────────────────────────────────────────
function openViewer(urls, index) {
  viewerImages = typeof urls === 'string' ? JSON.parse(urls) : urls;
  viewerIndex  = index;
  updateViewer();
  openModal('viewer');
}

function updateViewer() {
  document.getElementById('viewer-img').src = viewerImages[viewerIndex];
  document.getElementById('viewer-counter').textContent =
    viewerImages.length > 1 ? `${viewerIndex + 1} / ${viewerImages.length}` : '';
}

function viewerNav(dir) {
  viewerIndex = (viewerIndex + dir + viewerImages.length) % viewerImages.length;
  updateViewer();
}

// ── Modals ────────────────────────────────────────────────────────────────
function openModal(name)  { document.getElementById(`modal-${name}`).classList.add('open'); }
function closeModal(name) { document.getElementById(`modal-${name}`).classList.remove('open'); }

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.overlay.open').forEach(m => m.classList.remove('open'));
  if (e.key === 'ArrowLeft')  viewerNav(-1);
  if (e.key === 'ArrowRight') viewerNav(1);
});

// ── Helpers ───────────────────────────────────────────────────────────────
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

function fmtDate(dt) {
  return new Date(dt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function toast(msg, err = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (err ? ' toast-err' : '');
  el.textContent = msg;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

async function api(path, method = 'GET', body = null) {
  const r = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : null,
  });
  if (r.status === 204) return null;
  const data = await r.json();
  if (!r.ok) throw new Error(data.detail || 'Erreur');
  return data;
}

function esc(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

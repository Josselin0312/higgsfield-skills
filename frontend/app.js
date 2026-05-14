// ── State ──────────────────────────────────────────────────────────────────
let currentInfId = null;
let filter = 'all';
let pollTimer = null;

// ── Boot ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => loadInfluencers());

// ── Influenceurs ───────────────────────────────────────────────────────────
async function loadInfluencers() {
  const list = await api('/api/influencers');
  const nav  = document.getElementById('inf-nav');
  nav.innerHTML = list.map(i => `
    <div class="inf-item ${i.id === currentInfId ? 'active' : ''}"
         onclick="selectInf(${i.id})" data-id="${i.id}">
      <div class="inf-item-dot">${i.name[0].toUpperCase()}</div>
      ${esc(i.name)}
    </div>
  `).join('');

  if (list.length === 0) {
    show('screen-empty');
  } else if (!currentInfId) {
    selectInf(list[0].id);
  }
}

async function selectInf(id) {
  currentInfId = id;
  document.querySelectorAll('.inf-item').forEach(el =>
    el.classList.toggle('active', +el.dataset.id === id));

  const inf = await api(`/api/influencers/${id}`);
  document.getElementById('top-name').textContent = inf.name;
  document.getElementById('top-sub').textContent  = [inf.handle, inf.niche].filter(Boolean).join(' · ');
  document.getElementById('top-avatar').textContent = inf.name[0].toUpperCase();

  show('screen-inf');
  filter = 'all';
  document.querySelectorAll('.filter').forEach((b, i) => b.classList.toggle('active', i === 0));
  await loadGallery();
}

// ── Galerie ────────────────────────────────────────────────────────────────
async function loadGallery() {
  if (!currentInfId) return;
  clearInterval(pollTimer);

  const q = filter !== 'all' ? `?status=${filter}` : '';
  const gens = await api(`/api/influencers/${currentInfId}/generations${q}`);

  const grid  = document.getElementById('gallery');
  const empty = document.getElementById('gallery-empty');

  if (gens.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'flex';
  } else {
    empty.style.display = 'none';
    grid.innerHTML = gens.map(renderCard).join('');
  }

  const hasPending = gens.some(g => g.status === 'pending' || g.status === 'generating');
  if (hasPending) {
    pollTimer = setInterval(loadGallery, 6000);
  }
}

function renderCard(g) {
  const imgs = g.image_urls || [];

  if (g.status === 'done' && imgs.length) {
    return imgs.map(url => `
      <div class="card">
        <img class="card-img" src="${url}" loading="lazy"
             onclick="viewImg('${url}')" />
        <div class="card-body">
          <div class="card-prompt" title="${esc(g.prompt)}">${esc(g.prompt)}</div>
          <span class="badge badge-done">Terminé</span>
        </div>
      </div>
    `).join('');
  }

  const info = {
    generating: ['badge-gen',  '<div class="spin"></div>', 'Génération…'],
    pending:    ['badge-pending','○',                       'En attente'],
    failed:     ['badge-fail', '✕',                        'Échec'],
  }[g.status] || ['badge-pending','○','—'];

  return `
    <div class="card">
      <div class="card-placeholder">${info[1]}<span>${info[2]}</span></div>
      <div class="card-body">
        <div class="card-prompt" title="${esc(g.prompt)}">${esc(g.prompt)}</div>
        <span class="badge ${info[0]}">${info[2]}</span>
      </div>
    </div>`;
}

function setFilter(f, btn) {
  filter = f;
  document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadGallery();
}

// ── Ajouter influenceur ────────────────────────────────────────────────────
async function submitAddInf(e) {
  e.preventDefault();
  await api('/api/influencers', 'POST', {
    name:   document.getElementById('ai-name').value,
    handle: document.getElementById('ai-handle').value || null,
    niche:  document.getElementById('ai-niche').value  || null,
  });
  closeModal('add-inf');
  e.target.reset();
  toast('Influenceur créé');
  await loadInfluencers();
}

// ── Générer ────────────────────────────────────────────────────────────────
async function submitGenerate(e) {
  e.preventDefault();
  await api(`/api/influencers/${currentInfId}/generations`, 'POST', {
    prompt:       document.getElementById('g-prompt').value,
    aspect_ratio: document.getElementById('g-ratio').value,
    count:        +document.getElementById('g-count').value,
    model:        document.getElementById('g-model').value,
  });
  closeModal('generate');
  e.target.reset();
  toast('Génération lancée');
  await loadGallery();
}

// ── Bulk ───────────────────────────────────────────────────────────────────
function countPrompts() {
  const n = getPrompts().length;
  document.getElementById('b-count').textContent = `${n} prompt${n !== 1 ? 's' : ''}`;
}

function getPrompts() {
  return document.getElementById('b-prompts').value
    .split('\n').map(l => l.trim()).filter(Boolean);
}

async function submitBulk(e) {
  e.preventDefault();
  const prompts = getPrompts();
  if (!prompts.length) { toast('Ajoute au moins un prompt', true); return; }

  const btn = document.getElementById('bulk-submit');
  btn.disabled = true; btn.textContent = 'Lancement…';

  try {
    await api(`/api/influencers/${currentInfId}/bulk`, 'POST', {
      prompts,
      aspect_ratio: document.getElementById('b-ratio').value,
      count:        +document.getElementById('b-count-per').value,
      model:        document.getElementById('b-model').value,
    });
    closeModal('bulk');
    e.target.reset();
    document.getElementById('b-count').textContent = '0 prompts';
    toast(`${prompts.length} générations lancées`);
    await loadGallery();
  } finally {
    btn.disabled = false; btn.textContent = 'Lancer';
  }
}

// ── Viewer ─────────────────────────────────────────────────────────────────
function viewImg(url) {
  document.getElementById('viewer-img').src = url;
  openModal('viewer');
}

// ── Modals ─────────────────────────────────────────────────────────────────
function openModal(name) {
  document.getElementById(`modal-${name}`).classList.add('open');
}
function closeModal(name) {
  document.getElementById(`modal-${name}`).classList.remove('open');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape')
    document.querySelectorAll('.overlay.open').forEach(m => m.classList.remove('open'));
});

// ── Helpers ────────────────────────────────────────────────────────────────
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
  document.getElementById(id).style.display = 'block';
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
  if (!r.ok) throw Object.assign(new Error(data.detail || 'Erreur'), { data });
  return data;
}

function esc(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

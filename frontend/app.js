const API = '';  // same origin

// ── State ─────────────────────────────────────────────────────────────────────
let state = {
  influencers: [],
  currentInfluencerId: null,
  currentInfluencer: null,
  generations: [],
  bulkJobs: [],
  galleryFilter: 'all',
  pollIntervals: {},
};

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  createToastContainer();
  await loadInfluencers();
  navigate('dashboard');

  // Count prompts live
  const bulkPrompts = document.getElementById('bulk-prompts');
  if (bulkPrompts) {
    bulkPrompts.addEventListener('input', updatePromptCount);
  }
});

// ── Navigation ────────────────────────────────────────────────────────────────
function navigate(view, influencerId = null) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.nav-influencer').forEach(b => b.classList.remove('active'));

  if (view === 'dashboard') {
    document.getElementById('view-dashboard').classList.add('active');
    document.querySelector('[data-view="dashboard"]').classList.add('active');
    renderDashboard();
  } else if (view === 'influencer' && influencerId) {
    state.currentInfluencerId = influencerId;
    document.getElementById('view-influencer').classList.add('active');
    const navItem = document.querySelector(`.nav-influencer[data-id="${influencerId}"]`);
    if (navItem) navItem.classList.add('active');
    loadInfluencerView(influencerId);
  }
}

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.getElementById(`tab-${tab}`).classList.add('active');

  if (tab === 'bulk') loadBulkJobs();
}

// ── Influencers ───────────────────────────────────────────────────────────────
async function loadInfluencers() {
  try {
    state.influencers = await apiFetch('/api/influencers');
    renderSidebarInfluencers();
  } catch (e) {
    toast('Erreur chargement influenceurs', 'error');
  }
}

function renderSidebarInfluencers() {
  const nav = document.getElementById('influencer-list-nav');
  nav.innerHTML = state.influencers.map(inf => `
    <div class="nav-influencer" data-id="${inf.id}" onclick="navigate('influencer', ${inf.id})">
      <div class="nav-avatar">
        ${inf.avatar_url
          ? `<img src="${inf.avatar_url}" alt="${inf.name}" onerror="this.style.display='none'">`
          : inf.name[0].toUpperCase()}
      </div>
      <span>${inf.name}</span>
    </div>
  `).join('');
}

function renderDashboard() {
  const stats = document.getElementById('dashboard-stats');
  const totalGens = state.influencers.reduce((s, i) => s + (i.total_generations || 0), 0);
  const doneGens = state.influencers.reduce((s, i) => s + (i.done_generations || 0), 0);
  stats.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${state.influencers.length}</div>
      <div class="stat-label">Influenceurs</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${totalGens}</div>
      <div class="stat-label">Générations totales</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${doneGens}</div>
      <div class="stat-label">Images terminées</div>
    </div>
  `;

  const grid = document.getElementById('dashboard-influencers');
  if (state.influencers.length === 0) {
    grid.innerHTML = `<div class="empty-state"><p>Aucun influenceur. Commencez par en ajouter un !</p><button class="btn btn-primary" onclick="openAddInfluencer()">+ Ajouter</button></div>`;
    return;
  }
  grid.innerHTML = state.influencers.map(inf => `
    <div class="influencer-card" onclick="navigate('influencer', ${inf.id})">
      <div class="inf-card-avatar">
        ${inf.avatar_url
          ? `<img src="${inf.avatar_url}" alt="${inf.name}" onerror="this.style.display='none'">`
          : inf.name[0].toUpperCase()}
      </div>
      <div class="inf-card-name">${inf.name}</div>
      ${inf.handle ? `<div class="inf-card-handle">${inf.handle}</div>` : ''}
      ${inf.niche ? `<div class="inf-card-niche">${inf.niche}</div>` : ''}
      <div class="inf-card-stats">
        <div><strong>${inf.total_generations || 0}</strong>jobs</div>
        <div><strong>${inf.done_generations || 0}</strong>images</div>
      </div>
    </div>
  `).join('');
}

// ── Influencer view ───────────────────────────────────────────────────────────
async function loadInfluencerView(id) {
  try {
    state.currentInfluencer = await apiFetch(`/api/influencers/${id}`);
    const inf = state.currentInfluencer;

    document.getElementById('inf-name').textContent = inf.name;
    document.getElementById('inf-meta').textContent = [inf.handle, inf.niche].filter(Boolean).join(' · ');

    // Fill settings form
    document.getElementById('settings-name').value = inf.name || '';
    document.getElementById('settings-handle').value = inf.handle || '';
    document.getElementById('settings-niche').value = inf.niche || '';
    document.getElementById('settings-style').value = inf.style_notes || '';
    document.getElementById('settings-avatar').value = inf.avatar_url || '';

    // Default to gallery tab
    switchTab('gallery');
    state.galleryFilter = 'all';
    document.querySelectorAll('.filter-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
    await loadGallery();
  } catch (e) {
    toast('Erreur chargement influenceur', 'error');
  }
}

// ── Gallery ───────────────────────────────────────────────────────────────────
async function loadGallery() {
  try {
    const params = state.galleryFilter !== 'all' ? `?status=${state.galleryFilter}` : '';
    state.generations = await apiFetch(`/api/influencers/${state.currentInfluencerId}/generations${params}`);
    renderGallery();
    schedulePollForPending();
  } catch (e) {
    toast('Erreur chargement galerie', 'error');
  }
}

function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  const empty = document.getElementById('gallery-empty');

  if (state.generations.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = state.generations.map(gen => renderGalleryItem(gen)).join('');
}

function renderGalleryItem(gen) {
  const images = gen.image_urls || [];
  const statusHtml = statusBadge(gen.status);

  if (gen.status === 'done' && images.length > 0) {
    return images.map((url, i) => `
      <div class="gallery-item">
        <img class="gallery-item-img" src="${url}" alt="Image" loading="lazy"
             onclick="openImageViewer('${url}', '${esc(gen.prompt)}')">
        <div class="gallery-item-meta">
          <div class="gallery-item-prompt" title="${esc(gen.prompt)}">${esc(gen.prompt)}</div>
          ${statusHtml}
        </div>
      </div>
    `).join('');
  }

  const icon = gen.status === 'generating' || gen.status === 'pending'
    ? '<div class="spinner"></div>'
    : gen.status === 'failed' ? '✕' : '?';

  return `
    <div class="gallery-item" id="gen-${gen.id}">
      <div class="gallery-item-placeholder">
        ${icon}
        <span>${gen.status === 'generating' ? 'Génération…' : gen.status === 'pending' ? 'En attente…' : 'Échec'}</span>
      </div>
      <div class="gallery-item-meta">
        <div class="gallery-item-prompt" title="${esc(gen.prompt)}">${esc(gen.prompt)}</div>
        ${statusHtml}
        ${gen.error ? `<div style="font-size:11px;color:var(--red);margin-top:4px">${esc(gen.error)}</div>` : ''}
      </div>
    </div>
  `;
}

function statusBadge(status) {
  const map = {
    done: ['done', 'Terminé'],
    generating: ['generating', 'En cours'],
    pending: ['pending', 'En attente'],
    failed: ['failed', 'Échec'],
  };
  const [cls, label] = map[status] || ['pending', status];
  return `<span class="status-badge status-${cls}">${label}</span>`;
}

function filterGallery(filter, btn) {
  state.galleryFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadGallery();
}

function schedulePollForPending() {
  const id = state.currentInfluencerId;
  const hasPending = state.generations.some(g => g.status === 'pending' || g.status === 'generating');

  if (state.pollIntervals[id]) {
    clearInterval(state.pollIntervals[id]);
    delete state.pollIntervals[id];
  }

  if (hasPending) {
    state.pollIntervals[id] = setInterval(async () => {
      if (state.currentInfluencerId !== id) {
        clearInterval(state.pollIntervals[id]);
        return;
      }
      await loadGallery();
      const stillPending = state.generations.some(g => g.status === 'pending' || g.status === 'generating');
      if (!stillPending) {
        clearInterval(state.pollIntervals[id]);
        delete state.pollIntervals[id];
      }
    }, 6000);
  }
}

// ── Bulk jobs ─────────────────────────────────────────────────────────────────
async function loadBulkJobs() {
  try {
    state.bulkJobs = await apiFetch(`/api/influencers/${state.currentInfluencerId}/bulk`);
    renderBulkJobs();
  } catch (e) {
    toast('Erreur chargement jobs', 'error');
  }
}

function renderBulkJobs() {
  const list = document.getElementById('bulk-jobs-list');
  const empty = document.getElementById('bulk-empty');

  if (state.bulkJobs.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  list.innerHTML = state.bulkJobs.map(job => {
    const pct = job.total > 0 ? Math.round(((job.done + job.failed) / job.total) * 100) : 0;
    return `
      <div class="bulk-job-card">
        <div class="bulk-job-header">
          <div class="bulk-job-name">${esc(job.name || 'Job sans nom')}</div>
          ${statusBadge(job.status === 'running' ? 'generating' : 'done')}
        </div>
        <div class="bulk-progress">
          <div class="bulk-progress-bar" style="width:${pct}%"></div>
        </div>
        <div class="bulk-job-stats">
          <span>${job.done} terminés</span>
          <span>${job.failed} échoués</span>
          <span>${job.total} total</span>
          <span>${new Date(job.created_at).toLocaleDateString('fr-FR')}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ── Modals ────────────────────────────────────────────────────────────────────
function openAddInfluencer() {
  document.getElementById('new-inf-name').value = '';
  document.getElementById('new-inf-handle').value = '';
  document.getElementById('new-inf-niche').value = '';
  document.getElementById('new-inf-style').value = '';
  showModal('modal-add-influencer');
}

async function submitAddInfluencer(e) {
  e.preventDefault();
  try {
    const inf = await apiFetch('/api/influencers', 'POST', {
      name: document.getElementById('new-inf-name').value,
      handle: document.getElementById('new-inf-handle').value || null,
      niche: document.getElementById('new-inf-niche').value || null,
      style_notes: document.getElementById('new-inf-style').value || null,
    });
    closeModal('modal-add-influencer');
    await loadInfluencers();
    toast(`Influenceur "${inf.name}" créé`, 'success');
    navigate('influencer', inf.id);
  } catch (e) {
    toast(e.message || 'Erreur création', 'error');
  }
}

function openSingleGenerate() {
  showModal('modal-single-generate');
}

async function submitSingleGenerate(e) {
  e.preventDefault();
  try {
    await apiFetch(`/api/influencers/${state.currentInfluencerId}/generations`, 'POST', {
      prompt: document.getElementById('gen-prompt').value,
      model: document.getElementById('gen-model').value,
      aspect_ratio: document.getElementById('gen-ratio').value,
      count: parseInt(document.getElementById('gen-count').value),
    });
    closeModal('modal-single-generate');
    document.getElementById('gen-prompt').value = '';
    toast('Génération lancée', 'success');
    switchTab('gallery');
    await loadGallery();
  } catch (e) {
    toast(e.message || 'Erreur génération', 'error');
  }
}

function openBulkGenerate() {
  document.getElementById('bulk-name').value = '';
  document.getElementById('bulk-prompts').value = '';
  document.getElementById('bulk-prompt-count').textContent = '0 prompts';
  showModal('modal-bulk-generate');
}

function updatePromptCount() {
  const text = document.getElementById('bulk-prompts').value;
  const count = text.split('\n').filter(l => l.trim()).length;
  document.getElementById('bulk-prompt-count').textContent = `${count} prompt${count !== 1 ? 's' : ''}`;
}

async function submitBulkGenerate(e) {
  e.preventDefault();
  const rawPrompts = document.getElementById('bulk-prompts').value;
  const prompts = rawPrompts.split('\n').map(l => l.trim()).filter(Boolean);
  if (prompts.length === 0) {
    toast('Ajoutez au moins un prompt', 'error');
    return;
  }
  const btn = document.getElementById('bulk-submit-btn');
  btn.disabled = true;
  btn.textContent = 'Lancement…';
  try {
    const result = await apiFetch(`/api/influencers/${state.currentInfluencerId}/bulk`, 'POST', {
      name: document.getElementById('bulk-name').value || null,
      prompts,
      model: document.getElementById('bulk-model').value,
      aspect_ratio: document.getElementById('bulk-ratio').value,
      count: parseInt(document.getElementById('bulk-count').value),
    });
    closeModal('modal-bulk-generate');
    toast(`${prompts.length} générations lancées`, 'success');
    switchTab('gallery');
    await loadGallery();
  } catch (err) {
    toast(err.message || 'Erreur lancement bulk', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Lancer';
  }
}

async function saveInfluencerSettings(e) {
  e.preventDefault();
  try {
    const updated = await apiFetch(`/api/influencers/${state.currentInfluencerId}`, 'PUT', {
      name: document.getElementById('settings-name').value,
      handle: document.getElementById('settings-handle').value || null,
      niche: document.getElementById('settings-niche').value || null,
      style_notes: document.getElementById('settings-style').value || null,
      avatar_url: document.getElementById('settings-avatar').value || null,
    });
    state.currentInfluencer = updated;
    document.getElementById('inf-name').textContent = updated.name;
    document.getElementById('inf-meta').textContent = [updated.handle, updated.niche].filter(Boolean).join(' · ');
    await loadInfluencers();
    toast('Paramètres enregistrés', 'success');
  } catch (e) {
    toast(e.message || 'Erreur mise à jour', 'error');
  }
}

async function confirmDeleteInfluencer() {
  if (!confirm(`Supprimer ${state.currentInfluencer?.name} et toutes ses générations ?`)) return;
  try {
    await apiFetch(`/api/influencers/${state.currentInfluencerId}`, 'DELETE');
    await loadInfluencers();
    navigate('dashboard');
    toast('Influenceur supprimé', 'success');
  } catch (e) {
    toast('Erreur suppression', 'error');
  }
}

// ── Image viewer ──────────────────────────────────────────────────────────────
function openImageViewer(url, prompt) {
  document.getElementById('viewer-img').src = url;
  document.getElementById('viewer-meta').textContent = prompt;
  showModal('modal-image-viewer');
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
function showModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
  }
});

// ── Toast ─────────────────────────────────────────────────────────────────────
function createToastContainer() {
  const el = document.createElement('div');
  el.id = 'toast-container';
  document.body.appendChild(el);
}

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ── API helper ────────────────────────────────────────────────────────────────
async function apiFetch(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(API + path, opts);
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || JSON.stringify(data));
  return data;
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const state = {
  projects: [],
  metadata: { categories: [], difficulties: [], statuses: [] },
  editingId: null,
};

const el = (id) => document.getElementById(id);
const modal = el('modalBackdrop');
const form = el('projectForm');

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!response.ok) {
    const message = data?.message || data?.error || data?.title || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

function toast(message) {
  const node = el('toast');
  node.textContent = message;
  node.classList.remove('hidden');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => node.classList.add('hidden'), 2500);
}

function showError(message = '') {
  const banner = el('errorBanner');
  if (!message) {
    banner.classList.add('hidden');
    banner.textContent = '';
    return;
  }
  banner.textContent = message;
  banner.classList.remove('hidden');
}

function setOptions(selectId, items, placeholder = null) {
  const select = el(selectId);
  const current = select.value;
  const options = [];
  if (placeholder !== null) options.push(`<option value="">${escapeHtml(placeholder)}</option>`);
  options.push(...items.map(item => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`));
  select.innerHTML = options.join('');
  if ([...select.options].some(o => o.value === current)) select.value = current;
}

async function loadMetadata() {
  state.metadata = await api('/api/metadata');
  setOptions('statusFilter', state.metadata.statuses, 'All statuses');
  setOptions('categoryFilter', state.metadata.categories, 'All categories');
  setOptions('difficultyFilter', state.metadata.difficulties, 'All levels');
  setOptions('category', state.metadata.categories);
  setOptions('difficulty', state.metadata.difficulties);
  setOptions('status', state.metadata.statuses);
}

function queryString() {
  const params = new URLSearchParams();
  const values = {
    search: el('searchInput').value.trim(),
    status: el('statusFilter').value,
    category: el('categoryFilter').value,
    difficulty: el('difficultyFilter').value,
  };
  for (const [key, value] of Object.entries(values)) if (value) params.set(key, value);
  const result = params.toString();
  return result ? `?${result}` : '';
}

async function loadProjects() {
  try {
    showError();
    state.projects = await api(`/api/projects${queryString()}`);
    renderProjects();
  } catch (error) {
    state.projects = [];
    renderProjects();
    showError(error.message);
  }
}

async function loadStats() {
  try {
    const stats = await api('/api/stats');
    el('statTotal').textContent = stats.total;
    el('statActive').textContent = stats.active;
    el('statCompleted').textContent = stats.completed;
    el('statProgress').textContent = `${stats.averageProgress}%`;
  } catch {
    ['statTotal','statActive','statCompleted','statProgress'].forEach(id => el(id).textContent = '—');
  }
}

function statusClass(status) {
  return status.toLowerCase().replaceAll(' ', '-');
}

function renderProjects() {
  const list = el('projectList');
  el('projectCount').textContent = `${state.projects.length} project${state.projects.length === 1 ? '' : 's'}`;
  el('emptyState').classList.toggle('hidden', state.projects.length !== 0);

  list.innerHTML = state.projects.map(project => `
    <article class="project-card">
      <div>
        <div class="card-topline">
          <span class="tag category">${escapeHtml(project.category)}</span>
          <span class="tag ${statusClass(project.status)}">${escapeHtml(project.status)}</span>
        </div>
        <h4>${escapeHtml(project.title)}</h4>
        <p>${escapeHtml(project.description)}</p>
        <div class="project-meta">
          <span>Owner: <b>${escapeHtml(project.owner)}</b></span>
          <span>Level: <b>${escapeHtml(project.difficulty)}</b></span>
          ${project.repositoryUrl ? `<a href="${escapeHtml(project.repositoryUrl)}" target="_blank" rel="noreferrer">Repository ↗</a>` : ''}
        </div>
        <div class="progress-row">
          <div class="progress-track"><div class="progress-fill" style="width:${Number(project.progress)}%"></div></div>
          <span class="progress-label">${Number(project.progress)}%</span>
        </div>
      </div>
      <div class="card-actions">
        <button class="ghost-btn" data-edit="${project.id}">Edit</button>
        <button class="ghost-btn danger-btn" data-delete="${project.id}">Delete</button>
      </div>
    </article>
  `).join('');

  document.querySelectorAll('[data-edit]').forEach(button => {
    button.addEventListener('click', () => openEdit(Number(button.dataset.edit)));
  });
  document.querySelectorAll('[data-delete]').forEach(button => {
    button.addEventListener('click', () => deleteProject(Number(button.dataset.delete)));
  });
}

function resetForm() {
  form.reset();
  state.editingId = null;
  el('projectId').value = '';
  el('progress').value = 35;
  el('progressValue').textContent = '35%';
  if (state.metadata.categories.length) el('category').value = state.metadata.categories[0];
  if (state.metadata.difficulties.length) el('difficulty').value = state.metadata.difficulties[0];
  if (state.metadata.statuses.length) el('status').value = state.metadata.statuses[0];
}

function openCreate() {
  resetForm();
  el('modalEyebrow').textContent = 'NEW RECORD';
  el('modalTitle').textContent = 'Add Project';
  el('saveBtn').textContent = 'Save Project';
  modal.classList.remove('hidden');
  setTimeout(() => el('title').focus(), 30);
}

function openEdit(id) {
  const project = state.projects.find(item => item.id === id);
  if (!project) return;

  state.editingId = id;
  el('projectId').value = id;
  el('title').value = project.title;
  el('category').value = project.category;
  el('difficulty').value = project.difficulty;
  el('status').value = project.status;
  el('owner').value = project.owner;
  el('repositoryUrl').value = project.repositoryUrl || '';
  el('description').value = project.description;
  el('progress').value = project.progress;
  el('progressValue').textContent = `${project.progress}%`;
  el('modalEyebrow').textContent = 'UPDATE RECORD';
  el('modalTitle').textContent = 'Edit Project';
  el('saveBtn').textContent = 'Update Project';
  modal.classList.remove('hidden');
}

function closeModal() { modal.classList.add('hidden'); }

function formPayload() {
  return {
    title: el('title').value.trim(),
    category: el('category').value,
    difficulty: el('difficulty').value,
    status: el('status').value,
    owner: el('owner').value.trim(),
    description: el('description').value.trim(),
    repositoryUrl: el('repositoryUrl').value.trim() || null,
    progress: Number(el('progress').value),
  };
}

async function saveProject(event) {
  event.preventDefault();
  const payload = formPayload();
  const editing = state.editingId !== null;

  try {
    el('saveBtn').disabled = true;
    await api(editing ? `/api/projects/${state.editingId}` : '/api/projects', {
      method: editing ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    });
    closeModal();
    toast(editing ? 'Project updated' : 'Project created');
    await Promise.all([loadProjects(), loadStats()]);
  } catch (error) {
    toast(error.message);
  } finally {
    el('saveBtn').disabled = false;
  }
}

async function deleteProject(id) {
  const project = state.projects.find(item => item.id === id);
  if (!project || !confirm(`Delete "${project.title}"?`)) return;

  try {
    await api(`/api/projects/${id}`, { method: 'DELETE' });
    toast('Project deleted');
    await Promise.all([loadProjects(), loadStats()]);
  } catch (error) {
    toast(error.message);
  }
}

let searchTimer;
el('searchInput').addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadProjects, 250);
});
['statusFilter','categoryFilter','difficultyFilter'].forEach(id => el(id).addEventListener('change', loadProjects));
el('refreshBtn').addEventListener('click', () => Promise.all([loadProjects(), loadStats()]));
el('openCreateBtn').addEventListener('click', openCreate);
el('closeModalBtn').addEventListener('click', closeModal);
el('cancelBtn').addEventListener('click', closeModal);
el('progress').addEventListener('input', event => el('progressValue').textContent = `${event.target.value}%`);
form.addEventListener('submit', saveProject);
modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); });

(async function start() {
  try {
    await loadMetadata();
    await Promise.all([loadProjects(), loadStats()]);
  } catch (error) {
    showError(error.message);
  }
})();

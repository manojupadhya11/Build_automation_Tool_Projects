const state = {
  projects: [],
  metadata: { categories: [], difficulties: [], statuses: [] },
  deleteId: null,
  view: 'cards'
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (response.status === 204) return null;
  const body = await response.json();
  if (!response.ok) {
    const error = new Error(body.error || 'Request failed.');
    error.fields = body.fields || {};
    throw error;
  }
  return body;
}

function statusClass(status) {
  return `status-${status.toLowerCase().replaceAll(' ', '-')}`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function fillSelect(select, values, placeholder) {
  select.innerHTML = placeholder ? `<option value="">${placeholder}</option>` : '';
  for (const value of values) select.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`);
}

async function loadMetadata() {
  const { data } = await api('/api/metadata');
  state.metadata = data;
  fillSelect($('#statusFilter'), data.statuses, 'All statuses');
  fillSelect($('#categoryFilter'), data.categories, 'All categories');
  fillSelect($('#difficultyFilter'), data.difficulties, 'All difficulties');
  fillSelect($('#category'), data.categories);
  fillSelect($('#difficulty'), data.difficulties);
  fillSelect($('#status'), data.statuses);
}

function buildQuery() {
  const params = new URLSearchParams();
  const values = {
    search: $('#searchInput').value.trim(),
    status: $('#statusFilter').value,
    category: $('#categoryFilter').value,
    difficulty: $('#difficultyFilter').value
  };
  for (const [key, value] of Object.entries(values)) if (value) params.set(key, value);
  return params.toString();
}

async function loadProjects() {
  const query = buildQuery();
  const { data } = await api(`/api/projects${query ? `?${query}` : ''}`);
  state.projects = data;
  renderProjects();
}

async function loadStats() {
  const { data } = await api('/api/stats');
  $('#statTotal').textContent = data.total;
  $('#statActive').textContent = data.active;
  $('#statCompleted').textContent = data.completed;
  $('#statAdvanced').textContent = data.advanced;
  $('#statCategories').textContent = data.categories;
  renderStatusBars(data.byStatus, data.total);
}

function renderStatusBars(items, total) {
  const root = $('#statusBars');
  root.innerHTML = '';
  for (const item of items) {
    const percentage = total ? Math.round((item.count / total) * 100) : 0;
    root.insertAdjacentHTML('beforeend', `<div class="bar-row"><div><span>${escapeHtml(item.status)}</span><b>${item.count}</b></div><div class="bar-track"><i style="width:${percentage}%"></i></div></div>`);
  }
}

function projectActions(project) {
  return `<div class="card-actions"><button class="mini-btn" data-edit="${project.id}">Edit</button><button class="mini-btn danger-text" data-delete="${project.id}">Delete</button></div>`;
}

function renderProjects() {
  const cards = $('#projectCards');
  const tbody = $('#projectTableBody');
  cards.innerHTML = '';
  tbody.innerHTML = '';
  $('#resultCount').textContent = `${state.projects.length} project${state.projects.length === 1 ? '' : 's'}`;
  $('#emptyState').classList.toggle('hidden', state.projects.length !== 0);

  for (const project of state.projects) {
    cards.insertAdjacentHTML('beforeend', `
      <article class="project-card">
        <div class="card-top"><span class="category-tag">${escapeHtml(project.category)}</span><span class="status ${statusClass(project.status)}">${escapeHtml(project.status)}</span></div>
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.description)}</p>
        <div class="project-meta"><span>Difficulty <b>${escapeHtml(project.difficulty)}</b></span><span>Owner <b>${escapeHtml(project.owner)}</b></span></div>
        <div class="card-bottom"><small>Updated ${formatDate(project.updated_at)}</small>${projectActions(project)}</div>
      </article>`);

    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td><strong>${escapeHtml(project.title)}</strong><small>${escapeHtml(project.description).slice(0, 70)}${project.description.length > 70 ? '…' : ''}</small></td>
        <td>${escapeHtml(project.category)}</td>
        <td>${escapeHtml(project.difficulty)}</td>
        <td><span class="status ${statusClass(project.status)}">${escapeHtml(project.status)}</span></td>
        <td>${escapeHtml(project.owner)}</td>
        <td>${projectActions(project)}</td>
      </tr>`);
  }

  bindActionButtons();
}

function bindActionButtons() {
  $$('[data-edit]').forEach(btn => btn.addEventListener('click', () => openEdit(Number(btn.dataset.edit))));
  $$('[data-delete]').forEach(btn => btn.addEventListener('click', () => openDelete(Number(btn.dataset.delete))));
}

function clearErrors() {
  $$('[data-error]').forEach(node => node.textContent = '');
}

function openCreate() {
  $('#projectForm').reset();
  $('#projectId').value = '';
  $('#modalTitle').textContent = 'Create project';
  $('#saveButton').textContent = 'Save Project';
  clearErrors();
  $('#projectModal').classList.remove('hidden');
}

async function openEdit(id) {
  const { data } = await api(`/api/projects/${id}`);
  $('#projectId').value = data.id;
  $('#title').value = data.title;
  $('#category').value = data.category;
  $('#difficulty').value = data.difficulty;
  $('#status').value = data.status;
  $('#owner').value = data.owner;
  $('#repository_url').value = data.repository_url || '';
  $('#description').value = data.description;
  $('#modalTitle').textContent = 'Edit project';
  $('#saveButton').textContent = 'Update Project';
  clearErrors();
  $('#projectModal').classList.remove('hidden');
}

function closeModal() {
  $('#projectModal').classList.add('hidden');
}

function openDelete(id) {
  const project = state.projects.find(p => p.id === id);
  state.deleteId = id;
  $('#deleteProjectName').textContent = project?.title || 'this project';
  $('#deleteModal').classList.remove('hidden');
}

function closeDelete() {
  state.deleteId = null;
  $('#deleteModal').classList.add('hidden');
}

function payloadFromForm() {
  return {
    title: $('#title').value,
    category: $('#category').value,
    difficulty: $('#difficulty').value,
    status: $('#status').value,
    owner: $('#owner').value,
    repository_url: $('#repository_url').value,
    description: $('#description').value
  };
}

function showFieldErrors(fields) {
  clearErrors();
  for (const [key, message] of Object.entries(fields || {})) {
    const target = document.querySelector(`[data-error="${key}"]`);
    if (target) target.textContent = message;
  }
}

function toast(message, type = '') {
  const node = document.createElement('div');
  node.className = `toast ${type}`;
  node.textContent = message;
  $('#toastStack').appendChild(node);
  setTimeout(() => node.remove(), 3200);
}

$('#projectForm').addEventListener('submit', async event => {
  event.preventDefault();
  const id = $('#projectId').value;
  try {
    await api(id ? `/api/projects/${id}` : '/api/projects', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payloadFromForm())
    });
    closeModal();
    await Promise.all([loadProjects(), loadStats()]);
    toast(id ? 'Project updated.' : 'Project created.');
  } catch (error) {
    showFieldErrors(error.fields);
    toast(error.message, 'error');
  }
});

$('#confirmDelete').addEventListener('click', async () => {
  if (!state.deleteId) return;
  try {
    await api(`/api/projects/${state.deleteId}`, { method: 'DELETE' });
    closeDelete();
    await Promise.all([loadProjects(), loadStats()]);
    toast('Project deleted.');
  } catch (error) {
    toast(error.message, 'error');
  }
});

let searchTimer;
$('#searchInput').addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadProjects, 250);
});
['statusFilter', 'categoryFilter', 'difficultyFilter'].forEach(id => $(`#${id}`).addEventListener('change', loadProjects));
$('#clearFilters').addEventListener('click', () => {
  $('#searchInput').value = '';
  $('#statusFilter').value = '';
  $('#categoryFilter').value = '';
  $('#difficultyFilter').value = '';
  loadProjects();
});

$$('[data-open-create]').forEach(btn => btn.addEventListener('click', openCreate));
$('#closeModal').addEventListener('click', closeModal);
$('#cancelModal').addEventListener('click', closeModal);
$('#cancelDelete').addEventListener('click', closeDelete);

$$('[data-view]').forEach(btn => btn.addEventListener('click', () => {
  state.view = btn.dataset.view;
  $$('[data-view]').forEach(b => b.classList.toggle('active', b === btn));
  $('#projectCards').classList.toggle('hidden', state.view !== 'cards');
  $('#projectTableWrap').classList.toggle('hidden', state.view !== 'table');
}));

$$('[data-scroll]').forEach(btn => btn.addEventListener('click', () => {
  document.getElementById(btn.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' });
  if (window.innerWidth < 850) $('#sidebar').classList.remove('open');
}));

$('#menuButton')?.addEventListener('click', () => $('#sidebar').classList.toggle('open'));

(async function boot() {
  try {
    await loadMetadata();
    await Promise.all([loadProjects(), loadStats()]);
  } catch (error) {
    toast(`Failed to load application: ${error.message}`, 'error');
  }
})();

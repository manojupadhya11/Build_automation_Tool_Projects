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
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(normalized));
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

function queryString() {
  const params = new URLSearchParams();
  const values = {
    search: $('#searchInput').value.trim(),
    status: $('#statusFilter').value,
    category: $('#categoryFilter').value,
    difficulty: $('#difficultyFilter').value
  };
  Object.entries(values).forEach(([key, value]) => value && params.set(key, value));
  return params.toString();
}

async function loadProjects() {
  const qs = queryString();
  const { data } = await api(`/api/projects${qs ? `?${qs}` : ''}`);
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

  const max = Math.max(1, ...data.byStatus.map(item => Number(item.count)));
  $('#statusBars').innerHTML = data.byStatus.map(item => `
    <div class="bar-row">
      <span>${escapeHtml(item.status)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round(Number(item.count) / max * 100)}%"></div></div>
      <strong>${item.count}</strong>
    </div>
  `).join('') || '<p>No data yet.</p>';
}

function projectCard(project) {
  return `
    <article class="project-card">
      <div class="project-card-top">
        <div>
          <span class="category-badge">${escapeHtml(project.category)}</span>
          <h3>${escapeHtml(project.title)}</h3>
          <p>${escapeHtml(project.description)}</p>
        </div>
        <div class="card-actions">
          <button type="button" title="Edit" data-edit="${project.id}">✎</button>
          <button type="button" title="Delete" data-delete="${project.id}">⌫</button>
        </div>
      </div>
      <div class="project-card-meta">
        <div class="meta-item"><small>Status</small><strong><span class="status-badge ${statusClass(project.status)}">${escapeHtml(project.status)}</span></strong></div>
        <div class="meta-item"><small>Owner</small><strong>${escapeHtml(project.owner)}</strong></div>
        <div class="meta-item"><small>Level</small><strong>${escapeHtml(project.difficulty)}</strong></div>
        ${project.repository_url ? `<a class="repo-link" target="_blank" rel="noreferrer" title="Open repository" href="${escapeHtml(project.repository_url)}">↗</a>` : '<span></span>'}
      </div>
      <div class="project-card-meta">
        <div class="meta-item"><small>Created</small><strong>${formatDate(project.created_at)}</strong></div>
        <div class="meta-item"><small>Updated</small><strong>${formatDate(project.updated_at)}</strong></div>
        <span></span>
      </div>
    </article>
  `;
}

function projectRow(project) {
  return `
    <tr>
      <td class="table-project"><strong>${escapeHtml(project.title)}</strong><small>${escapeHtml(project.description)}</small></td>
      <td><span class="category-badge">${escapeHtml(project.category)}</span></td>
      <td>${escapeHtml(project.difficulty)}</td>
      <td><span class="status-badge ${statusClass(project.status)}">${escapeHtml(project.status)}</span></td>
      <td>${escapeHtml(project.owner)}</td>
      <td><div class="table-actions"><button data-edit="${project.id}">Edit</button><button data-delete="${project.id}">Delete</button></div></td>
    </tr>
  `;
}

function renderProjects() {
  $('#resultCount').textContent = `${state.projects.length} project${state.projects.length === 1 ? '' : 's'} found`;
  $('#projectCards').innerHTML = state.projects.map(projectCard).join('');
  $('#projectTableBody').innerHTML = state.projects.map(projectRow).join('');
  $('#emptyState').classList.toggle('hidden', state.projects.length !== 0);
  $('#projectCards').classList.toggle('hidden', state.projects.length === 0 || state.view !== 'cards');
  $('#projectTableWrap').classList.toggle('hidden', state.projects.length === 0 || state.view !== 'table');
}

function clearErrors() {
  $$('[data-error]').forEach(el => el.textContent = '');
}

function openCreate() {
  clearErrors();
  $('#projectForm').reset();
  $('#projectId').value = '';
  $('#modalTitle').textContent = 'Create project';
  $('#saveButton').textContent = 'Save Project';
  $('#category').value = 'CI/CD';
  $('#difficulty').value = 'Intermediate';
  $('#status').value = 'Planned';
  $('#owner').value = 'DevOps Shack';
  $('#projectModal').classList.remove('hidden');
  setTimeout(() => $('#title').focus(), 20);
}

function openEdit(id) {
  const project = state.projects.find(item => Number(item.id) === Number(id));
  if (!project) return;
  clearErrors();
  $('#projectId').value = project.id;
  $('#title').value = project.title;
  $('#category').value = project.category;
  $('#difficulty').value = project.difficulty;
  $('#status').value = project.status;
  $('#owner').value = project.owner;
  $('#repository_url').value = project.repository_url || '';
  $('#description').value = project.description;
  $('#modalTitle').textContent = 'Edit project';
  $('#saveButton').textContent = 'Update Project';
  $('#projectModal').classList.remove('hidden');
}

function closeProjectModal() { $('#projectModal').classList.add('hidden'); }

function openDelete(id) {
  const project = state.projects.find(item => Number(item.id) === Number(id));
  if (!project) return;
  state.deleteId = id;
  $('#deleteProjectName').textContent = project.title;
  $('#deleteModal').classList.remove('hidden');
}

function closeDeleteModal() { state.deleteId = null; $('#deleteModal').classList.add('hidden'); }

function toast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type === 'error' ? 'error' : ''}`;
  el.textContent = message;
  $('#toastStack').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

async function submitProject(event) {
  event.preventDefault();
  clearErrors();
  const id = $('#projectId').value;
  const payload = {
    title: $('#title').value,
    category: $('#category').value,
    difficulty: $('#difficulty').value,
    status: $('#status').value,
    owner: $('#owner').value,
    repository_url: $('#repository_url').value,
    description: $('#description').value
  };

  $('#saveButton').disabled = true;
  $('#saveButton').textContent = id ? 'Updating…' : 'Saving…';
  try {
    await api(id ? `/api/projects/${id}` : '/api/projects', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });
    closeProjectModal();
    toast(id ? 'Project updated successfully.' : 'Project created successfully.');
    await Promise.all([loadProjects(), loadStats()]);
  } catch (error) {
    Object.entries(error.fields || {}).forEach(([key, value]) => {
      const target = document.querySelector(`[data-error="${CSS.escape(key)}"]`);
      if (target) target.textContent = value;
    });
    if (!Object.keys(error.fields || {}).length) toast(error.message, 'error');
  } finally {
    $('#saveButton').disabled = false;
    $('#saveButton').textContent = id ? 'Update Project' : 'Save Project';
  }
}

async function confirmDelete() {
  if (!state.deleteId) return;
  try {
    await api(`/api/projects/${state.deleteId}`, { method: 'DELETE' });
    closeDeleteModal();
    toast('Project deleted.');
    await Promise.all([loadProjects(), loadStats()]);
  } catch (error) {
    toast(error.message, 'error');
  }
}

function debounce(fn, wait = 260) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait); };
}

function bindEvents() {
  $$('[data-open-create]').forEach(button => button.addEventListener('click', openCreate));
  $('#closeModal').addEventListener('click', closeProjectModal);
  $('#cancelModal').addEventListener('click', closeProjectModal);
  $('#projectForm').addEventListener('submit', submitProject);
  $('#cancelDelete').addEventListener('click', closeDeleteModal);
  $('#confirmDelete').addEventListener('click', confirmDelete);

  $('#projectModal').addEventListener('click', event => event.target === $('#projectModal') && closeProjectModal());
  $('#deleteModal').addEventListener('click', event => event.target === $('#deleteModal') && closeDeleteModal());

  document.addEventListener('click', event => {
    const edit = event.target.closest('[data-edit]');
    const remove = event.target.closest('[data-delete]');
    if (edit) openEdit(edit.dataset.edit);
    if (remove) openDelete(remove.dataset.delete);
  });

  const delayedLoad = debounce(() => loadProjects().catch(error => toast(error.message, 'error')));
  $('#searchInput').addEventListener('input', delayedLoad);
  ['#statusFilter', '#categoryFilter', '#difficultyFilter'].forEach(selector => $(selector).addEventListener('change', () => loadProjects().catch(error => toast(error.message, 'error'))));
  $('#clearFilters').addEventListener('click', () => {
    $('#searchInput').value = '';
    $('#statusFilter').value = '';
    $('#categoryFilter').value = '';
    $('#difficultyFilter').value = '';
    loadProjects().catch(error => toast(error.message, 'error'));
  });

  $$('[data-view]').forEach(button => button.addEventListener('click', () => {
    state.view = button.dataset.view;
    $$('[data-view]').forEach(item => item.classList.toggle('active', item === button));
    renderProjects();
  }));

  $$('[data-scroll]').forEach(button => button.addEventListener('click', () => {
    document.getElementById(button.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' });
    $('#sidebar').classList.remove('open');
  }));
  $('#menuButton').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeProjectModal(); closeDeleteModal(); }
  });
}

async function init() {
  try {
    bindEvents();
    await loadMetadata();
    await Promise.all([loadProjects(), loadStats()]);
  } catch (error) {
    toast(`Could not load application data: ${error.message}`, 'error');
  }
}

init();

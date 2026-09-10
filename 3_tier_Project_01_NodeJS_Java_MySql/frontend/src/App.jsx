import React, { useCallback, useEffect, useMemo, useState } from 'react';

// Use same-origin /api by default. Vite (local) or Nginx (Docker) proxies it to Spring Boot.
// Set VITE_API_URL only when the backend is intentionally hosted on a different origin.
const API = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const blankProject = {
  name: '',
  description: '',
  owner: '',
  technology: 'Spring Boot',
  environment: 'Development',
  status: 'PLANNING',
  priority: 'MEDIUM',
  progress: 0,
  dueDate: ''
};

const statusLabels = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed'
};

const icon = (name, size = 20) => {
  const paths = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    pulse: '<path d="M3 12h4l2-6 4 12 2-6h6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    edit: '<path d="M4 20h4l11-11-4-4L4 16v4z"/><path d="m13.5 6.5 4 4"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    server: '<rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 7h.01M7 17h.01"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    code: '<path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/>',
    arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>'
  };
  return <span className="svg-icon" style={{ width: size, height: size }} dangerouslySetInnerHTML={{__html:`<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`}} />;
};

function App() {
  const [view, setView] = useState('overview');
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState({ totalProjects: 0, activeProjects: 0, completedProjects: 0, criticalProjects: 0, averageProgress: 0 });
  const [activities, setActivities] = useState([]);
  const [health, setHealth] = useState('checking');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [environment, setEnvironment] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankProject);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 2800);
  };

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try { message = (await response.json()).message || message; } catch (_) {}
      throw new Error(message);
    }
    if (response.status === 204) return null;
    return response.json();
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [projectData, summaryData, activityData] = await Promise.all([
        request('/projects'), request('/dashboard/summary'), request('/activities?limit=10')
      ]);
      setProjects(projectData);
      setSummary(summaryData);
      setActivities(activityData);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadAll();
    request('/health').then(() => setHealth('online')).catch(() => setHealth('offline'));
  }, [loadAll, request]);

  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesSearch = !term || [p.name, p.description, p.owner, p.technology].some(v => v?.toLowerCase().includes(term));
      return matchesSearch && (!status || p.status === status) && (!priority || p.priority === priority) && (!environment || p.environment === environment);
    });
  }, [projects, search, status, priority, environment]);

  const environments = useMemo(() => [...new Set(projects.map(p => p.environment))].sort(), [projects]);

  const openCreate = () => {
    setEditing(null);
    setForm(blankProject);
    setModalOpen(true);
  };

  const openEdit = (project) => {
    setEditing(project);
    setForm({ ...project, dueDate: project.dueDate || '' });
    setModalOpen(true);
  };

  const saveProject = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = JSON.stringify({ ...form, progress: Number(form.progress) });
      if (editing) {
        await request(`/projects/${editing.id}`, { method: 'PUT', body });
        showToast('Project updated successfully');
      } else {
        await request('/projects', { method: 'POST', body });
        showToast('Project created successfully');
      }
      setModalOpen(false);
      await loadAll();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeProject = async () => {
    if (!deleteTarget) return;
    try {
      await request(`/projects/${deleteTarget.id}`, { method: 'DELETE' });
      showToast('Project deleted');
      setDeleteTarget(null);
      await loadAll();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const updateProgress = async (project, delta) => {
    const next = Math.max(0, Math.min(100, project.progress + delta));
    try {
      await request(`/projects/${project.id}/progress`, { method: 'PATCH', body: JSON.stringify({ progress: next }) });
      await loadAll();
      showToast(`Progress updated to ${next}%`);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">DS</div>
          <div><strong>DevOps Shack</strong><span>ProjectOps Studio</span></div>
        </div>
        <nav>
          <NavItem active={view === 'overview'} onClick={() => setView('overview')} iconName="grid" label="Overview" />
          <NavItem active={view === 'projects'} onClick={() => setView('projects')} iconName="folder" label="Projects" badge={projects.length} />
          <NavItem active={view === 'activity'} onClick={() => setView('activity')} iconName="pulse" label="Activity" />
        </nav>
        <div className="architecture-card">
          <div className="architecture-title">{icon('layers', 18)} 3-Tier Architecture</div>
          <div className="tier-row"><span>React UI</span><b>5173</b></div>
          <div className="tier-arrow">↓ REST API</div>
          <div className="tier-row"><span>Spring Boot</span><b>8080</b></div>
          <div className="tier-arrow">↓ JDBC</div>
          <div className="tier-row"><span>MySQL</span><b>3306</b></div>
        </div>
        <div className={`health ${health}`}><i></i>{health === 'online' ? 'Backend connected' : health === 'offline' ? 'Backend offline' : 'Checking backend'}</div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">JAVA • SPRING BOOT • MYSQL</p>
            <h1>{view === 'overview' ? 'Engineering Command Center' : view === 'projects' ? 'Project Workspace' : 'Activity Timeline'}</h1>
          </div>
          <div className="top-actions">
            <button className="icon-btn" onClick={loadAll} title="Refresh">{icon('refresh')}</button>
            <button className="primary-btn" onClick={openCreate}>{icon('plus', 18)} New Project</button>
          </div>
        </header>

        {view === 'overview' && <Overview summary={summary} projects={projects} activities={activities} loading={loading} onViewProjects={() => setView('projects')} onCreate={openCreate} />}
        {view === 'projects' && (
          <ProjectsView
            loading={loading} projects={filteredProjects} total={projects.length}
            search={search} setSearch={setSearch} status={status} setStatus={setStatus}
            priority={priority} setPriority={setPriority} environment={environment} setEnvironment={setEnvironment}
            environments={environments} openEdit={openEdit} setDeleteTarget={setDeleteTarget}
            updateProgress={updateProgress} onCreate={openCreate}
          />
        )}
        {view === 'activity' && <ActivityView activities={activities} />}
      </main>

      {modalOpen && <ProjectModal form={form} setForm={setForm} editing={editing} saving={saving} onClose={() => setModalOpen(false)} onSubmit={saveProject} />}
      {deleteTarget && <ConfirmModal project={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={removeProject} />}
      {toast && <div className={`toast ${toast.type}`}>{toast.type === 'success' ? icon('check', 18) : '!' }<span>{toast.message}</span></div>}
    </div>
  );
}

function NavItem({ active, onClick, iconName, label, badge }) {
  return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>{icon(iconName)}<span>{label}</span>{badge !== undefined && <b>{badge}</b>}</button>;
}

function Overview({ summary, projects, activities, loading, onViewProjects, onCreate }) {
  const stats = [
    ['Total Projects', summary.totalProjects, 'All managed workloads', 'blue'],
    ['Active', summary.activeProjects, 'Currently in delivery', 'green'],
    ['Completed', summary.completedProjects, 'Successfully shipped', 'purple'],
    ['Critical', summary.criticalProjects, 'Needs close attention', 'orange']
  ];
  const recent = projects.slice(0, 4);
  return <div className="page-enter">
    <section className="hero-card">
      <div className="hero-copy">
        <span className="hero-pill">LIVE 3-TIER DEMO</span>
        <h2>Plan. Track. Ship.<br/><em>All from one workspace.</em></h2>
        <p>A production-style project dashboard backed by a standalone Spring Boot API and persistent MySQL database.</p>
        <div className="hero-actions"><button className="primary-btn" onClick={onCreate}>{icon('plus', 18)} Create project</button><button className="ghost-btn" onClick={onViewProjects}>Explore workspace {icon('arrow', 17)}</button></div>
      </div>
      <div className="hero-visual">
        <div className="orbit orbit-one"></div><div className="orbit orbit-two"></div>
        <div className="core-badge">{icon('server', 32)}<strong>ProjectOps</strong><span>Java API</span></div>
        <div className="floating-node node-a">{icon('code', 18)} React</div>
        <div className="floating-node node-b">{icon('database', 18)} MySQL</div>
        <div className="floating-node node-c">{summary.averageProgress}% avg.</div>
      </div>
    </section>

    <section className="stat-grid">{stats.map(([label, value, note, tone]) => <StatCard key={label} label={label} value={value} note={note} tone={tone} loading={loading} />)}</section>

    <section className="dashboard-grid">
      <div className="panel">
        <div className="panel-heading"><div><span>Portfolio</span><h3>Recent projects</h3></div><button onClick={onViewProjects}>View all {icon('arrow', 15)}</button></div>
        <div className="mini-project-list">{recent.map(p => <MiniProject key={p.id} project={p} />)}</div>
      </div>
      <div className="panel">
        <div className="panel-heading"><div><span>Audit stream</span><h3>Recent activity</h3></div><div className="live-dot">Live</div></div>
        <ActivityList activities={activities.slice(0, 6)} compact />
      </div>
    </section>
  </div>;
}

function StatCard({ label, value, note, tone, loading }) {
  return <div className={`stat-card ${tone}`}><div className="stat-icon">{icon(label === 'Completed' ? 'check' : label === 'Critical' ? 'pulse' : 'folder')}</div><div><span>{label}</span><strong>{loading ? '—' : value}</strong><small>{note}</small></div></div>;
}

function MiniProject({ project }) {
  return <div className="mini-project"><div className="mini-icon">{project.name.slice(0, 2).toUpperCase()}</div><div className="mini-info"><div><strong>{project.name}</strong><span className={`status-dot ${project.status.toLowerCase()}`}>{statusLabels[project.status]}</span></div><small>{project.technology} • {project.owner}</small><div className="mini-progress"><i style={{width: `${project.progress}%`}}></i></div></div><b>{project.progress}%</b></div>;
}

function ProjectsView(props) {
  const { loading, projects, total, search, setSearch, status, setStatus, priority, setPriority, environment, setEnvironment, environments, openEdit, setDeleteTarget, updateProgress, onCreate } = props;
  const clearFilters = () => { setSearch(''); setStatus(''); setPriority(''); setEnvironment(''); };
  return <div className="page-enter">
    <div className="workspace-toolbar">
      <div className="search-box">{icon('search', 19)}<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects, owners, technology..." /></div>
      <select value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{Object.entries(statusLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select>
      <select value={priority} onChange={e => setPriority(e.target.value)}><option value="">All priorities</option>{['LOW','MEDIUM','HIGH','CRITICAL'].map(v => <option key={v}>{v}</option>)}</select>
      <select value={environment} onChange={e => setEnvironment(e.target.value)}><option value="">All environments</option>{environments.map(v => <option key={v}>{v}</option>)}</select>
      <button className="clear-btn" onClick={clearFilters}>Clear</button>
    </div>
    <div className="result-strip"><span>Showing <b>{projects.length}</b> of {total} projects</span><span>Use +/− controls to update progress instantly</span></div>
    {loading ? <div className="project-grid">{[1,2,3,4,5,6].map(i => <div className="project-card skeleton" key={i}></div>)}</div> : projects.length ? (
      <div className="project-grid">{projects.map((project, index) => <ProjectCard key={project.id} project={project} delay={index} openEdit={openEdit} setDeleteTarget={setDeleteTarget} updateProgress={updateProgress} />)}</div>
    ) : <div className="empty-state"><div>{icon('folder', 38)}</div><h3>No projects match your filters</h3><p>Clear the filters or create a new project.</p><button className="primary-btn" onClick={onCreate}>{icon('plus', 18)} New Project</button></div>}
  </div>;
}

function ProjectCard({ project, delay, openEdit, setDeleteTarget, updateProgress }) {
  return <article className="project-card" style={{animationDelay:`${delay * 45}ms`}}>
    <div className="card-top"><div className="project-avatar">{project.name.split(' ').slice(0,2).map(x => x[0]).join('')}</div><div className="card-actions"><button onClick={() => openEdit(project)}>{icon('edit', 17)}</button><button className="danger" onClick={() => setDeleteTarget(project)}>{icon('trash', 17)}</button></div></div>
    <div className="badges"><span className={`priority ${project.priority.toLowerCase()}`}>{project.priority}</span><span className={`status ${project.status.toLowerCase()}`}>{statusLabels[project.status]}</span></div>
    <h3>{project.name}</h3><p>{project.description}</p>
    <div className="meta-grid"><span>{icon('code', 16)}<small>Technology</small><b>{project.technology}</b></span><span>{icon('server', 16)}<small>Environment</small><b>{project.environment}</b></span><span>{icon('calendar', 16)}<small>Due date</small><b>{formatDate(project.dueDate)}</b></span></div>
    <div className="owner-line"><div className="owner-avatar">{project.owner.slice(0,1)}</div><span>Owned by <b>{project.owner}</b></span></div>
    <div className="progress-section"><div><span>Delivery progress</span><strong>{project.progress}%</strong></div><div className="progress-track"><i style={{width:`${project.progress}%`}}></i></div><div className="progress-controls"><button onClick={() => updateProgress(project, -10)}>−10</button><button onClick={() => updateProgress(project, 10)}>+10</button></div></div>
  </article>;
}

function ActivityView({ activities }) {
  return <div className="page-enter"><section className="panel activity-page"><div className="panel-heading"><div><span>Persistent audit trail</span><h3>Recent database activity</h3></div><div className="live-dot">MySQL backed</div></div><ActivityList activities={activities} /></section></div>;
}

function ActivityList({ activities, compact = false }) {
  if (!activities.length) return <div className="activity-empty">No activity yet.</div>;
  return <div className={`activity-list ${compact ? 'compact' : ''}`}>{activities.map(a => <div className="activity-item" key={a.id}><div className={`activity-icon ${a.action.toLowerCase()}`}>{activitySymbol(a.action)}</div><div><strong>{a.message}</strong><span>{formatDateTime(a.createdAt)}</span></div></div>)}</div>;
}

function ProjectModal({ form, setForm, editing, saving, onClose, onSubmit }) {
  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className="modal wide-modal">
      <div className="modal-header"><div><span>{editing ? 'EDIT WORKLOAD' : 'NEW WORKLOAD'}</span><h2>{editing ? 'Update project' : 'Create project'}</h2></div><button onClick={onClose}>{icon('close')}</button></div>
      <form onSubmit={onSubmit}>
        <div className="form-grid">
          <label className="full"><span>Project name *</span><input required maxLength="120" value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Platform Modernization" /></label>
          <label className="full"><span>Description *</span><textarea required maxLength="1000" rows="3" value={form.description} onChange={e => update('description', e.target.value)} placeholder="What are you building and why?" /></label>
          <label><span>Owner *</span><input required value={form.owner} onChange={e => update('owner', e.target.value)} placeholder="Platform Team" /></label>
          <label><span>Technology *</span><input required value={form.technology} onChange={e => update('technology', e.target.value)} placeholder="Spring Boot + AWS" /></label>
          <label><span>Environment *</span><select value={form.environment} onChange={e => update('environment', e.target.value)}>{['Development','QA','Staging','Production'].map(v => <option key={v}>{v}</option>)}</select></label>
          <label><span>Status *</span><select value={form.status} onChange={e => update('status', e.target.value)}>{Object.entries(statusLabels).map(([v,l]) => <option value={v} key={v}>{l}</option>)}</select></label>
          <label><span>Priority *</span><select value={form.priority} onChange={e => update('priority', e.target.value)}>{['LOW','MEDIUM','HIGH','CRITICAL'].map(v => <option key={v}>{v}</option>)}</select></label>
          <label><span>Due date</span><input type="date" value={form.dueDate || ''} onChange={e => update('dueDate', e.target.value)} /></label>
          <label className="full range-label"><span>Progress <b>{form.progress}%</b></span><input type="range" min="0" max="100" step="5" value={form.progress} onChange={e => update('progress', Number(e.target.value))} /></label>
        </div>
        <div className="modal-footer"><button type="button" className="ghost-btn" onClick={onClose}>Cancel</button><button className="primary-btn" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Create project'} {icon('arrow', 17)}</button></div>
      </form>
    </div>
  </div>;
}

function ConfirmModal({ project, onClose, onConfirm }) {
  return <div className="modal-backdrop"><div className="modal confirm-modal"><div className="confirm-icon">{icon('trash', 26)}</div><h2>Delete project?</h2><p><b>{project.name}</b> will be permanently removed from MySQL. This cannot be undone.</p><div className="modal-footer"><button className="ghost-btn" onClick={onClose}>Cancel</button><button className="danger-btn" onClick={onConfirm}>Delete project</button></div></div></div>;
}

const formatDate = value => value ? new Intl.DateTimeFormat('en-IN', { day:'2-digit', month:'short', year:'numeric' }).format(new Date(`${value}T00:00:00`)) : 'Not set';
const formatDateTime = value => value ? new Intl.DateTimeFormat('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }).format(new Date(value)) : '';
const activitySymbol = action => ({ CREATED: '+', UPDATED: '↻', PROGRESS: '%', DELETED: '×' }[action] || '•');

export default App;

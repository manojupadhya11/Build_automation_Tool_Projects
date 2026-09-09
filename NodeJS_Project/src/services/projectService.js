const CATEGORIES = ['CI/CD', 'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Cloud', 'DevSecOps', 'Monitoring', 'GitOps', 'Linux', 'Other'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const STATUSES = ['Planned', 'Active', 'Completed', 'On Hold'];

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeProject(input = {}) {
  return {
    title: clean(input.title),
    category: clean(input.category),
    difficulty: clean(input.difficulty),
    status: clean(input.status),
    owner: clean(input.owner),
    description: clean(input.description),
    repository_url: clean(input.repository_url) || null
  };
}

function validateProject(input = {}) {
  const project = normalizeProject(input);
  const errors = {};

  if (project.title.length < 3 || project.title.length > 120) {
    errors.title = 'Title must be between 3 and 120 characters.';
  }
  if (!CATEGORIES.includes(project.category)) {
    errors.category = 'Choose a valid category.';
  }
  if (!DIFFICULTIES.includes(project.difficulty)) {
    errors.difficulty = 'Choose a valid difficulty.';
  }
  if (!STATUSES.includes(project.status)) {
    errors.status = 'Choose a valid status.';
  }
  if (project.owner.length < 2 || project.owner.length > 80) {
    errors.owner = 'Owner must be between 2 and 80 characters.';
  }
  if (project.description.length < 10 || project.description.length > 800) {
    errors.description = 'Description must be between 10 and 800 characters.';
  }
  if (project.repository_url) {
    try {
      const url = new URL(project.repository_url);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol');
    } catch {
      errors.repository_url = 'Repository URL must be a valid http/https URL.';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, project };
}

function buildProjectRepository(db) {
  return {
    list(filters = {}) {
      const clauses = [];
      const values = [];
      const search = clean(filters.search);
      const status = clean(filters.status);
      const category = clean(filters.category);
      const difficulty = clean(filters.difficulty);

      if (search) {
        clauses.push('(LOWER(title) LIKE LOWER(?) OR LOWER(owner) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?))');
        const token = `%${search}%`;
        values.push(token, token, token);
      }
      if (status && STATUSES.includes(status)) {
        clauses.push('status = ?');
        values.push(status);
      }
      if (category && CATEGORIES.includes(category)) {
        clauses.push('category = ?');
        values.push(category);
      }
      if (difficulty && DIFFICULTIES.includes(difficulty)) {
        clauses.push('difficulty = ?');
        values.push(difficulty);
      }

      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
      return db.prepare(`SELECT * FROM projects ${where} ORDER BY datetime(updated_at) DESC, id DESC`).all(...values);
    },

    findById(id) {
      return db.prepare('SELECT * FROM projects WHERE id = ?').get(Number(id));
    },

    create(input) {
      const { valid, errors, project } = validateProject(input);
      if (!valid) return { errors };

      const result = db.prepare(`
        INSERT INTO projects
          (title, category, difficulty, status, owner, description, repository_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        project.title,
        project.category,
        project.difficulty,
        project.status,
        project.owner,
        project.description,
        project.repository_url
      );
      return { project: this.findById(result.lastInsertRowid) };
    },

    update(id, input) {
      const existing = this.findById(id);
      if (!existing) return { notFound: true };

      const { valid, errors, project } = validateProject(input);
      if (!valid) return { errors };

      db.prepare(`
        UPDATE projects
        SET title = ?, category = ?, difficulty = ?, status = ?, owner = ?,
            description = ?, repository_url = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(
        project.title,
        project.category,
        project.difficulty,
        project.status,
        project.owner,
        project.description,
        project.repository_url,
        Number(id)
      );
      return { project: this.findById(id) };
    },

    remove(id) {
      const existing = this.findById(id);
      if (!existing) return false;
      db.prepare('DELETE FROM projects WHERE id = ?').run(Number(id));
      return true;
    },

    stats() {
      const total = db.prepare('SELECT COUNT(*) AS count FROM projects').get().count;
      const active = db.prepare("SELECT COUNT(*) AS count FROM projects WHERE status = 'Active'").get().count;
      const completed = db.prepare("SELECT COUNT(*) AS count FROM projects WHERE status = 'Completed'").get().count;
      const advanced = db.prepare("SELECT COUNT(*) AS count FROM projects WHERE difficulty = 'Advanced'").get().count;
      const categories = db.prepare('SELECT COUNT(DISTINCT category) AS count FROM projects').get().count;
      const byStatus = db.prepare('SELECT status, COUNT(*) AS count FROM projects GROUP BY status ORDER BY count DESC').all();
      const byCategory = db.prepare('SELECT category, COUNT(*) AS count FROM projects GROUP BY category ORDER BY count DESC, category').all();

      return {
        total: Number(total),
        active: Number(active),
        completed: Number(completed),
        advanced: Number(advanced),
        categories: Number(categories),
        byStatus,
        byCategory
      };
    }
  };
}

module.exports = {
  CATEGORIES,
  DIFFICULTIES,
  STATUSES,
  normalizeProject,
  validateProject,
  buildProjectRepository
};

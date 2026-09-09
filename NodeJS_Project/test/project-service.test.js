const test = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { buildProjectRepository, validateProject } = require('../src/services/projectService');

function testDb() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      status TEXT NOT NULL,
      owner TEXT NOT NULL,
      description TEXT NOT NULL,
      repository_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  return db;
}

const validProject = {
  title: 'GitOps Production Platform',
  category: 'GitOps',
  difficulty: 'Advanced',
  status: 'Planned',
  owner: 'DevOps Shack',
  description: 'Build and validate a complete GitOps delivery workflow using Argo CD.',
  repository_url: 'https://github.com/jaiswaladi246'
};

test('validation accepts a correct project', () => {
  const result = validateProject(validProject);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
});

test('validation rejects invalid fields', () => {
  const result = validateProject({ title: 'x' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.title);
  assert.ok(result.errors.category);
  assert.ok(result.errors.description);
});

test('repository supports create, read, update, delete', () => {
  const db = testDb();
  const repo = buildProjectRepository(db);

  const created = repo.create(validProject).project;
  assert.equal(created.title, validProject.title);
  assert.equal(repo.findById(created.id).owner, 'DevOps Shack');

  const updated = repo.update(created.id, { ...validProject, status: 'Active' }).project;
  assert.equal(updated.status, 'Active');

  assert.equal(repo.list({ status: 'Active' }).length, 1);
  assert.equal(repo.remove(created.id), true);
  assert.equal(repo.findById(created.id), undefined);
  db.close();
});

test('repository computes dashboard stats', () => {
  const db = testDb();
  const repo = buildProjectRepository(db);
  repo.create(validProject);
  repo.create({ ...validProject, title: 'Docker Security Build', category: 'Docker', difficulty: 'Intermediate', status: 'Active' });

  const stats = repo.stats();
  assert.equal(stats.total, 2);
  assert.equal(stats.active, 1);
  assert.equal(stats.advanced, 1);
  assert.equal(stats.categories, 2);
  db.close();
});

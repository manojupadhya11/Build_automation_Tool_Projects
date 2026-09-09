const express = require('express');
const { CATEGORIES, DIFFICULTIES, STATUSES } = require('../services/projectService');

function apiRoutes(repository) {
  const router = express.Router();

  router.get('/projects', (req, res) => {
    res.json({
      data: repository.list(req.query),
      meta: {
        filters: {
          search: req.query.search || '',
          status: req.query.status || '',
          category: req.query.category || '',
          difficulty: req.query.difficulty || ''
        }
      }
    });
  });

  router.get('/projects/:id', (req, res) => {
    const project = repository.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    res.json({ data: project });
  });

  router.post('/projects', (req, res) => {
    const result = repository.create(req.body);
    if (result.errors) return res.status(400).json({ error: 'Validation failed.', fields: result.errors });
    res.status(201).json({ data: result.project });
  });

  router.put('/projects/:id', (req, res) => {
    const result = repository.update(req.params.id, req.body);
    if (result.notFound) return res.status(404).json({ error: 'Project not found.' });
    if (result.errors) return res.status(400).json({ error: 'Validation failed.', fields: result.errors });
    res.json({ data: result.project });
  });

  router.delete('/projects/:id', (req, res) => {
    if (!repository.remove(req.params.id)) return res.status(404).json({ error: 'Project not found.' });
    res.status(204).end();
  });

  router.get('/stats', (_req, res) => {
    res.json({ data: repository.stats() });
  });

  router.get('/metadata', (_req, res) => {
    res.json({
      data: {
        categories: CATEGORIES,
        difficulties: DIFFICULTIES,
        statuses: STATUSES
      }
    });
  });

  return router;
}

module.exports = { apiRoutes };

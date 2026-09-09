const express = require('express');
const path = require('node:path');
const config = require('./config');
const { getDatabase } = require('./db/database');
const { buildProjectRepository } = require('./services/projectService');
const { apiRoutes } = require('./routes/apiRoutes');
const { pageRoutes } = require('./routes/pageRoutes');

function createApp({ db = getDatabase() } = {}) {
  const app = express();
  const repository = buildProjectRepository(db);

  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.join(config.rootDir, 'public')));

  app.get('/health', (_req, res) => {
    res.json({
      status: 'UP',
      service: 'ProjectOps Studio - Node.js',
      timestamp: new Date().toISOString()
    });
  });

  app.use('/api', apiRoutes(repository));
  app.use('/', pageRoutes(db, repository));

  app.use('/api/*path', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  app.use((_req, res) => {
    res.status(404).send('Not Found');
  });

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
  });

  return app;
}

module.exports = { createApp };

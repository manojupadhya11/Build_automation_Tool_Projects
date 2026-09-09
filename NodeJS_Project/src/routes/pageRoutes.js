const express = require('express');
const path = require('node:path');
const config = require('../config');
const { escapeHtml, template } = require('../utils/render');

function pageRoutes(db, repository) {
  const router = express.Router();

  router.get('/', (_req, res) => {
    res.send(template('index'));
  });

  router.get('/studio', (_req, res) => {
    const schemaRows = db.prepare("PRAGMA table_info('projects')").all();
    const count = repository.stats().total;
    const schemaHtml = schemaRows.map(column => `
      <tr>
        <td>${escapeHtml(column.cid)}</td>
        <td><code>${escapeHtml(column.name)}</code></td>
        <td>${escapeHtml(column.type)}</td>
        <td>${column.notnull ? 'YES' : 'NO'}</td>
        <td>${column.pk ? 'YES' : 'NO'}</td>
      </tr>
    `).join('');

    res.send(template('studio', {
      DB_PATH: escapeHtml(path.relative(config.rootDir, config.dbPath)),
      ROW_COUNT: count,
      SCHEMA_ROWS: schemaHtml,
      QUERY_RESULT: '',
      QUERY_VALUE: 'SELECT * FROM projects ORDER BY id DESC LIMIT 20;'
    }));
  });

  router.post('/studio/query', express.urlencoded({ extended: false }), (req, res) => {
    const rawQuery = String(req.body.query || '').trim();
    let queryResult = '';

    try {
      if (!/^(select\b|pragma\s+table_info\s*\()/i.test(rawQuery)) {
        throw new Error('Database Studio is read-only. Use SELECT or PRAGMA table_info(...).');
      }
      if (rawQuery.includes(';') && rawQuery.slice(0, -1).includes(';')) {
        throw new Error('Only one SQL statement can be executed at a time.');
      }

      const rows = db.prepare(rawQuery.replace(/;\s*$/, '')).all();
      if (rows.length === 0) {
        queryResult = '<div class="empty-query">Query executed successfully. No rows returned.</div>';
      } else {
        const columns = Object.keys(rows[0]);
        queryResult = `
          <div class="query-scroll">
            <table class="studio-table">
              <thead><tr>${columns.map(c => `<th>${escapeHtml(c)}</th>`).join('')}</tr></thead>
              <tbody>
                ${rows.map(row => `<tr>${columns.map(c => `<td>${escapeHtml(row[c])}</td>`).join('')}</tr>`).join('')}
              </tbody>
            </table>
          </div>
          <p class="query-meta">${rows.length} row(s) returned.</p>
        `;
      }
    } catch (error) {
      queryResult = `<div class="query-error">${escapeHtml(error.message)}</div>`;
    }

    const schemaRows = db.prepare("PRAGMA table_info('projects')").all();
    const schemaHtml = schemaRows.map(column => `
      <tr>
        <td>${escapeHtml(column.cid)}</td>
        <td><code>${escapeHtml(column.name)}</code></td>
        <td>${escapeHtml(column.type)}</td>
        <td>${column.notnull ? 'YES' : 'NO'}</td>
        <td>${column.pk ? 'YES' : 'NO'}</td>
      </tr>
    `).join('');

    res.send(template('studio', {
      DB_PATH: escapeHtml(path.relative(config.rootDir, config.dbPath)),
      ROW_COUNT: repository.stats().total,
      SCHEMA_ROWS: schemaHtml,
      QUERY_RESULT: queryResult,
      QUERY_VALUE: escapeHtml(rawQuery)
    }));
  });

  router.get('/api-docs', (_req, res) => {
    res.send(template('api-docs'));
  });

  return router;
}

module.exports = { pageRoutes };

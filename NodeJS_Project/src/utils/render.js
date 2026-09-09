const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function template(name, replacements = {}) {
  const file = path.join(config.rootDir, 'views', `${name}.html`);
  let html = fs.readFileSync(file, 'utf8');
  for (const [key, value] of Object.entries(replacements)) {
    html = html.replaceAll(`{{${key}}}`, String(value));
  }
  return html;
}

module.exports = { escapeHtml, template };

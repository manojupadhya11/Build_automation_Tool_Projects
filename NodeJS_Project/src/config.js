const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');

module.exports = {
  rootDir,
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || '0.0.0.0',
  dbPath: path.resolve(rootDir, process.env.DB_PATH || 'data/devopsshack.db')
};

const { createApp } = require('./app');
const config = require('./config');
const { closeDatabase } = require('./db/database');

const app = createApp();
const server = app.listen(config.port, config.host, () => {
  console.log('');
  console.log('  DevOps Shack — ProjectOps Studio (Node.js)');
  console.log(`  App:      http://localhost:${config.port}`);
  console.log(`  API:      http://localhost:${config.port}/api/projects`);
  console.log(`  Studio:   http://localhost:${config.port}/studio`);
  console.log(`  Health:   http://localhost:${config.port}/health`);
  console.log('');
});

function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down...`);
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

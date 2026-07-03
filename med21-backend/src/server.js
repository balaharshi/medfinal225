import app from './app.js';
import { env } from './config/env.js';
import { pool } from './db/index.js';
import { seedDatabase } from './db/seed.js';
import { logger } from './utils/logger.js';

const start = async () => {
  if (!env.skipDatabaseBootstrap && !env.databaseUrl) {
    logger.error('DATABASE_URL is missing. Copy .env.example to .env and set a valid PostgreSQL connection string.');
    process.exit(1);
  }

  if (!env.skipDatabaseBootstrap) {
    await pool.query('select 1');
  } else {
    logger.warn('Skipping database bootstrap. Database-backed routes will fail until DATABASE_URL is fixed.');
  }

  if (!env.skipDatabaseBootstrap && env.seedDatabase) {
    await seedDatabase();
  }

  app.listen(env.port, '0.0.0.0', () => {
    logger.info(`MedZiva backend running on http://localhost:${env.port}`);
  });
};

start().catch((error) => {
  logger.error('Failed to start backend', error);
  process.exit(1);
});

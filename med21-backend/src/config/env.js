import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  databaseSchema: process.env.DB_SCHEMA || 'public',
  seedDatabase: process.env.SEED_DATABASE === 'true',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

if (!env.databaseUrl) {
  console.warn('DATABASE_URL is not set. The backend will fail to connect until it is provided.');
}

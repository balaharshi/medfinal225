import { pgSchema, pgTable as publicPgTable } from 'drizzle-orm/pg-core';
import { env } from '../../config/env.js';

const configuredSchema = env.databaseSchema?.trim() || 'public';

export const appPgTable =
  configuredSchema === 'public'
    ? publicPgTable
    : pgSchema(configuredSchema).table;

import {
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { appPgTable } from './table.js';

export const subcategories = appPgTable('subcategories', {
  id: text('id').primaryKey(),
  categoryId: text('category_id').notNull(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

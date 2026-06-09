import {
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { appPgTable } from './table.js';

export const categories = appPgTable('categories', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  image: text('image').notNull(),
  slug: text('slug').notNull().unique(),
  type: text('type').notNull().default('service'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

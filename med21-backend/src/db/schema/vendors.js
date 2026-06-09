import {
  boolean,
  real,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { appPgTable } from './table.js';

export const vendors = appPgTable('vendors', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull().default('Pharmacy'),
  email: text('email').unique(),
  contact: text('contact'),
  rating: real('rating').notNull().default(5),
  address: text('address').notNull().default('Dubai'),
  commission: real('commission').notNull().default(10),
  active: boolean('active').notNull().default(true),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

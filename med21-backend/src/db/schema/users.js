import {
  boolean,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { appPgTable } from './table.js';

export const users = appPgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').unique(),
  email: text('email').unique(),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  address: text('address'),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('customer'),
  vendorId: text('vendor_id'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

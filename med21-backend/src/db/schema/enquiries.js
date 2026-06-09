import {
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { appPgTable } from './table.js';

export const enquiries = appPgTable('enquiries', {
  id: text('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone').notNull(),
  serviceTitle: text('service_title').notNull(),
  message: text('message').notNull(),
  contactMethod: text('contact_method'),
  date: text('date').notNull(),
  status: text('status').notNull().default('Pending Response'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

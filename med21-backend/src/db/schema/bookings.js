import {
  integer,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { appPgTable } from './table.js';

export const bookings = appPgTable('bookings', {
  id: text('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone'),
  serviceTitle: text('service_title').notNull(),
  vendorName: text('vendor_name').notNull(),
  vendorId: text('vendor_id'),
  serviceId: text('service_id'),
  price: integer('price').notNull().default(0),
  date: text('date').notNull(),
  timeSlot: text('time_slot').notNull().default('Flexible'),
  region: text('region').notNull().default('Dubai'),
  status: text('status').notNull().default('Pending'),
  notes: text('notes').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

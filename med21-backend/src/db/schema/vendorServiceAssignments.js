import {
  boolean,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { appPgTable } from './table.js';

export const vendorServiceAssignments = appPgTable('vendor_service_assignments', {
  id: text('id').primaryKey(),
  vendorId: text('vendor_id').notNull(),
  serviceId: text('service_id').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  vendorServiceUnique: uniqueIndex('vendor_service_assignments_vendor_service_uidx').on(table.vendorId, table.serviceId),
}));

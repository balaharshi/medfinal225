import {
  boolean,
  jsonb,
  real,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { appPgTable } from './table.js';

export const settings = appPgTable('settings', {
  key: text('key').primaryKey(),
  siteName: text('site_name').notNull().default('MedZiva Home Healthcare'),
  vatPercent: real('vat_percent').notNull().default(5),
  platformFeePercent: real('platform_fee_percent').notNull().default(2.5),
  defaultCurrency: text('default_currency').notNull().default('AED'),
  supportEmail: text('support_email').notNull().default('support@medziva.ae'),
  serviceRegions: jsonb('service_regions').notNull().default(['Dubai', 'Sharjah']),
  maintenanceMode: boolean('maintenance_mode').notNull().default(false),
  adminUsername: text('admin_username').notNull().default('admin'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

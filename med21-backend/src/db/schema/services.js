import {
  boolean,
  integer,
  jsonb,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { appPgTable } from './table.js';

export const services = appPgTable('services', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull().default('home-healthcare'),
  subcategory: text('subcategory').notNull().default(''),
  price: integer('price').notNull().default(0),
  duration: text('duration').notNull().default('1 Hour'),
  image: text('image').notNull(),
  description: text('description').notNull().default(''),
  popular: boolean('popular').notNull().default(false),
  enquiryOnly: boolean('enquiry_only').notNull().default(false),
  attributes: jsonb('attributes').notNull().default([]),
  vendorPrices: jsonb('vendor_prices').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

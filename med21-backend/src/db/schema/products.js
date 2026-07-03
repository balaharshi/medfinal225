import {
  boolean,
  integer,
  jsonb,
  real,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { appPgTable } from './table.js';

export const products = appPgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  subtitle: text('subtitle').notNull().default(''),
  price: integer('price').notNull().default(0),
  originalPrice: integer('original_price').notNull().default(0),
  image: text('image').notNull(),
  category: text('category').notNull().default('devices-for-rent'),
  subcategory: text('subcategory').notNull().default(''),
  brand: text('brand').notNull().default('MedZiva Store'),
  rating: real('rating').notNull().default(5),
  inStock: boolean('in_stock').notNull().default(true),
  description: text('description').notNull().default(''),
  attributes: jsonb('attributes').notNull().default([]),
  vendorPrices: jsonb('vendor_prices').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

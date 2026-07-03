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
  paymentStatus: text('payment_status').notNull().default('Unpaid'),
  paymentProvider: text('payment_provider'),
  paymentAppUtr: text('payment_app_utr'),
  paymentOrderId: text('payment_order_id'),
  paymentTransactionUtr: text('payment_transaction_utr'),
  paymentResponseStatus: text('payment_response_status'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  notes: text('notes').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const schemaName = process.env.DB_SCHEMA || 'public';

const expectedColumns = {
  users: ['id', 'username', 'email', 'full_name', 'phone', 'address', 'password_hash', 'role', 'vendor_id', 'is_active', 'created_at', 'updated_at'],
  vendors: ['id', 'name', 'type', 'email', 'contact', 'rating', 'address', 'commission', 'active', 'password_hash', 'created_at', 'updated_at'],
  categories: ['id', 'title', 'image', 'slug', 'type', 'description', 'created_at', 'updated_at'],
  subcategories: ['id', 'category_id', 'title', 'created_at', 'updated_at'],
  products: ['id', 'name', 'subtitle', 'price', 'original_price', 'image', 'category', 'subcategory', 'brand', 'rating', 'in_stock', 'description', 'attributes', 'vendor_prices', 'created_at', 'updated_at'],
  services: ['id', 'title', 'category', 'subcategory', 'price', 'duration', 'image', 'description', 'popular', 'enquiry_only', 'attributes', 'vendor_prices', 'booking_notice', 'remarks', 'created_at', 'updated_at'],
  bookings: ['id', 'customer_name', 'customer_email', 'customer_phone', 'service_title', 'vendor_name', 'vendor_id', 'service_id', 'price', 'date', 'time_slot', 'region', 'status', 'payment_status', 'payment_provider', 'payment_app_utr', 'payment_order_id', 'payment_transaction_utr', 'payment_response_status', 'paid_at', 'notes', 'created_at', 'updated_at'],
  enquiries: ['id', 'customer_name', 'customer_email', 'customer_phone', 'service_title', 'message', 'contact_method', 'date', 'status', 'created_at', 'updated_at'],
  settings: ['key', 'site_name', 'vat_percent', 'platform_fee_percent', 'default_currency', 'support_email', 'service_regions', 'maintenance_mode', 'admin_username', 'created_at', 'updated_at'],
  vendor_service_assignments: ['id', 'vendor_id', 'service_id', 'enabled', 'created_at', 'updated_at'],
};

const q = (name) => `"${schemaName.replaceAll('"', '""')}"."${name}"`;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const assertSchema = async () => {
  const result = await pool.query(
    `
      select table_name, column_name
      from information_schema.columns
      where table_schema = $1
      order by table_name, ordinal_position
    `,
    [schemaName],
  );

  const byTable = new Map();
  for (const row of result.rows) {
    if (!byTable.has(row.table_name)) byTable.set(row.table_name, new Set());
    byTable.get(row.table_name).add(row.column_name);
  }

  const missing = [];
  for (const [table, columns] of Object.entries(expectedColumns)) {
    const actual = byTable.get(table);
    if (!actual) {
      missing.push(`${schemaName}.${table} table`);
      continue;
    }
    for (const column of columns) {
      if (!actual.has(column)) missing.push(`${schemaName}.${table}.${column} column`);
    }
  }

  if (missing.length) {
    throw new Error(`Database schema is missing: ${missing.join(', ')}`);
  }
};

const smokeCrud = async () => {
  const client = await pool.connect();
  const suffix = Date.now();

  try {
    await client.query('begin');

    await client.query(`insert into ${q('categories')} (id, title, image, slug, type, description) values ($1, $2, $3, $4, $5, $6)`, [
      `cat-validation-${suffix}`,
      'Validation Category',
      'https://example.com/image.jpg',
      `validation-category-${suffix}`,
      'service',
      'validation',
    ]);
    await client.query(`update ${q('categories')} set title = $1 where id = $2`, ['Validation Category Updated', `cat-validation-${suffix}`]);
    await client.query(`delete from ${q('categories')} where id = $1`, [`cat-validation-${suffix}`]);

    await client.query(`insert into ${q('vendors')} (id, name, type, email, contact, address) values ($1, $2, $3, $4, $5, $6)`, [
      `v-validation-${suffix}`,
      'Validation Vendor',
      'Pharmacy',
      `validation-${suffix}@example.com`,
      '000',
      'Dubai',
    ]);
    await client.query(`update ${q('vendors')} set active = false where id = $1`, [`v-validation-${suffix}`]);
    await client.query(`delete from ${q('vendors')} where id = $1`, [`v-validation-${suffix}`]);

    await client.query(`insert into ${q('products')} (id, name, image, attributes, vendor_prices) values ($1, $2, $3, $4::jsonb, $5::jsonb)`, [
      `prod-validation-${suffix}`,
      'Validation Product',
      'https://example.com/product.jpg',
      '[]',
      '[]',
    ]);
    await client.query(`update ${q('products')} set price = 1 where id = $1`, [`prod-validation-${suffix}`]);
    await client.query(`delete from ${q('products')} where id = $1`, [`prod-validation-${suffix}`]);

    await client.query(`insert into ${q('services')} (id, title, image, attributes, vendor_prices) values ($1, $2, $3, $4::jsonb, $5::jsonb)`, [
      `srv-validation-${suffix}`,
      'Validation Service',
      'https://example.com/service.jpg',
      '[]',
      '[]',
    ]);
    await client.query(`update ${q('services')} set price = 1 where id = $1`, [`srv-validation-${suffix}`]);
    await client.query(`delete from ${q('services')} where id = $1`, [`srv-validation-${suffix}`]);

    await client.query(`insert into ${q('bookings')} (id, customer_name, customer_email, service_title, vendor_name, date) values ($1, $2, $3, $4, $5, $6)`, [
      `b-validation-${suffix}`,
      'Validation Customer',
      `booking-${suffix}@example.com`,
      'Validation Service',
      'Validation Vendor',
      '2026-01-01',
    ]);
    await client.query(`update ${q('bookings')} set status = 'Cancelled' where id = $1`, [`b-validation-${suffix}`]);
    await client.query(`delete from ${q('bookings')} where id = $1`, [`b-validation-${suffix}`]);

    await client.query(`insert into ${q('enquiries')} (id, customer_name, customer_email, customer_phone, service_title, message, date) values ($1, $2, $3, $4, $5, $6, $7)`, [
      `e-validation-${suffix}`,
      'Validation Customer',
      `enquiry-${suffix}@example.com`,
      '000',
      'Validation Service',
      'Validation message',
      '2026-01-01',
    ]);
    await client.query(`update ${q('enquiries')} set status = 'Answered' where id = $1`, [`e-validation-${suffix}`]);
    await client.query(`delete from ${q('enquiries')} where id = $1`, [`e-validation-${suffix}`]);

    await client.query('rollback');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

try {
  await pool.query('select 1');
  await assertSchema();
  await smokeCrud();
  console.log(`Database validation passed for schema "${schemaName}".`);
} finally {
  await pool.end();
}

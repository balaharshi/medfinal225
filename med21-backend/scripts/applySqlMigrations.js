import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../src/db/migrations');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

try {
  // Some existing databases were created with older integer vendor/service IDs.
  // Normalize those key columns to text before applying the current SQL files so
  // the vendor-service assignment table can reference them successfully.
  await pool.query(`
    ALTER TABLE IF EXISTS subcategories
      DROP CONSTRAINT IF EXISTS subcategories_category_id_fkey;

    ALTER TABLE IF EXISTS users
      ALTER COLUMN id TYPE text USING id::text,
      ALTER COLUMN vendor_id TYPE text USING vendor_id::text;

    ALTER TABLE IF EXISTS vendors
      ALTER COLUMN id TYPE text USING id::text;

    ALTER TABLE IF EXISTS categories
      ALTER COLUMN id TYPE text USING id::text;

    ALTER TABLE IF EXISTS subcategories
      ALTER COLUMN id TYPE text USING id::text,
      ALTER COLUMN category_id TYPE text USING category_id::text;

    ALTER TABLE IF EXISTS products
      ALTER COLUMN id TYPE text USING id::text;

    ALTER TABLE IF EXISTS services
      ALTER COLUMN id TYPE text USING id::text;

    ALTER TABLE IF EXISTS bookings
      ALTER COLUMN id TYPE text USING id::text,
      ALTER COLUMN vendor_id TYPE text USING vendor_id::text,
      ALTER COLUMN service_id TYPE text USING service_id::text;

    ALTER TABLE IF EXISTS enquiries
      ALTER COLUMN id TYPE text USING id::text;

    ALTER TABLE IF EXISTS settings
      ALTER COLUMN key TYPE text USING key::text;
  `);

  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (!files.length) {
    throw new Error(`No SQL migration files found in ${migrationsDir}`);
  }

  for (const file of files) {
    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    console.log(`Applying ${file}...`);
    await pool.query(sql);
  }

  const categoryFk = await pool.query(`
    select 1
    from information_schema.table_constraints
    where table_schema = current_schema()
      and table_name = 'subcategories'
      and constraint_name = 'subcategories_category_id_fkey'
    limit 1
  `);

  if (!categoryFk.rowCount) {
    await pool.query(`
      ALTER TABLE IF EXISTS subcategories
        ADD CONSTRAINT subcategories_category_id_fkey
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
    `);
  }

  console.log('SQL migrations applied successfully.');
} finally {
  await pool.end();
}

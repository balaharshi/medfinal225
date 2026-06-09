CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  username text UNIQUE,
  email text UNIQUE,
  full_name text NOT NULL,
  phone text,
  address text,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'customer',
  vendor_id text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendors (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'Pharmacy',
  email text UNIQUE,
  contact text,
  rating real NOT NULL DEFAULT 5,
  address text NOT NULL DEFAULT 'Dubai',
  commission real NOT NULL DEFAULT 10,
  active boolean NOT NULL DEFAULT true,
  password_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  title text NOT NULL,
  image text NOT NULL,
  slug text NOT NULL UNIQUE,
  type text NOT NULL DEFAULT 'service',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subcategories (
  id text PRIMARY KEY,
  category_id text NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  name text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  price integer NOT NULL DEFAULT 0,
  original_price integer NOT NULL DEFAULT 0,
  image text NOT NULL,
  category text NOT NULL DEFAULT 'devices-for-rent',
  subcategory text NOT NULL DEFAULT '',
  brand text NOT NULL DEFAULT 'Medziva Store',
  rating real NOT NULL DEFAULT 5,
  in_stock boolean NOT NULL DEFAULT true,
  description text NOT NULL DEFAULT '',
  attributes jsonb NOT NULL DEFAULT '[]'::jsonb,
  vendor_prices jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id text PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'home-healthcare',
  subcategory text NOT NULL DEFAULT '',
  price integer NOT NULL DEFAULT 0,
  duration text NOT NULL DEFAULT '1 Hour',
  image text NOT NULL,
  description text NOT NULL DEFAULT '',
  popular boolean NOT NULL DEFAULT false,
  enquiry_only boolean NOT NULL DEFAULT false,
  attributes jsonb NOT NULL DEFAULT '[]'::jsonb,
  vendor_prices jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id text PRIMARY KEY,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  service_title text NOT NULL,
  vendor_name text NOT NULL,
  vendor_id text,
  service_id text,
  price integer NOT NULL DEFAULT 0,
  date text NOT NULL,
  time_slot text NOT NULL DEFAULT 'Flexible',
  region text NOT NULL DEFAULT 'Dubai',
  status text NOT NULL DEFAULT 'Pending',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enquiries (
  id text PRIMARY KEY,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  service_title text NOT NULL,
  message text NOT NULL,
  contact_method text,
  date text NOT NULL,
  status text NOT NULL DEFAULT 'Pending Response',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  site_name text NOT NULL DEFAULT 'Medziva Home Healthcare',
  vat_percent real NOT NULL DEFAULT 5,
  platform_fee_percent real NOT NULL DEFAULT 2.5,
  default_currency text NOT NULL DEFAULT 'AED',
  support_email text NOT NULL DEFAULT 'support@medziva.ae',
  service_regions jsonb NOT NULL DEFAULT '["Dubai", "Sharjah"]'::jsonb,
  maintenance_mode boolean NOT NULL DEFAULT false,
  admin_username text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookings_vendor_name_idx ON bookings(vendor_name);
CREATE INDEX IF NOT EXISTS bookings_customer_email_idx ON bookings(customer_email);
CREATE INDEX IF NOT EXISTS enquiries_status_idx ON enquiries(status);
CREATE INDEX IF NOT EXISTS services_category_idx ON services(category);

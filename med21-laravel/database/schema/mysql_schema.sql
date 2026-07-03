CREATE TABLE vendors (
  id VARCHAR(255) PRIMARY KEY,
  name TEXT NOT NULL,
  type VARCHAR(255) NOT NULL DEFAULT 'Pharmacy',
  email VARCHAR(255) UNIQUE,
  contact VARCHAR(255),
  rating DOUBLE NOT NULL DEFAULT 5,
  address VARCHAR(255) NOT NULL DEFAULT 'Dubai',
  commission DOUBLE NOT NULL DEFAULT 10,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  password_hash VARCHAR(255),
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(255),
  address TEXT,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL DEFAULT 'customer',
  vendor_id VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT users_vendor_id_foreign FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categories (
  id VARCHAR(255) PRIMARY KEY,
  title TEXT NOT NULL,
  image TEXT NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(255) NOT NULL DEFAULT 'service',
  description TEXT,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subcategories (
  id VARCHAR(255) PRIMARY KEY,
  category_id VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT subcategories_category_id_foreign FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE products (
  id VARCHAR(255) PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle VARCHAR(255) NOT NULL DEFAULT '',
  price INT NOT NULL DEFAULT 0,
  original_price INT NOT NULL DEFAULT 0,
  image TEXT NOT NULL,
  category VARCHAR(255) NOT NULL DEFAULT 'devices-for-rent',
  subcategory VARCHAR(255) NOT NULL DEFAULT '',
  brand VARCHAR(255) NOT NULL DEFAULT 'MedZiva Store',
  rating DOUBLE NOT NULL DEFAULT 5,
  in_stock BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT,
  attributes JSON NOT NULL,
  vendor_prices JSON NOT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE services (
  id VARCHAR(255) PRIMARY KEY,
  title TEXT NOT NULL,
  slug VARCHAR(255) NOT NULL DEFAULT '',
  category VARCHAR(255) NOT NULL DEFAULT 'home-healthcare',
  subcategory VARCHAR(255) NOT NULL DEFAULT '',
  status VARCHAR(255) NOT NULL DEFAULT 'active',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  price INT NOT NULL DEFAULT 0,
  original_price INT NOT NULL DEFAULT 0,
  sale_price INT NOT NULL DEFAULT 0,
  currency VARCHAR(255) NOT NULL DEFAULT 'AED',
  home_visit_fee_included BOOLEAN NOT NULL DEFAULT TRUE,
  duration VARCHAR(255) NOT NULL DEFAULT '1 Hour',
  estimated_visit_time VARCHAR(255) NOT NULL DEFAULT '',
  image TEXT NOT NULL,
  short_description TEXT,
  full_description TEXT,
  description TEXT,
  inclusions JSON NOT NULL,
  preparation_instructions TEXT,
  who_is_it_for TEXT,
  service_location VARCHAR(255) NOT NULL DEFAULT 'at-home',
  availability TEXT,
  tags JSON NOT NULL,
  display_priority INT NOT NULL DEFAULT 100,
  seo_title VARCHAR(255) NOT NULL DEFAULT '',
  seo_description TEXT,
  popular BOOLEAN NOT NULL DEFAULT FALSE,
  enquiry_only BOOLEAN NOT NULL DEFAULT FALSE,
  attributes JSON NOT NULL,
  vendor_prices JSON NOT NULL,
  booking_notice TEXT,
  remarks TEXT,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  INDEX services_category_idx (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE bookings (
  id VARCHAR(255) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(255),
  service_title TEXT NOT NULL,
  vendor_name VARCHAR(255) NOT NULL,
  vendor_id VARCHAR(255),
  service_id VARCHAR(255),
  price INT NOT NULL DEFAULT 0,
  date VARCHAR(255) NOT NULL,
  time_slot VARCHAR(255) NOT NULL DEFAULT 'Flexible',
  region VARCHAR(255) NOT NULL DEFAULT 'Dubai',
  status VARCHAR(255) NOT NULL DEFAULT 'Pending',
  payment_status VARCHAR(255) NOT NULL DEFAULT 'Unpaid',
  payment_provider VARCHAR(255),
  payment_app_utr VARCHAR(255),
  payment_order_id VARCHAR(255),
  payment_transaction_utr VARCHAR(255),
  payment_response_status VARCHAR(255),
  paid_at TIMESTAMP NULL,
  notes TEXT,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  INDEX bookings_vendor_name_idx (vendor_name),
  INDEX bookings_customer_email_idx (customer_email),
  INDEX bookings_payment_status_idx (payment_status),
  INDEX bookings_payment_app_utr_idx (payment_app_utr),
  INDEX bookings_payment_transaction_utr_idx (payment_transaction_utr),
  INDEX bookings_vendor_id_idx (vendor_id),
  INDEX bookings_service_id_idx (service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE enquiries (
  id VARCHAR(255) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(255) NOT NULL,
  service_title TEXT NOT NULL,
  message TEXT NOT NULL,
  contact_method VARCHAR(255),
  date VARCHAR(255) NOT NULL,
  status VARCHAR(255) NOT NULL DEFAULT 'Pending Response',
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  INDEX enquiries_status_idx (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE settings (
  `key` VARCHAR(255) PRIMARY KEY,
  site_name VARCHAR(255) NOT NULL DEFAULT 'MedZiva Home Healthcare',
  vat_percent DOUBLE NOT NULL DEFAULT 5,
  platform_fee_percent DOUBLE NOT NULL DEFAULT 2.5,
  default_currency VARCHAR(255) NOT NULL DEFAULT 'AED',
  support_email VARCHAR(255) NOT NULL DEFAULT 'support@medziva.ae',
  service_regions JSON NOT NULL,
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  admin_username VARCHAR(255) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vendor_service_assignments (
  id VARCHAR(255) PRIMARY KEY,
  vendor_id VARCHAR(255) NOT NULL,
  service_id VARCHAR(255) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  UNIQUE KEY vendor_service_assignments_vendor_service_uidx (vendor_id, service_id),
  INDEX vendor_service_assignments_vendor_id_idx (vendor_id),
  INDEX vendor_service_assignments_service_id_idx (service_id),
  CONSTRAINT vendor_service_assignments_vendor_id_foreign FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  CONSTRAINT vendor_service_assignments_service_id_foreign FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE IF EXISTS services
  ADD COLUMN IF NOT EXISTS slug text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS original_price integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sale_price integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'AED',
  ADD COLUMN IF NOT EXISTS home_visit_fee_included boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS estimated_visit_time text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS short_description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS full_description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS inclusions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS preparation_instructions text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS who_is_it_for text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS service_location text NOT NULL DEFAULT 'at-home',
  ADD COLUMN IF NOT EXISTS availability text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS display_priority integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS seo_title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_description text NOT NULL DEFAULT '';

UPDATE services
SET
  slug = COALESCE(NULLIF(slug, ''), lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))),
  short_description = COALESCE(NULLIF(short_description, ''), description),
  full_description = COALESCE(NULLIF(full_description, ''), description),
  sale_price = CASE WHEN sale_price = 0 THEN price ELSE sale_price END,
  original_price = CASE WHEN original_price = 0 THEN price ELSE original_price END
WHERE title IS NOT NULL;

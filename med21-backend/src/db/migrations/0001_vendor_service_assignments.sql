CREATE TABLE IF NOT EXISTS vendor_service_assignments (
  id text PRIMARY KEY,
  vendor_id text NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  service_id text NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS vendor_service_assignments_vendor_service_uidx
  ON vendor_service_assignments(vendor_id, service_id);

CREATE INDEX IF NOT EXISTS vendor_service_assignments_vendor_id_idx
  ON vendor_service_assignments(vendor_id);

CREATE INDEX IF NOT EXISTS vendor_service_assignments_service_id_idx
  ON vendor_service_assignments(service_id);

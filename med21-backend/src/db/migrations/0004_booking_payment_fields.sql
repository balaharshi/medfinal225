ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'Unpaid',
  ADD COLUMN IF NOT EXISTS payment_provider text,
  ADD COLUMN IF NOT EXISTS payment_app_utr text,
  ADD COLUMN IF NOT EXISTS payment_order_id text,
  ADD COLUMN IF NOT EXISTS payment_transaction_utr text,
  ADD COLUMN IF NOT EXISTS payment_response_status text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE INDEX IF NOT EXISTS bookings_payment_status_idx ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS bookings_payment_app_utr_idx ON bookings(payment_app_utr);
CREATE INDEX IF NOT EXISTS bookings_payment_transaction_utr_idx ON bookings(payment_transaction_utr);

-- 101: Public tracking + customer linkage + delivery timestamp on loads
-- tracking_token: unique public token used by GET /api/public-track/:token
--                 (generated on insert; backfilled lazily on first lookup for old rows)
-- customer_id:    optional FK linking a load to a customers record
-- delivered_at:   stamped by loadStatus.service on the first transition to "delivered"

ALTER TABLE loads ADD COLUMN IF NOT EXISTS tracking_token TEXT;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_loads_tracking_token ON loads(tracking_token);
CREATE INDEX IF NOT EXISTS idx_loads_customer_id ON loads(customer_id);

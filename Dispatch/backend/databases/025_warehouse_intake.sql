-- Add warehouse intake fields to loads table
ALTER TABLE loads ADD COLUMN IF NOT EXISTS warehouse_location VARCHAR(255);
ALTER TABLE loads ADD COLUMN IF NOT EXISTS warehouse_notes TEXT;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS intake_condition VARCHAR(100);
ALTER TABLE loads ADD COLUMN IF NOT EXISTS received_at_warehouse BOOLEAN DEFAULT false;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS received_at_warehouse_date TIMESTAMP;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS warehouse_manager_id UUID REFERENCES users(id);

-- Track who received it and when
CREATE INDEX IF NOT EXISTS idx_loads_warehouse_manager ON loads(warehouse_manager_id);
CREATE INDEX IF NOT EXISTS idx_loads_received_at_warehouse ON loads(received_at_warehouse);

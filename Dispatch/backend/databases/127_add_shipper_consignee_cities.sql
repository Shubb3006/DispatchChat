-- Migration: 127_add_shipper_consignee_cities.sql
-- Description: Add shipper_city, shipper_state, consignee_city, consignee_state fields to loads table
--              for proper location tracking and document generation (PAPS/PARS/BOL)

ALTER TABLE loads
  ADD COLUMN IF NOT EXISTS shipper_city VARCHAR(150),
  ADD COLUMN IF NOT EXISTS shipper_state VARCHAR(50),
  ADD COLUMN IF NOT EXISTS consignee_city VARCHAR(150),
  ADD COLUMN IF NOT EXISTS consignee_state VARCHAR(50);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_loads_shipper_city ON loads(shipper_city);
CREATE INDEX IF NOT EXISTS idx_loads_consignee_city ON loads(consignee_city);

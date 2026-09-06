-- Migration: 131_loads_freight_classification.sql
-- Description: Split the single "house status" field into the independent
--              attributes it was really carrying.
--
-- WHY:
--   loads.house_status was one dropdown backed by a flat list of 44 values that
--   mixed four unrelated things:
--       operational status  IN TRANSIT, DELIVERED, LOADED, ON HOLD, CUSTOMS...
--       freight size        FTL, PRE-LTL
--       commitment          APPOINTMNT, APPT + REF
--   Because they shared one column, a load could not be both "FTL" and
--   "IN TRANSIT" — setting the status erased the size. Dispatch could not filter
--   for reefer freight, and the trailer planner had no idea what equipment a
--   load needed.
--
--   Each attribute now gets its own column, so they can be set independently.
--   `commitment` already exists (migration 128) and is reused as-is.
--   `house_status` survives as the OPERATIONAL status only.

ALTER TABLE loads
    -- FTL | LTL
    ADD COLUMN IF NOT EXISTS freight_size  VARCHAR(10),
    -- DRY | REEFER | HEATER
    ADD COLUMN IF NOT EXISTS freight_type  VARCHAR(20),
    -- 53FT_DRY_VAN | 53FT_REEFER | 53FT_HEATER | CONTAINER | STRAIGHT_BODY
    ADD COLUMN IF NOT EXISTS trailer_type  VARCHAR(30);

-- ── Backfill from the values that were stuffed into house_status ─────────────
-- These rows were never really "in a status"; they were recording freight size.
UPDATE loads
   SET freight_size = 'FTL'
 WHERE freight_size IS NULL
   AND UPPER(COALESCE(house_status, '')) = 'FTL';

UPDATE loads
   SET freight_size = 'LTL'
 WHERE freight_size IS NULL
   AND UPPER(COALESCE(house_status, '')) IN ('PRE-LTL', 'LTL');

-- Commitment values that were riding in house_status move to the real column.
UPDATE loads
   SET commitment = 'appointment'
 WHERE (commitment IS NULL OR commitment = 'normal')
   AND UPPER(COALESCE(house_status, '')) IN ('APPOINTMNT', 'APPT + REF');

-- house_status now means operational status only, so clear the values that
-- were describing something else and have been moved above.
UPDATE loads
   SET house_status = NULL
 WHERE UPPER(COALESCE(house_status, '')) IN ('FTL', 'LTL', 'PRE-LTL', 'APPOINTMNT', 'APPT + REF');

-- Anything still unclassified is full-truckload, which is the prevailing default
-- this fleet operated under before the split.
UPDATE loads SET freight_size = 'FTL' WHERE freight_size IS NULL;
UPDATE loads SET freight_type = 'DRY' WHERE freight_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_loads_freight_size ON loads(freight_size);
CREATE INDEX IF NOT EXISTS idx_loads_freight_type ON loads(freight_type);
CREATE INDEX IF NOT EXISTS idx_loads_trailer_type ON loads(trailer_type);

COMMENT ON COLUMN loads.freight_size IS 'FTL | LTL';
COMMENT ON COLUMN loads.freight_type IS 'DRY | REEFER | HEATER — temperature handling required';
COMMENT ON COLUMN loads.trailer_type IS 'Equipment the load is on. Descriptive only — does not drive the trailer planner.';
COMMENT ON COLUMN loads.house_status IS 'Operational status ONLY. Freight size and commitment moved to their own columns in migration 131.';

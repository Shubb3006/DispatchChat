-- 125: Driver/truck assignment columns on loads (AI auto-assign)
-- driver_id:   FK to drivers — written by POST /api/load/auto-assign
-- truck_id:    FK to trucks — resolved from the driver's assigned tractor
-- assigned_at: stamped when the assignment is made
--
-- The base schema (006_loads.sql) already declares driver_id/truck_id, so
-- IF NOT EXISTS keeps this migration safe for databases created either way.
-- The same DDL is applied lazily at first use by
-- src/services/aiDispatcherOptimizer.service.js (ensureAssignmentColumns).

ALTER TABLE loads ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_loads_driver_id ON loads(driver_id);

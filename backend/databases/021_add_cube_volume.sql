-- 021_add_cube_volume.sql
-- Adds a physical cube / volume measurement to each load.
-- Freight cube is stored in cubic feet (cu ft). Safe/additive: run once on the
-- live Postgres/Supabase database.

ALTER TABLE loads
    ADD COLUMN IF NOT EXISTS cube_volume DECIMAL(10, 2);

COMMENT ON COLUMN loads.cube_volume IS 'Total freight cube / volume for the load, in cubic feet (cu ft).';

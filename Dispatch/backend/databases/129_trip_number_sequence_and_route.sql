-- Migration: 129_trip_number_sequence_and_route.sql
-- Description: Server-authoritative sequential trip numbers, plus storage for the
--              optimized route computed when an LTL consolidation is created.
--
-- WHY THE SEQUENCE:
--   Trip numbers were previously derived in the browser from whatever trips the
--   dispatcher happened to have loaded (DispatcherDashboard handleConsolidateTrips):
--       max(loaded trip_numbers) + 1, falling back to 10003
--   That is racy — two dispatchers consolidating at the same time both compute the
--   same number and the second INSERT dies on the trips_trip_number_key unique
--   constraint — and it silently restarts numbering if the trip list hasn't loaded.
--   A Postgres sequence hands out each number exactly once, regardless of who is
--   asking or what the client has cached.
--
-- WHY THE ROUTE COLUMNS:
--   A consolidated LTL trip is routed once at creation and the result is kept, so
--   the trip sheet can be reprinted later without re-billing the routing provider's
--   quota and without the mileage silently changing between prints. `route_json`
--   holds the full provider response (stop sequence, legs, geometry, warnings) that
--   the print view renders.

-- ── Sequential trip numbers, starting at 10000 ───────────────────────────────
CREATE SEQUENCE IF NOT EXISTS trip_number_seq
    AS BIGINT
    START WITH 10000
    MINVALUE 10000
    INCREMENT BY 1
    NO CYCLE;

-- Never hand back a number that already exists. Existing trip_numbers are VARCHAR
-- and some are non-numeric, so only the numeric ones are considered.
-- Only reposition when a numeric trip_number already sits at or above the
-- sequence floor. A freshly created sequence already yields 10000 on its first
-- nextval, and setval(9999) would violate the sequence's own MINVALUE.
SELECT setval('trip_number_seq', existing.max_num)
  FROM (SELECT MAX(trip_number::BIGINT) AS max_num
          FROM trips
         WHERE trip_number ~ '^[0-9]+$') AS existing
 WHERE existing.max_num IS NOT NULL
   AND existing.max_num >= 10000;

-- ── Routed result, captured at consolidation time ────────────────────────────
ALTER TABLE trips
    ADD COLUMN IF NOT EXISTS origin_address     TEXT,
    ADD COLUMN IF NOT EXISTS destination_address TEXT,
    ADD COLUMN IF NOT EXISTS total_miles        NUMERIC(10,1),
    ADD COLUMN IF NOT EXISTS drive_hours        NUMERIC(6,2),
    ADD COLUMN IF NOT EXISTS route_provider     VARCHAR(50),
    ADD COLUMN IF NOT EXISTS is_truck_profile   BOOLEAN,
    ADD COLUMN IF NOT EXISTS fuel_gallons       NUMERIC(10,1),
    ADD COLUMN IF NOT EXISTS fuel_cost          NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS total_tolls        NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS border_crossing    TEXT,
    -- Full provider response for the printable trip sheet.
    ADD COLUMN IF NOT EXISTS route_json         JSONB,
    ADD COLUMN IF NOT EXISTS routed_at          TIMESTAMP,
    -- Set when routing failed so the UI can explain the gap instead of showing
    -- a blank mileage that reads as "zero miles".
    ADD COLUMN IF NOT EXISTS route_error        TEXT;

CREATE INDEX IF NOT EXISTS idx_trips_trip_number ON trips(trip_number);

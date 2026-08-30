-- Add arrival/departure tracking to load stops
ALTER TABLE load_stops ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMP;
ALTER TABLE load_stops ADD COLUMN IF NOT EXISTS departed_at TIMESTAMP;
ALTER TABLE load_stops ADD COLUMN IF NOT EXISTS lat NUMERIC(10, 7);
ALTER TABLE load_stops ADD COLUMN IF NOT EXISTS lng NUMERIC(10, 7);

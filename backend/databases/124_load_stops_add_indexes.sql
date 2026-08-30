-- Optimize geofence lookups
CREATE INDEX IF NOT EXISTS idx_load_stops_arrived_at ON load_stops(arrived_at);
CREATE INDEX IF NOT EXISTS idx_load_stops_departed_at ON load_stops(departed_at);

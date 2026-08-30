-- Geofence entry/exit event log for arrival detection
CREATE TABLE IF NOT EXISTS geofence_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id uuid NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  stop_id uuid REFERENCES load_stops(id) ON DELETE SET NULL,
  truck_id uuid REFERENCES trucks(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('enter', 'exit')),
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  distance_m INT NOT NULL DEFAULT 0,
  occurred_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  meta JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_geofence_events_load_id ON geofence_events(load_id);
CREATE INDEX idx_geofence_events_truck_id ON geofence_events(truck_id);
CREATE INDEX idx_geofence_events_occurred_at ON geofence_events(occurred_at DESC);

-- Geofence entry/exit event log for arrival/departure detection
CREATE TABLE IF NOT EXISTS geofence_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  stop_id UUID REFERENCES load_stops(id) ON DELETE SET NULL,
  truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('enter', 'exit')),
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  distance_m INT NOT NULL DEFAULT 0,
  occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  meta JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_geofence_events_load_id ON geofence_events(load_id);
CREATE INDEX IF NOT EXISTS idx_geofence_events_stop_id ON geofence_events(stop_id);
CREATE INDEX IF NOT EXISTS idx_geofence_events_truck_id ON geofence_events(truck_id);
CREATE INDEX IF NOT EXISTS idx_geofence_events_occurred_at ON geofence_events(occurred_at DESC);

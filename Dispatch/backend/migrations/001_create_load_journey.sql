-- Create load_journey table for tracking load movements and status changes
CREATE TABLE IF NOT EXISTS load_journey (
  id SERIAL PRIMARY KEY,
  load_id INTEGER NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  from_location VARCHAR(255),
  to_location VARCHAR(255),
  driver_id INTEGER REFERENCES drivers(id),
  status VARCHAR(50) NOT NULL DEFAULT 'in_transit',
  notes TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_status CHECK (status IN ('pickup', 'in_transit', 'at_warehouse', 'at_freight_force', 'in_delivery', 'delivered', 'delayed'))
);

CREATE INDEX idx_load_journey_load_id ON load_journey(load_id);
CREATE INDEX idx_load_journey_status ON load_journey(status);
CREATE INDEX idx_load_journey_timestamp ON load_journey(timestamp DESC);

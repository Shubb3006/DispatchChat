-- Detention billing event tracking
CREATE TABLE IF NOT EXISTS detention_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  stop_id UUID NOT NULL REFERENCES load_stops(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  arrived_at TIMESTAMP NOT NULL,
  departed_at TIMESTAMP,
  free_time_minutes INT DEFAULT 0,
  dwell_minutes INT DEFAULT 0,
  billable_minutes INT DEFAULT 0,
  rate_per_hour NUMERIC(10, 2) DEFAULT 75.00,
  amount NUMERIC(12, 2) DEFAULT 0.00,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'claimed', 'invoiced', 'written_off')),
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_detention_events_load_id ON detention_events(load_id);
CREATE INDEX IF NOT EXISTS idx_detention_events_stop_id ON detention_events(stop_id);
CREATE INDEX IF NOT EXISTS idx_detention_events_status ON detention_events(status);
CREATE INDEX IF NOT EXISTS idx_detention_events_invoice_id ON detention_events(invoice_id);

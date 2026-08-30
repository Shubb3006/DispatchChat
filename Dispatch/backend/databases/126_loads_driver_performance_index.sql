-- 126: Partial index backing the AI matcher's driver performance factor
-- (on-time ratio = delivered loads where delivered_at <= scheduled delivery_date,
--  grouped per driver — see rankDriversForLoad in aiDispatcherOptimizer.service.js).
-- Also applied lazily at first use by ensureAssignmentColumns.

CREATE INDEX IF NOT EXISTS idx_loads_driver_delivered
  ON loads (driver_id, delivered_at)
  WHERE delivered_at IS NOT NULL AND delivery_date IS NOT NULL;

-- 102: Per-customer notification opt-out preferences
-- notify_prefs keys (all optional, missing key = enabled):
--   milestones: boolean (default true)  -> load milestone emails (picked up / in transit / delivered / delayed)
--   pod:        boolean (default true)  -> automatic POD/BOL document delivery emails

ALTER TABLE customers ADD COLUMN IF NOT EXISTS notify_prefs JSONB NOT NULL DEFAULT '{}'::jsonb;

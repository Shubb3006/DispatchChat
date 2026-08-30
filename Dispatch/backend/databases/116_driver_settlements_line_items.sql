-- Migration: 116_driver_settlements_line_items.sql
-- Description: Per-line pay breakdown on settlements for driver pay transparency.
--              Each line item: { load_number, leg_seq, origin, destination, miles,
--              rate_type, rate, amount }. leg_seq is null for whole (non-relay) loads.

ALTER TABLE driver_settlements ADD COLUMN IF NOT EXISTS line_items JSONB DEFAULT '[]'::jsonb;

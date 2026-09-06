-- Migration: 130_loads_skid_dimensions.sql
-- Description: Per-load skid (pallet) dimensions, so trailer capacity is computed
--              from what is actually being shipped instead of a fixed grid.
--
-- WHY:
--   The trailer visualizer modelled every load as a fixed 26-slot grid of
--   standard 48x40 GMA pallets. Real LTL freight is rarely uniform — 48x48
--   chemical skids, 42x42 beverage, 36x36 half-pallets and oversized crates all
--   ride on the same trailer — so a fixed grid both misreports remaining
--   capacity and hides overheight/overlength problems until the dock.
--
--   `pieces` (skid count) already exists. These columns describe what one skid
--   on that load actually measures.
--
-- NULL means "not supplied", NOT "standard". Capacity math falls back to a
-- 48x40 GMA assumption, but the UI must label that as assumed rather than
-- present it as measured — the whole point of this migration is to stop
-- presenting a guess as a fact.

ALTER TABLE loads
    -- Footprint of a single skid, in inches.
    ADD COLUMN IF NOT EXISTS skid_length_in  NUMERIC(6,2),
    ADD COLUMN IF NOT EXISTS skid_width_in   NUMERIC(6,2),
    ADD COLUMN IF NOT EXISTS skid_height_in  NUMERIC(6,2),

    -- Whether skids on this load may be stacked, and how many high. Stacking
    -- halves (or better) the floor space a load consumes, so it changes
    -- capacity materially. Default false: never assume freight is stackable.
    ADD COLUMN IF NOT EXISTS is_stackable    BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS max_stack_count INTEGER,

    -- Set when a skid may not be rotated 90 degrees to fit across the trailer
    -- (long machinery, directional crates).
    ADD COLUMN IF NOT EXISTS no_rotate       BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN loads.skid_length_in IS 'Length of one skid in inches. NULL = not supplied.';
COMMENT ON COLUMN loads.skid_width_in  IS 'Width of one skid in inches. NULL = not supplied.';
COMMENT ON COLUMN loads.skid_height_in IS 'Height of one loaded skid in inches. NULL = not supplied.';
COMMENT ON COLUMN loads.max_stack_count IS 'Max skids high when is_stackable. NULL with is_stackable = double-stack.';

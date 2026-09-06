-- Migration: 128_loads_ops_board_fields.sql
-- Description: Operational lifecycle columns surfaced by the Load Operations
--              Control Board (Kanban → Table view).
--
-- Before this migration these values could only be INFERRED from loads.status,
-- so a dispatcher could not record them independently. Each column below backs
-- one editable cell on the board:
--
--   commitment / commitment_date / commitment_time
--       Delivery commitment: normal | appointment | guaranteed | guaranteed_appointment.
--       (The create-load payload already sent these; there was nowhere to store them.)
--
--   pickup_trailer_number   Trailer used on the pickup leg (may differ from the line-haul trailer).
--   delivered_status        PENDING | CAN_INVOICE | FREIGHT_FORCE | INVOICED  (billing readiness).
--   empty_status            LOADED | UNLOADING | EMPTY.
--   eta_to_empty            When the trailer is expected to be empty.
--   next_pickup_status      PREASSIGNED | SEARCHING (is the truck's next load booked?).
--
-- Nishan PB # reuses the existing loads.paps_number, and ACE status reuses the
-- existing loads.border_connect_status (both added in 110_borderconnect_filing.sql).
--
-- load.controller.js also applies this DDL lazily (ADD COLUMN IF NOT EXISTS) at
-- first use, so the board works on next boot without running migrations manually.

ALTER TABLE loads
    ADD COLUMN IF NOT EXISTS commitment            VARCHAR(50),
    ADD COLUMN IF NOT EXISTS commitment_date       DATE,
    ADD COLUMN IF NOT EXISTS commitment_time       VARCHAR(20),
    ADD COLUMN IF NOT EXISTS pickup_trailer_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS delivered_status      VARCHAR(30),
    ADD COLUMN IF NOT EXISTS empty_status          VARCHAR(30),
    ADD COLUMN IF NOT EXISTS eta_to_empty          TIMESTAMP,
    ADD COLUMN IF NOT EXISTS next_pickup_status    VARCHAR(30);

-- Board filters by pickup/delivery window and by billing readiness.
CREATE INDEX IF NOT EXISTS idx_loads_pickup_date      ON loads(pickup_date);
CREATE INDEX IF NOT EXISTS idx_loads_delivery_date    ON loads(delivery_date);
CREATE INDEX IF NOT EXISTS idx_loads_delivered_status ON loads(delivered_status);

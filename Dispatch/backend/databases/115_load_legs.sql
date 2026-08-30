-- Migration: 115_load_legs.sql
-- Description: Relay legs (split loads) — one load can be driven by multiple drivers
--              across ordered legs (e.g. domestic leg + border leg for US-Canada relay).
--              Each leg can carry its own driver, truck, miles, and pay override so the
--              settlement engine can pay each driver only for the legs they drove.

CREATE TABLE IF NOT EXISTS load_legs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
    trip_id UUID,

    -- Position of the leg inside the load's relay chain (1-based, contiguous)
    seq INTEGER NOT NULL,

    origin_city VARCHAR(150),
    origin_state VARCHAR(50),
    destination_city VARCHAR(150),
    destination_state VARCHAR(50),

    origin_lat NUMERIC(10, 6),
    origin_lng NUMERIC(10, 6),
    dest_lat NUMERIC(10, 6),
    dest_lng NUMERIC(10, 6),

    driver_id UUID REFERENCES drivers(id),
    truck_id UUID,

    miles NUMERIC(10, 2),

    -- Optional per-leg pay override: { "rate_type": "PER_MILE" | "FLAT" | "PERCENT_OF_GROSS", "rate": 0.75 }
    pay_override JSONB,

    status VARCHAR(30) DEFAULT 'pending', -- pending, assigned, in_progress, completed

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_load_legs_load_id ON load_legs(load_id);
CREATE INDEX IF NOT EXISTS idx_load_legs_driver_id ON load_legs(driver_id);
CREATE INDEX IF NOT EXISTS idx_load_legs_trip_id ON load_legs(trip_id);

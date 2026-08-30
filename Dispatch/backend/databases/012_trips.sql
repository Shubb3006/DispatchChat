CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    trip_number VARCHAR(50) UNIQUE NOT NULL,

    driver_id UUID REFERENCES drivers(id),

    status VARCHAR(30) DEFAULT 'pending',

    total_weight_lbs NUMERIC(10,2) DEFAULT 0,
    total_pallets INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
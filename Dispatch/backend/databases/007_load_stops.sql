CREATE TABLE load_stops (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    load_id UUID REFERENCES loads(id) ON DELETE CASCADE,

    stop_order INT,

    company_name VARCHAR(200),

    address TEXT,

    city VARCHAR(100),

    state VARCHAR(100),

    zip VARCHAR(20),

    stop_type VARCHAR(30),

    arrival_time TIMESTAMP,

    departure_time TIMESTAMP
);
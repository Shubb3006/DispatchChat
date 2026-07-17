CREATE TABLE loads (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    load_number VARCHAR(100) UNIQUE,

    customer_id UUID REFERENCES customers(id),

    dispatcher_id UUID REFERENCES users(id),

    driver_id UUID REFERENCES drivers(id),

    truck_id UUID REFERENCES trucks(id),

    trailer_id UUID REFERENCES trailers(id),

    origin TEXT,

    destination TEXT,

    pickup_date TIMESTAMP,

    delivery_date TIMESTAMP,

    commodity TEXT,

    weight DECIMAL,

    pieces INTEGER,

    rate DECIMAL,

    status VARCHAR(50) DEFAULT 'PENDING',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
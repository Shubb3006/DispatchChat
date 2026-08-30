CREATE TABLE loads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    load_number VARCHAR(100) UNIQUE,

    dispatcher_id UUID REFERENCES users(id),
    driver_id UUID REFERENCES drivers(id),
    truck_id UUID REFERENCES trucks(id),
    trailer_id UUID REFERENCES trailers(id),

    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_billing_address TEXT,

    shipper_name VARCHAR(255),
    shipper_phone VARCHAR(50),
    shipper_address TEXT,
    origin TEXT,

    consignee_name VARCHAR(255),
    consignee_phone VARCHAR(50),
    consignee_address TEXT,
    destination TEXT,

    pickup_date TIMESTAMP,
    delivery_date TIMESTAMP,

    commodity TEXT,
    weight DECIMAL(10,2),
    pieces INTEGER,
    rate DECIMAL(10,2),

    status VARCHAR(50) DEFAULT 'PENDING',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
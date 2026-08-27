CREATE TABLE trucks (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    truck_number VARCHAR(50) UNIQUE,

    vin VARCHAR(100),

    make VARCHAR(100),

    model VARCHAR(100),

    year INT,

    plate_number VARCHAR(50),

    status VARCHAR(30) DEFAULT 'AVAILABLE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
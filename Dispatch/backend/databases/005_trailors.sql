CREATE TABLE trailers (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    trailer_number VARCHAR(50) UNIQUE NOT NULL,

    trailer_type VARCHAR(100),

    capacity DECIMAL,

    plate_number VARCHAR(50),

    status VARCHAR(30) DEFAULT 'AVAILABLE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);
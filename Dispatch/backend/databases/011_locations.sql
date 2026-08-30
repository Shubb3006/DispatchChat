CREATE TABLE locations (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) UNIQUE NOT NULL,

    address TEXT NOT NULL,

    city VARCHAR(100),

    state VARCHAR(100),

    zip_code VARCHAR(20),

    country VARCHAR(100),

    contact_person VARCHAR(255),

    contact_phone VARCHAR(30),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);
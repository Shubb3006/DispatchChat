CREATE TABLE customers (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_name VARCHAR(200) NOT NULL,

    contact_name VARCHAR(150),

    email VARCHAR(255),

    phone VARCHAR(20),

    address TEXT,

    city VARCHAR(100),

    state VARCHAR(100),

    zip_code VARCHAR(20),

    country VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
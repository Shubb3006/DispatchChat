CREATE TABLE drivers (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID REFERENCES users(id),

    license_number VARCHAR(100),

    license_expiry DATE,

    eld_id VARCHAR(100),

    status VARCHAR(30) DEFAULT 'AVAILABLE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
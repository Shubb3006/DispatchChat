-- CREATE TABLE drivers (

--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

--     user_id UUID REFERENCES users(id),

--     license_number VARCHAR(100),

--     license_expiry DATE,

--     eld_id VARCHAR(100),

--     status VARCHAR(30) DEFAULT 'AVAILABLE',

--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );


CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    driver_code VARCHAR(50) UNIQUE DEFAULT ('DRV' || LPAD(CAST(FLOOR(RANDOM() * 10000) AS VARCHAR), 4, '0')),
    license_number VARCHAR(100) NOT NULL,
    license_expiry DATE NOT NULL,
    license_state VARCHAR(50) DEFAULT 'MI',
    eld_id VARCHAR(100),
    phone_number VARCHAR(30),
    emergency_contact_phone VARCHAR(30),
    assigned_truck_number VARCHAR(50) DEFAULT 'TRK-102',
    assigned_trailer_number VARCHAR(50) DEFAULT 'TRL-504',
    current_duty_status VARCHAR(20) DEFAULT 'OFF', -- 'ON', 'D', 'SB', 'OFF'
    current_lat NUMERIC(10, 6) DEFAULT 42.331400,
    current_lng NUMERIC(10, 6) DEFAULT -83.045800,
    last_gps_updated_at TIMESTAMP,
    status VARCHAR(30) DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'OUT_OF_SERVICE'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
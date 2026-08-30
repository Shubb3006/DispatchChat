CREATE TABLE IF NOT EXISTS safety_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    driver_name VARCHAR(100),
    truck_number VARCHAR(50),
    type VARCHAR(50) DEFAULT 'emergency_sos',
    severity VARCHAR(30) DEFAULT 'high',
    description TEXT,
    location TEXT,
    coordinates JSONB,
    status VARCHAR(50) DEFAULT 'pending_review',
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

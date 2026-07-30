CREATE TABLE IF NOT EXISTS driver_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES loads(id) ON DELETE SET NULL,
    tracking_number VARCHAR(100),
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    file_name TEXT NOT NULL,
    file_size VARCHAR(50),
    file_path TEXT,
    image_url TEXT,
    status VARCHAR(50) DEFAULT 'pending_review',
    uploaded_by VARCHAR(100),
    extracted_data JSONB,
    skid_pictures JSONB,
    internal_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

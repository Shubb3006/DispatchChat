CREATE TABLE documents (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    load_id UUID REFERENCES loads(id),

    document_type VARCHAR(100),

    file_name TEXT,

    file_path TEXT,

    uploaded_by UUID REFERENCES users(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
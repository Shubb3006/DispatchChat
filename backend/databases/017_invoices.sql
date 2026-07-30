CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id UUID REFERENCES loads(id) ON DELETE SET NULL,
    shipment_id VARCHAR(100),
    tracking_number VARCHAR(100),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal NUMERIC(12, 2) DEFAULT 0.00,
    tax NUMERIC(12, 2) DEFAULT 0.00,
    total NUMERIC(12, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'draft',
    payment_terms VARCHAR(50) DEFAULT 'Net 30',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

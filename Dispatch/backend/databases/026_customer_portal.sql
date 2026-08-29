-- =============================================================
-- 026: Customer / Broker Portal
--
-- Brokers get provisioned logins (role 'customer') tied to a row in
-- customers. Everything they can see or touch is scoped by that
-- customer_id (strict tenant isolation, enforced in the API layer).
--
-- NOTE: migrations in this repo do NOT auto-run on deploy. The same
-- DDL is applied at runtime by src/services/portalSchema.service.js
-- (the codebase's established ensure*Table pattern), so the portal
-- works without running this by hand. This file remains the source
-- of truth for fresh environments.
-- =============================================================

-- Defensive: customers must exist before we can reference it.
CREATE TABLE IF NOT EXISTS customers (
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

-- Portal users: role 'customer' + a tenant link.
-- The original 001_users.sql CHECK constraint predates roles that are
-- already in production use (dispatcher, super_admin, warehouse_manager),
-- so drop it where it still exists.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);
CREATE INDEX IF NOT EXISTS idx_users_customer_id ON users(customer_id);

-- Rate requests: customer asks for a price, dispatcher quotes it,
-- customer accepts or rejects.
CREATE TABLE IF NOT EXISTS rate_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    requested_by UUID REFERENCES users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, QUOTED, ACCEPTED, REJECTED
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    freight_details JSONB DEFAULT '{}'::jsonb,     -- { skids, weight_lbs, dims: {length_in, width_in, height_in}, commodity, notes }
    quoted_price DECIMAL(12,2),
    quote_currency VARCHAR(10) DEFAULT 'USD',
    quote_notes TEXT,
    quoted_by UUID REFERENCES users(id),
    quoted_at TIMESTAMP,
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rate_requests_customer ON rate_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_rate_requests_status ON rate_requests(status);

-- Loads gain tenant ownership, an optional origin rate request, and a
-- cross-border flag (previously only derivable via customs_entries).
ALTER TABLE loads ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);
ALTER TABLE loads ADD COLUMN IF NOT EXISTS rate_request_id UUID REFERENCES rate_requests(id);
ALTER TABLE loads ADD COLUMN IF NOT EXISTS is_cross_border BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_loads_customer_id ON loads(customer_id);

-- Documents gain AI parse tracking (TENDER docs move PENDING -> PARSED/FAILED).
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_parsed_status VARCHAR(30) DEFAULT 'NOT_APPLICABLE';

-- Notifications table (009) — ensure it exists for dispatcher alerts.
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(200),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

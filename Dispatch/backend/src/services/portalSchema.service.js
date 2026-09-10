import pool from "../config/db.js";

// Migrations in this repo don't auto-run on deploy, so — like the existing
// ensure*Table pattern used by customs/invoices/settlements — the portal
// applies its own idempotent DDL the first time any portal endpoint is hit.
// Keep this in sync with databases/026_customer_portal.sql.
const PORTAL_DDL = `
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

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);
CREATE INDEX IF NOT EXISTS idx_users_customer_id ON users(customer_id);

CREATE TABLE IF NOT EXISTS rate_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    requested_by UUID REFERENCES users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    freight_details JSONB DEFAULT '{}'::jsonb,
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

ALTER TABLE loads ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);
ALTER TABLE loads ADD COLUMN IF NOT EXISTS rate_request_id UUID REFERENCES rate_requests(id);
ALTER TABLE loads ADD COLUMN IF NOT EXISTS is_cross_border BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_loads_customer_id ON loads(customer_id);

ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_parsed_status VARCHAR(30) DEFAULT 'NOT_APPLICABLE';

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(200),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

-- Columns the notification bell needs; older deployments created the table
-- without them, so add each one idempotently.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_notifications_customer ON notifications(customer_id, created_at DESC);

-- Per-load conversation between a broker and the dispatch team. Deliberately
-- NOT the legacy messages table: that one is Supabase realtime's own schema
-- (topic/payload/event) and has no tenant column.
CREATE TABLE IF NOT EXISTS load_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    sender_id UUID REFERENCES users(id),
    sender_name VARCHAR(150),
    sender_side VARCHAR(20) NOT NULL DEFAULT 'customer',
    body TEXT NOT NULL,
    read_by_customer_at TIMESTAMP,
    read_by_staff_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_load_messages_load ON load_messages(load_id, created_at);
CREATE INDEX IF NOT EXISTS idx_load_messages_customer ON load_messages(customer_id, created_at DESC);

-- Files a broker attaches to a rate request (a packing list, a customer's own
-- tender) before any load exists. They stay out of the documents table on
-- purpose: every reader of that table joins through load_id for tenancy, and
-- a rate request has no load yet.
CREATE TABLE IF NOT EXISTS rate_request_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rate_request_id UUID NOT NULL REFERENCES rate_requests(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    mime_type VARCHAR(120),
    size_bytes BIGINT,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rate_request_attachments_rr ON rate_request_attachments(rate_request_id);
`;

let ensurePromise = null;

export function ensurePortalSchema() {
  if (!ensurePromise) {
    ensurePromise = pool
      .query(PORTAL_DDL)
      .then(() => {
        console.log("✅ [Portal] Customer portal schema verified");
        return true;
      })
      .catch((err) => {
        // Reset so the next request retries instead of caching a failure.
        ensurePromise = null;
        console.error("Portal schema ensure failed:", err.message);
        throw err;
      });
  }
  return ensurePromise;
}

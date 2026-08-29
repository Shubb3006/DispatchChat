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

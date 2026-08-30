-- 104: Customer-scoped access
-- Links a portal user (role = customer) to the customers record whose data they may see.
-- Users with role customer and customer_id NULL see empty result sets.

ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_customer_id ON users(customer_id);

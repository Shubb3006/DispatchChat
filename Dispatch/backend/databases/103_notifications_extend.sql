-- 103: Extend notifications (009_notifications.sql) for the unified notification.service
--   type:        machine-readable notification type (e.g. LOAD_DELIVERED, POD_DELIVERED)
--   customer_id: notification addressed to a customer (instead of / in addition to a user)
--   email:       email address the notification was addressed to (if any)
--   meta:        arbitrary structured payload (load_id, tracking_url, document urls, ...)

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(200),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(100);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_customer ON notifications(customer_id);

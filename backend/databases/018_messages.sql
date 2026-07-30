CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES loads(id) ON DELETE CASCADE,

    text TEXT NOT NULL,

    attachments JSONB DEFAULT '[]',

    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_sender
ON messages(sender_id);

CREATE INDEX idx_messages_recipient
ON messages(recipient_id);

CREATE INDEX idx_messages_driver
ON messages(driver_id);

CREATE INDEX idx_messages_shipment
ON messages(shipment_id);

CREATE INDEX idx_messages_created
ON messages(created_at DESC);
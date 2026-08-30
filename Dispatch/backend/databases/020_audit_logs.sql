-- Migration: 020_audit_logs.sql
-- Description: Creates the audit_logs table for enterprise change tracking across the TMS

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(100) NOT NULL DEFAULT 'System / Automation',
    user_role VARCHAR(50) DEFAULT 'DISPATCHER',
    action VARCHAR(100) NOT NULL, -- 'LOAD_CREATED', 'LOAD_UPDATED', 'STATUS_CHANGED', 'DRIVER_ASSIGNED', 'CUSTOMS_FILED', 'RATE_MODIFIED', 'DETENTION_CLAIMED', 'DTC_CLEARED'
    entity_type VARCHAR(50) NOT NULL, -- 'LOAD', 'CUSTOMS', 'DRIVER', 'DETENTION', 'MAINTENANCE', 'TRIP', 'INVOICE'
    entity_id VARCHAR(100), -- UUID or Reference ID
    entity_identifier VARCHAR(100), -- Human-readable identifier: e.g. "Load #582517", "CUST-2026-2517", "Tractor 212"
    change_summary TEXT NOT NULL, -- Human-readable description of what changed
    details JSONB DEFAULT '{}'::jsonb, -- Field-level diff object { field: { old: ..., new: ... } }
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for high-performance filtering & searches
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

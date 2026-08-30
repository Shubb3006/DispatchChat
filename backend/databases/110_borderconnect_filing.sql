-- Migration: 110_borderconnect_filing.sql
-- Description: Honest BorderConnect ACE/ACI eManifest filing lifecycle columns.
--
-- Filing lifecycle persisted on customs_entries.border_connect_status:
--   DRAFT -> QUEUED -> SENT -> ACCEPTED | REJECTED | ERROR
--
-- The owning service (Dispatch/backend/src/services/borderconnect.service.js)
-- also runs these statements lazily (ADD COLUMN IF NOT EXISTS) at first use,
-- so the feature works on next boot without manual steps.

-- Filing lifecycle + request/response audit trail on customs_entries
ALTER TABLE customs_entries
    ADD COLUMN IF NOT EXISTS border_connect_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN IF NOT EXISTS bc_request_payload JSONB,
    ADD COLUMN IF NOT EXISTS bc_response_payload JSONB,
    ADD COLUMN IF NOT EXISTS bc_error_message TEXT,
    ADD COLUMN IF NOT EXISTS filed_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS last_status_check_at TIMESTAMP;

-- Columns referenced by existing sync code on loads but missing from schema
ALTER TABLE loads
    ADD COLUMN IF NOT EXISTS border_connect_status VARCHAR(30),
    ADD COLUMN IF NOT EXISTS paps_number VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_customs_bc_status ON customs_entries(border_connect_status);

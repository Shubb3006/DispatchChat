-- Migration: 019_customs_clearance.sql
-- Description: Create customs_entries table for US-Canada cross-border trade management

CREATE TABLE IF NOT EXISTS customs_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id UUID REFERENCES loads(id) ON DELETE SET NULL,
    
    entry_number VARCHAR(100) UNIQUE NOT NULL, -- e.g. CUST-2026-0089
    
    -- Border Cross Direction & Lead Type
    border_direction VARCHAR(50) NOT NULL DEFAULT 'INBOUND_US', -- 'INBOUND_US', 'INBOUND_CA', 'DOMESTIC_US', 'DOMESTIC_CA'
    lead_number_type VARCHAR(20) NOT NULL DEFAULT 'PAPS', -- 'PAPS' (US) or 'PARS' (Canada)
    lead_number VARCHAR(100) NOT NULL, -- e.g. OZCK10016001 (PAPS) or 987610016001 (PARS)
    scac_or_carrier_code VARCHAR(20) NOT NULL DEFAULT 'OZCK', -- SCAC (US) or CBSA 4-digit code (Canada)
    
    -- Port of Entry (POE)
    port_of_entry_code VARCHAR(50) NOT NULL, -- e.g. '3801', '0901', '3004'
    port_of_entry_name VARCHAR(255) NOT NULL, -- e.g. 'Detroit / Windsor (Ambassador Bridge)'
    port_country VARCHAR(10) NOT NULL DEFAULT 'US', -- 'US' or 'CA'
    
    -- Customs Status
    customs_status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', 
    -- 'DRAFT', 'SUBMITTED_TO_BROKER', 'PAPS_PARS_ACTIVE', 'EMANIFEST_FILED', 'ACCEPTED', 'CLEARED', 'HOLD_INSPECTION', 'REFUSED'
    
    -- Tax IDs & Business Numbers
    irs_number VARCHAR(50), -- US Importer IRS / EIN Number (e.g. 12-3456789)
    ins_number VARCHAR(50), -- INS / Canadian Importer Business Number (CRA BN e.g. 123456789RM0001)
    
    -- Customs Broker Information
    customs_broker_name VARCHAR(255), -- e.g. Livingston International, Willson International
    customs_broker_filer_code VARCHAR(50), -- e.g. LVN-9021
    customs_broker_email VARCHAR(255),
    customs_broker_phone VARCHAR(50),
    broker_entry_number VARCHAR(100), -- Entry # assigned by Customs Broker
    
    -- Commercial Valuation & Invoicing
    commercial_invoice_number VARCHAR(100),
    invoice_total_value DECIMAL(12,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD', -- 'USD' or 'CAD'
    country_of_origin VARCHAR(10) DEFAULT 'US',
    
    -- Harmonized Tariff Schedule (HTS) Items (JSONB array)
    -- Array of objects: [{ hts_code, description, quantity, unit, unit_price, total_value, weight_lbs, duty_rate_pct, fda_required, is_hazmat }]
    hts_items JSONB DEFAULT '[]'::jsonb,
    
    -- Fleet & Driver Cross-Border Credentials
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    driver_name VARCHAR(255),
    driver_fast_card_number VARCHAR(100), -- Free and Secure Trade (FAST) ID
    truck_number VARCHAR(100),
    trailer_number VARCHAR(100),
    
    -- eManifest References
    ace_trip_number VARCHAR(100), -- US CBP ACE eManifest Trip #
    aci_cargo_control_number VARCHAR(100), -- CBSA ACI Cargo Control # (CCN)
    
    -- Timestamps & Notes
    crossing_eta TIMESTAMP,
    cleared_at TIMESTAMP,
    inspection_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customs_lead_number ON customs_entries(lead_number);
CREATE INDEX IF NOT EXISTS idx_customs_direction ON customs_entries(border_direction);
CREATE INDEX IF NOT EXISTS idx_customs_status ON customs_entries(customs_status);
CREATE INDEX IF NOT EXISTS idx_customs_load_id ON customs_entries(load_id);

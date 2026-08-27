-- Migration: 021_driver_settlements.sql
-- Description: Driver Payroll Settlements, Rate Calculations, Deductions, and Trip Paystubs

CREATE TABLE IF NOT EXISTS driver_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_number VARCHAR(50) UNIQUE NOT NULL,
    driver_id VARCHAR(100) NOT NULL,
    driver_name VARCHAR(150) NOT NULL,
    driver_code VARCHAR(50),
    truck_number VARCHAR(50),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    pay_model VARCHAR(50) DEFAULT 'PER_MILE', -- PER_MILE, PERCENTAGE_OF_GROSS, HOURLY, FLAT
    
    -- Mileage & Load Totals
    total_loads INTEGER DEFAULT 1,
    loaded_miles NUMERIC(10, 2) DEFAULT 0.00,
    empty_miles NUMERIC(10, 2) DEFAULT 0.00,
    total_miles NUMERIC(10, 2) DEFAULT 0.00,
    
    -- Rates & Earnings
    rate_per_loaded_mile NUMERIC(10, 2) DEFAULT 0.68,
    rate_per_empty_mile NUMERIC(10, 2) DEFAULT 0.50,
    gross_percentage NUMERIC(5, 2) DEFAULT 28.00,
    gross_freight_revenue NUMERIC(12, 2) DEFAULT 0.00,
    base_pay NUMERIC(10, 2) DEFAULT 0.00,
    
    -- Accessorial Additions
    extra_stop_pay NUMERIC(10, 2) DEFAULT 0.00,
    detention_pay NUMERIC(10, 2) DEFAULT 0.00,
    layover_pay NUMERIC(10, 2) DEFAULT 0.00,
    reimbursements NUMERIC(10, 2) DEFAULT 0.00,
    total_gross_pay NUMERIC(10, 2) DEFAULT 0.00,
    
    -- Deductions (Fuel, Cash Advances, Insurance, Escrow, Equipment)
    deductions JSONB DEFAULT '{}'::jsonb,
    total_deductions NUMERIC(10, 2) DEFAULT 0.00,
    
    -- Final Payout
    net_payout NUMERIC(10, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'CAD',
    
    -- Status & Auditing
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, APPROVED, PAID, DISPUTED
    loads_included JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    approved_by VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_driver_settlements_driver_id ON driver_settlements(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_settlements_status ON driver_settlements(status);
CREATE INDEX IF NOT EXISTS idx_driver_settlements_period ON driver_settlements(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_driver_settlements_created_at ON driver_settlements(created_at DESC);

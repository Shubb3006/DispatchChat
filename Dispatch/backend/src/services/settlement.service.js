import pool from "../config/db.js";
import { recordAuditLog } from "./auditLogger.service.js";

let tableEnsured = false;

export const ensureSettlementTable = async () => {
  if (tableEnsured) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS driver_settlements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        settlement_number VARCHAR(50) UNIQUE NOT NULL,
        driver_id VARCHAR(100) NOT NULL,
        driver_name VARCHAR(150) NOT NULL,
        driver_code VARCHAR(50),
        truck_number VARCHAR(50),
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        pay_model VARCHAR(50) DEFAULT 'PER_MILE',
        total_loads INTEGER DEFAULT 1,
        loaded_miles NUMERIC(10, 2) DEFAULT 0.00,
        empty_miles NUMERIC(10, 2) DEFAULT 0.00,
        total_miles NUMERIC(10, 2) DEFAULT 0.00,
        rate_per_loaded_mile NUMERIC(10, 2) DEFAULT 0.68,
        rate_per_empty_mile NUMERIC(10, 2) DEFAULT 0.50,
        gross_percentage NUMERIC(5, 2) DEFAULT 28.00,
        gross_freight_revenue NUMERIC(12, 2) DEFAULT 0.00,
        base_pay NUMERIC(10, 2) DEFAULT 0.00,
        extra_stop_pay NUMERIC(10, 2) DEFAULT 0.00,
        detention_pay NUMERIC(10, 2) DEFAULT 0.00,
        layover_pay NUMERIC(10, 2) DEFAULT 0.00,
        reimbursements NUMERIC(10, 2) DEFAULT 0.00,
        total_gross_pay NUMERIC(10, 2) DEFAULT 0.00,
        deductions JSONB DEFAULT '{}'::jsonb,
        total_deductions NUMERIC(10, 2) DEFAULT 0.00,
        net_payout NUMERIC(10, 2) DEFAULT 0.00,
        currency VARCHAR(10) DEFAULT 'CAD',
        status VARCHAR(50) DEFAULT 'DRAFT',
        loads_included JSONB DEFAULT '[]'::jsonb,
        notes TEXT,
        approved_by VARCHAR(100),
        approved_at TIMESTAMP WITH TIME ZONE,
        paid_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    tableEnsured = true;
  } catch (err) {
    console.warn("Notice: settlement table check:", err.message);
  }
};

export const calculateSettlement = ({
  driver_id,
  driver_name,
  driver_code = "DRV001",
  truck_number = "TRK-104",
  period_start,
  period_end,
  pay_model = "PER_MILE",
  loads = [],
  loaded_miles = 0,
  empty_miles = 0,
  rate_per_loaded_mile = 0.68,
  rate_per_empty_mile = 0.50,
  gross_percentage = 28.0,
  extra_stops_count = 0,
  detention_hours = 0,
  layover_days = 0,
  fuel_advance = 0,
  insurance_deduction = 75,
  escrow_deduction = 50,
  currency = "CAD",
}) => {
  const total_miles = Number(loaded_miles) + Number(empty_miles);
  const gross_freight_revenue = loads.reduce((acc, l) => acc + (Number(l.rate || l.priceInvoice) || 2850), 0);

  let base_pay = 0;
  if (pay_model === "PERCENTAGE_OF_GROSS") {
    base_pay = Math.round(gross_freight_revenue * (Number(gross_percentage) / 100));
  } else if (pay_model === "FLAT") {
    base_pay = 1500;
  } else {
    // Default: PER_MILE
    base_pay = Math.round(
      Number(loaded_miles) * Number(rate_per_loaded_mile) +
      Number(empty_miles) * Number(rate_per_empty_mile)
    );
  }

  const extra_stop_pay = Number(extra_stops_count) * 50.0;
  const detention_pay = Number(detention_hours) * 35.0;
  const layover_pay = Number(layover_days) * 150.0;
  const reimbursements = 0;

  const total_gross_pay = base_pay + extra_stop_pay + detention_pay + layover_pay + reimbursements;

  const deductions = {
    fuel_advance: Number(fuel_advance),
    insurance: Number(insurance_deduction),
    escrow: Number(escrow_deduction),
  };

  const total_deductions = Number(fuel_advance) + Number(insurance_deduction) + Number(escrow_deduction);
  const net_payout = Math.max(0, total_gross_pay - total_deductions);

  const settlement_number = `SET-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    settlement_number,
    driver_id,
    driver_name,
    driver_code,
    truck_number,
    period_start,
    period_end,
    pay_model,
    total_loads: loads.length || 1,
    loaded_miles: Number(loaded_miles),
    empty_miles: Number(empty_miles),
    total_miles,
    rate_per_loaded_mile: Number(rate_per_loaded_mile),
    rate_per_empty_mile: Number(rate_per_empty_mile),
    gross_percentage: Number(gross_percentage),
    gross_freight_revenue,
    base_pay,
    extra_stop_pay,
    detention_pay,
    layover_pay,
    reimbursements,
    total_gross_pay,
    deductions,
    total_deductions,
    net_payout,
    currency,
    status: "DRAFT",
    loads_included: loads,
  };
};

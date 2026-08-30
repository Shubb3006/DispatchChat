import pool from "../config/db.js";
import { recordAuditLog } from "./auditLogger.service.js";

let tableEnsured = false;
let legsTableEnsured = false;

// Lazy DDL for relay legs (split loads). Mirrors databases/115_load_legs.sql so the
// feature works on next boot without running migrations manually.
export const ensureLoadLegsTable = async () => {
  if (legsTableEnsured) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS load_legs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
        trip_id UUID,
        seq INTEGER NOT NULL,
        origin_city VARCHAR(150),
        origin_state VARCHAR(50),
        destination_city VARCHAR(150),
        destination_state VARCHAR(50),
        origin_lat NUMERIC(10, 6),
        origin_lng NUMERIC(10, 6),
        dest_lat NUMERIC(10, 6),
        dest_lng NUMERIC(10, 6),
        driver_id UUID REFERENCES drivers(id),
        truck_id UUID,
        miles NUMERIC(10, 2),
        pay_override JSONB,
        status VARCHAR(30) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_load_legs_load_id ON load_legs(load_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_load_legs_driver_id ON load_legs(driver_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_load_legs_trip_id ON load_legs(trip_id);`);
    legsTableEnsured = true;
  } catch (err) {
    console.warn("Notice: load_legs table check:", err.message);
  }
};

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
    // Per-line pay breakdown (relay legs / pay transparency) — mirrors migration 116.
    await pool.query(
      `ALTER TABLE driver_settlements ADD COLUMN IF NOT EXISTS line_items JSONB DEFAULT '[]'::jsonb;`
    );
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

// ---------------------------------------------------------------------------
// Relay-leg aware settlement engine (split loads / driver pay transparency)
// ---------------------------------------------------------------------------

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const round2 = (n) => Math.round(toNum(n) * 100) / 100;

export const normalizeRateType = (t) => {
  const s = String(t || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (["PERCENT", "PERCENTAGE", "PERCENT_OF_GROSS", "PERCENTAGE_OF_GROSS"].includes(s)) {
    return "PERCENT_OF_GROSS";
  }
  if (s === "FLAT") return "FLAT";
  if (["PER_MILE", "MILEAGE"].includes(s)) return "PER_MILE";
  return null;
};

const parsePayOverride = (raw) => {
  if (!raw) return null;
  let obj = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== "object") return null;
  const rate_type = normalizeRateType(obj.rate_type);
  const rate = Number(obj.rate);
  if (!rate_type || !Number.isFinite(rate) || rate < 0) return null;
  return { rate_type, rate };
};

const cityState = (city, state) => {
  const s = [city, state].filter(Boolean).join(", ").trim();
  return s || null;
};

const loadNumberOf = (l) =>
  l?.load_number || l?.loadNumber || l?.reference || l?.id || l?.load_id || null;

// Best-effort per-load total miles from whatever the caller supplied on the load object.
const loadMilesOf = (l) => {
  for (const key of ["miles", "total_miles", "loaded_miles", "distance", "distance_miles"]) {
    const n = Number(l?.[key]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
};

// Mirrors the revenue default used by calculateSettlement for gross_freight_revenue.
const loadRevenueOf = (l) => Number(l?.rate || l?.priceInvoice) || 2850;

// Informational per-load lines for loads WITHOUT relay legs (leg_seq = null).
// Totals always come from calculateSettlement; amount is null when it cannot be
// honestly attributed to a single load (e.g. PER_MILE with unknown per-load miles).
const buildPlainLoadLines = (plainLoads, base) => {
  const model = String(base.pay_model || "PER_MILE").toUpperCase();
  return plainLoads.map((l) => {
    const miles = loadMilesOf(l);
    let rate_type = "PER_MILE";
    let rate = toNum(base.rate_per_loaded_mile, 0.68);
    let amount = null;
    if (model === "PERCENTAGE_OF_GROSS") {
      rate_type = "PERCENT_OF_GROSS";
      rate = toNum(base.gross_percentage, 28);
      amount = round2(loadRevenueOf(l) * (rate / 100));
    } else if (model === "FLAT") {
      rate_type = "FLAT";
      rate = toNum(base.base_pay, 1500);
      amount = plainLoads.length ? round2(rate / plainLoads.length) : round2(rate);
    } else if (miles != null) {
      amount = round2(miles * rate);
    }
    return {
      load_number: loadNumberOf(l),
      leg_seq: null,
      origin: l?.origin || cityState(l?.origin_city, l?.origin_state),
      destination: l?.destination || cityState(l?.destination_city, l?.destination_state),
      miles: miles != null ? round2(miles) : null,
      rate_type,
      rate: round2(rate),
      amount,
    };
  });
};

/**
 * Leg-aware settlement calculation.
 *
 * For each load in scope, checks load_legs:
 *  - If a load has relay legs, the driver is paid ONLY for their own legs:
 *    miles = leg.miles (fallback: proportional split of the load's miles by leg
 *    count), rate = leg.pay_override if set, else the driver's normal pay model.
 *    Each leg becomes its own line item carrying leg seq + origin -> destination.
 *  - Loads without legs keep the exact current calculateSettlement behavior.
 *
 * Returns the same shape as calculateSettlement plus `line_items` (array).
 */
export const calculateSettlementWithLegs = async (input = {}) => {
  const loads = Array.isArray(input.loads)
    ? input.loads.map((l) => (typeof l === "string" ? { id: l } : l || {}))
    : [];

  // Look up relay legs for every load in scope that has a resolvable UUID id.
  const legsByLoad = new Map();
  const loadIds = [
    ...new Set(
      loads
        .map((l) => String(l.id || l.load_id || ""))
        .filter((id) => UUID_REGEX.test(id))
    ),
  ];
  if (loadIds.length) {
    await ensureLoadLegsTable();
    try {
      const legsRes = await pool.query(
        `SELECT * FROM load_legs WHERE load_id = ANY($1::uuid[]) ORDER BY seq ASC;`,
        [loadIds]
      );
      for (const leg of legsRes.rows) {
        const key = String(leg.load_id);
        if (!legsByLoad.has(key)) legsByLoad.set(key, []);
        legsByLoad.get(key).push(leg);
      }
    } catch (err) {
      // Honest fallback: legs could not be read — pay whole loads as before, but say so.
      console.error("load_legs lookup failed, settling without leg split:", err.message);
      legsByLoad.clear();
    }
  }

  const plainLoads = [];
  const leggedLoads = [];
  for (const l of loads) {
    const id = String(l.id || l.load_id || "");
    const legs = legsByLoad.get(id);
    if (legs && legs.length) leggedLoads.push({ load: l, legs });
    else plainLoads.push(l);
  }

  // No relay legs anywhere in scope -> exact current behavior.
  if (!leggedLoads.length) {
    const base = calculateSettlement(input);
    return { ...base, line_items: buildPlainLoadLines(plainLoads, base) };
  }

  // Remove the legged loads' contribution from the caller-supplied aggregate miles so
  // the driver is not paid for the whole load AND their leg(s) on top of it.
  let subtractMiles = 0;
  for (const { load, legs } of leggedLoads) {
    const lm = loadMilesOf(load);
    if (lm != null) subtractMiles += lm;
    else subtractMiles += legs.reduce((acc, g) => acc + (toNum(g.miles) || 0), 0);
  }
  const adjustedLoadedMiles = Math.max(0, toNum(input.loaded_miles) - subtractMiles);

  // Loads without legs keep the exact current behavior.
  const base = calculateSettlement({
    ...input,
    loads: plainLoads,
    loaded_miles: adjustedLoadedMiles,
  });

  const driverId = input.driver_id != null ? String(input.driver_id) : null;
  const normalModel = String(input.pay_model || "PER_MILE").toUpperCase();

  const legLines = [];
  let driverLegMiles = 0;
  let legPay = 0;

  for (const { load, legs } of leggedLoads) {
    const legCount = legs.length;
    const loadMiles = loadMilesOf(load);
    const knownLegMiles = legs
      .map((g) => Number(g.miles))
      .filter((n) => Number.isFinite(n));
    const totalLegMiles =
      knownLegMiles.length === legCount
        ? knownLegMiles.reduce((a, b) => a + b, 0)
        : loadMiles != null
        ? loadMiles
        : knownLegMiles.reduce((a, b) => a + b, 0);
    const revenue = loadRevenueOf(load);

    for (const leg of legs) {
      // The driver is paid ONLY for their own legs.
      if (!driverId || String(leg.driver_id || "") !== driverId) continue;

      const rawMiles = Number(leg.miles);
      const legMiles = Number.isFinite(rawMiles)
        ? rawMiles
        : loadMiles != null && legCount > 0
        ? loadMiles / legCount
        : 0;
      const share =
        totalLegMiles > 0 ? legMiles / totalLegMiles : legCount > 0 ? 1 / legCount : 1;

      const override = parsePayOverride(leg.pay_override);
      let rate_type;
      let rate;
      let amount;
      if (override) {
        rate_type = override.rate_type;
        rate = override.rate;
        if (rate_type === "PER_MILE") amount = legMiles * rate;
        else if (rate_type === "FLAT") amount = rate;
        else amount = revenue * (rate / 100);
      } else if (normalModel === "PERCENTAGE_OF_GROSS") {
        rate_type = "PERCENT_OF_GROSS";
        rate = toNum(input.gross_percentage, 28);
        amount = revenue * (rate / 100) * share;
      } else if (normalModel === "FLAT") {
        rate_type = "FLAT";
        rate = 1500; // same flat base as calculateSettlement
        amount = rate * share;
      } else {
        rate_type = "PER_MILE";
        rate = toNum(input.rate_per_loaded_mile, 0.68);
        amount = legMiles * rate;
      }

      amount = round2(amount);
      driverLegMiles += legMiles;
      legPay += amount;

      legLines.push({
        load_number: loadNumberOf(load),
        leg_seq: toNum(leg.seq, null),
        origin: cityState(leg.origin_city, leg.origin_state),
        destination: cityState(leg.destination_city, leg.destination_state),
        miles: round2(legMiles),
        rate_type,
        rate: round2(rate),
        amount,
      });
    }
  }

  const legPayRounded = round2(legPay);
  const base_pay = round2(toNum(base.base_pay) + legPayRounded);
  const total_gross_pay = round2(toNum(base.total_gross_pay) + legPayRounded);
  const net_payout = Math.max(0, round2(total_gross_pay - toNum(base.total_deductions)));
  const loaded_miles = round2(toNum(base.loaded_miles) + driverLegMiles);
  const total_miles = round2(loaded_miles + toNum(base.empty_miles));
  const gross_freight_revenue = round2(loads.reduce((acc, l) => acc + loadRevenueOf(l), 0));

  return {
    ...base,
    base_pay,
    total_gross_pay,
    net_payout,
    loaded_miles,
    total_miles,
    gross_freight_revenue,
    total_loads: loads.length || 1,
    loads_included: loads,
    line_items: [...buildPlainLoadLines(plainLoads, base), ...legLines],
  };
};

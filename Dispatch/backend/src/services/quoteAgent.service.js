import pool from "../config/db.js";
import axios from "axios";

/**
 * Quote Agent - Autonomous AI for real-time quote generation
 *
 * Flow: tender data → estimate miles → query P&L for lane RPM/CPM
 *       → calculate quote with margin → persist to DB → return quote
 */

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5500";
const AXIOS_CONFIG = { timeout: 10000, withCredentials: true };

/**
 * Estimate distance between two cities using basic mileage lookup
 * (Production: integrate PC*MILER or Google Maps Distance Matrix)
 */
export async function estimateMileage(originCity, destinationCity) {
  try {
    // Placeholder: real integration would use PC*MILER or distance API
    // For now, use hardcoded common lane distances
    const commonLanes = {
      "Brampton→Davenport": 1300,
      "Toronto→Miami": 1400,
      "Montreal→Boston": 400,
      "Vancouver→Los Angeles": 1200,
      "Calgary→Houston": 2100,
    };

    const laneKey = `${originCity}→${destinationCity}`;
    if (commonLanes[laneKey]) return commonLanes[laneKey];

    // Fallback: average cross-border distance
    return 1200;
  } catch (err) {
    console.error("[Quote Agent] Mileage estimation error:", err.message);
    return 1200; // Safe fallback
  }
}

/**
 * Fetch real pricing data from P&L endpoint for a specific lane
 */
export async function fetchLanePricing(originCity, destinationCity) {
  try {
    const url = `${API_BASE_URL}/api/reporting/pnl?days=90`;
    const response = await axios.get(url, AXIOS_CONFIG);

    if (!response?.data?.lanes) return null;

    // Find matching lane(s) in P&L report
    const matching = response.data.lanes.filter(
      (lane) =>
        lane.originCity?.toLowerCase() === originCity.toLowerCase() &&
        lane.destinationCity?.toLowerCase() === destinationCity.toLowerCase()
    );

    if (matching.length === 0) {
      console.warn(`[Quote Agent] No pricing history for lane ${originCity}→${destinationCity}`);
      return null;
    }

    return matching[0]; // Top lane by revenue
  } catch (err) {
    console.error("[Quote Agent] P&L fetch error:", err.message);
    return null;
  }
}

/**
 * Calculate quote using real P&L data + tender details
 */
export async function calculateQuote({
  tenderData = {},
  targetMarginPercent = 20, // 20% margin target
  brokerCommissionPercent = 10, // 10% broker commission if applicable
} = {}) {
  const originCity = tenderData.shipper_city || "Unknown";
  const destCity = tenderData.consignee_city || "Unknown";

  console.log(`\n💰 [Quote Agent] Generating quote for ${originCity} → ${destCity}`);

  // Step 1: Estimate miles for this load
  const estimatedMiles = await estimateMileage(originCity, destCity);
  console.log(`   Miles: ${estimatedMiles}`);

  // Step 2: Fetch real lane pricing (90-day history)
  const lanePricing = await fetchLanePricing(originCity, destCity);

  let baseRate;
  let confidence = "estimated";

  if (lanePricing) {
    // Real data: calculate from RPM
    const rpm = lanePricing.rpm || (lanePricing.revenue / (lanePricing.miles || 1));
    baseRate = rpm * estimatedMiles;
    confidence = "market-based";
    console.log(`   RPM from history: $${rpm.toFixed(2)}, Quote: $${baseRate.toFixed(2)}`);
  } else {
    // Fallback: conservative estimate
    baseRate = estimatedMiles * 2.0; // $2.00/mile baseline
    console.log(`   No history found, using baseline $2/mile`);
  }

  // Step 3: Apply margin (always aim for target margin %)
  // Quote = (Cost / (1 - Margin%)) where Cost is estimated from CPM
  const estimatedCpm = 0.75; // $0.75 per mile operating cost (tunable)
  const estimatedCost = estimatedMiles * estimatedCpm;
  const quoteWithMargin = estimatedCost / (1 - targetMarginPercent / 100);
  const appliedMargin = Math.max(baseRate, quoteWithMargin);

  // Step 4: Apply broker commission if cross-border
  const isCrossBorder = tenderData.shipper_country !== tenderData.consignee_country;
  const commissionAmount = isCrossBorder ? (appliedMargin * brokerCommissionPercent) / 100 : 0;
  const finalRate = appliedMargin + commissionAmount;

  // Step 5: Compile quote details
  const quote = {
    tender_id: tenderData.po_number || `TENDER-${Date.now()}`,
    load_number: tenderData.load_number,
    customer_name: tenderData.customer_name || "Customer",
    customer_email: tenderData.customer_email,
    origin_city: originCity,
    destination_city: destCity,
    origin: tenderData.origin,
    destination: tenderData.destination,
    estimated_miles: estimatedMiles,
    base_rate: baseRate,
    margin_percent: targetMarginPercent,
    estimated_cost_per_mile: estimatedCpm,
    total_estimated_cost: estimatedCost,
    quote_rate: Math.round(finalRate * 100) / 100, // Round to cents
    broker_commission: commissionAmount,
    is_cross_border: isCrossBorder,
    pricing_source: confidence,
    status: "generated", // generated → sent → accepted/declined
    generated_at: new Date().toISOString(),
    valid_until: new Date(Date.now() + 24 * 3600 * 1000).toISOString(), // 24h quote validity
    notes: `Autonomous quote via Quote Agent. Confidence: ${confidence}.`,
  };

  console.log(`   Final Quote: $${quote.quote_rate} (Margin: ${targetMarginPercent}%)`);
  return quote;
}

/**
 * Persist quote to database
 */
export async function persistQuote(quote) {
  try {
    await ensureQuotesTable();

    const result = await pool.query(
      `INSERT INTO quotes (
        tender_id, load_number, customer_name, customer_email,
        origin_city, destination_city, origin, destination,
        estimated_miles, base_rate, margin_percent, estimated_cost_per_mile,
        total_estimated_cost, quote_rate, broker_commission, is_cross_border,
        pricing_source, status, generated_at, valid_until, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING id`,
      [
        quote.tender_id,
        quote.load_number,
        quote.customer_name,
        quote.customer_email,
        quote.origin_city,
        quote.destination_city,
        quote.origin,
        quote.destination,
        quote.estimated_miles,
        quote.base_rate,
        quote.margin_percent,
        quote.estimated_cost_per_mile,
        quote.total_estimated_cost,
        quote.quote_rate,
        quote.broker_commission,
        quote.is_cross_border,
        quote.pricing_source,
        quote.status,
        quote.generated_at,
        quote.valid_until,
        quote.notes,
      ]
    );

    const quoteId = result.rows[0].id;
    console.log(`   ✅ Quote ${quoteId} persisted to database`);
    return { ...quote, id: quoteId, success: true };
  } catch (err) {
    console.error("[Quote Agent] Persist error:", err.message);
    throw err;
  }
}

/**
 * Ensure quotes table exists (auto-migrate)
 */
export async function ensureQuotesTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quotes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tender_id VARCHAR(100) NOT NULL,
        load_number VARCHAR(50),
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        origin_city VARCHAR(100),
        destination_city VARCHAR(100),
        origin TEXT,
        destination TEXT,
        estimated_miles NUMERIC(10, 2),
        base_rate NUMERIC(12, 2),
        margin_percent NUMERIC(5, 2) DEFAULT 20.00,
        estimated_cost_per_mile NUMERIC(8, 2),
        total_estimated_cost NUMERIC(12, 2),
        quote_rate NUMERIC(12, 2) NOT NULL,
        broker_commission NUMERIC(12, 2) DEFAULT 0.00,
        is_cross_border BOOLEAN DEFAULT FALSE,
        pricing_source VARCHAR(50) DEFAULT 'market-based',
        status VARCHAR(50) DEFAULT 'generated',
        generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        valid_until TIMESTAMP WITH TIME ZONE,
        accepted_at TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_quotes_tender_id ON quotes(tender_id);
      CREATE INDEX IF NOT EXISTS idx_quotes_load_number ON quotes(load_number);
      CREATE INDEX IF NOT EXISTS idx_quotes_customer_email ON quotes(customer_email);
      CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
      CREATE INDEX IF NOT EXISTS idx_quotes_generated_at ON quotes(generated_at DESC);
    `);
  } catch (err) {
    if (!err.message.includes("already exists")) {
      console.error("[Quote Agent] Table ensure error:", err.message);
    }
  }
}

/**
 * Retrieve quote by ID
 */
export async function getQuoteById(quoteId) {
  try {
    const result = await pool.query(`SELECT * FROM quotes WHERE id = $1`, [quoteId]);
    return result.rows[0] || null;
  } catch (err) {
    console.error("[Quote Agent] Fetch error:", err.message);
    return null;
  }
}

/**
 * List quotes for a customer
 */
export async function getQuotesByCustomer(customerEmail, limit = 10) {
  try {
    const result = await pool.query(
      `SELECT * FROM quotes WHERE customer_email = $1 ORDER BY generated_at DESC LIMIT $2`,
      [customerEmail, limit]
    );
    return result.rows;
  } catch (err) {
    console.error("[Quote Agent] List error:", err.message);
    return [];
  }
}

/**
 * Mark quote as accepted (customer action)
 */
export async function acceptQuote(quoteId) {
  try {
    const result = await pool.query(
      `UPDATE quotes SET status = 'accepted', accepted_at = NOW() WHERE id = $1 RETURNING *`,
      [quoteId]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error("[Quote Agent] Accept error:", err.message);
    return null;
  }
}

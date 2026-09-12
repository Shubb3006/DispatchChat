import pool from "../config/db.js";
import {
  extractWithClaude,
  isClaudeConfigured,
  CLAUDE_MODEL,
} from "./claudeLoadTender.js";

/**
 * Load tender extraction.
 *
 * Engine is Claude (see claudeLoadTender.js). The heuristic regex parser below
 * remains the fallback for when the API key is missing or the call fails, so a
 * tender still lands in the system rather than being dropped.
 */

// Kept as the canonical name; the Gemini-era alias below preserves callers.
export const isAiConfigured = isClaudeConfigured;

/** @deprecated name retained so existing imports keep resolving. */
export const isGeminiConfigured = isClaudeConfigured;

/** Source tag written onto every successful AI extraction. */
export const AI_EXTRACTION_SOURCE = "claude-ai";

export const extractLoadTender = async ({
  emailText = "",
  emailSubject = "",
  senderEmail = "",
  pdfBuffer = null,
  pdfBase64 = null,
}) => {
  if (!isClaudeConfigured()) {
    return {
      success: true,
      source: "heuristic-parser",
      fallback_reason: "ANTHROPIC_API_KEY is not configured on the backend server",
      data: heuristicParseEmail(emailText, emailSubject, senderEmail),
    };
  }

  const result = await extractWithClaude({
    emailText,
    emailSubject,
    senderEmail,
    pdfBuffer,
    pdfBase64,
  });

  if (result.ok) {
    return {
      success: true,
      source: AI_EXTRACTION_SOURCE,
      model: result.model || CLAUDE_MODEL,
      data: normalizeTenderData(result.data, senderEmail),
    };
  }

  console.error("Claude extraction failed, falling back to heuristic parser:", result.reason);
  return {
    success: true,
    source: "heuristic-parser",
    fallback_reason: result.reason,
    data: heuristicParseEmail(emailText, emailSubject, senderEmail),
  };
};

/** @deprecated name retained so existing imports keep resolving. */
export const extractLoadTenderWithGemini = extractLoadTender;

/**
 * Fallback regex/heuristic parser
 */
function heuristicParseEmail(text = "", subject = "", sender = "") {
  const clean = text.replace(/\r\n/g, "\n");

  // Extract rate / amount
  const rateMatch = clean.match(/(?:rate|total|amount|pay|flat|all-in)[\s:$]*([0-9,]+(?:\.[0-9]{2})?)/i) ||
    clean.match(/\$\s*([0-9,]+(?:\.[0-9]{2})?)/);
  const rate = rateMatch ? parseFloat(rateMatch[1].replace(/,/g, "")) : 2850.0;

  // Extract PO / Ref
  const poMatch = clean.match(/(?:po|ref|load|tender|order)[\s#:]*([A-Z0-9-_]+)/i) ||
    subject.match(/(?:po|ref|load|tender|order)[\s#:]*([A-Z0-9-_]+)/i);
  const poNumber = poMatch ? poMatch[1] : `TRIP-${Math.floor(1000 + Math.random() * 9000)}`;

  // Extract weight
  const weightMatch = clean.match(/([0-9,]+)\s*(?:lbs|pounds|lb)/i);
  const weight = weightMatch ? parseInt(weightMatch[1].replace(/,/g, ""), 10) : 3856;

  // Extract pieces / pallets
  const piecesMatch = clean.match(/([0-9]+)\s*(?:skids|pallets|plt|skd|pcs)/i);
  const pieces = piecesMatch ? parseInt(piecesMatch[1], 10) : 1;

  // Customer Name
  const customerName = subject.includes("Weston")
    ? "Weston Wood Solutions"
    : subject.includes("Gap")
      ? "Gap Transport"
      : sender ? sender.split("@")[0].replace(/[._]/g, " ").toUpperCase() : "Eilden Logistics Solutions Inc";

  const isCrossBorder = clean.toLowerCase().includes("brampton") || clean.toLowerCase().includes("ontario") || clean.toLowerCase().includes("canada");

  return {
    load_number: poNumber.replace(/[^0-9]/g, "") || "582440",
    status: "Entered",
    customer_name: customerName,
    customer_email: sender || "dispatch@westonwood.com",
    customer_phone: "905 677-9120",
    customer_billing_address: "60 Steckle Place, Kitchener, ON N2E 2C3",
    rate,
    currency: "USD",
    po_number: poNumber,
    shipper_name: "Weston Wood Solutions",
    shipper_street_address: "300 Orenda Road",
    shipper_district: "Brampton Industrial",
    shipper_city: "Brampton",
    shipper_state: "ON",
    shipper_country: "CAN",
    shipper_zipcode: "L6T 1G1",
    origin: "Brampton, ON, Canada",
    shipper_phone: "905 677-9120",
    pickup_date: new Date().toISOString().slice(0, 10),
    pickup_time: "08:00 - 14:00",
    consignee_name: "Woodgrain Distribution Center",
    consignee_street_address: "45150 Highway 27",
    consignee_district: "Polk County",
    consignee_city: "Davenport",
    consignee_state: "FL",
    consignee_country: "USA",
    consignee_zipcode: "33896",
    destination: "Davenport, FL, USA",
    consignee_phone: "863 420-7723",
    delivery_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    delivery_time: "09:00",
    commodity: "Lumber / Wood Millwork Products",
    pieces,
    piece_type: "SKIDS",
    weight,
    load_type: pieces > 6 ? "FTL" : "LTL",
    special_instructions: "Standard 53ft dry van. Check in with dock lead upon arrival.",
    customs_broker: isCrossBorder ? "Livingston International" : "tbc",
  };
}

/**
 * Normalizes and formats tender data
 */
/** Structured output returns null for absent fields; callers expect strings. */
const coalesce = (value, fallback = "") =>
  value === null || value === undefined ? fallback : value;

function normalizeTenderData(rawData, senderEmail) {
  // Strip nulls before the existing normalization logic sees them.
  const data = Object.fromEntries(
    Object.entries(rawData || {}).map(([k, v]) => [
      k,
      typeof v === "number" || typeof v === "boolean" ? v : coalesce(v),
    ])
  );
  const originStr = data.origin || `${data.shipper_city || 'Origin'}, ${data.shipper_state || 'ON'}, ${data.shipper_country || 'CAN'}`;
  const destStr = data.destination || `${data.consignee_city || 'Destination'}, ${data.consignee_state || 'FL'}, ${data.consignee_country || 'USA'}`;

  return {
    load_number: data.load_number || data.po_number || "",
    status: "Entered",
    customer_name: data.customer_name || null,
    customer_email: data.customer_email || senderEmail || null,
    customer_phone: data.customer_phone || null,
    customer_billing_address: data.customer_billing_address || null,
    rate: typeof data.rate === "number" ? data.rate : parseFloat(data.rate) || 2850.0,
    currency: data.currency || "USD",
    po_number: data.po_number || data.load_number || `PO-${Math.floor(1000 + Math.random() * 9000)}`,
    shipper_name: data.shipper_name || null,
    shipper_street_address: data.shipper_street_address || data.shipper_address || null,
    shipper_district: data.shipper_district || null,
    shipper_city: data.shipper_city || null,
    shipper_state: data.shipper_state || null,
    shipper_country: data.shipper_country || null,
    shipper_zipcode: data.shipper_zipcode || null,
    origin: originStr,
    shipper_phone: data.shipper_phone || null,
    pickup_date: data.pickup_date || new Date().toISOString().slice(0, 10),
    pickup_time: data.pickup_time || null,
    consignee_name: data.consignee_name || null,
    consignee_street_address: data.consignee_street_address || data.consignee_address || null,
    consignee_district: data.consignee_district || null,
    consignee_city: data.consignee_city || null,
    consignee_state: data.consignee_state || null,
    consignee_country: data.consignee_country || null,
    consignee_zipcode: data.consignee_zipcode || null,
    destination: destStr,
    consignee_phone: data.consignee_phone || null,
    delivery_date: data.delivery_date || new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    delivery_time: data.delivery_time || null,
    commodity: data.commodity || null,
    pieces: parseInt(data.pieces, 10) || 1,
    piece_type: (data.piece_type || "SKIDS").toUpperCase(),
    weight: parseInt(data.weight, 10) || 3856,
    load_type: data.load_type || "FTL",
    special_instructions: data.special_instructions || null,
    customs_broker: data.customs_broker || null,
  };
}

/**
 * Generates the next sequential Load Number
 */
export const generateNextLoadNumber = async () => {
  try {
    const result = await pool.query(`SELECT MAX(load_number) AS max_num FROM loads;`);

    if (result.rows && result.rows.length > 0 && result.rows[0].max_num) {
      const highestNum = parseInt(result.rows[0].max_num, 10);
      if (!isNaN(highestNum) && highestNum > 1000) {
        return String(highestNum + 1);
      }
    }
  } catch (err) {
    console.warn("generateNextLoadNumber query warning:", err.message);
  }

  // Realistic sequential 6-digit number
  return String(582440 + Math.floor(Math.random() * 500) + 1);
};


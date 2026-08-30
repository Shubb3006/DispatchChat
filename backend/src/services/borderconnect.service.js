import axios from "axios";
import dotenv from "dotenv";
import pool from "../config/db.js";

dotenv.config();

/**
 * BorderConnect ACE / ACI eManifest integration — HONEST implementation.
 *
 * Credentials come from environment variables ONLY. There are no hardcoded
 * fallback keys and no fabricated "ACCEPTED" responses anywhere in this file.
 * If the integration is not configured, filing endpoints return
 * { ok: false, error: "borderconnect_not_configured" }.
 *
 * Request/response formats follow BorderConnect's public eManifest API docs:
 *   https://www.borderconnect.com/emanifest-api/index.htm
 *   - Envelope data types:  https://borderconnect.com/data/data-types.json
 *     (ACE_TRIP, ACE_SHIPMENT, ACE_SEND_REQUEST, ACI_TRIP, ACI_SHIPMENT,
 *      ACI_SEND_REQUEST, API_RESPONSE, ...)
 *   - Send request types:   https://borderconnect.com/data/us/ace/send-request-types.json
 *     (COMPLETE_TRIP_AND_SHIPMENTS, AMEND_TRIP_AND_SHIPMENTS, ...)
 *   - API response statuses: https://borderconnect.com/data/api-response-status-types.json
 *     (OK, QUEUED, IMPORTED, TRANSMITTED, DATA_ERROR, SEND_ERROR, SYNC_ERROR,
 *      COMPLETED, ACCESS_DENIED_ERROR, IMPORTED_WITH_ERRORS, PROCESSED_WITH_ERRORS)
 *
 * Filing lifecycle persisted on customs_entries.border_connect_status:
 *   DRAFT -> QUEUED -> SENT -> ACCEPTED | REJECTED | ERROR
 */

// ---------------------------------------------------------------------------
// Configuration (env only — no hardcoded credentials)
// ---------------------------------------------------------------------------
let BORDERCONNECT_API_KEY = process.env.BORDERCONNECT_API_KEY || "";
let BORDERCONNECT_COMPANY_KEY = process.env.BORDERCONNECT_COMPANY_KEY || "";
let BORDERCONNECT_COMPANY_HANDLE = process.env.BORDERCONNECT_COMPANY_HANDLE || "";
let BORDERCONNECT_SEND_URL = process.env.BORDERCONNECT_SEND_URL || "";
let BORDERCONNECT_RECEIVE_URL = process.env.BORDERCONNECT_RECEIVE_URL || "";
let BORDERCONNECT_WS_URL = process.env.BORDERCONNECT_WS_URL || "";
let BORDERCONNECT_SCAC = process.env.BORDERCONNECT_SCAC || "";
let BORDERCONNECT_CARRIER_CODE = process.env.BORDERCONNECT_CARRIER_CODE || "";

const BORDERCONNECT_TIMEOUT_MS = Number.parseInt(
  process.env.BORDERCONNECT_TIMEOUT_MS || "15000",
  10
);

export const BC_STATUS = {
  DRAFT: "DRAFT",
  QUEUED: "QUEUED",
  SENT: "SENT",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  ERROR: "ERROR",
};

const isConfigured = () =>
  Boolean(BORDERCONNECT_API_KEY && BORDERCONNECT_COMPANY_KEY && BORDERCONNECT_SEND_URL);

const mask = (value) =>
  value && value.length > 9
    ? `${value.slice(0, 5)}••••••••${value.slice(-4)}`
    : value
    ? "••••"
    : "";

/**
 * Update BorderConnect API credentials at runtime (kept for backward
 * compatibility with the existing /borderconnect/config endpoint).
 */
export const setBorderConnectCredentials = (apiKey, companyKey, companyCode) => {
  if (apiKey !== undefined) BORDERCONNECT_API_KEY = apiKey;
  if (companyKey !== undefined) BORDERCONNECT_COMPANY_KEY = companyKey;
  if (companyCode !== undefined) BORDERCONNECT_SCAC = companyCode;
};

/**
 * Honest, masked view of the current configuration. Never exposes raw keys
 * and never claims "ONLINE / VERIFIED" — only whether credentials are set.
 */
export const getBorderConnectCredentials = () => {
  const configured = isConfigured();
  return {
    configured,
    hasKey: Boolean(BORDERCONNECT_API_KEY),
    companyHandle: BORDERCONNECT_COMPANY_HANDLE,
    companyCode: BORDERCONNECT_SCAC,
    carrierCode: BORDERCONNECT_CARRIER_CODE,
    maskedKey: mask(BORDERCONNECT_API_KEY),
    maskedCompanyKey: mask(BORDERCONNECT_COMPANY_KEY),
    sendUrl: BORDERCONNECT_SEND_URL,
    receiveUrl: BORDERCONNECT_RECEIVE_URL,
    wsUrl: BORDERCONNECT_WS_URL,
    status: configured ? "CONFIGURED" : "NOT_CONFIGURED",
    checkedAt: new Date().toISOString(),
  };
};

const getHeaders = () => ({
  Authorization: `Bearer ${BORDERCONNECT_API_KEY}`,
  "X-API-Key": BORDERCONNECT_API_KEY,
  "X-Company-Key": BORDERCONNECT_COMPANY_KEY,
  "Content-Type": "application/json",
  Accept: "application/json",
});

// ---------------------------------------------------------------------------
// Lazy DDL — mirrors databases/110_borderconnect_filing.sql so the feature
// works on next boot without a manual migration run.
// ---------------------------------------------------------------------------
let filingColumnsReady = null;

export const ensureFilingColumns = async () => {
  if (!filingColumnsReady) {
    filingColumnsReady = (async () => {
      // Table may not exist yet on a fresh database.
      await pool.query(`
        CREATE TABLE IF NOT EXISTS customs_entries (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            load_id UUID,
            entry_number VARCHAR(100) UNIQUE NOT NULL,
            border_direction VARCHAR(50) NOT NULL DEFAULT 'INBOUND_US',
            lead_number_type VARCHAR(20) NOT NULL DEFAULT 'PAPS',
            lead_number VARCHAR(100) NOT NULL,
            scac_or_carrier_code VARCHAR(20) NOT NULL DEFAULT 'NISD',
            port_of_entry_code VARCHAR(50) NOT NULL,
            port_of_entry_name VARCHAR(255) NOT NULL,
            port_country VARCHAR(10) NOT NULL DEFAULT 'US',
            customs_status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await pool.query(`
        ALTER TABLE customs_entries
            ADD COLUMN IF NOT EXISTS border_connect_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
            ADD COLUMN IF NOT EXISTS bc_request_payload JSONB,
            ADD COLUMN IF NOT EXISTS bc_response_payload JSONB,
            ADD COLUMN IF NOT EXISTS bc_error_message TEXT,
            ADD COLUMN IF NOT EXISTS filed_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS last_status_check_at TIMESTAMP;
      `);
      await pool.query(`
        ALTER TABLE loads
            ADD COLUMN IF NOT EXISTS border_connect_status VARCHAR(30),
            ADD COLUMN IF NOT EXISTS paps_number VARCHAR(100);
      `);
      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_customs_bc_status ON customs_entries(border_connect_status);`
      );
    })().catch((err) => {
      filingColumnsReady = null;
      throw err;
    });
  }
  return filingColumnsReady;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const isCanadaAddress = (addr = "") => {
  const text = String(addr).toUpperCase();
  const caMarkers = ["CANADA", " ON ", " QC ", " BC ", " AB ", " MB ", " SK ", " NB ", " NS ", "ONTARIO", "QUEBEC"];
  return caMarkers.some((m) => text.includes(m) || text.endsWith(m.trim()));
};

const isUsaAddress = (addr = "") => {
  const text = String(addr).toUpperCase();
  const usMarkers = ["USA", "UNITED STATES", " IL ", " MI ", " NY ", " NJ ", " OH ", " IN ", " PA ", " TX ", " WA ", " FL ", " GA "];
  return usMarkers.some((m) => text.includes(m) || text.endsWith(m.trim()));
};

/** Remove undefined/null/empty-string keys so we only send real data. */
const prune = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(prune).filter((v) => v !== undefined);
  }
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const cleaned = prune(v);
      if (
        cleaned === undefined ||
        cleaned === null ||
        cleaned === "" ||
        (Array.isArray(cleaned) && cleaned.length === 0) ||
        (typeof cleaned === "object" && !Array.isArray(cleaned) && Object.keys(cleaned).length === 0)
      ) {
        continue;
      }
      out[k] = cleaned;
    }
    return out;
  }
  return obj;
};

/** BorderConnect expects "yyyy-MM-dd HH:mm:ss". */
const formatBcDateTime = (value) => {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const splitName = (fullName = "") => {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
};

const parseIfJsonString = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
};

/**
 * Map BorderConnect apiResponse.status / restApiResponse.status values to our
 * persisted lifecycle. Returns null for values we do not recognize — callers
 * must NOT invent success for unknown values.
 * Reference: https://borderconnect.com/data/api-response-status-types.json
 */
export const mapBorderConnectStatus = (rawStatus) => {
  const s = String(rawStatus || "").toUpperCase();
  switch (s) {
    case "QUEUED":
      return BC_STATUS.QUEUED;
    case "OK":
    case "SUCCESS":
    case "IMPORTED":
    case "TRANSMITTED":
    case "COMPLETED":
      return BC_STATUS.SENT;
    case "ACCEPTED":
      return BC_STATUS.ACCEPTED;
    case "REJECTED":
    case "DATA_ERROR":
    case "SEND_ERROR":
    case "IMPORTED_WITH_ERRORS":
    case "PROCESSED_WITH_ERRORS":
      return BC_STATUS.REJECTED;
    case "FAILURE":
    case "SYNC_ERROR":
    case "ACCESS_DENIED_ERROR":
      return BC_STATUS.ERROR;
    default:
      return null;
  }
};

/** Pull a human-readable error message out of a BorderConnect response body. */
const extractErrorMessage = (body) => {
  if (!body || typeof body !== "object") return "";
  const notes = Array.isArray(body.errors)
    ? body.errors
        .map((e) => (e && (e.note || e.identifier) ? `${e.identifier ? `[${e.identifier}] ` : ""}${e.note || ""}`.trim() : null))
        .filter(Boolean)
    : [];
  if (notes.length > 0) return notes.join("; ").slice(0, 2000);
  if (body.message) return String(body.message).slice(0, 2000);
  if (body.errorCode) return String(body.errorCode);
  return "";
};

const describeAxiosError = (err) => {
  if (err.code === "ECONNABORTED") {
    return `BorderConnect request timed out after ${BORDERCONNECT_TIMEOUT_MS}ms`;
  }
  if (err.response) {
    const bodyMsg = extractErrorMessage(err.response.data);
    return `BorderConnect HTTP ${err.response.status}${bodyMsg ? `: ${bodyMsg}` : ""}`;
  }
  return `BorderConnect network error: ${err.message}`;
};

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------
const persistFilingState = async (
  entryId,
  { status, requestPayload, responsePayload, errorMessage, filedAt, lastStatusCheckAt }
) => {
  const result = await pool.query(
    `UPDATE customs_entries
     SET border_connect_status = COALESCE($1, border_connect_status),
         bc_request_payload = COALESCE($2::jsonb, bc_request_payload),
         bc_response_payload = COALESCE($3::jsonb, bc_response_payload),
         bc_error_message = CASE WHEN $7 THEN $4 ELSE bc_error_message END,
         filed_at = COALESCE($5, filed_at),
         last_status_check_at = COALESCE($6, last_status_check_at),
         updated_at = NOW()
     WHERE id = $8
     RETURNING *;`,
    [
      status || null,
      requestPayload ? JSON.stringify(requestPayload) : null,
      responsePayload ? JSON.stringify(responsePayload) : null,
      errorMessage === undefined ? null : errorMessage,
      filedAt || null,
      lastStatusCheckAt || null,
      errorMessage !== undefined, // whether to overwrite bc_error_message (allows clearing with null)
      entryId,
    ]
  );
  const entry = result.rows[0] || null;

  // Mirror the honest filing status onto the load, if linked.
  if (entry && entry.load_id && status) {
    await pool
      .query(
        `UPDATE loads SET border_connect_status = $1, updated_at = NOW() WHERE id = $2;`,
        [status, entry.load_id]
      )
      .catch((e) => console.warn("loads.border_connect_status mirror failed:", e.message));
  }
  return entry;
};

const fetchEntryWithLoad = async (entryId) => {
  const result = await pool.query(
    `SELECT ce.*, row_to_json(l.*) AS load
     FROM customs_entries ce
     LEFT JOIN loads l ON ce.load_id = l.id
     WHERE ce.id = $1;`,
    [entryId]
  );
  return result.rows[0] || null;
};

// ---------------------------------------------------------------------------
// Payload builders (real data only — no fabricated defaults)
// ---------------------------------------------------------------------------
const buildParty = (name, street, city, stateProvince, country, postalCode) =>
  prune({
    name,
    address: prune({
      addressLine: street,
      city,
      stateProvince,
      country,
      postalCode,
    }),
  });

const buildCommodities = (entry, load) => {
  const htsItems = parseIfJsonString(entry.hts_items, []);
  if (Array.isArray(htsItems) && htsItems.length > 0) {
    return htsItems.map((item) =>
      prune({
        description: item.description,
        quantity: Number(item.quantity) || undefined,
        packagingUnit: item.unit || undefined,
        weight: Number(item.weight_lbs) || undefined,
        weightUnit: item.weight_lbs ? "L" : undefined, // "L" = pounds per CBP/ACE convention
      })
    );
  }
  // Fall back to load-level cargo data if it actually exists.
  const description = load?.commodity || load?.cargo_description || load?.cargo || null;
  const weight = Number(load?.weight) || undefined;
  const pieces = Number(load?.pieces) || undefined;
  if (!description && !weight && !pieces) return [];
  return [
    prune({
      description: description || undefined,
      quantity: pieces,
      packagingUnit: pieces ? "PCS" : undefined,
      weight,
      weightUnit: weight ? "L" : undefined,
    }),
  ];
};

const buildDrivers = (entry) => {
  if (!entry.driver_name) return [];
  const { firstName, lastName } = splitName(entry.driver_name);
  return [
    prune({
      firstName,
      lastName,
      fastCardNumber: entry.driver_fast_card_number || undefined,
    }),
  ];
};

/**
 * Build the two-step BorderConnect request for an entry:
 *   1. trip upload  (ACE_TRIP or ACI_TRIP, with nested shipments)
 *   2. send request (ACE_SEND_REQUEST or ACI_SEND_REQUEST, COMPLETE_TRIP_AND_SHIPMENTS)
 */
const buildManifestRequest = (entry, load) => {
  const isAce = entry.border_direction !== "INBOUND_CA";
  const sendId = `${entry.id}-${Date.now()}`;

  const missing = [];
  if (!entry.lead_number) missing.push("lead_number");
  if (!entry.port_of_entry_code) missing.push("port_of_entry_code");
  if (!entry.truck_number) missing.push("truck_number");
  if (!entry.driver_name) missing.push("driver_name");

  const commodities = buildCommodities(entry, load);
  if (commodities.length === 0) missing.push("hts_items (at least one commodity line)");

  if (isAce && !BORDERCONNECT_SCAC) missing.push("BORDERCONNECT_SCAC env var");
  if (!isAce && !BORDERCONNECT_CARRIER_CODE) missing.push("BORDERCONNECT_CARRIER_CODE env var");

  if (missing.length > 0) {
    return { ok: false, missing };
  }

  // Trip number must be unique and carrier-prefixed. Reuse a previously
  // assigned trip number when present so re-filing amends the same trip.
  const priorRequest = parseIfJsonString(entry.bc_request_payload, null);
  const tripNumber =
    (isAce ? entry.ace_trip_number : null) ||
    priorRequest?.tripNumber ||
    `${entry.lead_number}T`;

  const shipment = prune({
    data: isAce ? "ACE_SHIPMENT" : "ACI_SHIPMENT",
    type: entry.lead_number_type || (isAce ? "PAPS" : "PARS"),
    shipmentControlNumber: isAce ? entry.lead_number : undefined,
    cargoControlNumber: !isAce
      ? entry.aci_cargo_control_number || entry.lead_number
      : undefined,
    provinceOfLoading: isAce ? load?.shipper_state || undefined : undefined,
    shipper: buildParty(
      entry.shipper_name || load?.shipper_name,
      load?.shipper_street_address,
      load?.shipper_district,
      load?.shipper_state,
      load?.shipper_country,
      load?.shipper_postal_code
    ),
    consignee: buildParty(
      entry.consignee_name || load?.consignee_name,
      load?.consignee_street_address,
      load?.consignee_district,
      load?.consignee_state,
      load?.consignee_country,
      load?.consignee_postal_code
    ),
    commodities,
  });

  const tripUpload = prune({
    data: isAce ? "ACE_TRIP" : "ACI_TRIP",
    sendId: `${sendId}-trip`,
    companyKey: BORDERCONNECT_COMPANY_KEY,
    tripNumber,
    usPortOfArrival: isAce ? entry.port_of_entry_code : undefined,
    portOfEntry: !isAce ? entry.port_of_entry_code : undefined,
    estimatedArrivalDateTime: formatBcDateTime(entry.crossing_eta),
    truck: prune({ number: entry.truck_number }),
    trailers: entry.trailer_number ? [prune({ number: entry.trailer_number })] : undefined,
    drivers: buildDrivers(entry),
    shipments: [shipment],
  });

  const sendRequest = prune({
    data: isAce ? "ACE_SEND_REQUEST" : "ACI_SEND_REQUEST",
    sendId: `${sendId}-send`,
    companyKey: BORDERCONNECT_COMPANY_KEY,
    type: "COMPLETE_TRIP_AND_SHIPMENTS",
    tripNumber,
  });

  return { ok: true, isAce, tripNumber, tripUpload, sendRequest };
};

// ---------------------------------------------------------------------------
// Core filing flow
// ---------------------------------------------------------------------------
const postToBorderConnect = async (payload) =>
  axios.post(BORDERCONNECT_SEND_URL, payload, {
    headers: getHeaders(),
    timeout: BORDERCONNECT_TIMEOUT_MS,
  });

/**
 * File (transmit) a customs entry's ACE/ACI eManifest with BorderConnect.
 * Persists the real request, the real response, and an honest lifecycle
 * status. Timeouts and network errors become ERROR — never ACCEPTED.
 */
export const sendManifest = async (entryId) => {
  if (!isConfigured()) {
    return { ok: false, error: "borderconnect_not_configured" };
  }

  await ensureFilingColumns();

  const entry = await fetchEntryWithLoad(entryId);
  if (!entry) {
    return { ok: false, error: "customs_entry_not_found" };
  }

  const built = buildManifestRequest(entry, entry.load || null);
  if (!built.ok) {
    const message = `Missing required data for eManifest filing: ${built.missing.join(", ")}`;
    const updated = await persistFilingState(entryId, {
      status: BC_STATUS.ERROR,
      errorMessage: message,
    });
    return { ok: false, error: "missing_required_fields", missing: built.missing, message, customs_entry: updated };
  }

  const requestPayload = {
    tripNumber: built.tripNumber,
    manifestType: built.isAce ? "ACE" : "ACI",
    tripUpload: built.tripUpload,
    sendRequest: built.sendRequest,
    requestedAt: new Date().toISOString(),
  };

  // Mark as QUEUED locally with the exact request we are about to send.
  await persistFilingState(entryId, {
    status: BC_STATUS.QUEUED,
    requestPayload,
    errorMessage: null,
  });

  const responsePayload = { tripUploadResponse: null, sendRequestResponse: null, statusMessages: [] };

  // Step 1: upload the trip + shipments.
  let uploadBody;
  try {
    const res = await postToBorderConnect(built.tripUpload);
    uploadBody = res.data;
    responsePayload.tripUploadResponse = uploadBody ?? null;
  } catch (err) {
    const message = describeAxiosError(err);
    console.error("BorderConnect trip upload failed:", message);
    responsePayload.tripUploadResponse = err.response?.data ?? { transportError: message };
    const updated = await persistFilingState(entryId, {
      status: BC_STATUS.ERROR,
      responsePayload,
      errorMessage: message,
    });
    return { ok: false, status: BC_STATUS.ERROR, error: message, customs_entry: updated };
  }

  const uploadStatus = mapBorderConnectStatus(uploadBody?.status);
  if (uploadStatus === BC_STATUS.REJECTED || uploadStatus === BC_STATUS.ERROR) {
    const message =
      extractErrorMessage(uploadBody) || `BorderConnect rejected the trip upload (status: ${uploadBody?.status})`;
    const updated = await persistFilingState(entryId, {
      status: uploadStatus,
      responsePayload,
      errorMessage: message,
    });
    return { ok: false, status: uploadStatus, error: message, customs_entry: updated };
  }
  if (uploadStatus === null && uploadBody?.status !== undefined) {
    // Unknown status value — do not invent success.
    const message = `BorderConnect returned unrecognized status "${uploadBody.status}" on trip upload`;
    const updated = await persistFilingState(entryId, {
      status: BC_STATUS.ERROR,
      responsePayload,
      errorMessage: message,
    });
    return { ok: false, status: BC_STATUS.ERROR, error: message, customs_entry: updated };
  }

  // Step 2: request transmission to customs (CBP / CBSA).
  let sendBody;
  try {
    const res = await postToBorderConnect(built.sendRequest);
    sendBody = res.data;
    responsePayload.sendRequestResponse = sendBody ?? null;
  } catch (err) {
    const message = describeAxiosError(err);
    console.error("BorderConnect send request failed:", message);
    responsePayload.sendRequestResponse = err.response?.data ?? { transportError: message };
    const updated = await persistFilingState(entryId, {
      status: BC_STATUS.ERROR,
      responsePayload,
      errorMessage: message,
    });
    return { ok: false, status: BC_STATUS.ERROR, error: message, customs_entry: updated };
  }

  const sendStatus = mapBorderConnectStatus(sendBody?.status);
  if (sendStatus === BC_STATUS.REJECTED || sendStatus === BC_STATUS.ERROR) {
    const message =
      extractErrorMessage(sendBody) || `BorderConnect rejected the send request (status: ${sendBody?.status})`;
    const updated = await persistFilingState(entryId, {
      status: sendStatus,
      responsePayload,
      errorMessage: message,
    });
    return { ok: false, status: sendStatus, error: message, customs_entry: updated };
  }

  // QUEUED (BorderConnect queued it) or SENT (imported/transmitted).
  const finalStatus =
    sendStatus === BC_STATUS.QUEUED ? BC_STATUS.QUEUED : sendStatus === BC_STATUS.SENT ? BC_STATUS.SENT : null;

  if (finalStatus === null) {
    const message = `BorderConnect returned unrecognized status "${sendBody?.status}" on send request`;
    const updated = await persistFilingState(entryId, {
      status: BC_STATUS.ERROR,
      responsePayload,
      errorMessage: message,
    });
    return { ok: false, status: BC_STATUS.ERROR, error: message, customs_entry: updated };
  }

  const updated = await persistFilingState(entryId, {
    status: finalStatus,
    responsePayload,
    errorMessage: null,
    filedAt: new Date(),
  });

  // Persist the assigned trip number on ACE entries for later matching.
  if (built.isAce && !entry.ace_trip_number) {
    await pool
      .query(`UPDATE customs_entries SET ace_trip_number = $1 WHERE id = $2;`, [built.tripNumber, entryId])
      .catch(() => {});
  }

  return {
    ok: true,
    status: finalStatus,
    tripNumber: built.tripNumber,
    manifestType: built.isAce ? "ACE" : "ACI",
    message:
      sendBody?.message ||
      `eManifest ${finalStatus === BC_STATUS.QUEUED ? "queued by" : "transmitted via"} BorderConnect`,
    customs_entry: updated,
  };
};

// ---------------------------------------------------------------------------
// Status refresh (poll the receive endpoint for real customs responses)
// ---------------------------------------------------------------------------
const messageMatchesEntry = (msg, entry) => {
  if (!msg || typeof msg !== "object") return false;
  const priorRequest = parseIfJsonString(entry.bc_request_payload, null);
  const candidates = [
    entry.ace_trip_number,
    entry.aci_cargo_control_number,
    entry.lead_number,
    priorRequest?.tripNumber,
  ]
    .filter(Boolean)
    .map((v) => String(v).toUpperCase());

  const msgIds = [
    msg.tripNumber,
    msg.shipmentControlNumber,
    msg.cargoControlNumber,
    ...(msg.tripNumbers ? String(msg.tripNumbers).split(",") : []),
  ]
    .filter(Boolean)
    .map((v) => String(v).trim().toUpperCase());

  return msgIds.some((id) => candidates.includes(id));
};

/**
 * Query BORDERCONNECT_RECEIVE_URL for queued responses and persist any that
 * pertain to the given customs entry. Returns the honest stored state.
 *
 * Note: BorderConnect's REST receive endpoint dequeues messages; messages for
 * other manifests retrieved during this poll are matched against their own
 * entries where possible.
 */
export const refreshManifestStatus = async (entryId) => {
  if (!isConfigured() || !BORDERCONNECT_RECEIVE_URL) {
    return { ok: false, error: "borderconnect_not_configured" };
  }

  await ensureFilingColumns();

  const entry = await fetchEntryWithLoad(entryId);
  if (!entry) {
    return { ok: false, error: "customs_entry_not_found" };
  }

  const checkedAt = new Date();
  let body;
  try {
    const res = await axios.get(BORDERCONNECT_RECEIVE_URL, {
      headers: getHeaders(),
      timeout: BORDERCONNECT_TIMEOUT_MS,
      validateStatus: (s) => s >= 200 && s < 300,
    });
    body = res.data;
  } catch (err) {
    const message = describeAxiosError(err);
    console.error("BorderConnect receive poll failed:", message);
    const updated = await persistFilingState(entryId, { lastStatusCheckAt: checkedAt });
    return { ok: false, error: message, customs_entry: updated };
  }

  // The receive endpoint may return nothing, a single message, or an array.
  let messages = [];
  if (Array.isArray(body)) messages = body;
  else if (body && typeof body === "object") messages = [body];
  else if (typeof body === "string" && body.trim()) {
    try {
      const parsed = JSON.parse(body);
      messages = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      messages = [];
    }
  }

  let matchedCount = 0;
  let newStatus = null;
  let newError;

  const responsePayload = parseIfJsonString(entry.bc_response_payload, {}) || {};
  if (!Array.isArray(responsePayload.statusMessages)) responsePayload.statusMessages = [];

  for (const msg of messages) {
    const matchesThis = messageMatchesEntry(msg, entry);
    if (matchesThis) {
      matchedCount += 1;
      responsePayload.statusMessages.push(msg);
      // ACE_RESPONSE / ACI_RESPONSE carry the customs decision in `type`
      // (e.g. ACCEPTED / REJECTED); API_RESPONSE carries processing status.
      const mapped = mapBorderConnectStatus(msg.type) ?? mapBorderConnectStatus(msg.status);
      if (mapped) {
        newStatus = mapped;
        newError =
          mapped === BC_STATUS.REJECTED || mapped === BC_STATUS.ERROR
            ? extractErrorMessage(msg) || `BorderConnect reported ${msg.type || msg.status}`
            : null;
      }
    } else {
      // Try to persist messages that belong to other entries so no real
      // customs response is silently dropped.
      await applyMessageToMatchingEntry(msg).catch((e) =>
        console.warn("Could not route BorderConnect message to an entry:", e.message)
      );
    }
  }

  // Cap stored message history to the most recent 50.
  responsePayload.statusMessages = responsePayload.statusMessages.slice(-50);

  const updated = await persistFilingState(entryId, {
    status: newStatus,
    responsePayload: matchedCount > 0 ? responsePayload : undefined,
    errorMessage: newError,
    lastStatusCheckAt: checkedAt,
  });

  return {
    ok: true,
    updated: matchedCount > 0 && Boolean(newStatus),
    status: updated?.border_connect_status || entry.border_connect_status,
    error_message: updated?.bc_error_message || null,
    messagesChecked: messages.length,
    matched: matchedCount,
    customs_entry: updated,
    message:
      matchedCount > 0
        ? `Processed ${matchedCount} BorderConnect message(s) for this manifest`
        : "No new BorderConnect messages for this manifest",
  };
};

/** Route a received message to whichever customs entry it belongs to. */
const applyMessageToMatchingEntry = async (msg) => {
  if (!msg || typeof msg !== "object") return;
  const ids = [
    msg.tripNumber,
    msg.shipmentControlNumber,
    msg.cargoControlNumber,
    ...(msg.tripNumbers ? String(msg.tripNumbers).split(",").map((s) => s.trim()) : []),
  ].filter(Boolean);
  if (ids.length === 0) return;

  const result = await pool.query(
    `SELECT id, bc_response_payload FROM customs_entries
     WHERE ace_trip_number = ANY($1) OR lead_number = ANY($1) OR aci_cargo_control_number = ANY($1)
     LIMIT 1;`,
    [ids]
  );
  const row = result.rows[0];
  if (!row) return;

  const mapped = mapBorderConnectStatus(msg.type) ?? mapBorderConnectStatus(msg.status);
  const payload = parseIfJsonString(row.bc_response_payload, {}) || {};
  if (!Array.isArray(payload.statusMessages)) payload.statusMessages = [];
  payload.statusMessages = [...payload.statusMessages, msg].slice(-50);

  await persistFilingState(row.id, {
    status: mapped || null,
    responsePayload: payload,
    errorMessage:
      mapped === BC_STATUS.REJECTED || mapped === BC_STATUS.ERROR
        ? extractErrorMessage(msg) || `BorderConnect reported ${msg.type || msg.status}`
        : undefined,
  });
};

// ---------------------------------------------------------------------------
// Backward-compatible exports (now honest)
// ---------------------------------------------------------------------------

/**
 * Honest PAPS/PARS status: returns the state stored in our database for the
 * given lead number. There is no documented BorderConnect endpoint for ad-hoc
 * barcode lookup — live updates arrive via the receive queue (use
 * refreshManifestStatus). This function never fabricates an ACCEPTED result.
 */
export const checkPapsParsStatus = async (leadNumber, leadType = "PAPS") => {
  const cleanNumber = String(leadNumber || "").trim();
  if (!cleanNumber) {
    return { success: false, error: "lead_number_required" };
  }

  try {
    await ensureFilingColumns();
    const result = await pool.query(
      `SELECT id, lead_number, lead_number_type, customs_status, border_connect_status,
              bc_error_message, filed_at, last_status_check_at, broker_entry_number
       FROM customs_entries
       WHERE lead_number = $1
       ORDER BY created_at DESC
       LIMIT 1;`,
      [cleanNumber]
    );
    const row = result.rows[0];
    if (!row) {
      return {
        success: false,
        source: "local_database",
        leadNumber: cleanNumber,
        leadType,
        error: "entry_not_found",
        message: `No customs entry found for ${leadType} ${cleanNumber}`,
      };
    }
    return {
      success: true,
      source: "local_database",
      leadNumber: cleanNumber,
      leadType: row.lead_number_type || leadType,
      entryId: row.id,
      status: row.border_connect_status || "DRAFT",
      customsStatus: row.customs_status,
      errorMessage: row.bc_error_message || null,
      filedAt: row.filed_at,
      lastStatusCheckAt: row.last_status_check_at,
      brokerEntryNumber: row.broker_entry_number || null,
      message:
        "Stored filing status from the local database. Use refresh-status to poll BorderConnect for updates.",
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("checkPapsParsStatus error:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Backward-compatible ACE transmit entry point. Requires an entryId — filing
 * is always performed from persisted customs entry data. Never fabricates
 * success.
 */
export const transmitAceManifest = async (manifestPayload = {}) => {
  const entryId = manifestPayload.entryId || manifestPayload.entry_id || manifestPayload.id;
  if (!entryId) {
    return {
      ok: false,
      success: false,
      error: "entry_id_required",
      message: "ACE filing requires the customs entry id (entryId).",
    };
  }
  const result = await sendManifest(entryId);
  return { ...result, success: result.ok };
};

/**
 * Backward-compatible ACI transmit entry point. Same contract as ACE.
 */
export const transmitAciManifest = async (manifestPayload = {}) => {
  const entryId = manifestPayload.entryId || manifestPayload.entry_id || manifestPayload.id;
  if (!entryId) {
    return {
      ok: false,
      success: false,
      error: "entry_id_required",
      message: "ACI filing requires the customs entry id (entryId).",
    };
  }
  const result = await sendManifest(entryId);
  return { ...result, success: result.ok };
};

/**
 * Honest cross-border sync: scans loads for cross-border shipments and
 * creates missing customs entries as DRAFT. It does NOT transmit anything and
 * NEVER marks entries or loads as ACCEPTED — filing is an explicit action.
 */
export const syncAllCrossBorderShipments = async () => {
  await ensureFilingColumns();

  let allLoads = [];
  try {
    const loadsRes = await pool.query(`SELECT * FROM loads ORDER BY created_at DESC LIMIT 100;`);
    allLoads = loadsRes.rows || [];
  } catch (err) {
    return { success: false, error: `loads query failed: ${err.message}` };
  }

  const crossBorderLoads = allLoads.filter((l) => {
    const orig = `${l.shipper_street_address || ""} ${l.shipper_district || ""} ${l.shipper_state || ""} ${l.shipper_country || ""} ${l.origin || ""}`;
    const dest = `${l.consignee_street_address || ""} ${l.consignee_district || ""} ${l.consignee_state || ""} ${l.consignee_country || ""} ${l.destination || ""}`;
    return (
      (isCanadaAddress(orig) && isUsaAddress(dest)) ||
      (isUsaAddress(orig) && isCanadaAddress(dest))
    );
  });

  let created = 0;
  let skippedExisting = 0;
  const createdEntries = [];

  for (const load of crossBorderLoads) {
    const loadNum = String(load.load_number || load.tracking_number || load.id)
      .replace(/\D/g, "")
      .padStart(6, "0")
      .slice(-6);

    const orig = `${load.shipper_street_address || ""} ${load.shipper_district || ""} ${load.shipper_state || ""} ${load.shipper_country || ""} ${load.origin || ""}`;
    const isCanadaToUs = isCanadaAddress(orig);
    const direction = isCanadaToUs ? "INBOUND_US" : "INBOUND_CA";
    const leadType = isCanadaToUs ? "PAPS" : "PARS";
    const carrierCode = isCanadaToUs ? BORDERCONNECT_SCAC : BORDERCONNECT_CARRIER_CODE;

    if (!carrierCode) {
      // Without a real carrier code we cannot generate a valid lead number.
      continue;
    }
    const leadNumber = `${carrierCode}${loadNum}`;

    let existingEntry = null;
    try {
      const checkRes = await pool.query(
        `SELECT id FROM customs_entries WHERE load_id = $1 OR lead_number = $2 LIMIT 1;`,
        [load.id, leadNumber]
      );
      existingEntry = checkRes.rows[0] || null;
    } catch (e) {
      console.warn("customs_entries existence check failed:", e.message);
      continue;
    }

    if (existingEntry) {
      skippedExisting += 1;
      continue;
    }

    try {
      const insertRes = await pool.query(
        `INSERT INTO customs_entries (
           load_id, entry_number, border_direction, lead_number_type, lead_number,
           scac_or_carrier_code, port_of_entry_code, port_of_entry_name, port_country,
           customs_status, border_connect_status,
           shipper_name, consignee_name, driver_name, truck_number, trailer_number,
           created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5,
           $6, $7, $8, $9,
           'DRAFT', 'DRAFT',
           $10, $11, $12, $13, $14,
           NOW(), NOW()
         ) RETURNING id, lead_number, border_direction, border_connect_status;`,
        [
          load.id,
          `CUST-${new Date().getFullYear()}-${loadNum}`,
          direction,
          leadType,
          leadNumber,
          carrierCode,
          isCanadaToUs ? "3801" : "440",
          isCanadaToUs ? "Detroit Ambassador Bridge" : "Windsor Ambassador Bridge (CBSA)",
          isCanadaToUs ? "US" : "CA",
          load.shipper_name || null,
          load.consignee_name || null,
          load.driver_name || null,
          load.truck_number || null,
          load.trailer_number || null,
        ]
      );
      created += 1;
      createdEntries.push(insertRes.rows[0]);

      await pool
        .query(
          `UPDATE loads SET border_connect_status = 'DRAFT', paps_number = $1, updated_at = NOW() WHERE id = $2;`,
          [leadNumber, load.id]
        )
        .catch(() => {});
    } catch (err) {
      console.warn("customs_entries insert failed:", err.message);
    }
  }

  return {
    success: true,
    provider: "BorderConnect",
    configured: isConfigured(),
    companyHandle: BORDERCONNECT_COMPANY_HANDLE,
    scac: BORDERCONNECT_SCAC,
    carrierCode: BORDERCONNECT_CARRIER_CODE,
    totalCrossBorderLoads: crossBorderLoads.length,
    created,
    skippedExisting,
    createdEntries,
    note:
      "Entries are created as DRAFT. Nothing was transmitted to customs — file each manifest explicitly with BorderConnect.",
    syncedAt: new Date().toISOString(),
  };
};

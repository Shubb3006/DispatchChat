import axios from "axios";
import pool from "../config/db.js";

/**
 * BorderConnect Service — Real-time CBP/CBSA customs integration
 *
 * Connects to BorderConnect API for:
 * - ACE/ACI e-manifest transmission to CBP/CBSA
 * - Real-time border wait times
 * - Customs entry validation
 * - Live manifest acknowledgment tracking
 */

const BORDERCONNECT_BASE_URL = process.env.BORDERCONNECT_API_URL || "https://api.borderconnect.com";
const BORDERCONNECT_API_KEY = process.env.BORDERCONNECT_API_KEY || "";
const BORDERCONNECT_SECRET = process.env.BORDERCONNECT_API_SECRET || "";

const client = axios.create({
  baseURL: BORDERCONNECT_BASE_URL,
  timeout: 15000,
  headers: {
    "Authorization": `Bearer ${BORDERCONNECT_API_KEY}`,
    "X-API-Secret": BORDERCONNECT_SECRET,
    "Content-Type": "application/json",
  },
});

/**
 * Transmit ACE manifest to CBP in real-time
 */
export async function transmitAceManifestToCbp({
  manifestId,
  manifestXml,
  portOfEntry,
  carrierScac,
  truckNumber,
  driverLicense,
}) {
  try {
    console.log(`🌐 [BorderConnect] Transmitting ACE manifest ${manifestId} to CBP...`);

    const response = await client.post("/manifests/ace/submit", {
      manifest_id: manifestId,
      manifest_xml: manifestXml,
      port_of_entry: portOfEntry,
      carrier_scac: carrierScac,
      truck_number: truckNumber,
      driver_license: driverLicense,
      timestamp: new Date().toISOString(),
    });

    const { data } = response;

    await pool.query(
      `UPDATE emanifests SET status = 'transmitted', transmitted_at = NOW(), errors = NULL WHERE id = $1`,
      [manifestId]
    );

    console.log(`✅ [BorderConnect] ACE manifest ${manifestId} transmitted to CBP`);
    console.log(`   CBP Reference: ${data.cbp_reference_id || "pending"}`);

    return {
      success: true,
      cbpReferenceId: data.cbp_reference_id,
      status: data.status,
      message: data.message,
      estimatedProcessingTime: data.estimated_processing_time_minutes,
    };
  } catch (err) {
    console.error(`❌ [BorderConnect] ACE transmission failed: ${err.message}`);

    await pool.query(
      `UPDATE emanifests SET status = 'transmission_failed', errors = $1 WHERE id = $2`,
      [err.message || err.response?.data?.message, manifestId]
    );

    throw err;
  }
}

/**
 * Get real-time border wait times from BorderConnect
 */
export async function getRealBorderWaitTimes() {
  try {
    console.log(`🚚 [BorderConnect] Fetching real-time border wait times...`);

    const response = await client.get("/borders/wait-times", {
      params: { include_fast_lanes: true },
    });

    const { data } = response;

    if (!global.borderWaitCache) global.borderWaitCache = {};
    global.borderWaitCache = { data: data.ports, timestamp: Date.now() };

    console.log(`✅ [BorderConnect] Retrieved wait times for ${data.ports.length} ports`);

    return {
      source: "borderconnect-live",
      timestamp: data.timestamp,
      ports: data.ports.map((port) => ({
        port_name: port.name,
        port_code: port.code,
        commercial_lane_wait_minutes: port.commercial_wait_minutes,
        fast_lane_wait_minutes: port.fast_wait_minutes || null,
        status: port.status,
        traffic_direction: port.direction,
        last_updated: port.last_updated,
      })),
    };
  } catch (err) {
    console.error(`❌ [BorderConnect] Border wait fetch failed: ${err.message}`);
    return null;
  }
}

/**
 * Poll manifest acknowledgment from CBP
 */
export async function pollManifestAcknowledgment(manifestId, cbpReferenceId) {
  try {
    console.log(`📋 [BorderConnect] Polling CBP acknowledgment for ${cbpReferenceId}...`);

    const response = await client.get(`/manifests/${cbpReferenceId}/status`);

    const { data } = response;

    if (data.status === "acknowledged") {
      await pool.query(
        `UPDATE emanifests SET status = 'acknowledged', acknowledged_at = NOW() WHERE id = $1`,
        [manifestId]
      );

      console.log(`✅ [BorderConnect] Manifest ${manifestId} acknowledged by CBP`);
    }

    return {
      status: data.status,
      cbpStatus: data.cbp_status_code,
      message: data.message,
      rejectionReason: data.rejection_reason || null,
      estimatedClearanceTime: data.estimated_clearance_minutes,
    };
  } catch (err) {
    console.error(`❌ [BorderConnect] Status poll failed: ${err.message}`);
    return null;
  }
}

/**
 * Validate customs entry before dispatch
 */
export async function validateCustomsEntry(customsEntryId) {
  try {
    console.log(`✔️ [BorderConnect] Validating customs entry ${customsEntryId}...`);

    const response = await client.post(`/customs-entries/${customsEntryId}/validate`);

    const { data } = response;

    const isValid = data.validation_result === "valid";

    if (!isValid) {
      console.warn(
        `⚠️ [BorderConnect] Customs entry validation failed: ${data.validation_errors.join(", ")}`
      );
    }

    return {
      isValid,
      validationErrors: data.validation_errors || [],
      missingDocuments: data.missing_documents || [],
      recommendedActions: data.recommended_actions || [],
    };
  } catch (err) {
    console.error(`❌ [BorderConnect] Validation failed: ${err.message}`);
    return { isValid: false, validationErrors: [err.message], missingDocuments: [], recommendedActions: [] };
  }
}

/**
 * Check customs hold status
 */
export async function checkCustomsHold(loadNumber, truckNumber) {
  try {
    console.log(`🔍 [BorderConnect] Checking customs hold for ${loadNumber}...`);

    const response = await client.get("/customs/holds/check", {
      params: { load_number: loadNumber, truck_number: truckNumber },
    });

    const { data } = response;

    if (data.has_hold) {
      console.warn(`⚠️ [BorderConnect] CUSTOMS HOLD: ${data.hold_reason}`);
    }

    return {
      hasHold: data.has_hold,
      holdReason: data.hold_reason || null,
      holdExpiresAt: data.hold_expires_at,
      action: data.recommended_action,
    };
  } catch (err) {
    console.error(`❌ [BorderConnect] Hold check failed: ${err.message}`);
    return { hasHold: false, holdReason: null, action: "Retry connection" };
  }
}

/**
 * Health check
 */
export async function healthCheck() {
  try {
    const response = await client.get("/health");
    return {
      status: response.data.status,
      apiVersion: response.data.api_version,
      connected: true,
    };
  } catch (err) {
    console.error(`❌ [BorderConnect] API unreachable: ${err.message}`);
    return { status: "offline", connected: false };
  }
}

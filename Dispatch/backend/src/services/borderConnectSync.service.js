import pool from "../config/db.js";
import {
  transmitAceManifestToCbp,
  getRealBorderWaitTimes,
  pollManifestAcknowledgment,
} from "./borderConnect.service.js";

/**
 * BorderConnect Sync Service — Autonomous manifest transmission & status tracking
 *
 * Handles:
 * - Bulk transmission of ready customs entries
 * - Auto-transmission when load status changes
 * - Real-time acknowledgment polling
 * - Wait time enrichment for each entry
 */

/**
 * Bulk transmit all DRAFT manifests to CBP
 */
export async function bulkTransmitDraftManifests() {
  try {
    console.log(`🔄 [BorderConnect Sync] Starting bulk transmission...`);

    const manifestsResult = await pool.query(`
      SELECT em.*, l.load_number, l.truck_id, l.driver_id, ce.port_of_entry_code
      FROM emanifests em
      JOIN loads l ON em.load_id = l.id
      LEFT JOIN customs_entries ce ON em.customs_entry_id = ce.id
      WHERE em.status = 'draft'
      ORDER BY em.created_at ASC
      LIMIT 50
    `);

    const manifests = manifestsResult.rows;
    console.log(`📋 [BorderConnect Sync] Found ${manifests.length} DRAFT manifests`);

    let successCount = 0;
    let failureCount = 0;
    const results = [];

    for (const manifest of manifests) {
      try {
        const result = await transmitAceManifestToCbp({
          manifestId: manifest.id,
          manifestXml: manifest.manifest_xml,
          portOfEntry: manifest.port_of_entry_code || "3801",
          carrierScac: "NISD",
          truckNumber: manifest.truck_id || "TBD",
          driverLicense: manifest.driver_id || "TBD",
        });

        successCount++;
        results.push({
          manifestId: manifest.id,
          manifestNumber: manifest.manifest_number,
          status: "transmitted",
          cbpReferenceId: result.cbpReferenceId,
        });

        console.log(`✅ [BorderConnect Sync] ${manifest.manifest_number} → CBP`);
      } catch (err) {
        failureCount++;
        results.push({
          manifestId: manifest.id,
          manifestNumber: manifest.manifest_number,
          status: "failed",
          error: err.message,
        });

        console.warn(`❌ [BorderConnect Sync] ${manifest.manifest_number} failed: ${err.message}`);
      }
    }

    console.log(`✨ [BorderConnect Sync] Complete: ${successCount} transmitted, ${failureCount} failed`);

    return {
      totalProcessed: manifests.length,
      successCount,
      failureCount,
      results,
    };
  } catch (err) {
    console.error("[BorderConnect Sync] Bulk transmission error:", err.message);
    throw err;
  }
}

/**
 * Auto-transmit manifest when load status changes to 'Confirmed'
 */
export async function autoTransmitOnLoadStatusChange(loadId, newStatus) {
  if (newStatus !== "Confirmed" && newStatus !== "Ready to Dispatch") {
    return null;
  }

  try {
    console.log(`🔄 [BorderConnect Sync] Auto-transmit for load ${loadId} (status: ${newStatus})`);

    const manifestResult = await pool.query(
      `SELECT * FROM emanifests WHERE load_id = $1 AND status = 'draft' LIMIT 1`,
      [loadId]
    );

    if (manifestResult.rows.length === 0) {
      console.log(`ℹ️ [BorderConnect Sync] No DRAFT manifest for load ${loadId}`);
      return null;
    }

    const manifest = manifestResult.rows[0];

    const loadResult = await pool.query(
      `SELECT l.*, ce.port_of_entry_code
       FROM loads l
       LEFT JOIN customs_entries ce ON l.id = ce.load_id
       WHERE l.id = $1`,
      [loadId]
    );

    if (loadResult.rows.length === 0) {
      throw new Error(`Load ${loadId} not found`);
    }

    const load = loadResult.rows[0];

    const result = await transmitAceManifestToCbp({
      manifestId: manifest.id,
      manifestXml: manifest.manifest_xml,
      portOfEntry: load.port_of_entry_code || "3801",
      carrierScac: "NISD",
      truckNumber: load.truck_id || "TBD",
      driverLicense: load.driver_id || "TBD",
    });

    console.log(`✅ [BorderConnect Sync] Auto-transmitted ${manifest.manifest_number}`);

    return {
      manifestId: manifest.id,
      manifestNumber: manifest.manifest_number,
      status: "transmitted",
      cbpReferenceId: result.cbpReferenceId,
    };
  } catch (err) {
    console.warn(`⚠️ [BorderConnect Sync] Auto-transmit failed: ${err.message}`);
    return null;
  }
}

/**
 * Enrich customs entries with real-time wait times and manifest status
 */
export async function enrichCustomsEntriesWithBorderData(customsEntries) {
  try {
    const waitTimes = await getRealBorderWaitTimes();

    if (!waitTimes) {
      console.warn("⚠️ [BorderConnect Sync] Could not fetch wait times");
      return customsEntries;
    }

    const waitTimeMap = {};
    if (waitTimes.ports) {
      waitTimes.ports.forEach((port) => {
        waitTimeMap[port.port_code] = {
          commercial_wait_minutes: port.commercial_lane_wait_minutes,
          fast_lane_wait_minutes: port.fast_lane_wait_minutes,
          status: port.status,
          traffic_direction: port.traffic_direction,
          last_updated: port.last_updated,
        };
      });
    }

    const enriched = await Promise.all(
      customsEntries.map(async (entry) => {
        const portCode = entry.port_of_entry_code || "3801";
        const waitData = waitTimeMap[portCode] || {};

        const manifestResult = await pool.query(
          `SELECT id, status, manifest_number, transmitted_at, acknowledged_at
           FROM emanifests
           WHERE customs_entry_id = $1 OR load_id = $2
           ORDER BY created_at DESC LIMIT 1`,
          [entry.id, entry.load_id]
        );

        const manifest = manifestResult.rows[0] || {};

        return {
          ...entry,
          border_wait_times: waitData,
          manifest_status: manifest.status || "not_generated",
          manifest_number: manifest.manifest_number,
          transmitted_at: manifest.transmitted_at,
          acknowledged_at: manifest.acknowledged_at,
        };
      })
    );

    return enriched;
  } catch (err) {
    console.error("[BorderConnect Sync] Enrichment error:", err.message);
    return customsEntries;
  }
}

/**
 * Poll for acknowledgments on all transmitted manifests
 */
export async function pollAllManifestAcknowledgments() {
  try {
    console.log(`📊 [BorderConnect Sync] Polling manifest acknowledgments...`);

    const manifestsResult = await pool.query(`
      SELECT id, status, manifest_number
      FROM emanifests
      WHERE status = 'transmitted'
      AND acknowledged_at IS NULL
      LIMIT 20
    `);

    const manifests = manifestsResult.rows;
    console.log(`🔍 [BorderConnect Sync] Checking ${manifests.length} transmitted manifests`);

    let acknowledgedCount = 0;

    for (const manifest of manifests) {
      try {
        const status = await pollManifestAcknowledgment(
          manifest.id,
          manifest.manifest_number
        );

        if (status && status.status === "acknowledged") {
          acknowledgedCount++;
          console.log(`✅ [BorderConnect Sync] ${manifest.manifest_number} acknowledged`);
        }
      } catch (err) {
        console.warn(`⚠️ [BorderConnect Sync] Poll error for ${manifest.manifest_number}: ${err.message}`);
      }
    }

    console.log(`✨ [BorderConnect Sync] Polling complete: ${acknowledgedCount} acknowledged`);

    return {
      totalPolled: manifests.length,
      acknowledgedCount,
    };
  } catch (err) {
    console.error("[BorderConnect Sync] Polling error:", err.message);
    throw err;
  }
}

/**
 * Get enriched customs entries view for dashboard
 */
export async function getEnrichedCustomsEntries(filters = {}) {
  try {
    const { status = "all", borderDirection = "all", limit = 50 } = filters;

    let query = `
      SELECT ce.*, l.load_number, l.status as load_status
      FROM customs_entries ce
      JOIN loads l ON ce.load_id = l.id
      WHERE 1=1
    `;

    const params = [];

    if (status !== "all") {
      query += ` AND ce.customs_status = $${params.length + 1}`;
      params.push(status);
    }

    if (borderDirection !== "all") {
      query += ` AND ce.border_direction = $${params.length + 1}`;
      params.push(borderDirection);
    }

    query += ` ORDER BY ce.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    const entries = result.rows;

    const enriched = await enrichCustomsEntriesWithBorderData(entries);

    return enriched;
  } catch (err) {
    console.error("[BorderConnect Sync] Enriched entries error:", err.message);
    throw err;
  }
}

/**
 * Schedule periodic sync (call from worker)
 */
export async function startBorderConnectSyncWorker() {
  console.log("🚀 [BorderConnect Sync] Worker started");

  setInterval(async () => {
    try {
      await pollAllManifestAcknowledgments();
    } catch (err) {
      console.error("[BorderConnect Sync] Worker poll error:", err.message);
    }
  }, 5 * 60 * 1000);

  setInterval(async () => {
    try {
      await bulkTransmitDraftManifests();
    } catch (err) {
      console.error("[BorderConnect Sync] Worker transmit error:", err.message);
    }
  }, 10 * 60 * 1000);
}

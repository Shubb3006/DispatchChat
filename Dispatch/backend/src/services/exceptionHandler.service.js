import pool from "../config/db.js";

/**
 * Exception Handler — Autonomous exception detection & remediation
 *
 * Runs after load creation to identify blocking issues:
 * - HOS violations (driver doesn't have sufficient duty time)
 * - Capacity violations (load weight > truck GVWR)
 * - Geofence violations (can't reach destination in required time)
 * - Missing documents (cross-border without customs entry)
 * - Equipment unavailable (no trucks matching requirements)
 *
 * For each exception: severity → auto-action → remediation suggestion
 */

// Exception severity levels
const SEVERITY = {
  INFO: "info",           // Informational only
  WARNING: "warning",     // Flag but don't block
  CRITICAL: "critical",   // Block dispatch, manual intervention required
};

// Exception types
const EXCEPTION_TYPES = {
  HOS_VIOLATION: "hos_violation",
  CAPACITY_VIOLATION: "capacity_violation",
  GEOFENCE_VIOLATION: "geofence_violation",
  MISSING_DOCUMENTS: "missing_documents",
  NO_EQUIPMENT: "no_equipment",
  CUSTOMS_HOLD: "customs_hold",
  RATE_VERIFICATION: "rate_verification",
};

/**
 * Ensure exceptions table exists (auto-migrate)
 */
export async function ensureExceptionsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exceptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
        exception_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL DEFAULT 'warning',
        title VARCHAR(255) NOT NULL,
        description TEXT,
        affected_field VARCHAR(100),
        current_value VARCHAR(255),
        threshold_value VARCHAR(255),
        suggested_remedy TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'open',
        resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
        resolved_at TIMESTAMP WITH TIME ZONE,
        detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_exceptions_load_id ON exceptions(load_id);
      CREATE INDEX IF NOT EXISTS idx_exceptions_type ON exceptions(exception_type);
      CREATE INDEX IF NOT EXISTS idx_exceptions_severity ON exceptions(severity);
      CREATE INDEX IF NOT EXISTS idx_exceptions_status ON exceptions(status);
      CREATE INDEX IF NOT EXISTS idx_exceptions_detected_at ON exceptions(detected_at DESC);
    `);
  } catch (err) {
    if (!err.message.includes("already exists")) {
      console.warn("[Exception Handler] Table ensure error:", err.message);
    }
  }
}

/**
 * Check HOS violations — driver has insufficient duty time
 */
export async function checkHosViolation(loadId, driverId, pickupDate, deliveryDate) {
  try {
    if (!driverId) return null;

    const pickupTime = new Date(pickupDate);
    const deliveryTime = new Date(deliveryDate);
    const hoursNeeded = (deliveryTime - pickupTime) / (1000 * 60 * 60);

    // Get driver's recent HOS logs
    const hosResult = await pool.query(
      `SELECT
        SUM(CASE WHEN current_status = 'Driving' THEN duration_hours ELSE 0 END) as drive_hours,
        SUM(CASE WHEN current_status = 'On-Duty' THEN duration_hours ELSE 0 END) as duty_hours,
        MAX(log_date) as last_update
      FROM hos_logs
      WHERE driver_id = $1 AND log_date >= NOW() - INTERVAL '7 days'`,
      [driverId]
    );

    const hosData = hosResult.rows[0] || {};
    const driveHoursUsed = parseFloat(hosData.drive_hours || 0);
    const availableDriveHours = 11 - driveHoursUsed;

    if (availableDriveHours < hoursNeeded) {
      return {
        type: EXCEPTION_TYPES.HOS_VIOLATION,
        severity: SEVERITY.CRITICAL,
        title: "Driver HOS Violation",
        description: `Driver needs ${hoursNeeded.toFixed(1)} driving hours but only has ${availableDriveHours.toFixed(1)} available this cycle.`,
        affected_field: "driver_id",
        current_value: `${availableDriveHours.toFixed(1)} hours available`,
        threshold_value: `${hoursNeeded.toFixed(1)} hours required`,
        suggested_remedy: `Assign different driver or delay load pickup by ${(hoursNeeded - availableDriveHours).toFixed(1)} hours.`,
      };
    }

    return null;
  } catch (err) {
    console.error("[Exception Handler] HOS check error:", err.message);
    return null;
  }
}

/**
 * Check capacity violations — load weight > truck GVWR
 */
export async function checkCapacityViolation(loadId, truckId, loadWeight) {
  try {
    if (!truckId || !loadWeight) return null;

    const truckResult = await pool.query(
      `SELECT gvwr, capacity_dry_van FROM trucks WHERE id = $1`,
      [truckId]
    );

    const truck = truckResult.rows[0];
    if (!truck) return null;

    const maxWeight = truck.gvwr || truck.capacity_dry_van || 40000;
    const weightLbs = parseFloat(loadWeight);

    if (weightLbs > maxWeight) {
      return {
        type: EXCEPTION_TYPES.CAPACITY_VIOLATION,
        severity: SEVERITY.CRITICAL,
        title: "Truck Capacity Exceeded",
        description: `Load weight (${weightLbs.toLocaleString()} lbs) exceeds truck GVWR (${maxWeight.toLocaleString()} lbs).`,
        affected_field: "weight",
        current_value: `${weightLbs.toLocaleString()} lbs`,
        threshold_value: `${maxWeight.toLocaleString()} lbs (GVWR)`,
        suggested_remedy: "Assign heavier truck or split load across multiple shipments.",
      };
    }

    return null;
  } catch (err) {
    console.error("[Exception Handler] Capacity check error:", err.message);
    return null;
  }
}

/**
 * Check geofence violations — can't reach destination in time window
 */
export async function checkGeofenceViolation(loadId, pickupDate, deliveryDate, destinationCity) {
  try {
    const pickupTime = new Date(pickupDate);
    const deliveryTime = new Date(deliveryDate);
    const availableHours = (deliveryTime - pickupTime) / (1000 * 60 * 60);

    // Average trucking speed: 55 mph, assume 1300 miles typical cross-border
    const estimatedMiles = 1300;
    const drivingHours = estimatedMiles / 55;
    const bufferHours = 4; // Dwell + border crossing
    const totalHoursNeeded = drivingHours + bufferHours;

    if (availableHours < totalHoursNeeded) {
      return {
        type: EXCEPTION_TYPES.GEOFENCE_VIOLATION,
        severity: SEVERITY.WARNING,
        title: "Tight Geofence Window",
        description: `Load requires ~${totalHoursNeeded.toFixed(1)} hours (${drivingHours.toFixed(1)}h drive + ${bufferHours}h buffer), but only ${availableHours.toFixed(1)} hours available.`,
        affected_field: "delivery_date",
        current_value: `${availableHours.toFixed(1)} hours available`,
        threshold_value: `${totalHoursNeeded.toFixed(1)} hours needed`,
        suggested_remedy: "Extend delivery window or pre-position equipment at pickup.",
      };
    }

    return null;
  } catch (err) {
    console.error("[Exception Handler] Geofence check error:", err.message);
    return null;
  }
}

/**
 * Check missing documents — cross-border without customs entry
 */
export async function checkMissingDocuments(loadId, isCrossBorder, shipper_country, consignee_country) {
  try {
    if (!isCrossBorder) return null;

    const customsResult = await pool.query(
      `SELECT id, customs_status FROM customs_entries WHERE load_id = $1 LIMIT 1`,
      [loadId]
    );

    if (customsResult.rows.length === 0) {
      return {
        type: EXCEPTION_TYPES.MISSING_DOCUMENTS,
        severity: SEVERITY.CRITICAL,
        title: "Missing Customs Entry",
        description: `Cross-border shipment (${shipper_country} → ${consignee_country}) has no customs entry created.`,
        affected_field: "customs_entries",
        current_value: "None",
        threshold_value: "Customs entry required",
        suggested_remedy: "Create customs entry with CBP/CBSA before dispatch.",
      };
    }

    return null;
  } catch (err) {
    console.error("[Exception Handler] Documents check error:", err.message);
    return null;
  }
}

/**
 * Main exception detection: run all checks, return array of exceptions
 */
export async function detectLoadExceptions({
  loadId,
  load = {},
}) {
  try {
    await ensureExceptionsTable();

    const exceptions = [];

    // Check HOS
    const hosEx = await checkHosViolation(
      loadId,
      load.driver_id,
      load.pickup_date,
      load.delivery_date
    );
    if (hosEx) exceptions.push(hosEx);

    // Check Capacity
    const capEx = await checkCapacityViolation(loadId, load.truck_id, load.weight);
    if (capEx) exceptions.push(capEx);

    // Check Geofence
    const geoEx = await checkGeofenceViolation(
      loadId,
      load.pickup_date,
      load.delivery_date,
      load.consignee_city
    );
    if (geoEx) exceptions.push(geoEx);

    // Check Documents (cross-border)
    const docEx = await checkMissingDocuments(
      loadId,
      load.shipper_country !== load.consignee_country,
      load.shipper_country,
      load.consignee_country
    );
    if (docEx) exceptions.push(docEx);

    return exceptions;
  } catch (err) {
    console.error("[Exception Handler] Detection error:", err.message);
    return [];
  }
}

/**
 * Persist exceptions to database
 */
export async function persistExceptions(loadId, exceptions) {
  try {
    for (const ex of exceptions) {
      await pool.query(
        `INSERT INTO exceptions (
          load_id, exception_type, severity, title, description,
          affected_field, current_value, threshold_value, suggested_remedy, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open')`,
        [
          loadId,
          ex.type,
          ex.severity,
          ex.title,
          ex.description,
          ex.affected_field,
          ex.current_value,
          ex.threshold_value,
          ex.suggested_remedy,
        ]
      );
    }

    console.log(`   ⚠️ [Exception Handler] Persisted ${exceptions.length} exception(s) for load ${loadId}`);
    return exceptions.length;
  } catch (err) {
    console.error("[Exception Handler] Persist error:", err.message);
    return 0;
  }
}

/**
 * Get active exceptions for a load
 */
export async function getLoadExceptions(loadId, status = "open") {
  try {
    const result = await pool.query(
      `SELECT * FROM exceptions WHERE load_id = $1 AND status = $2 ORDER BY severity DESC, detected_at DESC`,
      [loadId, status]
    );
    return result.rows;
  } catch (err) {
    console.error("[Exception Handler] Fetch error:", err.message);
    return [];
  }
}

/**
 * Resolve an exception (mark as fixed/resolved)
 */
export async function resolveException(exceptionId, resolvedBy = null) {
  try {
    const result = await pool.query(
      `UPDATE exceptions SET status = 'resolved', resolved_by = $1, resolved_at = NOW() WHERE id = $2 RETURNING *`,
      [resolvedBy, exceptionId]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error("[Exception Handler] Resolve error:", err.message);
    return null;
  }
}

/**
 * Dispatch decision helper: should this load be allowed to dispatch?
 * Returns { allowed: boolean, reason: string }
 */
export async function canDispatchLoad(loadId) {
  try {
    const exceptions = await getLoadExceptions(loadId, "open");
    const criticalCount = exceptions.filter((e) => e.severity === SEVERITY.CRITICAL).length;

    if (criticalCount > 0) {
      return {
        allowed: false,
        reason: `${criticalCount} critical exception(s) must be resolved before dispatch.`,
        exceptions,
      };
    }

    return { allowed: true, reason: "No blocking exceptions", exceptions };
  } catch (err) {
    console.error("[Exception Handler] Dispatch check error:", err.message);
    return { allowed: false, reason: "Exception check failed", exceptions: [] };
  }
}

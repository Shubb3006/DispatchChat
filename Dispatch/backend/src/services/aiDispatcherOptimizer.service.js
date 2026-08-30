import pool from "../config/db.js";
import { getVehicleLocations } from "./samsara.service.js";
import { geocodeLocation } from "./geocoding.service.js";
import { findLoadByIdOrNumber, isUuid, updateLoadStatus } from "./loadStatus.service.js";

/**
 * AI Smart Driver-Load Matcher & Dispatch Optimizer Service
 *
 * Every factor is computed from real data or omitted — nothing is fabricated:
 *   - proximity:    live Samsara GPS position vs geocoded pickup coordinates
 *   - hos:          live Samsara HOS clocks (drive remaining)
 *   - cross_border: drivers.fast_id / travel_doc_number / license_expiry
 *                   (only weighted when the load actually crosses the border)
 *   - performance:  on-time ratio from the driver's delivered loads
 *                   (delivered_at vs scheduled delivery_date)
 *   - equipment:    EXCLUDED — the loads table carries no equipment
 *                   requirement column, so there is nothing real to compare
 *                   against (drivers/trucks/trailers types exist, but a match
 *                   score needs both sides).
 *
 * Factors a driver legitimately lacks (no live position, no delivery history)
 * are omitted from that driver's breakdown and the remaining weights are
 * renormalized, so scores stay comparable and honest.
 */

const MATCH_LIMIT = parseInt(process.env.AI_MATCH_LIMIT || "15", 10);
const DRIVER_POOL_LIMIT = parseInt(process.env.AI_MATCH_DRIVER_POOL || "60", 10);
const ONTIME_GRACE_MINUTES = parseInt(process.env.AI_MATCH_ONTIME_GRACE_MINUTES || "0", 10);
const AVG_HIGHWAY_MPH = Number(process.env.AI_MATCH_AVG_MPH || 50);

// Base weights (equipment intentionally absent — see header note). When a
// factor cannot be computed for a driver, the remaining weights renormalize.
const FACTOR_WEIGHTS = {
  proximity: 0.35,
  hos: 0.3,
  cross_border: 0.1,
  performance: 0.1,
};

const FACTOR_SOURCES = {
  proximity: "live Samsara GPS position vs pickup coordinates from geocoding.service",
  hos: "live Samsara HOS clocks (drive remaining)",
  cross_border: "drivers table: fast_id, travel_doc_number, license_expiry",
  performance: "loads history: delivered_at vs scheduled delivery_date",
};

const INACTIVE_DRIVER_STATUSES = ["OUT_OF_SERVICE", "INACTIVE", "TERMINATED", "SUSPENDED"];

const CA_PROVINCES = new Set(["ON", "QC", "BC", "AB", "MB", "SK", "NS", "NB", "NL", "PE", "YT", "NT", "NU"]);
const US_STATES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS",
  "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY",
  "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV",
  "WI", "WY", "DC",
]);

function haversineMiles(lat1, lon1, lat2, lon2) {
  const nums = [lat1, lon1, lat2, lon2].map(Number);
  if (!nums.every((v) => Number.isFinite(v))) return null;
  const [aLat, aLon, bLat, bLon] = nums;
  const R = 3958.8;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // 1.18 road-vs-straight-line factor (kept from the original implementation)
  return Math.round(R * c * 1.18);
}

/**
 * Geocode a free-text place via geocoding.service (which keeps its own
 * in-memory cache). Returns null instead of the service's generic placeholder
 * so callers never mistake "unknown" for a real position.
 */
async function geocodePlace(text) {
  const query = String(text || "").trim();
  if (!query) return null;
  try {
    const geo = await geocodeLocation(query);
    if (!geo || !Number.isFinite(Number(geo.lat)) || !Number.isFinite(Number(geo.lng))) return null;
    if (typeof geo.address === "string" && geo.address.endsWith("Commercial Logistics Zone")) {
      // geocoding.service's graceful fallback — not a real geocode result.
      return null;
    }
    return geo;
  } catch (err) {
    console.warn(`geocodePlace("${query}") warning:`, err.message);
    return null;
  }
}

function countryOfRegion(code) {
  const c = String(code || "").toUpperCase().trim();
  if (CA_PROVINCES.has(c)) return "CA";
  if (US_STATES.has(c)) return "US";
  return null;
}

/** Infer CA/US from a geocode result's state code, falling back to the raw text. */
function inferCountry(text, geo) {
  const fromGeo = countryOfRegion(geo?.state);
  if (fromGeo) return fromGeo;
  const raw = String(text || "");
  const tokens = (raw.toUpperCase().match(/\b[A-Z]{2}\b/g) || []).reverse();
  for (const token of tokens) {
    const c = countryOfRegion(token);
    if (c) return c;
  }
  if (/\bCANADA\b/i.test(raw)) return "CA";
  if (/\bUNITED STATES\b|\bUSA?\b/i.test(raw)) return "US";
  return null;
}

const normalizeUnit = (v) => String(v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const digitsOnly = (v) => String(v ?? "").replace(/[^0-9]/g, "");

let assignmentColumnsEnsured = false;

/**
 * Lazily apply migrations 125/126 (plus the driver compliance columns from
 * migration 020 that the matcher reads) so the feature works on next boot
 * without a manual migration step — the codebase convention.
 */
export async function ensureAssignmentColumns() {
  if (assignmentColumnsEnsured) return;
  try {
    await pool.query(`
      ALTER TABLE loads ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL;
      ALTER TABLE loads ADD COLUMN IF NOT EXISTS truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL;
      ALTER TABLE loads ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
      CREATE INDEX IF NOT EXISTS idx_loads_driver_id ON loads(driver_id);
      CREATE INDEX IF NOT EXISTS idx_loads_driver_delivered
        ON loads (driver_id, delivered_at)
        WHERE delivered_at IS NOT NULL AND delivery_date IS NOT NULL;
      ALTER TABLE drivers ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
      ALTER TABLE drivers ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
      ALTER TABLE drivers ADD COLUMN IF NOT EXISTS fast_id VARCHAR(100);
      ALTER TABLE drivers ADD COLUMN IF NOT EXISTS travel_doc_number VARCHAR(100);
    `);
    assignmentColumnsEnsured = true;
  } catch (err) {
    console.warn("assignment columns verification warning:", err.message);
  }
}

/** Index live Samsara vehicles for matching against DB driver rows. */
function buildVehicleIndexes(vehicles) {
  const byTruck = new Map();
  const byTruckDigits = new Map();
  const byDriverName = new Map();
  const byDriverId = new Map();
  for (const veh of vehicles) {
    const norm = normalizeUnit(veh.truck_number);
    if (norm && !byTruck.has(norm)) byTruck.set(norm, veh);
    const digits = digitsOnly(veh.truck_number);
    if (digits && !byTruckDigits.has(digits)) byTruckDigits.set(digits, veh);
    const name = String(veh.driver?.name || "").trim().toLowerCase();
    if (name && name !== "assigned driver" && !byDriverName.has(name)) byDriverName.set(name, veh);
    const samsaraDriverId = veh.driver?.id != null ? String(veh.driver.id) : "";
    if (samsaraDriverId && !byDriverId.has(samsaraDriverId)) byDriverId.set(samsaraDriverId, veh);
  }
  return { byTruck, byTruckDigits, byDriverName, byDriverId };
}

function matchVehicleForDriver(driverRow, indexes) {
  const truckNorm = normalizeUnit(driverRow.assigned_truck_number);
  if (truckNorm && indexes.byTruck.has(truckNorm)) return indexes.byTruck.get(truckNorm);
  const truckDigits = digitsOnly(driverRow.assigned_truck_number);
  if (truckDigits && indexes.byTruckDigits.has(truckDigits)) return indexes.byTruckDigits.get(truckDigits);
  if (driverRow.eld_id && indexes.byDriverId.has(String(driverRow.eld_id))) {
    return indexes.byDriverId.get(String(driverRow.eld_id));
  }
  const fullName = [driverRow.first_name, driverRow.last_name].filter(Boolean).join(" ").trim().toLowerCase();
  if (fullName && indexes.byDriverName.has(fullName)) return indexes.byDriverName.get(fullName);
  return null;
}

function displayName(row) {
  const fullName = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
  return fullName || row.full_name || row.username || row.driver_code || "Driver";
}

/**
 * AI Smart Driver-Load Matcher Engine.
 *
 * @param {string} loadId - loads.id (uuid) or loads.load_number
 * @returns {{ok:true, matches:[...], factors_used:[...]}} | {ok:false, error}
 */
export async function rankDriversForLoad(loadId) {
  if (!loadId) return { ok: false, error: "load_id_required" };

  // Never fabricate positions: without a configured Samsara token there is no
  // live GPS/HOS source, so say so instead of inventing a fleet.
  if (!String(process.env.SAMSARA_API_TOKEN || "").trim()) {
    return { ok: false, error: "samsara_not_configured" };
  }

  await ensureAssignmentColumns();

  const load = await findLoadByIdOrNumber(loadId);
  if (!load) return { ok: false, error: "not_found" };

  // Live fleet telematics (samsara.service caches for a few seconds).
  let fleet;
  try {
    fleet = await getVehicleLocations();
  } catch (err) {
    console.error("Samsara fleet fetch failed:", err.message);
    return { ok: false, error: "samsara_unavailable" };
  }
  const vehicles = Array.isArray(fleet?.vehicles) ? fleet.vehicles : [];
  const indexes = buildVehicleIndexes(vehicles);

  // Pickup / destination coordinates via geocoding.service (in-memory cached).
  const originText = String(load.origin || load.shipper_address || "").trim();
  const destText = String(load.destination || load.consignee_address || "").trim();
  const originGeo = await geocodePlace(originText);
  const destGeo = await geocodePlace(destText);

  const originCountry = inferCountry(originText, originGeo);
  const destCountry = inferCountry(destText, destGeo);
  const isCrossBorder = Boolean(originCountry && destCountry && originCountry !== destCountry);

  const tripMiles = originGeo && destGeo
    ? haversineMiles(originGeo.lat, originGeo.lng, destGeo.lat, destGeo.lng)
    : null;
  const tripDriveHours = tripMiles != null ? Math.round((tripMiles / AVG_HIGHWAY_MPH) * 10) / 10 : null;

  // Active driver pool from the real drivers table.
  const driversRes = await pool.query(
    `SELECT d.id, d.driver_code, d.status, d.first_name, d.last_name,
            d.assigned_truck_number, d.eld_id,
            d.fast_id, d.travel_doc_number, d.license_expiry,
            u.username, u.full_name
       FROM drivers d
       LEFT JOIN users u ON u.id = d.user_id
      WHERE COALESCE(UPPER(d.status), 'AVAILABLE') <> ALL($1)
      ORDER BY d.created_at ASC
      LIMIT $2`,
    [INACTIVE_DRIVER_STATUSES, DRIVER_POOL_LIMIT]
  );

  // On-time delivery history for the whole pool in one grouped query.
  const driverIds = driversRes.rows.map((d) => d.id);
  const historyByDriver = new Map();
  if (driverIds.length > 0) {
    try {
      const hist = await pool.query(
        `SELECT driver_id,
                COUNT(*)::int AS delivered_count,
                SUM(CASE WHEN delivered_at <= delivery_date + make_interval(mins => $2::int)
                         THEN 1 ELSE 0 END)::int AS on_time_count
           FROM loads
          WHERE driver_id = ANY($1::uuid[])
            AND delivered_at IS NOT NULL
            AND delivery_date IS NOT NULL
          GROUP BY driver_id`,
        [driverIds, ONTIME_GRACE_MINUTES]
      );
      hist.rows.forEach((row) => historyByDriver.set(String(row.driver_id), row));
    } catch (err) {
      console.warn("driver performance history query warning:", err.message);
    }
  }

  const matches = driversRes.rows.map((d) => {
    const veh = matchVehicleForDriver(d, indexes);
    const hasPosition = Boolean(
      veh && Number.isFinite(Number(veh.latitude)) && Number.isFinite(Number(veh.longitude))
    );

    const breakdown = {};
    const weights = {};

    // 1) Proximity — live GPS vs geocoded pickup. Omitted (never faked) when
    //    Samsara has no position for this driver's truck or the pickup could
    //    not be geocoded.
    let deadheadMiles = null;
    if (hasPosition && originGeo) {
      deadheadMiles = haversineMiles(veh.latitude, veh.longitude, originGeo.lat, originGeo.lng);
      if (deadheadMiles != null) {
        breakdown.proximity = Math.max(0, Math.min(100, Math.round(100 - (deadheadMiles / 120) * 100)));
        weights.proximity = FACTOR_WEIGHTS.proximity;
      }
    }

    // 2) HOS — live Samsara clocks (existing scoring logic preserved).
    let hosRemainingHours = null;
    if (veh?.driver && Number.isFinite(Number(veh.driver.hos_drive_hours_num))) {
      const driveRemaining = Number(veh.driver.hos_drive_hours_num);
      hosRemainingHours = driveRemaining;
      let hosScore = 100;
      if (driveRemaining < 4) hosScore -= 90; // not rest compliant (-40) + low clock (-50)
      else if (driveRemaining < 7) hosScore -= 20;
      if (tripDriveHours != null && driveRemaining < Math.min(8, tripDriveHours)) hosScore -= 15;
      breakdown.hos = Math.max(10, Math.min(100, hosScore));
      weights.hos = FACTOR_WEIGHTS.hos;
    }

    // 3) Cross-border readiness — real compliance fields on the drivers row,
    //    weighted only when the load actually crosses the border.
    if (isCrossBorder) {
      let cb = 0;
      if (String(d.fast_id || "").trim()) cb += 40;
      if (String(d.travel_doc_number || "").trim()) cb += 35;
      if (d.license_expiry && new Date(d.license_expiry).getTime() >= Date.now()) cb += 25;
      breakdown.cross_border = cb;
      weights.cross_border = FACTOR_WEIGHTS.cross_border;
    }

    // 4) Performance — on-time ratio from this driver's delivered loads.
    //    Drivers with no delivery history have the factor omitted.
    const hist = historyByDriver.get(String(d.id));
    if (hist && hist.delivered_count > 0) {
      breakdown.performance = Math.round((hist.on_time_count / hist.delivered_count) * 100);
      weights.performance = FACTOR_WEIGHTS.performance;
    }

    // Weighted score over the factors that were actually computed.
    const weightSum = Object.values(weights).reduce((sum, w) => sum + w, 0);
    const score = weightSum > 0
      ? Math.round(
          Object.keys(weights).reduce((sum, key) => sum + breakdown[key] * weights[key], 0) / weightSum
        )
      : 0;

    const entry = {
      driver_id: d.id,
      driver_name: displayName(d),
      truck_number: veh?.truck_number || d.assigned_truck_number || null,
      score,
      breakdown,
      deadhead_miles: deadheadMiles,
      hos_remaining_hours: hosRemainingHours,
    };
    if (hasPosition) {
      entry.current_location = {
        lat: veh.latitude,
        lng: veh.longitude,
        description: veh.location_description || null,
      };
    } else {
      entry.position_unknown = true;
    }
    return entry;
  });

  matches.sort((a, b) => b.score - a.score);
  const top = matches.slice(0, MATCH_LIMIT);

  const factorsUsed = Object.keys(FACTOR_WEIGHTS).filter((factor) =>
    top.some((m) => m.breakdown[factor] !== undefined)
  );
  const factorSources = {};
  factorsUsed.forEach((factor) => {
    factorSources[factor] = FACTOR_SOURCES[factor];
  });

  const excludedFactors = [
    {
      factor: "equipment",
      reason: "loads table has no equipment requirement column — excluded instead of faking a score",
    },
  ];
  if (!isCrossBorder) {
    excludedFactors.push({
      factor: "cross_border",
      reason: "load not detected as cross-border",
    });
  }

  return {
    ok: true,
    matches: top,
    factors_used: factorsUsed,
    factor_sources: factorSources,
    excluded_factors: excludedFactors,
    load: {
      id: load.id,
      load_number: load.load_number || null,
      origin: originText || null,
      destination: destText || null,
      is_cross_border: isCrossBorder,
      estimated_trip_miles: tripMiles,
      pickup_geocoded: Boolean(originGeo),
    },
  };
}

/**
 * 1-Click Auto-Assign: validates the driver, writes the real assignment
 * columns (loads.driver_id / truck_id / assigned_at), and transitions status
 * through loadStatus.service — THE single status choke point.
 *
 * @returns {{ok:true, assignment:{...}}} | {ok:false, error}
 */
export async function autoAssignDriverToLoad(loadId, driverId, { actor = null, req = null } = {}) {
  if (!loadId || !driverId) return { ok: false, error: "load_id_and_driver_id_required" };

  await ensureAssignmentColumns();

  const load = await findLoadByIdOrNumber(loadId);
  if (!load) return { ok: false, error: "load_not_found" };

  const driverKey = String(driverId).trim();
  const driverRes = isUuid(driverKey)
    ? await pool.query(
        `SELECT d.*, u.username, u.full_name
           FROM drivers d LEFT JOIN users u ON u.id = d.user_id
          WHERE d.id = $1`,
        [driverKey]
      )
    : await pool.query(
        `SELECT d.*, u.username, u.full_name
           FROM drivers d LEFT JOIN users u ON u.id = d.user_id
          WHERE d.driver_code = $1`,
        [driverKey]
      );
  const driver = driverRes.rows[0];
  if (!driver) return { ok: false, error: "driver_not_found" };

  const driverStatus = String(driver.status || "AVAILABLE").toUpperCase();
  if (INACTIVE_DRIVER_STATUSES.includes(driverStatus)) {
    return { ok: false, error: "driver_not_active" };
  }

  // Resolve the driver's assigned tractor to a trucks row when possible.
  let truckId = null;
  let truckNumber = driver.assigned_truck_number || null;
  if (driver.assigned_truck_number) {
    try {
      const norm = normalizeUnit(driver.assigned_truck_number);
      const digits = digitsOnly(driver.assigned_truck_number);
      const truckRes = await pool.query(
        `SELECT id, truck_number FROM trucks
          WHERE UPPER(regexp_replace(truck_number, '[^A-Za-z0-9]', '', 'g')) = $1
             OR ($2 <> '' AND regexp_replace(truck_number, '[^0-9]', '', 'g') = $2)
          ORDER BY (UPPER(regexp_replace(truck_number, '[^A-Za-z0-9]', '', 'g')) = $1) DESC
          LIMIT 1`,
        [norm, digits]
      );
      if (truckRes.rows[0]) {
        truckId = truckRes.rows[0].id;
        truckNumber = truckRes.rows[0].truck_number;
      }
    } catch (err) {
      console.warn("auto-assign truck lookup warning:", err.message);
    }
  }

  const assignRes = await pool.query(
    `UPDATE loads
        SET driver_id = $1,
            truck_id = $2,
            assigned_at = NOW()
      WHERE id = $3
      RETURNING id, load_number, driver_id, truck_id, assigned_at`,
    [driver.id, truckId, load.id]
  );
  const assigned = assignRes.rows[0];
  if (!assigned) return { ok: false, error: "assignment_failed" };

  // Status transition through the single choke point (audit log, trip
  // cascade, customer milestone handling all live there).
  const transition = await updateLoadStatus(load.id, "dispatched", {
    actor,
    req,
    source: "auto_assign",
    meta: {
      driver_id: driver.id,
      truck_id: truckId,
      truck_number: truckNumber,
      auto_assign: true,
    },
  });
  if (!transition.ok) {
    return { ok: false, error: transition.error || "status_transition_failed" };
  }

  return {
    ok: true,
    assignment: {
      load_id: assigned.id,
      load_number: assigned.load_number || null,
      driver_id: driver.id,
      driver_name: displayName(driver),
      truck_id: truckId,
      truck_number: truckNumber,
      status: transition.load?.status || "dispatched",
      assigned_at: assigned.assigned_at,
    },
  };
}

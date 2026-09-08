import pool from "../config/db.js";
import { geocodeLocation } from "./geocoding.service.js";

/**
 * geofence.service — real geofence persistence + math for the geofence worker.
 *
 * Tables (mirrors databases/120_geofence_events.sql, 121_load_stops_add_timestamps.sql,
 * 124_load_stops_add_indexes.sql) are self-ensured on boot so production
 * self-migrates without a manual migration step — same pattern as
 * auditLogger.service.js / invoice.controller.js.
 *
 * No fixture data anywhere: every read is a SQL query, every alert row comes
 * from geofence_events, and empty tables return empty arrays.
 */

// ---------------------------------------------------------------------------
// Schema ensure (CREATE TABLE IF NOT EXISTS pattern)
// ---------------------------------------------------------------------------

let geofenceTablesEnsured = false;

export async function ensureGeofenceTables() {
  if (geofenceTablesEnsured) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS geofence_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
        stop_id UUID REFERENCES load_stops(id) ON DELETE SET NULL,
        truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
        driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
        event_type TEXT NOT NULL CHECK (event_type IN ('enter', 'exit')),
        lat NUMERIC(10, 7) NOT NULL,
        lng NUMERIC(10, 7) NOT NULL,
        distance_m INT NOT NULL DEFAULT 0,
        occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        meta JSONB DEFAULT '{}'::jsonb
      );
      CREATE INDEX IF NOT EXISTS idx_geofence_events_load_id ON geofence_events(load_id);
      CREATE INDEX IF NOT EXISTS idx_geofence_events_stop_id ON geofence_events(stop_id);
      CREATE INDEX IF NOT EXISTS idx_geofence_events_truck_id ON geofence_events(truck_id);
      CREATE INDEX IF NOT EXISTS idx_geofence_events_occurred_at ON geofence_events(occurred_at DESC);

      ALTER TABLE load_stops ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMP;
      ALTER TABLE load_stops ADD COLUMN IF NOT EXISTS departed_at TIMESTAMP;
      ALTER TABLE load_stops ADD COLUMN IF NOT EXISTS lat NUMERIC(10, 7);
      ALTER TABLE load_stops ADD COLUMN IF NOT EXISTS lng NUMERIC(10, 7);
      CREATE INDEX IF NOT EXISTS idx_load_stops_arrived_at ON load_stops(arrived_at);
      CREATE INDEX IF NOT EXISTS idx_load_stops_departed_at ON load_stops(departed_at);
    `);
    geofenceTablesEnsured = true;
  } catch (err) {
    console.warn("Geofence tables verification warning:", err.message);
  }
}

// ---------------------------------------------------------------------------
// Real geofence math
// ---------------------------------------------------------------------------

const EARTH_RADIUS_M = 6371000;

/** Great-circle distance between two WGS84 points, in meters. */
export function haversineDistanceM(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (Number(deg) * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

// ---------------------------------------------------------------------------
// Loads & stops
// ---------------------------------------------------------------------------

// Lifecycle statuses that mean "a truck is (or should be) rolling this load".
const ACTIVE_LOAD_STATUSES = [
  "pickup_assigned",
  "dispatched",
  "at_warehouse",
  "picked_up",
  "in_transit",
];

/**
 * Loads worth geofencing: an assigned truck and an active lifecycle status.
 * truck_number is joined from trucks so the worker can match against the
 * Samsara fleet by unit number.
 */
export async function getActiveLoads() {
  const result = await pool.query(
    `
    SELECT l.*, t.truck_number
    FROM loads l
    JOIN trucks t ON l.truck_id = t.id
    WHERE l.truck_id IS NOT NULL
      AND REPLACE(REPLACE(LOWER(TRIM(COALESCE(l.status, ''))), ' ', '_'), '-', '_') = ANY($1)
    ORDER BY l.created_at DESC
    `,
    [ACTIVE_LOAD_STATUSES]
  );
  return result.rows;
}

/** All stops of a load in route order (lat/lng included once geocoded). */
export async function getLoadStops(loadId) {
  const result = await pool.query(
    `
    SELECT id, load_id, stop_order, company_name, address, city, state, zip,
           stop_type, arrival_time, departure_time, arrived_at, departed_at, lat, lng
    FROM load_stops
    WHERE load_id = $1
    ORDER BY stop_order ASC NULLS LAST, id ASC
    `,
    [loadId]
  );
  return result.rows;
}

// Stops whose address could not be geocoded this process lifetime — skipped on
// later cycles so the worker doesn't hammer the geocoder every few minutes.
const ungeocodableStops = new Set();

const cleanPart = (v) => String(v ?? "").trim();

/** Detect geocoding.service's "graceful fallback" result — never persist it. */
function isFallbackGeocode(geo) {
  return Boolean(geo?.address && String(geo.address).includes("Commercial Logistics Zone"));
}

/**
 * Geocode this load's stops that are missing lat/lng and persist the result on
 * load_stops so it only ever happens once per stop. Stops with no usable
 * address, or whose geocode falls back to a generic default, are left NULL —
 * a stop without real coordinates is excluded from geofencing rather than
 * fenced around a fabricated point.
 *
 * @returns {number} how many stops were geocoded and persisted
 */
export async function geocodeLoadStops(loadId) {
  await ensureGeofenceTables();

  const pending = await pool.query(
    `
    SELECT id, company_name, address, city, state, zip
    FROM load_stops
    WHERE load_id = $1 AND (lat IS NULL OR lng IS NULL)
    `,
    [loadId]
  );

  let updated = 0;
  for (const stop of pending.rows) {
    if (ungeocodableStops.has(stop.id)) continue;

    const query = [cleanPart(stop.address), cleanPart(stop.city), cleanPart(stop.state), cleanPart(stop.zip)]
      .filter(Boolean)
      .join(", ");
    if (!query) {
      ungeocodableStops.add(stop.id);
      continue;
    }

    try {
      const geo = await geocodeLocation(query);
      const lat = Number(geo?.lat);
      const lng = Number(geo?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || isFallbackGeocode(geo)) {
        ungeocodableStops.add(stop.id);
        continue;
      }
      await pool.query(
        `UPDATE load_stops SET lat = $1, lng = $2 WHERE id = $3 AND (lat IS NULL OR lng IS NULL)`,
        [lat, lng, stop.id]
      );
      updated++;
    } catch (err) {
      console.warn(`Geocode failed for load_stop ${stop.id}:`, err.message);
      ungeocodableStops.add(stop.id);
    }
  }
  return updated;
}

// ---------------------------------------------------------------------------
// Geofence event log (hysteresis source of truth)
// ---------------------------------------------------------------------------

/** Most recent geofence event for a load/stop pair — enter/exit hysteresis. */
export async function getLastGeofenceEvent(loadId, stopId) {
  const result = await pool.query(
    `
    SELECT * FROM geofence_events
    WHERE load_id = $1 AND stop_id = $2
    ORDER BY occurred_at DESC, created_at DESC
    LIMIT 1
    `,
    [loadId, stopId]
  );
  return result.rows[0] || null;
}

/** Persist one enter/exit event. Returns the inserted row. */
export async function recordGeofenceEvent({
  loadId,
  stopId = null,
  truckId = null,
  driverId = null,
  eventType,
  lat,
  lng,
  distanceM = 0,
  occurredAt = new Date(),
  meta = {},
}) {
  const result = await pool.query(
    `
    INSERT INTO geofence_events
      (load_id, stop_id, truck_id, driver_id, event_type, lat, lng, distance_m, occurred_at, meta)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
    RETURNING *
    `,
    [
      loadId,
      stopId,
      truckId,
      driverId,
      eventType,
      lat,
      lng,
      Math.max(0, Math.round(Number(distanceM) || 0)),
      occurredAt,
      JSON.stringify(meta || {}),
    ]
  );
  return result.rows[0];
}

// ---------------------------------------------------------------------------
// Stop arrival/departure stamps
// ---------------------------------------------------------------------------

/**
 * Stamp actual arrival (first enter wins — COALESCE keeps the original time on
 * a re-entry). arrival_time/departure_time are the *scheduled* appointment
 * columns and are never touched.
 */
export async function stampStopArrival(stopId, arrivedAt = new Date()) {
  const result = await pool.query(
    `UPDATE load_stops SET arrived_at = COALESCE(arrived_at, $2) WHERE id = $1 RETURNING id, arrived_at`,
    [stopId, arrivedAt]
  );
  return result.rows[0] || null;
}

/** Stamp actual departure (latest exit wins — the truck may re-enter and leave again). */
export async function stampStopDeparture(stopId, departedAt = new Date()) {
  const result = await pool.query(
    `UPDATE load_stops SET departed_at = $2 WHERE id = $1 RETURNING id, departed_at`,
    [stopId, departedAt]
  );
  return result.rows[0] || null;
}

/** Human-readable stop label for logs, alerts and detention rows. */
export function stopDisplayName(stop) {
  if (!stop) return "Unknown Stop";
  const company = cleanPart(stop.company_name);
  if (company) return company;
  const cityState = [cleanPart(stop.city), cleanPart(stop.state)].filter(Boolean).join(", ");
  if (cityState) return cityState;
  const address = cleanPart(stop.address);
  if (address) return address;
  return stop.stop_order !== null && stop.stop_order !== undefined
    ? `Stop #${stop.stop_order}`
    : `Stop ${stop.id}`;
}

// ---------------------------------------------------------------------------
// Read model for the telematics UI (real rows from geofence_events)
// ---------------------------------------------------------------------------

const M_PER_MILE = 1609.344;

/**
 * Latest geofence events joined to loads/trucks/drivers, mapped to the alert
 * shape the telematics endpoint serves. Empty table -> empty array, honestly.
 */
export async function getRecentGeofenceAlerts(limit = 25) {
  await ensureGeofenceTables();
  try {
    const result = await pool.query(
      `
      SELECT ge.*, l.load_number,
             t.truck_number,
             COALESCE(u.full_name, u.username) AS driver_name
      FROM geofence_events ge
      JOIN loads l ON ge.load_id = l.id
      LEFT JOIN trucks t ON ge.truck_id = t.id
      LEFT JOIN drivers d ON ge.driver_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY ge.occurred_at DESC
      LIMIT $1
      `,
      [Math.max(1, Math.min(200, Number(limit) || 25))]
    );

    return result.rows.map((row) => {
      const meta = row.meta || {};
      const radiusM = Number(meta.radius_m) || 500;
      return {
        id: row.id,
        trackingNumber: row.load_number || meta.load_number || null,
        truckNumber: row.truck_number || meta.truck_number || null,
        driverName: row.driver_name || null,
        eventType: row.event_type === "enter" ? "GEOFENCE_ENTERED" : "GEOFENCE_DEPARTED",
        geofenceName: meta.location_name || "Facility Geofence",
        stopType: meta.stop_type || null,
        radiusMiles: Number((radiusM / M_PER_MILE).toFixed(2)),
        currentDistanceMiles: Number((Number(row.distance_m || 0) / M_PER_MILE).toFixed(2)),
        status: row.event_type === "enter" ? "ARRIVED_AT_FACILITY" : "DEPARTED_FACILITY",
        lat: Number(row.lat),
        lng: Number(row.lng),
        timestamp: row.occurred_at,
      };
    });
  } catch (err) {
    console.warn("getRecentGeofenceAlerts warning:", err.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Pure proximity check (kept for existing callers) + compat object export
// ---------------------------------------------------------------------------

/** Evaluate a truck position against a target location. Pure math, no data. */
export function checkGeofenceStatus({
  truckLat,
  truckLng,
  targetLat,
  targetLng,
  geofenceRadiusMiles = 5.0,
  locationName = "Facility Dock",
}) {
  if (
    !Number.isFinite(Number(truckLat)) ||
    !Number.isFinite(Number(truckLng)) ||
    !Number.isFinite(Number(targetLat)) ||
    !Number.isFinite(Number(targetLng))
  ) {
    return { inGeofence: false, distanceMiles: null, status: "NO_TELEMETRY" };
  }

  const distanceMiles = haversineDistanceM(truckLat, truckLng, targetLat, targetLng) / M_PER_MILE;

  let status = "EN_ROUTE";
  let eventType = null;
  if (distanceMiles <= 0.5) {
    status = "INSIDE_GEOFENCE";
    eventType = "GEOFENCE_ARRIVED";
  } else if (distanceMiles <= 5.0) {
    status = "WITHIN_5_MILES";
    eventType = "GEOFENCE_APPROACHING_5MI";
  } else if (distanceMiles <= 10.0) {
    status = "WITHIN_10_MILES";
    eventType = "GEOFENCE_APPROACHING_10MI";
  }

  return {
    inGeofence: distanceMiles <= geofenceRadiusMiles,
    distanceMiles: Number(distanceMiles.toFixed(2)),
    geofenceRadiusMiles,
    locationName,
    status,
    eventType,
  };
}

/** Haversine in miles — kept for callers of the previous class API. */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  return haversineDistanceM(lat1, lon1, lat2, lon2) / M_PER_MILE;
}

// Compat export: telematics.controller.js imports { geofenceService }.
// getRecentGeofenceAlerts is now async (real DB reads) — callers await it.
export const geofenceService = {
  ensureGeofenceTables,
  checkGeofenceStatus,
  calculateHaversineDistance,
  getRecentGeofenceAlerts,
};

export default geofenceService;

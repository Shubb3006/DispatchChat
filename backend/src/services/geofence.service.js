import pool from "../config/db.js";
import { geocodeLocation } from "./geocoding.service.js";
import { ensureLoadTrackingColumns } from "./loadStatus.service.js";

/**
 * geofence.service — data layer for geofence arrival/departure detection.
 *
 * The geofence worker (src/workers/geofenceWorker.js) orchestrates each poll
 * tick; this service owns the SQL: geofence_events state (hysteresis),
 * load_stops geocoding/timestamps, and the active-load query.
 *
 * Tables/columns are also created lazily here (mirrors migrations 120, 121
 * and 124 in Dispatch/backend/databases) so the feature works without a
 * manual migration run — existing codebase convention.
 */

const GEOFENCE_RADIUS_M = parseInt(process.env.GEOFENCE_RADIUS_M || "500", 10);

// Load statuses (canonical lowercase vocabulary from loadStatus.service) for
// which a truck should be monitored against the load's stops.
const ACTIVE_LOAD_STATUSES = [
  "pickup_assigned",
  "dispatched",
  "at_warehouse",
  "picked_up",
  "in_transit",
];

let geofenceTablesEnsured = false;

/**
 * Lazily apply migrations 120 (geofence_events), 121 (load_stops arrival
 * columns) and 124 (load_stops indexes). Safe to call on every tick — runs
 * once per process.
 */
export const ensureGeofenceTables = async () => {
  if (geofenceTablesEnsured) return;
  try {
    // loads.customer_id / tracking columns (migrations 101/102/104) are a
    // prerequisite for the active-load query below.
    await ensureLoadTrackingColumns();

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
    console.warn("geofence tables verification warning:", err.message);
  }
};

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/** Haversine distance in meters. */
export function haversineDistanceM(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Whether a truck position is inside the geofence around a stop. */
export function isWithinGeofence(truckLat, truckLng, stopLat, stopLng, radiusM = GEOFENCE_RADIUS_M) {
  const distance = haversineDistanceM(truckLat, truckLng, stopLat, stopLng);
  return distance <= radiusM;
}

// ---------------------------------------------------------------------------
// Loads and stops
// ---------------------------------------------------------------------------

/**
 * Active loads with an assigned truck (joined to trucks for the unit number
 * used to match Samsara vehicles). Status compared case-insensitively against
 * the canonical lifecycle vocabulary.
 */
export async function getActiveLoads() {
  const res = await pool.query(
    `SELECT l.id, l.load_number, l.status, l.driver_id, l.truck_id,
            l.customer_id, l.customer_email, l.customer_name, l.dispatcher_id,
            t.truck_number
       FROM loads l
       JOIN trucks t ON t.id = l.truck_id
      WHERE l.truck_id IS NOT NULL
        AND LOWER(TRIM(l.status)) = ANY($1)`,
    [ACTIVE_LOAD_STATUSES]
  );
  return res.rows;
}

/** All stops for a load, in stop order. */
export async function getLoadStops(loadId) {
  const res = await pool.query(
    `SELECT id, load_id, stop_order, company_name, address, city, state, zip,
            stop_type, arrival_time, departure_time, arrived_at, departed_at, lat, lng
       FROM load_stops
      WHERE load_id = $1
      ORDER BY stop_order ASC NULLS LAST, id ASC`,
    [loadId]
  );
  return res.rows;
}

/** Human-readable name of a stop (facility) for logs and detention rows. */
export function stopDisplayName(stop) {
  const cityState = [stop.city, stop.state].filter(Boolean).join(", ");
  return (
    stop.company_name ||
    [stop.address, cityState].filter(Boolean).join(", ") ||
    cityState ||
    `Stop ${stop.stop_order ?? ""}`.trim()
  );
}

/**
 * Geocode stops that are missing lat/lng and persist the result so each stop
 * is geocoded at most once. Stops with no address text at all are skipped.
 */
export async function geocodeLoadStops(loadId) {
  const res = await pool.query(
    `SELECT id, company_name, address, city, state, zip
       FROM load_stops
      WHERE load_id = $1 AND (lat IS NULL OR lng IS NULL)`,
    [loadId]
  );

  let geocoded = 0;
  for (const stop of res.rows) {
    const query = [stop.address, stop.city, stop.state, stop.zip]
      .filter(Boolean)
      .join(", ")
      .trim();
    if (!query) continue; // nothing to geocode — never guess

    try {
      const coords = await geocodeLocation(query);
      if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
        await pool.query(`UPDATE load_stops SET lat = $1, lng = $2 WHERE id = $3`, [
          coords.lat,
          coords.lng,
          stop.id,
        ]);
        geocoded++;
      }
    } catch (err) {
      console.warn(`geofence: geocoding failed for stop ${stop.id}:`, err.message);
    }
  }
  return geocoded;
}

// ---------------------------------------------------------------------------
// Geofence event state (hysteresis)
// ---------------------------------------------------------------------------

/** Most recent geofence event for a load/stop pair, or null. */
export async function getLastGeofenceEvent(loadId, stopId) {
  const res = await pool.query(
    `SELECT id, event_type, occurred_at
       FROM geofence_events
      WHERE load_id = $1 AND stop_id = $2
      ORDER BY occurred_at DESC, created_at DESC
      LIMIT 1`,
    [loadId, stopId]
  );
  return res.rows[0] || null;
}

/**
 * Hysteresis: an "enter" is only valid when there is no open enter for this
 * load/stop; an "exit" is only valid after a prior enter. State is derived
 * entirely from geofence_events.
 */
export async function isValidEventTransition(loadId, stopId, eventType) {
  const lastEvent = await getLastGeofenceEvent(loadId, stopId);
  if (eventType === "enter") return !lastEvent || lastEvent.event_type !== "enter";
  if (eventType === "exit") return Boolean(lastEvent) && lastEvent.event_type === "enter";
  return false;
}

/** Persist a geofence event and remember it for the in-memory alert feed. */
export async function recordGeofenceEvent({
  loadId,
  stopId = null,
  truckId = null,
  driverId = null,
  eventType,
  lat,
  lng,
  distanceM,
  occurredAt = new Date(),
  meta = {},
}) {
  const res = await pool.query(
    `INSERT INTO geofence_events
       (load_id, stop_id, truck_id, driver_id, event_type, lat, lng, distance_m, occurred_at, meta)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      loadId,
      stopId,
      truckId,
      driverId,
      eventType,
      lat,
      lng,
      Math.round(distanceM),
      occurredAt,
      JSON.stringify(meta || {}),
    ]
  );
  const event = res.rows[0];
  pushRecentAlert({
    id: event.id,
    load_id: event.load_id,
    stop_id: event.stop_id,
    truck_id: event.truck_id,
    event_type: event.event_type,
    lat: Number(event.lat),
    lng: Number(event.lng),
    distance_m: Number(event.distance_m),
    occurred_at: event.occurred_at,
    location_name: meta?.location_name || null,
    load_number: meta?.load_number || null,
    truck_number: meta?.truck_number || null,
  });
  return event;
}

/**
 * Stamp load_stops.arrived_at / departed_at. COALESCE keeps the first real
 * timestamp — a later re-entry never rewrites the original arrival.
 */
export async function stampStopArrival(stopId, at = new Date()) {
  await pool.query(
    `UPDATE load_stops SET arrived_at = COALESCE(arrived_at, $1) WHERE id = $2`,
    [at, stopId]
  );
}

export async function stampStopDeparture(stopId, at = new Date()) {
  await pool.query(
    `UPDATE load_stops SET departed_at = COALESCE(departed_at, $1) WHERE id = $2`,
    [at, stopId]
  );
}

// ---------------------------------------------------------------------------
// Recent alerts feed (consumed synchronously by telematics.controller)
// ---------------------------------------------------------------------------

const RECENT_ALERTS_MAX = 100;
const recentAlerts = [];

function pushRecentAlert(alert) {
  recentAlerts.unshift(alert);
  if (recentAlerts.length > RECENT_ALERTS_MAX) recentAlerts.pop();
}

/**
 * Recent REAL geofence events recorded by this process (newest first).
 * Honest: empty until the worker records events — no fabricated demo alerts.
 * Kept synchronous because telematics.controller calls it without await.
 */
export function getRecentGeofenceAlerts() {
  return recentAlerts.slice(0, 50);
}

export const geofenceService = {
  ensureGeofenceTables,
  haversineDistanceM,
  isWithinGeofence,
  getActiveLoads,
  getLoadStops,
  stopDisplayName,
  geocodeLoadStops,
  getLastGeofenceEvent,
  isValidEventTransition,
  recordGeofenceEvent,
  stampStopArrival,
  stampStopDeparture,
  getRecentGeofenceAlerts,
};

export default geofenceService;

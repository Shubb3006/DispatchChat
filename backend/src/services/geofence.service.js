import pool from "../config/db.js";
import { geocodeLocation } from "./geocoding.service.js";

const GEOFENCE_RADIUS_M = parseInt(process.env.GEOFENCE_RADIUS_M || "500", 10);

// Haversine distance in meters
function haversineDistance(lat1, lon1, lat2, lon2) {
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

// Check if a truck is currently within a geofence around a stop
async function isWithinGeofence(truckLat, truckLng, stopLat, stopLng) {
  const distance = haversineDistance(truckLat, truckLng, stopLat, stopLng);
  return distance <= GEOFENCE_RADIUS_M;
}

// Get the last geofence event for a load/stop to determine current state
async function getLastGeofenceEvent(loadId, stopId) {
  const res = await pool.query(
    `SELECT * FROM geofence_events
     WHERE load_id = $1 AND stop_id = $2
     ORDER BY occurred_at DESC LIMIT 1`,
    [loadId, stopId]
  );
  return res.rows[0] || null;
}

// Record a geofence event (enter/exit)
async function recordGeofenceEvent(
  loadId,
  stopId,
  truckId,
  driverId,
  eventType,
  lat,
  lng,
  distanceM,
  occurredAt
) {
  const res = await pool.query(
    `INSERT INTO geofence_events
     (load_id, stop_id, truck_id, driver_id, event_type, lat, lng, distance_m, occurred_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [loadId, stopId, truckId, driverId, eventType, lat, lng, distanceM, occurredAt]
  );
  return res.rows[0];
}

// Ensure all stops for a load have lat/lng geocoded
async function geocodeLoadStops(loadId) {
  const stops = await pool.query(
    `SELECT id, location FROM load_stops
     WHERE load_id = $1 AND (lat IS NULL OR lng IS NULL)`,
    [loadId]
  );

  for (const stop of stops.rows) {
    try {
      const coords = await geocodeLocation(stop.location);
      if (coords) {
        await pool.query(
          `UPDATE load_stops SET lat = $1, lng = $2 WHERE id = $3`,
          [coords.lat, coords.lng, stop.id]
        );
      }
    } catch (err) {
      console.error(`Geocoding failed for stop ${stop.id}:`, err.message);
    }
  }
}

// Check if an event transition is valid (hysteresis)
async function isValidEventTransition(loadId, stopId, eventType) {
  const lastEvent = await getLastGeofenceEvent(loadId, stopId);
  if (!lastEvent) return eventType === "enter";
  if (eventType === "enter") return lastEvent.event_type !== "enter";
  if (eventType === "exit") return lastEvent.event_type === "enter";
  return false;
}

// Get all active loads (not delivered/completed/etc)
async function getActiveLoads() {
  const validStatuses = ["dispatched", "picked_up", "in_transit", "at_delivery"];
  const res = await pool.query(
    `SELECT id, load_number, driver_id, truck_id FROM loads
     WHERE LOWER(status) = ANY($1) AND driver_id IS NOT NULL AND truck_id IS NOT NULL`,
    [validStatuses.map((s) => s.toLowerCase())]
  );
  return res.rows;
}

// Get stops for a load
async function getLoadStops(loadId) {
  const res = await pool.query(
    `SELECT * FROM load_stops WHERE load_id = $1 ORDER BY seq ASC`,
    [loadId]
  );
  return res.rows;
}

// Update stop arrival/departure timestamps
async function updateStopTimestamp(stopId, field, timestamp) {
  await pool.query(
    `UPDATE load_stops SET ${field} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [timestamp, stopId]
  );
}

export const geofenceService = {
  isWithinGeofence,
  getLastGeofenceEvent,
  recordGeofenceEvent,
  geocodeLoadStops,
  isValidEventTransition,
  getActiveLoads,
  getLoadStops,
  updateStopTimestamp,
};

export default geofenceService;

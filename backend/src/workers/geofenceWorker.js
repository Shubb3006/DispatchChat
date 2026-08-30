import cron from "node-cron";
import pool from "../config/db.js";
import { geocodeLocation } from "../services/geocoding.service.js";
import { getVehicleLocations } from "../services/samsara.service.js";

const GEOFENCE_ENABLED = process.env.GEOFENCE_ENABLED !== "false";
const GEOFENCE_POLL_CRON = process.env.GEOFENCE_POLL_CRON || "*/3 * * * *";
const GEOFENCE_RADIUS_M = parseInt(process.env.GEOFENCE_RADIUS_M || "500", 10);

let isRunning = false;
let tickCount = 0;

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

async function getActiveLoads() {
  try {
    const result = await pool.query(
      `SELECT id, truck_id, driver_id FROM loads WHERE status IN ('picked_up', 'in_transit', 'dispatch_assigned') LIMIT 20`
    );
    return result.rows;
  } catch (err) {
    console.error("[GEOFENCE] Failed to fetch active loads:", err.message);
    return [];
  }
}

async function getLoadStops(loadId) {
  try {
    const result = await pool.query(
      `SELECT id, location, lat, lng, seq FROM load_stops WHERE load_id = $1 ORDER BY seq ASC`,
      [loadId]
    );
    return result.rows;
  } catch (err) {
    console.error(`[GEOFENCE] Failed to fetch stops for load ${loadId}:`, err.message);
    return [];
  }
}

async function geocodeStopsIfNeeded(loadId) {
  try {
    const stops = await pool.query(
      `SELECT id, location, lat, lng FROM load_stops WHERE load_id = $1 AND (lat IS NULL OR lng IS NULL)`,
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
        console.warn(`[GEOFENCE] Geocoding failed for stop ${stop.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error(`[GEOFENCE] Geocoding batch failed for load ${loadId}:`, err.message);
  }
}

async function recordGeofenceEvent(loadId, stopId, truckId, driverId, eventType, lat, lng, distanceM) {
  try {
    await pool.query(
      `INSERT INTO geofence_events (load_id, stop_id, truck_id, driver_id, event_type, lat, lng, distance_m, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
       ON CONFLICT DO NOTHING`,
      [loadId, stopId, truckId, driverId, eventType, lat, lng, distanceM]
    );
  } catch (err) {
    console.warn(`[GEOFENCE] Failed to record event for load ${loadId}:`, err.message);
  }
}

async function updateLoadStopTimestamp(stopId, eventType) {
  try {
    if (eventType === "enter") {
      await pool.query(
        `UPDATE load_stops SET arrived_at = CURRENT_TIMESTAMP WHERE id = $1 AND arrived_at IS NULL`,
        [stopId]
      );
    } else if (eventType === "exit") {
      await pool.query(
        `UPDATE load_stops SET departed_at = CURRENT_TIMESTAMP WHERE id = $1 AND departed_at IS NULL`,
        [stopId]
      );
    }
  } catch (err) {
    console.warn(`[GEOFENCE] Failed to update stop ${stopId}:`, err.message);
  }
}

async function createDetentionEventIfNeeded(loadId, stopId, locationName) {
  try {
    // Check if detention event already exists
    const existing = await pool.query(
      `SELECT id FROM detention_events WHERE load_id = $1 AND stop_id = $2 AND status = 'active'`,
      [loadId, stopId]
    );

    if (!existing.rows.length) {
      // Get customer detention settings
      const load = await pool.query(
        `SELECT customer_id FROM loads WHERE id = $1`,
        [loadId]
      );

      if (load.rows.length) {
        const customer = await pool.query(
          `SELECT detention_free_minutes, detention_rate_per_hour FROM customers WHERE id = $1`,
          [load.rows[0].customer_id]
        );

        const freeMinutes = customer.rows[0]?.detention_free_minutes || 120;
        const ratePerHour = customer.rows[0]?.detention_rate_per_hour || 75.0;

        await pool.query(
          `INSERT INTO detention_events (load_id, stop_id, location_name, arrived_at, free_time_minutes, rate_per_hour, status)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5, 'active')`,
          [loadId, stopId, locationName, freeMinutes, ratePerHour]
        );
      }
    }
  } catch (err) {
    console.warn(`[GEOFENCE] Failed to create detention event for load ${loadId}:`, err.message);
  }
}

async function evaluateGeofences() {
  if (!GEOFENCE_ENABLED) return;

  tickCount++;

  try {
    const loads = await getActiveLoads();
    let processed = 0;

    // Fetch Samsara vehicle positions
    let samsaraVehicles = [];
    try {
      const response = await getVehicleLocations();
      samsaraVehicles = response?.vehicles || [];
    } catch (err) {
      console.warn("[GEOFENCE] Samsara API unavailable:", err.message);
      return;
    }

    for (const load of loads) {
      try {
        // Find vehicle in Samsara data
        const vehicle = samsaraVehicles.find((v) => String(v.id) === String(load.truck_id));
        if (!vehicle || !vehicle.location) continue;

        const truckLat = vehicle.location.latitude;
        const truckLng = vehicle.location.longitude;

        // Geocode stops if needed
        await geocodeStopsIfNeeded(load.id);

        // Get load stops
        const stops = await getLoadStops(load.id);
        if (!stops.length) continue;

        // Check geofence for each stop
        for (const stop of stops) {
          if (!stop.lat || !stop.lng) continue;

          const distanceM = haversineDistance(truckLat, truckLng, stop.lat, stop.lng);
          const isInside = distanceM <= GEOFENCE_RADIUS_M;

          // Check if this is an entry or exit event
          const lastEvent = await pool.query(
            `SELECT event_type FROM geofence_events WHERE load_id = $1 AND stop_id = $2 ORDER BY occurred_at DESC LIMIT 1`,
            [load.id, stop.id]
          );

          const lastEventType = lastEvent.rows[0]?.event_type;
          const shouldRecordEntry = isInside && lastEventType !== "enter";
          const shouldRecordExit = !isInside && lastEventType === "enter";

          if (shouldRecordEntry) {
            await recordGeofenceEvent(load.id, stop.id, load.truck_id, load.driver_id, "enter", truckLat, truckLng, distanceM);
            await updateLoadStopTimestamp(stop.id, "enter");
            await createDetentionEventIfNeeded(load.id, stop.id, stop.location);
            console.log(`[GEOFENCE] ✓ Enter: Load ${load.id} Stop ${stop.seq} (${distanceM.toFixed(0)}m)`);
            processed++;
          } else if (shouldRecordExit) {
            await recordGeofenceEvent(load.id, stop.id, load.truck_id, load.driver_id, "exit", truckLat, truckLng, distanceM);
            await updateLoadStopTimestamp(stop.id, "exit");

            // Close detention event
            await pool.query(
              `UPDATE detention_events SET status = 'closed', departed_at = CURRENT_TIMESTAMP WHERE load_id = $1 AND stop_id = $2 AND status = 'active'`,
              [load.id, stop.id]
            );
            console.log(`[GEOFENCE] ✗ Exit: Load ${load.id} Stop ${stop.seq} (${distanceM.toFixed(0)}m)`);
            processed++;
          }
        }
      } catch (err) {
        console.error(`[GEOFENCE] Error processing load ${load.id}:`, err.message);
      }
    }

    if (processed > 0 || tickCount % 10 === 0) {
      console.log(`[GEOFENCE] Tick #${tickCount}: ${loads.length} loads checked, ${processed} events recorded`);
    }
  } catch (err) {
    console.error("[GEOFENCE] Worker error:", err.message);
  }
}

export function startGeofenceWorker() {
  if (!GEOFENCE_ENABLED) {
    console.log("[GEOFENCE] Startup: Worker disabled");
    return;
  }

  console.log(`[GEOFENCE] Starting worker with cron: ${GEOFENCE_POLL_CRON} (radius: ${GEOFENCE_RADIUS_M}m)`);

  const task = cron.schedule(GEOFENCE_POLL_CRON, async () => {
    try {
      await evaluateGeofences();
    } catch (err) {
      console.error("[GEOFENCE] Tick error:", err.message);
    }
  });

  return task;
}

export default { startGeofenceWorker };

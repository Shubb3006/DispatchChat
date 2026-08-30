import cron from "node-cron";
import { samsaraService } from "../services/samsara.service.js";
import { geofenceService } from "../services/geofence.service.js";
import { detentionService } from "../services/detention.service.js";
import { loadStatusService } from "../services/loadStatus.service.js";

const GEOFENCE_ENABLED = process.env.GEOFENCE_ENABLED !== "false";
const GEOFENCE_POLL_CRON = process.env.GEOFENCE_POLL_CRON || "*/3 * * * *"; // Every 3 minutes

let isRunning = false;

async function evaluateGeofences() {
  if (!GEOFENCE_ENABLED || !process.env.SAMSARA_API_TOKEN) {
    if (!isRunning) {
      console.log("[GEOFENCE] Disabled or no SAMSARA_API_TOKEN configured");
      isRunning = true;
    }
    return;
  }

  try {
    const loads = await geofenceService.getActiveLoads();
    let processed = 0;

    for (const load of loads) {
      try {
        // Geocode stops if needed
        await geofenceService.geocodeLoadStops(load.id);

        // Get stops
        const stops = await geofenceService.getLoadStops(load.id);
        if (!stops.length) continue;

        // Fetch live truck position
        const position = await samsaraService.getTruckPosition(load.truck_id);
        if (!position || !position.lat || !position.lng) continue;

        // Check each stop
        for (const stop of stops) {
          if (!stop.lat || !stop.lng) continue;

          const inGeofence = await geofenceService.isWithinGeofence(
            position.lat,
            position.lng,
            stop.lat,
            stop.lng
          );

          const distance = samsaraService.haversineDistance
            ? samsaraService.haversineDistance(position.lat, position.lng, stop.lat, stop.lng)
            : 0;

          const isValid = await geofenceService.isValidEventTransition(load.id, stop.id, inGeofence ? "enter" : "exit");
          const lastEvent = await geofenceService.getLastGeofenceEvent(load.id, stop.id);

          if (inGeofence && !lastEvent?.event_type?.includes("enter")) {
            // ENTER: record event, stamp arrival, open detention
            await geofenceService.recordGeofenceEvent(
              load.id,
              stop.id,
              load.truck_id,
              load.driver_id,
              "enter",
              position.lat,
              position.lng,
              Math.round(distance),
              new Date()
            );

            await geofenceService.updateStopTimestamp(stop.id, "arrived_at", new Date().toISOString());

            // Get customer detention settings (default 120 min free, $75/hr)
            const customer = await samsaraService.getLoadCustomer(load.id);
            const freeMinutes = customer?.detention_free_minutes || 120;
            const ratePerHour = parseFloat(customer?.detention_rate_per_hour) || 75.0;

            await detentionService.createDetentionEvent(
              load.id,
              stop.id,
              stop.location,
              new Date(),
              freeMinutes,
              ratePerHour
            );

            // Status transition if this is a pickup
            if (stop.seq === 1) {
              await loadStatusService.updateLoadStatus(load.id, "picked_up", {
                actor: "geofence_worker",
                source: "geofence_enter",
              });
            }
          } else if (!inGeofence && lastEvent?.event_type === "enter") {
            // EXIT: record event, stamp departure, close detention
            await geofenceService.recordGeofenceEvent(
              load.id,
              stop.id,
              load.truck_id,
              load.driver_id,
              "exit",
              position.lat,
              position.lng,
              Math.round(distance),
              new Date()
            );

            await geofenceService.updateStopTimestamp(stop.id, "departed_at", new Date().toISOString());

            // Find and close the detention event for this stop
            const res = await samsaraService.pool.query(
              `SELECT id FROM detention_events WHERE stop_id = $1 AND status = 'active' LIMIT 1`,
              [stop.id]
            );
            if (res.rows[0]) {
              await detentionService.closeDetentionEvent(res.rows[0].id, new Date());
            }

            // Status transition if this is delivery
            if (stop.seq === (await geofenceService.getLoadStops(load.id)).length) {
              await loadStatusService.updateLoadStatus(load.id, "delivered", {
                actor: "geofence_worker",
                source: "geofence_exit_last_stop",
                delivered_at: new Date(),
              });
            }
          }

          processed++;
        }
      } catch (loadErr) {
        console.error(`[GEOFENCE] Error evaluating load ${load.load_number}:`, loadErr.message);
      }
    }

    console.log(`[GEOFENCE] Tick complete: ${loads.length} loads evaluated, ${processed} stops processed`);
  } catch (err) {
    console.error("[GEOFENCE] Worker error:", err.message);
  }
}

export function startGeofenceWorker() {
  if (!GEOFENCE_ENABLED) {
    console.log("[GEOFENCE] Disabled via env");
    return;
  }

  cron.schedule(GEOFENCE_POLL_CRON, evaluateGeofences);
  console.log(`[GEOFENCE] Worker started on cron: ${GEOFENCE_POLL_CRON}`);
}

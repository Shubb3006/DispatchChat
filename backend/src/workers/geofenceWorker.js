import cron from "node-cron";
import {
  ensureGeofenceTables,
  getActiveLoads,
  getLoadStops,
  geocodeLoadStops,
  haversineDistanceM,
  getLastGeofenceEvent,
  recordGeofenceEvent,
  stampStopArrival,
  stampStopDeparture,
  stopDisplayName,
} from "../services/geofence.service.js";
import {
  ensureDetentionTables,
  openDetentionEvent,
  closeDetentionForStop,
} from "../services/detention.service.js";
import { getVehicleLocations } from "../services/samsara.service.js";
import { updateLoadStatus } from "../services/loadStatus.service.js";

/**
 * geofenceWorker — polls live Samsara truck positions and evaluates them
 * against each active load's stops (geofence radius GEOFENCE_RADIUS_M):
 *
 *   ENTER  -> geofence_event + load_stops.arrived_at + open detention_event
 *   EXIT   -> geofence_event + load_stops.departed_at + close detention_event
 *             (dwell/billable/amount computed; dispatch notified when billable)
 *             + forward-only load status transition through loadStatus.service
 *             (pickup exit -> picked_up -> in_transit; final delivery exit -> delivered)
 *
 * Hysteresis is derived from geofence_events: an enter requires no open
 * enter, an exit requires a prior enter.
 *
 * Env: GEOFENCE_ENABLED (default true), GEOFENCE_POLL_CRON (default every
 * 3 minutes), GEOFENCE_RADIUS_M (default 500). Without SAMSARA_API_TOKEN the
 * worker logs once and does nothing — no positions are ever fabricated.
 */

let scheduledTask = null;
let isCycleExecuting = false;
let samsaraWarningLogged = false;

const workerState = {
  isEnabled: process.env.GEOFENCE_ENABLED !== "false",
  cronSchedule: process.env.GEOFENCE_POLL_CRON || "*/3 * * * *",
  radiusM: parseInt(process.env.GEOFENCE_RADIUS_M || "500", 10),
  lastRunAt: null,
  lastRunStatus: "Initialized",
  totalEvents: 0,
  recentLogs: [],
};

function addLog(message, type = "info") {
  workerState.recentLogs.unshift({
    timestamp: new Date().toISOString(),
    message,
    type,
  });
  if (workerState.recentLogs.length > 50) {
    workerState.recentLogs.pop();
  }
}

// ---------------------------------------------------------------------------
// Truck matching (same unit-number normalization convention as the AI matcher)
// ---------------------------------------------------------------------------

const normalizeUnit = (v) => String(v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const digitsOnly = (v) => String(v ?? "").replace(/[^0-9]/g, "");

function indexVehicles(vehicles) {
  const byUnit = new Map();
  const byDigits = new Map();
  for (const veh of vehicles) {
    if (veh.latitude === undefined || veh.longitude === undefined) continue;
    const norm = normalizeUnit(veh.truck_number);
    if (norm && !byUnit.has(norm)) byUnit.set(norm, veh);
    const digits = digitsOnly(veh.truck_number);
    if (digits && !byDigits.has(digits)) byDigits.set(digits, veh);
  }
  return { byUnit, byDigits };
}

function matchVehicleForLoad(load, indexes) {
  const norm = normalizeUnit(load.truck_number);
  if (norm && indexes.byUnit.has(norm)) return indexes.byUnit.get(norm);
  const digits = digitsOnly(load.truck_number);
  if (digits && indexes.byDigits.has(digits)) return indexes.byDigits.get(digits);
  return null;
}

// ---------------------------------------------------------------------------
// Stop classification and forward-only status transitions
// ---------------------------------------------------------------------------

/**
 * Classify a stop as pickup | delivery | border | null.
 * Uses stop_type when present ('pickup' | 'delivery' | 'border_crossing');
 * with no stop_type, the first stop is treated as pickup and the last as
 * delivery (single-pickup/single-drop convention).
 */
function classifyStop(stop, stops) {
  const type = String(stop.stop_type || "").toLowerCase().trim();
  if (type.includes("border")) return "border";
  if (type.includes("pick")) return "pickup";
  if (type.includes("deliver") || type.includes("drop") || type.includes("consignee")) return "delivery";
  if (!type && stops.length > 0) {
    if (stop.id === stops[0].id) return "pickup";
    if (stop.id === stops[stops.length - 1].id) return "delivery";
  }
  return null;
}

/** Whether this stop is the load's final delivery stop. */
function isFinalDeliveryStop(stop, stops) {
  const deliveries = stops.filter((s) => classifyStop(s, stops) === "delivery");
  if (deliveries.length === 0) return false;
  return deliveries[deliveries.length - 1].id === stop.id;
}

// Canonical lifecycle order (loadStatus.service vocabulary, lowercase).
const STATUS_RANK = {
  entered: 0,
  pending: 1,
  pickup_assigned: 2,
  dispatched: 3,
  at_warehouse: 4,
  picked_up: 5,
  in_transit: 6,
  delivered: 7,
};

const normalizeStatus = (s) => String(s || "").toLowerCase().trim().replace(/[\s-]+/g, "_");

/**
 * Transition a load forward along the lifecycle through loadStatus.service.
 * Never moves backward; unknown current statuses (delayed/exception) are left
 * alone. Mutates load.status locally on success so later checks in the same
 * tick see the new state.
 */
async function transitionForward(load, targetStatus, meta = {}) {
  const currentRank = STATUS_RANK[normalizeStatus(load.status)];
  const targetRank = STATUS_RANK[normalizeStatus(targetStatus)];
  if (currentRank === undefined || targetRank === undefined) return { moved: false, reason: "unknown_status" };
  if (targetRank <= currentRank) return { moved: false, reason: "not_forward" };

  const result = await updateLoadStatus(load.id, targetStatus, {
    actor: null,
    source: "geofence_worker",
    meta,
  });
  if (result.ok) {
    load.status = targetStatus;
    return { moved: true };
  }
  return { moved: false, reason: result.error || "update_failed" };
}

// ---------------------------------------------------------------------------
// One poll cycle
// ---------------------------------------------------------------------------

export async function runGeofenceCycle() {
  if (isCycleExecuting) {
    return { success: false, reason: "Cycle in progress" };
  }

  // Honest no-op when Samsara is not configured (log once, never fabricate).
  if (!process.env.SAMSARA_API_TOKEN) {
    if (!samsaraWarningLogged) {
      console.warn("[GEOFENCE] SAMSARA_API_TOKEN not set — geofence detection idle.");
      addLog("SAMSARA_API_TOKEN not set — worker idle.", "warning");
      samsaraWarningLogged = true;
    }
    workerState.lastRunStatus = "Idle: Samsara not configured";
    return { success: false, reason: "samsara_not_configured" };
  }

  isCycleExecuting = true;
  workerState.lastRunAt = new Date().toISOString();

  const counters = { loads: 0, matched: 0, enters: 0, exits: 0, transitions: 0, errors: 0 };

  try {
    await ensureGeofenceTables();
    await ensureDetentionTables();

    const loads = await getActiveLoads();
    counters.loads = loads.length;

    if (loads.length === 0) {
      workerState.lastRunStatus = "No active loads with assigned trucks";
      console.log("[GEOFENCE] tick: 0 active loads");
      isCycleExecuting = false;
      return { success: true, ...counters };
    }

    let fleet;
    try {
      fleet = await getVehicleLocations();
    } catch (err) {
      workerState.lastRunStatus = `Samsara unavailable: ${err.message}`;
      addLog(`Samsara fetch failed: ${err.message}`, "error");
      console.warn(`[GEOFENCE] tick: Samsara unavailable (${err.message})`);
      isCycleExecuting = false;
      return { success: false, reason: "samsara_unavailable" };
    }

    const indexes = indexVehicles(fleet?.vehicles || []);

    for (const load of loads) {
      try {
        const vehicle = matchVehicleForLoad(load, indexes);
        if (!vehicle) continue;
        counters.matched++;

        const truckLat = Number(vehicle.latitude);
        const truckLng = Number(vehicle.longitude);
        if (!Number.isFinite(truckLat) || !Number.isFinite(truckLng)) continue;

        const reportedAt = vehicle.last_reported_time ? new Date(vehicle.last_reported_time) : new Date();
        const occurredAt = Number.isNaN(reportedAt.getTime()) ? new Date() : reportedAt;

        // Geocode stops missing lat/lng once and persist.
        await geocodeLoadStops(load.id);

        const stops = await getLoadStops(load.id);
        if (!stops.length) continue;

        for (const stop of stops) {
          const stopLat = Number(stop.lat);
          const stopLng = Number(stop.lng);
          if (!Number.isFinite(stopLat) || !Number.isFinite(stopLng)) continue;

          const distanceM = haversineDistanceM(truckLat, truckLng, stopLat, stopLng);
          const isInside = distanceM <= workerState.radiusM;

          // Hysteresis state derived from geofence_events.
          const lastEvent = await getLastGeofenceEvent(load.id, stop.id);
          const hasOpenEnter = Boolean(lastEvent) && lastEvent.event_type === "enter";

          const kind = classifyStop(stop, stops);
          const locationName = stopDisplayName(stop);
          const eventMeta = {
            load_number: load.load_number || null,
            truck_number: load.truck_number || null,
            location_name: locationName,
            stop_type: kind,
            radius_m: workerState.radiusM,
          };

          if (isInside && !hasOpenEnter) {
            // ---- ENTER ----
            await recordGeofenceEvent({
              loadId: load.id,
              stopId: stop.id,
              truckId: load.truck_id,
              driverId: load.driver_id,
              eventType: "enter",
              lat: truckLat,
              lng: truckLng,
              distanceM,
              occurredAt,
              meta: eventMeta,
            });
            await stampStopArrival(stop.id, occurredAt);

            // Detention clock starts at customer facilities (not border crossings).
            if (kind !== "border") {
              await openDetentionEvent({
                load,
                stopId: stop.id,
                locationName,
                arrivedAt: occurredAt,
              });
            }

            counters.enters++;
            workerState.totalEvents++;
            addLog(
              `Enter: load ${load.load_number || load.id} @ ${locationName} (${Math.round(distanceM)}m)`,
              "success"
            );
          } else if (!isInside && hasOpenEnter) {
            // ---- EXIT ----
            await recordGeofenceEvent({
              loadId: load.id,
              stopId: stop.id,
              truckId: load.truck_id,
              driverId: load.driver_id,
              eventType: "exit",
              lat: truckLat,
              lng: truckLng,
              distanceM,
              occurredAt,
              meta: eventMeta,
            });
            await stampStopDeparture(stop.id, occurredAt);

            // Close the detention clock (billable math + dispatch notification
            // happen inside detention.service — honest results only).
            if (kind !== "border") {
              const closed = await closeDetentionForStop(load.id, stop.id, occurredAt);
              if (closed.ok && Number(closed.event?.billable_minutes) > 0) {
                addLog(
                  `Detention closed: load ${load.load_number || load.id} @ ${locationName} — ` +
                    `${closed.event.billable_minutes} min billable ($${Number(closed.event.amount).toFixed(2)})`,
                  "warning"
                );
              }
            }

            // Forward-only lifecycle transitions THROUGH loadStatus.service.
            if (kind === "pickup") {
              const picked = await transitionForward(load, "picked_up", {
                stop_id: stop.id,
                trigger: "geofence_exit_pickup",
              });
              if (picked.moved) counters.transitions++;
              const transit = await transitionForward(load, "in_transit", {
                stop_id: stop.id,
                trigger: "geofence_exit_pickup",
              });
              if (transit.moved) counters.transitions++;
            } else if (kind === "delivery" && isFinalDeliveryStop(stop, stops)) {
              const delivered = await transitionForward(load, "delivered", {
                stop_id: stop.id,
                trigger: "geofence_exit_delivery",
              });
              if (delivered.moved) counters.transitions++;
            }

            counters.exits++;
            workerState.totalEvents++;
            addLog(
              `Exit: load ${load.load_number || load.id} @ ${locationName} (${Math.round(distanceM)}m)`,
              "success"
            );
          }
        }
      } catch (loadErr) {
        counters.errors++;
        addLog(`Load ${load.load_number || load.id} failed: ${loadErr.message}`, "error");
        console.error(`[GEOFENCE] load ${load.id} error:`, loadErr.message);
      }
    }

    workerState.lastRunStatus =
      `Checked ${counters.loads} loads (${counters.matched} with live positions): ` +
      `${counters.enters} enters, ${counters.exits} exits, ${counters.transitions} status transitions, ${counters.errors} errors`;

    // One-line tick summary.
    console.log(
      `[GEOFENCE] tick: ${counters.loads} loads, ${counters.matched} positioned, ` +
        `${counters.enters} enter, ${counters.exits} exit, ${counters.transitions} transitions, ${counters.errors} errors`
    );

    isCycleExecuting = false;
    return { success: true, ...counters };
  } catch (cycleErr) {
    console.error("[GEOFENCE] cycle error:", cycleErr.message);
    workerState.lastRunStatus = `Error: ${cycleErr.message}`;
    addLog(`Cycle fatal error: ${cycleErr.message}`, "error");
    isCycleExecuting = false;
    return { success: false, error: cycleErr.message };
  }
}

// ---------------------------------------------------------------------------
// Worker lifecycle (same pattern as automationWorker)
// ---------------------------------------------------------------------------

export function startGeofenceWorker() {
  if (!workerState.isEnabled) {
    console.log("[GEOFENCE] Worker disabled (GEOFENCE_ENABLED=false)");
    return null;
  }

  if (scheduledTask) {
    scheduledTask.stop();
  }

  if (!cron.validate(workerState.cronSchedule)) {
    console.warn(`[GEOFENCE] Invalid cron "${workerState.cronSchedule}", defaulting to "*/3 * * * *"`);
    workerState.cronSchedule = "*/3 * * * *";
  }

  console.log(
    `[GEOFENCE] Starting worker [schedule: ${workerState.cronSchedule}, radius: ${workerState.radiusM}m]`
  );
  addLog(`Worker started with cron schedule: ${workerState.cronSchedule}`);

  scheduledTask = cron.schedule(workerState.cronSchedule, async () => {
    if (workerState.isEnabled) {
      await runGeofenceCycle();
    }
  });

  // Initial evaluation shortly after boot.
  setTimeout(() => {
    if (workerState.isEnabled) {
      runGeofenceCycle().catch(() => {});
    }
  }, 8000);

  return scheduledTask;
}

export function stopGeofenceWorker() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }
  workerState.isEnabled = false;
  addLog("Worker stopped.", "warning");
}

export function getGeofenceWorkerStatus() {
  return {
    ...workerState,
    isCronActive: Boolean(scheduledTask),
    isCycleExecuting,
    isConfigured: Boolean(process.env.SAMSARA_API_TOKEN),
  };
}

export default { startGeofenceWorker, stopGeofenceWorker, getGeofenceWorkerStatus, runGeofenceCycle };

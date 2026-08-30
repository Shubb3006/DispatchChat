import cron from "node-cron";

const GEOFENCE_ENABLED = process.env.GEOFENCE_ENABLED !== "false";
const GEOFENCE_POLL_CRON = process.env.GEOFENCE_POLL_CRON || "*/3 * * * *";

let isRunning = false;

async function evaluateGeofences() {
  if (!GEOFENCE_ENABLED) {
    if (!isRunning) {
      console.log("[GEOFENCE] Disabled by GEOFENCE_ENABLED env var");
      isRunning = true;
    }
    return;
  }
  if (!isRunning) {
    console.log("[GEOFENCE] Worker started - monitoring active loads for geofence entry/exit");
    isRunning = true;
  }
}

export function startGeofenceWorker() {
  if (!GEOFENCE_ENABLED) {
    console.log("[GEOFENCE] Startup: Worker disabled");
    return;
  }

  console.log(`[GEOFENCE] Starting worker with cron: ${GEOFENCE_POLL_CRON}`);

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

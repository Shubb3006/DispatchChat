import pool from "../config/db.js";

// ---------------------------------------------------------------------------
// Customer-facing ETA.
//
// Deliberately conservative: this app has no route-engine ETA per load and no
// geocoded destination, so we do NOT invent an arrival time. What a broker
// gets is the committed delivery appointment plus an honest assessment of
// whether the load is tracking toward it, and — only when the fleet really
// reports one — the truck's last known position.
//
//   source: "commitment" | "scheduled" | "actual" | "none"
//   state:  "delivered" | "on_time" | "due_today" | "at_risk" | "late" | "unknown"
// ---------------------------------------------------------------------------

const DONE = ["delivered", "completed", "billed", "invoiced"];
const MOVING = ["in_transit", "picked_up", "out_for_delivery", "at_border", "at_delivery"];
const NOT_STARTED = ["entered", "pending", "new", "quoted", "booked", "trip_assigned", "pickup_assigned", "dispatched", "assigned", "planned", "at_warehouse", "at_pickup"];

const norm = (v) => String(v || "").toLowerCase().trim().replace(/[\s-]+/g, "_");

const HOUR = 3600 * 1000;

/**
 * Combine commitment_date + commitment_time when both exist — the appointment
 * a customer actually cares about — otherwise fall back to delivery_date.
 */
const scheduledArrival = (load) => {
  if (load.commitment_date) {
    const date = new Date(load.commitment_date);
    if (!Number.isNaN(date.getTime())) {
      const time = String(load.commitment_time || "").trim();
      const match = time.match(/^(\d{1,2}):(\d{2})/);
      if (match) {
        date.setHours(Number(match[1]), Number(match[2]), 0, 0);
      }
      return { at: date.toISOString(), source: "commitment" };
    }
  }
  if (load.delivery_date) {
    const date = new Date(load.delivery_date);
    if (!Number.isNaN(date.getTime())) return { at: date.toISOString(), source: "scheduled" };
  }
  return { at: null, source: "none" };
};

export function buildEta(load, now = new Date()) {
  const status = norm(load?.status);

  if (DONE.includes(status) || load?.delivered_at) {
    return {
      state: "delivered",
      source: "actual",
      at: load?.delivered_at || null,
      label: "Delivered",
      detail: load?.delivered_at ? null : "Marked delivered",
    };
  }

  const { at, source } = scheduledArrival(load);
  if (!at) {
    return {
      state: "unknown",
      source: "none",
      at: null,
      label: "Delivery date to be confirmed",
      detail: "Our dispatch team will confirm the appointment.",
    };
  }

  const due = new Date(at).getTime();
  const diff = due - now.getTime();
  const moving = MOVING.includes(status);
  const notStarted = NOT_STARTED.includes(status);

  if (diff < 0) {
    return {
      state: "late",
      source,
      at,
      label: "Past the scheduled delivery",
      // Read by the public tracking page too, where there is no message thread.
      detail: "Our dispatch team is working it.",
    };
  }
  if (diff < 12 * HOUR) {
    return {
      state: moving ? "due_today" : "at_risk",
      source,
      at,
      label: moving ? "Arriving today" : "Due within 12 hours",
      detail: moving ? null : "The load has not departed yet.",
    };
  }
  if (diff < 36 * HOUR && notStarted && !moving) {
    return {
      state: "at_risk",
      source,
      at,
      label: "Due soon",
      detail: "Not yet in transit.",
    };
  }
  return { state: "on_time", source, at, label: "On schedule", detail: null };
}

/**
 * Last known position for a load, straight from the fleet tables. Returns null
 * when nothing real is recorded — the portal never shows a guessed position.
 */
export async function lastKnownPosition(load) {
  if (!load?.truck_id && !load?.driver_id) return null;

  try {
    if (load.truck_id) {
      const truck = await pool.query(
        `SELECT truck_number, current_lat, current_lng, current_location, last_ping_at, speed_mph
           FROM trucks WHERE id = $1`,
        [load.truck_id]
      );
      const t = truck.rows[0];
      if (t && (t.current_lat != null || t.current_location)) {
        return {
          unit: t.truck_number ? `Truck ${t.truck_number}` : "Assigned truck",
          lat: t.current_lat != null ? Number(t.current_lat) : null,
          lng: t.current_lng != null ? Number(t.current_lng) : null,
          place: t.current_location || null,
          speed_mph: t.speed_mph != null ? Number(t.speed_mph) : null,
          reported_at: t.last_ping_at || null,
        };
      }
    }

    if (load.driver_id) {
      const driver = await pool.query(
        `SELECT current_lat, current_lng, last_gps_updated_at FROM drivers WHERE id = $1`,
        [load.driver_id]
      );
      const d = driver.rows[0];
      if (d && d.current_lat != null && d.current_lng != null) {
        return {
          unit: "Assigned driver",
          lat: Number(d.current_lat),
          lng: Number(d.current_lng),
          place: null,
          speed_mph: null,
          reported_at: d.last_gps_updated_at || null,
        };
      }
    }
  } catch (err) {
    console.warn("lastKnownPosition warning:", err.message);
  }

  return null;
}

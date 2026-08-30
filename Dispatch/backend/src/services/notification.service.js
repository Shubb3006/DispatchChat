import { EventEmitter } from "events";
import pool from "../config/db.js";

// In-process event bus + persisted notifications.
//
// Real-time delivery is Server-Sent Events (see portal.controller.js
// dispatcherNotificationStream) — no WebSocket server exists in this app,
// and SSE works through Render/Vercel with plain HTTP. Rows are also
// persisted to the notifications table so a polling UI sees the same
// alerts after a reconnect.
export const notificationEvents = new EventEmitter();
notificationEvents.setMaxListeners(100);

export const DISPATCH_ALERT = "dispatch-alert";
export const CUSTOMER_ALERT = "customer-alert";

const DISPATCH_ROLES = ["dispatcher", "admin", "super_admin"];

/**
 * Alert every active dispatcher/admin: persist one notifications row per
 * user (best-effort) and emit a live event for connected SSE clients.
 */
export async function notifyDispatchers({ title, message, type = "RATE_REQUEST", data = {} }) {
  const event = { type, title, message, data, created_at: new Date().toISOString() };

  try {
    await pool.query(
      `
      INSERT INTO notifications (user_id, title, message)
      SELECT id, $1, $2 FROM users
      WHERE role = ANY($3) AND is_active IS NOT FALSE
      `,
      [title, message, DISPATCH_ROLES]
    );
  } catch (err) {
    console.warn("notifyDispatchers persist warning:", err.message);
  }

  notificationEvents.emit(DISPATCH_ALERT, event);
  console.log(`🔔 [Dispatcher Alert] ${title} — ${message}`);
  return event;
}

/**
 * Alert one specific user (e.g. the customer whose rate was quoted).
 */
export async function notifyUser(userId, { title, message, type = "INFO", data = {} }) {
  const event = { type, title, message, data, user_id: userId, created_at: new Date().toISOString() };

  if (userId) {
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`,
        [userId, title, message]
      );
    } catch (err) {
      console.warn("notifyUser persist warning:", err.message);
    }
  }

  notificationEvents.emit(CUSTOMER_ALERT, event);
  return event;
}

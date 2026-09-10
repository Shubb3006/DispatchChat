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
      INSERT INTO notifications (user_id, title, message, type, meta)
      SELECT id, $1, $2, $3, $4 FROM users
      WHERE role = ANY($5) AND is_active IS NOT FALSE
      `,
      [title, message, type, JSON.stringify(data || {}), DISPATCH_ROLES]
    );
  } catch (err) {
    if (err.code === "42703") {
      await pool
        .query(
          `INSERT INTO notifications (user_id, title, message)
           SELECT id, $1, $2 FROM users WHERE role = ANY($3) AND is_active IS NOT FALSE`,
          [title, message, DISPATCH_ROLES]
        )
        .catch((e) => console.warn("notifyDispatchers persist warning:", e.message));
    } else {
      console.warn("notifyDispatchers persist warning:", err.message);
    }
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
      // Persist type + meta too: the portal bell links a notification back to
      // the load or rate request it is about.
      await insertNotificationRow({
        userId,
        customerId: data?.customer_id || null,
        email: null,
        type,
        title,
        message,
        meta: data,
      });
    } catch (err) {
      console.warn("notifyUser persist warning:", err.message);
    }
  }

  notificationEvents.emit(CUSTOMER_ALERT, event);
  return event;
}

/**
 * Unified customer notification: persist an in-app row for every portal user
 * at the company, emit the live event, and optionally send the email.
 *
 * loadStatus.service.js has always called this; the export never existed,
 * which is why importing that module failed and the whole milestone path was
 * unreachable. Channels default to both.
 *
 * @returns {{channels: {inapp: {...}, email: {...}}}} an honest report of what
 *          actually happened — callers surface it, so it must not lie.
 */
export async function notify({
  customerId = null,
  userId = null,
  email = null,
  type = "INFO",
  title = "",
  body = "",
  html = null,
  meta = {},
  channels = ["email", "inapp"],
}) {
  const wantsInapp = channels.includes("inapp");
  const wantsEmail = channels.includes("email");
  const report = { channels: { inapp: { sent: false }, email: { sent: false } } };

  // --- in-app -------------------------------------------------------------
  if (wantsInapp) {
    try {
      let recipients = userId ? [userId] : [];
      if (!recipients.length && customerId) {
        const users = await pool.query(
          `SELECT id FROM users WHERE customer_id = $1 AND role = 'customer' AND is_active IS NOT FALSE`,
          [customerId]
        );
        recipients = users.rows.map((r) => r.id);
      }

      for (const recipient of recipients) {
        await insertNotificationRow({
          userId: recipient,
          customerId,
          email,
          type,
          title,
          message: body,
          meta,
        });
        notificationEvents.emit(CUSTOMER_ALERT, {
          type,
          title,
          message: body,
          data: meta,
          user_id: recipient,
          created_at: new Date().toISOString(),
        });
      }
      report.channels.inapp = { sent: recipients.length > 0, recipients: recipients.length };
    } catch (err) {
      console.warn("notify in-app warning:", err.message);
      report.channels.inapp = { sent: false, error: err.message };
    }
  }

  // --- email --------------------------------------------------------------
  if (wantsEmail && email) {
    try {
      const { sendEmail } = await import("./emailNotifier.service.js");
      const result = await sendEmail({ to: email, subject: title, text: body, html: html || undefined });
      report.channels.email = { sent: Boolean(result?.success), simulated: Boolean(result?.simulated), to: email };
    } catch (err) {
      console.warn("notify email warning:", err.message);
      report.channels.email = { sent: false, error: err.message };
    }
  }

  return report;
}

/**
 * Insert one notifications row, tolerating older deployments whose table still
 * has only the six original columns.
 */
async function insertNotificationRow({ userId, customerId, email, type, title, message, meta }) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, customer_id, email, type, title, message, meta)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, customerId, email, type, title, message, JSON.stringify(meta || {})]
    );
  } catch (err) {
    if (err.code === "42703") {
      await pool.query(`INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`, [
        userId,
        title,
        message,
      ]);
      return;
    }
    throw err;
  }
}

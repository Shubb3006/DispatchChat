import pool from "../config/db.js";
import { sendEmail } from "./emailNotifier.service.js";

/**
 * Unified notification entry point for the Ozack TMS backend.
 *
 * Usage:
 *   await notify({
 *     userId | customerId | email,          // at least one addressee
 *     type: "LOAD_DELIVERED",
 *     title: "Load #123 Delivered",
 *     body: "Plain-text body",
 *     html: "<html>...</html>",             // optional branded HTML for the email channel
 *     meta: { load_id, tracking_url },
 *     channels: ["email", "inapp"],         // defaults to ["inapp"]
 *   });
 *
 * Returns { ok, channels: { email: {...}, inapp: {...}, sms: {...}, push: {...} } }.
 * Channel results are honest: nothing is reported as sent unless it actually was.
 */

let notificationsTableEnsured = false;

/**
 * Lazily create/extend the notifications table so the feature works on next
 * boot without manual migration steps (mirrors databases/103_notifications_extend.sql).
 */
export const ensureNotificationsTable = async () => {
  if (notificationsTableEnsured) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id),
          title VARCHAR(200),
          message TEXT,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(100);
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS email VARCHAR(255);
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_customer ON notifications(customer_id);
    `);
    notificationsTableEnsured = true;
  } catch (err) {
    console.warn("notifications table verification warning:", err.message);
  }
};

/**
 * SMS adapter interface. No SMS provider is wired up yet, so this honestly
 * reports not_configured instead of fabricating a delivery receipt.
 * Swap the internals for Twilio/etc. later without touching callers.
 */
export const smsAdapter = {
  name: "sms",
  isConfigured: () => Boolean(process.env.SMS_PROVIDER_API_KEY),
  async send(/* { to, body } */) {
    return { sent: false, reason: "not_configured" };
  },
};

/**
 * Push adapter interface. Same honest contract as smsAdapter.
 */
export const pushAdapter = {
  name: "push",
  isConfigured: () => Boolean(process.env.PUSH_PROVIDER_API_KEY),
  async send(/* { to, title, body } */) {
    return { sent: false, reason: "not_configured" };
  },
};

/**
 * Resolve the best email address for the addressee.
 * Explicit email wins, then the customer record, then the user record (if the
 * users table happens to have an email column in this deployment).
 */
const resolveRecipientEmail = async ({ email, customerId, userId }) => {
  if (email) return email;

  if (customerId) {
    try {
      const r = await pool.query(`SELECT email FROM customers WHERE id = $1`, [customerId]);
      if (r.rows[0]?.email) return r.rows[0].email;
    } catch (err) {
      console.warn("notification.service: customer email lookup failed:", err.message);
    }
  }

  if (userId) {
    try {
      const r = await pool.query(`SELECT email FROM users WHERE id = $1`, [userId]);
      if (r.rows[0]?.email) return r.rows[0].email;
    } catch (err) {
      // users table has no email column in the base schema — that's fine.
    }
  }

  return null;
};

/**
 * Single notification entry point.
 */
export const notify = async ({
  userId = null,
  customerId = null,
  email = null,
  type = "GENERAL",
  title = "",
  body = "",
  html = null,
  meta = {},
  channels = ["inapp"],
} = {}) => {
  const requested = Array.isArray(channels) && channels.length ? channels : ["inapp"];
  const results = {};

  if (!userId && !customerId && !email) {
    return { ok: false, error: "no_addressee", channels: results };
  }

  // ---- in-app channel: INSERT into notifications table ----
  if (requested.includes("inapp")) {
    try {
      await ensureNotificationsTable();
      const inserted = await pool.query(
        `INSERT INTO notifications (user_id, customer_id, email, type, title, message, meta)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          userId,
          customerId,
          email,
          String(type).slice(0, 100),
          String(title || "").slice(0, 200),
          body || "",
          JSON.stringify(meta || {}),
        ]
      );
      results.inapp = { sent: true, id: inserted.rows[0].id };
    } catch (err) {
      console.error("notification.service: in-app insert failed:", err.message);
      results.inapp = { sent: false, reason: err.message };
    }
  }

  // ---- email channel: existing nodemailer transport via emailNotifier ----
  if (requested.includes("email")) {
    try {
      const to = await resolveRecipientEmail({ email, customerId, userId });
      if (!to) {
        results.email = { sent: false, reason: "no_recipient_email" };
      } else {
        const sendResult = await sendEmail({
          to,
          subject: title || type,
          html: html || undefined,
          text: body || title || "",
        });
        if (sendResult.success && !sendResult.simulated) {
          results.email = { sent: true, to, messageId: sendResult.messageId || null };
        } else if (sendResult.success && sendResult.simulated) {
          // SMTP transport is not configured — be honest about it.
          results.email = { sent: false, to, reason: "smtp_not_configured" };
        } else {
          results.email = { sent: false, to, reason: sendResult.error || sendResult.reason || "send_failed" };
        }
      }
    } catch (err) {
      console.error("notification.service: email channel failed:", err.message);
      results.email = { sent: false, reason: err.message };
    }
  }

  // ---- sms / push channels: adapter interfaces, honest not_configured ----
  if (requested.includes("sms")) {
    try {
      results.sms = await smsAdapter.send({ to: meta?.phone || null, body: body || title });
    } catch (err) {
      results.sms = { sent: false, reason: err.message };
    }
  }

  if (requested.includes("push")) {
    try {
      results.push = await pushAdapter.send({ to: userId, title, body });
    } catch (err) {
      results.push = { sent: false, reason: err.message };
    }
  }

  const anySent = Object.values(results).some((r) => r && r.sent);
  return { ok: anySent, channels: results };
};

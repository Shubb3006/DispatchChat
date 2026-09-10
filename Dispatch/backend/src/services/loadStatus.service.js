import crypto from "crypto";
import pool from "../config/db.js";
import { recordAuditLog } from "./auditLogger.service.js";
import { notifyDispatchers } from "./notification.service.js";
import { buildLoadMilestoneEmail } from "./emailNotifier.service.js";

/**
 * loadStatus.service — THE single choke point for load status transitions.
 *
 * updateLoadStatus(loadId, newStatus, { actor, source, meta, req })
 *   - resolves the load by UUID or load_number
 *   - updates loads.status (+ stamps delivered_at on first delivery)
 *   - cascades the trip status (moved from load.controller)
 *   - records an audit log entry
 *   - on milestone transitions, emails the customer a branded update with a
 *     public tracking link (respecting customers.notify_prefs.milestones)
 *
 * Both the HTTP endpoints and future callers (geofence worker, etc.) go
 * through this function.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value) => UUID_RE.test(String(value || "").trim());

let trackingColumnsEnsured = false;

/**
 * Lazily add the columns from migrations 101/102 so the feature works on the
 * next boot without manual migration steps.
 */
export const ensureLoadTrackingColumns = async () => {
  if (trackingColumnsEnsured) return;
  try {
    await pool.query(`
      ALTER TABLE loads ADD COLUMN IF NOT EXISTS tracking_token TEXT;
      ALTER TABLE loads ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
      ALTER TABLE loads ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_loads_tracking_token ON loads(tracking_token);
      CREATE INDEX IF NOT EXISTS idx_loads_customer_id ON loads(customer_id);
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS notify_prefs JSONB NOT NULL DEFAULT '{}'::jsonb;
    `);
    trackingColumnsEnsured = true;
  } catch (err) {
    console.warn("loads tracking columns verification warning:", err.message);
  }
};

export const generateTrackingToken = () => crypto.randomBytes(16).toString("hex");

/**
 * Return the load's tracking token, generating and persisting one if missing
 * (lazy backfill for rows created before migration 101).
 */
export const ensureTrackingToken = async (load) => {
  if (!load) return null;
  if (load.tracking_token) return load.tracking_token;

  await ensureLoadTrackingColumns();
  const token = generateTrackingToken();
  try {
    const updated = await pool.query(
      `UPDATE loads SET tracking_token = $1 WHERE id = $2 AND tracking_token IS NULL RETURNING tracking_token`,
      [token, load.id]
    );
    if (updated.rows.length > 0) {
      load.tracking_token = updated.rows[0].tracking_token;
      return load.tracking_token;
    }
    // Another writer raced us — read back the winning token
    const reread = await pool.query(`SELECT tracking_token FROM loads WHERE id = $1`, [load.id]);
    load.tracking_token = reread.rows[0]?.tracking_token || null;
    return load.tracking_token;
  } catch (err) {
    console.warn("ensureTrackingToken warning:", err.message);
    return null;
  }
};

export const buildPublicTrackingUrl = (tokenOrLoadNumber) => {
  const base = process.env.PUBLIC_TRACKING_BASE_URL || process.env.APP_URL || "http://localhost:5173";
  return `${String(base).replace(/\/+$/, "")}/track/${tokenOrLoadNumber}`;
};

/**
 * Find a load by UUID id or by exact load_number (never mixes the two in one
 * WHERE clause — "id = $1 OR load_number = $1" throws on uuid columns for
 * non-uuid input).
 */
export const findLoadByIdOrNumber = async (loadId) => {
  const value = String(loadId || "").trim();
  if (!value) return null;
  const result = isUuid(value)
    ? await pool.query(`SELECT * FROM loads WHERE id = $1`, [value])
    : await pool.query(`SELECT * FROM loads WHERE load_number = $1`, [value]);
  return result.rows[0] || null;
};

/**
 * Trip status cascade (moved verbatim from load.controller so every status
 * writer shares it):
 *   All delivered           -> completed
 *   Any in_transit          -> in_transit
 *   Any dispatched          -> dispatched
 *   All at_warehouse        -> at_warehouse
 *   Any picked_up           -> picked_up
 *   Default                 -> pending
 */
export const cascadeTripStatus = async (loadId) => {
  const tripResult = await pool.query(
    `SELECT trip_id FROM trip_loads WHERE load_id = $1`,
    [loadId]
  );

  if (tripResult.rows.length === 0) return null;

  const tripId = tripResult.rows[0].trip_id;

  const loadsResult = await pool.query(
    `SELECT l.status
     FROM trip_loads tl
     JOIN loads l ON tl.load_id = l.id
     WHERE tl.trip_id = $1`,
    [tripId]
  );

  const statuses = loadsResult.rows.map((row) => row.status?.toLowerCase());

  let tripStatus = "pending";

  if (statuses.every((s) => s === "delivered")) {
    tripStatus = "completed";
  } else if (statuses.some((s) => s === "in_transit")) {
    tripStatus = "in_transit";
  } else if (statuses.some((s) => s === "dispatched")) {
    tripStatus = "dispatched";
  } else if (statuses.every((s) => s === "at_warehouse")) {
    tripStatus = "at_warehouse";
  } else if (statuses.some((s) => s === "picked_up")) {
    tripStatus = "picked_up";
  }

  await pool.query(`UPDATE trips SET status = $1 WHERE id = $2`, [tripStatus, tripId]);

  return tripStatus;
};

const normalizeStatus = (status) =>
  String(status || "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");

/**
 * Map a raw status to a customer-facing milestone using the codebase's
 * existing status vocabulary (case-insensitively). Non-milestone statuses
 * (entered, pending, pickup_assigned, at_warehouse, dispatched...) return null.
 */
export const milestoneForStatus = (status) => {
  const s = normalizeStatus(status);
  if (!s) return null;
  if (s === "picked_up") return { key: "picked_up", label: "Picked Up" };
  if (s === "in_transit") return { key: "in_transit", label: "In Transit" };
  if (s === "delivered") return { key: "delivered", label: "Delivered" };
  if (s.includes("delay") || s.includes("exception")) return { key: "exception", label: "Delayed" };
  return null;
};

/**
 * Resolve the customers record for a load (by loads.customer_id first, then
 * by matching customer_email).
 */
export const resolveCustomerForLoad = async (load) => {
  if (!load) return null;
  try {
    if (load.customer_id) {
      const byId = await pool.query(`SELECT * FROM customers WHERE id = $1`, [load.customer_id]);
      if (byId.rows[0]) return byId.rows[0];
    }
    if (load.customer_email) {
      const byEmail = await pool.query(
        `SELECT * FROM customers WHERE LOWER(email) = LOWER($1) ORDER BY created_at ASC LIMIT 1`,
        [load.customer_email]
      );
      if (byEmail.rows[0]) return byEmail.rows[0];
    }
  } catch (err) {
    console.warn("resolveCustomerForLoad warning:", err.message);
  }
  return null;
};

/**
 * Read a boolean preference from customers.notify_prefs with a default.
 * notify_prefs keys: milestones (default true), pod (default true).
 */
export const notifyPrefEnabled = (customer, key, defaultValue = true) => {
  const prefs = customer?.notify_prefs;
  if (!prefs || typeof prefs !== "object") return defaultValue;
  if (prefs[key] === undefined || prefs[key] === null) return defaultValue;
  return prefs[key] !== false;
};

/**
 * Send the customer a branded milestone email (+ in-app record) if:
 *   - the new status is a milestone,
 *   - the status actually changed,
 *   - the load's customer has a notification email,
 *   - the customer has not opted out via notify_prefs.milestones.
 * Returns an honest summary of what happened.
 */
export const notifyMilestoneIfNeeded = async (load, previousStatus, { source = "api" } = {}) => {
  const milestone = milestoneForStatus(load?.status);
  if (!milestone) return { sent: false, reason: "not_a_milestone" };
  if (previousStatus !== undefined && previousStatus !== null &&
      normalizeStatus(previousStatus) === normalizeStatus(load.status)) {
    return { sent: false, reason: "status_unchanged" };
  }

  const customer = await resolveCustomerForLoad(load);
  const recipientEmail = customer?.email || load.customer_email || null;

  // No email on file is not a reason to stay silent: the portal bell still
  // fires for every user at that company.
  if (!recipientEmail && !customer?.id) {
    return { sent: false, reason: "no_customer_contact" };
  }
  if (!notifyPrefEnabled(customer, "milestones", true)) {
    return { sent: false, reason: "customer_opted_out" };
  }

  // Per-milestone switches from the portal's notification settings:
  // notify_prefs = { email: bool, milestones: { picked_up: bool, ... } }
  const prefs = customer?.notify_prefs || {};
  const milestonePrefs = prefs.milestones && typeof prefs.milestones === "object" ? prefs.milestones : null;
  if (milestonePrefs && milestonePrefs[milestone.key] === false) {
    return { sent: false, reason: "milestone_opted_out" };
  }
  // Email can be muted while the in-app bell keeps working.
  const channels = prefs.email === false || !recipientEmail ? ["inapp"] : ["email", "inapp"];

  const token = await ensureTrackingToken(load);
  const trackingUrl = buildPublicTrackingUrl(token || load.load_number || load.id);

  const emailContent = buildLoadMilestoneEmail({
    load,
    milestoneLabel: milestone.label,
    trackingUrl,
  });

  const result = await notifyDispatchers({
    title: emailContent.subject,
    message: emailContent.text,
    type: `LOAD_${milestone.key.toUpperCase()}`,
    data: {
      customerId: customer?.id || null,
      email: recipientEmail,
      trackingUrl,
      html: emailContent.html,
      load_id: load.id,
      load_number: load.load_number || null,
      status: load.status,
      previous_status: previousStatus ?? null,
      source,
    },
    channels,
  });

  return {
    sent: Boolean(result.channels?.email?.sent),
    milestone: milestone.key,
    to: recipientEmail,
    channels: result.channels,
  };
};

/**
 * THE single entry point for load status transitions.
 *
 * @param {string} loadId - loads.id (uuid) or loads.load_number
 * @param {string} newStatus - new status value (existing vocabulary)
 * @param {object} options - { actor: {id, username, role}, source, meta, req }
 * @returns {{ok: boolean, error?: string, load?: object, tripStatus?: string|null, notification?: object}}
 */
export const updateLoadStatus = async (loadId, newStatus, options = {}) => {
  const { actor = null, source = "api", meta = {}, req = null } = options;

  if (!loadId || !newStatus) {
    return { ok: false, error: "load_id_and_status_required" };
  }

  await ensureLoadTrackingColumns();

  const existing = await findLoadByIdOrNumber(loadId);
  if (!existing) {
    return { ok: false, error: "not_found" };
  }

  const previousStatus = existing.status;

  const updated = await pool.query(
    `UPDATE loads
     SET status = $1,
         delivered_at = CASE
           WHEN LOWER(TRIM($1)) = 'delivered' THEN COALESCE(delivered_at, CURRENT_TIMESTAMP)
           ELSE delivered_at
         END
     WHERE id = $2
     RETURNING *`,
    [newStatus, existing.id]
  );

  const load = updated.rows[0];

  // Trip lifecycle cascade (single shared implementation)
  let tripStatus = null;
  try {
    tripStatus = await cascadeTripStatus(load.id);
  } catch (err) {
    console.error("Trip status cascade failed:", err.message);
  }

  // Audit log (kept from the original endpoint behavior)
  await recordAuditLog({
    req,
    userId: actor?.id || null,
    username: actor?.username || null,
    userRole: actor?.role || null,
    action: "STATUS_CHANGED",
    entityType: "LOAD",
    entityId: load.id,
    entityIdentifier: `Load #${load.load_number || load.id}`,
    changeSummary: `Changed load #${load.load_number || load.id} status to ${String(newStatus).toUpperCase()}`,
    details: {
      previous_status: previousStatus,
      new_status: newStatus,
      source,
      updated_at: new Date().toISOString(),
      ...meta,
    },
  });

  // Customer milestone notification (never fails the transition)
  let notification = null;
  try {
    notification = await notifyMilestoneIfNeeded(load, previousStatus, { source });
  } catch (err) {
    console.error("Milestone notification failed:", err.message);
    notification = { sent: false, reason: err.message };
  }

  return { ok: true, load, tripStatus, notification };
};

/**
 * Customs is the part of a cross-border move a broker worries about most, so
 * the portal treats a customs transition like a milestone: bell + optional
 * email, honouring notify_prefs.milestones.customs.
 *
 * Silent (returns a reason, never throws) when the load is not cross-border,
 * has no customer, or the status is one customers should not be shown.
 */
const CUSTOMER_VISIBLE_CUSTOMS = {
  SUBMITTED_TO_BROKER: { label: "Customs entry filed", detail: "Your entry has been submitted ahead of the crossing." },
  ACCEPTED: { label: "Cleared at the border", detail: "Customs released this shipment." },
  CLEARED: { label: "Cleared at the border", detail: "Customs released this shipment." },
  RELEASED: { label: "Cleared at the border", detail: "Customs released this shipment." },
  REJECTED: { label: "Customs needs attention", detail: "Our customs desk is working it — reply in the portal if you have the missing paperwork." },
  TIMEOUT: { label: "Customs needs attention", detail: "The filing did not confirm in time; our customs desk is re-submitting." },
};

export const notifyCustomsStatusIfNeeded = async (loadIdOrNumber, newStatus) => {
  try {
    const status = String(newStatus || "").toUpperCase();
    const milestone = CUSTOMER_VISIBLE_CUSTOMS[status];
    if (!milestone) return { sent: false, reason: "not_customer_visible" };

    const load = await findLoadByIdOrNumber(loadIdOrNumber);
    if (!load || !load.customer_id) return { sent: false, reason: "no_customer" };

    const customer = await resolveCustomerForLoad(load);
    const prefs = customer?.notify_prefs || {};
    const milestonePrefs = prefs.milestones && typeof prefs.milestones === "object" ? prefs.milestones : null;
    if (milestonePrefs && milestonePrefs.customs === false) {
      return { sent: false, reason: "customs_opted_out" };
    }

    const email = prefs.email === false ? null : customer?.email || load.customer_email || null;

    return await notify({
      customerId: load.customer_id,
      email,
      type: "CUSTOMS_STATUS",
      title: `${milestone.label} — Load NISHAN-${load.load_number}`,
      body: `${milestone.detail} (${load.origin} → ${load.destination})`,
      meta: { load_id: load.id, load_number: load.load_number, customs_status: status },
      channels: email ? ["email", "inapp"] : ["inapp"],
    });
  } catch (err) {
    console.warn("notifyCustomsStatusIfNeeded warning:", err.message);
    return { sent: false, reason: err.message };
  }
};

import pool from "../config/db.js";
import { notify } from "./notification.service.js";
import { resolveCustomerForLoad, ensureLoadTrackingColumns } from "./loadStatus.service.js";

/**
 * detention.service — persistent detention billing backed by detention_events.
 *
 * Lifecycle: the geofence worker opens an event on stop ENTER and closes it on
 * EXIT (dwell/billable/amount computed here). Dispatch can then move a closed
 * event through claimed → invoiced (via a real invoices row) or written_off.
 *
 * Tables/columns are also created lazily (mirrors migrations 122 and 123)
 * per the codebase convention.
 */

export const DETENTION_STATUSES = ["active", "closed", "claimed", "invoiced", "written_off"];

// Forward-only business transitions for PATCH /api/detention/:id
export const DETENTION_TRANSITIONS = {
  active: ["closed", "written_off"],
  closed: ["claimed", "invoiced", "written_off"],
  claimed: ["invoiced", "written_off"],
  invoiced: ["written_off"],
  written_off: [],
};

const DEFAULT_FREE_MINUTES = 120;
const DEFAULT_RATE_PER_HOUR = 75;

let detentionTablesEnsured = false;

/**
 * Lazily apply migrations 122 (detention_events) and 123 (customer detention
 * settings). The invoices table is created first with the exact definition
 * used by invoice.controller so the detention_events FK (and invoice
 * generation) work on a fresh database.
 */
export const ensureDetentionTables = async () => {
  if (detentionTablesEnsured) return;
  try {
    await ensureLoadTrackingColumns();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          load_id UUID REFERENCES loads(id) ON DELETE SET NULL,
          shipment_id VARCHAR(100),
          tracking_number VARCHAR(100),
          customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
          customer_name VARCHAR(255),
          issue_date DATE DEFAULT CURRENT_DATE,
          due_date DATE,
          subtotal NUMERIC(12, 2) DEFAULT 0.00,
          tax NUMERIC(12, 2) DEFAULT 0.00,
          total NUMERIC(12, 2) DEFAULT 0.00,
          status VARCHAR(50) DEFAULT 'draft',
          payment_terms VARCHAR(50) DEFAULT 'Net 30',
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS detention_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
        stop_id UUID NOT NULL REFERENCES load_stops(id) ON DELETE CASCADE,
        location_name TEXT NOT NULL,
        arrived_at TIMESTAMP NOT NULL,
        departed_at TIMESTAMP,
        free_time_minutes INT DEFAULT 0,
        dwell_minutes INT DEFAULT 0,
        billable_minutes INT DEFAULT 0,
        rate_per_hour NUMERIC(10, 2) DEFAULT 75.00,
        amount NUMERIC(12, 2) DEFAULT 0.00,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'claimed', 'invoiced', 'written_off')),
        invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_detention_events_load_id ON detention_events(load_id);
      CREATE INDEX IF NOT EXISTS idx_detention_events_stop_id ON detention_events(stop_id);
      CREATE INDEX IF NOT EXISTS idx_detention_events_status ON detention_events(status);
      CREATE INDEX IF NOT EXISTS idx_detention_events_invoice_id ON detention_events(invoice_id);

      ALTER TABLE customers ADD COLUMN IF NOT EXISTS detention_free_minutes INT DEFAULT 120;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS detention_rate_per_hour NUMERIC(10, 2) DEFAULT 75.00;
    `);
    detentionTablesEnsured = true;
  } catch (err) {
    console.warn("detention tables verification warning:", err.message);
  }
};

const round2 = (n) => Math.round(Number(n) * 100) / 100;

/**
 * Free time / hourly rate for a load: the load's customer settings when the
 * customer can be resolved, else the documented defaults (120 min / $75/hr).
 */
export async function resolveDetentionTerms(load) {
  let freeMinutes = DEFAULT_FREE_MINUTES;
  let ratePerHour = DEFAULT_RATE_PER_HOUR;
  try {
    const customer = await resolveCustomerForLoad(load);
    if (customer) {
      const free = parseInt(customer.detention_free_minutes, 10);
      const rate = Number(customer.detention_rate_per_hour);
      if (Number.isFinite(free) && free >= 0) freeMinutes = free;
      if (Number.isFinite(rate) && rate >= 0) ratePerHour = rate;
    }
  } catch (err) {
    console.warn("detention: customer terms lookup failed:", err.message);
  }
  return { freeMinutes, ratePerHour };
}

/**
 * Open a detention event when a truck ENTERS a stop geofence.
 * Idempotent per (load, stop): an existing active event is returned untouched.
 */
export async function openDetentionEvent({ load, stopId, locationName, arrivedAt = new Date() }) {
  await ensureDetentionTables();

  const existing = await pool.query(
    `SELECT * FROM detention_events WHERE load_id = $1 AND stop_id = $2 AND status = 'active' LIMIT 1`,
    [load.id, stopId]
  );
  if (existing.rows[0]) return { opened: false, event: existing.rows[0] };

  const { freeMinutes, ratePerHour } = await resolveDetentionTerms(load);

  const res = await pool.query(
    `INSERT INTO detention_events
       (load_id, stop_id, location_name, arrived_at, free_time_minutes, rate_per_hour, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'active')
     RETURNING *`,
    [load.id, stopId, locationName || "Unknown facility", arrivedAt, freeMinutes, ratePerHour]
  );
  return { opened: true, event: res.rows[0] };
}

/**
 * Notify dispatch that a detention event closed with billable time.
 * Addressee: the load's dispatcher user, plus the optional
 * DETENTION_NOTIFY_EMAIL mailbox. Honest result — nothing reported sent
 * unless notification.service actually sent it.
 */
async function notifyDetentionClosed(event) {
  try {
    const loadRes = await pool.query(
      `SELECT id, load_number, dispatcher_id FROM loads WHERE id = $1`,
      [event.load_id]
    );
    const load = loadRes.rows[0] || {};
    const dispatchEmail = process.env.DETENTION_NOTIFY_EMAIL || null;

    if (!load.dispatcher_id && !dispatchEmail) {
      return { sent: false, reason: "no_dispatch_addressee" };
    }

    const amount = round2(event.amount);
    const result = await notify({
      userId: load.dispatcher_id || null,
      email: dispatchEmail,
      type: "DETENTION_BILLABLE",
      title: `Detention: Load #${load.load_number || event.load_id} — $${amount.toFixed(2)} billable`,
      body:
        `Detention closed at ${event.location_name}. ` +
        `Dwell ${event.dwell_minutes} min (free ${event.free_time_minutes} min), ` +
        `billable ${event.billable_minutes} min @ $${Number(event.rate_per_hour).toFixed(2)}/hr = $${amount.toFixed(2)}.`,
      meta: {
        detention_event_id: event.id,
        load_id: event.load_id,
        stop_id: event.stop_id,
        dwell_minutes: event.dwell_minutes,
        billable_minutes: event.billable_minutes,
        amount,
      },
      channels: ["email", "inapp"],
    });
    return { sent: Boolean(result.ok), channels: result.channels };
  } catch (err) {
    console.warn("detention: dispatch notification failed:", err.message);
    return { sent: false, reason: err.message };
  }
}

/**
 * Close a detention event: compute dwell/billable/amount and mark it closed.
 * Zero-billable rows are kept (amount 0) for facility analytics.
 * Notifies dispatch when billable_minutes > 0.
 */
export async function closeDetentionEvent(detentionId, departedAt = new Date()) {
  await ensureDetentionTables();

  const res = await pool.query(`SELECT * FROM detention_events WHERE id = $1`, [detentionId]);
  const event = res.rows[0];
  if (!event) return { ok: false, error: "not_found" };
  if (event.status !== "active") return { ok: false, error: "not_active" };

  const departed = departedAt instanceof Date ? departedAt : new Date(departedAt);
  const dwellMs = departed.getTime() - new Date(event.arrived_at).getTime();
  const dwellMinutes = Math.max(0, Math.round(dwellMs / 60000));
  const freeMinutes = parseInt(event.free_time_minutes, 10) || 0;
  const billableMinutes = Math.max(0, dwellMinutes - freeMinutes);
  const ratePerHour = Number(event.rate_per_hour) || 0;
  const amount = round2((billableMinutes / 60) * ratePerHour);

  const updated = await pool.query(
    `UPDATE detention_events
        SET departed_at = $1,
            dwell_minutes = $2,
            billable_minutes = $3,
            amount = $4,
            status = 'closed',
            updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND status = 'active'
      RETURNING *`,
    [departed, dwellMinutes, billableMinutes, amount, detentionId]
  );
  const closedEvent = updated.rows[0];
  if (!closedEvent) return { ok: false, error: "not_active" };

  let notification = null;
  if (billableMinutes > 0) {
    notification = await notifyDetentionClosed(closedEvent);
  }

  return { ok: true, event: closedEvent, notification };
}

/**
 * Close the active detention event for a load/stop pair (worker EXIT path).
 */
export async function closeDetentionForStop(loadId, stopId, departedAt = new Date()) {
  await ensureDetentionTables();
  const res = await pool.query(
    `SELECT id FROM detention_events WHERE load_id = $1 AND stop_id = $2 AND status = 'active' LIMIT 1`,
    [loadId, stopId]
  );
  if (!res.rows[0]) return { ok: false, error: "no_active_event" };
  return closeDetentionEvent(res.rows[0].id, departedAt);
}

/** One detention event with load/stop context, or null. */
export async function getDetentionEvent(id) {
  await ensureDetentionTables();
  const res = await pool.query(
    `SELECT de.*,
            l.load_number, l.customer_name AS load_customer_name, l.customer_id AS load_customer_id,
            ls.stop_type, ls.city AS stop_city, ls.state AS stop_state
       FROM detention_events de
       LEFT JOIN loads l ON l.id = de.load_id
       LEFT JOIN load_stops ls ON ls.id = de.stop_id
      WHERE de.id = $1`,
    [id]
  );
  return res.rows[0] || null;
}

/**
 * PATCH-style status transition with forward-only business rules.
 * Transitioning active → closed goes through the real closure computation.
 * Transitioning to invoiced requires an already-linked invoice
 * (POST /:id/generate-invoice is the honest path).
 */
export async function updateDetentionStatus(detentionId, newStatus) {
  await ensureDetentionTables();

  if (!DETENTION_STATUSES.includes(newStatus)) {
    return { ok: false, error: "invalid_status" };
  }

  const res = await pool.query(`SELECT * FROM detention_events WHERE id = $1`, [detentionId]);
  const event = res.rows[0];
  if (!event) return { ok: false, error: "not_found" };

  if (event.status === newStatus) {
    return { ok: false, error: "status_unchanged" };
  }
  const allowed = DETENTION_TRANSITIONS[event.status] || [];
  if (!allowed.includes(newStatus)) {
    return { ok: false, error: "invalid_transition", from: event.status, to: newStatus, allowed };
  }
  if (newStatus === "invoiced" && !event.invoice_id) {
    return { ok: false, error: "use_generate_invoice" };
  }

  if (newStatus === "closed" && event.status === "active") {
    // Manual close: same dwell/billable computation + dispatch notification.
    return closeDetentionEvent(detentionId, new Date());
  }

  const updated = await pool.query(
    `UPDATE detention_events
        SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *`,
    [newStatus, detentionId]
  );
  return { ok: true, event: updated.rows[0] };
}

/**
 * Create a REAL invoices row for a billable detention event and link it.
 * Uses the invoices column conventions from invoice.controller
 * (subtotal/tax/total, issue_date/due_date, status, payment_terms, notes).
 */
export async function generateInvoice(detentionId, { customerId = null } = {}) {
  await ensureDetentionTables();

  const res = await pool.query(`SELECT * FROM detention_events WHERE id = $1`, [detentionId]);
  const event = res.rows[0];
  if (!event) return { ok: false, error: "not_found" };
  if (event.invoice_id) return { ok: false, error: "already_invoiced" };
  if (event.status === "active") return { ok: false, error: "not_closed" };
  if (!["closed", "claimed"].includes(event.status)) {
    return { ok: false, error: "invalid_transition", from: event.status, to: "invoiced" };
  }

  const billableMinutes = parseInt(event.billable_minutes, 10) || 0;
  const amount = round2(event.amount);
  if (billableMinutes <= 0 || amount <= 0) return { ok: false, error: "zero_billable" };

  const loadRes = await pool.query(
    `SELECT id, load_number, customer_id, customer_email, customer_name FROM loads WHERE id = $1`,
    [event.load_id]
  );
  const load = loadRes.rows[0] || null;

  // Resolve the billed customer: explicit override, else the load's customer.
  let resolvedCustomerId = customerId || load?.customer_id || null;
  let resolvedCustomerName = load?.customer_name || null;
  try {
    if (resolvedCustomerId) {
      const c = await pool.query(`SELECT id, company_name FROM customers WHERE id = $1`, [
        resolvedCustomerId,
      ]);
      if (c.rows[0]) {
        resolvedCustomerName = c.rows[0].company_name || resolvedCustomerName;
      } else if (customerId) {
        return { ok: false, error: "customer_not_found" };
      }
    } else if (load) {
      const customer = await resolveCustomerForLoad(load);
      if (customer) {
        resolvedCustomerId = customer.id;
        resolvedCustomerName = customer.company_name || resolvedCustomerName;
      }
    }
  } catch (err) {
    console.warn("detention: invoice customer resolution warning:", err.message);
  }

  const notes =
    `Detention charge — Load #${load?.load_number || event.load_id} at ${event.location_name}: ` +
    `${event.dwell_minutes} min dwell (${event.free_time_minutes} min free), ` +
    `${billableMinutes} min billable @ $${Number(event.rate_per_hour).toFixed(2)}/hr. ` +
    `Detention event ${event.id}.`;

  const invoiceRes = await pool.query(
    `INSERT INTO invoices
       (load_id, customer_id, customer_name, issue_date, due_date,
        subtotal, tax, total, status, payment_terms, notes)
     VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days',
             $4, 0.00, $4, 'draft', 'Net 30', $5)
     RETURNING *`,
    [
      event.load_id,
      resolvedCustomerId,
      resolvedCustomerName || "General Consignee",
      amount,
      notes,
    ]
  );
  const invoice = invoiceRes.rows[0];

  const updated = await pool.query(
    `UPDATE detention_events
        SET invoice_id = $1, status = 'invoiced', updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *`,
    [invoice.id, detentionId]
  );

  return { ok: true, invoice, event: updated.rows[0] };
}

export const detentionService = {
  DETENTION_STATUSES,
  DETENTION_TRANSITIONS,
  ensureDetentionTables,
  resolveDetentionTerms,
  openDetentionEvent,
  closeDetentionEvent,
  closeDetentionForStop,
  getDetentionEvent,
  updateDetentionStatus,
  generateInvoice,
};

export default detentionService;

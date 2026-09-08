import pool from "../config/db.js";
import { notifyDispatchers } from "./notification.service.js";
import { ensureGeofenceTables } from "./geofence.service.js";

/**
 * detention.service — real facility dwell tracking + accessorial billing.
 *
 * Tables (mirrors databases/122_detention_events.sql, 123_customers_detention_settings.sql)
 * are self-ensured on boot. No fixture data: all reads are real SQL queries.
 * Empty detention_events return empty arrays.
 *
 * Core flows:
 *   - openDetentionEvent: insert detention_events row when truck enters (ENTER event)
 *   - closeDetentionForStop: calculate dwell/billable/amount, stamp departed_at, persist
 *   - getActiveDwellEvents: join detention_events to loads/trucks/drivers/stops, compute KPIs
 *   - getCompletedClaims: closed + invoiced detention_events
 *   - generateInvoice: persist invoice row (or update detention_events.invoice_id)
 */

let detentionTablesEnsured = false;

// ---------------------------------------------------------------------------
// Schema ensure (CREATE TABLE IF NOT EXISTS pattern)
// ---------------------------------------------------------------------------

export async function ensureDetentionTables() {
  if (detentionTablesEnsured) return;
  try {
    await ensureGeofenceTables(); // geofence_events must exist first

    await pool.query(`
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
    console.warn("Detention tables verification warning:", err.message);
  }
}

// ---------------------------------------------------------------------------
// Open a detention event when truck enters a facility
// ---------------------------------------------------------------------------

/**
 * Insert a detention_events row when geofence ENTER happens. The free_time
 * comes from the customer settings on the load's customer_id, or uses the
 * default 2 hours (120 minutes). Billing rate defaults to $75/hr.
 *
 * @param {object} load - loads row with customer_id
 * @param {string} stopId - load_stops.id
 * @param {string} locationName - human-readable stop name
 * @param {Date} arrivedAt - when the enter event fired
 * @returns {{ok: boolean, event?: object, error?: string}}
 */
export async function openDetentionEvent({ load, stopId, locationName, arrivedAt = new Date() }) {
  await ensureDetentionTables();

  if (!load || !load.id || !stopId) {
    return { ok: false, error: "load and stopId required" };
  }

  try {
    // Resolve free_time and rate from customer settings (if customer_id is set).
    let freeTimeMinutes = 120; // default
    let ratePerHour = 75.0; // default
    if (load.customer_id) {
      const custResult = await pool.query(
        `SELECT detention_free_minutes, detention_rate_per_hour FROM customers WHERE id = $1`,
        [load.customer_id]
      );
      if (custResult.rows[0]) {
        if (custResult.rows[0].detention_free_minutes !== null) {
          freeTimeMinutes = Number(custResult.rows[0].detention_free_minutes);
        }
        if (custResult.rows[0].detention_rate_per_hour !== null) {
          ratePerHour = Number(custResult.rows[0].detention_rate_per_hour);
        }
      }
    }

    const result = await pool.query(
      `
      INSERT INTO detention_events (load_id, stop_id, location_name, arrived_at, free_time_minutes, rate_per_hour, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'active')
      RETURNING *
      `,
      [load.id, stopId, locationName, arrivedAt, freeTimeMinutes, ratePerHour]
    );

    return { ok: true, event: result.rows[0] };
  } catch (err) {
    console.error("openDetentionEvent error:", err.message);
    return { ok: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Close detention and calculate billable time
// ---------------------------------------------------------------------------

/**
 * Close a detention event: calculate dwell (departed - arrived), subtract free
 * time, compute billable minutes, and amount = billable_minutes / 60 * rate_per_hour.
 * Notifies dispatchers if billable > 0.
 *
 * @param {string} loadId - loads.id
 * @param {string} stopId - load_stops.id
 * @param {Date} departedAt - when the exit event fired
 * @returns {{ok: boolean, event?: object, error?: string}}
 */
export async function closeDetentionForStop(loadId, stopId, departedAt = new Date()) {
  await ensureDetentionTables();

  if (!loadId || !stopId) {
    return { ok: false, error: "loadId and stopId required" };
  }

  try {
    // Find the open detention event for this stop.
    const openResult = await pool.query(
      `
      SELECT * FROM detention_events
      WHERE load_id = $1 AND stop_id = $2 AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [loadId, stopId]
    );

    if (openResult.rows.length === 0) {
      return { ok: false, error: "no_open_detention_event" };
    }

    const event = openResult.rows[0];
    const arrivedAt = new Date(event.arrived_at);
    const departedTime = new Date(departedAt);
    const dwellMs = departedTime - arrivedAt;
    const dwellMinutes = Math.max(0, Math.round(dwellMs / 1000 / 60));
    const freeTimeMinutes = Number(event.free_time_minutes || 120);
    const billableMinutes = Math.max(0, dwellMinutes - freeTimeMinutes);
    const ratePerHour = Number(event.rate_per_hour || 75.0);
    const amount = Number(((billableMinutes / 60) * ratePerHour).toFixed(2));

    // Update detention_events: set departed_at, compute minutes/amount, close it.
    const updateResult = await pool.query(
      `
      UPDATE detention_events
      SET departed_at = $2,
          dwell_minutes = $3,
          billable_minutes = $4,
          amount = $5,
          status = CASE WHEN $4 > 0 THEN 'closed' ELSE 'closed' END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [event.id, departedTime, dwellMinutes, billableMinutes, amount]
    );

    const closedEvent = updateResult.rows[0];

    // Notify dispatchers if this detention is billable.
    if (billableMinutes > 0) {
      const loadNumber = (await pool.query(`SELECT load_number FROM loads WHERE id = $1`, [loadId]))
        .rows[0]?.load_number || loadId;
      const billableHours = (billableMinutes / 60).toFixed(1);
      await notifyDispatchers({
        title: "🔔 Detention Charge Accrued",
        message: `Load #${loadNumber} at ${closedEvent.location_name}: ${billableHours}h billable ($${amount} CAD)`,
        type: "DETENTION_BILLABLE",
        data: {
          load_id: loadId,
          load_number: loadNumber,
          detention_event_id: closedEvent.id,
          location_name: closedEvent.location_name,
          billable_minutes: billableMinutes,
          amount,
        },
      });
    }

    return { ok: true, event: closedEvent };
  } catch (err) {
    console.error("closeDetentionForStop error:", err.message);
    return { ok: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Read model: live dwell events (for the detention UI radar)
// ---------------------------------------------------------------------------

/**
 * Active detention events joined to loads/trucks/drivers/stops, with computed
 * current dwell time and warning levels. Empty table -> empty array.
 *
 * @returns {Promise<Array>} [{id, loadNumber, truckNumber, driverName, ..., dwellHours, billableHours, ...}]
 */
export async function getActiveDwellEvents() {
  await ensureDetentionTables();
  try {
    const result = await pool.query(
      `
      SELECT de.id, de.load_id, de.stop_id, de.location_name, de.arrived_at, de.departed_at,
             de.free_time_minutes, de.dwell_minutes, de.billable_minutes,
             de.rate_per_hour, de.amount, de.status,
             l.load_number, l.customer_id,
             t.truck_number, d.id AS driver_id,
             COALESCE(u.full_name, u.username) AS driver_name,
             ls.lat, ls.lng
      FROM detention_events de
      JOIN loads l ON de.load_id = l.id
      LEFT JOIN trucks t ON l.truck_id = t.id
      LEFT JOIN drivers d ON l.driver_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN load_stops ls ON de.stop_id = ls.id
      WHERE de.status IN ('active', 'closed')
        AND (de.departed_at IS NULL OR de.departed_at > CURRENT_TIMESTAMP - INTERVAL '24 hours')
      ORDER BY de.arrived_at DESC
      LIMIT 100
      `
    );

    const now = new Date();
    return result.rows.map((row) => {
      const arrivedAt = new Date(row.arrived_at);
      const currentDwellMs = now - arrivedAt;
      const currentDwellMinutes = Math.max(0, Math.round(currentDwellMs / 1000 / 60));
      const currentDwellHours = Number((currentDwellMinutes / 60).toFixed(2));
      const freeTimeMinutes = Number(row.free_time_minutes || 120);
      const freeTimeHours = Number((freeTimeMinutes / 60).toFixed(2));
      const currentBillableMinutes = Math.max(0, currentDwellMinutes - freeTimeMinutes);
      const currentBillableHours = Number((currentBillableMinutes / 60).toFixed(2));
      const ratePerHour = Number(row.rate_per_hour || 75.0);
      const currentAmount = Number(((currentBillableMinutes / 60) * ratePerHour).toFixed(2));

      let warningLevel = "GREEN_NORMAL";
      let status = "WITHIN_FREE_TIME";
      if (currentBillableMinutes > 120) {
        warningLevel = "RED_OVERDUE";
        status = "BILLABLE_ACTIVE";
      } else if (currentBillableMinutes > 0) {
        warningLevel = "YELLOW_WARNING";
        status = "WARNING_APPROACHING_LIMIT";
      }

      return {
        id: row.id,
        loadNumber: row.load_number || null,
        truckNumber: row.truck_number || null,
        driverName: row.driver_name || null,
        customerName: "Freight Customer / Broker", // resolved separately in controller
        facilityName: row.location_name || "Facility",
        facilityType: "FACILITY_DOCK",
        geofenceArrival: row.arrived_at,
        freeTimeHours,
        dwellHours: currentDwellHours,
        billableHours: currentBillableHours,
        hourlyRate: ratePerHour,
        detentionAmountDue: currentAmount,
        status,
        warningLevel,
        gpsCoordinates: row.lat && row.lng ? { lat: Number(row.lat), lng: Number(row.lng) } : null,
        driverNote: null,
      };
    });
  } catch (err) {
    console.error("getActiveDwellEvents error:", err.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Completed claims ledger (closed/invoiced detention_events)
// ---------------------------------------------------------------------------

/**
 * Detention events that are closed or invoiced, joined to invoices for the
 * claim receipt/status. Empty table -> empty array.
 *
 * @returns {Promise<Array>} [{id, loadNumber, invoiceNumber, customerName, ..., totalClaimAmount, status}]
 */
export async function getCompletedClaims() {
  await ensureDetentionTables();
  try {
    const result = await pool.query(
      `
      SELECT de.id, de.load_id, de.stop_id, de.location_name, de.arrived_at, de.departed_at,
             de.free_time_minutes, de.dwell_minutes, de.billable_minutes,
             de.rate_per_hour, de.amount, de.status, de.invoice_id,
             l.load_number, l.customer_id,
             inv.id AS invoice_row_id, inv.total AS invoice_total, inv.status AS invoice_status
      FROM detention_events de
      JOIN loads l ON de.load_id = l.id
      LEFT JOIN invoices inv ON de.invoice_id = inv.id
      WHERE de.status IN ('closed', 'claimed', 'invoiced', 'written_off')
      ORDER BY de.updated_at DESC
      LIMIT 200
      `
    );

    return result.rows.map((row) => {
      const dwell = Number((row.dwell_minutes / 60).toFixed(1));
      const freeTime = Number((row.free_time_minutes / 60).toFixed(1));
      const billable = Number((row.billable_minutes / 60).toFixed(1));
      const amount = Number(row.amount || 0);

      return {
        id: row.id,
        loadNumber: row.load_number || null,
        invoiceNumber: row.invoice_row_id
          ? `INV-DET-${row.invoice_row_id.slice(0, 8).toUpperCase()}`
          : `INV-DET-${Date.now().toString().slice(-4)}`,
        customerName: "Freight Customer / Broker", // resolved separately in controller
        facilityName: row.location_name || "Facility",
        date: row.departed_at ? new Date(row.departed_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        type: "Detention Dwell",
        totalDwellHours: dwell,
        freeTimeHours: freeTime,
        billableHours: billable,
        rate: Number(row.rate_per_hour || 75.0),
        totalClaimAmount: amount,
        status:
          row.status === "invoiced" || row.invoice_status === "paid"
            ? "APPROVED_PAID"
            : row.status === "written_off"
            ? "WRITTEN_OFF"
            : "PENDING_BROKER_REVIEW",
        gpsProofAttached: true,
      };
    });
  } catch (err) {
    console.error("getCompletedClaims error:", err.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Invoice generation: persist invoice row + link detention_events.invoice_id
// ---------------------------------------------------------------------------

/**
 * Create an invoice row and link it to the detention event(s). Used by the
 * POST /generate-invoice handler when a dispatcher manually files a claim.
 *
 * @param {object} claim - { loadNumber, customerName, facilityName, billableHours, rate, freeTimeHours, dwellHours, detentionEventId? }
 * @returns {{ok: boolean, claim?: object, invoiceId?: string, error?: string}}
 */
export async function generateInvoice(claim) {
  await ensureDetentionTables();

  if (
    !claim ||
    (claim.billableHours === undefined && !claim.detentionEventId)
  ) {
    return { ok: false, error: "claim data or detentionEventId required" };
  }

  try {
    const billableHours = Number(claim.billableHours || 0);
    const rate = Number(claim.rate || 75.0);
    const total = Number((billableHours * rate).toFixed(2));

    // Create an invoice row.
    const invResult = await pool.query(
      `
      INSERT INTO invoices (
        shipment_id, customer_name, subtotal, total, status
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, customer_name, total, status, created_at
      `,
      [
        `DET-${Date.now().toString().slice(-8)}`,
        claim.customerName || "Freight Customer",
        total,
        total,
        "issued",
      ]
    );

    const invoice = invResult.rows[0];

    // Link the detention event to this invoice (if detentionEventId provided).
    if (claim.detentionEventId) {
      await pool.query(
        `UPDATE detention_events SET invoice_id = $1, status = 'invoiced' WHERE id = $2`,
        [invoice.id, claim.detentionEventId]
      );
    }

    return {
      ok: true,
      invoiceId: invoice.id,
      claim: {
        id: `CLAIM-${Date.now().toString().slice(-4)}`,
        loadNumber: claim.loadNumber || null,
        invoiceNumber: `INV-DET-${invoice.id.slice(0, 8).toUpperCase()}`,
        customerName: invoice.customer_name,
        facilityName: claim.facilityName || "Facility",
        date: new Date().toISOString().split("T")[0],
        type: "Detention Dwell",
        totalDwellHours: claim.dwellHours || 0,
        freeTimeHours: claim.freeTimeHours || 2.0,
        billableHours,
        rate,
        totalClaimAmount: total,
        status: "PENDING_BROKER_REVIEW",
        gpsProofAttached: true,
        generatedAt: invoice.created_at,
      },
      message: `Detention Accessorial Invoice ${invoice.id.slice(0, 8)} generated for $${total} CAD.`,
    };
  } catch (err) {
    console.error("generateInvoice error:", err.message);
    return { ok: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Compat export for existing callers (detention.controller.js)
// ---------------------------------------------------------------------------

export const detentionService = {
  ensureDetentionTables,
  openDetentionEvent,
  closeDetentionForStop,
  getActiveDwellEvents,
  getCompletedClaims,
  generateInvoice,
};

export default detentionService;

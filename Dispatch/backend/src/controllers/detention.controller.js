import pool from "../config/db.js";
import {
  detentionService,
  ensureDetentionTables,
  DETENTION_STATUSES,
} from "../services/detention.service.js";
import { isUuid } from "../services/loadStatus.service.js";
import {
  parseListParams,
  buildSearchClause,
  resolveSortClause,
} from "./customer.controller.js";

/**
 * detention.controller — DB-backed detention billing endpoints.
 *
 *   GET    /api/detention                    list (pagination convention)
 *   GET    /api/detention/events             legacy alias for DetentionPage
 *   GET    /api/detention/:id                single event
 *   PATCH  /api/detention/:id                status transition
 *   POST   /api/detention/:id/generate-invoice  real invoices row + link
 */

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

const LIST_SELECT = `
  SELECT de.*,
         l.load_number,
         l.customer_name AS load_customer_name,
         ls.stop_type,
         ls.city AS stop_city,
         ls.state AS stop_state
    FROM detention_events de
    LEFT JOIN loads l ON l.id = de.load_id
    LEFT JOIN load_stops ls ON ls.id = de.stop_id
   WHERE 1=1`;

// GET /api/detention
// limit/offset/q/sort present -> { data, total, limit, offset }
// otherwise legacy shape       -> { success: true, detention_events }
export async function listDetentionEvents(req, res) {
  try {
    await ensureDetentionTables();

    const { hasListParams, limit, offset, q, sort } = parseListParams(req.query);
    const status = typeof req.query.status === "string" && req.query.status.trim()
      ? req.query.status.trim().toLowerCase()
      : null;

    let query = LIST_SELECT;
    const params = [];

    if (status) {
      if (!DETENTION_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status filter" });
      }
      params.push(status);
      query += ` AND de.status = $${params.length}`;
    }

    // Legacy shape when no list params are present (backward compatible)
    if (!hasListParams) {
      query += ` ORDER BY de.created_at DESC`;
      const result = await pool.query(query, params);
      return res.json({ success: true, detention_events: result.rows });
    }

    if (q) {
      query += ` AND ${buildSearchClause(
        q,
        ["de.location_name", "de.status", "l.load_number", "l.customer_name", "ls.city", "ls.state"],
        params
      )}`;
    }

    const orderSql = resolveSortClause(
      sort,
      {
        created_at: "de.created_at",
        arrived_at: "de.arrived_at",
        departed_at: "de.departed_at",
        dwell_minutes: "de.dwell_minutes",
        billable_minutes: "de.billable_minutes",
        amount: "de.amount",
        status: "de.status",
        location_name: "de.location_name",
        load_number: "l.load_number",
      },
      "ORDER BY de.created_at DESC"
    );

    query = query.replace("SELECT de.*", "SELECT de.*, COUNT(*) OVER() AS __total");
    params.push(limit, offset);
    query += ` ${orderSql} LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    const total = result.rows.length ? Number(result.rows[0].__total) : 0;
    const data = result.rows.map(({ __total, ...row }) => row);

    res.json({ data, total, limit, offset });
  } catch (err) {
    console.error("listDetentionEvents:", err);
    res.status(500).json({ success: false, message: "Failed to list detention events" });
  }
}

// GET /api/detention/events — legacy alias consumed by DetentionPage.jsx:
// { success, activeEvents, claims } built from REAL detention_events rows.
export async function getActiveDetentionEvents(req, res) {
  try {
    await ensureDetentionTables();

    const result = await pool.query(
      `SELECT de.*,
              l.load_number,
              l.customer_name AS load_customer_name,
              t.truck_number,
              u.full_name AS driver_name,
              ls.stop_type
         FROM detention_events de
         LEFT JOIN loads l ON l.id = de.load_id
         LEFT JOIN trucks t ON t.id = l.truck_id
         LEFT JOIN drivers d ON d.id = l.driver_id
         LEFT JOIN users u ON u.id = d.user_id
         LEFT JOIN load_stops ls ON ls.id = de.stop_id
        ORDER BY de.created_at DESC
        LIMIT 200`
    );

    const now = Date.now();
    const activeEvents = [];
    const claims = [];

    for (const row of result.rows) {
      const freeTimeHours = round2((parseInt(row.free_time_minutes, 10) || 0) / 60);
      const hourlyRate = round2(row.rate_per_hour);

      if (row.status === "active") {
        // Live dwell for events still open
        const dwellHours = round2(
          Math.max(0, now - new Date(row.arrived_at).getTime()) / 3600000
        );
        const billableHours = round2(Math.max(0, dwellHours - freeTimeHours));
        const amountDue = round2(billableHours * hourlyRate);
        const freeRatio = freeTimeHours > 0 ? dwellHours / freeTimeHours : 1;

        activeEvents.push({
          id: row.id,
          loadNumber: row.load_number || null,
          truckNumber: row.truck_number || null,
          driverName: row.driver_name || null,
          customerName: row.load_customer_name || null,
          facilityName: row.location_name,
          facilityType: row.stop_type ? String(row.stop_type).toUpperCase() : null,
          geofenceArrival: row.arrived_at,
          freeTimeHours,
          dwellHours,
          billableHours,
          hourlyRate,
          detentionAmountDue: amountDue,
          status:
            billableHours > 0
              ? "BILLABLE_ACTIVE"
              : freeRatio >= 0.75
                ? "WARNING_APPROACHING_LIMIT"
                : "WITHIN_FREE_TIME",
          warningLevel:
            billableHours > 0
              ? "RED_OVERDUE"
              : freeRatio >= 0.75
                ? "YELLOW_WARNING"
                : "GREEN_NORMAL",
        });
      } else {
        claims.push({
          id: row.id,
          loadNumber: row.load_number || null,
          invoiceNumber: row.invoice_id || null,
          customerName: row.load_customer_name || null,
          facilityName: row.location_name,
          date: row.departed_at || row.updated_at || row.created_at,
          type: "Detention Dwell",
          totalDwellHours: round2((parseInt(row.dwell_minutes, 10) || 0) / 60),
          freeTimeHours,
          billableHours: round2((parseInt(row.billable_minutes, 10) || 0) / 60),
          rate: hourlyRate,
          totalClaimAmount: round2(row.amount),
          status: String(row.status).toUpperCase(),
        });
      }
    }

    res.json({ success: true, activeEvents, claims });
  } catch (err) {
    console.error("getActiveDetentionEvents:", err);
    res.status(500).json({ success: false, message: "Failed to fetch detention data" });
  }
}

// GET /api/detention/:id
export async function getDetentionEvent(req, res) {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(404).json({ success: false, message: "Detention event not found" });
    }
    const event = await detentionService.getDetentionEvent(id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Detention event not found" });
    }
    res.json({ success: true, data: event });
  } catch (err) {
    console.error("getDetentionEvent:", err);
    res.status(500).json({ success: false, message: "Failed to fetch detention event" });
  }
}

// PATCH /api/detention/:id — status transition (active|closed|claimed|invoiced|written_off)
export async function updateDetentionEvent(req, res) {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(404).json({ success: false, message: "Detention event not found" });
    }

    const status = String(req.body?.status || "").trim().toLowerCase();
    if (!DETENTION_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status — expected one of: ${DETENTION_STATUSES.join(", ")}`,
      });
    }

    const result = await detentionService.updateDetentionStatus(id, status);
    if (!result.ok) {
      if (result.error === "not_found") {
        return res.status(404).json({ success: false, message: "Detention event not found" });
      }
      if (result.error === "invalid_transition") {
        return res.status(409).json({
          success: false,
          message: `Cannot transition ${result.from} → ${result.to}. Allowed: ${
            result.allowed?.length ? result.allowed.join(", ") : "none"
          }`,
        });
      }
      if (result.error === "use_generate_invoice") {
        return res.status(400).json({
          success: false,
          message: "Use POST /api/detention/:id/generate-invoice to invoice this event",
        });
      }
      if (result.error === "status_unchanged") {
        return res.status(400).json({ success: false, message: "Event is already in that status" });
      }
      return res.status(400).json({ success: false, message: result.error });
    }

    res.json({ success: true, data: result.event, notification: result.notification || null });
  } catch (err) {
    console.error("updateDetentionEvent:", err);
    res.status(500).json({ success: false, message: "Failed to update detention event" });
  }
}

// POST /api/detention/:id/generate-invoice — creates a REAL invoices row and links it
export async function generateDetentionInvoice(req, res) {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(404).json({ success: false, message: "Detention event not found" });
    }

    const customerId = req.body?.customer_id || req.body?.customerId || null;
    if (customerId && !isUuid(customerId)) {
      return res.status(400).json({ success: false, message: "customer_id must be a UUID" });
    }

    const result = await detentionService.generateInvoice(id, { customerId });
    if (!result.ok) {
      if (result.error === "not_found") {
        return res.status(404).json({ success: false, message: "Detention event not found" });
      }
      if (result.error === "customer_not_found") {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }
      if (result.error === "already_invoiced") {
        return res.status(409).json({ success: false, message: "Detention event is already invoiced" });
      }
      if (result.error === "not_closed") {
        return res.status(400).json({ success: false, message: "Close the detention event before invoicing" });
      }
      if (result.error === "zero_billable") {
        return res.status(400).json({ success: false, message: "Cannot invoice zero billable detention" });
      }
      return res.status(400).json({ success: false, message: result.error });
    }

    res.status(201).json({ success: true, invoice: result.invoice, data: result.event });
  } catch (err) {
    console.error("generateDetentionInvoice:", err);
    res.status(500).json({ success: false, message: "Failed to generate invoice" });
  }
}

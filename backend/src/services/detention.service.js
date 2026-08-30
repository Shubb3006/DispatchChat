import pool from "../db/pool.js";

// List detention events with pagination
async function listDetentionEvents(limit = 50, offset = 0, status = null) {
  let query = `SELECT de.*, ls.location, l.load_number, l.commodity
               FROM detention_events de
               JOIN load_stops ls ON de.stop_id = ls.id
               JOIN loads l ON de.load_id = l.id`;
  const params = [];

  if (status) {
    query += ` WHERE de.status = $1`;
    params.push(status);
  }

  query += ` ORDER BY de.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const res = await pool.query(query, params);
  return res.rows;
}

// Get total count of detention events
async function getDetentionCount(status = null) {
  let query = `SELECT COUNT(*) as count FROM detention_events`;
  const params = [];

  if (status) {
    query += ` WHERE status = $1`;
    params.push(status);
  }

  const res = await pool.query(query, params);
  return parseInt(res.rows[0].count, 10);
}

// Update detention event status
async function updateDetentionStatus(detentionId, newStatus) {
  const res = await pool.query(
    `UPDATE detention_events
     SET status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [newStatus, detentionId]
  );
  return res.rows[0];
}

// Create detention event
async function createDetentionEvent(loadId, stopId, locationName, arrivedAt, freeTimeMinutes, ratePerHour) {
  const res = await pool.query(
    `INSERT INTO detention_events
     (load_id, stop_id, location_name, arrived_at, free_time_minutes, rate_per_hour, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'active')
     RETURNING *`,
    [loadId, stopId, locationName, arrivedAt, freeTimeMinutes, ratePerHour]
  );
  return res.rows[0];
}

// Close a detention event and calculate billable amount
async function closeDetentionEvent(detentionId, departedAt) {
  const event = await pool.query(
    `SELECT * FROM detention_events WHERE id = $1`,
    [detentionId]
  );

  if (!event.rows[0]) throw new Error("Detention event not found");

  const evt = event.rows[0];
  const dwellMs = new Date(departedAt) - new Date(evt.arrived_at);
  const dwellMinutes = Math.round(dwellMs / 60000);
  const billableMinutes = Math.max(0, dwellMinutes - evt.free_time_minutes);
  const amount = (billableMinutes / 60) * evt.rate_per_hour;

  const res = await pool.query(
    `UPDATE detention_events
     SET departed_at = $1, dwell_minutes = $2, billable_minutes = $3, amount = $4, status = 'closed', updated_at = CURRENT_TIMESTAMP
     WHERE id = $5
     RETURNING *`,
    [departedAt, dwellMinutes, billableMinutes, amount, detentionId]
  );

  return res.rows[0];
}

// Generate an invoice for a detention event
async function generateInvoice(detentionId, customerId) {
  const detEvent = await pool.query(
    `SELECT * FROM detention_events WHERE id = $1`,
    [detentionId]
  );

  if (!detEvent.rows[0]) throw new Error("Detention event not found");

  const evt = detEvent.rows[0];
  if (evt.amount <= 0) throw new Error("Cannot invoice zero/negative detention");

  // Create invoice row
  const invRes = await pool.query(
    `INSERT INTO invoices
     (customer_id, invoice_type, amount, status, meta)
     VALUES ($1, 'detention', $2, 'draft', $3)
     RETURNING *`,
    [customerId, evt.amount, JSON.stringify({ detention_event_id: detentionId })]
  );

  const invoice = invRes.rows[0];

  // Link detention event to invoice
  await pool.query(
    `UPDATE detention_events SET invoice_id = $1, status = 'invoiced', updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [invoice.id, detentionId]
  );

  return invoice;
}

// Get a single detention event
async function getDetentionEvent(id) {
  const res = await pool.query(
    `SELECT de.*, ls.location, l.load_number, l.commodity
     FROM detention_events de
     JOIN load_stops ls ON de.stop_id = ls.id
     JOIN loads l ON de.load_id = l.id
     WHERE de.id = $1`,
    [id]
  );
  return res.rows[0] || null;
}

export const detentionService = {
  listDetentionEvents,
  getDetentionCount,
  updateDetentionStatus,
  createDetentionEvent,
  closeDetentionEvent,
  generateInvoice,
  getDetentionEvent,
};

export default detentionService;

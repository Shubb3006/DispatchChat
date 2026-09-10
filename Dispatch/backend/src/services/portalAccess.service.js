import pool from "../config/db.js";

// ---------------------------------------------------------------------------
// One place that answers "is this caller allowed to see this load?".
//
// Portal endpoints are reachable by two very different callers:
//   • a customer  — may only ever touch loads whose customer_id is their own
//   • dispatch staff — may touch any load (they answer the broker's messages)
//
// Everything else is denied. The tenant id always comes from the session
// (req.user.customer_id), never from the request body or query string.
// ---------------------------------------------------------------------------

export const STAFF_ROLES = ["dispatcher", "admin", "super_admin", "data_entry", "invoicing"];

export const isStaffRole = (role) => STAFF_ROLES.includes(String(role || ""));

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve a load by UUID or load_number for the calling user.
 *
 * @returns {Promise<{load: object, isStaff: boolean} | null>} null when the
 *          load does not exist OR belongs to another tenant — the caller must
 *          answer 404 for both so a broker cannot probe for other brokers'
 *          load numbers.
 */
export async function resolveLoadForRequest(req, loadIdOrNumber) {
  const value = String(loadIdOrNumber || "").trim();
  if (!value) return null;

  const staff = isStaffRole(req.user?.role);
  const byUuid = UUID_RE.test(value);

  if (staff) {
    const result = byUuid
      ? await pool.query(`SELECT * FROM loads WHERE id = $1`, [value])
      : await pool.query(`SELECT * FROM loads WHERE load_number = $1`, [value]);
    return result.rows[0] ? { load: result.rows[0], isStaff: true } : null;
  }

  if (req.user?.role !== "customer" || !req.user?.customer_id) return null;

  const result = byUuid
    ? await pool.query(`SELECT * FROM loads WHERE id = $1 AND customer_id = $2`, [value, req.user.customer_id])
    : await pool.query(`SELECT * FROM loads WHERE load_number = $1 AND customer_id = $2`, [
        value,
        req.user.customer_id,
      ]);

  return result.rows[0] ? { load: result.rows[0], isStaff: false } : null;
}

/**
 * Portal users linked to a customer company — the recipients of a
 * customer-facing notification about one of their loads.
 */
export async function portalUserIdsForCustomer(customerId) {
  if (!customerId) return [];
  try {
    const result = await pool.query(
      `SELECT id FROM users WHERE customer_id = $1 AND role = 'customer' AND is_active IS NOT FALSE`,
      [customerId]
    );
    return result.rows.map((r) => r.id);
  } catch (err) {
    console.warn("portalUserIdsForCustomer warning:", err.message);
    return [];
  }
}

import pool from "../config/db.js";
import { ensurePortalSchema } from "../services/portalSchema.service.js";
import { notificationEvents, CUSTOMER_ALERT } from "../services/notification.service.js";

// ---------------------------------------------------------------------------
// Customer-facing notifications.
//
// notifyUser() (notification.service.js) already persists one row per user and
// emits CUSTOMER_ALERT; these endpoints are the read side of that pipe for the
// portal bell. Every query is scoped by req.user.id — a portal user only ever
// sees rows addressed to them.
// ---------------------------------------------------------------------------

const MAX_LIMIT = 100;

export const listPortalNotifications = async (req, res) => {
  try {
    await ensurePortalSchema();

    const limit = Math.min(parseInt(req.query.limit) || 30, MAX_LIMIT);
    const unreadOnly = String(req.query.unread || "") === "true";

    const result = await pool.query(
      `
      SELECT id, title, message, type, meta, is_read, read_at, created_at
      FROM notifications
      WHERE user_id = $1
        ${unreadOnly ? "AND is_read IS NOT TRUE" : ""}
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [req.user.id, limit]
    );

    const unread = await pool.query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read IS NOT TRUE`,
      [req.user.id]
    );

    res.json({
      success: true,
      notifications: result.rows,
      unread_count: parseInt(unread.rows[0]?.count || 0),
    });
  } catch (error) {
    console.error("listPortalNotifications error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/portal/notifications/read   body: { ids?: [uuid] }  (omit ids = all)
export const markPortalNotificationsRead = async (req, res) => {
  try {
    await ensurePortalSchema();

    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter(Boolean) : null;

    const result = ids?.length
      ? await pool.query(
          `UPDATE notifications
             SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
           WHERE user_id = $1 AND id = ANY($2::uuid[]) AND is_read IS NOT TRUE
           RETURNING id`,
          [req.user.id, ids]
        )
      : await pool.query(
          `UPDATE notifications
             SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
           WHERE user_id = $1 AND is_read IS NOT TRUE
           RETURNING id`,
          [req.user.id]
        );

    res.json({ success: true, marked: result.rowCount });
  } catch (error) {
    console.error("markPortalNotificationsRead error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/portal/notifications/stream — Server-Sent Events for one customer.
//
// Mirrors dispatcherNotificationStream, but every event is filtered to this
// user's id before it leaves the process: one broker must never receive
// another broker's alert off the shared event bus.
// ---------------------------------------------------------------------------
export const portalNotificationStream = async (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write(`event: connected\ndata: {"ok":true}\n\n`);

  const userId = req.user.id;
  const onAlert = (event) => {
    if (!event || String(event.user_id) !== String(userId)) return;
    res.write(`event: portal-alert\ndata: ${JSON.stringify(event)}\n\n`);
  };
  notificationEvents.on(CUSTOMER_ALERT, onAlert);

  const heartbeat = setInterval(() => res.write(`: ping\n\n`), 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    notificationEvents.off(CUSTOMER_ALERT, onAlert);
  });
};

// ---------------------------------------------------------------------------
// GET /api/portal/notify-prefs  &  PATCH /api/portal/notify-prefs
// customers.notify_prefs drives the milestone emails sent by
// loadStatus.service.js; the portal is where a broker turns them on and off.
// ---------------------------------------------------------------------------

const PREF_KEYS = ["picked_up", "in_transit", "delivered", "exception", "quote_ready", "customs"];

const normalizePrefs = (raw) => {
  const prefs = raw && typeof raw === "object" ? raw : {};
  const milestones = prefs.milestones && typeof prefs.milestones === "object" ? prefs.milestones : {};
  const out = {};
  for (const key of PREF_KEYS) {
    // Default ON: a broker who never touched settings still gets updates.
    out[key] = milestones[key] !== false;
  }
  return { email: prefs.email !== false, milestones: out };
};

export const getNotifyPrefs = async (req, res) => {
  try {
    await ensurePortalSchema();
    const result = await pool.query(`SELECT notify_prefs FROM customers WHERE id = $1`, [req.customerId]);
    res.json({ success: true, notify_prefs: normalizePrefs(result.rows[0]?.notify_prefs) });
  } catch (error) {
    console.error("getNotifyPrefs error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateNotifyPrefs = async (req, res) => {
  try {
    await ensurePortalSchema();
    const next = normalizePrefs(req.body?.notify_prefs ?? req.body);

    const result = await pool.query(
      `UPDATE customers SET notify_prefs = $1 WHERE id = $2 RETURNING notify_prefs`,
      [JSON.stringify(next), req.customerId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    res.json({ success: true, notify_prefs: normalizePrefs(result.rows[0].notify_prefs) });
  } catch (error) {
    console.error("updateNotifyPrefs error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

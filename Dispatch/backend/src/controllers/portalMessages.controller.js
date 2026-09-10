import pool from "../config/db.js";
import { ensurePortalSchema } from "../services/portalSchema.service.js";
import { notifyDispatchers, notifyUser } from "../services/notification.service.js";
import { resolveLoadForRequest, portalUserIdsForCustomer } from "../services/portalAccess.service.js";

// ---------------------------------------------------------------------------
// Per-load conversation between a broker and the dispatch team.
//
// Both sides use these same endpoints; resolveLoadForRequest decides whether
// the caller is the owning customer or dispatch staff, and the row records
// which side wrote it. Unread counts are tracked per side so each UI can badge
// only what it has not seen.
// ---------------------------------------------------------------------------

const MAX_BODY = 4000;

const shapeMessage = (row) => ({
  id: row.id,
  load_id: row.load_id,
  body: row.body,
  side: row.sender_side,
  sender_name: row.sender_name,
  created_at: row.created_at,
  read_by_customer_at: row.read_by_customer_at,
  read_by_staff_at: row.read_by_staff_at,
});

// GET /api/portal/loads/:id/messages
export const listLoadMessages = async (req, res) => {
  try {
    await ensurePortalSchema();

    const access = await resolveLoadForRequest(req, req.params.id);
    if (!access) return res.status(404).json({ success: false, message: "Load not found" });

    const result = await pool.query(
      `SELECT * FROM load_messages WHERE load_id = $1 ORDER BY created_at ASC LIMIT 500`,
      [access.load.id]
    );

    const mine = access.isStaff ? "staff" : "customer";
    const unread = result.rows.filter(
      (m) => m.sender_side !== mine && !m[`read_by_${mine}_at`]
    ).length;

    res.json({
      success: true,
      messages: result.rows.map(shapeMessage),
      unread_count: unread,
      viewer_side: mine,
    });
  } catch (error) {
    console.error("listLoadMessages error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/portal/loads/:id/messages   body: { body: string }
export const sendLoadMessage = async (req, res) => {
  try {
    await ensurePortalSchema();

    const body = String(req.body?.body || "").trim();
    if (!body) return res.status(400).json({ success: false, message: "Message body is required" });
    if (body.length > MAX_BODY) {
      return res.status(400).json({ success: false, message: `Message is too long (max ${MAX_BODY} characters)` });
    }

    const access = await resolveLoadForRequest(req, req.params.id);
    if (!access) return res.status(404).json({ success: false, message: "Load not found" });
    const { load, isStaff } = access;

    const senderSide = isStaff ? "staff" : "customer";
    const senderName = isStaff
      ? req.user.username || "Nishan Transport dispatch"
      : req.user.company_name || req.user.username || "Customer";

    // Your own message counts as read by your side from the moment you send it.
    const now = new Date();
    const inserted = await pool.query(
      `
      INSERT INTO load_messages (load_id, customer_id, sender_id, sender_name, sender_side, body,
                                 read_by_customer_at, read_by_staff_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        load.id,
        load.customer_id || null,
        req.user.id,
        senderName,
        senderSide,
        body,
        isStaff ? null : now,
        isStaff ? now : null,
      ]
    );
    const message = inserted.rows[0];

    const preview = body.length > 140 ? `${body.slice(0, 140)}…` : body;

    if (isStaff) {
      // Dispatch replied — light up every portal user at that company.
      const recipients = await portalUserIdsForCustomer(load.customer_id);
      await Promise.all(
        recipients.map((userId) =>
          notifyUser(userId, {
            type: "LOAD_MESSAGE",
            title: `Message from dispatch — Load #${load.load_number}`,
            message: preview,
            data: { load_id: load.id, load_number: load.load_number, message_id: message.id },
          })
        )
      );
    } else {
      await notifyDispatchers({
        type: "LOAD_MESSAGE",
        title: `${senderName} messaged about Load #${load.load_number}`,
        message: preview,
        data: { load_id: load.id, load_number: load.load_number, message_id: message.id },
      });
    }

    res.status(201).json({ success: true, message: shapeMessage(message) });
  } catch (error) {
    console.error("sendLoadMessage error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/portal/loads/:id/messages/read
export const markLoadMessagesRead = async (req, res) => {
  try {
    await ensurePortalSchema();

    const access = await resolveLoadForRequest(req, req.params.id);
    if (!access) return res.status(404).json({ success: false, message: "Load not found" });

    // Only the other side's messages get stamped — you never "read" your own.
    const column = access.isStaff ? "read_by_staff_at" : "read_by_customer_at";
    const otherSide = access.isStaff ? "customer" : "staff";

    const result = await pool.query(
      `UPDATE load_messages
          SET ${column} = CURRENT_TIMESTAMP
        WHERE load_id = $1 AND sender_side = $2 AND ${column} IS NULL
        RETURNING id`,
      [access.load.id, otherSide]
    );

    res.json({ success: true, marked: result.rowCount });
  } catch (error) {
    console.error("markLoadMessagesRead error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Unread counts per load for the calling customer — lets the dashboard badge
 * a shipment row without fetching every thread.
 */
export const unreadMessageCounts = async (req, res) => {
  try {
    await ensurePortalSchema();
    if (req.user.role !== "customer" || !req.user.customer_id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const result = await pool.query(
      `
      SELECT load_id, COUNT(*)::int AS unread
      FROM load_messages
      WHERE customer_id = $1 AND sender_side = 'staff' AND read_by_customer_at IS NULL
      GROUP BY load_id
      `,
      [req.user.customer_id]
    );

    const counts = {};
    for (const row of result.rows) counts[row.load_id] = row.unread;
    res.json({ success: true, counts });
  } catch (error) {
    console.error("unreadMessageCounts error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

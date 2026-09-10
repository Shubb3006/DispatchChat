import fs from "fs";
import path from "path";
import pool from "../config/db.js";
import { ensurePortalSchema } from "../services/portalSchema.service.js";
import { isStaffRole } from "../services/portalAccess.service.js";
import { notifyDispatchers } from "../services/notification.service.js";

// ---------------------------------------------------------------------------
// Files attached to a rate request — a packing list, the customer's own tender,
// a photo of the freight — uploaded before any load exists.
//
// documents.load_id is NOT NULL, so these live in rate_request_attachments and
// are served through this controller only, never as a public path.
// ---------------------------------------------------------------------------

const ALLOWED_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const UPLOAD_ROOT = () => path.join(process.cwd(), "uploads", "rate-requests");

/**
 * Resolve a rate request for the caller: customers get their own only, staff
 * get any. Returns null for both "missing" and "someone else's".
 */
async function resolveRateRequest(req, id) {
  const value = String(id || "").trim();
  if (!value) return null;

  if (isStaffRole(req.user?.role)) {
    const r = await pool.query(`SELECT * FROM rate_requests WHERE id = $1`, [value]);
    return r.rows[0] ? { rateRequest: r.rows[0], isStaff: true } : null;
  }
  if (req.user?.role !== "customer" || !req.user?.customer_id) return null;

  const r = await pool.query(`SELECT * FROM rate_requests WHERE id = $1 AND customer_id = $2`, [
    value,
    req.user.customer_id,
  ]);
  return r.rows[0] ? { rateRequest: r.rows[0], isStaff: false } : null;
}

const shapeAttachment = (row) => ({
  id: row.id,
  file_name: row.file_name,
  mime_type: row.mime_type,
  size_bytes: row.size_bytes ? Number(row.size_bytes) : null,
  created_at: row.created_at,
  download_url: `/api/portal/rates/${row.rate_request_id}/attachments/${row.id}`,
});

// POST /api/portal/rates/:id/attachments   multipart: file=<...>
export const uploadRateRequestAttachment = async (req, res) => {
  try {
    await ensurePortalSchema();

    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded (field name: file)" });
    }
    if (file.mimetype && !ALLOWED_MIME.includes(file.mimetype)) {
      return res.status(415).json({
        success: false,
        message: "Attach a PDF, image, spreadsheet or Word document.",
      });
    }

    const access = await resolveRateRequest(req, req.params.id);
    if (!access) return res.status(404).json({ success: false, message: "Rate request not found" });
    const { rateRequest } = access;

    const safeName = path.basename(file.originalname || "attachment").replace(/[^a-zA-Z0-9._-]/g, "_");
    const dir = path.join(UPLOAD_ROOT(), String(rateRequest.id));
    fs.mkdirSync(dir, { recursive: true });
    const diskPath = path.join(dir, safeName);
    fs.writeFileSync(diskPath, file.buffer);

    const inserted = await pool.query(
      `
      INSERT INTO rate_request_attachments
        (rate_request_id, customer_id, file_name, file_path, mime_type, size_bytes, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        rateRequest.id,
        rateRequest.customer_id,
        safeName,
        `rate-requests/${rateRequest.id}/${safeName}`,
        file.mimetype || null,
        file.size || null,
        req.user.id,
      ]
    );

    if (!access.isStaff) {
      await notifyDispatchers({
        type: "RATE_REQUEST_ATTACHMENT",
        title: `Attachment added to a rate request`,
        message: `${rateRequest.origin} → ${rateRequest.destination}: ${safeName}`,
        data: { rate_request_id: rateRequest.id },
      });
    }

    res.status(201).json({ success: true, attachment: shapeAttachment(inserted.rows[0]) });
  } catch (error) {
    console.error("uploadRateRequestAttachment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/portal/rates/:id/attachments
export const listRateRequestAttachments = async (req, res) => {
  try {
    await ensurePortalSchema();
    const access = await resolveRateRequest(req, req.params.id);
    if (!access) return res.status(404).json({ success: false, message: "Rate request not found" });

    const result = await pool.query(
      `SELECT * FROM rate_request_attachments WHERE rate_request_id = $1 ORDER BY created_at ASC`,
      [access.rateRequest.id]
    );
    res.json({ success: true, attachments: result.rows.map(shapeAttachment) });
  } catch (error) {
    console.error("listRateRequestAttachments error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/portal/rates/:id/attachments/:attachmentId
export const downloadRateRequestAttachment = async (req, res) => {
  try {
    await ensurePortalSchema();
    const access = await resolveRateRequest(req, req.params.id);
    if (!access) return res.status(404).json({ success: false, message: "Rate request not found" });

    const result = await pool.query(
      `SELECT * FROM rate_request_attachments WHERE id = $1 AND rate_request_id = $2`,
      [req.params.attachmentId, access.rateRequest.id]
    );
    const row = result.rows[0];
    if (!row) return res.status(404).json({ success: false, message: "Attachment not found" });

    // Rebuilt from ids + basename, never from the stored string.
    const diskPath = path.join(UPLOAD_ROOT(), String(row.rate_request_id), path.basename(row.file_name));
    if (!fs.existsSync(diskPath)) {
      return res.status(404).json({ success: false, message: "That file is no longer available." });
    }
    res.download(diskPath, row.file_name);
  } catch (error) {
    console.error("downloadRateRequestAttachment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/portal/rates/:id/attachments/:attachmentId  (customer, before quoting)
export const deleteRateRequestAttachment = async (req, res) => {
  try {
    await ensurePortalSchema();
    const access = await resolveRateRequest(req, req.params.id);
    if (!access) return res.status(404).json({ success: false, message: "Rate request not found" });

    const result = await pool.query(
      `DELETE FROM rate_request_attachments WHERE id = $1 AND rate_request_id = $2 RETURNING file_name`,
      [req.params.attachmentId, access.rateRequest.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Attachment not found" });
    }

    const diskPath = path.join(
      UPLOAD_ROOT(),
      String(access.rateRequest.id),
      path.basename(result.rows[0].file_name)
    );
    fs.promises.unlink(diskPath).catch(() => {});

    res.json({ success: true });
  } catch (error) {
    console.error("deleteRateRequestAttachment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

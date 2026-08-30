import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import pool from "../config/db.js";
import { getCustomerScope, buildLoadScopeClause } from "./customer.controller.js";
import { ensureLoadTrackingColumns } from "../services/loadStatus.service.js";

if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Same Supabase Storage client pattern as supabaseStorage.service.js /
// load.controller.uploadBOL
const supabaseUrl = process.env.PROJECT_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = (supabaseUrl.startsWith("http") && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, {
      realtime: { transport: WebSocket },
    })
  : null;

/**
 * Find a load by pb_num / load_number, tolerating schemas without pb_num.
 */
const findLoadIdByNumber = async (loadNumber) => {
  try {
    const result = await pool.query(
      `SELECT id FROM loads WHERE pb_num=$1 OR load_number=$1`,
      [loadNumber]
    );
    return result.rows[0]?.id || null;
  } catch (err) {
    // pb_num column may not exist on this deployment — retry on load_number only
    const fallback = await pool.query(
      `SELECT id FROM loads WHERE load_number=$1`,
      [loadNumber]
    );
    return fallback.rows[0]?.id || null;
  }
};

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const { load_number } = req.params;
    const { document_type } = req.body;

    // Find load
    const loadId = await findLoadIdByNumber(load_number);

    if (!loadId) {
      return res.status(404).json({
        message: "Load not found",
      });
    }

    // Logged in user from JWT middleware
    const userId = req.user.id;

    // multer is configured with memoryStorage, so the file only exists as
    // req.file.buffer — upload that buffer to Supabase Storage and store the
    // resulting public URL (req.file.path/filename are always undefined here).
    const originalName = (req.file.originalname || "document").replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${Date.now()}_${originalName}`;
    const storagePath = `general/${loadId}/${fileName}`;

    let publicUrl = null;

    if (supabase) {
      try {
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(storagePath, req.file.buffer, {
            contentType: req.file.mimetype || "application/octet-stream",
            upsert: false,
          });

        if (uploadError) {
          console.warn("Supabase Storage upload warning:", uploadError.message);
        } else {
          const { data: publicURLData } = supabase.storage
            .from("documents")
            .getPublicUrl(storagePath);
          publicUrl = publicURLData?.publicUrl || null;
        }
      } catch (storageErr) {
        console.warn("Supabase Storage error:", storageErr.message);
      }
    }

    // Local fallback (served by express at /uploads) so the stored URL is
    // always a real, retrievable file — never a fabricated path.
    if (!publicUrl) {
      try {
        const localDir = path.join(__dirname, "..", "uploads", "documents", String(loadId));
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }
        fs.writeFileSync(path.join(localDir, fileName), req.file.buffer);
        publicUrl = `/uploads/documents/${loadId}/${fileName}`;
      } catch (localErr) {
        console.error("Local storage fallback error:", localErr.message);
      }
    }

    if (!publicUrl) {
      return res.status(500).json({
        message: "Upload failed",
      });
    }

    // Save document record
    const result = await pool.query(
      `
      INSERT INTO documents
      (
          load_id,
          uploaded_by,
          document_type,
          file_name,
          file_path
      )

      VALUES
      ($1,$2,$3,$4,$5)

      RETURNING *
      `,
      [
        loadId,
        userId,
        document_type || "OTHER",
        fileName,
        publicUrl,
      ]
    );

    res.json({
      success: true,

      message: "Document uploaded successfully",

      document: result.rows[0],
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Upload failed",
    });
  }
};

/**
 * GET /api/upload/load/:load_number — list documents for a load
 * (customer-scoped: customer users only see documents for their own loads).
 */
export const getDocumentsForLoad = async (req, res) => {
  try {
    const { load_number } = req.params;

    const loadId = await findLoadIdByNumber(load_number);
    if (!loadId) {
      return res.status(404).json({
        message: "Load not found",
      });
    }

    const scope = await getCustomerScope(req);
    if (scope.restricted && !scope.customerId) {
      return res.json({ success: true, documents: [] });
    }

    const params = [loadId];
    let scopeSql = "";
    if (scope.restricted) {
      await ensureLoadTrackingColumns();
      scopeSql = ` AND ${buildLoadScopeClause(scope.customerId, params)}`;
    }

    const result = await pool.query(
      `SELECT d.*
       FROM documents d
       JOIN loads l ON d.load_id = l.id
       WHERE d.load_id = $1${scopeSql}
       ORDER BY d.created_at DESC`,
      params
    );

    res.json({
      success: true,
      documents: result.rows,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

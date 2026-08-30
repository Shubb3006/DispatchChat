import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import fs from "fs";
import path from "path";
import pool from "../config/db.js";

if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket;
}

const supabaseUrl = process.env.PROJECT_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = (supabaseUrl && supabaseUrl.startsWith("http") && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, {
      realtime: { transport: WebSocket },
    })
  : null;


/**
 * Uploads a Load Confirmation PDF to Supabase Storage and records it in documents table
 * 
 * Target Bucket: documents
 * Storage Path: load-confirmations/[Load ID]/[File Name]
 * Document Type: Load Confirmation
 */
export async function uploadLoadConfirmationDocument({
  loadId,
  fileName,
  fileBuffer,
  mimeType = "application/pdf",
}) {
  const sanitizedFileName = (fileName || "load-confirmation.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `load-confirmations/${loadId}/${sanitizedFileName}`;

  let publicUrl = "";
  let uploadSuccess = false;

  // 1. Upload to Supabase Storage bucket 'documents'
  if (supabase) {
    try {
      const uploadData = fileBuffer instanceof Uint8Array ? fileBuffer : new Uint8Array(Buffer.from(fileBuffer));
      const { data, error } = await supabase.storage
        .from("documents")
        .upload(storagePath, uploadData, {
          contentType: mimeType,
          upsert: true,
        });


      if (error) {
        console.warn("Supabase Storage upload warning (proceeding with local backup):", error.message);
      } else {
        uploadSuccess = true;
        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(storagePath);
        publicUrl = urlData?.publicUrl || storagePath;
        console.log(`📁 Uploaded document to Supabase Storage: ${storagePath}`);
      }
    } catch (err) {
      console.warn("Supabase Storage error:", err.message);
    }
  }

  // 2. Local disk backup in uploads/documents/
  try {
    const localDir = path.join(process.cwd(), "uploads", "documents", String(loadId));
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const localFilePath = path.join(localDir, sanitizedFileName);
    fs.writeFileSync(localFilePath, fileBuffer);
    if (!publicUrl) {
      publicUrl = `/uploads/documents/${loadId}/${sanitizedFileName}`;
    }
  } catch (localErr) {
    console.warn("Local storage fallback error:", localErr.message);
  }

  // 3. Insert record into Supabase / PostgreSQL 'documents' table
  let documentRecord = null;
  try {
    const insertSql = `
      INSERT INTO documents (
        load_id,
        document_type,
        file_name,
        file_path,
        created_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const res = await pool.query(insertSql, [
      loadId,
      "Load Confirmation",
      sanitizedFileName,
      publicUrl || storagePath,
    ]);
    documentRecord = res.rows[0];
    console.log(`📄 Saved document record in database: ${documentRecord.id}`);
  } catch (dbErr) {
    console.warn("Database document insert error:", dbErr.message);
  }

  return {
    success: true,
    storagePath,
    publicUrl,
    document: documentRecord,
  };
}

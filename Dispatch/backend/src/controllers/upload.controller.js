import pool from "../config/db.js";
import { uploadLoadDocument } from "../services/supabaseStorage.service.js";

// POST /api/upload/:load_number   multipart: file=<...>, body: document_type
//
// This is the driver app's POD / skid-picture endpoint. Multer runs in
// memoryStorage (config/multer.js), so req.file has a BUFFER and no .path or
// .filename — the previous version stored those two undefined values and threw
// the bytes away, which is why no POD ever reached the customer portal.
// Everything now goes through uploadLoadDocument (Supabase + local backup +
// the documents row), the same path the tender and customs uploads use.
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { load_number } = req.params;
    const { document_type } = req.body;

    const loadResult = await pool.query(
      `
      SELECT id
      FROM loads
      WHERE pb_num = $1
         OR load_number = $1
      `,
      [load_number]
    );

    if (loadResult.rows.length === 0) {
      return res.status(404).json({ message: "Load not found" });
    }

    const loadId = loadResult.rows[0].id;
    const documentType = document_type || "OTHER";

    const stored = await uploadLoadDocument({
      loadId,
      fileName: req.file.originalname || `${documentType}.pdf`,
      fileBuffer: req.file.buffer,
      mimeType: req.file.mimetype || "application/octet-stream",
      documentType,
      folder: documentType.toLowerCase().includes("pod") ? "pod" : "documents",
      uploadedBy: req.user?.id || null,
      aiParsedStatus: "NOT_APPLICABLE",
    });

    if (!stored?.document) {
      return res.status(502).json({
        success: false,
        message: "The file could not be stored. Please try again.",
      });
    }

    res.json({
      success: true,
      message: "Document uploaded successfully",
      document: stored.document,
      file_url: stored.publicUrl,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Upload failed",
    });
  }
};

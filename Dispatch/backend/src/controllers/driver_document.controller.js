import pool from "../config/db.js";

// Ensure table exists helper
const ensureDocumentTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS driver_documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          shipment_id UUID REFERENCES loads(id) ON DELETE SET NULL,
          tracking_number VARCHAR(100),
          driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
          type VARCHAR(50) NOT NULL,
          file_name TEXT NOT NULL,
          file_size VARCHAR(50),
          file_path TEXT,
          image_url TEXT,
          status VARCHAR(50) DEFAULT 'pending_review',
          uploaded_by VARCHAR(100),
          extracted_data JSONB,
          skid_pictures JSONB,
          internal_note TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.warn("Driver documents table check:", err.message);
  }
};

// Get Driver Documents with filter support
export const getDriverDocuments = async (req, res) => {
  await ensureDocumentTable();
  try {
    const { shipment_id, driver_id, type, status } = req.query;

    let query = `SELECT * FROM driver_documents WHERE 1=1`;
    const params = [];

    if (shipment_id) {
      params.push(shipment_id);
      query += ` AND shipment_id = $${params.length}`;
    }
    if (driver_id) {
      params.push(driver_id);
      query += ` AND driver_id = $${params.length}`;
    }
    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);
    let driverDocs = result.rows || [];

    // Also query the 'documents' table (joined with loads) so any document saved via Chat / Supabase is included
    try {
      const docQuery = await pool.query(
        `SELECT d.*, l.load_number 
         FROM documents d 
         LEFT JOIN loads l ON d.load_id = l.id 
         ORDER BY d.created_at DESC`
      );
      if (docQuery.rows && docQuery.rows.length > 0) {
        const mappedDocs = docQuery.rows.map((d) => ({
          id: d.id,
          shipment_id: d.load_id,
          load_id: d.load_id,
          tracking_number: d.load_number || "",
          load_number: d.load_number || "",
          type: (d.document_type || "BOL").toUpperCase(),
          document_type: (d.document_type || "BOL").toUpperCase(),
          file_name: d.file_name || `Carrier_${(d.document_type || "BOL").toUpperCase()}_Primary.pdf`,
          file_size: "240 KB",
          file_path: d.file_path,
          image_url: d.file_path,
          status: d.is_approved ? "approved" : "pending_review",
          uploaded_by: d.uploaded_by,
          created_at: d.created_at,
        }));

        const existingPaths = new Set(driverDocs.map((item) => item.file_path || item.image_url));
        for (const mDoc of mappedDocs) {
          if (mDoc.file_path && !existingPaths.has(mDoc.file_path)) {
            driverDocs.push(mDoc);
            existingPaths.add(mDoc.file_path);
          }
        }
      }
    } catch (docErr) {
      console.warn("Could not fetch documents table in getDriverDocuments:", docErr.message);
    }

    res.json({ success: true, documents: driverDocs });
  } catch (error) {
    console.error("Error fetching driver documents:", error);
    res.status(500).json({ success: false, message: "Server Error fetching documents" });
  }
};

// Get single Driver Document
export const getDriverDocumentById = async (req, res) => {
  await ensureDocumentTable();
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM driver_documents WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }
    res.json({ success: true, document: result.rows[0] });
  } catch (error) {
    console.error("Error fetching driver document:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Upload / Create Driver Document
export const createDriverDocument = async (req, res) => {
  await ensureDocumentTable();
  try {
    const {
      shipment_id,
      shipmentId,
      tracking_number,
      trackingNumber,
      driver_id,
      driverId,
      type,
      file_name,
      fileName,
      file_size,
      fileSize,
      file_path,
      imageUrl,
      image_url,
      status,
      uploaded_by,
      uploadedBy,
      extracted_data,
      extractedData,
      skid_pictures,
      skidPictures,
      internal_note,
      internalNote
    } = req.body;

    const resolvedShipmentId = shipment_id || shipmentId || null;
    const resolvedTrackingNum = tracking_number || trackingNumber || "LS-MANIFEST";
    const resolvedDriverId = driver_id || driverId || null;
    const resolvedType = type || "bol";
    const resolvedFileName = file_name || fileName || "Scanned_Document.pdf";
    const resolvedFileSize = file_size || fileSize || "1.2 MB";
    const resolvedImageUrl = image_url || imageUrl || null;
    const resolvedUploadedBy = uploaded_by || uploadedBy || "Marcus Vance (Driver App)";
    const resolvedExtractedData = extracted_data || extractedData || null;
    const resolvedSkidPics = skid_pictures || skidPictures || null;
    const resolvedInternalNote = internal_note || internalNote || "";

    const result = await pool.query(
      `INSERT INTO driver_documents (
        shipment_id, tracking_number, driver_id, type, file_name, file_size, file_path, image_url,
        status, uploaded_by, extracted_data, skid_pictures, internal_note
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        resolvedShipmentId,
        resolvedTrackingNum,
        resolvedDriverId,
        resolvedType,
        resolvedFileName,
        resolvedFileSize,
        file_path || null,
        resolvedImageUrl,
        status || "pending_review",
        resolvedUploadedBy,
        resolvedExtractedData ? JSON.stringify(resolvedExtractedData) : null,
        resolvedSkidPics ? JSON.stringify(resolvedSkidPics) : null,
        resolvedInternalNote
      ]
    );

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      document: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating driver document:", error);
    res.status(500).json({ success: false, message: "Server Error creating document" });
  }
};

// Update Driver Document
export const updateDriverDocument = async (req, res) => {
  await ensureDocumentTable();
  try {
    const { id } = req.params;
    const { status, internal_note, internalNote } = req.body;

    const resolvedNote = internal_note !== undefined ? internal_note : internalNote;

    const result = await pool.query(
      `UPDATE driver_documents
       SET status = COALESCE($1, status),
           internal_note = COALESCE($2, internal_note),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status || null, resolvedNote !== undefined ? resolvedNote : null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    res.json({
      success: true,
      message: "Document updated successfully",
      document: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating driver document:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Bulk Update Driver Document Statuses
export const bulkUpdateDriverDocumentsStatus = async (req, res) => {
  await ensureDocumentTable();
  try {
    const { docIds, status } = req.body;
    if (!Array.isArray(docIds) || docIds.length === 0) {
      return res.status(400).json({ success: false, message: "docIds array is required" });
    }

    await pool.query(
      `UPDATE driver_documents
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = ANY($2::uuid[])`,
      [status, docIds]
    );

    res.json({
      success: true,
      message: `Updated ${docIds.length} documents to status '${status}'`
    });
  } catch (error) {
    console.error("Error bulk updating documents:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Delete Driver Document
export const deleteDriverDocument = async (req, res) => {
  await ensureDocumentTable();
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM driver_documents WHERE id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }
    res.json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting driver document:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

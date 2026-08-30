import pool from "../config/db.js";

// Ensure table exists helper
const ensureInvoicesTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          load_id UUID REFERENCES loads(id) ON DELETE SET NULL,
          shipment_id VARCHAR(100),
          tracking_number VARCHAR(100),
          customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
          customer_name VARCHAR(255),
          issue_date DATE DEFAULT CURRENT_DATE,
          due_date DATE,
          subtotal NUMERIC(12, 2) DEFAULT 0.00,
          tax NUMERIC(12, 2) DEFAULT 0.00,
          total NUMERIC(12, 2) DEFAULT 0.00,
          status VARCHAR(50) DEFAULT 'draft',
          payment_terms VARCHAR(50) DEFAULT 'Net 30',
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.warn("Invoices table auto-init check:", err.message);
  }
};

// Get all Invoices
export const getInvoices = async (req, res) => {
  await ensureInvoicesTable();
  try {
    const { status, customer_id, load_id, tracking_number } = req.query;

    let query = `SELECT * FROM invoices WHERE 1=1`;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (customer_id) {
      params.push(customer_id);
      query += ` AND customer_id = $${params.length}`;
    }
    if (load_id) {
      params.push(load_id);
      query += ` AND load_id = $${params.length}`;
    }
    if (tracking_number) {
      params.push(tracking_number);
      query += ` AND tracking_number = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ success: true, invoices: result.rows });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ success: false, message: "Server Error fetching invoices" });
  }
};

// Get Invoice by ID
export const getInvoiceById = async (req, res) => {
  await ensureInvoicesTable();
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM invoices WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    res.json({ success: true, invoice: result.rows[0] });
  } catch (error) {
    console.error("Error fetching invoice by ID:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Create Invoice
export const createInvoice = async (req, res) => {
  await ensureInvoicesTable();
  try {
    const {
      load_id,
      loadId,
      shipment_id,
      shipmentId,
      tracking_number,
      trackingNumber,
      customer_id,
      customerId,
      customer_name,
      customerName,
      issue_date,
      issueDate,
      due_date,
      dueDate,
      subtotal,
      tax,
      total,
      status,
      payment_terms,
      paymentTerms,
      notes
    } = req.body;

    const resolvedLoadId = load_id || loadId || null;
    const resolvedShipmentId = shipment_id || shipmentId || null;
    const resolvedTrackingNum = tracking_number || trackingNumber || null;
    const resolvedCustomerId = customer_id || customerId || null;
    const resolvedCustomerName = customer_name || customerName || "General Consignee";
    const resolvedIssueDate = issue_date || issueDate || new Date().toISOString().split("T")[0];
    const resolvedDueDate = due_date || dueDate || new Date(Date.now() + 864e5 * 30).toISOString().split("T")[0];
    const resolvedSubtotal = subtotal !== undefined ? subtotal : 0.00;
    const resolvedTax = tax !== undefined ? tax : 0.00;
    const resolvedTotal = total !== undefined ? total : Number(resolvedSubtotal) + Number(resolvedTax);
    const resolvedStatus = status || "draft";
    const resolvedPaymentTerms = payment_terms || paymentTerms || "Net 30";
    const resolvedNotes = notes || "";

    const result = await pool.query(
      `INSERT INTO invoices (
        load_id, shipment_id, tracking_number, customer_id, customer_name,
        issue_date, due_date, subtotal, tax, total, status, payment_terms, notes
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        resolvedLoadId,
        resolvedShipmentId,
        resolvedTrackingNum,
        resolvedCustomerId,
        resolvedCustomerName,
        resolvedIssueDate,
        resolvedDueDate,
        resolvedSubtotal,
        resolvedTax,
        resolvedTotal,
        resolvedStatus,
        resolvedPaymentTerms,
        resolvedNotes
      ]
    );

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      invoice: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ success: false, message: "Server Error creating invoice" });
  }
};

// Update Invoice Status
export const updateInvoiceStatus = async (req, res) => {
  await ensureInvoicesTable();
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const result = await pool.query(
      `UPDATE invoices
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    res.json({
      success: true,
      message: `Invoice status updated to ${status}`,
      invoice: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating invoice status:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Update Full Invoice
export const updateInvoice = async (req, res) => {
  await ensureInvoicesTable();
  try {
    const { id } = req.params;
    const {
      customer_name,
      customerName,
      due_date,
      dueDate,
      subtotal,
      tax,
      total,
      status,
      payment_terms,
      paymentTerms,
      notes
    } = req.body;

    const resolvedCustomerName = customer_name || customerName;
    const resolvedDueDate = due_date || dueDate;
    const resolvedTerms = payment_terms || paymentTerms;

    const result = await pool.query(
      `UPDATE invoices
       SET customer_name = COALESCE($1, customer_name),
           due_date = COALESCE($2, due_date),
           subtotal = COALESCE($3, subtotal),
           tax = COALESCE($4, tax),
           total = COALESCE($5, total),
           status = COALESCE($6, status),
           payment_terms = COALESCE($7, payment_terms),
           notes = COALESCE($8, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [
        resolvedCustomerName || null,
        resolvedDueDate || null,
        subtotal !== undefined ? subtotal : null,
        tax !== undefined ? tax : null,
        total !== undefined ? total : null,
        status || null,
        resolvedTerms || null,
        notes !== undefined ? notes : null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    res.json({
      success: true,
      message: "Invoice updated successfully",
      invoice: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Delete Invoice
export const deleteInvoice = async (req, res) => {
  await ensureInvoicesTable();
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM invoices WHERE id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    res.json({ success: true, message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

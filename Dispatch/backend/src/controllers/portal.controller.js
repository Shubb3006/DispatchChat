import bcrypt from "bcrypt";
import pool from "../config/db.js";
import { generateToken } from "../lib/utils.js";
import { ensurePortalSchema } from "../services/portalSchema.service.js";
import { processLoadConfirmationPipeline } from "../services/loadConfirmationPipeline.service.js";
import { uploadLoadDocument } from "../services/supabaseStorage.service.js";
import {
  notificationEvents,
  notifyDispatchers,
  notifyUser,
  DISPATCH_ALERT,
} from "../services/notification.service.js";
import { sendEmail } from "../services/emailNotifier.service.js";
import { sanitizeFreightDetails, summarizeFreight } from "../services/rateRequestFreight.service.js";
import { buildEta } from "../services/portalEta.service.js";
import { buildLifecycle } from "../services/portalLifecycle.service.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// POST /api/auth/customer-login
// Portal-only login: same bcrypt/JWT-cookie flow as the staff login, but the
// account must be role 'customer' and linked to a customers row.
// ---------------------------------------------------------------------------
export const customerLogin = async (req, res) => {
  try {
    await ensurePortalSchema();

    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    const result = await pool.query(
      `
      SELECT
        u.id, u.username, u.full_name, u.password, u.role,
        u.allowed_modules, u.is_active, u.customer_id,
        c.company_name, c.broker_email AS broker_email
      FROM users u
      LEFT JOIN customers c ON c.id = u.customer_id
      WHERE u.username = $1
      `,
      [username]
    );

    const user = result.rows[0];

    // One generic message for unknown user AND wrong password — the portal is
    // internet-facing for third parties, so no account enumeration.
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "This account is not a customer portal account",
      });
    }

    if (user.is_active === false) {
      return res.status(403).json({ success: false, message: "Account is deactivated" });
    }

    generateToken(user.id, res);

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        allowed_modules: user.allowed_modules,
        customer_id: user.customer_id,
        company_name: user.company_name,
      },
    });
  } catch (error) {
    console.error("customerLogin error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/customers/:id/portal-user   (admin/dispatcher only)
// Accounts are admin-provisioned — there is no self-serve signup.
// ---------------------------------------------------------------------------
export const provisionCustomerUser = async (req, res) => {
  try {
    await ensurePortalSchema();

    const { id: customerId } = req.params;
    const { username, password, full_name } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "username and password are required" });
    }

    const customer = await pool.query(`SELECT id, company_name FROM customers WHERE id = $1`, [customerId]);
    if (customer.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const inserted = await pool.query(
      `
      INSERT INTO users (username, full_name, password, role, allowed_modules, customer_id)
      VALUES ($1, $2, $3, 'customer', ARRAY['customer'], $4)
      RETURNING id, username, full_name, role, allowed_modules, customer_id, created_at
      `,
      [
        username.trim().toLowerCase(),
        full_name || customer.rows[0].company_name,
        hashed,
        customerId,
      ]
    );

    res.status(201).json({ success: true, user: inserted.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ success: false, message: "Username already taken" });
    }
    console.error("provisionCustomerUser error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/rates/request   (customer)
// ---------------------------------------------------------------------------
export const createRateRequest = async (req, res) => {
  try {
    await ensurePortalSchema();

    const { origin, destination, freight_details } = req.body || {};
    if (!origin?.trim() || !destination?.trim()) {
      return res.status(400).json({ success: false, message: "origin and destination are required" });
    }

    // Equipment, temperature, hazmat, windows, extra stops and accessorials all
    // ride in freight_details; the whitelist lives in one place so the
    // dispatcher screen can trust every value it renders.
    const freight = sanitizeFreightDetails(freight_details);

    const inserted = await pool.query(
      `
      INSERT INTO rate_requests (customer_id, requested_by, origin, destination, freight_details)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [req.user.id, req.user.id, origin.trim(), destination.trim(), JSON.stringify(freight)]
    );
    const rateRequest = inserted.rows[0];
    console.log(rateRequest)

    const company = await pool.query(`SELECT company_name FROM customers WHERE id = $1`, [req.customerId]);
    const companyName = company.rows[0]?.company_name || "A customer";

    // Real-time + persisted alert for the dispatch team
    await notifyDispatchers({
      type: "RATE_REQUEST",
      title: `New rate request from ${companyName}`,
      message: [`${origin.trim()} → ${destination.trim()}`, summarizeFreight(freight)].filter(Boolean).join(" | "),
      data: { rate_request_id: rateRequest.id, customer_id: req.customerId },
    });

    res.status(201).json({ success: true, rate_request: rateRequest });
  } catch (error) {
    console.error("createRateRequest error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/rates   (customer → own requests only; dispatch roles → all)
// ---------------------------------------------------------------------------
export const listRateRequests = async (req, res) => {
  try {
    await ensurePortalSchema();

    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;
    const status = req.query.status ? String(req.query.status).toUpperCase() : null;

    const isDispatch = ["dispatcher", "admin", "super_admin"].includes(req.user.role);
    if (!isDispatch && (req.user.role !== "customer" || !req.user.customer_id)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Tenant scope comes from the authenticated user, never from the request.
    const where = [];
    const params = [];
    if (!isDispatch) {
      params.push(req.user.customer_id);
      where.push(`r.customer_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      where.push(`r.status = $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM rate_requests r ${whereSql}`,
      params
    );
    const totalCount = parseInt(countResult.rows[0]?.count || 0);

    const result = await pool.query(
      `
      SELECT r.*, c.company_name
      FROM rate_requests r
      LEFT JOIN customers c ON c.id = r.customer_id
      ${whereSql}
      ORDER BY r.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      rate_requests: result.rows,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("listRateRequests error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/rates/:id/quote   (dispatcher/admin only)
// ---------------------------------------------------------------------------
export const quoteRateRequest = async (req, res) => {
  try {
    await ensurePortalSchema();

    const { id } = req.params;
    const { quoted_price, currency, notes } = req.body || {};

    const price = Number(quoted_price);
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ success: false, message: "quoted_price must be a positive number" });
    }

    const updated = await pool.query(
      `
      UPDATE rate_requests
      SET status = 'QUOTED',
          quoted_price = $1,
          quote_currency = COALESCE($2, quote_currency),
          quote_notes = $3,
          quoted_by = $4,
          quoted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
      `,
      [price, currency || null, notes || null, req.user.id, id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Rate request not found" });
    }
    const rateRequest = updated.rows[0];

    // Alert the requesting customer: in-app + best-effort email
    // (sendEmail simulates when SMTP is not configured — never throws).
    await notifyUser(rateRequest.requested_by, {
      type: "RATE_QUOTED",
      title: "Your rate request has been quoted",
      message: `${rateRequest.origin} → ${rateRequest.destination}: $${price.toFixed(2)} ${rateRequest.quote_currency || "USD"}`,
      data: { rate_request_id: rateRequest.id },
    });

    try {
      const contact = await pool.query(
        `SELECT c.email, c.company_name FROM customers c WHERE c.id = $1`,
        [rateRequest.customer_id]
      );
      const email = contact.rows[0]?.email;
      if (email) {
        await sendEmail({
          to: email,
          subject: `Rate quote ready — ${rateRequest.origin} → ${rateRequest.destination}`,
          text: `Hello ${contact.rows[0]?.company_name || ""},\n\nYour rate request has been quoted at $${price.toFixed(2)} ${rateRequest.quote_currency || "USD"}.\n\nLog in to the Nishan Transport portal to accept the quote and upload your load tender.\n`,
          html: `<p>Your rate request <b>${rateRequest.origin} → ${rateRequest.destination}</b> has been quoted at <b>$${price.toFixed(2)} ${rateRequest.quote_currency || "USD"}</b>.</p><p>Log in to the Nishan Transport portal to accept the quote and upload your load tender.</p>`,
        });
      }
    } catch (mailErr) {
      console.warn("Quote email warning:", mailErr.message);
    }

    res.json({ success: true, rate_request: rateRequest });
  } catch (error) {
    console.error("quoteRateRequest error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/rates/:id/respond   (customer — own tenant only)
// body: { decision: "ACCEPT" | "REJECT" }
// ---------------------------------------------------------------------------
export const respondToRateRequest = async (req, res) => {
  try {
    await ensurePortalSchema();

    const { id } = req.params;
    const decision = String(req.body?.decision || "").toUpperCase();
    if (!["ACCEPT", "REJECT"].includes(decision)) {
      return res.status(400).json({ success: false, message: "decision must be ACCEPT or REJECT" });
    }
    const newStatus = decision === "ACCEPT" ? "ACCEPTED" : "REJECTED";

    const updated = await pool.query(
      `
      UPDATE rate_requests
      SET status = $1, responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND customer_id = $3 AND status = 'QUOTED'
      RETURNING *
      `,
      [newStatus, id, req.customerId]
    );

    if (updated.rows.length === 0) {
      // Tenant-scoped existence check to give an honest 404 vs 409
      const exists = await pool.query(
        `SELECT status FROM rate_requests WHERE id = $1 AND customer_id = $2`,
        [id, req.customerId]
      );
      if (exists.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Rate request not found" });
      }
      return res.status(409).json({
        success: false,
        message: `Only QUOTED requests can be responded to (current status: ${exists.rows[0].status})`,
      });
    }

    await notifyDispatchers({
      type: `RATE_${newStatus}`,
      title: `Rate quote ${newStatus.toLowerCase()}`,
      message: `${updated.rows[0].origin} → ${updated.rows[0].destination} ($${updated.rows[0].quoted_price})`,
      data: { rate_request_id: id },
    });

    res.json({ success: true, rate_request: updated.rows[0] });
  } catch (error) {
    console.error("respondToRateRequest error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/loads/tender-upload   (customer)
// multipart: tender=<pdf>, optional rate_request_id
// Runs the existing Gemini pipeline, then stamps tenant ownership.
// ---------------------------------------------------------------------------
export const tenderUpload = async (req, res) => {
  try {
    await ensurePortalSchema();

    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "No tender PDF uploaded (field name: tender)" });
    }

    const { rate_request_id } = req.body || {};

    // Tenant-scoped lookup — a rate request belonging to another customer is
    // indistinguishable from one that does not exist.
    let rateRequest = null;
    if (rate_request_id) {
      const rr = await pool.query(
        `SELECT * FROM rate_requests WHERE id = $1 AND customer_id = $2`,
        [rate_request_id, req.customerId]
      );
      if (rr.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Rate request not found" });
      }
      rateRequest = rr.rows[0];
      if (!["QUOTED", "ACCEPTED"].includes(rateRequest.status)) {
        return res.status(409).json({
          success: false,
          message: `Rate request must be QUOTED or ACCEPTED before uploading a tender (current: ${rateRequest.status})`,
        });
      }
    }

    const customerRow = await pool.query(
      `SELECT company_name, email, phone, address, city, state, zip_code, country FROM customers WHERE id = $1`,
      [req.customerId]
    );
    const customer = customerRow.rows[0] || {};

    // Existing 12-step pipeline: Gemini extraction → load insert → route/team
    // assignment → customs entry → document storage → emails.
    const result = await processLoadConfirmationPipeline({
      emailText: `Portal tender upload by ${customer.company_name || "customer"} (${req.user.username})`,
      emailSubject: `Load Tender - ${file.originalname}`,
      senderEmail: customer.email || "",
      pdfBuffer: file.buffer,
      fileName: file.originalname,
    });

    // The pipeline swallows DB insert failures; for the portal a load that
    // did not persist is a hard failure, not a success.
    if (!result.load_id || !UUID_RE.test(String(result.load_id))) {
      return res.status(502).json({
        success: false,
        message: "The tender was parsed but the load could not be saved. Please try again.",
        extraction_source: result.extraction_source,
        fallback_reason: result.fallback_reason,
      });
    }

    // Stamp tenant ownership + link the originating rate request. The quoted
    // price is the agreed price, so it wins over whatever the PDF says.
    const stamped = await pool.query(
      `
      UPDATE loads
      SET customer_id = $1,
          rate_request_id = $2,
          is_cross_border = $3,
          customer_name = COALESCE(NULLIF(customer_name, ''), $4),
          customer_email = COALESCE(NULLIF(customer_email, ''), $5),
          rate = COALESCE($6, rate)
      WHERE id = $7
      RETURNING *
      `,
      [
        req.customerId,
        rateRequest?.id || null,
        !!result.is_cross_border,
        customer.company_name || null,
        customer.email || null,
        rateRequest?.quoted_price ?? null,
        result.load_id,
      ]
    );

    // Record how the AI parse actually went on the stored document.
    if (result.document?.id) {
      await pool
        .query(`UPDATE documents SET ai_parsed_status = $1, uploaded_by = $2 WHERE id = $3`, [
          result.extraction_source === "gemini-ai" ? "PARSED" : "FAILED",
          req.user.id,
          result.document.id,
        ])
        .catch((e) => console.warn("documents parse-status update warning:", e.message));
    }

    if (rateRequest && rateRequest.status !== "ACCEPTED") {
      await pool
        .query(
          `UPDATE rate_requests SET status = 'ACCEPTED', responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND customer_id = $2`,
          [rateRequest.id, req.customerId]
        )
        .catch((e) => console.warn("rate request accept warning:", e.message));
    }

    await notifyDispatchers({
      type: "TENDER_UPLOADED",
      title: `New load tender from ${customer.company_name || "customer"}`,
      message: `Load #${result.load_number} created (${result.assigned_team}${result.is_cross_border ? ", cross-border" : ""})`,
      data: { load_id: result.load_id, load_number: result.load_number },
    });

    const usedGemini = result.extraction_source === "gemini-ai";
    res.status(201).json({
      success: true,
      message: usedGemini
        ? `Tender parsed with Gemini AI — Load #${result.load_number} created`
        : `⚠️ Load #${result.load_number} created from FALLBACK parser (sample data, NOT your PDF). Reason: ${result.fallback_reason || "Gemini unavailable"}`,
      load: stamped.rows[0],
      load_number: result.load_number,
      rate_request: rateRequest ? { ...rateRequest, status: "ACCEPTED" } : null,
      assigned_team: result.assigned_team,
      is_cross_border: !!result.is_cross_border,
      customs_entry: result.customs_entry,
      extraction_source: result.extraction_source,
      fallback_reason: result.fallback_reason,
      tracking_url: result.tracking_url,
    });
  } catch (error) {
    console.error("tenderUpload error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/loads/:id/customs-upload   (customer — own loads only)
// multipart: document=<file>
// ---------------------------------------------------------------------------
export const customsUpload = async (req, res) => {
  try {
    await ensurePortalSchema();

    const { id } = req.params;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "No document uploaded (field name: document)" });
    }

    // Tenant check FIRST: a load owned by another customer is a 404.
    const loadResult = await pool.query(
      `SELECT id, load_number, is_cross_border FROM loads WHERE id = $1 AND customer_id = $2`,
      [id, req.customerId]
    );
    if (loadResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Load not found" });
    }
    const load = loadResult.rows[0];

    const docResult = await uploadLoadDocument({
      loadId: load.id,
      fileName: file.originalname,
      fileBuffer: file.buffer,
      mimeType: file.mimetype || "application/pdf",
      documentType: "CUSTOMS_PAPERWORK",
      folder: "customs-paperwork",
      uploadedBy: req.user.id,
      aiParsedStatus: "NOT_APPLICABLE",
    });

    // Nudge the customs record forward if one exists (best-effort).
    await pool
      .query(
        // Entries open as DRAFT (tender pipeline) or PAPS_PARS_ACTIVE (staff
        // createLoad); both mean "not filed yet", so both advance here.
        `UPDATE customs_entries SET customs_status = 'SUBMITTED_TO_BROKER', updated_at = CURRENT_TIMESTAMP
         WHERE load_id = $1 AND customs_status IN ('DRAFT', 'PAPS_PARS_ACTIVE')`,
        [load.id]
      )
      .catch(() => { });

    await notifyDispatchers({
      type: "CUSTOMS_DOCS",
      title: `Customs paperwork uploaded for Load #${load.load_number}`,
      message: file.originalname,
      data: { load_id: load.id, document_id: docResult.document?.id },
    });

    res.status(201).json({
      success: true,
      message: "Customs paperwork uploaded",
      document: docResult.document,
      file_url: docResult.publicUrl,
    });
  } catch (error) {
    console.error("customsUpload error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/loads/customer-loads   (customer — strictly own tenant)
// ---------------------------------------------------------------------------
export const customerLoads = async (req, res) => {
  try {
    await ensurePortalSchema();

    const limit = Math.min(parseInt(req.query.limit) || 25, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM loads WHERE customer_id = $1`,
      [req.customerId]
    );
    const totalCount = parseInt(countResult.rows[0]?.count || 0);

    let rows;
    try {
      const result = await pool.query(
        `
        SELECT
          l.*,
          ce.customs_status, ce.lead_number, ce.lead_number_type,
          (SELECT COUNT(*) FROM documents d WHERE d.load_id = l.id) AS document_count
        FROM loads l
        LEFT JOIN customs_entries ce ON ce.load_id = l.id
        WHERE l.customer_id = $1
        ORDER BY l.created_at DESC
        LIMIT $2 OFFSET $3
        `,
        [req.customerId, limit, offset]
      );
      rows = result.rows;
    } catch (joinErr) {
      // customs_entries self-creates lazily elsewhere; don't let its absence
      // take the whole list down.
      const result = await pool.query(
        `SELECT l.* FROM loads l WHERE l.customer_id = $1 ORDER BY l.created_at DESC LIMIT $2 OFFSET $3`,
        [req.customerId, limit, offset]
      );
      rows = result.rows;
    }

    // Same ETA and lifecycle functions the shipment detail uses, computed from
    // the row we already have — no per-row query. The detail page additionally
    // feeds in the timeline and the customs entry, so it can land a stage
    // further along than this list does; the list never claims MORE progress
    // than the detail, which is the direction that matters to a customer.
    const loads = rows.map((row) => {
      const lifecycle = buildLifecycle(row);
      return {
        ...row,
        eta: buildEta(row),
        lifecycle_rank: lifecycle.current_rank,
        lifecycle_label: lifecycle.current.label,
      };
    });

    res.json({
      success: true,
      loads,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("customerLoads error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/rates/notifications/stream   (dispatcher — Server-Sent Events)
// Real-time "new quote needed" alerts without a WebSocket server. The
// dispatcher UI opens an EventSource (cookies ride along) and receives one
// `dispatch-alert` event per portal action.
// ---------------------------------------------------------------------------
export const dispatcherNotificationStream = async (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write(`event: connected\ndata: {"ok":true}\n\n`);

  const onAlert = (event) => {
    res.write(`event: dispatch-alert\ndata: ${JSON.stringify(event)}\n\n`);
  };
  notificationEvents.on(DISPATCH_ALERT, onAlert);

  const heartbeat = setInterval(() => res.write(`: ping\n\n`), 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    notificationEvents.off(DISPATCH_ALERT, onAlert);
  });
};

// ---------------------------------------------------------------------------
// GET /api/rates/notifications   (any authenticated user — own alerts, polling
// fallback for UIs that don't hold an SSE connection open)
// ---------------------------------------------------------------------------
export const myNotifications = async (req, res) => {
  try {
    await ensurePortalSchema();
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json({ success: true, notifications: result.rows });
  } catch (error) {
    console.error("myNotifications error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

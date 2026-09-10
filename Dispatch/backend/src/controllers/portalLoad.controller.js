import fs from "fs";
import path from "path";
import pool from "../config/db.js";
import { ensurePortalSchema } from "../services/portalSchema.service.js";
import { resolveLoadForRequest } from "../services/portalAccess.service.js";
import { buildEta, lastKnownPosition } from "../services/portalEta.service.js";
import { buildLifecycle } from "../services/portalLifecycle.service.js";
import { ensureTrackingToken, buildPublicTrackingUrl } from "../services/loadStatus.service.js";

// ---------------------------------------------------------------------------
// Everything the portal's shipment view needs: one detail payload (load,
// customs progress, documents, timeline, ETA, position), plus document
// download and a token-based public tracking endpoint for a broker's own
// consignee.
//
// Rule for this whole file: only fields a customer is entitled to see. No
// rates paid to carriers, no dispatcher notes, no other tenant's anything.
// ---------------------------------------------------------------------------

const norm = (v) => String(v || "").toLowerCase().trim().replace(/[\s-]+/g, "_");

const titleize = (v) =>
  String(v || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

/* ------------------------------------------------------------------ documents */

// Only these ever reach a customer. Anything else on the load (internal scans,
// settlement paperwork) stays invisible.
const CUSTOMER_DOC_PATTERNS = [
  /\bBOL\b/i,
  /BILL.?OF.?LADING/i,
  /\bPOD\b/i,
  /PROOF.?OF.?DELIVERY/i,
  /DELIVERY.?RECEIPT/i,
  /CUSTOMS/i,
  /COMMERCIAL.?INVOICE/i,
  /PACKING.?(LIST|SLIP)/i,
  /LOAD.?CONFIRMATION/i,
  /TENDER/i,
  /RATE.?CON/i,
  // Intake photos of the customer's own freight — the evidence they need if
  // they ever raise a damage claim.
  /SKID.?PICTURE/i,
];

const DOC_LABELS = [
  [/PROOF.?OF.?DELIVERY|\bPOD\b|DELIVERY.?RECEIPT/i, "Proof of Delivery"],
  [/\bBOL\b|BILL.?OF.?LADING/i, "Bill of Lading"],
  [/CUSTOMS/i, "Customs Paperwork"],
  [/COMMERCIAL.?INVOICE/i, "Commercial Invoice"],
  [/PACKING.?(LIST|SLIP)/i, "Packing List"],
  [/LOAD.?CONFIRMATION|TENDER|RATE.?CON/i, "Load Tender"],
  [/SKID.?PICTURE/i, "Freight Photo"],
];

const isCustomerDoc = (type, fileName) =>
  CUSTOMER_DOC_PATTERNS.some((re) => re.test(String(type || "")) || re.test(String(fileName || "")));

const docLabel = (type, fileName) => {
  for (const [re, label] of DOC_LABELS) {
    if (re.test(String(type || "")) || re.test(String(fileName || ""))) return label;
  }
  return titleize(type) || "Document";
};

const shapeDocument = (row) => ({
  id: row.id,
  label: docLabel(row.document_type, row.file_name),
  document_type: row.document_type,
  file_name: row.file_name,
  is_approved: row.is_approved === true,
  created_at: row.created_at,
  // The real path never leaves the server; downloads go through our endpoint.
  download_url: `/api/portal/loads/${row.load_id}/documents/${row.id}`,
});

async function customerDocumentsForLoad(loadId) {
  const result = await pool.query(
    `SELECT id, load_id, document_type, file_name, is_approved, created_at
       FROM documents WHERE load_id = $1 ORDER BY created_at DESC`,
    [loadId]
  );
  return result.rows.filter((r) => isCustomerDoc(r.document_type, r.file_name)).map(shapeDocument);
}

/* -------------------------------------------------------------------- customs */

const CLEARED = ["ACCEPTED", "CLEARED", "RELEASED"];
// NOT PAPS_PARS_ACTIVE: staff createLoad opens entries in that state, so it
// means "entry prepared", not "filed with customs". Treating it as filed would
// tell a broker their paperwork is in when it is not.
const FILED = ["SUBMITTED_TO_BROKER", "SUBMITTED", "SENT", "FILED"];
const PREPARED = ["PAPS_PARS_ACTIVE", "DRAFT"];
const PROBLEM = ["TIMEOUT", "REJECTED", "ERROR", "FAILED", "ON_HOLD", "HOLD"];

function buildCustomsProgress(load, entry, documents) {
  if (!load.is_cross_border && !entry) return null;

  const status = String(entry?.customs_status || "").toUpperCase();
  const bcStatus = String(entry?.border_connect_status || "").toUpperCase();
  const hasPaperwork =
    documents.some((d) => /Customs|Commercial Invoice|Packing List/i.test(d.label)) ||
    Boolean(entry?.commercial_invoice_number);

  const cleared = CLEARED.includes(status) || CLEARED.includes(bcStatus) || Boolean(entry?.cleared_at);
  const filed = cleared || FILED.includes(status) || FILED.includes(bcStatus) || Boolean(entry?.filed_at);
  const prepared = filed || PREPARED.includes(status) || Boolean(entry?.lead_number) || Boolean(entry);
  const attention = PROBLEM.includes(status) || PROBLEM.includes(bcStatus);

  const stages = [
    {
      key: "paperwork",
      label: "Customs paperwork received",
      hint: "Commercial invoice, packing list and any permits.",
      done: hasPaperwork,
      at: null,
    },
    {
      key: "prepared",
      label: entry?.lead_number_type ? `${entry.lead_number_type} number issued` : "Entry prepared",
      hint: entry?.lead_number ? `Reference ${entry.lead_number}` : "Our customs desk prepares the entry.",
      done: prepared,
      at: entry?.created_at || null,
    },
    {
      key: "filed",
      label: "Filed with customs",
      hint: entry?.customs_broker_name ? `Broker: ${entry.customs_broker_name}` : "Submitted ahead of the crossing.",
      done: filed,
      at: entry?.filed_at || null,
    },
    {
      key: "cleared",
      label: "Cleared at the border",
      hint: entry?.port_of_entry_name ? `Port: ${entry.port_of_entry_name}` : "Release received.",
      done: cleared,
      at: entry?.cleared_at || null,
    },
  ];

  return {
    applicable: true,
    status: status || "DRAFT",
    status_label: titleize(status || "DRAFT"),
    attention,
    attention_message: attention
      ? "Customs flagged this entry — our customs desk is working it. Message us here for details."
      : null,
    lead_number: entry?.lead_number || load.paps_number || null,
    lead_number_type: entry?.lead_number_type || null,
    port_of_entry: entry?.port_of_entry_name || null,
    broker: entry?.customs_broker_name || null,
    crossing_eta: entry?.crossing_eta || null,
    cleared_at: entry?.cleared_at || null,
    stages,
    // What the customer still owes us, so the checklist is actionable.
    needs_documents: !hasPaperwork,
  };
}

/* ------------------------------------------------------------------- timeline */

const STATUS_TIMELINE_LABELS = {
  entered: "Load booked",
  pending: "Load booked",
  trip_assigned: "Assigned to a truck",
  pickup_assigned: "Pickup assigned",
  dispatched: "Dispatched",
  at_pickup: "Arrived at pickup",
  picked_up: "Picked up",
  at_warehouse: "Received at our warehouse",
  in_transit: "In transit",
  at_border: "At the border",
  at_delivery: "Arrived at delivery",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  completed: "Completed",
  billed: "Invoiced",
};

// Plain-object lookup, so only a genuinely mapped string counts — a status
// spelled "constructor" or "__proto__" otherwise returns something off
// Object.prototype and we would push it as the milestone's label.
const timelineLabel = (status) => {
  const label = STATUS_TIMELINE_LABELS[norm(status)];
  return typeof label === "string" ? label : null;
};

const evt = (at, label, detail = null, kind = "status") =>
  at ? { at: new Date(at).toISOString(), label, detail, kind } : null;

async function buildTimeline(load, entry, documents) {
  const events = [];

  events.push(evt(load.created_at, "Load created", `Load #${load.load_number}`, "system"));
  events.push(evt(load.assigned_at, "Assigned to a truck"));
  events.push(evt(load.received_at_warehouse_date, "Received at our warehouse", load.intake_condition || null));
  events.push(evt(entry?.filed_at, "Customs entry filed", entry?.customs_broker_name || null, "customs"));
  events.push(evt(entry?.cleared_at, "Cleared at the border", entry?.port_of_entry_name || null, "customs"));
  events.push(evt(load.delivered_at, "Delivered", null, "delivered"));

  for (const doc of documents) {
    events.push(evt(doc.created_at, `${doc.label} uploaded`, null, "document"));
  }

  // Status transitions recorded by loadStatus.service / load.controller.
  try {
    const audit = await pool.query(
      `SELECT action, details, created_at
         FROM audit_logs
        WHERE entity_type = 'LOAD' AND entity_id = $1 AND action IN ('STATUS_CHANGED', 'LOAD_CREATED')
        ORDER BY created_at ASC
        LIMIT 200`,
      [load.id]
    );
    for (const row of audit.rows) {
      if (row.action === "LOAD_CREATED") continue; // already covered by created_at
      // load.controller writes details.new_status; loadStatus.service and the
      // create path write details.status. Read both.
      const label = timelineLabel(row.details?.status ?? row.details?.new_status);
      if (!label) continue;
      events.push(evt(row.created_at, label, null, "status"));
    }
  } catch (err) {
    console.warn("buildTimeline audit warning:", err.message);
  }

  // `loads` has no updated_at column, so an audit row is the only real clock a
  // status change ever gets. When none recorded it we say nothing instead of
  // stamping the booking time on a later milestone: buildLifecycle reads these
  // labels back as stage dates, and a "Picked up" dated at the moment the load
  // was booked is a fabricated date on the customer's screen. A load still
  // sitting at its opening status is the one honest case — created_at IS when
  // it was booked.
  const opening = norm(load.status);
  if (opening === "entered" || opening === "pending") {
    events.push(evt(load.created_at, timelineLabel(opening), null, "status"));
  }

  const seen = new Set();
  return events
    .filter(Boolean)
    .filter((e) => {
      // One entry per label — the first time it happened is the milestone.
      if (seen.has(e.label)) return false;
      seen.add(e.label);
      return true;
    })
    .sort((a, b) => new Date(a.at) - new Date(b.at));
}

/* --------------------------------------------------------------- load payload */

const shapeLoad = (load) => ({
  id: load.id,
  load_number: load.load_number,
  status: load.status,
  status_label: titleize(load.status),
  origin: load.origin,
  destination: load.destination,
  shipper_name: load.shipper_name,
  shipper_city: load.shipper_city,
  shipper_state: load.shipper_state,
  shipper_country: load.shipper_country,
  consignee_name: load.consignee_name,
  consignee_city: load.consignee_city,
  consignee_state: load.consignee_state,
  consignee_country: load.consignee_country,
  pickup_date: load.pickup_date,
  delivery_date: load.delivery_date,
  commitment_date: load.commitment_date,
  commitment_time: load.commitment_time,
  commodity: load.commodity,
  weight: load.weight,
  pieces: load.pieces,
  trailer_type: load.trailer_type,
  freight_type: load.freight_type,
  house_status: load.house_status,
  customer_reference: load.customer_reference,
  pickup_number: load.pickup_number,
  is_cross_border: load.is_cross_border,
  received_at_warehouse: load.received_at_warehouse,
  received_at_warehouse_date: load.received_at_warehouse_date,
  delivered_at: load.delivered_at,
  created_at: load.created_at,
  rate_request_id: load.rate_request_id,
});

// GET /api/portal/loads/:id
export const getPortalLoadDetail = async (req, res) => {
  try {
    await ensurePortalSchema();

    const access = await resolveLoadForRequest(req, req.params.id);
    if (!access) return res.status(404).json({ success: false, message: "Load not found" });
    const { load } = access;

    const [entryResult, documents, position, messageStats, quoteResult, carrierResult] = await Promise.all([
      pool.query(`SELECT * FROM customs_entries WHERE load_id = $1 ORDER BY created_at DESC LIMIT 1`, [load.id])
        .catch(() => ({ rows: [] })),
      customerDocumentsForLoad(load.id),
      lastKnownPosition(load),
      pool
        .query(
          `SELECT COUNT(*)::int AS total,
                  COUNT(*) FILTER (WHERE sender_side = 'staff' AND read_by_customer_at IS NULL)::int AS unread
             FROM load_messages WHERE load_id = $1`,
          [load.id]
        )
        .catch(() => ({ rows: [{ total: 0, unread: 0 }] })),
      load.rate_request_id
        ? pool
            .query(
              `SELECT quoted_price, quote_currency, responded_at FROM rate_requests WHERE id = $1`,
              [load.rate_request_id]
            )
            .catch(() => ({ rows: [] }))
        : Promise.resolve({ rows: [] }),
      pool
        .query(
          `SELECT d.first_name, d.last_name, t.truck_number
             FROM loads l
             LEFT JOIN drivers d ON d.id = l.driver_id
             LEFT JOIN trucks t ON t.id = l.truck_id
            WHERE l.id = $1`,
          [load.id]
        )
        .catch(() => ({ rows: [] })),
    ]);

    const entry = entryResult.rows[0] || null;
    const timeline = await buildTimeline(load, entry, documents);
    const carrierRow = carrierResult.rows[0] || {};
    const driverName = [carrierRow.first_name, carrierRow.last_name].filter(Boolean).join(" ");

    // Generate the shareable token lazily, so the tracking link always works.
    const token = await ensureTrackingToken(load).catch(() => null);

    res.json({
      success: true,
      load: shapeLoad(load),
      quote: quoteResult.rows[0]
        ? {
            price: quoteResult.rows[0].quoted_price,
            currency: quoteResult.rows[0].quote_currency || "USD",
            accepted_at: quoteResult.rows[0].responded_at,
          }
        : null,
      carrier:
        driverName || carrierRow.truck_number || load.pickup_trailer_number
          ? {
              driver_name: driverName || null,
              truck_number: carrierRow.truck_number || null,
              // A trailer number is not a truck number; the portal labels the
              // two apart, so never let one stand in for the other.
              trailer_number: load.pickup_trailer_number || null,
            }
          : null,
      eta: buildEta(load),
      lifecycle: buildLifecycle(load, { customsEntry: entry, timeline }),
      position,
      customs: buildCustomsProgress(load, entry, documents),
      documents,
      timeline,
      messages: {
        total: messageStats.rows[0]?.total || 0,
        unread: messageStats.rows[0]?.unread || 0,
      },
      // Prefer the origin the portal is actually served from, so a shared link
      // works in dev and behind whatever domain the portal is deployed on.
      tracking: token
        ? {
            token,
            public_url: process.env.PUBLIC_TRACKING_BASE_URL
              ? buildPublicTrackingUrl(token)
              : `${String(req.headers.origin || "").replace(/\/+$/, "") || buildPublicTrackingUrl("").replace(/\/track\/$/, "")}/track/${token}`,
          }
        : null,
    });
  } catch (error) {
    console.error("getPortalLoadDetail error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/portal/loads/:id/documents
export const listPortalLoadDocuments = async (req, res) => {
  try {
    await ensurePortalSchema();
    const access = await resolveLoadForRequest(req, req.params.id);
    if (!access) return res.status(404).json({ success: false, message: "Load not found" });

    res.json({ success: true, documents: await customerDocumentsForLoad(access.load.id) });
  } catch (error) {
    console.error("listPortalLoadDocuments error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Local-disk candidates for a stored document. The path is rebuilt from the
 * load id and the file's basename — never from the stored string — so a
 * crafted file_path can't walk out of the uploads directory.
 */
const localCandidates = (loadId, fileName) => {
  const safe = path.basename(String(fileName || ""));
  if (!safe) return [];
  const cwd = process.cwd();
  return [
    path.join(cwd, "uploads", "documents", String(loadId), safe),
    path.join(cwd, "src", "uploads", "documents", String(loadId), safe),
    path.join(cwd, "uploads", String(loadId), safe),
    path.join(cwd, "src", "uploads", safe),
    path.join(cwd, "uploads", safe),
  ];
};

// GET /api/portal/loads/:id/documents/:documentId
export const downloadPortalLoadDocument = async (req, res) => {
  try {
    await ensurePortalSchema();
    const access = await resolveLoadForRequest(req, req.params.id);
    if (!access) return res.status(404).json({ success: false, message: "Load not found" });

    const result = await pool.query(
      `SELECT id, load_id, document_type, file_name, file_path FROM documents WHERE id = $1 AND load_id = $2`,
      [req.params.documentId, access.load.id]
    );
    const doc = result.rows[0];
    if (!doc || !isCustomerDoc(doc.document_type, doc.file_name)) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    // Stored in Supabase Storage: hand the browser the storage URL.
    if (/^https?:\/\//i.test(String(doc.file_path || ""))) {
      return res.redirect(doc.file_path);
    }

    const found = localCandidates(doc.load_id, doc.file_name).find((p) => fs.existsSync(p));
    if (!found) {
      return res.status(404).json({
        success: false,
        message: "That file is not available for download yet — our team has been notified.",
      });
    }
    return res.download(found, path.basename(doc.file_name));
  } catch (error) {
    console.error("downloadPortalLoadDocument error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/portal/track?q=<text>   (customer — strictly own tenant)
//
// The dashboard's "track a shipment" box. Every lookup is anchored to
// req.customerId, and every match is an EXACT one except the last, which is a
// prefix on load_number. No LIKE %q% anywhere: a substring search would let a
// broker fish for the tail of another tenant's load number, and even inside
// one tenant it turns a typo into somebody else's shipment.
// ---------------------------------------------------------------------------

const NOT_FOUND = "No shipment found for that number.";

// Brokers paste "#22079", "Load 22079", "load-22079" straight from an email.
// Control characters go first: a NUL survives req.query into the parameter and
// Postgres rejects the whole statement (22021, invalid byte sequence), so
// ?q=22079%00 answered 500 where it owes the broker an honest 404.
const cleanTrackingQuery = (raw) =>
  String(raw || "")
    .replace(/\p{Cc}/gu, "")
    .trim()
    .replace(/^#+/, "")
    .replace(/^load[\s-]+/i, "")
    .trim();

// The prefix match is the only LIKE we run, so % and _ in the broker's text
// must stay literal characters rather than becoming wildcards.
const escapeLike = (value) => value.replace(/[\\%_]/g, "\\$&");

const TRACK_COLUMNS = `id, load_number, status, origin, destination, created_at,
                       assigned_at, received_at_warehouse_date, intake_condition, delivered_at`;

export const portalTrackLookup = async (req, res) => {
  try {
    const query = cleanTrackingQuery(req.query.q);
    if (!query) return res.status(404).json({ success: false, message: NOT_FOUND });

    // load_number is a bigint column, so every comparison casts it to text —
    // otherwise anything non-numeric the broker types is a Postgres 22P02
    // instead of an honest "not found".
    const attempts = [
      [`SELECT ${TRACK_COLUMNS} FROM loads WHERE customer_id = $1 AND load_number::text = $2 LIMIT 1`, query],
      [`SELECT ${TRACK_COLUMNS} FROM loads WHERE customer_id = $1 AND tracking_token = $2 LIMIT 1`, query],
      [`SELECT ${TRACK_COLUMNS} FROM loads WHERE customer_id = $1 AND customer_reference = $2 LIMIT 1`, query],
      [`SELECT ${TRACK_COLUMNS} FROM loads WHERE customer_id = $1 AND pickup_number = $2 LIMIT 1`, query],
      [
        `SELECT ${TRACK_COLUMNS} FROM loads
          WHERE customer_id = $1 AND load_number::text ILIKE $2 ESCAPE '\\'
          ORDER BY created_at DESC LIMIT 1`,
        `${escapeLike(query)}%`,
      ],
    ];

    for (const [sql, value] of attempts) {
      const result = await pool.query(sql, [req.customerId, value]);
      const load = result.rows[0];
      if (!load) continue;

      const lifecycle = buildLifecycle(load);
      return res.json({
        success: true,
        load: {
          id: load.id,
          load_number: load.load_number,
          status: load.status,
          status_label: titleize(load.status),
          origin: load.origin,
          destination: load.destination,
          lifecycle_rank: lifecycle.current_rank,
          lifecycle_label: lifecycle.current.label,
        },
      });
    }

    res.status(404).json({ success: false, message: NOT_FOUND });
  } catch (error) {
    // Whatever the broker typed reaches the database, so the raw driver message
    // can carry our SQL back out. Log it, show them a sentence.
    console.error("portalTrackLookup error:", error);
    res.status(500).json({ success: false, message: "Tracking is temporarily unavailable" });
  }
};

// ---------------------------------------------------------------------------
// GET /api/track/:token   (PUBLIC — no session)
//
// The link a broker forwards to their consignee. Token-only: load numbers are
// guessable, tokens are 128-bit random. The payload is deliberately thin —
// lane, milestones, ETA. No prices, no contacts, no documents.
// ---------------------------------------------------------------------------
export const publicTrackByToken = async (req, res) => {
  try {
    const token = String(req.params.token || "").trim();
    if (!/^[a-f0-9]{16,64}$/i.test(token)) {
      return res.status(404).json({
        success: false,
        message: "That tracking link is not valid. Ask your Nishan Transport contact for a current link.",
      });
    }

    const result = await pool.query(`SELECT * FROM loads WHERE tracking_token = $1`, [token]);
    const load = result.rows[0];
    if (!load) {
      return res.status(404).json({
        success: false,
        message: "That tracking link is not valid. Ask your Nishan Transport contact for a current link.",
      });
    }

    const entry = await pool
      .query(`SELECT * FROM customs_entries WHERE load_id = $1 ORDER BY created_at DESC LIMIT 1`, [load.id])
      .catch(() => ({ rows: [] }));
    const documents = await customerDocumentsForLoad(load.id).catch(() => []);
    const timeline = await buildTimeline(load, entry.rows[0] || null, []);
    const position = await lastKnownPosition(load);

    res.json({
      success: true,
      shipment: {
        load_number: load.load_number,
        status: load.status,
        status_label: titleize(load.status),
        origin: load.origin,
        destination: load.destination,
        pickup_date: load.pickup_date,
        delivery_date: load.delivery_date,
        commodity: load.commodity,
        pieces: load.pieces,
        weight: load.weight,
        is_cross_border: load.is_cross_border,
        delivered_at: load.delivered_at,
        pod_available: documents.some((d) => d.label === "Proof of Delivery"),
      },
      eta: buildEta(load),
      lifecycle: buildLifecycle(load, { customsEntry: entry.rows[0] || null, timeline }),
      position: position ? { place: position.place, reported_at: position.reported_at } : null,
      timeline,
      carrier: "Nishan Transport",
    });
  } catch (error) {
    console.error("publicTrackByToken error:", error);
    res.status(500).json({ success: false, message: "Tracking is temporarily unavailable" });
  }
};

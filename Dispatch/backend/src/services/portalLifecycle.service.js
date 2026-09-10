// ---------------------------------------------------------------------------
// The nine-stage shipment lifecycle a customer sees on the portal.
//
// Pure functions only — no DB access. Callers hand in whatever they already
// fetched (the customs entry, the timeline buildTimeline produced), so the
// dashboard list can compute a rank from a load row alone without paying for
// a query per row.
//
// Honesty rules, same as portalEta.service:
//   • A stage's `at` is a REAL recorded timestamp or it is null. We never
//     synthesize one, and we never reuse a neighbouring stage's stamp.
//   • A stage below the current one is still "done" with at:null — a load in
//     transit was necessarily picked up. That is inference from sequence, not
//     invented data, and the UI shows no date for it.
// ---------------------------------------------------------------------------

export const LIFECYCLE_STAGES = [
  { rank: 1, key: "entered", label: "Order Received", description: "Booking created" },
  { rank: 2, key: "pickup_assigned", label: "Pickup Assigned", description: "Driver dispatched to shipper" },
  { rank: 3, key: "picked_up", label: "Picked Up", description: "Freight on the truck, BOL signed" },
  { rank: 4, key: "origin_hub", label: "At Origin Hub", description: "Received and staged at our dock" },
  { rank: 5, key: "trip_assigned", label: "Trip Assigned", description: "Loaded onto the line-haul trip" },
  { rank: 6, key: "in_transit", label: "In Transit", description: "On the highway" },
  { rank: 7, key: "dest_hub", label: "Border / Dest. Hub", description: "Customs and inbound terminal" },
  { rank: 8, key: "out_for_delivery", label: "Out for Delivery", description: "Final mile to the consignee" },
  { rank: 9, key: "delivered", label: "Delivered", description: "Signed for at destination" },
];

const norm = (v) => String(v || "").toLowerCase().trim().replace(/[\s-]+/g, "_");

// Live data carries every casing ('PENDING', 'Entered', 'trip_assigned') plus
// the vocabularies of both the dispatch board and the warehouse screens, so
// several spellings land on the same stage.
const STATUS_RANK = {
  delivered: 9,
  completed: 9,
  billed: 9,
  invoiced: 9,
  pod_received: 9,

  out_for_delivery: 8,
  final_mile: 8,
  at_delivery: 8,

  at_border: 7,
  customs: 7,
  dest_hub: 7,
  at_customs: 7,

  in_transit: 6,
  shipped: 6,
  en_route: 6,

  trip_assigned: 5,
  consolidated: 5,

  at_warehouse: 4,
  origin_hub: 4,
  warehouse: 4,
  received: 4,

  picked_up: 3,
  at_pickup: 3,
  bol_approved: 3,

  pickup_assigned: 2,
  dispatched: 2,
  assigned: 2,
};

/** Rank implied by load.status alone. Anything unmapped is a fresh booking. */
export const rankForStatus = (status) => {
  // STATUS_RANK is a plain object, so a status spelled "constructor" or
  // "__proto__" reaches Object.prototype and hands back a function — which
  // would ride out through current_rank and turn percent into NaN.
  const rank = STATUS_RANK[norm(status)];
  return typeof rank === "number" ? rank : 1;
};

export const stageForRank = (rank) => {
  const clamped = Math.min(Math.max(Math.round(Number(rank) || 1), 1), LIFECYCLE_STAGES.length);
  return LIFECYCLE_STAGES[clamped - 1];
};

const iso = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

/** First timeline entry matching one of these exact labels, in preference order. */
const stampFor = (timeline, ...labels) => {
  for (const label of labels) {
    const hit = timeline.find((e) => e && e.label === label && e.at);
    if (hit) return iso(hit.at);
  }
  return null;
};

/** Broker and port are the only customs facts a customer needs on this stage. */
const customsDetail = (entry) => {
  if (!entry) return null;
  const parts = [entry.customs_broker_name, entry.port_of_entry_name].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
};

export function buildLifecycle(load, { customsEntry = null, timeline = [] } = {}) {
  if (!load) return null;

  const events = Array.isArray(timeline) ? timeline : [];
  const entry = customsEntry || null;

  // load.assigned_at is the dispatch stamp (rank 2). When it exists the
  // "Assigned to a truck" timeline entry is that same moment, so rank 5 has no
  // stamp of its own rather than echoing rank 2's.
  const assignedAt = iso(load.assigned_at);

  const stamps = {
    1: iso(load.created_at),
    2: assignedAt,
    3: stampFor(events, "Picked up"),
    4: iso(load.received_at_warehouse_date),
    5: assignedAt ? null : stampFor(events, "Assigned to a truck"),
    6: stampFor(events, "In transit"),
    7: iso(entry?.cleared_at) || iso(entry?.filed_at),
    8: stampFor(events, "Out for delivery", "Arrived at delivery"),
    9: iso(load.delivered_at),
  };

  const details = {
    4: load.intake_condition || null,
    7: customsDetail(entry),
  };

  // A real timestamp for a later stage outranks a status the board never
  // caught up on — the load cannot be cleared at the border and still "at
  // pickup". Rank 1's stamp is just the booking, it floors nothing.
  let current_rank = rankForStatus(load.status);
  for (const rank of [2, 3, 4, 5, 6, 7, 8, 9]) {
    if (stamps[rank]) current_rank = Math.max(current_rank, rank);
  }

  const stages = LIFECYCLE_STAGES.map((stage) => ({
    ...stage,
    state: stage.rank < current_rank ? "done" : stage.rank === current_rank ? "current" : "pending",
    at: stamps[stage.rank] || null,
    detail: details[stage.rank] || null,
  }));

  return {
    current_rank,
    percent: Math.round(((current_rank - 1) / (LIFECYCLE_STAGES.length - 1)) * 100),
    current: { ...stageForRank(current_rank) },
    stages,
  };
}

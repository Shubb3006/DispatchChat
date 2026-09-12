/* ══════════════════════════════════════════════════════════════════════════
   Canonical load lifecycle statuses.

   Single source of truth for `loads.status`. The Kanban board's seven columns,
   the Operations Board's derived fields, and the status dropdown in the load
   modal all read from here, so a status set in one place lands where you expect
   in the others.

   Previously the modal's dropdown wrote `house_status` from a separate list of
   44 legacy values that nothing else read — setting a status there had no
   effect on the Kanban board at all.

   Statuses are stored lowercase. Existing rows are mixed case ("PENDING",
   "Entered"), so every comparison goes through `normalizeStatus`.
   ══════════════════════════════════════════════════════════════════════════ */

export const STATUS_STAGES = [
  {
    id: "col_pending",
    title: "1. Open Tenders / Unassigned",
    shortTitle: "Open / Unassigned",
    primary: "pending",
    statuses: [
      { value: "pending", label: "Pending" },
      { value: "unassigned", label: "Unassigned" },
      { value: "open_tender", label: "Open Tender" },
      { value: "entered", label: "Entered" },
      { value: "new", label: "New" },
      { value: "booked", label: "Booked" },
    ],
  },
  {
    id: "col_dispatched",
    title: "2. Dispatched to Shipper",
    shortTitle: "Dispatched",
    primary: "dispatched",
    statuses: [
      // Set by trip consolidation. It had no column before, so every
      // consolidated load silently disappeared from the Kanban board.
      { value: "trip_assigned", label: "Assigned to Trip" },
      { value: "dispatched", label: "Dispatched" },
      { value: "assigned", label: "Assigned" },
      { value: "en_route_pickup", label: "En Route to Pickup" },
    ],
  },
  {
    id: "col_at_pickup",
    title: "3. At Shipper / Loading Dock",
    shortTitle: "At Shipper",
    primary: "at_pickup",
    statuses: [
      { value: "at_pickup", label: "At Pickup" },
      { value: "at_shipper", label: "At Shipper" },
      { value: "loading", label: "Loading" },
      { value: "picked_up", label: "Picked Up" },
    ],
  },
  {
    id: "col_in_transit",
    title: "4. In Transit / Highway GPS",
    shortTitle: "In Transit",
    primary: "in_transit",
    statuses: [
      { value: "in_transit", label: "In Transit" },
      { value: "moving", label: "Moving" },
      { value: "on_route", label: "On Route" },
    ],
  },
  {
    id: "col_at_border",
    title: "5. Customs & Border Port",
    shortTitle: "Border / Customs",
    primary: "at_border",
    statuses: [
      { value: "at_border", label: "At Border" },
      { value: "customs_hold", label: "Customs Hold" },
      { value: "customs_inspection", label: "Customs Inspection" },
      { value: "border_crossing", label: "Border Crossing" },
    ],
  },
  {
    id: "col_at_delivery",
    title: "6. At Receiver / Warehouse Intake",
    shortTitle: "At Receiver",
    primary: "at_delivery",
    statuses: [
      { value: "at_delivery", label: "At Delivery" },
      { value: "at_consignee", label: "At Consignee" },
      { value: "at_warehouse", label: "At Warehouse" },
      { value: "received_at_warehouse", label: "Received at Warehouse" },
      { value: "unloading", label: "Unloading" },
      { value: "dock_wait", label: "Dock Wait" },
    ],
  },
  {
    id: "col_delivered",
    title: "7. Delivered / Ready to Bill",
    shortTitle: "Delivered",
    primary: "delivered",
    statuses: [
      { value: "delivered", label: "Delivered" },
      { value: "completed", label: "Completed" },
      { value: "billed", label: "Billed" },
    ],
  },
];

// Rows exist as "PENDING" and "Entered" alongside "pending", so never compare raw.
export const normalizeStatus = (status) =>
  String(status || "pending").trim().toLowerCase();

export const MATCHING_STATUSES = Object.fromEntries(
  STATUS_STAGES.map((stage) => [stage.id, stage.statuses.map((s) => s.value)])
);

const STATUS_INDEX = new Map();
STATUS_STAGES.forEach((stage) => {
  stage.statuses.forEach((s) => STATUS_INDEX.set(s.value, { ...s, stage }));
});

export const stageForStatus = (status) =>
  STATUS_INDEX.get(normalizeStatus(status))?.stage || null;

export const statusLabel = (status) => {
  const hit = STATUS_INDEX.get(normalizeStatus(status));
  if (hit) return hit.label;
  // An unrecognised value is shown as-is rather than silently relabelled.
  return status ? String(status).replace(/_/g, " ") : "—";
};

export const ALL_STATUSES = STATUS_STAGES.flatMap((s) => s.statuses);

/* Kanban column tint for a status, so the modal badge and the board agree. */
export const statusTone = (status) => {
  const stage = stageForStatus(status);
  switch (stage?.id) {
    case "col_pending": return "bg-amber-50 text-amber-800 border-amber-300";
    case "col_dispatched": return "bg-indigo-50 text-indigo-800 border-indigo-300";
    case "col_at_pickup": return "bg-sky-50 text-sky-800 border-sky-300";
    case "col_in_transit": return "bg-cyan-50 text-cyan-800 border-cyan-300";
    case "col_at_border": return "bg-purple-50 text-purple-800 border-purple-300";
    case "col_at_delivery": return "bg-orange-50 text-orange-800 border-orange-300";
    case "col_delivered": return "bg-emerald-50 text-emerald-800 border-emerald-300";
    default: return "bg-base-200 text-slate-700 border-slate-300";
  }
};

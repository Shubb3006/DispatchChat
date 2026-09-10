// ---------------------------------------------------------------------------
// Shared presentation helpers for the customer portal.
//
// Every customer-facing surface (dashboard, shipment detail, rate request,
// public tracking) runs its values through these, so a status, a date or a
// weight reads identically wherever it appears.
// ---------------------------------------------------------------------------

const DONE_STATUSES = ["delivered", "completed", "billed", "invoiced"];

export const normalize = (value) =>
  String(value || "").toLowerCase().trim().replace(/[\s-]+/g, "_");

export const humanize = (value) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

export const isDelivered = (status) => DONE_STATUSES.includes(normalize(status));

export const fmtDate = (value, opts = { month: "short", day: "numeric", year: "numeric" }) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, opts);
};

export const fmtTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
};

export const fmtDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${fmtTime(value)}`;
};

/** "3 hours ago" / "in 2 days" — for timeline rows and notification lists. */
export const relativeTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const diff = d.getTime() - Date.now();
  const abs = Math.abs(diff);
  const units = [
    ["day", 86400000],
    ["hour", 3600000],
    ["minute", 60000],
  ];
  for (const [unit, ms] of units) {
    if (abs >= ms) {
      const value2 = Math.round(diff / ms);
      try {
        return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(value2, unit);
      } catch {
        return `${Math.abs(value2)} ${unit}${Math.abs(value2) === 1 ? "" : "s"} ${diff < 0 ? "ago" : "from now"}`;
      }
    }
  }
  return "just now";
};

export const fmtWeight = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? `${n.toLocaleString()} lbs` : null;
};

/**
 * Money for a carrier that quotes in both USD and CAD. narrowSymbol keeps the
 * amount to a plain "$500.00" so the callers that print the currency code
 * beside it don't read as "CA$500.00CAD".
 */
export const fmtMoney = (value, currency = "USD") => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    }).format(n);
  } catch {
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
    } catch {
      return `$${n.toFixed(2)}`;
    }
  }
};

// Customer-facing milestones, mapped from the ops status vocabulary in
// loadStatus.service.js (entered / trip_assigned / at_pickup / at_warehouse /
// in_transit / at_border / at_delivery / delivered ...).
export const STAGES = ["Booked", "Assigned", "In Transit", "Delivered"];

export const stageIndex = (status) => {
  const s = normalize(status);
  if (isDelivered(s)) return 3;
  if (["picked_up", "at_warehouse", "in_transit", "out_for_delivery", "arrived", "at_border", "at_delivery"].includes(s))
    return 2;
  if (["trip_assigned", "pickup_assigned", "dispatched", "assigned", "planned", "at_pickup"].includes(s)) return 1;
  return 0;
};

export const statusTone = (status) => {
  const s = normalize(status);
  if (isDelivered(s)) return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20";
  if (s.includes("delay") || s.includes("exception") || s.includes("hold"))
    return "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20";
  if (["in_transit", "picked_up", "out_for_delivery", "at_pickup", "at_delivery", "at_border"].includes(s))
    return "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20";
  if (["trip_assigned", "pickup_assigned", "dispatched", "assigned"].includes(s))
    return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20";
  if (s === "at_warehouse") return "bg-violet-50 text-violet-700 ring-1 ring-violet-600/20";
  return "bg-slate-100 text-slate-700 ring-1 ring-slate-500/20";
};

export const rateTone = (status) => {
  const s = String(status || "").toUpperCase();
  if (s === "QUOTED") return "bg-amber-50 text-amber-800 ring-1 ring-amber-600/25";
  if (s === "ACCEPTED") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20";
  if (s === "REJECTED" || s === "DECLINED") return "bg-slate-100 text-slate-600 ring-1 ring-slate-500/20";
  return "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20";
};

/** Tone for the ETA states produced by the backend's portalEta.service. */
export const etaTone = (state) => {
  switch (state) {
    case "delivered":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20";
    case "late":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20";
    case "at_risk":
      return "bg-amber-50 text-amber-800 ring-1 ring-amber-600/25";
    case "due_today":
      return "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20";
    case "on_time":
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-500/20";
    default:
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-500/20";
  }
};

// ---------------------------------------------------------------------------
// Freight vocabulary — mirrors backend/src/services/rateRequestFreight.service.js
// (the server drops any value not on its whitelist, so these must stay in step).
// ---------------------------------------------------------------------------

export const EQUIPMENT_LABELS = {
  dry_van: "Dry Van (53')",
  reefer: "Reefer / Temp-Controlled",
  flatbed: "Flatbed",
  step_deck: "Step Deck",
  straight_truck: "Straight Truck",
  sprinter: "Sprinter / Cargo Van",
  ltl: "LTL / Partial",
  other: "Other / Not sure",
};

export const SERVICE_LABELS = {
  standard: "Standard",
  expedited: "Expedited",
  team: "Team (non-stop)",
};

export const ACCESSORIAL_LABELS = {
  liftgate_pickup: "Liftgate at pickup",
  liftgate_delivery: "Liftgate at delivery",
  inside_pickup: "Inside pickup",
  inside_delivery: "Inside delivery",
  appointment_required: "Appointment required",
  residential: "Residential location",
  tarp: "Tarping required",
  team_service: "Team service",
  sort_segregate: "Sort & segregate",
};

/** Temperature range as the customer entered it, or null. */
export const fmtTemperature = (temperature) => {
  if (!temperature?.controlled) return null;
  const range = [temperature.min_f, temperature.max_f].filter((v) => v !== null && v !== undefined);
  return range.length ? `${range.join(" to ")}°F` : "Temp-controlled";
};

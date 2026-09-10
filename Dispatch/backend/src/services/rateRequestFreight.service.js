// ---------------------------------------------------------------------------
// rate_requests.freight_details is a JSONB blob, so it is the one place a
// broker's request can grow without a migration — but only through this
// whitelist. Anything not listed here is dropped before it reaches the DB,
// and every enum is clamped to a known value so the dispatcher screen can
// render it without defensive checks.
// ---------------------------------------------------------------------------

export const EQUIPMENT_TYPES = [
  { value: "dry_van", label: "Dry Van (53')" },
  { value: "reefer", label: "Reefer / Temp-Controlled" },
  { value: "flatbed", label: "Flatbed" },
  { value: "step_deck", label: "Step Deck" },
  { value: "straight_truck", label: "Straight Truck" },
  { value: "sprinter", label: "Sprinter / Cargo Van" },
  { value: "ltl", label: "LTL / Partial" },
  { value: "other", label: "Other / Not sure" },
];

export const SERVICE_LEVELS = [
  { value: "standard", label: "Standard" },
  { value: "expedited", label: "Expedited" },
  { value: "team", label: "Team (non-stop)" },
];

export const ACCESSORIALS = [
  { value: "liftgate_pickup", label: "Liftgate at pickup" },
  { value: "liftgate_delivery", label: "Liftgate at delivery" },
  { value: "inside_pickup", label: "Inside pickup" },
  { value: "inside_delivery", label: "Inside delivery" },
  { value: "appointment_required", label: "Appointment required" },
  { value: "residential", label: "Residential location" },
  { value: "tarp", label: "Tarping required" },
  { value: "team_service", label: "Team service" },
  { value: "sort_segregate", label: "Sort & segregate" },
];

export const STOP_TYPES = ["pickup", "delivery"];

const EQUIPMENT_VALUES = EQUIPMENT_TYPES.map((e) => e.value);
const SERVICE_VALUES = SERVICE_LEVELS.map((s) => s.value);
const ACCESSORIAL_VALUES = ACCESSORIALS.map((a) => a.value);

const str = (value, max = 500) => {
  const out = typeof value === "string" ? value.trim() : "";
  return out ? out.slice(0, max) : null;
};

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n !== 0 ? n : null;
};

const bool = (value) => value === true || value === "true";

const oneOf = (value, allowed) => (allowed.includes(String(value)) ? String(value) : null);

// "2026-09-14" / ISO — kept as a plain date string; the dispatcher screen and
// the customer both read it as a calendar day, not a timestamp.
const dateStr = (value) => {
  const raw = str(value, 40);
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : raw.slice(0, 10);
};

const timeStr = (value) => {
  const raw = str(value, 10);
  return raw && /^\d{1,2}:\d{2}$/.test(raw) ? raw : null;
};

const window = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  const out = {
    date: dateStr(raw.date),
    earliest: timeStr(raw.earliest),
    latest: timeStr(raw.latest),
  };
  return out.date || out.earliest || out.latest ? out : null;
};

const stops = (raw) => {
  if (!Array.isArray(raw)) return null;
  const cleaned = raw
    .slice(0, 8) // a rate request with more than 8 stops is a phone call
    .map((s) => ({
      type: oneOf(s?.type, STOP_TYPES) || "pickup",
      company: str(s?.company, 200),
      location: str(s?.location, 300),
      date: dateStr(s?.date),
      notes: str(s?.notes, 500),
    }))
    .filter((s) => s.location || s.company);
  return cleaned.length ? cleaned : null;
};

const temperature = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  if (!bool(raw.controlled)) return null;
  return {
    controlled: true,
    min_f: num(raw.min_f),
    max_f: num(raw.max_f),
  };
};

const hazmat = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  if (!bool(raw.is_hazmat)) return null;
  return {
    is_hazmat: true,
    un_number: str(raw.un_number, 20),
    hazard_class: str(raw.hazard_class ?? raw.class, 20),
    packing_group: str(raw.packing_group, 10),
    emergency_contact: str(raw.emergency_contact, 120),
  };
};

/**
 * Normalize whatever the portal posted into the stored freight_details shape.
 * Legacy keys (pieces/weight/dims.l) keep working — older clients still post
 * them and existing rows still contain them.
 */
export function sanitizeFreightDetails(input) {
  const fd = input && typeof input === "object" ? input : {};

  const details = {
    // --- original fields, unchanged shape -----------------------------------
    skids: num(fd.skids ?? fd.pieces),
    weight_lbs: num(fd.weight_lbs ?? fd.weight),
    dims:
      fd.dims && typeof fd.dims === "object"
        ? {
            length_in: num(fd.dims.length_in ?? fd.dims.l),
            width_in: num(fd.dims.width_in ?? fd.dims.w),
            height_in: num(fd.dims.height_in ?? fd.dims.h),
          }
        : null,
    commodity: str(fd.commodity, 500),
    notes: str(fd.notes, 2000),

    // --- richer request ------------------------------------------------------
    equipment: oneOf(fd.equipment, EQUIPMENT_VALUES),
    service_level: oneOf(fd.service_level, SERVICE_VALUES),
    stackable: fd.stackable === undefined ? null : bool(fd.stackable),
    temperature: temperature(fd.temperature),
    hazmat: hazmat(fd.hazmat),
    pickup_window: window(fd.pickup_window),
    delivery_window: window(fd.delivery_window),
    stops: stops(fd.stops),
    accessorials: Array.isArray(fd.accessorials)
      ? [...new Set(fd.accessorials.map(String).filter((a) => ACCESSORIAL_VALUES.includes(a)))]
      : null,
    reference: str(fd.reference, 100),
    declared_value: num(fd.declared_value),
    declared_value_currency: oneOf(fd.declared_value_currency, ["USD", "CAD"]),
  };

  // Drop empty keys so the stored JSON stays readable in psql and on the
  // dispatcher screen.
  for (const key of Object.keys(details)) {
    const v = details[key];
    if (v === null || v === undefined || (Array.isArray(v) && v.length === 0)) delete details[key];
  }
  if (details.dims && !details.dims.length_in && !details.dims.width_in && !details.dims.height_in) {
    delete details.dims;
  }

  return details;
}

/**
 * One-line summary used in dispatcher alerts and list rows.
 */
export function summarizeFreight(details = {}) {
  const bits = [];
  if (details.equipment) {
    bits.push(EQUIPMENT_TYPES.find((e) => e.value === details.equipment)?.label || details.equipment);
  }
  if (details.skids) bits.push(`${details.skids} skid${details.skids > 1 ? "s" : ""}`);
  if (details.weight_lbs) bits.push(`${Number(details.weight_lbs).toLocaleString()} lbs`);
  if (details.temperature?.controlled) {
    const range = [details.temperature.min_f, details.temperature.max_f].filter((v) => v != null);
    bits.push(range.length ? `temp ${range.join("–")}°F` : "temp-controlled");
  }
  if (details.hazmat?.is_hazmat) bits.push(`HAZMAT${details.hazmat.un_number ? ` ${details.hazmat.un_number}` : ""}`);
  if (details.service_level && details.service_level !== "standard") bits.push(details.service_level);
  if (details.stops?.length) bits.push(`${details.stops.length} extra stop${details.stops.length > 1 ? "s" : ""}`);
  return bits.join(" | ");
}

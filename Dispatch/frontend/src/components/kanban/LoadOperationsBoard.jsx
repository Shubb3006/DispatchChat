import React, { useState, useMemo, useRef, useEffect } from "react";
import { Filter, X, Pencil, Check, Ban, CalendarRange, Search } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════
   Load Operations Control Board

   One row per load, grouped by trip so every load on the same trip sits
   together in trip sequence. Supports a pickup/delivery date-range filter,
   per-column dropdown filters, and inline editing of the operational fields.

   Each column's `value()` produces the string that is BOTH rendered and used
   as that column's filter option, so the dropdown can never offer a value the
   table doesn't actually show.
   ══════════════════════════════════════════════════════════════════════ */

const DASH = "—";

export const fmtDateTime = (value) => {
  if (!value) return DASH;
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-CA", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// <input type="datetime-local"> needs exactly "YYYY-MM-DDTHH:mm" in LOCAL time.
const toLocalInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/* ───────────── Derived lifecycle values ─────────────
   Each prefers a stored column when the dispatcher has set one, and falls
   back to inferring from loads.status otherwise. */

const getWarehouse = (s) => {
  const raw = String(s.warehouse_location || s.warehouseLocation || "").trim();
  if (!raw) return s.received_at_warehouse ? "RECEIVED" : DASH;
  const up = raw.toUpperCase();
  if (up.includes("MONTREAL") || up.includes("MTL")) return "MONTREAL";
  if (up.includes("BRITANNIA")) return "BRITANNIA";
  if (up.includes("MISSISSAUGA") || up.includes("MISS")) return "MISSISSAUGA";
  return raw;
};

const getAceStatus = (s) => {
  const bc = String(s.border_connect_status || s.borderConnectStatus || "").toUpperCase();
  if (bc) return bc;
  return s.paps_number ? "FILED" : DASH;
};

const getBorderReached = (s) => {
  const st = String(s.status || "").toLowerCase();
  if (["at_border", "customs_hold", "customs_inspection", "border_crossing"].includes(st)) return "AT BORDER";
  if (["at_delivery", "at_consignee", "at_warehouse", "delivered", "completed", "billed", "unloading"].includes(st)) return "CROSSED";
  return "NOT YET";
};

const getCommitmentType = (s) => {
  const c = String(s.commitment || s.deliveryCommitment || "normal").toLowerCase();
  if (c === "guaranteed_appointment") return "GUAR + APPT";
  if (c === "guaranteed") return "GUARANTEED";
  if (c === "appointment") return "APPOINTMENT";
  return "NORMAL";
};

const getDeliveryDateTime = (s) => {
  if (s.commitment_date) {
    return `${String(s.commitment_date).slice(0, 10)}${s.commitment_time ? ` ${s.commitment_time}` : ""}`;
  }
  return fmtDateTime(s.delivery_date || s.eta);
};

const getDeliveredStatus = (s) => {
  if (s.delivered_status) return String(s.delivered_status).replace(/_/g, " ").toUpperCase();
  const st = String(s.status || "").toLowerCase();
  if (st === "at_freight_force" || s.freight_force || s.freightForce) return "FREIGHT FORCE";
  if (st === "billed" || st === "invoiced") return "INVOICED";
  if (st === "delivered" || st === "completed") return "CAN INVOICE";
  return "PENDING";
};

const getEmptyStatus = (s) => {
  if (s.empty_status) return String(s.empty_status).toUpperCase();
  const st = String(s.status || "").toLowerCase();
  if (["delivered", "completed", "billed"].includes(st)) return "EMPTY";
  if (["at_delivery", "at_consignee", "unloading", "dock_wait"].includes(st)) return "UNLOADING";
  return "LOADED";
};

const getEtaToEmpty = (s) => {
  if (s.eta_to_empty) return fmtDateTime(s.eta_to_empty);
  if (getEmptyStatus(s) === "EMPTY") return "EMPTY NOW";
  return fmtDateTime(s.delivery_date || s.eta);
};

const getPickupStatus = (s) => {
  const st = String(s.status || "").toLowerCase();
  if (["unassigned", "pending", "open_tender", "new", "booked", "entered"].includes(st)) return "NOT ASSIGNED";
  if (["dispatched", "assigned", "en_route_pickup"].includes(st)) return "EN ROUTE";
  if (["at_pickup", "at_shipper", "loading"].includes(st)) return "AT SHIPPER";
  return "PICKED UP";
};

/* ───────────── Chip colouring ───────────── */

const chip = (tone) =>
  `px-1.5 py-0.5 rounded text-[9px] font-black inline-block ${tone}`;

const TONES = {
  good: "bg-emerald-100 text-emerald-800",
  strong: "bg-emerald-200 text-emerald-900",
  info: "bg-sky-100 text-sky-800",
  trip: "bg-indigo-100 text-indigo-800",
  warn: "bg-amber-100 text-amber-800",
  hot: "bg-orange-100 text-orange-800",
  bad: "bg-rose-100 text-rose-800",
  badStrong: "bg-rose-200 text-rose-900",
  cool: "bg-teal-200 text-teal-900",
  purple: "bg-purple-100 text-purple-800",
  mute: "bg-slate-100 text-slate-500",
  neutral: "bg-slate-100 text-slate-600",
};

/* ───────────── Column registry ─────────────
   value(s, ctx) → display string (also the filter option)
   edit          → how the cell becomes editable, and which body field to PUT
                   (omit for columns the API cannot persist) */

const WAREHOUSES = ["MONTREAL", "BRITANNIA", "MISSISSAUGA"];
const ACE_STATES = ["DRAFT", "QUEUED", "SENT", "ACCEPTED", "REJECTED", "ERROR"];
const COMMITMENTS = [
  { label: "NORMAL", value: "normal" },
  { label: "APPOINTMENT", value: "appointment" },
  { label: "GUARANTEED", value: "guaranteed" },
  { label: "GUAR + APPT", value: "guaranteed_appointment" },
];
const DELIVERED_STATES = ["PENDING", "CAN_INVOICE", "FREIGHT_FORCE", "INVOICED"];
const EMPTY_STATES = ["LOADED", "UNLOADING", "EMPTY"];
const NEXT_PICKUP_STATES = ["PREASSIGNED", "SEARCHING"];

const COLUMNS = [
  {
    key: "load_number",
    label: "Load #",
    head: "bg-slate-800",
    pinned: true,
    value: (s) => `#${s.load_number || s.id}`,
  },
  {
    key: "paps_number",
    label: "Nishan PB #",
    head: "bg-slate-700",
    value: (s) => s.paps_number || s.pb_number || DASH,
    edit: { type: "text", field: "paps_number", get: (s) => s.paps_number || "" },
  },
  {
    key: "lane",
    label: "From → To",
    head: "bg-slate-700",
    value: (s) => `${s.shipper_city || s.originCity || DASH} → ${s.consignee_city || s.destinationCity || DASH}`,
  },
  {
    key: "pickup_date",
    label: "Pickup Date / Time",
    head: "bg-amber-700",
    mono: true,
    value: (s) => fmtDateTime(s.pickup_date),
    edit: { type: "datetime-local", field: "pickup_date", get: (s) => toLocalInput(s.pickup_date) },
  },
  {
    key: "pickup_status",
    label: "Pickup Status",
    head: "bg-amber-700",
    value: getPickupStatus,
    tone: (v) =>
      v === "PICKED UP" ? TONES.good : v === "AT SHIPPER" ? TONES.info : v === "EN ROUTE" ? TONES.trip : TONES.warn,
  },
  {
    key: "pickup_trailer_number",
    label: "Pickup Trailer #",
    head: "bg-amber-700",
    mono: true,
    value: (s) => s.pickup_trailer_number || s.trailerNumber || DASH,
    edit: { type: "text", field: "pickup_trailer_number", get: (s) => s.pickup_trailer_number || "" },
  },
  {
    key: "warehouse",
    label: "Warehouse Reached",
    head: "bg-sky-700",
    value: getWarehouse,
    tone: (v) => (v === DASH ? TONES.mute : TONES.info),
    edit: {
      type: "select",
      field: "warehouse_location",
      options: ["", ...WAREHOUSES],
      get: (s) => s.warehouse_location || "",
    },
  },
  {
    key: "trip_assigned",
    label: "Trip Assigned",
    head: "bg-indigo-700",
    value: (s, ctx) => (ctx.tripNumber ? "YES" : "NO"),
    tone: (v) => (v === "YES" ? TONES.good : TONES.bad),
  },
  {
    key: "trip_number",
    label: "Trip #",
    head: "bg-indigo-700",
    mono: true,
    className: "font-bold text-indigo-700",
    value: (s, ctx) => ctx.tripNumber || DASH,
  },
  {
    key: "truck_number",
    label: "Truck #",
    head: "bg-indigo-700",
    mono: true,
    className: "font-bold",
    value: (s) => s.truckNumber || s.truck_number || DASH,
  },
  {
    key: "trailer_number",
    label: "Trailer #",
    head: "bg-indigo-700",
    mono: true,
    className: "font-bold",
    value: (s) => s.trailerNumber || s.trailer_number || DASH,
  },
  {
    key: "ace_status",
    label: "ACE Status",
    head: "bg-purple-700",
    value: getAceStatus,
    tone: (v) =>
      v === "ACCEPTED" ? TONES.good
        : v === "REJECTED" || v === "ERROR" ? TONES.bad
        : ["SENT", "QUEUED", "FILED"].includes(v) ? TONES.info
        : v === "DRAFT" ? TONES.warn
        : TONES.mute,
    edit: {
      type: "select",
      field: "border_connect_status",
      options: ["", ...ACE_STATES],
      get: (s) => String(s.border_connect_status || "").toUpperCase(),
    },
  },
  {
    key: "border_reached",
    label: "Reached Border",
    head: "bg-purple-700",
    value: getBorderReached,
    tone: (v) => (v === "CROSSED" ? TONES.good : v === "AT BORDER" ? TONES.purple : TONES.mute),
  },
  {
    key: "delivery_date",
    label: "Delivery Date / Time",
    head: "bg-emerald-700",
    mono: true,
    value: getDeliveryDateTime,
    edit: { type: "datetime-local", field: "delivery_date", get: (s) => toLocalInput(s.delivery_date) },
  },
  {
    key: "commitment",
    label: "Commitment",
    head: "bg-emerald-700",
    value: getCommitmentType,
    tone: (v) =>
      v === "GUAR + APPT" ? TONES.bad : v === "GUARANTEED" ? TONES.hot : v === "APPOINTMENT" ? TONES.warn : TONES.neutral,
    edit: {
      type: "select",
      field: "commitment",
      options: COMMITMENTS,
      get: (s) => String(s.commitment || "normal").toLowerCase(),
    },
  },
  {
    key: "delivered_status",
    label: "Delivered Status",
    head: "bg-emerald-800",
    value: getDeliveredStatus,
    tone: (v) =>
      v === "CAN INVOICE" ? TONES.strong : v === "INVOICED" ? TONES.cool : v === "FREIGHT FORCE" ? TONES.badStrong : TONES.warn,
    edit: {
      type: "select",
      field: "delivered_status",
      options: ["", ...DELIVERED_STATES],
      get: (s) => String(s.delivered_status || "").toUpperCase(),
    },
  },
  {
    key: "empty_status",
    label: "Empty Status",
    head: "bg-teal-700",
    value: getEmptyStatus,
    tone: (v) => (v === "EMPTY" ? TONES.good : v === "UNLOADING" ? TONES.warn : TONES.neutral),
    edit: {
      type: "select",
      field: "empty_status",
      options: ["", ...EMPTY_STATES],
      get: (s) => String(s.empty_status || "").toUpperCase(),
    },
  },
  {
    key: "eta_to_empty",
    label: "ETA to Empty",
    head: "bg-teal-700",
    mono: true,
    value: getEtaToEmpty,
    edit: { type: "datetime-local", field: "eta_to_empty", get: (s) => toLocalInput(s.eta_to_empty) },
  },
  {
    key: "next_pickup",
    label: "New Pickup Assigned",
    head: "bg-rose-700",
    value: (s, ctx) => ctx.nextPickup,
    tone: (v) => (v.startsWith("PREASSIGNED") ? TONES.good : TONES.bad),
    edit: {
      type: "select",
      field: "next_pickup_status",
      options: ["", ...NEXT_PICKUP_STATES],
      get: (s) => String(s.next_pickup_status || "").toUpperCase(),
    },
  },
];

/* ───────────── Column filter dropdown ───────────── */

function ColumnFilter({ column, options, selected, onChange, onClose }) {
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const onDocDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onEsc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [onClose]);

  const shown = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));

  // `undefined` = no filter on this column (every value passes).
  // An array = an explicit selection, so `[]` legitimately means "show none"
  // rather than silently falling back to "show all".
  const allSelected = selected === undefined;

  const toggle = (value) => {
    const base = allSelected ? options : selected;
    const next = base.includes(value) ? base.filter((v) => v !== value) : [...base, value];
    onChange(next.length === options.length ? null : next);
  };

  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-300 rounded-lg shadow-xl z-50 text-slate-800 normal-case tracking-normal font-normal"
    >
      <div className="p-2 border-b border-slate-200">
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Filter ${column.label}...`}
            className="w-full pl-6 pr-2 py-1 text-[11px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto py-1">
        <label className="flex items-center gap-2 px-2.5 py-1 hover:bg-slate-50 cursor-pointer text-[11px] font-bold border-b border-slate-100">
          <input type="checkbox" checked={allSelected} onChange={() => onChange(null)} className="cursor-pointer" />
          <span>(Select all)</span>
        </label>

        {shown.length === 0 && <div className="px-2.5 py-2 text-[11px] text-slate-400">No matches</div>}

        {shown.map((opt) => (
          <label key={opt} className="flex items-center gap-2 px-2.5 py-1 hover:bg-slate-50 cursor-pointer text-[11px]">
            <input
              type="checkbox"
              checked={allSelected || selected.includes(opt)}
              onChange={() => toggle(opt)}
              className="cursor-pointer"
            />
            <span className="truncate" title={opt}>{opt}</span>
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between p-2 border-t border-slate-200 bg-slate-50">
        <button onClick={() => onChange(null)} className="text-[10px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer">
          Clear
        </button>
        <button onClick={onClose} className="text-[10px] font-bold text-sky-700 hover:text-sky-900 cursor-pointer">
          Done
        </button>
      </div>
    </div>
  );
}

/* ───────────── Editable cell ───────────── */

function EditCell({ edit, value, onChange }) {
  const stop = (e) => e.stopPropagation();
  const base =
    "w-full min-w-[110px] px-1.5 py-1 text-[11px] border border-sky-400 rounded bg-white focus:outline-none focus:ring-1 focus:ring-sky-500";

  if (edit.type === "select") {
    const opts = edit.options.map((o) => (typeof o === "string" ? { label: o || "— none —", value: o } : o));
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} onClick={stop} className={`${base} cursor-pointer`}>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={edit.type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={stop}
      className={base}
    />
  );
}

/* ═════════════════════ Board ═════════════════════ */

export default function LoadOperationsBoard({ shipments, trips, onOpenDetails, onSaveLoad }) {
  const [columnFilters, setColumnFilters] = useState({});
  const [openFilter, setOpenFilter] = useState(null);
  const [dateField, setDateField] = useState("pickup_date");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  /* Next pickup for a truck: does it already have another open load queued? */
  const nextPickupByTruck = useMemo(() => {
    const map = {};
    const open = ["unassigned", "pending", "dispatched", "assigned", "en_route_pickup"];
    (shipments || []).forEach((s) => {
      const key = String(s.truckNumber || s.truck_number || "").trim();
      if (!key || key.toUpperCase().includes("UNASSIGNED")) return;
      if (!open.includes(String(s.status || "").toLowerCase())) return;
      (map[key] = map[key] || []).push(s);
    });
    return map;
  }, [shipments]);

  const ctxFor = (s, tripNumber) => {
    if (s.next_pickup_status) {
      return { tripNumber, nextPickup: String(s.next_pickup_status).toUpperCase() };
    }
    const key = String(s.truckNumber || s.truck_number || "").trim();
    let nextPickup = "SEARCHING";
    if (key && !key.toUpperCase().includes("UNASSIGNED")) {
      const queued = (nextPickupByTruck[key] || []).filter((o) => o.id !== s.id);
      if (queued.length) nextPickup = `PREASSIGNED (#${queued[0].load_number || queued[0].id})`;
    }
    return { tripNumber, nextPickup };
  };

  /* Trip number per load — needed before filtering so the Trip # column filters correctly */
  const tripNumberByLoad = useMemo(() => {
    const map = {};
    (trips || []).forEach((t) => {
      (t.shipment_ids || t.shipmentIds || []).forEach((id) => {
        map[String(id)] = t.trip_number || t.tripNumber || null;
      });
    });
    return map;
  }, [trips]);

  /* ── Date-range filter ── */
  const dateFiltered = useMemo(() => {
    if (!dateFrom && !dateTo) return shipments;
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

    return (shipments || []).filter((s) => {
      const raw = s[dateField];
      if (!raw) return false; // no date on this load → outside any explicit window
      const d = new Date(raw);
      if (isNaN(d.getTime())) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [shipments, dateField, dateFrom, dateTo]);

  /* ── Per-column filters ── */
  const filtered = useMemo(() => {
    const active = Object.entries(columnFilters).filter(([, vals]) => Array.isArray(vals));
    if (active.length === 0) return dateFiltered;

    return dateFiltered.filter((s) => {
      const ctx = ctxFor(s, tripNumberByLoad[String(s.id)] || null);
      return active.every(([key, vals]) => {
        const col = COLUMNS.find((c) => c.key === key);
        return col ? vals.includes(String(col.value(s, ctx))) : true;
      });
    });
  }, [dateFiltered, columnFilters, tripNumberByLoad, nextPickupByTruck]);

  /* Distinct options per column, computed from everything the date filter left,
     so opening one column's dropdown still shows values hidden by another column. */
  const optionsFor = (key) => {
    const col = COLUMNS.find((c) => c.key === key);
    if (!col) return [];
    const set = new Set();
    dateFiltered.forEach((s) => {
      const ctx = ctxFor(s, tripNumberByLoad[String(s.id)] || null);
      set.add(String(col.value(s, ctx)));
    });
    return [...set].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  };

  /* ── Group by trip, preserving trip sequence ── */
  const tripGroups = useMemo(() => {
    const visible = new Map(filtered.map((s) => [String(s.id), s]));
    const claimed = new Set();
    const groups = [];

    (trips || []).forEach((trip) => {
      const ids = (trip.shipment_ids || trip.shipmentIds || []).map(String);
      const loads = ids.map((id) => visible.get(id)).filter(Boolean); // keeps trip order
      if (loads.length === 0) return;
      loads.forEach((l) => claimed.add(String(l.id)));
      groups.push({
        key: `trip-${trip.id}`,
        tripNumber: trip.trip_number || trip.tripNumber || DASH,
        driverName: trip.driver_name || trip.driverName || "Unassigned",
        tripStatus: trip.status || "pending",
        loads,
      });
    });

    const loose = filtered.filter((s) => !claimed.has(String(s.id)));
    if (loose.length) groups.push({ key: "no-trip", tripNumber: null, loads: loose });

    return groups;
  }, [filtered, trips]);

  /* ── Editing ── */
  const startEdit = (e, s) => {
    e.stopPropagation();
    const initial = {};
    COLUMNS.forEach((c) => {
      if (c.edit) initial[c.edit.field] = c.edit.get(s);
    });
    setDraft(initial);
    setEditingId(s.id);
    setOpenFilter(null);
  };

  const cancelEdit = (e) => {
    e?.stopPropagation();
    setEditingId(null);
    setDraft({});
  };

  const saveEdit = async (e, s) => {
    e.stopPropagation();
    // Only send what actually changed, so untouched columns are left alone.
    const changes = {};
    COLUMNS.forEach((c) => {
      if (!c.edit) return;
      const before = c.edit.get(s);
      const after = draft[c.edit.field];
      if (after !== before) changes[c.edit.field] = after;
    });

    if (Object.keys(changes).length === 0) return cancelEdit();

    setSaving(true);
    try {
      await onSaveLoad(s.id, changes);
      setEditingId(null);
      setDraft({});
    } finally {
      setSaving(false);
    }
  };

  const activeFilterCount =
    Object.values(columnFilters).filter(Array.isArray).length + (dateFrom || dateTo ? 1 : 0);

  const clearAll = () => {
    setColumnFilters({});
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="bg-white border border-slate-300 rounded-2xl shadow-sm overflow-hidden">
      {/* ── Filter toolbar ── */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-3 text-[11px]">
        <div className="flex items-center gap-1.5 font-bold text-slate-600 uppercase tracking-wide">
          <CalendarRange className="w-3.5 h-3.5 text-sky-600" />
          <span>Date range</span>
        </div>

        <select
          value={dateField}
          onChange={(e) => setDateField(e.target.value)}
          className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
        >
          <option value="pickup_date">Pickup date</option>
          <option value="delivery_date">Delivery date</option>
          <option value="eta_to_empty">ETA to empty</option>
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
        <span className="text-slate-400 font-bold">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />

        {activeFilterCount > 0 && (
          <button
            onClick={clearAll}
            className="ml-auto flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold cursor-pointer transition"
          >
            <X className="w-3 h-3" />
            <span>Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}</span>
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="overflow-auto max-h-[70vh]">
        <table className="text-left border-collapse text-[11px] whitespace-nowrap">
          <thead className="sticky top-0 z-20">
            <tr className="text-white uppercase tracking-wide text-[10px] font-black">
              {COLUMNS.map((col) => {
                const sel = columnFilters[col.key];
                const isFiltered = Array.isArray(sel);
                return (
                  <th
                    key={col.key}
                    className={`px-3 py-2.5 relative ${col.head} ${
                      col.pinned ? "sticky left-0 z-30 border-r-2 border-slate-500" : ""
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.label}</span>
                      <button
                        onClick={() => setOpenFilter(openFilter === col.key ? null : col.key)}
                        title={isFiltered ? `${sel.length} value(s) selected` : `Filter by ${col.label}`}
                        className={`p-0.5 rounded cursor-pointer transition ${
                          isFiltered ? "bg-white text-slate-900" : "hover:bg-white/25 text-white/70"
                        }`}
                      >
                        <Filter className="w-3 h-3" />
                      </button>
                    </div>

                    {openFilter === col.key && (
                      <ColumnFilter
                        column={col}
                        options={optionsFor(col.key)}
                        selected={sel}
                        onChange={(vals) =>
                          setColumnFilters((prev) => {
                            const next = { ...prev };
                            if (vals === null) delete next[col.key];
                            else next[col.key] = vals;
                            return next;
                          })
                        }
                        onClose={() => setOpenFilter(null)}
                      />
                    )}
                  </th>
                );
              })}
              <th className="px-3 py-2.5 bg-slate-800 sticky right-0 z-30 border-l-2 border-slate-500">Edit</th>
            </tr>
          </thead>

          <tbody className="text-slate-800">
            {tripGroups.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-5 py-12 text-center text-slate-500 font-medium">
                  No loads match the current filters.
                </td>
              </tr>
            ) : (
              tripGroups.map((group) => (
                <React.Fragment key={group.key}>
                  <tr className={group.tripNumber ? "bg-indigo-100 border-y-2 border-indigo-300" : "bg-slate-200 border-y-2 border-slate-300"}>
                    <td colSpan={COLUMNS.length + 1} className="px-3 py-1.5 font-black text-[10px] uppercase tracking-widest">
                      {group.tripNumber ? (
                        <span className="text-indigo-900">
                          ▸ TRIP #{group.tripNumber} · {group.driverName} · {group.loads.length} load
                          {group.loads.length > 1 ? "s" : ""} in sequence
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-indigo-700 text-white">
                            {String(group.tripStatus).replace(/_/g, " ")}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-700">
                          ▸ NO TRIP ASSIGNED · {group.loads.length} load{group.loads.length > 1 ? "s" : ""} awaiting trip build
                        </span>
                      )}
                    </td>
                  </tr>

                  {group.loads.map((s, idx) => {
                    const isEditing = editingId === s.id;
                    const ctx = ctxFor(s, group.tripNumber);
                    const zebra = idx % 2 === 0 ? "bg-white" : "bg-slate-50";
                    const rowBg = isEditing ? "bg-sky-50" : zebra;

                    return (
                      <tr
                        key={s.id}
                        onClick={() => !isEditing && onOpenDetails(s)}
                        className={`${rowBg} ${isEditing ? "ring-2 ring-sky-400" : "hover:bg-yellow-50 cursor-pointer"} transition-colors border-b border-slate-200`}
                      >
                        {COLUMNS.map((col) => {
                          const display = String(col.value(s, ctx));
                          const editable = isEditing && col.edit;

                          return (
                            <td
                              key={col.key}
                              className={`px-3 py-2 ${col.mono ? "font-mono" : ""} ${col.className || ""} ${
                                col.pinned ? `sticky left-0 z-10 ${rowBg} border-r-2 border-slate-300 font-mono font-black text-sky-700` : ""
                              }`}
                            >
                              {editable ? (
                                <EditCell
                                  edit={col.edit}
                                  value={draft[col.edit.field] ?? ""}
                                  onChange={(v) => setDraft((d) => ({ ...d, [col.edit.field]: v }))}
                                />
                              ) : col.pinned ? (
                                <>
                                  {group.tripNumber && (
                                    <span className="text-indigo-400 mr-1" title={`Stop ${idx + 1} of trip ${group.tripNumber}`}>
                                      {idx + 1}.
                                    </span>
                                  )}
                                  {display}
                                </>
                              ) : col.tone ? (
                                <span className={chip(col.tone(display))}>{display}</span>
                              ) : (
                                display
                              )}
                            </td>
                          );
                        })}

                        {/* Edit / Save / Cancel — pinned right so it stays reachable */}
                        <td className={`px-3 py-2 sticky right-0 z-10 ${rowBg} border-l-2 border-slate-300`}>
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => saveEdit(e, s)}
                                disabled={saving}
                                title="Save changes"
                                className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={saving}
                                title="Discard changes"
                                className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer disabled:opacity-50"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => startEdit(e, s)}
                              title="Edit this load"
                              className="p-1 rounded hover:bg-sky-100 text-slate-500 hover:text-sky-700 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 font-medium flex items-center gap-3 flex-wrap">
        <span className="font-bold text-slate-700">
          {filtered.length} load{filtered.length === 1 ? "" : "s"}
          {filtered.length !== (shipments || []).length && ` of ${(shipments || []).length}`}
        </span>
        <span>·</span>
        <span>{tripGroups.filter((g) => g.tripNumber).length} trips built</span>
        <span>·</span>
        <span>Loads on the same trip are grouped and numbered in trip sequence</span>
        <span>·</span>
        <span>Click a row for details, or the pencil to edit inline</span>
      </div>
    </div>
  );
}

import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { usePortalStore } from "../stores/usePortalStore";
import { fmtDate, fmtMoney, fmtWeight } from "@/lib/portalFormat";
import {
  ArrowLeft,
  Boxes,
  Building2,
  CalendarClock,
  CircleCheckBig,
  ClipboardList,
  FileUp,
  ListPlus,
  Loader2,
  MapPin,
  Package,
  Paperclip,
  Plus,
  Route,
  ShieldAlert,
  Snowflake,
  StickyNote,
  Trash2,
  TriangleAlert,
  Truck,
  X,
} from "lucide-react";

/* ---------------------------------------------------------------------------
 * These three lists mirror rateRequestFreight.service.js exactly. The server
 * clamps every enum to its own copy, so a value that drifts from this file is
 * silently dropped rather than stored — keep them in step.
 * ------------------------------------------------------------------------ */

const EQUIPMENT_TYPES = [
  { value: "dry_van", label: "Dry Van (53')" },
  { value: "reefer", label: "Reefer / Temp-Controlled" },
  { value: "flatbed", label: "Flatbed" },
  { value: "step_deck", label: "Step Deck" },
  { value: "straight_truck", label: "Straight Truck" },
  { value: "sprinter", label: "Sprinter / Cargo Van" },
  { value: "ltl", label: "LTL / Partial" },
  { value: "other", label: "Other / Not sure" },
];

const SERVICE_LEVELS = [
  { value: "standard", label: "Standard" },
  { value: "expedited", label: "Expedited" },
  { value: "team", label: "Team (non-stop)" },
];

const ACCESSORIALS = [
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

const MAX_STOPS = 8;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

/* These mirror ALLOWED_MIME in portalRates.controller.js. Attachments upload
 * only after the request row exists, so a type the server rejects costs the
 * customer a 415 on a request they have already submitted — the picker and the
 * client-side check must not be looser than the server. */
const ALLOWED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "webp", "xls", "xlsx", "csv", "doc", "docx"];
const FILE_ACCEPT = [
  ".pdf,.png,.jpg,.jpeg,.webp,.xls,.xlsx,.csv,.doc,.docx",
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
].join(",");

/* ---------------------------------------------------------------------------
 * Shared class strings — the portal's input and label look, in one place.
 * ------------------------------------------------------------------------ */

const INPUT =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-400";
const INPUT_BAD =
  "w-full rounded-lg border border-rose-400 bg-rose-50/40 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100 disabled:bg-slate-50 disabled:text-slate-400";
const LABEL = "mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500";
const CHECKBOX = "h-4 w-4 flex-none rounded border-slate-300 accent-sky-600 focus-visible:ring-2 focus-visible:ring-sky-500";

/* Order matters: it decides which field gets focus when submit is blocked. */
const FIELD_ORDER = [
  "origin",
  "destination",
  "commodity",
  "skids",
  "weight_lbs",
  "length_in",
  "width_in",
  "height_in",
  "declared_value",
  "temp_min_f",
  "temp_max_f",
  "un_number",
];

const EMPTY_FORM = {
  origin: "",
  destination: "",
  pickup_date: "",
  pickup_earliest: "",
  pickup_latest: "",
  delivery_date: "",
  delivery_earliest: "",
  delivery_latest: "",
  commodity: "",
  skids: "",
  weight_lbs: "",
  length_in: "",
  width_in: "",
  height_in: "",
  stackable: false,
  declared_value: "",
  declared_value_currency: "USD",
  equipment: "",
  service_level: "standard",
  temp_controlled: false,
  temp_min_f: "",
  temp_max_f: "",
  is_hazmat: false,
  un_number: "",
  hazard_class: "",
  packing_group: "",
  emergency_contact: "",
  reference: "",
  notes: "",
};

/* ---------------------------------------------------------------------------
 * Value coercion. The server discards anything outside its whitelist and
 * treats 0 as absent, so we send null rather than "" for untouched fields.
 * ------------------------------------------------------------------------ */

const trimmed = (value) => String(value ?? "").trim();
const strOrNull = (value) => trimmed(value) || null;

const numOrNull = (value) => {
  const raw = trimmed(value);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

/** null = blank, NaN = not a number, otherwise the number. */
const parseNumeric = (value) => {
  const raw = trimmed(value);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
};

const windowOrNull = (date, earliest, latest) => {
  if (!date && !earliest && !latest) return null;
  return { date: date || null, earliest: earliest || null, latest: latest || null };
};

const fmtBytes = (bytes) => {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

const extensionOf = (name) => String(name || "").split(".").pop().toLowerCase();

/* ---------------------------------------------------------------------------
 * Presentational pieces
 * ------------------------------------------------------------------------ */

function Card({ icon: Icon, title, hint, action, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <Icon className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
            <p className="mt-0.5 text-xs leading-snug text-slate-500">{hint}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="px-4 py-4 sm:px-5 sm:py-5">{children}</div>
    </section>
  );
}

function Field({ label, htmlFor, required, error, hint, className = "", children }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={LABEL}>
        {label}
        {required && <span className="ml-0.5 text-rose-600">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

function Pill({ className = "", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 px-5 py-8 text-center">
      <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-5 w-5 text-slate-400" />
      </span>
      <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{body}</p>}
      {action}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------ */

export default function PortalRateRequestPage() {
  const navigate = useNavigate();
  const { portalUser, createRateRequest, isSubmittingRate, uploadRateAttachment } = usePortalStore();

  const [form, setForm] = useState(EMPTY_FORM);
  const [stops, setStops] = useState([]);
  const [accessorials, setAccessorials] = useState([]);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  // "idle" -> "creating" -> "uploading". The store's isSubmittingRate only
  // covers the POST, but the button must stay busy through the attachments.
  const [phase, setPhase] = useState("idle");

  const fieldRefs = useRef({});
  const rowSeq = useRef(0);

  const busy = isSubmittingRate || phase !== "idle";
  const errorCount = Object.keys(errors).length;

  const bindRef = (name) => (el) => {
    fieldRefs.current[name] = el;
  };

  const inputClass = (name) => (errors[name] ? INPUT_BAD : INPUT);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setField(name, type === "checkbox" ? checked : value);
  };

  // --- Extra stops ---------------------------------------------------------

  // The cap is enforced inside the updater, not against the rendered `stops`:
  // repeated clicks in one batch all read the same stale length and would push
  // past MAX_STOPS, and submit silently drops the overflow.
  const addStop = () => {
    rowSeq.current += 1;
    const id = `stop-${rowSeq.current}`;
    setStops((prev) =>
      prev.length >= MAX_STOPS
        ? prev
        : [...prev, { id, type: "pickup", company: "", location: "", date: "", notes: "" }]
    );
  };

  const updateStop = (id, key, value) =>
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: value } : s)));

  const removeStop = (id) => setStops((prev) => prev.filter((s) => s.id !== id));

  // --- Accessorials --------------------------------------------------------

  const toggleAccessorial = (value) =>
    setAccessorials((prev) => (prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]));

  // --- Attachments ---------------------------------------------------------

  const stageFiles = (picked) => {
    const rejected = [];
    const accepted = [];

    for (const file of picked) {
      if (!ALLOWED_EXTENSIONS.includes(extensionOf(file.name))) {
        rejected.push(`${file.name} — PDF, image, spreadsheet or Word only`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        rejected.push(`${file.name} — ${fmtBytes(file.size)} is over the 5 MB limit`);
        continue;
      }
      rowSeq.current += 1;
      accepted.push({ id: `file-${rowSeq.current}`, file, name: file.name, size: file.size, state: "queued" });
    }

    const seen = new Set(files.map((f) => `${f.name}:${f.size}`));
    const fresh = accepted.filter((f) => !seen.has(`${f.name}:${f.size}`));
    if (fresh.length) setFiles((prev) => [...prev, ...fresh]);

    // Re-picking an already-staged file otherwise does nothing at all, which
    // reads as the picker having failed.
    const duplicates = accepted.length - fresh.length;
    if (duplicates) toast(`${duplicates} file${duplicates > 1 ? "s were" : " was"} already attached.`);
    rejected.forEach((message) => toast.error(message, { duration: 6000 }));
  };

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  // --- Validation ----------------------------------------------------------

  const validate = () => {
    const next = {};

    if (!trimmed(form.origin)) next.origin = "Tell us where the freight picks up.";
    if (!trimmed(form.destination)) next.destination = "Tell us where the freight delivers.";
    if (!trimmed(form.commodity)) next.commodity = "We need to know what we are hauling.";

    const positives = [
      ["skids", "Skid count"],
      ["weight_lbs", "Weight"],
      ["length_in", "Length"],
      ["width_in", "Width"],
      ["height_in", "Height"],
      ["declared_value", "Declared value"],
    ];
    for (const [key, label] of positives) {
      const n = parseNumeric(form[key]);
      if (n === null) continue;
      if (Number.isNaN(n) || n <= 0) next[key] = `${label} must be a number greater than zero.`;
    }

    if (form.temp_controlled) {
      const min = parseNumeric(form.temp_min_f);
      const max = parseNumeric(form.temp_max_f);
      if (Number.isNaN(min)) next.temp_min_f = "Enter a number, or leave it blank.";
      if (Number.isNaN(max)) next.temp_max_f = "Enter a number, or leave it blank.";
      if (typeof min === "number" && !Number.isNaN(min) && typeof max === "number" && !Number.isNaN(max) && min > max) {
        next.temp_max_f = "Maximum must be at or above the minimum.";
      }
    }

    if (form.is_hazmat && !trimmed(form.un_number)) {
      next.un_number = "A UN number is required for hazardous freight.";
    }

    return next;
  };

  // --- Submit --------------------------------------------------------------

  const buildFreightDetails = () => {
    const dims =
      trimmed(form.length_in) || trimmed(form.width_in) || trimmed(form.height_in)
        ? {
            length_in: numOrNull(form.length_in),
            width_in: numOrNull(form.width_in),
            height_in: numOrNull(form.height_in),
          }
        : null;

    const declaredValue = numOrNull(form.declared_value);

    const cleanedStops = stops
      .slice(0, MAX_STOPS)
      .map((s) => ({
        type: s.type === "delivery" ? "delivery" : "pickup",
        company: strOrNull(s.company),
        location: strOrNull(s.location),
        date: s.date || null,
        notes: strOrNull(s.notes),
      }))
      .filter((s) => s.location || s.company);

    return {
      skids: numOrNull(form.skids),
      weight_lbs: numOrNull(form.weight_lbs),
      dims,
      commodity: strOrNull(form.commodity),
      notes: strOrNull(form.notes),
      equipment: form.equipment || null,
      service_level: form.service_level || null,
      stackable: form.stackable,
      temperature: form.temp_controlled
        ? { controlled: true, min_f: numOrNull(form.temp_min_f), max_f: numOrNull(form.temp_max_f) }
        : null,
      hazmat: form.is_hazmat
        ? {
            is_hazmat: true,
            un_number: strOrNull(form.un_number),
            hazard_class: strOrNull(form.hazard_class),
            packing_group: strOrNull(form.packing_group),
            emergency_contact: strOrNull(form.emergency_contact),
          }
        : null,
      pickup_window: windowOrNull(form.pickup_date, form.pickup_earliest, form.pickup_latest),
      delivery_window: windowOrNull(form.delivery_date, form.delivery_earliest, form.delivery_latest),
      stops: cleanedStops.length ? cleanedStops : null,
      accessorials: accessorials.length ? accessorials : null,
      reference: strOrNull(form.reference),
      declared_value: declaredValue,
      declared_value_currency: declaredValue === null ? null : form.declared_value_currency,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      const first = FIELD_ORDER.find((key) => found[key]);
      const el = first ? fieldRefs.current[first] : null;
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      toast.error("Check the highlighted fields before submitting.");
      return;
    }

    setPhase("creating");
    const created = await createRateRequest({
      origin: trimmed(form.origin),
      destination: trimmed(form.destination),
      freight_details: buildFreightDetails(),
    });

    // createRateRequest already surfaced the failure; keep the form intact.
    if (!created) {
      setPhase("idle");
      return;
    }

    const failed = [];
    if (files.length) {
      setPhase("uploading");
      // Sequential on purpose: the upload endpoint is single-file and the
      // broker should see which one is in flight.
      for (const staged of files) {
        setFiles((prev) => prev.map((f) => (f.id === staged.id ? { ...f, state: "uploading" } : f)));
        const result = await uploadRateAttachment(created.id, staged.file);
        const state = result ? "done" : "failed";
        if (!result) failed.push(staged.name);
        setFiles((prev) => prev.map((f) => (f.id === staged.id ? { ...f, state } : f)));
      }
    }

    if (failed.length) {
      toast.error(
        `Your request was submitted, but ${failed.length} file${failed.length > 1 ? "s" : ""} did not attach: ${failed.join(
          ", "
        )}. You can add them from the request on your dashboard.`,
        { duration: 10000 }
      );
    }

    navigate("/portal/dashboard", { replace: true });
  };

  const stagedTotal = files.reduce((sum, f) => sum + Number(f.size || 0), 0);
  const declaredPreview = numOrNull(form.declared_value);
  const weightPreview = fmtWeight(form.weight_lbs);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      {/* -------------------------------------------------------------- Header */}
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 shadow-lg shadow-sky-900/40">
              <Truck className="h-5 w-5 text-white" strokeWidth={2.4} />
            </span>
            <div className="leading-tight">
              <p className="text-base font-bold tracking-tight text-white sm:text-lg">Nishan Transport</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-sky-300">Customer Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {portalUser && (
              <div className="hidden items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 sm:flex">
                <Building2 className="h-4 w-4 flex-none text-slate-400" />
                <div className="leading-tight">
                  <p className="max-w-[16rem] truncate text-sm font-semibold text-white">
                    {portalUser.company_name || portalUser.username}
                  </p>
                  <p className="text-[11px] text-slate-400">Signed in as {portalUser.username}</p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => navigate("/portal/dashboard")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------ Page bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">New Rate Request</h1>
            <p className="mt-1 text-sm text-slate-500">
              The more you tell us up front, the tighter the price comes back. Only the lane and the commodity are
              required.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/portal/dashboard")}
            disabled={busy}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6">
        <form onSubmit={handleSubmit} noValidate className="mx-auto w-full max-w-5xl space-y-6">
          {/* ------------------------------------------------------------ Lane */}
          <Card
            icon={MapPin}
            title="Lane"
            hint="Where the freight starts and where it has to end up."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Pickup location" htmlFor="origin" required error={errors.origin}>
                <input
                  id="origin"
                  name="origin"
                  ref={bindRef("origin")}
                  value={form.origin}
                  onChange={handleChange}
                  placeholder="City, State/Province, Country"
                  required
                  aria-invalid={Boolean(errors.origin)}
                  disabled={busy}
                  className={inputClass("origin")}
                />
              </Field>
              <Field label="Delivery location" htmlFor="destination" required error={errors.destination}>
                <input
                  id="destination"
                  name="destination"
                  ref={bindRef("destination")}
                  value={form.destination}
                  onChange={handleChange}
                  placeholder="City, State/Province, Country"
                  required
                  aria-invalid={Boolean(errors.destination)}
                  disabled={busy}
                  className={inputClass("destination")}
                />
              </Field>
            </div>
          </Card>

          {/* -------------------------------------------------------- Schedule */}
          <Card
            icon={CalendarClock}
            title="Schedule"
            hint="Appointment windows if you have them — leave blank and we will confirm with the shipper."
          >
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <fieldset className="rounded-lg border border-slate-200 p-4">
                <legend className="px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Pickup window
                </legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Date" htmlFor="pickup_date" className="sm:col-span-3">
                    <input
                      id="pickup_date"
                      name="pickup_date"
                      type="date"
                      value={form.pickup_date}
                      onChange={handleChange}
                      disabled={busy}
                      className={INPUT}
                    />
                  </Field>
                  <Field label="Earliest" htmlFor="pickup_earliest">
                    <input
                      id="pickup_earliest"
                      name="pickup_earliest"
                      type="time"
                      value={form.pickup_earliest}
                      onChange={handleChange}
                      disabled={busy}
                      className={INPUT}
                    />
                  </Field>
                  <Field label="Latest" htmlFor="pickup_latest">
                    <input
                      id="pickup_latest"
                      name="pickup_latest"
                      type="time"
                      value={form.pickup_latest}
                      onChange={handleChange}
                      disabled={busy}
                      className={INPUT}
                    />
                  </Field>
                  <div className="flex items-end pb-1">
                    <p className="text-xs text-slate-400">
                      {form.pickup_date ? fmtDate(`${form.pickup_date}T00:00:00`) : "To be confirmed"}
                    </p>
                  </div>
                </div>
              </fieldset>

              <fieldset className="rounded-lg border border-slate-200 p-4">
                <legend className="px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Delivery window
                </legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Date" htmlFor="delivery_date" className="sm:col-span-3">
                    <input
                      id="delivery_date"
                      name="delivery_date"
                      type="date"
                      value={form.delivery_date}
                      onChange={handleChange}
                      disabled={busy}
                      className={INPUT}
                    />
                  </Field>
                  <Field label="Earliest" htmlFor="delivery_earliest">
                    <input
                      id="delivery_earliest"
                      name="delivery_earliest"
                      type="time"
                      value={form.delivery_earliest}
                      onChange={handleChange}
                      disabled={busy}
                      className={INPUT}
                    />
                  </Field>
                  <Field label="Latest" htmlFor="delivery_latest">
                    <input
                      id="delivery_latest"
                      name="delivery_latest"
                      type="time"
                      value={form.delivery_latest}
                      onChange={handleChange}
                      disabled={busy}
                      className={INPUT}
                    />
                  </Field>
                  <div className="flex items-end pb-1">
                    <p className="text-xs text-slate-400">
                      {form.delivery_date ? fmtDate(`${form.delivery_date}T00:00:00`) : "To be confirmed"}
                    </p>
                  </div>
                </div>
              </fieldset>
            </div>
          </Card>

          {/* --------------------------------------------------------- Freight */}
          <Card
            icon={Package}
            title="Freight"
            hint="What is on the trailer — count, weight and footprint drive the rate."
          >
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field
                  label="Commodity"
                  htmlFor="commodity"
                  required
                  error={errors.commodity}
                  className="sm:col-span-3"
                >
                  <input
                    id="commodity"
                    name="commodity"
                    ref={bindRef("commodity")}
                    value={form.commodity}
                    onChange={handleChange}
                    placeholder="e.g. Frozen pork, palletized"
                    required
                    aria-invalid={Boolean(errors.commodity)}
                    disabled={busy}
                    className={inputClass("commodity")}
                  />
                </Field>

                <Field label="Skids" htmlFor="skids" error={errors.skids} hint="Pallet or piece count">
                  <input
                    id="skids"
                    name="skids"
                    ref={bindRef("skids")}
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    value={form.skids}
                    onChange={handleChange}
                    placeholder="22"
                    aria-invalid={Boolean(errors.skids)}
                    disabled={busy}
                    className={inputClass("skids")}
                  />
                </Field>
                <Field
                  label="Total weight (lbs)"
                  htmlFor="weight_lbs"
                  error={errors.weight_lbs}
                  hint={weightPreview || "Gross, including pallets"}
                >
                  <input
                    id="weight_lbs"
                    name="weight_lbs"
                    ref={bindRef("weight_lbs")}
                    type="number"
                    inputMode="decimal"
                    min="1"
                    value={form.weight_lbs}
                    onChange={handleChange}
                    placeholder="41200"
                    aria-invalid={Boolean(errors.weight_lbs)}
                    disabled={busy}
                    className={inputClass("weight_lbs")}
                  />
                </Field>
                <Field
                  label="Declared value"
                  htmlFor="declared_value"
                  error={errors.declared_value}
                  hint={
                    declaredPreview === null
                      ? "For cargo insurance"
                      : fmtMoney(declaredPreview, form.declared_value_currency)
                  }
                >
                  <div className="flex gap-2">
                    <input
                      id="declared_value"
                      name="declared_value"
                      ref={bindRef("declared_value")}
                      type="number"
                      inputMode="decimal"
                      min="1"
                      value={form.declared_value}
                      onChange={handleChange}
                      placeholder="65000"
                      aria-invalid={Boolean(errors.declared_value)}
                      disabled={busy}
                      className={inputClass("declared_value")}
                    />
                    <select
                      name="declared_value_currency"
                      value={form.declared_value_currency}
                      onChange={handleChange}
                      aria-label="Declared value currency"
                      disabled={busy}
                      className="rounded-lg border border-slate-300 bg-white px-2 py-2.5 text-sm font-semibold text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50"
                    >
                      <option value="USD">USD</option>
                      <option value="CAD">CAD</option>
                    </select>
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Length (in)" htmlFor="length_in" error={errors.length_in}>
                  <input
                    id="length_in"
                    name="length_in"
                    ref={bindRef("length_in")}
                    type="number"
                    inputMode="decimal"
                    min="1"
                    value={form.length_in}
                    onChange={handleChange}
                    placeholder="48"
                    aria-invalid={Boolean(errors.length_in)}
                    disabled={busy}
                    className={inputClass("length_in")}
                  />
                </Field>
                <Field label="Width (in)" htmlFor="width_in" error={errors.width_in}>
                  <input
                    id="width_in"
                    name="width_in"
                    ref={bindRef("width_in")}
                    type="number"
                    inputMode="decimal"
                    min="1"
                    value={form.width_in}
                    onChange={handleChange}
                    placeholder="40"
                    aria-invalid={Boolean(errors.width_in)}
                    disabled={busy}
                    className={inputClass("width_in")}
                  />
                </Field>
                <Field label="Height (in)" htmlFor="height_in" error={errors.height_in}>
                  <input
                    id="height_in"
                    name="height_in"
                    ref={bindRef("height_in")}
                    type="number"
                    inputMode="decimal"
                    min="1"
                    value={form.height_in}
                    onChange={handleChange}
                    placeholder="60"
                    aria-invalid={Boolean(errors.height_in)}
                    disabled={busy}
                    className={inputClass("height_in")}
                  />
                </Field>
              </div>

              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-3">
                <input
                  type="checkbox"
                  name="stackable"
                  checked={form.stackable}
                  onChange={handleChange}
                  disabled={busy}
                  className={`${CHECKBOX} mt-0.5`}
                />
                <span>
                  <span className="text-sm font-medium text-slate-900">Skids are stackable</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Double-stacking frees deck space and usually lowers the rate.
                  </span>
                </span>
              </label>
            </div>
          </Card>

          {/* --------------------------------------------- Equipment & service */}
          <Card
            icon={Truck}
            title="Equipment & service"
            hint="Pick the trailer you need and flag anything that changes how we handle the load."
          >
            <div className="space-y-5">
              <div>
                <p className={LABEL}>Equipment</p>
                <div role="radiogroup" aria-label="Equipment type" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {EQUIPMENT_TYPES.map((opt) => {
                    const selected = form.equipment === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                          selected
                            ? "border-sky-500 bg-sky-50 text-sky-900 ring-1 ring-sky-200"
                            : "border-slate-300 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="equipment"
                          value={opt.value}
                          checked={selected}
                          onChange={handleChange}
                          disabled={busy}
                          className="h-4 w-4 flex-none accent-sky-600"
                        />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
                {form.equipment && (
                  <button
                    type="button"
                    onClick={() => setField("equipment", "")}
                    disabled={busy}
                    className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
                  >
                    Clear equipment choice
                  </button>
                )}
              </div>

              <Field
                label="Service level"
                htmlFor="service_level"
                className="max-w-xs"
                hint="Expedited and team service carry a premium."
              >
                <select
                  id="service_level"
                  name="service_level"
                  value={form.service_level}
                  onChange={handleChange}
                  disabled={busy}
                  className={INPUT}
                >
                  {SERVICE_LEVELS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Temperature */}
              <div className="rounded-lg border border-slate-200">
                <label className="flex cursor-pointer items-start gap-2.5 px-3.5 py-3">
                  <input
                    type="checkbox"
                    name="temp_controlled"
                    checked={form.temp_controlled}
                    onChange={handleChange}
                    disabled={busy}
                    className={`${CHECKBOX} mt-0.5`}
                  />
                  <span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-900">
                      <Snowflake className="h-4 w-4 text-sky-500" />
                      Temperature controlled
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Reefer freight — give us the set point range in Fahrenheit.
                    </span>
                  </span>
                </label>
                {form.temp_controlled && (
                  <div className="grid grid-cols-1 gap-4 border-t border-slate-100 bg-slate-50/60 px-3.5 py-4 sm:grid-cols-2">
                    <Field label="Minimum °F" htmlFor="temp_min_f" error={errors.temp_min_f}>
                      <input
                        id="temp_min_f"
                        name="temp_min_f"
                        ref={bindRef("temp_min_f")}
                        type="number"
                        inputMode="decimal"
                        value={form.temp_min_f}
                        onChange={handleChange}
                        placeholder="-10"
                        aria-invalid={Boolean(errors.temp_min_f)}
                        disabled={busy}
                        className={inputClass("temp_min_f")}
                      />
                    </Field>
                    <Field label="Maximum °F" htmlFor="temp_max_f" error={errors.temp_max_f}>
                      <input
                        id="temp_max_f"
                        name="temp_max_f"
                        ref={bindRef("temp_max_f")}
                        type="number"
                        inputMode="decimal"
                        value={form.temp_max_f}
                        onChange={handleChange}
                        placeholder="10"
                        aria-invalid={Boolean(errors.temp_max_f)}
                        disabled={busy}
                        className={inputClass("temp_max_f")}
                      />
                    </Field>
                  </div>
                )}
              </div>

              {/* Hazmat */}
              <div className="rounded-lg border border-slate-200">
                <label className="flex cursor-pointer items-start gap-2.5 px-3.5 py-3">
                  <input
                    type="checkbox"
                    name="is_hazmat"
                    checked={form.is_hazmat}
                    onChange={handleChange}
                    disabled={busy}
                    className={`${CHECKBOX} mt-0.5`}
                  />
                  <span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-900">
                      <ShieldAlert className="h-4 w-4 text-amber-500" />
                      Contains hazardous materials
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Hazmat needs a certified driver and placards — the details below are required by the carrier.
                    </span>
                  </span>
                </label>
                {form.is_hazmat && (
                  <div className="grid grid-cols-1 gap-4 border-t border-slate-100 bg-amber-50/40 px-3.5 py-4 sm:grid-cols-2">
                    <Field label="UN number" htmlFor="un_number" required error={errors.un_number}>
                      <input
                        id="un_number"
                        name="un_number"
                        ref={bindRef("un_number")}
                        value={form.un_number}
                        onChange={handleChange}
                        placeholder="UN1993"
                        aria-invalid={Boolean(errors.un_number)}
                        disabled={busy}
                        className={inputClass("un_number")}
                      />
                    </Field>
                    <Field label="Hazard class" htmlFor="hazard_class">
                      <input
                        id="hazard_class"
                        name="hazard_class"
                        value={form.hazard_class}
                        onChange={handleChange}
                        placeholder="3"
                        disabled={busy}
                        className={INPUT}
                      />
                    </Field>
                    <Field label="Packing group" htmlFor="packing_group">
                      <input
                        id="packing_group"
                        name="packing_group"
                        value={form.packing_group}
                        onChange={handleChange}
                        placeholder="II"
                        disabled={busy}
                        className={INPUT}
                      />
                    </Field>
                    <Field label="24h emergency contact" htmlFor="emergency_contact">
                      <input
                        id="emergency_contact"
                        name="emergency_contact"
                        value={form.emergency_contact}
                        onChange={handleChange}
                        placeholder="Name and phone number"
                        disabled={busy}
                        className={INPUT}
                      />
                    </Field>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* ----------------------------------------------------- Extra stops */}
          <Card
            icon={Route}
            title="Extra stops"
            hint={`Multi-stop pickups or drops between the lane endpoints. Up to ${MAX_STOPS}.`}
            action={
              <button
                type="button"
                onClick={addStop}
                disabled={busy || stops.length >= MAX_STOPS}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add stop
              </button>
            }
          >
            {stops.length === 0 ? (
              <EmptyState
                icon={ListPlus}
                title="No extra stops"
                body="The lane above is a straight run. Add a stop if the trailer has to touch another door."
              />
            ) : (
              <div className="space-y-3">
                {stops.map((stop, index) => (
                  <div key={stop.id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <Pill className="bg-slate-100 text-slate-600 ring-1 ring-slate-500/20">Stop {index + 1}</Pill>
                      <button
                        type="button"
                        onClick={() => removeStop(stop.id)}
                        disabled={busy}
                        aria-label={`Remove stop ${index + 1}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Field label="Type" htmlFor={`${stop.id}-type`}>
                        <select
                          id={`${stop.id}-type`}
                          value={stop.type}
                          onChange={(e) => updateStop(stop.id, "type", e.target.value)}
                          disabled={busy}
                          className={INPUT}
                        >
                          <option value="pickup">Pickup</option>
                          <option value="delivery">Delivery</option>
                        </select>
                      </Field>
                      <Field label="Company" htmlFor={`${stop.id}-company`}>
                        <input
                          id={`${stop.id}-company`}
                          value={stop.company}
                          onChange={(e) => updateStop(stop.id, "company", e.target.value)}
                          placeholder="Consignee name"
                          disabled={busy}
                          className={INPUT}
                        />
                      </Field>
                      <Field label="Location" htmlFor={`${stop.id}-location`}>
                        <input
                          id={`${stop.id}-location`}
                          value={stop.location}
                          onChange={(e) => updateStop(stop.id, "location", e.target.value)}
                          placeholder="City, State/Province"
                          disabled={busy}
                          className={INPUT}
                        />
                      </Field>
                      <Field label="Date" htmlFor={`${stop.id}-date`}>
                        <input
                          id={`${stop.id}-date`}
                          type="date"
                          value={stop.date}
                          onChange={(e) => updateStop(stop.id, "date", e.target.value)}
                          disabled={busy}
                          className={INPUT}
                        />
                      </Field>
                      <Field label="Notes" htmlFor={`${stop.id}-notes`} className="sm:col-span-2 lg:col-span-4">
                        <input
                          id={`${stop.id}-notes`}
                          value={stop.notes}
                          onChange={(e) => updateStop(stop.id, "notes", e.target.value)}
                          placeholder="Dock hours, appointment number, contact…"
                          disabled={busy}
                          className={INPUT}
                        />
                      </Field>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-slate-400">
                  Stops without a company or a location are dropped when the request is sent.
                </p>
              </div>
            )}
          </Card>

          {/* ---------------------------------------------------- Accessorials */}
          <Card
            icon={Boxes}
            title="Accessorials"
            hint="Anything the driver has to do beyond hooking and hauling."
            action={
              accessorials.length > 0 ? (
                <Pill className="bg-sky-50 text-sky-700 ring-1 ring-sky-600/20">{accessorials.length} selected</Pill>
              ) : null
            }
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ACCESSORIALS.map((opt) => {
                const checked = accessorials.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                      checked
                        ? "border-sky-500 bg-sky-50 text-sky-900 ring-1 ring-sky-200"
                        : "border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAccessorial(opt.value)}
                      disabled={busy}
                      className={CHECKBOX}
                    />
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </Card>

          {/* ----------------------------------------------- References & notes */}
          <Card
            icon={StickyNote}
            title="References & notes"
            hint="Your PO or reference travels with the load onto every document we produce."
          >
            <div className="space-y-4">
              <Field
                label="Your reference / PO"
                htmlFor="reference"
                className="max-w-sm"
                hint="Shows up on the quote, the BOL and the invoice."
              >
                <input
                  id="reference"
                  name="reference"
                  value={form.reference}
                  onChange={handleChange}
                  placeholder="PO-48812"
                  disabled={busy}
                  className={INPUT}
                />
              </Field>
              <Field label="Notes for dispatch" htmlFor="notes">
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Special handling, dock restrictions, border paperwork, anything the driver needs to know…"
                  disabled={busy}
                  className={INPUT}
                />
              </Field>
            </div>
          </Card>

          {/* ----------------------------------------------------- Attachments */}
          <Card
            icon={Paperclip}
            title="Attachments"
            hint="Packing lists, photos, previous rate confirmations. PDF, image, spreadsheet or Word — 5 MB each."
            action={
              <label
                className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors focus-within:ring-2 focus-within:ring-sky-500 ${
                  busy ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-slate-50"
                }`}
              >
                <FileUp className="h-4 w-4" />
                Choose files
                <input
                  type="file"
                  multiple
                  accept={FILE_ACCEPT}
                  disabled={busy}
                  className="sr-only"
                  onChange={(e) => {
                    const picked = Array.from(e.target.files || []);
                    e.target.value = "";
                    if (picked.length) stageFiles(picked);
                  }}
                />
              </label>
            }
          >
            {files.length === 0 ? (
              <EmptyState
                icon={Paperclip}
                title="No files attached yet"
                body="Files are held here and uploaded the moment the request is created."
              />
            ) : (
              <ul className="space-y-2">
                {files.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200">
                        {f.state === "uploading" ? (
                          <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
                        ) : f.state === "done" ? (
                          <CircleCheckBig className="h-4 w-4 text-emerald-600" />
                        ) : f.state === "failed" ? (
                          <TriangleAlert className="h-4 w-4 text-rose-600" />
                        ) : (
                          <Paperclip className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{f.name}</p>
                        <p className="text-xs text-slate-500">
                          {fmtBytes(f.size)}
                          {f.state === "uploading" && " · Uploading…"}
                          {f.state === "done" && " · Attached"}
                          {f.state === "failed" && " · Upload failed"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(f.id)}
                      disabled={busy}
                      aria-label={`Remove ${f.name}`}
                      className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-40"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
                <li className="pt-1 text-xs text-slate-400">
                  {files.length} file{files.length > 1 ? "s" : ""} staged · {fmtBytes(stagedTotal)} total
                </li>
              </ul>
            )}
          </Card>

          {/* ------------------------------------------------------ Action bar */}
          <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-4px_14px_rgba(15,23,42,0.06)] sm:static sm:mx-0 sm:rounded-xl sm:border sm:px-5 sm:py-4 sm:shadow-sm">
            {errorCount > 0 && (
              <p className="mb-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                <TriangleAlert className="h-4 w-4 flex-none" />
                {errorCount} field{errorCount > 1 ? "s need" : " needs"} attention before we can price this.
              </p>
            )}
            <div className="flex items-center justify-between gap-3">
              <p className="hidden text-xs text-slate-500 sm:block">
                <ClipboardList className="mr-1.5 inline h-3.5 w-3.5 text-slate-400" />
                Our dispatch team reviews every request and sends a quote within 24 hours.
              </p>
              <div className="flex flex-1 gap-3 sm:flex-none">
                <button
                  type="button"
                  onClick={() => navigate("/portal/dashboard")}
                  disabled={busy}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-60 sm:flex-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-60 sm:flex-none"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {busy ? "Submitting…" : "Submit Rate Request"}
                </button>
              </div>
            </div>
          </div>

          <p className="pb-2 text-center text-xs text-slate-500 sm:hidden">
            Our dispatch team reviews every request and sends a quote within 24 hours.
          </p>
        </form>
      </main>

      {/* -------------------------------------------------------------- Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-slate-500 sm:px-6">
          <p>© {new Date().getFullYear()} Nishan Transport. Customer Portal.</p>
          <p>Questions about a shipment? Contact your Nishan Transport dispatch coordinator.</p>
        </div>
      </footer>
    </div>
  );
}

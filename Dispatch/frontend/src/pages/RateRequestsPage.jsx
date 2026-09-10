import { useEffect, useState, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/axios";
import { API_BASE_URL } from "@/lib/apiBase";
import { apiFileUrl } from "../stores/usePortalStore";
import { fmtDate, fmtDateTime, fmtMoney, fmtWeight, humanize, rateTone } from "@/lib/portalFormat";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  DollarSign,
  Download,
  Inbox,
  Loader2,
  MapPin,
  Paperclip,
  RefreshCw,
  Thermometer,
  TriangleAlert,
  Truck,
  XCircle,
} from "lucide-react";

// Mirrored from backend/src/services/rateRequestFreight.service.js. The staff
// bundle cannot import from the server, and a dispatcher must read the same
// wording the broker picked — never the raw enum value.
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

const labelFor = (options, value) => {
  if (!value) return null;
  return options.find((o) => o.value === value)?.label || humanize(value);
};

// freight_details dates are stored as bare "YYYY-MM-DD" calendar days. Handed
// to Date() they parse as UTC midnight and render as the previous day west of
// Greenwich, so anchor them to local time before formatting. fmtDate answers
// "—" for anything it cannot parse; callers here compose strings, so that
// placeholder is collapsed back to null rather than glued into "— · 9:00 AM".
const fmtDay = (value) => {
  const out = fmtDate(/^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) ? `${value}T00:00:00` : value);
  return out === "—" ? null : out;
};

// Window times are "HH:MM" strings, not timestamps — fmtTime cannot parse them.
const fmtClock = (value) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 === 0 ? 12 : hour % 12}:${match[2]} ${suffix}`;
};

const windowText = (win) => {
  if (!win || typeof win !== "object") return null;
  const day = win.date ? fmtDay(win.date) : null;
  const from = fmtClock(win.earliest);
  const to = fmtClock(win.latest);
  const span = from && to ? `${from} – ${to}` : from ? `from ${from}` : to ? `by ${to}` : null;
  if (day && span) return `${day} · ${span}`;
  return day || span || null;
};

const tempRange = (temperature) => {
  if (!temperature?.controlled) return null;
  const { min_f: min, max_f: max } = temperature;
  if (min != null && max != null) return `${min}–${max}°F`;
  if (min != null) return `min ${min}°F`;
  if (max != null) return `max ${max}°F`;
  return null;
};

const dimsText = (dims) => {
  if (!dims || (!dims.length_in && !dims.width_in && !dims.height_in)) return null;
  return `${dims.length_in || "?"}x${dims.width_in || "?"}x${dims.height_in || "?"} in`;
};

const fmtBytes = (bytes) => {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

// One line for the list row: what a dispatcher needs before opening anything.
const fmtFreight = (fd) => {
  if (!fd || typeof fd !== "object") return null;
  const parts = [];
  const equipment = labelFor(EQUIPMENT_TYPES, fd.equipment);
  if (equipment) parts.push(equipment);
  if (fd.skids) parts.push(`${fd.skids} skid${fd.skids > 1 ? "s" : ""}`);
  const weight = fmtWeight(fd.weight_lbs);
  if (weight) parts.push(weight);
  const dims = dimsText(fd.dims);
  if (dims) parts.push(dims);
  if (fd.commodity) parts.push(fd.commodity);
  return parts.length ? parts.join(" · ") : null;
};

function Marker({ icon: Icon, className = "", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${className}`}
    >
      {Icon && <Icon className="h-3 w-3 flex-none" />}
      {children}
    </span>
  );
}

// Hazmat and reefer freight cannot be quoted like dry van, so they are called
// out on the row itself — the detail panel is one click too far away.
function FreightMarkers({ fd }) {
  if (!fd || typeof fd !== "object") return null;
  const range = tempRange(fd.temperature);
  const stopCount = fd.stops?.length || 0;
  const accessorialCount = fd.accessorials?.length || 0;
  const service =
    fd.service_level && fd.service_level !== "standard" ? labelFor(SERVICE_LEVELS, fd.service_level) : null;

  if (!fd.hazmat?.is_hazmat && !fd.temperature?.controlled && !stopCount && !accessorialCount && !service) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {fd.hazmat?.is_hazmat && (
        <Marker icon={TriangleAlert} className="bg-rose-50 text-rose-700 ring-1 ring-rose-600/25">
          Hazmat{fd.hazmat.un_number ? ` ${fd.hazmat.un_number}` : ""}
        </Marker>
      )}
      {fd.temperature?.controlled && (
        <Marker icon={Thermometer} className="bg-sky-50 text-sky-700 ring-1 ring-sky-600/25">
          Temp {range || "controlled"}
        </Marker>
      )}
      {stopCount > 0 && (
        <Marker icon={MapPin} className="bg-violet-50 text-violet-700 ring-1 ring-violet-600/25">
          Multi-stop · {stopCount}
        </Marker>
      )}
      {service && (
        <Marker className="bg-amber-50 text-amber-800 ring-1 ring-amber-600/25">{service}</Marker>
      )}
      {accessorialCount > 0 && (
        <Marker className="bg-slate-100 text-slate-600 ring-1 ring-slate-500/20">
          {accessorialCount} accessorial{accessorialCount > 1 ? "s" : ""}
        </Marker>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium text-slate-900">{children || "—"}</p>
    </div>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <h4 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
      {Icon && <Icon className="h-4 w-4 flex-none text-slate-400" />}
      {children}
    </h4>
  );
}

function HazmatBlock({ hazmat }) {
  const cells = [
    ["UN number", hazmat.un_number],
    ["Hazard class", hazmat.hazard_class],
    ["Packing group", hazmat.packing_group],
    ["Emergency contact", hazmat.emergency_contact],
  ];
  return (
    <section className="rounded-lg border border-rose-200 bg-rose-50 p-3.5">
      <h4 className="flex items-center gap-1.5 text-sm font-bold text-rose-900">
        <TriangleAlert className="h-4 w-4 flex-none text-rose-600" />
        Hazardous materials
      </h4>
      <div className="mt-2.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cells.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">{label}</p>
            <p className="mt-0.5 break-words text-sm font-medium text-rose-900">{value || "Not provided"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AttachmentList({ entry, isLoading }) {
  if (isLoading) {
    return (
      <section>
        <SectionTitle icon={Paperclip}>Attachments</SectionTitle>
        <div className="mt-2 space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
          ))}
        </div>
      </section>
    );
  }

  if (entry?.error) {
    return (
      <section>
        <SectionTitle icon={Paperclip}>Attachments</SectionTitle>
        <p className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <TriangleAlert className="mt-0.5 h-4 w-4 flex-none text-amber-600" />
          <span className="break-words">
            {entry.error} This request may still have files — collapse and reopen the row to retry.
          </span>
        </p>
      </section>
    );
  }

  // A request with no files is the normal case, not an error state.
  const files = entry?.files;
  if (!files || files.length === 0) return null;

  return (
    <section>
      <SectionTitle icon={Paperclip}>Attachments ({files.length})</SectionTitle>
      <div className="mt-2 space-y-2">
        {files.map((file) => {
          const size = fmtBytes(file.size_bytes);
          return (
            <a
              key={file.id}
              href={apiFileUrl(file.download_url)}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <Paperclip className="h-4 w-4 flex-none text-slate-400" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-900">{file.file_name}</span>
                <span className="block text-[11px] text-slate-500">
                  {fmtDateTime(file.created_at)}
                  {size ? ` · ${size}` : ""}
                </span>
              </span>
              <Download className="h-4 w-4 flex-none text-sky-600" />
            </a>
          );
        })}
      </div>
    </section>
  );
}

function FreightDetail({ fd, attachmentEntry, isLoadingAttachments }) {
  const details = fd && typeof fd === "object" ? fd : {};
  const hasDetails = Object.keys(details).length > 0;

  const pickup = windowText(details.pickup_window);
  const delivery = windowText(details.delivery_window);
  const stops = Array.isArray(details.stops) ? details.stops : [];
  const accessorials = Array.isArray(details.accessorials) ? details.accessorials : [];

  return (
    <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
      {!hasDetails && (
        <p className="text-sm text-slate-500">No freight details were captured with this request.</p>
      )}

      {details.hazmat?.is_hazmat && <HazmatBlock hazmat={details.hazmat} />}

      {hasDetails && (
        <>
          <section>
            <SectionTitle icon={CalendarDays}>Schedule</SectionTitle>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <Field label="Pickup window">{pickup || "To be confirmed"}</Field>
              <Field label="Delivery window">{delivery || "To be confirmed"}</Field>
            </div>
          </section>

          <section>
            <SectionTitle icon={Truck}>Equipment &amp; handling</SectionTitle>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Equipment">{labelFor(EQUIPMENT_TYPES, details.equipment)}</Field>
              <Field label="Service level">{labelFor(SERVICE_LEVELS, details.service_level)}</Field>
              <Field label="Temperature">
                {details.temperature?.controlled
                  ? tempRange(details.temperature) || "Controlled — range not given"
                  : "Not requested"}
              </Field>
              <Field label="Stackable">
                {details.stackable == null ? null : details.stackable ? "Yes" : "No"}
              </Field>
            </div>
          </section>

          <section>
            <SectionTitle>Freight</SectionTitle>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Skids">
                {details.skids ? `${details.skids} skid${details.skids > 1 ? "s" : ""}` : null}
              </Field>
              <Field label="Weight">{fmtWeight(details.weight_lbs)}</Field>
              <Field label="Dimensions">{dimsText(details.dims)}</Field>
              <Field label="Commodity">{details.commodity}</Field>
              <Field label="Customer reference">{details.reference}</Field>
              <Field label="Declared value">
                {details.declared_value != null
                  ? fmtMoney(details.declared_value, details.declared_value_currency || "USD")
                  : null}
              </Field>
            </div>
          </section>

          {accessorials.length > 0 && (
            <section>
              <SectionTitle>Accessorials</SectionTitle>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {accessorials.map((code) => (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                  >
                    {labelFor(ACCESSORIALS, code)}
                  </span>
                ))}
              </div>
            </section>
          )}

          {stops.length > 0 && (
            <section>
              <SectionTitle icon={MapPin}>
                Extra stops ({stops.length})
              </SectionTitle>
              <ol className="mt-2 space-y-2">
                {stops.map((stop, index) => {
                  const stopDay = fmtDay(stop.date);
                  return (
                  <li
                    key={`${index}-${stop.location || stop.company || "stop"}`}
                    className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-600 ring-1 ring-slate-300">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="min-w-0 break-words text-sm font-semibold text-slate-900">
                          {stop.company || stop.location || "—"}
                        </p>
                        <Marker
                          className={
                            stop.type === "delivery"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                              : "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20"
                          }
                        >
                          {stop.type === "delivery" ? "Delivery" : "Pickup"}
                        </Marker>
                      </div>
                      {stop.company && stop.location && (
                        <p className="mt-0.5 break-words text-xs text-slate-600">{stop.location}</p>
                      )}
                      {stopDay && <p className="mt-0.5 text-xs text-slate-500">{stopDay}</p>}
                      {stop.notes && (
                        <p className="mt-1 break-words text-xs italic text-slate-500">{stop.notes}</p>
                      )}
                    </div>
                  </li>
                  );
                })}
              </ol>
            </section>
          )}

          {details.notes && (
            <section>
              <SectionTitle>Notes from the customer</SectionTitle>
              <p className="mt-2 whitespace-pre-line break-words rounded-lg bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200">
                {details.notes}
              </p>
            </section>
          )}
        </>
      )}

      <AttachmentList entry={attachmentEntry} isLoading={isLoadingAttachments} />
    </div>
  );
}

// Staff-side view of customer portal rate requests: dispatchers see every
// incoming request, quote a price, and watch acceptance in real time.
export default function RateRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quotingId, setQuotingId] = useState(null);
  const [quoteForm, setQuoteForm] = useState({ price: "", currency: "USD", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [attachments, setAttachments] = useState({});
  const [loadingAttachmentsFor, setLoadingAttachmentsFor] = useState(null);
  const [attachmentsNonce, setAttachmentsNonce] = useState(0);

  // Attachments are cached per request id (see the lazy-fetch effect below).
  // Anything that says the server-side picture changed has to drop that cache,
  // or a dispatcher who just saw "attachment added" reopens the row and finds
  // the stale, empty list.
  const attachmentsRequested = useRef(new Set());
  const invalidateAttachments = useCallback(() => {
    attachmentsRequested.current.clear();
    setAttachmentsNonce((n) => n + 1);
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/rates", { params: { limit: 100 } });
      if (res.data?.success) {
        setRequests(Array.isArray(res.data.rate_requests) ? res.data.rate_requests : []);
        setLoadError(null);
      } else {
        setLoadError(res.data?.message || "The server did not return a rate request list.");
      }
    } catch (error) {
      // An empty list and a failed request look identical to a dispatcher, and
      // "no rate requests yet" is the more dangerous lie of the two.
      console.warn("fetchRequests failed:", error.message);
      setLoadError(error.response?.data?.message || error.message || "Could not reach the server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    invalidateAttachments();
    fetchRequests();
  }, [fetchRequests, invalidateAttachments]);

  // Initial load + slow poll as a safety net under the live stream
  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  // Live alerts: the backend emits an SSE event for every portal action
  // (new request, quote accepted/rejected, tender uploaded, attachment added).
  useEffect(() => {
    let es;
    try {
      es = new EventSource(`${API_BASE_URL}/rates/notifications/stream`, {
        withCredentials: true,
      });
      es.addEventListener("connected", () => setLiveConnected(true));
      es.addEventListener("dispatch-alert", (e) => {
        try {
          const event = JSON.parse(e.data);
          if (event?.title) toast(`🔔 ${event.title}`, { duration: 8000 });
        } catch {
          // Malformed payload still means something changed — refetch anyway.
        }
        invalidateAttachments();
        fetchRequests();
      });
      es.onerror = () => setLiveConnected(false);
    } catch (err) {
      console.warn("SSE unavailable, relying on polling:", err.message);
    }
    return () => {
      es?.close();
    };
  }, [fetchRequests, invalidateAttachments]);

  // Attachments are fetched lazily, once per request, when a row is opened —
  // the list endpoint does not carry them.
  useEffect(() => {
    const id = expandedId;
    if (!id || attachmentsRequested.current.has(id)) return;
    attachmentsRequested.current.add(id);
    setLoadingAttachmentsFor(id);
    axiosInstance
      .get(`/portal/rates/${id}/attachments`)
      .then((res) => {
        setAttachments((prev) => ({
          ...prev,
          [id]: { files: Array.isArray(res.data?.attachments) ? res.data.attachments : [], error: null },
        }));
      })
      .catch((error) => {
        // A failed lookup is not the same as "no files attached" — say which,
        // and let the row be retried instead of implying the broker sent nothing.
        console.warn("fetchRateAttachments failed:", error.message);
        attachmentsRequested.current.delete(id);
        setAttachments((prev) => ({
          ...prev,
          [id]: { files: [], error: error.response?.data?.message || "Could not load attachments." },
        }));
      })
      .finally(() => {
        setLoadingAttachmentsFor((current) => (current === id ? null : current));
      });
  }, [expandedId, attachmentsNonce]);

  // The form is shared across rows, so it is reset on every open and close —
  // otherwise a price typed for one lane and cancelled reappears, pre-filled,
  // on the next lane a dispatcher quotes.
  const openQuoteForm = useCallback((id) => {
    setQuoteForm({ price: "", currency: "USD", notes: "" });
    setQuotingId(id);
  }, []);

  const closeQuoteForm = useCallback(() => {
    setQuoteForm({ price: "", currency: "USD", notes: "" });
    setQuotingId(null);
  }, []);

  const submitQuote = async (id) => {
    const price = Number(quoteForm.price);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Enter a valid quote amount");
      return;
    }
    setSubmitting(true);
    try {
      const res = await axiosInstance.patch(`/rates/${id}/quote`, {
        quoted_price: price,
        currency: quoteForm.currency,
        notes: quoteForm.notes || null,
      });
      if (res.data?.success) {
        toast.success("Quote sent — the customer has been notified.");
        closeQuoteForm();
        fetchRequests();
      } else {
        // A 200 that is not a success still means the quote did not land.
        toast.error(res.data?.message || "Could not send quote");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send quote");
    } finally {
      setSubmitting(false);
    }
  };

  const pending = requests.filter((r) => r.status === "PENDING");
  const quoted = requests.filter((r) => r.status === "QUOTED");
  const accepted = requests.filter((r) => r.status === "ACCEPTED");

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="w-10 h-10 shrink-0 bg-sky-100 rounded-xl flex items-center justify-center">
            <Inbox className="w-5 h-5 text-sky-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-900">Customer Rate Requests</h1>
            <p className="text-xs text-slate-500">
              Incoming quote requests from the customer portal
              <span className={`ml-2 inline-flex items-center gap-1 ${liveConnected ? "text-emerald-600" : "text-slate-400"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${liveConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                {liveConnected ? "Live alerts on" : "Polling every 30s"}
              </span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-3">
          <Clock3 className="w-8 h-8 text-blue-500" />
          <div>
            <p className="text-2xl font-black text-slate-900">{pending.length}</p>
            <p className="text-xs font-semibold text-slate-500 uppercase">Awaiting Quote</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-amber-500" />
          <div>
            <p className="text-2xl font-black text-slate-900">{quoted.length}</p>
            <p className="text-xs font-semibold text-slate-500 uppercase">Quoted — Awaiting Customer</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
          <div>
            <p className="text-2xl font-black text-slate-900">{accepted.length}</p>
            <p className="text-xs font-semibold text-slate-500 uppercase">Accepted</p>
          </div>
        </div>
      </div>

      {/* A poll that failed on top of rows we already have: the counts above are
          real but no longer current, and silence would read as "nothing changed". */}
      {loadError && requests.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5">
          <TriangleAlert className="h-4 w-4 flex-none text-amber-600" />
          <p className="min-w-0 flex-1 break-words text-sm text-amber-900">
            Last refresh failed — this list may be out of date. {loadError}
          </p>
          <button
            type="button"
            onClick={refresh}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            Retry
          </button>
        </div>
      )}

      {/* Request list */}
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-4">
              <div className="h-4 w-1/3 rounded bg-slate-200" />
              <div className="mt-3 h-3 w-2/3 rounded bg-slate-100" />
              <div className="mt-2 h-3 w-1/4 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : loadError && requests.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center sm:p-10">
          <TriangleAlert className="mx-auto mb-3 h-10 w-10 text-amber-500" />
          <p className="font-medium text-amber-900">Could not load rate requests.</p>
          <p className="mx-auto mt-1 max-w-md break-words text-sm text-amber-800">{loadError}</p>
          <button
            type="button"
            onClick={refresh}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-12 text-center">
          <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No rate requests yet.</p>
          <p className="text-sm text-slate-400 mt-1">
            When a customer submits a request from the portal, it appears here instantly.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const fd = r.freight_details && typeof r.freight_details === "object" ? r.freight_details : null;
            const isHazmat = Boolean(fd?.hazmat?.is_hazmat);
            const isTempControlled = Boolean(fd?.temperature?.controlled);
            const isOpen = expandedId === r.id;
            const summary = fmtFreight(fd);
            // Freight that cannot be quoted like dry van gets a coloured edge so
            // it is impossible to scroll past.
            const cardTone = isHazmat
              ? "border-rose-300 ring-1 ring-rose-100"
              : isTempControlled
              ? "border-sky-300 ring-1 ring-sky-100"
              : "border-slate-200";

            return (
              <div key={r.id} className={`bg-white rounded-lg border p-4 ${cardTone}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="min-w-0 break-words font-bold text-slate-900">
                        {r.company_name || "Unknown customer"}
                      </p>
                      <Marker className={rateTone(r.status)}>{humanize(r.status) || "Unknown"}</Marker>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mt-1 break-words">
                      {r.origin} → {r.destination}
                    </p>
                    {summary && <p className="text-xs text-slate-500 mt-1 break-words">{summary}</p>}
                    <FreightMarkers fd={fd} />
                    {/* notes accepts 2000 chars server-side — clamp it in the row */}
                    {fd?.notes && (
                      <p className="text-xs text-slate-400 mt-1 italic line-clamp-2 break-words">
                        &ldquo;{fd.notes}&rdquo;
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-2 font-mono">
                      {fmtDateTime(r.created_at)}
                    </p>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isOpen ? null : r.id)}
                      aria-expanded={isOpen}
                      className="mt-2 inline-flex items-center gap-1.5 rounded text-xs font-semibold text-sky-700 hover:text-sky-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    >
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {isOpen ? "Hide freight details" : "View full freight details"}
                    </button>
                  </div>

                  <div className="text-right shrink-0">
                    {r.quoted_price != null && (
                      <p className="text-lg font-black text-slate-900">
                        {fmtMoney(r.quoted_price, r.quote_currency || "USD")}
                        {/* Intl renders CAD as a bare "$" in en-CA — spell the
                            currency out so a lane is never read in the wrong one. */}
                        <span className="text-xs font-semibold text-slate-500 ml-1">{r.quote_currency || "USD"}</span>
                      </p>
                    )}
                    {r.quote_notes && (
                      <p className="mt-0.5 max-w-[16rem] break-words text-right text-xs italic text-slate-500">
                        {r.quote_notes}
                      </p>
                    )}
                    {r.status === "PENDING" && quotingId !== r.id && (
                      <button
                        type="button"
                        onClick={() => openQuoteForm(r.id)}
                        className="px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                      >
                        Quote This Lane
                      </button>
                    )}
                    {r.status === "REJECTED" && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <XCircle className="w-3.5 h-3.5" /> Customer declined
                      </span>
                    )}
                  </div>
                </div>

                {/* Everything the broker sent — a dispatcher must not quote blind */}
                {isOpen && (
                  <FreightDetail
                    fd={fd}
                    attachmentEntry={attachments[r.id]}
                    isLoadingAttachments={loadingAttachmentsFor === r.id}
                  />
                )}

                {/* Inline quote form */}
                {quotingId === r.id && (
                  <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-end gap-3">
                    <div>
                      <label htmlFor={`quote-price-${r.id}`} className="block text-xs font-semibold text-slate-600 mb-1">
                        Quote (all-in)
                      </label>
                      <input
                        id={`quote-price-${r.id}`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={quoteForm.price}
                        onChange={(e) => setQuoteForm((f) => ({ ...f, price: e.target.value }))}
                        placeholder="e.g. 2850.00"
                        className="w-36 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label htmlFor={`quote-currency-${r.id}`} className="block text-xs font-semibold text-slate-600 mb-1">
                        Currency
                      </label>
                      <select
                        id={`quote-currency-${r.id}`}
                        value={quoteForm.currency}
                        onChange={(e) => setQuoteForm((f) => ({ ...f, currency: e.target.value }))}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="USD">USD</option>
                        <option value="CAD">CAD</option>
                      </select>
                    </div>
                    <div className="flex-1 min-w-[180px]">
                      <label htmlFor={`quote-notes-${r.id}`} className="block text-xs font-semibold text-slate-600 mb-1">
                        Notes (optional)
                      </label>
                      <input
                        id={`quote-notes-${r.id}`}
                        type="text"
                        value={quoteForm.notes}
                        onChange={(e) => setQuoteForm((f) => ({ ...f, notes: e.target.value }))}
                        placeholder="Valid 7 days, fuel included…"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={closeQuoteForm}
                        disabled={submitting}
                        className="px-3 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => submitQuote(r.id)}
                        disabled={submitting}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                      >
                        {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Send Quote
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

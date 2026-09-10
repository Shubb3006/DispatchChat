import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "@/lib/apiBase";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Info,
  Lock,
  MapPin,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";
import {
  etaTone,
  fmtDate,
  fmtDateTime,
  fmtTime,
  fmtWeight,
  humanize,
  isDelivered,
  relativeTime,
  statusTone,
} from "@/lib/portalFormat";
import PortalLifecycle from "../components/PortalLifecycle";

/* ---------------------------------------------------------------------------
 * The consignee's view. Token-only, no session: this page must work for someone
 * who has never signed in and only has the link a broker forwarded them. It
 * therefore talks to /api/track/:token with a bare axios client rather than the
 * shared axiosInstance, which sends credentials on every request — a stranger's
 * browser has no business attaching cookies here. Nothing on this page shows
 * pricing, contacts or documents.
 * ------------------------------------------------------------------------ */

const POLL_MS = 60000;

// The countdown only ever prints whole minutes, so re-rendering faster than
// this would burn a render to change nothing.
const COUNTDOWN_MS = 60000;

// Same origin the shared client resolves (localhost in dev, Render in prod).
const API_BASE = String(API_BASE_URL || "").replace(/\/+$/, "");

const NOT_FOUND_MESSAGE =
  "We couldn't find that shipment. Tracking links expire when a shipment is archived; ask your Nishan Transport contact for a current link.";

const UNAVAILABLE_MESSAGE =
  "We couldn't reach the tracking service. Your link is probably fine — this is on our side. Try again in a moment.";

/** Consignees paste the whole link as often as the code — accept either. */
const extractToken = (raw) => {
  const value = String(raw || "").trim();
  if (!value) return "";
  const fromUrl = value.match(/\/track\/([^/?#\s]+)/i);
  const candidate = fromUrl ? fromUrl[1] : value.replace(/^\/+|\/+$/g, "");
  try {
    return decodeURIComponent(candidate);
  } catch {
    return candidate;
  }
};

/** What the ETA time actually is — never let it read as a live prediction. */
const ETA_BASIS = {
  commitment: "This is the delivery appointment we committed to, not a live GPS prediction.",
  scheduled: "This is the scheduled delivery date, not a live GPS prediction.",
  actual: "This is the time delivery was recorded.",
  none: "No delivery appointment has been confirmed yet.",
};

/**
 * commitment_date / delivery_date are date-only columns; they arrive as midnight
 * and would otherwise render as a "12:00 AM" appointment nobody ever booked.
 * Only show a clock when the backend really carried one.
 */
const hasClockTime = (value) => {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  return d.getHours() !== 0 || d.getMinutes() !== 0;
};

/** Time left against the appointment, at the minute granularity we tick at. */
const fmtRemaining = (ms) => {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "Under a minute remaining";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m remaining` : `${mins}m remaining`;
};

/* ---------------------------------------------------------------------------
 * Presentational pieces
 * ------------------------------------------------------------------------ */

function Pill({ className = "", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

function Field({ label, value, hint }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-slate-900">{value || "—"}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function Card({ title, icon: Icon, action, children, className = "" }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            {Icon && <Icon className="h-4 w-4 flex-none text-slate-400" />}
            {title}
          </h2>
          {action}
        </div>
      )}
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}

function Lane({ origin, destination }) {
  return (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <span className="break-words font-semibold text-slate-900">{origin || "—"}</span>
      <ArrowRight className="h-3.5 w-3.5 flex-none text-slate-400" />
      <span className="break-words font-semibold text-slate-900">{destination || "—"}</span>
    </span>
  );
}

function TimelineIcon({ kind }) {
  const map = {
    delivered: { Icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600 ring-emerald-600/20" },
    customs: { Icon: ShieldCheck, tone: "bg-amber-50 text-amber-700 ring-amber-600/25" },
    status: { Icon: Truck, tone: "bg-sky-50 text-sky-600 ring-sky-600/20" },
    document: { Icon: CalendarDays, tone: "bg-slate-100 text-slate-500 ring-slate-500/20" },
    system: { Icon: CalendarDays, tone: "bg-slate-100 text-slate-500 ring-slate-500/20" },
  };
  const { Icon, tone } = map[kind] || map.system;
  return (
    <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-full ring-1 ${tone}`}>
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

function Shell({ children, subtitle = "Shipment Tracking" }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 shadow-lg shadow-sky-900/40">
              <Truck className="h-5 w-5 text-white" strokeWidth={2.4} />
            </span>
            <div className="leading-tight">
              <p className="text-base font-bold tracking-tight text-white sm:text-lg">Nishan Transport</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-sky-300">{subtitle}</p>
            </div>
          </div>
          <span className="hidden items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-300 sm:inline-flex">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            Read-only link
          </span>
        </div>
      </header>

      {children}

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-slate-500 sm:px-6">
          <p>Tracking provided by Nishan Transport.</p>
          <p>This link is read-only and shows no pricing.</p>
        </div>
      </footer>
    </div>
  );
}

function SkeletonPage() {
  return (
    <>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl animate-pulse px-4 py-5 sm:px-6">
          <div className="h-6 w-40 rounded bg-slate-200" />
          <div className="mt-2 h-4 w-64 rounded bg-slate-100" />
        </div>
      </div>
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-4 w-1/3 rounded bg-slate-200" />
            <div className="mt-4 h-3 w-2/3 rounded bg-slate-100" />
            <div className="mt-2.5 h-3 w-1/2 rounded bg-slate-100" />
            <div className="mt-2.5 h-3 w-1/4 rounded bg-slate-100" />
          </div>
        ))}
      </main>
    </>
  );
}

/* ---------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------ */

export default function PublicTrackingPage() {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();
  const token = String(trackingNumber || "").trim();

  // Both are stamped with the token they describe. React Router reuses this
  // component across /track/:a -> /track/:b, so an unstamped payload would let
  // shipment A render for a moment under B's URL.
  const [payload, setPayload] = useState(null);
  // kind "missing" = the server does not know this token; "unavailable" = we
  // never got an answer. Telling a consignee their link expired because Render
  // was cold sends them back to the broker for nothing.
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [copied, setCopied] = useState(false);

  // A poll that fails must not blank a page already showing a real shipment,
  // and a response for an old request must not overwrite a newer one.
  const payloadRef = useRef(null);
  const requestRef = useRef(0);

  const fetchShipment = useCallback(
    async ({ quiet = false } = {}) => {
      if (!token) return;
      const requestId = ++requestRef.current;
      if (quiet) setIsRefreshing(true);
      else setError(null);

      try {
        const res = await axios.get(`${API_BASE}/track/${encodeURIComponent(token)}`, {
          withCredentials: false,
          headers: { Accept: "application/json" },
          timeout: 60000,
        });
        if (requestId !== requestRef.current) return;

        const body = res?.data;
        if (!body?.success || !body?.shipment) {
          const bad = new Error(body?.message || "");
          bad.notFound = true;
          throw bad;
        }

        const next = { token, body };
        payloadRef.current = next;
        setPayload(next);
        setError(null);
        setRefreshFailed(false);
        setLastSynced(new Date());
      } catch (err) {
        if (requestId !== requestRef.current) return;
        if (quiet && payloadRef.current?.token === token) {
          setRefreshFailed(true);
          return;
        }
        const status = err?.response?.status;
        const missing = status === 404 || Boolean(err?.notFound);
        payloadRef.current = null;
        setPayload(null);
        setError({
          token,
          kind: missing ? "missing" : "unavailable",
          detail: missing ? err?.response?.data?.message || "" : "",
        });
      } finally {
        if (requestId === requestRef.current) setIsRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (!token) {
      requestRef.current += 1; // drop any in-flight response for a previous token
      payloadRef.current = null;
      setPayload(null);
      setError(null);
      setRefreshFailed(false);
      return undefined;
    }
    fetchShipment();
    const interval = setInterval(() => fetchShipment({ quiet: true }), POLL_MS);
    return () => clearInterval(interval);
  }, [token, fetchShipment]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const current = payload?.token === token ? payload.body : null;
  const shipment = current?.shipment || null;
  const eta = current?.eta || null;
  const position = current?.position || null;
  const delivered = Boolean(shipment?.delivered_at) || isDelivered(shipment?.status);

  // Newest first: a consignee opens this to see what just happened.
  const events = useMemo(() => {
    const list = Array.isArray(current?.timeline) ? current.timeline : [];
    return [...list].reverse();
  }, [current]);

  // eta.at can be a date-only appointment that parses to midnight; that is
  // still a real target, so it counts down like any other.
  const etaTime = useMemo(() => {
    if (!eta?.at) return null;
    const t = new Date(eta.at).getTime();
    return Number.isNaN(t) ? null : t;
  }, [eta?.at]);

  const [nowMs, setNowMs] = useState(() => Date.now());

  // Nothing to count toward once the freight is on the dock, and a passed
  // appointment is the ETA state's story to tell, not a negative timer's.
  useEffect(() => {
    if (!etaTime || delivered) return undefined;
    setNowMs(Date.now());
    const timer = setInterval(() => setNowMs(Date.now()), COUNTDOWN_MS);
    return () => clearInterval(timer);
  }, [etaTime, delivered]);

  const remainingMs = etaTime && !delivered ? etaTime - nowMs : 0;

  const handleLookup = (e) => {
    e.preventDefault();
    const next = extractToken(codeInput);
    if (!next) return;
    navigate(`/track/${encodeURIComponent(next)}`);
  };

  // clipboard is unavailable over plain http and when the user denies it —
  // never flash "Copied" unless the write actually resolved.
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  /* ------------------------------------------------------------- No token */
  if (!token) {
    return (
      <Shell>
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6">
          <div className="mx-auto w-full max-w-md">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Track a shipment</h1>
              <p className="mt-1 text-sm text-slate-500">
                Paste the tracking link your Nishan Transport contact sent you, or just the code at the end
                of it.
              </p>
              <form onSubmit={handleLookup} className="mt-5 space-y-3">
                <div>
                  <label
                    htmlFor="tracking-code"
                    className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                  >
                    Tracking link or code
                  </label>
                  <input
                    id="tracking-code"
                    name="tracking-code"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="https://…/track/ab12…  or  ab12…"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!codeInput.trim()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-60"
                >
                  <Search className="h-4 w-4" />
                  Track
                </button>
              </form>
              <p className="mt-4 text-xs text-slate-500">
                A load number on its own will not work — tracking links are issued per shipment.
              </p>
            </section>
          </div>
        </main>
      </Shell>
    );
  }

  /* ------------------------------------------------------- Not found / error */
  // Ordered before the skeleton so a failed first load never falls through to
  // it; the token check keeps a previous lookup's failure off a new one.
  if (error?.token === token) {
    const missing = error.kind === "missing";
    return (
      <Shell>
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6">
          <div className="mx-auto w-full max-w-md">
            <section className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-6">
              <span
                className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${
                  missing ? "bg-rose-50" : "bg-amber-50"
                }`}
              >
                <AlertCircle className={`h-5 w-5 ${missing ? "text-rose-600" : "text-amber-600"}`} />
              </span>
              <h1 className="mt-4 text-base font-bold text-slate-900">
                {missing ? "Tracking unavailable" : "Can't reach tracking right now"}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {missing ? NOT_FOUND_MESSAGE : UNAVAILABLE_MESSAGE}
              </p>
              {missing && error.detail && error.detail !== NOT_FOUND_MESSAGE && (
                <p className="mt-2 text-xs text-slate-400">{error.detail}</p>
              )}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => navigate("/track")}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  Try another link
                </button>
                <button
                  onClick={() => fetchShipment()}
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </button>
              </div>
            </section>
          </div>
        </main>
      </Shell>
    );
  }

  /* -------------------------------------------------------------- Loading */
  if (!shipment) {
    return (
      <Shell>
        <SkeletonPage />
      </Shell>
    );
  }

  /* -------------------------------------------------------------- Success */
  const etaBasis = ETA_BASIS[eta?.source] || ETA_BASIS.none;
  // The driver-GPS branch of lastKnownPosition reports no place name at all —
  // an empty "Last reported position" card is worse than none.
  const showPosition = Boolean(position && (position.place || position.reported_at));

  return (
    <Shell>
      {/* ------------------------------------------------------------ Page bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Load #{shipment.load_number || "—"}
              </h1>
              <Pill className={statusTone(delivered ? "delivered" : shipment.status)}>
                {shipment.status_label || humanize(shipment.status) || "Status pending"}
              </Pill>
              {shipment.is_cross_border && (
                <Pill className="bg-amber-50 text-amber-800 ring-1 ring-amber-600/25">
                  <ShieldCheck className="h-3 w-3" />
                  Cross-border
                </Pill>
              )}
            </div>
            <p className="mt-1.5 text-sm text-slate-600">
              <Lane origin={shipment.origin} destination={shipment.destination} />
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {refreshFailed ? (
              <span
                role="status"
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700"
              >
                <AlertCircle className="h-3.5 w-3.5 flex-none" />
                Couldn't refresh — showing the last update
              </span>
            ) : (
              /* Not a live region: this restamps every minute and would nag a
                 screen reader for no reason. */
              <span className="hidden text-xs text-slate-400 sm:inline">
                {lastSynced ? `Updated ${fmtDateTime(lastSynced)}` : "Syncing…"}
              </span>
            )}
            <button
              onClick={handleCopyLink}
              aria-label="Copy this tracking link"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy link"}</span>
            </button>
            <button
              onClick={() => fetchShipment({ quiet: true })}
              disabled={isRefreshing}
              aria-label="Refresh tracking"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6">
        {/* ------------------------------------------------- Delivered banner */}
        {shipment.delivered_at && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 flex-none text-emerald-600" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-emerald-900">
                Delivered {fmtDate(shipment.delivered_at)}
              </p>
              <p className="text-xs text-emerald-800">
                Recorded {fmtDateTime(shipment.delivered_at)}
                {relativeTime(shipment.delivered_at) ? ` · ${relativeTime(shipment.delivered_at)}` : ""}
              </p>
            </div>
          </div>
        )}

        {/* --------------------------------------------------- ETA + position */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card
            title="Estimated delivery"
            icon={Clock}
            className={showPosition ? "lg:col-span-2" : "lg:col-span-3"}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">{eta?.label || "Delivery date to be confirmed"}</p>
                {/* No date means no number to show — eta.label and eta.detail
                    already say so in words. */}
                {eta?.at && (
                  <>
                    <p className="mt-1 text-2xl font-bold tabular-nums leading-none text-slate-900">
                      {eta.source === "actual" ? fmtDateTime(eta.at) : fmtDate(eta.at)}
                    </p>
                    {eta.source === "commitment" && hasClockTime(eta.at) && (
                      <p className="mt-1.5 text-sm font-semibold tabular-nums text-slate-600">
                        Appointment {fmtTime(eta.at)}
                      </p>
                    )}
                    {remainingMs > 0 && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold tabular-nums text-sky-700">
                        <Clock className="h-3.5 w-3.5 flex-none text-sky-500" />
                        {fmtRemaining(remainingMs)}
                      </p>
                    )}
                  </>
                )}
                {eta?.detail && <p className="mt-2 text-sm text-slate-500">{eta.detail}</p>}
              </div>
              <Pill className={etaTone(eta?.state)}>{humanize(eta?.state) || "Unknown"}</Pill>
            </div>

            {eta?.at && (
              <p className="mt-4 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600">
                <Info className="mt-0.5 h-3.5 w-3.5 flex-none text-slate-400" />
                <span>{etaBasis}</span>
              </p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-4">
              <Field label="Pickup" value={fmtDate(shipment.pickup_date)} />
              <Field label="Scheduled delivery" value={fmtDate(shipment.delivery_date)} />
            </div>
          </Card>

          {/* Only rendered when the fleet actually reported a position — this
              page never guesses where a truck is. */}
          {showPosition && (
            <Card title="Last reported position" icon={MapPin}>
              {position.place ? (
                <p className="break-words text-sm font-medium text-slate-900">{position.place}</p>
              ) : (
                <p className="text-sm text-slate-500">
                  The truck checked in, but without a place name attached.
                </p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                {position.reported_at
                  ? `Reported ${relativeTime(position.reported_at)} · ${fmtDateTime(position.reported_at)}`
                  : "Report time not available"}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                Positions come from the truck as it reports in, so this can lag behind the shipment's
                actual location.
              </p>
            </Card>
          )}
        </div>

        {/* ------------------------------------------------ Full lifecycle */}
        {/* The consignee gets the whole ladder — it is the one thing they came
            for, and it carries no pricing or documents. "full" already opens
            with the progress bar and the four-step summary, so this is the only
            place the tracker is mounted. Renders nothing until the API carries
            a lifecycle: the milestones below beat an empty shell. */}
        <PortalLifecycle lifecycle={current?.lifecycle} variant="full" />

        {/* ---------------------------------------------------------- Freight */}
        <Card title="Freight" icon={PackageCheck}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Commodity" value={shipment.commodity || "Not provided"} />
            <Field
              label="Pieces"
              value={Number(shipment.pieces) > 0 ? Number(shipment.pieces).toLocaleString() : "—"}
            />
            <Field label="Weight" value={fmtWeight(shipment.weight)} />
            <Field label="Carrier" value={current?.carrier} />
          </div>
          {shipment.is_cross_border && (
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-none text-amber-600" />
              <span>
                This shipment crosses the border. Customs milestones appear in the timeline below as they
                are recorded.
              </span>
            </p>
          )}
        </Card>

        {/* --------------------------------------------------------- Timeline */}
        <Card
          title="Milestones"
          icon={CalendarDays}
          action={<span className="text-xs text-slate-400">Most recent first</span>}
        >
          {events.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center">
              <p className="text-sm font-semibold text-slate-900">No milestones recorded yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Updates appear here as the shipment moves. This page refreshes on its own every minute.
              </p>
            </div>
          ) : (
            <ol className="space-y-0">
              {events.map((event, i) => (
                <li key={`${event.at || "t"}-${event.label}-${i}`} className="flex gap-3">
                  <div className="flex flex-none flex-col items-center">
                    <TimelineIcon kind={event.kind} />
                    {i < events.length - 1 && <span className="w-px flex-1 bg-slate-200" />}
                  </div>
                  <div className={`min-w-0 flex-1 ${i < events.length - 1 ? "pb-5" : ""}`}>
                    <p className="break-words text-sm font-medium text-slate-900">{event.label || "—"}</p>
                    {event.detail && <p className="mt-0.5 break-words text-sm text-slate-500">{event.detail}</p>}
                    <p className="mt-0.5 text-xs text-slate-400">
                      {fmtDateTime(event.at)}
                      {relativeTime(event.at) ? ` · ${relativeTime(event.at)}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        {/* Documents are never served from a public link — say where they live. */}
        {shipment.pod_available && (
          <div className="flex flex-wrap items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-slate-100">
              <Lock className="h-4 w-4 text-slate-500" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">Proof of delivery is on file</p>
              <p className="mt-1 text-sm text-slate-500">
                The signed POD is available to the shipper in their Nishan Transport portal. This tracking
                link does not carry documents.
              </p>
            </div>
          </div>
        )}
      </main>
    </Shell>
  );
}

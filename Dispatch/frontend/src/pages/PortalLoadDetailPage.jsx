import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  Clock,
  Copy,
  Download,
  FileText,
  Info,
  Link2,
  Loader2,
  MapPin,
  MessageSquare,
  Navigation,
  PackageCheck,
  Send,
  ShieldCheck,
  Truck,
  Upload,
  User,
} from "lucide-react";
import PortalLifecycle from "../components/PortalLifecycle";
import { usePortalStore, apiFileUrl } from "../stores/usePortalStore";
import {
  etaTone,
  fmtDate,
  fmtDateTime,
  fmtMoney,
  fmtTime,
  fmtWeight,
  humanize,
  isDelivered,
  relativeTime,
  statusTone,
} from "@/lib/portalFormat";

// The shipment page is the customer's live view of freight in motion, so it
// re-reads itself on a timer rather than waiting for a manual refresh.
const DETAIL_POLL_MS = 45000;
const MESSAGE_POLL_MS = 20000;
// The countdown only ever prints whole minutes, so a faster tick would repaint
// the page for nothing.
const COUNTDOWN_TICK_MS = 60000;

const TIMELINE_DOT = {
  status: "bg-sky-500",
  customs: "bg-amber-500",
  document: "bg-slate-400",
  delivered: "bg-emerald-500",
  system: "bg-slate-400",
};

const cityLine = (city, state, country) => [city, state, country].filter(Boolean).join(", ");

/** Place name when the ELD gave us one, otherwise the raw fix — never invented. */
const positionPlace = (position) => {
  if (!position) return "—";
  if (position.place) return position.place;
  const lat = Number(position.lat);
  const lng = Number(position.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "—";
  return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
};

/**
 * Time left until the ETA, as freight people say it. Returns null once the
 * appointment is in the past — the ETA block already carries the late wording
 * the backend sent, and a negative countdown would talk over it.
 */
const countdownLabel = (target, now) => {
  const at = new Date(target || 0).getTime();
  if (!Number.isFinite(at)) return null;
  const ms = at - now;
  if (ms <= 0) return null;

  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "Less than a minute remaining";
  if (minutes < 60) return `${minutes}m remaining`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m remaining`;
  // Past a day out, hours stop being readable ("74h 12m") — days and hours do.
  return `${Math.floor(hours / 24)}d ${hours % 24}h remaining`;
};

/** A carrier field is only worth a row when dispatch actually filled it in. */
const assignedValue = (value) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

const copyToClipboard = async (text) => {
  if (!text) return false;
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(String(text));
    return true;
  } catch {
    return false;
  }
};

/* ---------------------------------------------------------------------------
 * Presentational pieces — same vocabulary as the portal dashboard.
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

function Lane({ origin, destination, className = "" }) {
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
      <span className="font-semibold text-slate-900">{origin || "—"}</span>
      <ArrowRight className="h-3.5 w-3.5 flex-none text-slate-400" />
      <span className="font-semibold text-slate-900">{destination || "—"}</span>
    </span>
  );
}

function Field({ label, value, className = "" }) {
  const shown = value === null || value === undefined || value === "" ? "—" : value;
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium text-slate-900">{shown}</dd>
    </div>
  );
}

function Card({ title, icon: Icon, action, children, bodyClass = "p-4 sm:p-5" }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          {Icon && <Icon className="h-4 w-4 flex-none text-slate-400" />}
          {title}
        </h2>
        {action}
      </div>
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
            <div className="h-4 w-1/3 rounded bg-slate-200" />
            <div className="mt-4 h-3 w-2/3 rounded bg-slate-100" />
            <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
            <div className="mt-2 h-3 w-1/4 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="space-y-6">
        {[0, 1].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
            <div className="h-4 w-1/2 rounded bg-slate-200" />
            <div className="mt-4 h-3 w-3/4 rounded bg-slate-100" />
            <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Shell({ bar, children }) {
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
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-sky-300">Customer Portal</p>
            </div>
          </div>
          <ShellAccount />
        </div>
      </header>

      <div className="border-b border-slate-200 bg-white">{bar}</div>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6">{children}</main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-slate-500 sm:px-6">
          <p>© {new Date().getFullYear()} Nishan Transport. Customer Portal.</p>
          <p>Questions about a shipment? Contact your Nishan Transport dispatch coordinator.</p>
        </div>
      </footer>
    </div>
  );
}

function ShellAccount() {
  const portalUser = usePortalStore((state) => state.portalUser);
  if (!portalUser) return null;
  return (
    <div className="hidden items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 sm:flex">
      <Building2 className="h-4 w-4 flex-none text-slate-400" />
      <div className="leading-tight">
        <p className="max-w-[16rem] truncate text-sm font-semibold text-white">
          {portalUser.company_name || portalUser.username}
        </p>
        <p className="text-[11px] text-slate-400">Signed in as {portalUser.username}</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------ */

export default function PortalLoadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    loadDetail,
    isLoadingDetail,
    fetchLoadDetail,
    clearLoadDetail,
    messages,
    isLoadingMessages,
    isSendingMessage,
    fetchMessages,
    sendMessage,
    markMessagesRead,
    uploadCustomsDoc,
    isUploadingCustoms,
  } = usePortalStore();

  const [hasResolved, setHasResolved] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [copyFallback, setCopyFallback] = useState(null);
  const [draft, setDraft] = useState("");
  const [customsDragActive, setCustomsDragActive] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const threadRef = useRef(null);
  const threadCardRef = useRef(null);
  const hasMarkedRead = useRef(false);

  const detail = loadDetail;
  const load = detail?.load || null;
  const eta = detail?.eta || null;
  const position = detail?.position || null;
  const customs = detail?.customs || null;
  const quote = detail?.quote || null;
  const carrier = detail?.carrier || null;
  const tracking = detail?.tracking || null;
  const documents = detail?.documents || [];
  const timeline = detail?.timeline || [];

  // The route param may be a UUID or a load number; the API resolves either.
  // Once the shipment is loaded we address the thread by its real id so the
  // unread map on the dashboard is keyed the same way.
  const threadId = load?.id || id;
  const notFound = hasResolved && !load;

  const orderedTimeline = useMemo(
    () => [...timeline].sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0)),
    [timeline]
  );

  // A delivered load has no time left to run down, and a shipment with no
  // appointment has nothing to count down to.
  const countdownTarget = !eta?.at || isDelivered(load?.status) ? null : eta.at;
  const etaCountdown = countdownTarget ? countdownLabel(countdownTarget, now) : null;

  useEffect(() => {
    if (!countdownTarget) return undefined;
    // The detail poll can hand us a new ETA mid-minute; re-read the clock now
    // rather than showing a stale remainder until the next tick.
    setNow(Date.now());
    const interval = setInterval(() => {
      const stamp = Date.now();
      setNow(stamp);
      // Past the appointment the block falls back to the late wording the
      // backend sent, so there is nothing left to tick.
      if (new Date(countdownTarget).getTime() - stamp <= 0) clearInterval(interval);
    }, COUNTDOWN_TICK_MS);
    return () => clearInterval(interval);
  }, [countdownTarget]);

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;

    const run = async (quiet) => {
      const result = await fetchLoadDetail(id, { quiet });
      if (cancelled) return;
      // A failed poll leaves the previous payload on screen; don't claim it is fresh.
      if (result) setLastSynced(new Date());
      setHasResolved(true);
    };

    run(false);
    const interval = setInterval(() => run(true), DETAIL_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
      clearLoadDetail();
    };
  }, [id]);

  useEffect(() => {
    // No thread exists for a shipment we could not resolve — don't poll a 404.
    if (!threadId || notFound) return undefined;
    fetchMessages(threadId);
    const interval = setInterval(() => fetchMessages(threadId, { quiet: true }), MESSAGE_POLL_MS);
    return () => clearInterval(interval);
  }, [threadId, notFound]);

  useEffect(() => {
    hasMarkedRead.current = false;
  }, [threadId]);

  // Clearing the unread badge is a claim that the customer actually saw the
  // thread, so it waits until the card is on screen.
  useEffect(() => {
    const node = threadCardRef.current;
    if (!node || !threadId || hasMarkedRead.current) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      hasMarkedRead.current = true;
      markMessagesRead(threadId);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (hasMarkedRead.current) return;
        if (entries.some((entry) => entry.isIntersecting)) {
          hasMarkedRead.current = true;
          markMessagesRead(threadId);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threadId, loadDetail]);

  useEffect(() => {
    const box = threadRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages.length]);

  const handleCopyTracking = async () => {
    const url = tracking?.public_url;
    if (!url) return;
    if (await copyToClipboard(url)) {
      setCopyFallback(null);
      toast.success("Tracking link copied — it opens without a login.");
      return;
    }
    setCopyFallback({ label: "Public tracking link", value: url });
    toast.error("Your browser blocked the clipboard — the link is shown at the top of the page.");
  };

  const handleCopyLead = async () => {
    const lead = customs?.lead_number;
    if (!lead) return;
    if (await copyToClipboard(lead)) {
      toast.success(`${customs.lead_number_type || "Lead"} number copied.`);
      return;
    }
    toast.error("Copy is blocked in this browser — select the number to copy it manually.");
  };

  const handleCustomsUpload = async (file) => {
    if (!file) return;
    await uploadCustomsDoc(load?.id || id, file);
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || isSendingMessage) return;
    const sent = await sendMessage(threadId, text);
    if (sent) setDraft("");
  };

  const handleComposerKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const backButton = (
    <button
      onClick={() => navigate("/portal/dashboard")}
      className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-sky-700 transition-colors hover:text-sky-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to dashboard
    </button>
  );

  if (!load) {
    const pendingBar = (
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        {backButton}
        <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {isLoadingDetail || !hasResolved ? "Loading shipment…" : "Shipment not found"}
        </h1>
      </div>
    );

    if (isLoadingDetail || !hasResolved) {
      return (
        <Shell bar={pendingBar}>
          <DetailSkeleton />
        </Shell>
      );
    }

    return (
      <Shell bar={pendingBar}>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
            <AlertCircle className="h-5 w-5 text-slate-400" />
          </span>
          <p className="mt-4 text-sm font-semibold text-slate-900">We couldn&apos;t find that shipment</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            The reference <span className="break-all font-mono text-slate-700">{id}</span> isn&apos;t on your account, it
            has not been booked yet, or we could not reach the server. If you expected it here, contact your
            dispatch coordinator.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => navigate("/portal/dashboard")}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </button>
            <button
              onClick={() => fetchLoadDetail(id)}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              Try again
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  const etaScheduled = eta?.source === "scheduled" || eta?.source === "commitment";
  const customsNeedsDocs = Boolean(customs?.needs_documents);

  // The API returns a `quote` block for any load linked to a rate request,
  // priced or not. quoted_price stays NULL until dispatch actually prices it,
  // and Number(null) is 0 — so formatting it unguarded invents a $0.00 quote.
  const quotedPrice = (() => {
    if (quote?.price === null || quote?.price === undefined || quote?.price === "") return null;
    const n = Number(quote.price);
    return Number.isFinite(n) && n > 0 ? n : null;
  })();

  // getPortalLoadDetail joins drivers and trucks, so the carrier block carries a
  // driver name and a truck number and nothing else; a trailer number is only
  // rendered if the API ever starts sending one. Rows are built from the values
  // that are actually filled in, so an unassigned load gets the sentence below
  // instead of a grid of dashes.
  const carrierRows = [
    { label: "Driver", value: assignedValue(carrier?.driver_name), icon: User },
    { label: "Truck", value: assignedValue(carrier?.truck_number), icon: Truck },
    { label: "Trailer", value: assignedValue(carrier?.trailer_number), icon: Truck },
  ].filter((row) => row.value);

  const pageBar = (
    <>
      <div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-4 px-4 py-5 sm:px-6">
        <div className="min-w-0">
          {backButton}
          <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Load #{load.load_number || "—"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Lane origin={load.origin} destination={load.destination} className="text-sm" />
            <Pill className={statusTone(load.status)}>{load.status_label || humanize(load.status)}</Pill>
            {load.is_cross_border && (
              <Pill className="bg-amber-50 text-amber-800 ring-1 ring-amber-600/25">
                <ShieldCheck className="h-3 w-3" />
                Cross-border
              </Pill>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          {tracking && (
            <button
              onClick={handleCopyTracking}
              title="Copy a public tracking link for this shipment. It works without a login — safe to send to your consignee or receiver."
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <Link2 className="h-4 w-4" />
              Copy tracking link
            </button>
          )}
          <span className="text-xs text-slate-400">
            {lastSynced ? `Updated ${fmtTime(lastSynced)}` : "Syncing…"}
          </span>
        </div>
      </div>

      {copyFallback && (
        <div className="border-t border-slate-200 bg-amber-50">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            <label
              htmlFor="portal-copy-fallback"
              className="text-[11px] font-semibold uppercase tracking-wider text-amber-900"
            >
              {copyFallback.label}
            </label>
            <input
              id="portal-copy-fallback"
              readOnly
              value={copyFallback.value}
              onFocus={(event) => event.target.select()}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
            <p className="mt-1 text-xs text-amber-900">
              Your browser blocked the clipboard. Select the link above and copy it manually — it opens the
              tracking page without a login.
            </p>
          </div>
        </div>
      )}
    </>
  );

  return (
    <Shell bar={pageBar}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ------------------------------------------- Tracking / status column */}
        <div className="space-y-6 lg:col-span-2">
          {/* ------------------------------------------------------ Live tracking */}
          <Card title="Live tracking" icon={Navigation}>
            <PortalLifecycle lifecycle={detail?.lifecycle} variant="full" />

            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Estimated delivery
                  </p>
                  <p className="mt-1 text-lg font-bold leading-tight text-slate-900">
                    {eta?.label || "To be confirmed"}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-slate-600">
                    <Clock className="h-3.5 w-3.5 flex-none text-slate-400" />
                    {fmtDateTime(eta?.at)}
                  </p>
                  {etaCountdown && (
                    <p className="mt-1 text-sm font-semibold tabular-nums text-sky-700">{etaCountdown}</p>
                  )}
                </div>
                <Pill className={etaTone(eta?.state)}>{humanize(eta?.state || "unknown")}</Pill>
              </div>

              {eta?.detail && <p className="mt-2.5 text-sm text-slate-600">{eta.detail}</p>}

              {etaScheduled && (
                <p className="mt-2.5 flex items-start gap-1.5 text-xs leading-relaxed text-slate-500">
                  <Info className="mt-0.5 h-3.5 w-3.5 flex-none text-slate-400" />
                  This is the scheduled appointment on the booking, not a live prediction from the truck.
                </p>
              )}

              {(!eta || eta.source === "none") && (
                <p className="mt-2.5 flex items-start gap-1.5 text-xs leading-relaxed text-slate-500">
                  <Info className="mt-0.5 h-3.5 w-3.5 flex-none text-slate-400" />
                  No delivery appointment has been set on this shipment yet.
                </p>
              )}
            </div>

            {position ? (
              <div className="mt-4 rounded-lg border border-slate-200 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Last reported position
                </p>
                <p className="mt-1 flex items-start gap-2 text-sm font-medium text-slate-900">
                  <MapPin className="mt-0.5 h-4 w-4 flex-none text-sky-600" />
                  <span className="break-words">{positionPlace(position)}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>Unit {position.unit || "—"}</span>
                  <span>{relativeTime(position.reported_at) || fmtDateTime(position.reported_at)}</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">Live GPS is not reporting on this shipment</p>
                <p className="mt-1 text-sm text-slate-500">
                  We have no position pings for this load. The milestones below are posted by the dispatch team
                  as the freight moves.
                </p>
              </div>
            )}
          </Card>

          {/* ----------------------------------------------------------- Timeline */}
          <Card title="Shipment timeline" icon={CalendarDays}>
            {orderedTimeline.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nothing has been posted on this shipment yet. Pickup, border and delivery milestones will appear
                here as they happen.
              </p>
            ) : (
              <ol>
                {orderedTimeline.map((event, index) => (
                  <li key={`${event.at || index}-${index}`} className="flex gap-3 pb-5 last:pb-0">
                    <div className="flex flex-none flex-col items-center">
                      <span
                        className={`mt-1.5 h-2.5 w-2.5 rounded-full ${
                          TIMELINE_DOT[event.kind] || TIMELINE_DOT.system
                        }`}
                      />
                      {index < orderedTimeline.length - 1 && <span className="mt-1 w-px flex-1 bg-slate-200" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{event.label || "Update"}</p>
                      {event.detail && <p className="mt-0.5 text-sm text-slate-600">{event.detail}</p>}
                      <p className="mt-1 text-xs text-slate-400">
                        {fmtDateTime(event.at)}
                        {relativeTime(event.at) ? ` · ${relativeTime(event.at)}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          {/* ------------------------------------------------------------ Customs */}
          {customs && (
            <Card
              title="Customs clearance"
              icon={ShieldCheck}
              action={
                customs.status_label || customs.status ? (
                  <Pill
                    className={
                      customs.attention
                        ? "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20"
                        : "bg-amber-50 text-amber-800 ring-1 ring-amber-600/25"
                    }
                  >
                    {customs.status_label || humanize(customs.status)}
                  </Pill>
                ) : null
              }
            >
              {customs.attention && (
                <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-none text-rose-600" />
                  <p className="text-sm text-rose-800">
                    {customs.attention_message ||
                      "This shipment needs attention at the border. Our customs desk is on it — message us here if you have the paperwork."}
                  </p>
                </div>
              )}

              <ol className="space-y-3.5">
                {(customs.stages || []).map((stage) => (
                  <li key={stage.key} className="flex gap-3">
                    {stage.done ? (
                      <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-500">
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="mt-0.5 h-5 w-5 flex-none rounded-full border-2 border-slate-300" />
                    )}
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold ${
                          stage.done ? "text-slate-900" : "text-slate-500"
                        }`}
                      >
                        {stage.label}
                      </p>
                      {stage.hint && <p className="mt-0.5 text-xs text-slate-500">{stage.hint}</p>}
                      {stage.at && (
                        <p className="mt-0.5 text-xs font-medium text-emerald-700">{fmtDate(stage.at)}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {customs.lead_number_type || "Lead"} number
                </p>
                {customs.lead_number ? (
                  <button
                    onClick={handleCopyLead}
                    title="Copy this reference to your clipboard"
                    className="mt-1.5 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-mono text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                  >
                    {customs.lead_number}
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                ) : (
                  <p className="mt-1.5 text-sm font-medium text-slate-500">Not yet issued</p>
                )}
              </div>

              <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Port of entry" value={customs.port_of_entry} />
                <Field label="Customs broker" value={customs.broker} />
                <Field
                  label="Crossing ETA"
                  value={customs.crossing_eta ? fmtDateTime(customs.crossing_eta) : null}
                />
                <Field label="Cleared" value={customs.cleared_at ? fmtDateTime(customs.cleared_at) : null} />
              </dl>

              {/* Border paperwork is the one thing only the customer can give us. */}
              <div
                onDragEnter={(event) => {
                  event.preventDefault();
                  setCustomsDragActive(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setCustomsDragActive(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setCustomsDragActive(false);
                  const file = event.dataTransfer?.files?.[0];
                  if (file) handleCustomsUpload(file);
                }}
                className={`mt-5 rounded-lg border-2 border-dashed p-5 text-center transition-colors ${
                  customsDragActive
                    ? "border-sky-400 bg-sky-50"
                    : customsNeedsDocs
                    ? "border-amber-400 bg-amber-50"
                    : "border-slate-300 bg-white hover:border-slate-400"
                }`}
              >
                <Upload
                  className={`mx-auto h-6 w-6 ${customsNeedsDocs ? "text-amber-600" : "text-slate-400"}`}
                />
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {customsNeedsDocs ? "We still need your customs paperwork" : "Upload customs paperwork"}
                </p>
                {customsNeedsDocs && (
                  <p className="mt-1 text-sm text-amber-900">
                    Commercial invoice, packing list, and any permits or certificates.
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">Drag a file here, or</p>
                <label className="mt-1 inline-block cursor-pointer text-sm font-semibold text-sky-700 hover:underline">
                  browse your files
                  <input
                    type="file"
                    className="hidden"
                    disabled={isUploadingCustoms}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) handleCustomsUpload(file);
                    }}
                  />
                </label>
                {isUploadingCustoms && (
                  <p className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading…
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* ---------------------------------------------------------- Documents */}
          <Card title="Documents" icon={FileText} bodyClass="">
            {documents.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500 sm:px-5">
                No documents yet — your BOL and proof of delivery will appear here as soon as they are filed.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <li key={doc.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-slate-100">
                      <FileText className="h-4 w-4 text-slate-500" />
                    </span>
                    <div className="min-w-[9rem] flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {doc.label || humanize(doc.document_type) || "Document"}
                      </p>
                      <p className="truncate text-xs text-slate-500">{doc.file_name || "—"}</p>
                    </div>
                    <span className="text-xs text-slate-500">{fmtDate(doc.created_at)}</span>
                    {doc.is_approved && (
                      <Pill className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">Approved</Pill>
                    )}
                    {doc.download_url ? (
                      <a
                        href={apiFileUrl(doc.download_url)}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Not available</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* ----------------------------------------------------------- Messages */}
          <div ref={threadCardRef}>
            <Card
              title="Messages with dispatch"
              icon={MessageSquare}
              bodyClass=""
              action={
                <span className="text-xs text-slate-400">
                  {messages.length > 0 ? `${messages.length} message${messages.length === 1 ? "" : "s"}` : ""}
                </span>
              }
            >
              <div
                ref={threadRef}
                className="max-h-[26rem] space-y-3 overflow-y-auto bg-slate-50/60 p-4 sm:p-5"
              >
                {isLoadingMessages && messages.length === 0 ? (
                  <div className="space-y-3">
                    {[0, 1].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-14 w-2/3 rounded-2xl bg-slate-200" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-8 text-center">
                    <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white ring-1 ring-slate-200">
                      <MessageSquare className="h-5 w-5 text-slate-400" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-slate-900">No messages yet</p>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                      A message here goes straight to the dispatch team handling this load — appointment
                      changes, paperwork questions, anything.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const mine = message.side === "customer";
                    return (
                      <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                            mine ? "bg-sky-600 text-white" : "border border-slate-200 bg-white text-slate-800"
                          }`}
                        >
                          {!mine && (
                            <p className="text-[11px] font-semibold text-slate-500">
                              {message.sender_name || "Nishan Dispatch"}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
                          <p className={`mt-1 text-[11px] ${mine ? "text-sky-100" : "text-slate-400"}`}>
                            {fmtDateTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-slate-100 p-4 sm:p-5">
                <label
                  htmlFor="portal-message-body"
                  className="text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                >
                  Message dispatch about Load #{load.load_number || id}
                </label>
                <textarea
                  id="portal-message-body"
                  rows={3}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="Ask about pickup timing, paperwork, delivery appointments…"
                  className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">Enter sends · Shift + Enter adds a line</p>
                  <button
                    onClick={handleSend}
                    disabled={isSendingMessage || !draft.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* ------------------------------------------------------------- Sidebar */}
        <aside className="space-y-6">
          <Card title="Shipment details" icon={PackageCheck}>
            <dl className="grid grid-cols-2 gap-3">
              <Field label="Pickup" value={fmtDate(load.pickup_date)} />
              <Field label="Delivery" value={fmtDate(load.delivery_date)} />
              <Field label="Commodity" value={load.commodity} />
              <Field label="Pieces" value={load.pieces} />
              <Field label="Weight" value={fmtWeight(load.weight)} />
              <Field label="Trailer" value={load.trailer_type ? humanize(load.trailer_type) : null} />
              <Field label="Freight type" value={load.freight_type ? humanize(load.freight_type) : null} />
              <Field label="House status" value={load.house_status ? humanize(load.house_status) : null} />
              <Field label="Your reference" value={load.customer_reference} />
              <Field label="Pickup number" value={load.pickup_number} />
            </dl>

            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Shipper</p>
                <p className="mt-0.5 text-sm font-medium text-slate-900">{load.shipper_name || "—"}</p>
                <p className="text-sm text-slate-500">
                  {cityLine(load.shipper_city, load.shipper_state, load.shipper_country) || "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Consignee</p>
                <p className="mt-0.5 text-sm font-medium text-slate-900">{load.consignee_name || "—"}</p>
                <p className="text-sm text-slate-500">
                  {cityLine(load.consignee_city, load.consignee_state, load.consignee_country) || "—"}
                </p>
              </div>
            </div>
          </Card>

          {quote && (
            <Card title="Quote" icon={CalendarDays}>
              {quotedPrice === null ? (
                <p className="text-sm text-slate-500">
                  No price has been quoted on this shipment yet — your dispatch coordinator will send one
                  through.
                </p>
              ) : (
                <>
                  <p className="text-2xl font-bold tabular-nums text-slate-900">
                    {fmtMoney(quotedPrice, quote.currency || "USD")}
                    <span className="ml-1.5 text-sm font-semibold text-slate-500">
                      {quote.currency || "USD"}
                    </span>
                  </p>
                  {/* responded_at is stamped on both accept and reject, so this
                      date is the response — not proof the quote was accepted. */}
                  <p className="mt-1 text-sm text-slate-500">
                    {quote.accepted_at ? `Responded ${fmtDate(quote.accepted_at)}` : "Awaiting your response"}
                  </p>
                </>
              )}
            </Card>
          )}

          <Card title="Driver & equipment" icon={Truck}>
            {carrierRows.length > 0 ? (
              <dl className="space-y-3">
                {carrierRows.map((row) => (
                  <div key={row.label} className="flex items-start gap-2.5">
                    <row.icon className="mt-0.5 h-4 w-4 flex-none text-slate-400" />
                    <Field label={row.label} value={row.value} />
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-slate-500">
                Not yet assigned — the driver and unit appear here once dispatch books the truck.
              </p>
            )}
          </Card>
        </aside>
      </div>
    </Shell>
  );
}

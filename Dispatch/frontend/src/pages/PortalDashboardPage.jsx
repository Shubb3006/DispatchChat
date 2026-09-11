import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePortalStore } from "../stores/usePortalStore";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  FileUp,
  Loader2,
  LogOut,
  MessageSquare,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Thermometer,
  Truck,
} from "lucide-react";
import {
  EQUIPMENT_LABELS,
  SERVICE_LABELS,
  etaTone,
  fmtDate,
  fmtMoney,
  fmtTemperature,
  fmtTime,
  fmtWeight,
  humanize,
  isDelivered,
  rateTone,
  relativeTime,
  statusTone,
} from "@/lib/portalFormat";
import { LifecycleBadge } from "../components/PortalLifecycle";

/* ---------------------------------------------------------------------------
 * Formatting lives in lib/portalFormat so the dashboard, the shipment view,
 * the rate form and the public tracking page all speak with one voice.
 * ------------------------------------------------------------------------ */

/* ---------------------------------------------------------------------------
 * Presentational pieces
 * ------------------------------------------------------------------------ */

function StatCard({ label, value, hint, icon: Icon, tone, highlight }) {
  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${highlight ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-200"
        }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-1.5 text-3xl font-bold leading-none tabular-nums text-slate-900">{value}</p>
          {hint && <p className="mt-2 text-xs leading-snug text-slate-500">{hint}</p>}
        </div>
        <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-4 w-4" strokeWidth={2.2} />
        </span>
      </div>
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

function Chip({ icon: Icon, children }) {
  if (!children) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
      {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}
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

function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-5 w-5 text-slate-400" />
      </span>
      <p className="mt-4 text-sm font-semibold text-slate-900">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{body}</p>}
      {action}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-4">
          <div className="h-4 w-1/3 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-2/3 rounded bg-slate-100" />
          <div className="mt-2 h-3 w-1/4 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function EtaBadge({ eta, compact = false }) {
  if (!eta) return null;
  const when = eta.at ? fmtDate(eta.at, { month: "short", day: "numeric" }) : null;
  return (
    <span className="inline-flex flex-col gap-1">
      <Pill className={etaTone(eta.state)}>
        <Clock className="h-3 w-3" />
        {eta.label}
      </Pill>
      {when && !compact && (
        <span className="text-xs text-slate-500">
          {eta.state === "delivered" ? "Delivered" : "Scheduled"} {when}
        </span>
      )}
    </span>
  );
}

/**
 * Notification bell. Live over SSE (subscribeNotifications) with the 30s
 * dashboard refresh as the safety net, plus the email milestone switches that
 * drive customers.notify_prefs on the server.
 */
function NotificationBell() {
  const {
    notifications,
    unreadNotifications,
    markNotificationsRead,
    notifyPrefs,
    fetchNotifyPrefs,
    updateNotifyPrefs,
    isSavingPrefs,
  } = usePortalStore();
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openPanel = () => {
    setOpen((wasOpen) => {
      if (!wasOpen && unreadNotifications > 0) markNotificationsRead();
      return !wasOpen;
    });
  };

  const milestones = notifyPrefs?.milestones || {};
  const PREF_ROWS = [
    ["quote_ready", "A quote is ready"],
    ["picked_up", "Freight picked up"],
    ["in_transit", "In transit"],
    ["customs", "Customs updates"],
    ["delivered", "Delivered"],
    ["exception", "Delays and exceptions"],
  ];

  const togglePref = (key) => {
    const next = {
      email: notifyPrefs?.email !== false,
      milestones: { ...milestones, [key]: milestones[key] === false },
    };
    updateNotifyPrefs(next);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={openPanel}
        aria-label={`Notifications${unreadNotifications ? ` (${unreadNotifications} unread)` : ""}`}
        className="relative inline-flex items-center justify-center rounded-lg border border-slate-700 p-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        <Bell className="h-4 w-4" />
        {unreadNotifications > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">
            {unreadNotifications > 9 ? "9+" : unreadNotifications}
          </span>
        )}
      </button>

      {open && (
        // Anchored to the bell, but narrow enough that the panel still fits on
        // a 360px screen without running off the left edge.
        <div className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-6rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-bold text-slate-900">Notifications</p>
            <button
              onClick={() => {
                setShowSettings((s) => !s);
                if (!notifyPrefs) fetchNotifyPrefs();
              }}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </button>
          </div>

          {showSettings ? (
            <div className="px-4 py-3">
              <p className="text-xs text-slate-500">Email me when:</p>
              <div className="mt-2 space-y-1.5">
                {PREF_ROWS.map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center justify-between gap-3 py-1">
                    <span className="text-sm text-slate-700">{label}</span>
                    <input
                      type="checkbox"
                      checked={milestones[key] !== false}
                      disabled={isSavingPrefs}
                      onChange={() => togglePref(key)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                  </label>
                ))}
              </div>
              <p className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                In-app alerts always stay on. Email goes to your company's address on file.
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              Nothing yet. Quotes, status changes and messages from dispatch land here.
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} className={`px-4 py-3 ${n.is_read ? "" : "bg-sky-50/50"}`}>
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-sky-500" />}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                      {n.message && <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>}
                      <p className="mt-1 text-[11px] text-slate-400">{relativeTime(n.created_at)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------ */

export default function PortalDashboardPage() {
  const navigate = useNavigate();
  const {
    portalUser,
    portalLogout,
    rateRequests,
    loads,
    fetchRateRequests,
    fetchPortalLoads,
    isLoading,
    respondToRate,
    uploadTender,
    isUploadingTender,
    fetchNotifications,
    subscribeNotifications,
    fetchNotifyPrefs,
    fetchUnreadCounts,
    unreadByLoad,
    trackLoad,
    isTracking,
  } = usePortalStore();

  const [activeTab, setActiveTab] = useState("rates");
  const [query, setQuery] = useState("");
  const [trackQuery, setTrackQuery] = useState("");
  const [loadFilter, setLoadFilter] = useState("active");
  const [rateFilter, setRateFilter] = useState("ALL");
  const [lastSynced, setLastSynced] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [respondingId, setRespondingId] = useState(null);
  const [uploadingFor, setUploadingFor] = useState(null);

  useEffect(() => {
    if (!portalUser) navigate("/portal/login", { replace: true });
  }, [portalUser, navigate]);

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchRateRequests(),
        fetchPortalLoads(),
        fetchNotifications(),
        fetchUnreadCounts(),
      ]);
      setLastSynced(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refresh();
    fetchNotifyPrefs();
    const interval = setInterval(refresh, 30000); // keep the board live
    // Live alerts arrive over SSE; the poll above is the fallback if the
    // stream drops (proxies, sleeping laptops).
    const unsubscribe = subscribeNotifications();
    return () => {
      clearInterval(interval);
      unsubscribe?.();
    };
  }, []);

  const handleQuoteAction = async (id, decision) => {
    setRespondingId(id);
    try {
      await respondToRate(id, decision);
      await fetchRateRequests();
    } finally {
      setRespondingId(null);
    }
  };

  const handleTenderUpload = async (file, rateRequestId) => {
    setUploadingFor(rateRequestId);
    try {
      const result = await uploadTender(file, rateRequestId);
      if (result) setActiveTab("loads");
    } finally {
      setUploadingFor(null);
    }
  };

  // A miss already raised a toast from the store; leave the box as typed so the
  // customer can correct a digit instead of re-keying the whole number.
  const handleTrack = async (e) => {
    e.preventDefault();
    const q = trackQuery.trim();
    if (!q || isTracking) return;
    const found = await trackLoad(q);
    if (found?.id) navigate(`/portal/loads/${found.id}`);
  };

  const handleLogout = async () => {
    await portalLogout();
    navigate("/portal/login", { replace: true });
  };

  const pendingRates = rateRequests.filter((r) => r.status === "PENDING");
  const quotedRates = rateRequests.filter((r) => r.status === "QUOTED");
  const activeLoads = loads.filter((l) => !isDelivered(l.status));
  const deliveredLoads = loads.filter((l) => isDelivered(l.status));

  // An accepted quote still owes us a tender until a load references it.
  const loadForRequest = (id) => loads.find((l) => l.rate_request_id === id);
  const awaitingTender = rateRequests.filter((r) => r.status === "ACCEPTED" && !loadForRequest(r.id));

  const matches = (values) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return values.filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
  };

  const visibleRates = useMemo(
    () =>
      rateRequests.filter(
        (r) =>
          (rateFilter === "ALL" || r.status === rateFilter) &&
          matches([r.origin, r.destination, r.freight_details?.commodity, r.status])
      ),
    [rateRequests, rateFilter, query]
  );

  const visibleLoads = useMemo(() => {
    const pool =
      loadFilter === "active" ? activeLoads : loadFilter === "delivered" ? deliveredLoads : loads;
    return pool.filter((l) =>
      matches([l.load_number, l.origin, l.destination, l.commodity, l.customer_reference, l.status])
    );
  }, [loads, loadFilter, query]);

  if (!portalUser) return null;

  const actionCount = quotedRates.length + awaitingTender.length;

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
            <NotificationBell />
            <div className="hidden items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 sm:flex">
              <Building2 className="h-4 w-4 flex-none text-slate-400" />
              <div className="leading-tight">
                <p className="max-w-[16rem] truncate text-sm font-semibold text-white">
                  {portalUser.company_name || portalUser.username}
                </p>
                <p className="text-[11px] text-slate-400">Signed in as {portalUser.username}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------ Page bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Shipment Overview</h1>
            <p className="mt-1 text-sm text-slate-500">
              Quotes, tenders and live freight status for {portalUser.company_name || "your account"}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-slate-400 sm:inline">
              {lastSynced ? `Updated ${fmtTime(lastSynced)}` : "Syncing…"}
            </span>
            <button
              onClick={refresh}
              disabled={isRefreshing}
              title="Refresh"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => navigate("/portal/rate-request")}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
              New Rate Request
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6">
        {/* ------------------------------------------------- Track a shipment */}
        <form
          onSubmit={handleTrack}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Truck className="h-4 w-4 flex-none text-sky-600" />
              Track a shipment
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Jump straight to any of your shipments.</p>
          </div>
          <div className="relative w-full flex-1 sm:w-auto sm:min-w-[16rem]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={trackQuery}
              onChange={(e) => setTrackQuery(e.target.value)}
              placeholder="Load #, tracking # or your reference"
              aria-label="Load #, tracking # or your reference"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <button
            type="submit"
            disabled={isTracking || !trackQuery.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {isTracking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Track
          </button>
        </form>

        {/* -------------------------------------------------- Action required */}
        {actionCount > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
            <AlertCircle className="h-5 w-5 flex-none text-amber-600" />
            <p className="flex-1 text-sm text-amber-900">
              <span className="font-semibold">
                {actionCount} item{actionCount > 1 ? "s need" : " needs"} your attention:
              </span>{" "}
              {quotedRates.length > 0 &&
                `${quotedRates.length} quote${quotedRates.length > 1 ? "s" : ""} ready to review`}
              {quotedRates.length > 0 && awaitingTender.length > 0 && " · "}
              {awaitingTender.length > 0 &&
                `${awaitingTender.length} accepted quote${awaitingTender.length > 1 ? "s" : ""
                } awaiting a load tender`}
              .
            </p>
            <button
              onClick={() => {
                setActiveTab("rates");
                setRateFilter(quotedRates.length > 0 ? "QUOTED" : "ACCEPTED");
              }}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
            >
              Review now
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------ Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Awaiting Quote"
            value={pendingRates.length}
            hint="With our dispatch team"
            icon={Clock}
            tone="bg-sky-50 text-sky-600"
          />
          <StatCard
            label="Ready to Accept"
            value={quotedRates.length}
            hint="Priced and waiting on you"
            icon={FileText}
            tone="bg-amber-50 text-amber-600"
            highlight={quotedRates.length > 0}
          />
          <StatCard
            label="Active Shipments"
            value={activeLoads.length}
            hint="Booked, moving or at dock"
            icon={Truck}
            tone="bg-indigo-50 text-indigo-600"
          />
          <StatCard
            label="Delivered"
            value={deliveredLoads.length}
            hint="Completed with us"
            icon={PackageCheck}
            tone="bg-emerald-50 text-emerald-600"
          />
        </div>

        {/* ------------------------------------------------- Tabs and filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
          <div className="flex gap-1">
            {[
              { key: "rates", label: "Rate Requests", count: rateRequests.length },
              { key: "loads", label: "Shipments", count: activeLoads.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors sm:px-4 ${activeTab === tab.key
                  ? "border-sky-600 text-sky-700"
                  : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
              >
                {tab.label}
                <span
                  className={`ml-2 rounded-full px-1.5 py-0.5 text-xs tabular-nums ${activeTab === tab.key ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600"
                    }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex w-full items-center gap-2 pb-2 sm:w-auto">
            <div className="relative flex-1 sm:w-64 sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={activeTab === "rates" ? "Search lanes…" : "Search load # or lane…"}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>
            {activeTab === "rates" ? (
              <select
                value={rateFilter}
                onChange={(e) => setRateFilter(e.target.value)}
                aria-label="Filter rate requests by status"
                className="rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Awaiting quote</option>
                <option value="QUOTED">Quoted</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Declined</option>
              </select>
            ) : (
              <select
                value={loadFilter}
                onChange={(e) => setLoadFilter(e.target.value)}
                aria-label="Filter shipments"
                className="rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
              >
                <option value="active">Active</option>
                <option value="delivered">Delivered</option>
                <option value="all">All shipments</option>
              </select>
            )}
          </div>
        </div>

        {/* ---------------------------------------------------- Rate requests */}
        {activeTab === "rates" &&
          (rateRequests.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No rate requests yet"
              body="Tell us the lane and the freight, and our dispatch team will price it for you."
              action={
                <button
                  onClick={() => navigate("/portal/rate-request")}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  <Plus className="h-4 w-4" />
                  Request a rate
                </button>
              }
            />
          ) : visibleRates.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No matching rate requests"
              body="Try a different search term or status filter."
            />
          ) : (
            <div className="space-y-3">
              {visibleRates.map((r) => {
                const fd = r.freight_details || {};
                const dims =
                  fd.dims && (fd.dims.length_in || fd.dims.width_in || fd.dims.height_in)
                    ? `${fd.dims.length_in || "?"}×${fd.dims.width_in || "?"}×${fd.dims.height_in || "?"} in`
                    : null;
                const linkedLoad = loadForRequest(r.id);
                const busy = respondingId === r.id;
                const uploading = isUploadingTender && uploadingFor === r.id;

                return (
                  <article
                    key={r.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5">
                      <div className="min-w-0">
                        <Lane
                          origin={humanize(r.origin)}
                          destination={humanize(r.destination)}
                          className="text-base"
                        />

                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          <Chip icon={PackageCheck}>{fd.commodity ? humanize(fd.commodity) : null}</Chip>
                          <Chip icon={Truck}>
                            {fd.skids ? `${fd.skids} skid${fd.skids > 1 ? "s" : ""}` : null}
                          </Chip>
                          <Chip>{fmtWeight(fd.weight_lbs)}</Chip>
                          <Chip>{dims}</Chip>
                          <Chip>{fd.equipment ? EQUIPMENT_LABELS[fd.equipment] || humanize(fd.equipment) : null}</Chip>
                          <Chip>
                            {fd.service_level && fd.service_level !== "standard"
                              ? SERVICE_LABELS[fd.service_level] || humanize(fd.service_level)
                              : null}
                          </Chip>
                          <Chip icon={Thermometer}>{fmtTemperature(fd.temperature)}</Chip>
                          <Chip>
                            {fd.stops?.length ? `${fd.stops.length} extra stop${fd.stops.length > 1 ? "s" : ""}` : null}
                          </Chip>
                          <Chip>
                            {fd.accessorials?.length
                              ? `${fd.accessorials.length} accessorial${fd.accessorials.length > 1 ? "s" : ""}`
                              : null}
                          </Chip>
                          {fd.hazmat?.is_hazmat && (
                            <Pill className="bg-rose-50 text-rose-700 ring-1 ring-rose-600/25">
                              <AlertCircle className="h-3 w-3" />
                              Hazmat{fd.hazmat.un_number ? ` ${fd.hazmat.un_number}` : ""}
                            </Pill>
                          )}
                          {fd.reference && (
                            <Chip icon={FileText}>Ref {fd.reference}</Chip>
                          )}
                        </div>
                        {fd.notes && <p className="mt-2.5 text-sm italic text-slate-500">“{fd.notes}”</p>}
                        <p className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-400">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Requested {fmtDate(r.created_at)}
                          {r.quoted_at ? ` · Quoted ${fmtDate(r.quoted_at)}` : ""}
                        </p>
                      </div>
                      <Pill className={rateTone(r.status)}>
                        {r.status === "PENDING" ? "Awaiting Quote" : humanize(r.status)}
                      </Pill>
                    </div>

                    {r.status === "PENDING" && (
                      <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-sm text-slate-500 sm:px-5">
                        Our dispatch team is pricing this lane — the quote appears here as soon as it's ready.
                      </div>
                    )}

                    {r.status === "QUOTED" && (
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-amber-100 bg-amber-50/70 px-4 py-3.5 sm:px-5">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
                            Quoted rate
                          </p>
                          <p className="text-2xl font-bold tabular-nums text-slate-900">
                            {fmtMoney(r.quoted_price, r.quote_currency || "USD")}
                            <span className="ml-1.5 text-sm font-semibold text-slate-500">
                              {r.quote_currency || "USD"}
                            </span>
                          </p>
                          {r.quote_notes && <p className="mt-0.5 text-xs text-amber-900">{r.quote_notes}</p>}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleQuoteAction(r.id, "REJECT")}
                            disabled={busy}
                            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleQuoteAction(r.id, "ACCEPT")}
                            disabled={busy}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                          >
                            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                            Accept quote
                          </button>
                        </div>
                      </div>
                    )}

                    {r.status === "ACCEPTED" && !linkedLoad && (
                      <div className="border-t border-slate-100 bg-sky-50/60 px-4 py-3.5 sm:px-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              Next step: upload your load tender
                            </p>
                            <p className="text-xs text-slate-500">
                              PDF only — we read it automatically and open the shipment for you.
                            </p>
                          </div>
                          <label
                            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${uploading
                              ? "cursor-wait bg-slate-100 text-slate-400"
                              : "bg-sky-600 text-white hover:bg-sky-700"
                              }`}
                          >
                            {uploading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Reading your tender…
                              </>
                            ) : (
                              <>
                                <FileUp className="h-4 w-4" />
                                Upload Tender (PDF)
                              </>
                            )}
                            <input
                              type="file"
                              accept=".pdf"
                              className="hidden"
                              disabled={isUploadingTender}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                e.target.value = "";
                                if (file) handleTenderUpload(file, r.id);
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {r.status === "ACCEPTED" && linkedLoad && (
                      <button
                        onClick={() => navigate(`/portal/loads/${linkedLoad.id}`)}
                        className="flex w-full items-center justify-between gap-3 border-t border-slate-100 bg-emerald-50/60 px-4 py-3 text-left transition-colors hover:bg-emerald-50 sm:px-5"
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                          <CheckCircle2 className="h-4 w-4" />
                          Booked as Load #{linkedLoad.load_number}
                        </span>
                        <ChevronRight className="h-4 w-4 text-emerald-700" />
                      </button>
                    )}

                    {(r.status === "REJECTED" || r.status === "DECLINED") && (
                      <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500 sm:px-5">
                        Quote declined{r.responded_at ? ` on ${fmtDate(r.responded_at)}` : ""}. Need a fresh
                        price?{" "}
                        <button
                          onClick={() => navigate("/portal/rate-request")}
                          className="font-semibold text-sky-700 hover:underline"
                        >
                          Submit a new request
                        </button>
                        .
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ))}

        {/* -------------------------------------------------------- Shipments */}
        {activeTab === "loads" &&
          (isLoading && loads.length === 0 ? (
            <SkeletonList />
          ) : visibleLoads.length === 0 ? (
            <EmptyState
              icon={Truck}
              title={loadFilter === "delivered" ? "No delivered shipments yet" : "No shipments here"}
              body={
                loadFilter === "delivered"
                  ? "Completed freight is archived here with its paperwork."
                  : "Accept a quote and upload the tender — the shipment appears here automatically."
              }
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <th className="px-5 py-3">Load</th>
                        <th className="px-5 py-3">Lane</th>
                        <th className="px-5 py-3">Pickup</th>
                        <th className="px-5 py-3">Delivery</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">ETA</th>
                        <th className="px-5 py-3 text-right">Docs</th>
                        <th className="w-10 px-2 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleLoads.map((load) => (
                        <tr
                          key={load.id}
                          onClick={() => navigate(`/portal/loads/${load.id}`)}
                          className="cursor-pointer transition-colors hover:bg-sky-50/40"
                        >
                          <td className="whitespace-nowrap px-5 py-4 align-top">
                            <p className="font-semibold text-slate-900">#{load.load_number}</p>
                            {load.customer_reference && (
                              <p className="mt-0.5 text-xs text-slate-500">Ref {load.customer_reference}</p>
                            )}
                          </td>
                          <td className="min-w-[260px] px-5 py-4 align-top">
                            {/* <Lane origin={load.origin} destination={load.destination} className="text-sm" /> */}
                            <span className="font-semibold text-slate-900">{load.shipper_district},{load.shipper_state},{load.shipper_country}</span> &rarr; <span className="font-semibold text-slate-900">{load.consignee_district},{load.consignee_state},{load.consignee_country}</span>
                            {load.commodity && <p className="mt-1 text-xs text-slate-500">{load.commodity}</p>}
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {load.is_cross_border && (
                                <Pill className="bg-amber-50 text-amber-800 ring-1 ring-amber-600/25">
                                  <ShieldCheck className="h-3 w-3" />
                                  Cross-border
                                </Pill>
                              )}
                              {load.lead_number && (
                                <Pill className="bg-slate-100 text-slate-600 ring-1 ring-slate-500/20">
                                  {load.lead_number_type || "PAPS"} {load.lead_number}
                                </Pill>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 align-top text-sm text-slate-600">
                            {fmtDate(load.pickup_date)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 align-top text-sm text-slate-600">
                            {fmtDate(load.delivery_date)}
                          </td>
                          <td className="w-52 px-5 py-4 align-top">
                            <Pill className={statusTone(load.status)}>{humanize(load.status)}</Pill>
                            {load.lifecycle_rank ? (
                              <div className="mt-2">
                                <LifecycleBadge rank={load.lifecycle_rank} label={load.lifecycle_label} />
                              </div>
                            ) : null}
                          </td>
                          <td className="px-5 py-4 align-top">
                            <EtaBadge eta={load.eta} />
                          </td>
                          <td className="px-5 py-4 text-right align-top text-sm tabular-nums text-slate-600">
                            <span className="inline-flex items-center justify-end gap-2">
                              {unreadByLoad[load.id] > 0 && (
                                <span
                                  title={`${unreadByLoad[load.id]} unread message${unreadByLoad[load.id] > 1 ? "s" : ""
                                    } from dispatch`}
                                  className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-700"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                  {unreadByLoad[load.id]}
                                </span>
                              )}
                              {Number(load.document_count || 0)}
                            </span>
                          </td>
                          <td className="px-2 py-4 align-top text-slate-400">
                            <ChevronRight className="h-4 w-4" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {visibleLoads.map((load) => (
                  <button
                    key={load.id}
                    onClick={() => navigate(`/portal/loads/${load.id}`)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">Load #{load.load_number}</p>
                        <div className="mt-1 text-sm">
                          <Lane origin={load.origin} destination={load.destination} />
                        </div>
                      </div>
                      <Pill className={statusTone(load.status)}>{humanize(load.status)}</Pill>
                    </div>

                    {load.lifecycle_rank ? (
                      <div className="mt-3">
                        <LifecycleBadge rank={load.lifecycle_rank} label={load.lifecycle_label} />
                      </div>
                    ) : null}

                    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-[11px] uppercase tracking-wide text-slate-400">Pickup</dt>
                        <dd className="font-medium text-slate-700">
                          {fmtDate(load.pickup_date, { month: "short", day: "numeric" })}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] uppercase tracking-wide text-slate-400">Delivery</dt>
                        <dd className="font-medium text-slate-700">
                          {fmtDate(load.delivery_date, { month: "short", day: "numeric" })}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <EtaBadge eta={load.eta} compact />
                      {unreadByLoad[load.id] > 0 && (
                        <Pill className="bg-sky-100 text-sky-700 ring-1 ring-sky-600/20">
                          <MessageSquare className="h-3 w-3" />
                          {unreadByLoad[load.id]} new
                        </Pill>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Chip icon={PackageCheck}>{load.commodity}</Chip>
                      <Chip>{fmtWeight(load.weight)}</Chip>
                      {load.is_cross_border && (
                        <Pill className="bg-amber-50 text-amber-800 ring-1 ring-amber-600/25">
                          <ShieldCheck className="h-3 w-3" />
                          Cross-border
                        </Pill>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          ))}
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

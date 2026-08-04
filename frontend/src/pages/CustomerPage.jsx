import { useState, useEffect, useMemo, useCallback } from "react";
import { useShipmentStore } from "../stores/useShipmentStore";
import {
  Search,
  MapPin,
  Truck,
  Package,
  Clock,
  Check,
  CheckCircle2,
  Circle,
  ChevronRight,
  User,
  Weight,
  Layers,
  Calendar,
  Hash,
  FileText,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  XCircle,
} from "lucide-react";

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_ORDER = ["pending", "assigned", "dispatched", "in_transit", "delivered"];

const STATUS_META = {
  pending:    { label: "Order Staged",     color: "text-slate-500",  bg: "bg-slate-100",   ring: "ring-slate-300",  dot: "bg-slate-400"   },
  assigned:   { label: "Driver Assigned",  color: "text-indigo-600", bg: "bg-indigo-50",   ring: "ring-indigo-300", dot: "bg-indigo-500"  },
  dispatched: { label: "Dispatched",       color: "text-blue-600",   bg: "bg-blue-50",     ring: "ring-blue-300",   dot: "bg-blue-500"    },
  in_transit: { label: "In Transit",       color: "text-amber-700",  bg: "bg-amber-50",    ring: "ring-amber-300",  dot: "bg-amber-500"   },
  delivered:  { label: "Delivered",        color: "text-green-700",  bg: "bg-green-50",    ring: "ring-green-400",  dot: "bg-green-500"   },
};

function normalizeStatus(raw) {
  if (!raw) return "pending";
  const s = raw.toLowerCase();
  if (s === "delivered") return "delivered";
  if (s === "in_transit" || s === "in transit") return "in_transit";
  if (s === "dispatched") return "dispatched";
  if (s === "assigned" || s === "picked_up") return "assigned";
  return "pending";
}

// ─── ETA formatter ─────────────────────────────────────────────────────────────

function formatETA(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d)) return null;
  const now = new Date();
  const diffMs = d - now;
  if (diffMs < 0) return { label: "Past ETA", sub: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), overdue: true };
  const diffH = Math.floor(diffMs / 3600000);
  const diffM = Math.round((diffMs % 3600000) / 60000);
  const timeStr = d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
  const relStr = diffH > 48
    ? `${Math.floor(diffH / 24)} days away`
    : diffH > 0
    ? `${diffH}h ${diffM}m remaining`
    : `${diffM}m remaining`;
  return { label: timeStr, sub: relStr, overdue: false };
}

// ─── Stepper ───────────────────────────────────────────────────────────────────

function StatusStepper({ status }) {
  const currentIdx = STATUS_ORDER.indexOf(status);
  return (
    <div className="relative">
      {/* Progress line */}
      <div className="hidden md:block absolute top-5 left-[10%] right-[10%] h-0.5 bg-slate-100 z-0">
        <div
          className="h-full bg-blue-500 transition-all duration-700"
          style={{ width: `${(Math.max(0, currentIdx) / (STATUS_ORDER.length - 1)) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-5 gap-1 relative z-10">
        {STATUS_ORDER.map((key, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          const meta = STATUS_META[key];
          return (
            <div key={key} className="flex flex-col items-center text-center gap-2">
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center bg-white transition-all
                  ${done  ? "border-green-500 bg-green-50  text-green-600" : ""}
                  ${active ? "border-blue-600 bg-blue-50 text-blue-600 ring-4 ring-blue-100" : ""}
                  ${!done && !active ? "border-slate-200 text-slate-300" : ""}
                `}
              >
                {done   ? <Check className="h-4 w-4" strokeWidth={3} /> :
                 active ? <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" /> :
                          <span className="text-xs font-mono text-slate-400">{idx + 1}</span>}
              </div>
              <span className={`text-xs font-medium leading-tight ${!done && !active ? "text-slate-400" : "text-slate-700"}`}>
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Waypoint list ─────────────────────────────────────────────────────────────

function WaypointList({ waypoints }) {
  if (!waypoints || waypoints.length === 0) return null;
  const completed = waypoints.filter((w) => w.status === "completed").length;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 text-sm">Route Stops</h3>
        <span className="text-xs text-slate-400 font-medium">{completed}/{waypoints.length} completed</span>
      </div>
      <div className="space-y-2">
        {waypoints.map((wpt, i) => {
          const done   = wpt.status === "completed";
          const active = wpt.status === "arrived" || wpt.status === "active";
          return (
            <div key={wpt.id || i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
              {/* Step indicator */}
              <div className="shrink-0">
                {done
                  ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                  : active
                  ? <div className="w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /></div>
                  : <Circle className="h-5 w-5 text-slate-300" />
                }
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">{wpt.companyName || "Stop"}</div>
                <div className="text-xs text-slate-400 truncate">{wpt.address}</div>
                {wpt.scheduledTime && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    <Calendar className="inline h-3 w-3 mr-0.5" />
                    {new Date(wpt.scheduledTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}
                  </div>
                )}
              </div>
              {/* Type badge */}
              <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full capitalize
                ${wpt.stopType === "pickup"   ? "bg-blue-100 text-blue-700"   : ""}
                ${wpt.stopType === "delivery" ? "bg-green-100 text-green-700" : ""}
                ${!["pickup","delivery"].includes(wpt.stopType) ? "bg-slate-100 text-slate-600" : ""}
              `}>
                {wpt.stopType}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function CustomerPage() {
  const shipments    = useShipmentStore((state) => state.shipments);
  const isLoading    = useShipmentStore((state) => state.isLoading);
  const fetchShipments = useShipmentStore((state) => state.fetchShipments);

  // Fetch once on mount — no auto-search, no pre-filled query
  useEffect(() => { fetchShipments(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [query, setQuery]               = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [result, setResult]             = useState(null); // "found" | "not_found" | null
  const [shipment, setShipment]         = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search — runs only when the form is submitted
  const runSearch = useCallback((q) => {
    const term = q.trim().toLowerCase();
    if (!term) return;
    setSubmittedQuery(q.trim());

    const found = shipments.find(
      (s) =>
        s.load_number?.toLowerCase()  === term ||
        s.bolNumber?.toLowerCase()    === term ||
        s.poNumber?.toLowerCase()     === term ||
        s.pb_num?.toLowerCase()       === term ||
        // Partial match as fallback
        s.load_number?.toLowerCase().includes(term)
    );

    setShipment(found || null);
    setResult(found ? "found" : "not_found");
  }, [shipments]);

  const handleSubmit = (e) => {
    e.preventDefault();
    runSearch(query);
  };

  // Manual refresh — re-fetch from API then re-run the last search
  const handleRefresh = async () => {
    if (!submittedQuery) return;
    setIsRefreshing(true);
    await fetchShipments();
    setIsRefreshing(false);
    // Re-run search after store update settles
    setTimeout(() => runSearch(submittedQuery), 100);
  };

  // Keep the displayed shipment in sync if the store updates (e.g. after refresh)
  useEffect(() => {
    if (!submittedQuery || result !== "found") return;
    const term = submittedQuery.toLowerCase();
    const fresh = shipments.find(
      (s) =>
        s.load_number?.toLowerCase()  === term ||
        s.bolNumber?.toLowerCase()    === term ||
        s.poNumber?.toLowerCase()     === term ||
        s.pb_num?.toLowerCase()       === term ||
        s.load_number?.toLowerCase().includes(term)
    );
    if (fresh) setShipment(fresh);
  }, [shipments]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived values — all from real shipment data, zero simulation
  const status     = shipment ? normalizeStatus(shipment.status) : null;
  const statusMeta = status ? STATUS_META[status] : null;
  const eta        = shipment ? formatETA(shipment.delivery_date || shipment.eta) : null;

  const detailRows = useMemo(() => {
    if (!shipment) return [];
    return [
      { icon: Hash,      label: "Load #",        value: shipment.load_number || "—" },
      { icon: FileText,  label: "B.O.L.",         value: shipment.bolNumber || shipment.bol_number || "—" },
      { icon: FileText,  label: "P.O. #",         value: shipment.poNumber  || shipment.po_number  || shipment.pb_num || "—" },
      { icon: User,      label: "Driver",         value: shipment.driver_name || shipment.driverName || "—" },
      { icon: Truck,     label: "Truck",          value: shipment.truck_id   || shipment.truckNumber || "—" },
      { icon: Weight,    label: "Weight",         value: shipment.weight ? `${Number(shipment.weight).toLocaleString()} lbs` : "—" },
      { icon: Layers,    label: "Pieces",         value: shipment.pieces ? `${shipment.pieces} plt` : "—" },
      { icon: Package,   label: "Commodity",      value: shipment.commodity || shipment.cargoDescription || "—" },
      { icon: Calendar,  label: "Pickup Date",    value: shipment.pickup_date  ? new Date(shipment.pickup_date).toLocaleDateString("en-US",  { month: "short", day: "numeric", year: "numeric" }) : "—" },
      { icon: Calendar,  label: "Delivery Date",  value: shipment.delivery_date ? new Date(shipment.delivery_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—" },
    ].filter((r) => r.value !== "—");
  }, [shipment]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Search Bar ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-1">Track Your Shipment</h2>
        <p className="text-sm text-slate-400 mb-4">Enter your Load #, B.O.L. number, or P.O. reference to get real-time status.</p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 10042, BOL-10042, PO-10042"
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
              autoComplete="off"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-sm font-semibold transition-colors shrink-0 cursor-pointer"
          >
            <Search className="h-4 w-4" />
            Track
          </button>
        </form>
      </div>

      {/* ── States ── */}

      {/* Idle — nothing searched yet */}
      {result === null && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 flex flex-col items-center justify-center text-center gap-3">
          <div className="p-4 bg-slate-50 rounded-full">
            <Truck className="h-8 w-8 text-slate-300" />
          </div>
          <p className="font-medium text-slate-600">Enter a tracking number to get started</p>
          <p className="text-sm text-slate-400 max-w-sm">
            You can search by Load #, Bill of Lading, or Purchase Order number. Results come directly from our dispatch system.
          </p>
        </div>
      )}

      {/* Loading store */}
      {result === null && isLoading && (
        <div className="flex items-center justify-center py-6 gap-2 text-sm text-slate-400">
          <RefreshCw className="h-4 w-4 animate-spin" /> Loading shipment data...
        </div>
      )}

      {/* Not found */}
      {result === "not_found" && (
        <div className="bg-white rounded-2xl border border-dashed border-red-200 p-12 flex flex-col items-center text-center gap-3">
          <div className="p-3 bg-red-50 rounded-full">
            <XCircle className="h-7 w-7 text-red-400" />
          </div>
          <p className="font-semibold text-slate-800">No shipment found</p>
          <p className="text-sm text-slate-400 max-w-sm">
            No load matches <span className="font-semibold text-slate-600">"{submittedQuery}"</span>.
            Double-check the number and try again, or contact your dispatcher.
          </p>
        </div>
      )}

      {/* Found */}
      {result === "found" && shipment && status && statusMeta && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left / Main col ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Load header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">

              {/* Title row */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-900">
                      Load #{shipment.load_number}
                    </h2>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusMeta.bg} ${statusMeta.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                      {statusMeta.label}
                    </span>
                  </div>

                  {/* Route line */}
                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <span>{shipment.origin || shipment.originCity || shipment.shipper_address || "—"}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{shipment.destination || shipment.destinationCity || shipment.consignee_address || "—"}</span>
                  </div>

                  {/* Customer */}
                  {(shipment.customer_name || shipment.customerName) && (
                    <div className="text-xs text-slate-400">
                      Customer: <span className="text-slate-600 font-medium">{shipment.customer_name || shipment.customerName}</span>
                    </div>
                  )}
                </div>

                {/* ETA box */}
                {eta && (
                  <div className={`rounded-xl px-4 py-3 text-right border ${eta.overdue ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100"}`}>
                    <div className={`flex items-center gap-1.5 mb-1 justify-end text-xs font-medium ${eta.overdue ? "text-red-500" : "text-blue-500"}`}>
                      {eta.overdue
                        ? <AlertCircle className="h-3.5 w-3.5" />
                        : <Clock className="h-3.5 w-3.5" />
                      }
                      {eta.overdue ? "Overdue" : "ETA"}
                    </div>
                    <div className="text-sm font-bold text-slate-900">{eta.label}</div>
                    <div className={`text-xs ${eta.overdue ? "text-red-400" : "text-blue-500"}`}>{eta.sub}</div>
                  </div>
                )}
                {status === "delivered" && (
                  <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-right">
                    <div className="flex items-center gap-1.5 mb-1 justify-end text-xs font-medium text-green-600">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Delivered
                    </div>
                    <div className="text-sm font-bold text-slate-900">POD Confirmed</div>
                    <div className="text-xs text-green-500">Delivery complete</div>
                  </div>
                )}
              </div>

              {/* Stepper */}
              <StatusStepper status={status} />

              {/* Quick stats — driver / truck / weight */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {[
                  { icon: User,   label: "Driver",  value: shipment.driver_name || shipment.driverName || "—" },
                  { icon: Truck,  label: "Truck",   value: shipment.truck_id || shipment.truckNumber || "—" },
                  { icon: Weight, label: "Weight",  value: shipment.weight ? `${Number(shipment.weight).toLocaleString()} lbs` : "—" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                    <div className="p-2 bg-white border border-slate-200 rounded-lg">
                      <Icon className="h-3.5 w-3.5 text-slate-500" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">{label}</div>
                      <div className="text-sm font-semibold text-slate-800 truncate max-w-[110px]">{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Refresh */}
              <div className="flex items-center justify-end pt-1">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Refreshing…" : "Refresh status"}
                </button>
              </div>
            </div>

            {/* Waypoints */}
            <WaypointList waypoints={shipment.waypoints} />

            {/* Shipper / Consignee */}
            {(shipment.shipper_name || shipment.consignee_name) && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-semibold text-slate-900 text-sm mb-4">Parties</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {shipment.shipper_name && (
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Shipper</div>
                      <div className="text-sm font-medium text-slate-800">{shipment.shipper_name}</div>
                      {shipment.shipper_address && <div className="text-xs text-slate-400">{shipment.shipper_address}</div>}
                      {shipment.shipper_phone  && <div className="text-xs text-slate-400">{shipment.shipper_phone}</div>}
                    </div>
                  )}
                  {shipment.consignee_name && (
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Consignee</div>
                      <div className="text-sm font-medium text-slate-800">{shipment.consignee_name}</div>
                      {shipment.consignee_address && <div className="text-xs text-slate-400">{shipment.consignee_address}</div>}
                      {shipment.consignee_phone  && <div className="text-xs text-slate-400">{shipment.consignee_phone}</div>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Right col ── */}
          <div className="space-y-5">

            {/* Full manifest details */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900 text-sm pb-3 border-b border-slate-100 mb-4">Shipment Details</h3>
              <dl className="space-y-3">
                {detailRows.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-2">
                    <dt className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </dt>
                    <dd className="text-xs font-semibold text-slate-800 text-right break-all max-w-[170px]">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Status history — derived from current status level */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900 text-sm pb-3 border-b border-slate-100 mb-4">Status History</h3>
              <div className="space-y-3">
                {STATUS_ORDER.map((key, idx) => {
                  const currentIdx = STATUS_ORDER.indexOf(status);
                  const done   = idx < currentIdx;
                  const active = idx === currentIdx;
                  const meta   = STATUS_META[key];
                  return (
                    <div key={key} className={`flex items-center gap-3 transition-opacity ${!done && !active ? "opacity-35" : ""}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0
                        ${done   ? "bg-green-100 text-green-600" : ""}
                        ${active ? `${meta.bg} ${meta.color}` : ""}
                        ${!done && !active ? "bg-slate-100 text-slate-400" : ""}
                      `}>
                        {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1">
                        <div className={`text-xs font-semibold ${active ? meta.color : done ? "text-slate-700" : "text-slate-400"}`}>
                          {meta.label}
                        </div>
                        {active && (
                          <div className="text-xs text-slate-400 mt-0.5">Current status</div>
                        )}
                      </div>
                      {active && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
                          Now
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contact card */}
            <div className="bg-slate-900 rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-white text-sm">Need Help?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                For urgent questions about this shipment, contact your dispatcher directly.
              </p>
              {shipment.customer_email && (
                <a
                  href={`mailto:${shipment.customer_email}`}
                  className="block text-xs text-blue-400 hover:text-blue-300 transition-colors truncate"
                >
                  {shipment.customer_email}
                </a>
              )}
              {shipment.customer_phone && (
                <a
                  href={`tel:${shipment.customer_phone}`}
                  className="block text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {shipment.customer_phone}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

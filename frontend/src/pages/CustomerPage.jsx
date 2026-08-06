// // import { useState, useEffect, useMemo, useCallback } from "react";
// // import { useShipmentStore } from "../stores/useShipmentStore";
// // import {
// //   Search,
// //   MapPin,
// //   Truck,
// //   Package,
// //   Clock,
// //   Check,
// //   CheckCircle2,
// //   Circle,
// //   ChevronRight,
// //   User,
// //   Weight,
// //   Layers,
// //   Calendar,
// //   Hash,
// //   FileText,
// //   ArrowRight,
// //   RefreshCw,
// //   AlertCircle,
// //   XCircle,
// // } from "lucide-react";

// // // ─── Status helpers ────────────────────────────────────────────────────────────

// // const STATUS_ORDER = ["pending", "assigned", "dispatched", "in_transit", "delivered"];

// // const STATUS_META = {
// //   pending:    { label: "Order Staged",     color: "text-slate-500",  bg: "bg-slate-100",   ring: "ring-slate-300",  dot: "bg-slate-400"   },
// //   assigned:   { label: "Driver Assigned",  color: "text-indigo-600", bg: "bg-indigo-50",   ring: "ring-indigo-300", dot: "bg-indigo-500"  },
// //   dispatched: { label: "Dispatched",       color: "text-blue-600",   bg: "bg-blue-50",     ring: "ring-blue-300",   dot: "bg-blue-500"    },
// //   in_transit: { label: "In Transit",       color: "text-amber-700",  bg: "bg-amber-50",    ring: "ring-amber-300",  dot: "bg-amber-500"   },
// //   delivered:  { label: "Delivered",        color: "text-green-700",  bg: "bg-green-50",    ring: "ring-green-400",  dot: "bg-green-500"   },
// // };

// // function normalizeStatus(raw) {
// //   if (!raw) return "pending";
// //   const s = raw.toLowerCase();
// //   if (s === "delivered") return "delivered";
// //   if (s === "in_transit" || s === "in transit") return "in_transit";
// //   if (s === "dispatched") return "dispatched";
// //   if (s === "assigned" || s === "picked_up") return "assigned";
// //   return "pending";
// // }

// // // ─── ETA formatter ─────────────────────────────────────────────────────────────

// // function formatETA(isoString) {
// //   if (!isoString) return null;
// //   const d = new Date(isoString);
// //   if (isNaN(d)) return null;
// //   const now = new Date();
// //   const diffMs = d - now;
// //   if (diffMs < 0) return { label: "Past ETA", sub: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), overdue: true };
// //   const diffH = Math.floor(diffMs / 3600000);
// //   const diffM = Math.round((diffMs % 3600000) / 60000);
// //   const timeStr = d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
// //   const relStr = diffH > 48
// //     ? `${Math.floor(diffH / 24)} days away`
// //     : diffH > 0
// //     ? `${diffH}h ${diffM}m remaining`
// //     : `${diffM}m remaining`;
// //   return { label: timeStr, sub: relStr, overdue: false };
// // }

// // // ─── Stepper ───────────────────────────────────────────────────────────────────

// // function StatusStepper({ status }) {
// //   const currentIdx = STATUS_ORDER.indexOf(status);
// //   return (
// //     <div className="relative">
// //       {/* Progress line */}
// //       <div className="hidden md:block absolute top-5 left-[10%] right-[10%] h-0.5 bg-slate-100 z-0">
// //         <div
// //           className="h-full bg-blue-500 transition-all duration-700"
// //           style={{ width: `${(Math.max(0, currentIdx) / (STATUS_ORDER.length - 1)) * 100}%` }}
// //         />
// //       </div>

// //       <div className="grid grid-cols-5 gap-1 relative z-10">
// //         {STATUS_ORDER.map((key, idx) => {
// //           const done = idx < currentIdx;
// //           const active = idx === currentIdx;
// //           const meta = STATUS_META[key];
// //           return (
// //             <div key={key} className="flex flex-col items-center text-center gap-2">
// //               <div
// //                 className={`w-10 h-10 rounded-full border-2 flex items-center justify-center bg-white transition-all
// //                   ${done  ? "border-green-500 bg-green-50  text-green-600" : ""}
// //                   ${active ? "border-blue-600 bg-blue-50 text-blue-600 ring-4 ring-blue-100" : ""}
// //                   ${!done && !active ? "border-slate-200 text-slate-300" : ""}
// //                 `}
// //               >
// //                 {done   ? <Check className="h-4 w-4" strokeWidth={3} /> :
// //                  active ? <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" /> :
// //                           <span className="text-xs font-mono text-slate-400">{idx + 1}</span>}
// //               </div>
// //               <span className={`text-xs font-medium leading-tight ${!done && !active ? "text-slate-400" : "text-slate-700"}`}>
// //                 {meta.label}
// //               </span>
// //             </div>
// //           );
// //         })}
// //       </div>
// //     </div>
// //   );
// // }

// // // ─── Waypoint list ─────────────────────────────────────────────────────────────

// // function WaypointList({ waypoints }) {
// //   if (!waypoints || waypoints.length === 0) return null;
// //   const completed = waypoints.filter((w) => w.status === "completed").length;
// //   return (
// //     <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
// //       <div className="flex items-center justify-between">
// //         <h3 className="font-semibold text-slate-900 text-sm">Route Stops</h3>
// //         <span className="text-xs text-slate-400 font-medium">{completed}/{waypoints.length} completed</span>
// //       </div>
// //       <div className="space-y-2">
// //         {waypoints.map((wpt, i) => {
// //           const done   = wpt.status === "completed";
// //           const active = wpt.status === "arrived" || wpt.status === "active";
// //           return (
// //             <div key={wpt.id || i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
// //               {/* Step indicator */}
// //               <div className="shrink-0">
// //                 {done
// //                   ? <CheckCircle2 className="h-5 w-5 text-green-500" />
// //                   : active
// //                   ? <div className="w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /></div>
// //                   : <Circle className="h-5 w-5 text-slate-300" />
// //                 }
// //               </div>
// //               {/* Info */}
// //               <div className="flex-1 min-w-0">
// //                 <div className="text-sm font-medium text-slate-800 truncate">{wpt.companyName || "Stop"}</div>
// //                 <div className="text-xs text-slate-400 truncate">{wpt.address}</div>
// //                 {wpt.scheduledTime && (
// //                   <div className="text-xs text-slate-500 mt-0.5">
// //                     <Calendar className="inline h-3 w-3 mr-0.5" />
// //                     {new Date(wpt.scheduledTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}
// //                   </div>
// //                 )}
// //               </div>
// //               {/* Type badge */}
// //               <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full capitalize
// //                 ${wpt.stopType === "pickup"   ? "bg-blue-100 text-blue-700"   : ""}
// //                 ${wpt.stopType === "delivery" ? "bg-green-100 text-green-700" : ""}
// //                 ${!["pickup","delivery"].includes(wpt.stopType) ? "bg-slate-100 text-slate-600" : ""}
// //               `}>
// //                 {wpt.stopType}
// //               </span>
// //             </div>
// //           );
// //         })}
// //       </div>
// //     </div>
// //   );
// // }

// // // ─── Main page ─────────────────────────────────────────────────────────────────

// // export default function CustomerPage() {
// //   const shipments    = useShipmentStore((state) => state.shipments);
// //   const isLoading    = useShipmentStore((state) => state.isLoading);
// //   const fetchShipments = useShipmentStore((state) => state.fetchShipments);

// //   // Fetch once on mount — no auto-search, no pre-filled query
// //   useEffect(() => { fetchShipments(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

// //   const [query, setQuery]               = useState("");
// //   const [submittedQuery, setSubmittedQuery] = useState("");
// //   const [result, setResult]             = useState(null); // "found" | "not_found" | null
// //   const [shipment, setShipment]         = useState(null);
// //   const [isRefreshing, setIsRefreshing] = useState(false);

// //   // Search — runs only when the form is submitted
// //   const runSearch = useCallback((q) => {
// //     const term = q.trim().toLowerCase();
// //     if (!term) return;
// //     setSubmittedQuery(q.trim());

// //     const found = shipments.find(
// //       (s) =>
// //         s.load_number?.toLowerCase()  === term ||
// //         s.bolNumber?.toLowerCase()    === term ||
// //         s.poNumber?.toLowerCase()     === term ||
// //         s.pb_num?.toLowerCase()       === term ||
// //         // Partial match as fallback
// //         s.load_number?.toLowerCase().includes(term)
// //     );

// //     setShipment(found || null);
// //     setResult(found ? "found" : "not_found");
// //   }, [shipments]);

// //   const handleSubmit = (e) => {
// //     e.preventDefault();
// //     runSearch(query);
// //   };

// //   // Manual refresh — re-fetch from API then re-run the last search
// //   const handleRefresh = async () => {
// //     if (!submittedQuery) return;
// //     setIsRefreshing(true);
// //     await fetchShipments();
// //     setIsRefreshing(false);
// //     // Re-run search after store update settles
// //     setTimeout(() => runSearch(submittedQuery), 100);
// //   };

// //   // Keep the displayed shipment in sync if the store updates (e.g. after refresh)
// //   useEffect(() => {
// //     if (!submittedQuery || result !== "found") return;
// //     const term = submittedQuery.toLowerCase();
// //     const fresh = shipments.find(
// //       (s) =>
// //         s.load_number?.toLowerCase()  === term ||
// //         s.bolNumber?.toLowerCase()    === term ||
// //         s.poNumber?.toLowerCase()     === term ||
// //         s.pb_num?.toLowerCase()       === term ||
// //         s.load_number?.toLowerCase().includes(term)
// //     );
// //     if (fresh) setShipment(fresh);
// //   }, [shipments]); // eslint-disable-line react-hooks/exhaustive-deps

// //   // Derived values — all from real shipment data, zero simulation
// //   const status     = shipment ? normalizeStatus(shipment.status) : null;
// //   const statusMeta = status ? STATUS_META[status] : null;
// //   const eta        = shipment ? formatETA(shipment.delivery_date || shipment.eta) : null;

// //   const detailRows = useMemo(() => {
// //     if (!shipment) return [];
// //     return [
// //       { icon: Hash,      label: "Load #",        value: shipment.load_number || "—" },
// //       { icon: FileText,  label: "B.O.L.",         value: shipment.bolNumber || shipment.bol_number || "—" },
// //       { icon: FileText,  label: "P.O. #",         value: shipment.poNumber  || shipment.po_number  || shipment.pb_num || "—" },
// //       { icon: User,      label: "Driver",         value: shipment.driver_name || shipment.driverName || "—" },
// //       { icon: Truck,     label: "Truck",          value: shipment.truck_id   || shipment.truckNumber || "—" },
// //       { icon: Weight,    label: "Weight",         value: shipment.weight ? `${Number(shipment.weight).toLocaleString()} lbs` : "—" },
// //       { icon: Layers,    label: "Pieces",         value: shipment.pieces ? `${shipment.pieces} plt` : "—" },
// //       { icon: Package,   label: "Commodity",      value: shipment.commodity || shipment.cargoDescription || "—" },
// //       { icon: Calendar,  label: "Pickup Date",    value: shipment.pickup_date  ? new Date(shipment.pickup_date).toLocaleDateString("en-US",  { month: "short", day: "numeric", year: "numeric" }) : "—" },
// //       { icon: Calendar,  label: "Delivery Date",  value: shipment.delivery_date ? new Date(shipment.delivery_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—" },
// //     ].filter((r) => r.value !== "—");
// //   }, [shipment]);

// //   return (
// //     <div className="max-w-5xl mx-auto space-y-6">

// //       {/* ── Search Bar ── */}
// //       <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
// //         <h2 className="text-base font-semibold text-slate-800 mb-1">Track Your Shipment</h2>
// //         <p className="text-sm text-slate-400 mb-4">Enter your Load #, B.O.L. number, or P.O. reference to get real-time status.</p>
// //         <form onSubmit={handleSubmit} className="flex gap-2">
// //           <div className="relative flex-1">
// //             <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
// //             <input
// //               type="text"
// //               value={query}
// //               onChange={(e) => setQuery(e.target.value)}
// //               placeholder="e.g. 10042, BOL-10042, PO-10042"
// //               className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
// //               autoComplete="off"
// //               autoFocus
// //             />
// //           </div>
// //           <button
// //             type="submit"
// //             disabled={!query.trim()}
// //             className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-sm font-semibold transition-colors shrink-0 cursor-pointer"
// //           >
// //             <Search className="h-4 w-4" />
// //             Track
// //           </button>
// //         </form>
// //       </div>

// //       {/* ── States ── */}

// //       {/* Idle — nothing searched yet */}
// //       {result === null && (
// //         <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 flex flex-col items-center justify-center text-center gap-3">
// //           <div className="p-4 bg-slate-50 rounded-full">
// //             <Truck className="h-8 w-8 text-slate-300" />
// //           </div>
// //           <p className="font-medium text-slate-600">Enter a tracking number to get started</p>
// //           <p className="text-sm text-slate-400 max-w-sm">
// //             You can search by Load #, Bill of Lading, or Purchase Order number. Results come directly from our dispatch system.
// //           </p>
// //         </div>
// //       )}

// //       {/* Loading store */}
// //       {result === null && isLoading && (
// //         <div className="flex items-center justify-center py-6 gap-2 text-sm text-slate-400">
// //           <RefreshCw className="h-4 w-4 animate-spin" /> Loading shipment data...
// //         </div>
// //       )}

// //       {/* Not found */}
// //       {result === "not_found" && (
// //         <div className="bg-white rounded-2xl border border-dashed border-red-200 p-12 flex flex-col items-center text-center gap-3">
// //           <div className="p-3 bg-red-50 rounded-full">
// //             <XCircle className="h-7 w-7 text-red-400" />
// //           </div>
// //           <p className="font-semibold text-slate-800">No shipment found</p>
// //           <p className="text-sm text-slate-400 max-w-sm">
// //             No load matches <span className="font-semibold text-slate-600">"{submittedQuery}"</span>.
// //             Double-check the number and try again, or contact your dispatcher.
// //           </p>
// //         </div>
// //       )}

// //       {/* Found */}
// //       {result === "found" && shipment && status && statusMeta && (
// //         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

// //           {/* ── Left / Main col ── */}
// //           <div className="lg:col-span-2 space-y-5">

// //             {/* Load header */}
// //             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">

// //               {/* Title row */}
// //               <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
// //                 <div className="space-y-1">
// //                   <div className="flex items-center gap-2 flex-wrap">
// //                     <h2 className="text-xl font-bold text-slate-900">
// //                       Load #{shipment.load_number}
// //                     </h2>
// //                     <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusMeta.bg} ${statusMeta.color}`}>
// //                       <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
// //                       {statusMeta.label}
// //                     </span>
// //                   </div>

// //                   {/* Route line */}
// //                   <div className="flex items-center gap-1.5 text-sm text-slate-500">
// //                     <span>{shipment.origin || shipment.originCity || shipment.shipper_address || "—"}</span>
// //                     <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
// //                     <span>{shipment.destination || shipment.destinationCity || shipment.consignee_address || "—"}</span>
// //                   </div>

// //                   {/* Customer */}
// //                   {(shipment.customer_name || shipment.customerName) && (
// //                     <div className="text-xs text-slate-400">
// //                       Customer: <span className="text-slate-600 font-medium">{shipment.customer_name || shipment.customerName}</span>
// //                     </div>
// //                   )}
// //                 </div>

// //                 {/* ETA box */}
// //                 {eta && (
// //                   <div className={`rounded-xl px-4 py-3 text-right border ${eta.overdue ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100"}`}>
// //                     <div className={`flex items-center gap-1.5 mb-1 justify-end text-xs font-medium ${eta.overdue ? "text-red-500" : "text-blue-500"}`}>
// //                       {eta.overdue
// //                         ? <AlertCircle className="h-3.5 w-3.5" />
// //                         : <Clock className="h-3.5 w-3.5" />
// //                       }
// //                       {eta.overdue ? "Overdue" : "ETA"}
// //                     </div>
// //                     <div className="text-sm font-bold text-slate-900">{eta.label}</div>
// //                     <div className={`text-xs ${eta.overdue ? "text-red-400" : "text-blue-500"}`}>{eta.sub}</div>
// //                   </div>
// //                 )}
// //                 {status === "delivered" && (
// //                   <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-right">
// //                     <div className="flex items-center gap-1.5 mb-1 justify-end text-xs font-medium text-green-600">
// //                       <CheckCircle2 className="h-3.5 w-3.5" /> Delivered
// //                     </div>
// //                     <div className="text-sm font-bold text-slate-900">POD Confirmed</div>
// //                     <div className="text-xs text-green-500">Delivery complete</div>
// //                   </div>
// //                 )}
// //               </div>

// //               {/* Stepper */}
// //               <StatusStepper status={status} />

// //               {/* Quick stats — driver / truck / weight */}
// //               <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
// //                 {[
// //                   { icon: User,   label: "Driver",  value: shipment.driver_name || shipment.driverName || "—" },
// //                   { icon: Truck,  label: "Truck",   value: shipment.truck_id || shipment.truckNumber || "—" },
// //                   { icon: Weight, label: "Weight",  value: shipment.weight ? `${Number(shipment.weight).toLocaleString()} lbs` : "—" },
// //                 ].map(({ icon: Icon, label, value }) => (
// //                   <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
// //                     <div className="p-2 bg-white border border-slate-200 rounded-lg">
// //                       <Icon className="h-3.5 w-3.5 text-slate-500" />
// //                     </div>
// //                     <div>
// //                       <div className="text-xs text-slate-400">{label}</div>
// //                       <div className="text-sm font-semibold text-slate-800 truncate max-w-[110px]">{value}</div>
// //                     </div>
// //                   </div>
// //                 ))}
// //               </div>

// //               {/* Refresh */}
// //               <div className="flex items-center justify-end pt-1">
// //                 <button
// //                   onClick={handleRefresh}
// //                   disabled={isRefreshing}
// //                   className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer disabled:opacity-50"
// //                 >
// //                   <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
// //                   {isRefreshing ? "Refreshing…" : "Refresh status"}
// //                 </button>
// //               </div>
// //             </div>

// //             {/* Waypoints */}
// //             <WaypointList waypoints={shipment.waypoints} />

// //             {/* Shipper / Consignee */}
// //             {(shipment.shipper_name || shipment.consignee_name) && (
// //               <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
// //                 <h3 className="font-semibold text-slate-900 text-sm mb-4">Parties</h3>
// //                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
// //                   {shipment.shipper_name && (
// //                     <div className="space-y-1">
// //                       <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Shipper</div>
// //                       <div className="text-sm font-medium text-slate-800">{shipment.shipper_name}</div>
// //                       {shipment.shipper_address && <div className="text-xs text-slate-400">{shipment.shipper_address}</div>}
// //                       {shipment.shipper_phone  && <div className="text-xs text-slate-400">{shipment.shipper_phone}</div>}
// //                     </div>
// //                   )}
// //                   {shipment.consignee_name && (
// //                     <div className="space-y-1">
// //                       <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Consignee</div>
// //                       <div className="text-sm font-medium text-slate-800">{shipment.consignee_name}</div>
// //                       {shipment.consignee_address && <div className="text-xs text-slate-400">{shipment.consignee_address}</div>}
// //                       {shipment.consignee_phone  && <div className="text-xs text-slate-400">{shipment.consignee_phone}</div>}
// //                     </div>
// //                   )}
// //                 </div>
// //               </div>
// //             )}
// //           </div>

// //           {/* ── Right col ── */}
// //           <div className="space-y-5">

// //             {/* Full manifest details */}
// //             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
// //               <h3 className="font-semibold text-slate-900 text-sm pb-3 border-b border-slate-100 mb-4">Shipment Details</h3>
// //               <dl className="space-y-3">
// //                 {detailRows.map(({ icon: Icon, label, value }) => (
// //                   <div key={label} className="flex items-start justify-between gap-2">
// //                     <dt className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
// //                       <Icon className="h-3.5 w-3.5" />
// //                       {label}
// //                     </dt>
// //                     <dd className="text-xs font-semibold text-slate-800 text-right break-all max-w-[170px]">{value}</dd>
// //                   </div>
// //                 ))}
// //               </dl>
// //             </div>

// //             {/* Status history — derived from current status level */}
// //             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
// //               <h3 className="font-semibold text-slate-900 text-sm pb-3 border-b border-slate-100 mb-4">Status History</h3>
// //               <div className="space-y-3">
// //                 {STATUS_ORDER.map((key, idx) => {
// //                   const currentIdx = STATUS_ORDER.indexOf(status);
// //                   const done   = idx < currentIdx;
// //                   const active = idx === currentIdx;
// //                   const meta   = STATUS_META[key];
// //                   return (
// //                     <div key={key} className={`flex items-center gap-3 transition-opacity ${!done && !active ? "opacity-35" : ""}`}>
// //                       <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0
// //                         ${done   ? "bg-green-100 text-green-600" : ""}
// //                         ${active ? `${meta.bg} ${meta.color}` : ""}
// //                         ${!done && !active ? "bg-slate-100 text-slate-400" : ""}
// //                       `}>
// //                         {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <ChevronRight className="h-3.5 w-3.5" />}
// //                       </div>
// //                       <div className="flex-1">
// //                         <div className={`text-xs font-semibold ${active ? meta.color : done ? "text-slate-700" : "text-slate-400"}`}>
// //                           {meta.label}
// //                         </div>
// //                         {active && (
// //                           <div className="text-xs text-slate-400 mt-0.5">Current status</div>
// //                         )}
// //                       </div>
// //                       {active && (
// //                         <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
// //                           Now
// //                         </span>
// //                       )}
// //                     </div>
// //                   );
// //                 })}
// //               </div>
// //             </div>

// //             {/* Contact card */}
// //             <div className="bg-slate-900 rounded-2xl p-5 space-y-3">
// //               <h3 className="font-semibold text-white text-sm">Need Help?</h3>
// //               <p className="text-xs text-slate-400 leading-relaxed">
// //                 For urgent questions about this shipment, contact your dispatcher directly.
// //               </p>
// //               {shipment.customer_email && (
// //                 <a
// //                   href={`mailto:${shipment.customer_email}`}
// //                   className="block text-xs text-blue-400 hover:text-blue-300 transition-colors truncate"
// //                 >
// //                   {shipment.customer_email}
// //                 </a>
// //               )}
// //               {shipment.customer_phone && (
// //                 <a
// //                   href={`tel:${shipment.customer_phone}`}
// //                   className="block text-xs text-blue-400 hover:text-blue-300 transition-colors"
// //                 >
// //                   {shipment.customer_phone}
// //                 </a>
// //               )}
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }
// import React, { useState, useEffect } from "react";
// import {
//   Globe,
//   Search,
//   MapPin,
//   Truck,
//   AlertTriangle,
//   Sparkles,
//   Mail,
//   Compass,
//   RefreshCw,
//   Bell,
//   ShieldCheck,
//   Clock,
//   Check,
//   HelpCircle,
//   Activity,
//   ArrowRight,
//   Filter,
//   Eye,
// } from "lucide-react";
// import { useShipmentStore } from "../stores/useShipmentStore";
// export default function CustomerPage() {
//   const shipments = useShipmentStore((state) => state.shipments);
//   console.log(shipments);
//   const [searchQuery, setSearchQuery] = useState("10001");
//   const [searchedShipment, setSearchedShipment] = useState(() => {
//     if (!shipments || shipments.length === 0) return null;
//     return (
//       shipments.find(
//         (s) =>
//           s.trackingNumber === "10001" ||
//           s.tracking_number === "10001" ||
//           s.load_number === "10001"
//       ) || shipments[0]
//     );
//   });

//   useEffect(() => {
//     if (shipments && shipments.length > 0) {
//       if (!searchedShipment) {
//         setSearchedShipment(shipments[0]);
//       } else {
//         const matching = shipments.find(
//           (s) =>
//             s.id === searchedShipment.id ||
//             s.tracking_number === searchedShipment.tracking_number ||
//             s.load_number === searchedShipment.load_number
//         );
//         if (matching) {
//           setSearchedShipment(matching);
//         }
//       }
//     }
//   }, [shipments]);

//   const [customerStatusFilter, setCustomerStatusFilter] = useState("all");
//   const [customerSearch, setCustomerSearch] = useState("");

//   const filteredCustomerShipments = React.useMemo(() => {
//     return (shipments || []).filter((s) => {
//       if (customerStatusFilter !== "all") {
//         const sStatus = String(s.status || "")
//           .toLowerCase()
//           .replace(/\s+/g, "_");
//         const fStatus = String(customerStatusFilter)
//           .toLowerCase()
//           .replace(/\s+/g, "_");
//         if (sStatus !== fStatus) return false;
//       }
//       if (customerSearch.trim()) {
//         const q = customerSearch.trim().toLowerCase();
//         const searchTarget = (
//           (s.load_number || "") +
//           " " +
//           (s.tracking_number || "") +
//           " " +
//           (s.origin || "") +
//           " " +
//           (s.destination || "") +
//           " " +
//           (s.poNumber || "") +
//           " " +
//           (s.bolNumber || "") +
//           " " +
//           (s.customer_name || "")
//         ).toLowerCase();
//         if (!searchTarget.includes(q)) return false;
//       }
//       return true;
//     });
//   }, [shipments, customerStatusFilter, customerSearch]);
//   const [aiLoading, setAiLoading] = useState(false);
//   const [aiError, setAiError] = useState(null);
//   const [aiReport, setAiReport] = useState(null);
//   const [isAutoPolling, setIsAutoPolling] = useState(true);
//   const [secondsLeft, setSecondsLeft] = useState(12);
//   const [simulatedLat, setSimulatedLat] = useState(42.3314);
//   const [simulatedLng, setSimulatedLng] = useState(-83.0458);
//   const [simulatedSpeed, setSimulatedSpeed] = useState(62);
//   const [pollingLogs, setPollingLogs] = useState([]);
//   const [emailSub, setEmailSub] = useState("");
//   const [phoneSub, setPhoneSub] = useState("");
//   const [subSuccess, setSubSuccess] = useState(false);
//   const [subMessage, setSubMessage] = useState("");
//   const [activeFaq, setActiveFaq] = useState(null);
//   const [simulatedRemainingDistance, setSimulatedRemainingDistance] =
//     useState(145);
//   useEffect(() => {
//     if (searchedShipment) {
//       const isDelivered = searchedShipment.status === "delivered";
//       const isArrived = searchedShipment.status === "arrived";
//       let initialDist = 0;
//       if (isDelivered || isArrived) {
//         initialDist = 0;
//       } else if (
//         searchedShipment.status === "pending" ||
//         searchedShipment.status === "dispatched"
//       ) {
//         initialDist = searchedShipment.totalDistanceMiles || 320;
//       } else {
//         initialDist = Math.max(
//           10,
//           Math.round((searchedShipment.totalDistanceMiles || 320) * 0.45)
//         );
//       }
//       setSimulatedRemainingDistance(initialDist);
//       setSimulatedLat(41.8781 + (Math.random() - 0.5) * 0.5);
//       setSimulatedLng(-84.6298 + (Math.random() - 0.5) * 0.5);
//       setSimulatedSpeed(
//         isDelivered || isArrived ? 0 : 58 + Math.floor(Math.random() * 10)
//       );
//       const timestamp = /* @__PURE__ */ new Date().toLocaleTimeString();
//       setPollingLogs([
//         `[${timestamp}] Telemetry stream initiated for Load #${searchedShipment.tracking_number}.`,
//         `[${timestamp}] Route validation: ${searchedShipment.originCity} to ${searchedShipment.destinationCity}.`,
//         `[${timestamp}] Cabin sensor calibration complete. Environment set to cargo-safe.`,
//         `[${timestamp}] Load starting distance: ${initialDist} miles remaining.`,
//       ]);
//       setAiReport(null);
//     }
//   }, [searchedShipment]);
//   const calculateDynamicEta = () => {
//     if (!searchedShipment) return null;
//     const isDelivered = searchedShipment.status === "delivered";
//     const isArrived = searchedShipment.status === "arrived";
//     if (isDelivered) {
//       return {
//         etaString: "Delivered",
//         hours: 0,
//         minutes: 0,
//         milesLeft: 0,
//         speedMph: 0,
//         durationText: "Fully Delivered",
//         message: "Load has arrived and cargo has been fully delivered.",
//       };
//     }
//     if (isArrived) {
//       return {
//         etaString: "Arrived at Receiver",
//         hours: 0,
//         minutes: 0,
//         milesLeft: 0,
//         speedMph: 0,
//         durationText: "Arrived at Dock",
//         message: "Vehicle has arrived at the receiving facility dock.",
//       };
//     }
//     const currentSpeed = simulatedSpeed || searchedShipment.speedMph || 60;
//     const remainingMiles =
//       simulatedRemainingDistance > 0 ? simulatedRemainingDistance : 1;
//     const totalHours = remainingMiles / currentSpeed;
//     const hours = Math.floor(totalHours);
//     const minutes = Math.round((totalHours - hours) * 60);
//     const etaDate = /* @__PURE__ */ new Date();
//     etaDate.setMinutes(etaDate.getMinutes() + Math.round(totalHours * 60));
//     const timeFormatter = new Intl.DateTimeFormat("en-US", {
//       month: "short",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//       hour12: true,
//     });
//     const formattedEta = timeFormatter.format(etaDate);
//     let durationText = "";
//     if (hours > 0) {
//       durationText += `${hours}h `;
//     }
//     durationText += `${minutes}m remaining`;
//     return {
//       etaString: formattedEta,
//       hours,
//       minutes,
//       durationText,
//       milesLeft: remainingMiles,
//       speedMph: currentSpeed,
//       message: `En route: ${remainingMiles} miles remaining at ${currentSpeed} MPH`,
//     };
//   };
//   const handleTrackSubmit = (e) => {
//     e.preventDefault();
//     if (!searchQuery.trim()) return;
//     const found = shipments.find(
//       (s) =>
//         s.trackingNumber.trim().toLowerCase() ===
//           searchQuery.trim().toLowerCase() ||
//         (s.poNumber &&
//           s.poNumber.trim().toLowerCase() ===
//             searchQuery.trim().toLowerCase()) ||
//         (s.bolNumber &&
//           s.bolNumber.trim().toLowerCase() === searchQuery.trim().toLowerCase())
//     );
//     setSearchedShipment(found || null);
//     setAiReport(null);
//   };
//   useEffect(() => {
//     if (!isAutoPolling || !searchedShipment) return;
//     const interval = setInterval(() => {
//       setSecondsLeft((prev) => {
//         if (prev <= 1) {
//           const timestamp = /* @__PURE__ */ new Date().toLocaleTimeString();
//           const isDelivered = searchedShipment.status === "delivered";
//           const isArrived = searchedShipment.status === "arrived";
//           if (!isDelivered && !isArrived) {
//             setSimulatedLat((lat) => lat + (Math.random() - 0.4) * 2e-3);
//             setSimulatedLng((lng) => lng + (Math.random() - 0.6) * 2e-3);
//             setSimulatedSpeed((speed) =>
//               Math.max(
//                 50,
//                 Math.min(70, speed + Math.round((Math.random() - 0.5) * 4))
//               )
//             );
//             setSimulatedRemainingDistance((dist) =>
//               Math.max(
//                 1,
//                 +Math.max(0, dist - 0.2 - Math.random() * 0.3).toFixed(1)
//               )
//             );
//           } else {
//             setSimulatedSpeed(0);
//             setSimulatedRemainingDistance(0);
//           }
//           const logTemplates = [
//             `[${timestamp}] ELD Heartbeat: Ping received from truck unit ${
//               searchedShipment.truckNumber || "TRK-102"
//             }.`,
//             `[${timestamp}] GPS telemetry verified: Lat ${simulatedLat.toFixed(
//               5
//             )}, Lng ${simulatedLng.toFixed(5)}.`,
//             `[${timestamp}] Carrier temperature sensors confirm payload environment is secure (36.4\xB0F).`,
//             `[${timestamp}] Border Connect Link: Customs clearance manifest verified (${searchedShipment?.borderConnectStatus?.toUpperCase()}).`,
//             `[${timestamp}] Samsara Diagnostics: Engine coolant safe, speed set at ${simulatedSpeed} MPH.`,
//             `[${timestamp}] Transit Update: GPS tracking shows route progression.`,
//           ];
//           const randomLog =
//             logTemplates[Math.floor(Math.random() * logTemplates.length)];
//           setPollingLogs((prev2) => [randomLog, ...prev2.slice(0, 6)]);
//           return 12;
//         }
//         return prev - 1;
//       });
//     }, 1e3);
//     return () => clearInterval(interval);
//   }, [
//     isAutoPolling,
//     searchedShipment,
//     simulatedLat,
//     simulatedLng,
//     simulatedSpeed,
//   ]);
//   const handleAlertSubscribe = (e) => {
//     e.preventDefault();
//     if (!emailSub && !phoneSub) {
//       alert(
//         "Please provide either an email or mobile phone number to register for automated pings."
//       );
//       return;
//     }
//     setSubSuccess(true);
//     setSubMessage(
//       `Successfully registered! Milestones for Load #${
//         searchedShipment?.tracking_number
//       } will automatically push to ${emailSub || phoneSub}.`
//     );
//     setTimeout(() => {
//       setSubSuccess(false);
//       setEmailSub("");
//       setPhoneSub("");
//     }, 6e3);
//   };
//   const handleGenerateAiReport = async () => {
//     if (!searchedShipment) return;
//     setAiLoading(true);
//     setAiError(null);
//     setAiReport(null);
//     try {
//       const response = await fetch("/api/gemini/customer-update", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           trackingNumber: searchedShipment.trackingNumber,
//           customerName: searchedShipment.customerName,
//           origin: searchedShipment.originCity,
//           destination: searchedShipment.destinationCity,
//           currentStatus: searchedShipment.status,
//           speedMph: simulatedSpeed,
//           eta: searchedShipment.eta,
//           borderStatus: searchedShipment.borderConnectStatus,
//           cargoDescription: searchedShipment.cargoDescription,
//         }),
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(
//           errorData.details || errorData.error || "Connection failed."
//         );
//       }
//       const data = await response.json();
//       setAiReport(data);
//     } catch (err) {
//       setAiError(
//         err.message ||
//           "Verification failed. Please check your system settings or GEMINI_API_KEY environment variable."
//       );
//     } finally {
//       setAiLoading(false);
//     }
//   };
//   const isOutboundShipment = (shipment) => {
//     const isCrossBorderStatus =
//       shipment.borderConnectStatus && shipment.borderConnectStatus !== "none";
//     const hasBorderCrossingWaypoint =
//       shipment.waypoints &&
//       shipment.waypoints.some((w) => w.stopType === "border_crossing");
//     return !!(isCrossBorderStatus || hasBorderCrossingWaypoint);
//   };
//   const formatStatusText = (status) => {
//     if (!status) return "Entered";
//     const s = String(status).toLowerCase().replace(/\s+/g, "_");
//     switch (s) {
//       case "entered":
//         return "Entered (Customer Created)";
//       case "assigned_for_pickup":
//       case "driver_assigned_for_pickup":
//         return "Driver Assigned for Pickup";
//       case "picked_up":
//         return "Picked Up (BOL Approved)";
//       case "at_warehouse":
//         return "At Origin Hub / Warehouse";
//       case "trip_assigned":
//         return "Trip Assigned (Consolidated)";
//       case "in_transit":
//         return "In Transit (En Route Linehaul)";
//       case "at_destination_wh":
//         return "At Destination Hub";
//       case "out_for_delivery":
//         return "Out for Final Delivery";
//       case "delivered":
//         return "Delivered (POD Signed)";
//       case "pending":
//         return "Pending";
//       case "dispatched":
//         return "Dispatched";
//       case "delayed":
//         return "Delayed";
//       case "arrived":
//         return "Arrived at Destination";
//       default:
//         return String(status).replace(/_/g, " ");
//     }
//   };

//   const getTrackingSteps = (shipment) => {
//     const rawStatus = String(shipment.status || "")
//       .toLowerCase()
//       .replace(/\s+/g, "_");

//     // Status rank order:
//     // 1. entered / pending
//     // 2. assigned_for_pickup / driver_assigned_for_pickup / dispatched
//     // 3. picked_up
//     // 4. at_warehouse
//     // 5. trip_assigned
//     // 6. in_transit
//     // 7. at_destination_wh / arrived
//     // 8. out_for_delivery
//     // 9. delivered

//     const statusRanks = {
//       entered: 1,
//       pending: 1,
//       assigned_for_pickup: 2,
//       driver_assigned_for_pickup: 2,
//       dispatched: 2,
//       picked_up: 3,
//       at_warehouse: 4,
//       trip_assigned: 5,
//       in_transit: 6,
//       at_destination_wh: 7,
//       arrived: 7,
//       out_for_delivery: 8,
//       delivered: 9,
//     };

//     const currentRank = statusRanks[rawStatus] || 1;

//     const getStepState = (targetRank) => {
//       if (currentRank > targetRank) return "completed";
//       if (currentRank === targetRank) return "active";
//       return "pending";
//     };

//     return [
//       {
//         title: "1. Entered",
//         description: currentRank >= 1 ? "Created in portal" : "Awaiting order",
//         key: "entered",
//         status: getStepState(1),
//       },
//       {
//         title: "2. Pickup Assigned",
//         description: currentRank >= 2 ? "Driver assigned" : "Awaiting driver",
//         key: "assigned",
//         status: getStepState(2),
//       },
//       {
//         title: "3. Picked Up",
//         description: currentRank >= 3 ? "BOL approved" : "Awaiting pickup",
//         key: "picked_up",
//         status: getStepState(3),
//       },
//       {
//         title: "4. Origin Hub",
//         description:
//           currentRank >= 4 ? "Stored at warehouse" : "En route to hub",
//         key: "at_wh",
//         status: getStepState(4),
//       },
//       {
//         title: "5. Trip Assigned",
//         description:
//           currentRank >= 5 ? "Consolidated trip" : "Awaiting grouping",
//         key: "trip_assigned",
//         status: getStepState(5),
//       },
//       {
//         title: "6. In Transit",
//         description:
//           currentRank >= 6 ? "Highway linehaul" : "Awaiting linehaul",
//         key: "in_transit",
//         status: getStepState(6),
//       },
//       {
//         title: "7. Dest. Hub",
//         description:
//           currentRank >= 7 ? "At destination hub" : "Awaiting dest hub",
//         key: "at_dest_hub",
//         status: getStepState(7),
//       },
//       {
//         title: "8. Out for Delivery",
//         description:
//           currentRank >= 8 ? "Out for delivery" : "Awaiting final leg",
//         key: "out_for_delivery",
//         status: getStepState(8),
//       },
//       {
//         title: "9. Delivered",
//         description:
//           currentRank >= 9 ? "POD signed & complete" : "Awaiting delivery",
//         key: "delivered",
//         status: getStepState(9),
//       },
//     ];
//   };

//   const getBadgeStyles = (status) => {
//     const s = String(status || "")
//       .toLowerCase()
//       .replace(/\s+/g, "_");
//     switch (s) {
//       case "entered":
//       case "pending":
//         return "bg-slate-100 text-slate-800 border-slate-300";
//       case "assigned_for_pickup":
//       case "driver_assigned_for_pickup":
//       case "dispatched":
//         return "bg-indigo-100 text-indigo-800 border-indigo-200";
//       case "picked_up":
//         return "bg-teal-100 text-teal-800 border-teal-200";
//       case "at_warehouse":
//         return "bg-purple-100 text-purple-800 border-purple-200";
//       case "trip_assigned":
//         return "bg-cyan-100 text-cyan-800 border-cyan-200";
//       case "in_transit":
//         return "bg-blue-100 text-blue-800 border-blue-200";
//       case "at_destination_wh":
//       case "arrived":
//         return "bg-amber-100 text-amber-800 border-amber-200";
//       case "out_for_delivery":
//         return "bg-orange-100 text-orange-800 border-orange-200";
//       case "delivered":
//         return "bg-emerald-100 text-emerald-800 border-emerald-200";
//       case "delayed":
//         return "bg-rose-100 text-rose-800 border-rose-200";
//       default:
//         return "bg-slate-100 text-slate-800 border-slate-200";
//     }
//   };
//   const faqData = [
//     {
//       q: "How does this portal track loads in real-time without a password?",
//       a: "For ease of use, we provide password-free public lookup. Your unique 5-digit Load Number (or B.O.L. / purchase order reference) is connected directly to our Samsara ELD transponders and GPS beacons on the assigned truck, maintaining privacy while giving you live telemetry.",
//     },
//     {
//       q: "What is the difference between Local and Outbound (Cross-Border) tracking milestones?",
//       a: "Local deliveries skip customs gates entirely and move directly from picking to delivery. Outbound deliveries route through US-Canada border crossings, displaying 'On Border' and 'Border Crossed' steps linked directly to real-time ACE/ACI customs manifest releases.",
//     },
//     {
//       q: "What should I do if my load shows as 'delayed'?",
//       a: "Delays are caused by sudden winter weather, highway blockages, or mandatory driver hours-of-service rest breaks. Our dispatch updates arrival times instantly. You can compile a live AI advisory update report below for detailed delay resolutions.",
//     },
//   ];
//   return (
//     <div
//       id="customer-tracking-portal"
//       className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
//     >
//       {/* Header Banner */}
//       <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
//         <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
//           <Globe
//             className="h-48 w-48 animate-spin"
//             style={{ animationDuration: "60s" }}
//           />
//         </div>

//         <div className="max-w-3xl space-y-4">
//           <div className="inline-flex items-center space-x-2 bg-indigo-500/20 border border-indigo-500/30 px-3.5 py-1.5 rounded-full">
//             <span className="flex h-2 w-2 relative">
//               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
//               <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
//             </span>
//             <span className="text-3xs font-bold font-mono text-indigo-300 uppercase tracking-widest">
//               Public Cargo Tracking Panel
//             </span>
//           </div>

//           <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
//             Real-Time Automated Load Checker
//           </h1>
//           <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-2xl">
//             Input your unique Load Number, B.O.L., or Purchase Order reference.
//             Our system automatically streams real-time HOS driver feeds and
//             customs progress, skipping border checkpoints for regional domestic
//             freight.
//           </p>

//           {/* Centered lookup input box */}
//           <form onSubmit={handleTrackSubmit} className="pt-3 max-w-md">
//             <div className="flex flex-col sm:flex-row gap-2.5">
//               <div className="relative flex-1">
//                 <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
//                 <input
//                   type="text"
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   placeholder="Enter Load # (e.g., 10001, 10003)"
//                   className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
//                 />
//               </div>
//               <button
//                 type="submit"
//                 className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
//               >
//                 <Compass className="h-4 w-4" />
//                 <span>Track Cargo</span>
//               </button>
//             </div>
//           </form>

//           {/* Quick Click Demo Tracker Links */}
//           <div className="flex flex-wrap items-center gap-2 pt-2 text-2xs text-slate-400">
//             <span className="font-mono uppercase text-indigo-300 tracking-wider font-extrabold mr-1">
//               Demo Quick Links:
//             </span>

//             {/* Find cross border load */}
//             <button
//               type="button"
//               onClick={() => {
//                 setSearchQuery("10001");
//                 const ship =
//                   shipments.find((s) => s.trackingNumber === "10001") ||
//                   shipments[0];
//                 if (ship) setSearchedShipment(ship);
//               }}
//               className="bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/25 px-2.5 py-1 rounded-lg text-white font-bold cursor-pointer transition-all"
//             >
//               Load #10001 (Outbound Cross-Border)
//             </button>

//             {/* Find local load */}
//             <button
//               type="button"
//               onClick={() => {
//                 setSearchQuery("10003");
//                 const ship =
//                   shipments.find((s) => s.trackingNumber === "10003") ||
//                   shipments[2];
//                 if (ship) setSearchedShipment(ship);
//               }}
//               className="bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/25 px-2.5 py-1 rounded-lg text-white font-bold cursor-pointer transition-all"
//             >
//               Load #10003 (Local Regional)
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Main Results Section */}
//       {searchedShipment ? (
//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
//           {/* Left Column - Stepper Progress & Live Telemetry Map (Col-span 8) */}
//           <div className="lg:col-span-8 space-y-6">
//             {/* The Custom Dynamic Milestone Stepper */}
//             <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
//               <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4">
//                 <div>
//                   <div className="flex items-center space-x-2">
//                     <span className="text-lg font-black text-slate-900 font-mono tracking-tight">
//                       Load #{searchedShipment.tracking_number}
//                     </span>
//                     <span
//                       className={`text-3xs font-bold px-2 py-0.5 rounded border uppercase ${getBadgeStyles(
//                         searchedShipment.status
//                       )}`}
//                     >
//                       {formatStatusText(searchedShipment.status)}
//                     </span>
//                     <span
//                       className={`text-3xs font-mono font-bold px-2 py-0.5 rounded border ${
//                         isOutboundShipment(searchedShipment)
//                           ? "bg-purple-50 text-purple-800 border-purple-200"
//                           : "bg-teal-50 text-teal-800 border-teal-200"
//                       }`}
//                     >
//                       {isOutboundShipment(searchedShipment)
//                         ? "Outbound Cross-Border"
//                         : "Local Regional"}
//                     </span>
//                   </div>
//                   <p className="text-3xs text-slate-400 mt-0.5 font-medium">
//                     Shipper:{" "}
//                     <span className="text-slate-700 font-semibold">
//                       {searchedShipment.shipperName ||
//                         searchedShipment.originCity}
//                     </span>{" "}
//                     • Consignee:{" "}
//                     <span className="text-slate-700 font-semibold">
//                       {searchedShipment.consigneeName ||
//                         searchedShipment.destinationCity}
//                     </span>
//                   </p>
//                 </div>

//                 <div className="text-right bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-2xl transition-all shadow-xs">
//                   <div className="flex items-center justify-end space-x-1.5 text-indigo-600 mb-0.5">
//                     <Clock className="h-3.5 w-3.5 animate-pulse" />
//                     <span className="text-[10px] font-extrabold font-mono uppercase tracking-wider text-indigo-700">
//                       Dynamic Telemetry ETA
//                     </span>
//                   </div>
//                   {(() => {
//                     const dynamicEta = calculateDynamicEta();
//                     if (!dynamicEta)
//                       return (
//                         <span className="text-xs font-bold text-slate-800 font-mono">
//                           {new Date(searchedShipment.eta).toLocaleString()}
//                         </span>
//                       );
//                     return (
//                       <>
//                         <span className="text-xs font-black text-slate-900 font-mono block tracking-tight">
//                           {dynamicEta.etaString}
//                         </span>
//                         <span className="text-[10px] font-bold text-indigo-600 block mt-0.5">
//                           {dynamicEta.durationText
//                             ? `${dynamicEta.durationText} (${dynamicEta.milesLeft} mi @ ${dynamicEta.speedMph} MPH)`
//                             : dynamicEta.message}
//                         </span>
//                       </>
//                     );
//                   })()}
//                 </div>
//               </div>

//               {/* Progress Stepper Visualiser */}
//               <div className="relative py-4">
//                 {/* Horizontal stepper line for wider screens */}
//                 <div className="hidden md:block absolute top-[27px] left-[5%] right-[5%] h-1 bg-slate-100 -z-10 rounded-full overflow-hidden">
//                   <div
//                     className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-1000"
//                     style={{
//                       width: `${
//                         getTrackingSteps(searchedShipment).filter(
//                           (s) => s.status === "completed"
//                         ).length === getTrackingSteps(searchedShipment).length
//                           ? 100
//                           : Math.max(
//                               0,
//                               (getTrackingSteps(searchedShipment).filter(
//                                 (s) => s.status === "completed"
//                               ).length /
//                                 (getTrackingSteps(searchedShipment).length -
//                                   1)) *
//                                 100
//                             )
//                       }%`,
//                     }}
//                   />
//                 </div>

//                 {/* Grid layout for steps */}
//                 <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-3 relative">
//                   {getTrackingSteps(searchedShipment).map((step, idx) => {
//                     const isCompleted = step.status === "completed";
//                     const isActive = step.status === "active";
//                     return (
//                       <div
//                         key={idx}
//                         className="flex md:flex-col items-start md:items-center text-left md:text-center space-x-4 md:space-x-0 relative group"
//                       >
//                         {/* Step Circle Indicator */}
//                         <div
//                           className={`flex-shrink-0 h-10 w-10 rounded-full border-2 bg-white flex items-center justify-center transition-all shadow-sm ${
//                             isCompleted
//                               ? "border-emerald-500 text-emerald-500 bg-emerald-50 shadow-emerald-100"
//                               : isActive
//                               ? "border-indigo-600 text-indigo-600 bg-indigo-50 animate-pulse shadow-indigo-100"
//                               : "border-slate-200 text-slate-300 bg-slate-50"
//                           }`}
//                         >
//                           {isCompleted ? (
//                             <Check className="h-5 w-5 stroke-[3]" />
//                           ) : isActive ? (
//                             <div className="h-3 w-3 bg-indigo-600 rounded-full animate-ping" />
//                           ) : (
//                             <span className="text-xs font-mono font-bold">
//                               {idx + 1}
//                             </span>
//                           )}
//                         </div>

//                         {/* Title & Description details */}
//                         <div className="space-y-1 mt-0 md:mt-3 flex-1">
//                           <h4
//                             className={`text-xs font-extrabold tracking-tight ${
//                               isCompleted
//                                 ? "text-slate-800"
//                                 : isActive
//                                 ? "text-indigo-900"
//                                 : "text-slate-400"
//                             }`}
//                           >
//                             {step.title}
//                           </h4>
//                           <p className="text-[10px] text-slate-500 leading-normal font-normal md:max-w-[160px] md:mx-auto">
//                             {step.description}
//                           </p>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>

//               {/* Real-time calculated telemetry summary */}
//               {(() => {
//                 const dynamicEta = calculateDynamicEta();
//                 if (!dynamicEta) return null;
//                 return (
//                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gradient-to-br from-slate-900 to-slate-950 p-4 rounded-2xl text-white border border-slate-850">
//                     <div className="space-y-1">
//                       <span className="text-[9px] text-indigo-300 font-mono font-bold uppercase tracking-widest block">
//                         REMAINING DISTANCE
//                       </span>
//                       <div className="flex items-baseline space-x-1">
//                         <span className="text-lg font-black font-mono text-white">
//                           {dynamicEta.milesLeft}
//                         </span>
//                         <span className="text-[10px] text-slate-400 font-semibold font-mono">
//                           MILES TO GO
//                         </span>
//                       </div>
//                       <p className="text-[10px] text-slate-400 font-medium">
//                         Based on current active route coordinates
//                       </p>
//                     </div>

//                     <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
//                       <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-widest block">
//                         TELEMETRY SPEED
//                       </span>
//                       <div className="flex items-baseline space-x-1">
//                         <span className="text-lg font-black font-mono text-emerald-400">
//                           {dynamicEta.speedMph}
//                         </span>
//                         <span className="text-[10px] text-slate-400 font-semibold font-mono">
//                           MPH INSTANT
//                         </span>
//                       </div>
//                       <p className="text-[10px] text-slate-400 font-medium">
//                         Live feedback from truck transponder
//                       </p>
//                     </div>

//                     <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
//                       <span className="text-[9px] text-indigo-300 font-mono font-bold uppercase tracking-widest block">
//                         SPEED-CALCULATED ETA
//                       </span>
//                       <div className="flex items-baseline space-x-1.5">
//                         <span className="text-[11px] font-black font-mono text-white truncate max-w-[160px]">
//                           {dynamicEta.etaString}
//                         </span>
//                       </div>
//                       <p className="text-[10px] text-indigo-300 font-mono font-bold">
//                         {dynamicEta.durationText || "Ready"}
//                       </p>
//                     </div>
//                   </div>
//                 );
//               })()}

//               {/* Waypoints sequence table summary */}
//               <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3">
//                 <div className="flex items-center justify-between">
//                   <span className="text-3xs font-bold text-slate-400 font-mono uppercase tracking-wider">
//                     Verifiable Chain-Of-Custody Waypoints
//                   </span>
//                   <span className="text-[10px] font-mono font-semibold text-slate-500">
//                     Completed stops:{" "}
//                     <span className="font-bold text-slate-800">
//                       {searchedShipment.waypoints?.filter(
//                         (w) => w.status === "completed"
//                       ).length || 0}
//                     </span>{" "}
//                     / {searchedShipment.waypoints?.length || 0}
//                   </span>
//                 </div>

//                 <div className="space-y-2">
//                   {searchedShipment.waypoints?.map((wpt, idx) => {
//                     const isCompleted = wpt.status === "completed";
//                     const isArrived = wpt.status === "arrived";
//                     return (
//                       <div
//                         key={wpt.id}
//                         className="bg-white border border-slate-100 p-2.5 rounded-xl flex items-center justify-between text-3xs"
//                       >
//                         <div className="flex items-center space-x-3">
//                           <div
//                             className={`p-1.5 rounded-lg ${
//                               isCompleted
//                                 ? "bg-emerald-50 text-emerald-600"
//                                 : isArrived
//                                 ? "bg-amber-50 text-amber-600"
//                                 : "bg-slate-50 text-slate-400"
//                             }`}
//                           >
//                             {wpt.stopType === "pickup" ? (
//                               <MapPin className="h-3.5 w-3.5" />
//                             ) : wpt.stopType === "border_crossing" ? (
//                               <ShieldCheck className="h-3.5 w-3.5" />
//                             ) : (
//                               <Truck className="h-3.5 w-3.5" />
//                             )}
//                           </div>
//                           <div>
//                             <div className="font-bold text-slate-800 flex items-center space-x-1.5">
//                               <span>{wpt.companyName}</span>
//                               <span className="text-[8px] uppercase bg-slate-100 text-slate-500 px-1 rounded-sm font-bold">
//                                 {wpt.stopType}
//                               </span>
//                             </div>
//                             <div className="text-slate-400 font-medium">
//                               {wpt.address}
//                             </div>
//                           </div>
//                         </div>

//                         <div className="text-right">
//                           <span
//                             className={`font-mono font-black uppercase text-[8px] px-1.5 py-0.5 rounded ${
//                               isCompleted
//                                 ? "bg-emerald-100 text-emerald-800"
//                                 : isArrived
//                                 ? "bg-amber-100 text-amber-800"
//                                 : "bg-slate-100 text-slate-500"
//                             }`}
//                           >
//                             {wpt.status}
//                           </span>
//                           {wpt.actualTime && (
//                             <span className="block text-[8px] font-mono text-slate-400 mt-1">
//                               {new Date(wpt.actualTime).toLocaleTimeString()}
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>

//             {/* Live ELD Telemetry Simulation Screen */}
//             <div className="bg-[#111317] border border-slate-800 rounded-3xl p-6 text-white space-y-4 shadow-xl">
//               <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
//                 <div className="flex items-center space-x-3">
//                   <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
//                     <Activity className="h-5 w-5 animate-pulse" />
//                   </div>
//                   <div>
//                     <h3 className="text-sm font-extrabold font-mono uppercase tracking-wider">
//                       Samsara Cab Telemetry Terminal
//                     </h3>
//                     <p className="text-3xs text-slate-400 font-mono">
//                       Live streaming cab diagnostics & speed limit bounds
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex items-center space-x-4">
//                   <div className="text-right">
//                     <span className="text-[9px] font-mono text-slate-400 block uppercase">
//                       Satellite Poller
//                     </span>
//                     <span className="text-xs font-mono font-bold text-emerald-400">
//                       {isAutoPolling ? `PING IN ${secondsLeft}S` : "MUTED"}
//                     </span>
//                   </div>
//                   <button
//                     onClick={() => {
//                       setIsAutoPolling(!isAutoPolling);
//                       if (!isAutoPolling) setSecondsLeft(12);
//                     }}
//                     className={`px-3 py-1.5 rounded-xl text-3xs font-mono font-bold uppercase transition-all cursor-pointer ${
//                       isAutoPolling
//                         ? "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
//                         : "bg-indigo-600 text-white hover:bg-indigo-500"
//                     }`}
//                   >
//                     {isAutoPolling ? "Pause Polling" : "Resume Polling"}
//                   </button>
//                 </div>
//               </div>

//               {/* Grid telemetry parameters */}
//               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
//                 <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
//                   <span className="text-[9px] text-slate-400 font-mono block uppercase">
//                     GPS LATITUDE
//                   </span>
//                   <span className="font-mono font-bold text-xs text-white block mt-1">
//                     {simulatedLat.toFixed(5)}
//                   </span>
//                 </div>
//                 <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
//                   <span className="text-[9px] text-slate-400 font-mono block uppercase">
//                     GPS LONGITUDE
//                   </span>
//                   <span className="font-mono font-bold text-xs text-white block mt-1">
//                     {simulatedLng.toFixed(5)}
//                   </span>
//                 </div>
//                 <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
//                   <span className="text-[9px] text-slate-400 font-mono block uppercase">
//                     SPEED VELOCITY
//                   </span>
//                   <span className="font-mono font-extrabold text-xs text-emerald-400 block mt-1">
//                     {simulatedSpeed > 0
//                       ? `${simulatedSpeed} MPH`
//                       : "0 MPH (STOPPED)"}
//                   </span>
//                 </div>
//                 <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
//                   <span className="text-[9px] text-slate-400 font-mono block uppercase">
//                     HOS DRIVER STATUS
//                   </span>
//                   <span className="font-mono font-bold text-xs text-indigo-300 block mt-1 uppercase">
//                     {searchedShipment.activeHOSStatus?.replace("_", " ") ||
//                       "driving"}
//                   </span>
//                 </div>
//               </div>

//               {/* Scrolling Sync Log list */}
//               <div className="space-y-1.5">
//                 <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest flex items-center space-x-1.5">
//                   <RefreshCw
//                     className={`h-3 w-3 ${isAutoPolling ? "animate-spin" : ""}`}
//                   />
//                   <span>Telemetry Feed Buffer Logs</span>
//                 </div>

//                 <div className="bg-black p-4 rounded-2xl border border-slate-800/80 font-mono text-[10px] text-slate-300 space-y-1.5 h-36 overflow-y-auto">
//                   {pollingLogs.map((log, idx) => (
//                     <div
//                       key={idx}
//                       className={idx === 0 ? "text-emerald-400 font-bold" : ""}
//                     >
//                       {idx === 0 && (
//                         <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 animate-ping" />
//                       )}
//                       {log}
//                     </div>
//                   ))}
//                   {pollingLogs.length === 0 && (
//                     <div className="text-slate-500">
//                       Awaiting starting telemetry heartbeat signal...
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* General FAQs Desk */}
//             <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
//               <div>
//                 <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
//                   <HelpCircle className="h-4.5 w-4.5 text-indigo-500" />
//                   <span>Logistics FAQ Desk</span>
//                 </h3>
//                 <p className="text-3xs text-slate-400">
//                   Essential details regarding border clearance schedules &
//                   tracking latency
//                 </p>
//               </div>

//               <div className="space-y-2.5">
//                 {faqData.map((faq, idx) => {
//                   const isOpen = activeFaq === idx;
//                   return (
//                     <div
//                       key={idx}
//                       className="border border-slate-150 rounded-xl overflow-hidden transition-all"
//                     >
//                       <button
//                         onClick={() => setActiveFaq(isOpen ? null : idx)}
//                         className="w-full flex items-center justify-between p-3.5 text-left bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
//                       >
//                         <span className="text-xs font-bold text-slate-800">
//                           {faq.q}
//                         </span>
//                         <span className="text-xs font-mono font-bold text-indigo-600">
//                           {isOpen ? "\u2212" : "+"}
//                         </span>
//                       </button>
//                       {isOpen && (
//                         <div className="p-3.5 bg-white border-t border-slate-150 text-xs text-slate-600 leading-relaxed">
//                           {faq.a}
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           </div>

//           {/* Right Column - Manifest Summary & Alerts Subscription (Col-span 4) */}
//           <div className="lg:col-span-4 space-y-6">
//             {/* Instant Alerts Subscription form */}
//             <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
//               <div className="flex items-start space-x-3">
//                 <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
//                   <Bell className="h-4 w-4" />
//                 </div>
//                 <div>
//                   <h3 className="text-sm font-bold text-slate-900">
//                     Instant Milestones Alerts
//                   </h3>
//                   <p className="text-3xs text-slate-400 leading-normal">
//                     Subscribe to get instant Email/SMS alerts when milestones
//                     transition.
//                   </p>
//                 </div>
//               </div>

//               {subSuccess && (
//                 <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-3xs text-emerald-800 font-bold leading-normal">
//                   {subMessage}
//                 </div>
//               )}

//               <form onSubmit={handleAlertSubscribe} className="space-y-3">
//                 <div className="space-y-1">
//                   <label className="block text-3xs font-mono font-bold text-slate-400 uppercase">
//                     Corporate Email
//                   </label>
//                   <input
//                     type="email"
//                     value={emailSub}
//                     onChange={(e) => setEmailSub(e.target.value)}
//                     placeholder="e.g., logistics@midwestassembly.com"
//                     className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
//                   />
//                 </div>

//                 <div className="space-y-1">
//                   <label className="block text-3xs font-mono font-bold text-slate-400 uppercase">
//                     Mobile Number (For SMS)
//                   </label>
//                   <input
//                     type="tel"
//                     value={phoneSub}
//                     onChange={(e) => setPhoneSub(e.target.value)}
//                     placeholder="e.g., +1 (555) 491-0391"
//                     className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
//                   />
//                 </div>

//                 <button
//                   type="submit"
//                   className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
//                 >
//                   Save Alerts Subscription
//                 </button>
//               </form>
//             </div>

//             {/* Gemini Dynamic Advisories */}
//             <div className="bg-white rounded-3xl border border-[#D1E0FF] bg-gradient-to-b from-indigo-50/20 to-white shadow-sm p-6 space-y-4">
//               <div className="flex items-start space-x-3">
//                 <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/10">
//                   <Sparkles className="h-4.5 w-4.5" />
//                 </div>
//                 <div>
//                   <h3 className="text-sm font-bold text-slate-900">
//                     On-Demand AI Advisory
//                   </h3>
//                   <p className="text-3xs text-slate-400">
//                     Compile a customer advisory email instantly using
//                     server-side Gemini intelligence.
//                   </p>
//                 </div>
//               </div>

//               <button
//                 onClick={handleGenerateAiReport}
//                 disabled={aiLoading}
//                 className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
//               >
//                 {aiLoading ? (
//                   <>
//                     <span className="animate-spin h-3.5 w-3.5 border-2 border-slate-400 border-t-white rounded-full" />
//                     <span>Compiling Report...</span>
//                   </>
//                 ) : (
//                   <>
//                     <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
//                     <span>Compile AI Advisory</span>
//                   </>
//                 )}
//               </button>

//               {aiError && (
//                 <div className="p-3.5 bg-rose-50 border border-rose-150 rounded-2xl flex items-start space-x-2.5">
//                   <AlertTriangle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
//                   <div>
//                     <div className="text-3xs font-black text-rose-800 uppercase font-mono">
//                       Service Warning
//                     </div>
//                     <p className="text-3xs text-rose-700 mt-0.5 leading-normal">
//                       {aiError}
//                     </p>
//                   </div>
//                 </div>
//               )}

//               {aiReport && (
//                 <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
//                   {/* Generated Email Form */}
//                   <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
//                     <div className="bg-slate-100/75 p-2.5 border-b border-slate-200 text-3xs space-y-1">
//                       <div>
//                         <span className="text-slate-400 font-mono font-bold uppercase">
//                           To:
//                         </span>{" "}
//                         <span className="text-slate-700 font-semibold">
//                           {searchedShipment.customerEmail ||
//                             "logistics@customer.com"}
//                         </span>
//                       </div>
//                       <div>
//                         <span className="text-slate-400 font-mono font-bold uppercase">
//                           Subject:
//                         </span>{" "}
//                         <span className="text-indigo-900 font-bold">
//                           {aiReport.subject}
//                         </span>
//                       </div>
//                     </div>

//                     <div className="p-3 text-[11px] font-sans text-slate-700 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap bg-white select-text">
//                       {aiReport.emailBody}
//                     </div>
//                   </div>

//                   {/* Highlights Bulletins */}
//                   {aiReport.keyHighlights &&
//                     aiReport.keyHighlights.length > 0 && (
//                       <div className="space-y-1.5">
//                         <span className="text-[9px] font-bold text-slate-400 block font-mono uppercase tracking-wider">
//                           Key Cargo Bulletins
//                         </span>
//                         <ul className="text-3xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed font-semibold">
//                           {aiReport.keyHighlights.map((hl, idx) => (
//                             <li key={idx} className="text-slate-700">
//                               {hl}
//                             </li>
//                           ))}
//                         </ul>
//                       </div>
//                     )}

//                   <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-2.5 text-indigo-700 text-3xs leading-relaxed flex items-start space-x-2">
//                     <Mail className="h-3.5 w-3.5 shrink-0 text-indigo-500 mt-0.5" />
//                     <span>
//                       The template above represents live telemetry parsed via
//                       Samsara GPS and Border Connect. Feel free to copy to
//                       clipboard.
//                     </span>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Manifest summary details */}
//             <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
//               <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest">
//                 Active Manifest Details
//               </h3>

//               <div className="grid grid-cols-2 gap-4 text-3xs">
//                 <div>
//                   <span className="text-slate-400 block font-mono">
//                     B.O.L. NUMBER
//                   </span>
//                   <span className="font-bold text-slate-800 font-mono block mt-0.5">
//                     {searchedShipment.bolNumber || "BOL-381029"}
//                   </span>
//                 </div>
//                 <div>
//                   <span className="text-slate-400 block font-mono">
//                     P.O. NUMBER
//                   </span>
//                   <span className="font-bold text-slate-800 font-mono block mt-0.5">
//                     {searchedShipment.poNumber || "PO-294012"}
//                   </span>
//                 </div>
//                 <div>
//                   <span className="text-slate-400 block font-mono">
//                     TOTAL WEIGHT
//                   </span>
//                   <span className="font-bold text-slate-800 font-mono block mt-0.5">
//                     {searchedShipment.weightLbs?.toLocaleString()} lbs
//                   </span>
//                 </div>
//                 <div>
//                   <span className="text-slate-400 block font-mono">
//                     PALLET COUNT
//                   </span>
//                   <span className="font-bold text-slate-800 font-mono block mt-0.5">
//                     {searchedShipment.palletCount} Plts
//                   </span>
//                 </div>
//                 <div>
//                   <span className="text-slate-400 block font-mono">
//                     CARGO CONTENTS
//                   </span>
//                   <span
//                     className="font-bold text-slate-800 block mt-0.5 truncate max-w-[140px]"
//                     title={searchedShipment.cargoDescription}
//                   >
//                     {searchedShipment.cargoDescription}
//                   </span>
//                 </div>
//                 <div>
//                   <span className="text-slate-400 block font-mono">
//                     BORDER MANIFEST
//                   </span>
//                   <span className="font-black text-indigo-600 block mt-0.5 uppercase">
//                     {searchedShipment.borderConnectStatus === "none"
//                       ? "LOCAL (SKIP CHECK)"
//                       : searchedShipment.borderConnectStatus}
//                   </span>
//                 </div>
//                 <div>
//                   <span className="text-slate-400 block font-mono">
//                     DYNAMIC REMAINING DISTANCE
//                   </span>
//                   <span className="font-bold text-slate-800 font-mono block mt-0.5">
//                     {simulatedRemainingDistance} Miles
//                   </span>
//                 </div>
//                 <div>
//                   <span className="text-slate-400 block font-mono">
//                     SPEED-CALCULATED ETA
//                   </span>
//                   <span className="font-bold text-indigo-600 font-mono block mt-0.5">
//                     {(() => {
//                       const dynamicEta = calculateDynamicEta();
//                       return dynamicEta
//                         ? dynamicEta.etaString
//                         : new Date(searchedShipment.eta).toLocaleTimeString();
//                     })()}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       ) : (
//         <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center space-y-3">
//           <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto animate-bounce" />
//           <h3 className="text-sm font-bold text-slate-800">
//             No Tracking Record Found
//           </h3>
//           <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
//             We couldn't locate a manifest under query{" "}
//             <span className="font-mono font-bold text-indigo-600">
//               "{searchQuery}"
//             </span>
//             . Please try using one of the demo load quick links above, or look
//             up tracking IDs from the Dispatcher dashboard.
//           </p>
//         </div>
//       )}

//       {/* Customer Cargo Directory with All 9 Lifecycle Status Filters */}
//       <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 mt-8">
//         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
//           <div>
//             <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
//               <Truck className="h-4.5 w-4.5 text-indigo-600" />
//               <span>All Customer Cargo Loads Directory</span>
//             </h3>
//             <p className="text-3xs text-slate-400 mt-0.5">
//               Filter active customer loads across all 9 operational lifecycle
//               statuses.
//             </p>
//           </div>

//           <div className="flex flex-wrap items-center gap-2">
//             {/* Status Filter Dropdown with all 9 statuses */}
//             <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
//               <Filter className="h-3.5 w-3.5 text-slate-400" />
//               <select
//                 value={customerStatusFilter}
//                 onChange={(e) => setCustomerStatusFilter(e.target.value)}
//                 className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
//               >
//                 <option value="all">All 9 Load Statuses</option>
//                 <option value="entered">1. Entered (Customer Created)</option>
//                 <option value="assigned_for_pickup">
//                   2. Driver Assigned for Pickup
//                 </option>
//                 <option value="picked_up">3. Picked Up (BOL Approved)</option>
//                 <option value="at_warehouse">
//                   4. At Warehouse (Origin Hub)
//                 </option>
//                 <option value="trip_assigned">
//                   5. Trip Assigned (Consolidated)
//                 </option>
//                 <option value="in_transit">6. In Transit (Linehaul)</option>
//                 <option value="at_destination_wh">7. At Destination Hub</option>
//                 <option value="out_for_delivery">
//                   8. Out for Final Delivery
//                 </option>
//                 <option value="delivered">9. Delivered (POD Signed)</option>
//               </select>
//             </div>

//             {/* Keyword Search */}
//             <div className="relative">
//               <Search className="h-3.5 w-3.5 absolute left-2.5 top-2 text-slate-400" />
//               <input
//                 type="text"
//                 value={customerSearch}
//                 onChange={(e) => setCustomerSearch(e.target.value)}
//                 placeholder="Filter load #, origin, destination..."
//                 className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Directory Table */}
//         <div className="border border-slate-150 rounded-2xl overflow-hidden">
//           <table className="w-full text-left border-collapse text-xs">
//             <thead>
//               <tr className="bg-slate-50/80 border-b border-slate-150 text-3xs font-extrabold uppercase font-mono text-slate-500">
//                 <th className="px-4 py-3">Load #</th>
//                 <th className="px-4 py-3">Origin & Destination</th>
//                 <th className="px-4 py-3">Cargo</th>
//                 <th className="px-4 py-3">Status</th>
//                 <th className="px-4 py-3 text-right">Action</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-100 font-medium">
//               {filteredCustomerShipments.length === 0 ? (
//                 <tr>
//                   <td
//                     colSpan={5}
//                     className="px-4 py-8 text-center text-slate-400 text-xs"
//                   >
//                     No loads match status filter "{customerStatusFilter}" or
//                     search term "{customerSearch}".
//                   </td>
//                 </tr>
//               ) : (
//                 filteredCustomerShipments.map((s) => (
//                   <tr
//                     key={s.id}
//                     className="hover:bg-indigo-50/20 transition-colors"
//                   >
//                     <td className="px-4 py-3 font-mono font-bold text-slate-900">
//                       #{s.tracking_number || s.load_number}
//                       {s.poNumber && (
//                         <div className="text-3xs font-sans text-slate-400 font-normal">
//                           PO: {s.poNumber}
//                         </div>
//                       )}
//                     </td>
//                     <td className="px-4 py-3 text-slate-700">
//                       <div className="flex items-center space-x-1.5">
//                         <span>{s.originCity || s.origin}</span>
//                         <ArrowRight className="h-3 w-3 text-indigo-400 shrink-0" />
//                         <span className="font-semibold text-slate-900">
//                           {s.destinationCity || s.destination}
//                         </span>
//                       </div>
//                     </td>
//                     <td className="px-4 py-3 text-slate-600 truncate max-w-[160px]">
//                       {s.cargoDescription ||
//                         `${s.palletCount || 0} Pallets (${
//                           s.weightLbs || 0
//                         } lbs)`}
//                     </td>
//                     <td className="px-4 py-3">
//                       <span
//                         className={`px-2 py-0.5 rounded text-3xs font-extrabold uppercase border ${getBadgeStyles(
//                           s.status
//                         )}`}
//                       >
//                         {formatStatusText(s.status)}
//                       </span>
//                     </td>
//                     <td className="px-4 py-3 text-right">
//                       <button
//                         type="button"
//                         onClick={() => {
//                           setSearchedShipment(s);
//                           setSearchQuery(
//                             s.tracking_number || s.load_number || ""
//                           );
//                           window.scrollTo({ top: 0, behavior: "smooth" });
//                         }}
//                         className="inline-flex items-center space-x-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-3xs rounded-lg transition-colors cursor-pointer"
//                       >
//                         <Eye className="h-3 w-3" />
//                         <span>Track Cargo</span>
//                       </button>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

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
  Filter,
  Eye,
} from "lucide-react";

// ─── 9 Lifecycle Status Definitions & Ranking ─────────────────────────────────

export const NINE_LIFECYCLE_STATUSES = [
  {
    rank: 1,
    key: "entered",
    title: "1. Entered",
    label: "Entered (Customer Created)",
    bg: "bg-slate-100",
    border: "border-slate-200",
    color: "text-slate-700",
    dot: "bg-slate-400",
  },
  {
    rank: 2,
    key: "Driver Assigned For Pickup",
    title: "2. Pickup Assigned",
    label: "Driver Assigned for Pickup",
    bg: "bg-blue-50",
    border: "border-blue-200",
    color: "text-blue-700",
    dot: "bg-blue-500",
  },
  {
    rank: 3,
    key: "picked_up",
    title: "3. Picked Up",
    label: "Picked Up (BOL Approved)",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    color: "text-indigo-700",
    dot: "bg-indigo-500",
  },
  {
    rank: 4,
    key: "At Warehouse",
    title: "4. Origin Hub",
    label: "At Origin Hub / Warehouse",
    bg: "bg-purple-50",
    border: "border-purple-200",
    color: "text-purple-700",
    dot: "bg-purple-500",
  },
  {
    rank: 5,
    key: "trip_assigned",
    title: "5. Trip Assigned",
    label: "Trip Assigned (Consolidated)",
    bg: "bg-violet-50",
    border: "border-violet-200",
    color: "text-violet-700",
    dot: "bg-violet-500",
  },
  {
    rank: 6,
    key: "in_transit",
    title: "6. In Transit",
    label: "In Transit (Linehaul)",
    bg: "bg-amber-50",
    border: "border-amber-200",
    color: "text-amber-800",
    dot: "bg-amber-500",
  },
  {
    rank: 7,
    key: "at_destination_hub  ",
    title: "7. Dest. Hub",
    label: "At Destination Hub",
    bg: "bg-teal-50",
    border: "border-teal-200",
    color: "text-teal-800",
    dot: "bg-teal-500",
  },
  {
    rank: 8,
    key: "out_for_delivery",
    title: "8. Out for Delivery",
    label: "Out for Final Delivery",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    color: "text-cyan-800",
    dot: "bg-cyan-500",
  },
  {
    rank: 9,
    key: "delivered",
    title: "9. Delivered",
    label: "Delivered (POD Signed)",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    color: "text-emerald-800",
    dot: "bg-emerald-500",
  },
];

export function getRankForStatus(rawStatus) {
  if (!rawStatus) return 1;
  const s = String(rawStatus).toLowerCase().replace(/\s+/g, "_");
  if (s === "entered" || s === "pending") return 1;
  if (
    s === "assigned" ||
    s === "assigned_for_pickup" ||
    s === "driver_assigned_for_pickup" ||
    s === "dispatched"
  )
    return 2;
  if (s === "picked_up" || s === "picked up" || s === "bol_approved") return 3;
  if (s === "at_warehouse" || s === "at warehouse" || s === "at_origin_hub")
    return 4;
  if (s === "trip_assigned" || s === "trip assigned" || s === "consolidated")
    return 5;
  if (s === "in_transit" || s === "in transit") return 6;
  if (
    s === "at_destination_wh" ||
    s === "at destination hub" ||
    s === "arrived"
  )
    return 7;
  if (s === "out_for_delivery" || s === "out for delivery") return 8;
  if (s === "delivered") return 9;
  return 1;
}

export function formatNineStatusText(status) {
  const rank = getRankForStatus(status);
  const found = NINE_LIFECYCLE_STATUSES.find((s) => s.rank === rank);
  return found ? found.label : String(status || "").replace(/_/g, " ");
}

export function getNineStatusMeta(status) {
  const rank = getRankForStatus(status);
  return (
    NINE_LIFECYCLE_STATUSES.find((s) => s.rank === rank) ||
    NINE_LIFECYCLE_STATUSES[0]
  );
}

// ─── ETA formatter ─────────────────────────────────────────────────────────────

function formatETA(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d)) return null;
  const now = new Date();
  const diffMs = d - now;
  if (diffMs < 0)
    return {
      label: "Past ETA",
      sub: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      overdue: true,
    };
  const diffH = Math.floor(diffMs / 3600000);
  const diffM = Math.round((diffMs % 3600000) / 60000);
  const timeStr = d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const relStr =
    diffH > 48
      ? `${Math.floor(diffH / 24)} days away`
      : diffH > 0
      ? `${diffH}h ${diffM}m remaining`
      : `${diffM}m remaining`;
  return { label: timeStr, sub: relStr, overdue: false };
}

// ─── 9-Step Stepper Component ──────────────────────────────────────────────────

function NineStepStepper({ rawStatus }) {
  const currentRank = getRankForStatus(rawStatus);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 font-mono uppercase tracking-wider px-1">
        <span>Cargo Progress Lifecycle (9 Stages)</span>
        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
          Stage {currentRank} of 9
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2 relative z-10">
        {NINE_LIFECYCLE_STATUSES.map((step) => {
          const isCompleted = currentRank > step.rank;
          const isActive = currentRank === step.rank;

          return (
            <div
              key={step.key}
              className={`flex flex-col justify-between p-2.5 rounded-xl border transition-all text-left ${
                isActive
                  ? "bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs"
                  : isCompleted
                  ? "bg-emerald-50/60 border-emerald-200"
                  : "bg-slate-50/60 border-slate-200/80 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-3xs font-extrabold font-mono text-slate-500 uppercase tracking-tight">
                  Stage {step.rank}
                </span>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isActive
                      ? "bg-indigo-600 text-white ring-2 ring-indigo-200 animate-pulse"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3" strokeWidth={3} />
                  ) : isActive ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  ) : (
                    <span className="text-3xs font-mono">{step.rank}</span>
                  )}
                </div>
              </div>

              <div>
                <div
                  className={`text-2xs font-extrabold leading-tight ${
                    isActive
                      ? "text-indigo-950 font-bold"
                      : isCompleted
                      ? "text-emerald-900"
                      : "text-slate-500"
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-3xs text-slate-500 mt-0.5 line-clamp-1">
                  {isCompleted
                    ? "Completed"
                    : isActive
                    ? "In Progress"
                    : "Pending"}
                </div>
              </div>
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
        <span className="text-xs text-slate-400 font-medium">
          {completed}/{waypoints.length} completed
        </span>
      </div>
      <div className="space-y-2">
        {waypoints.map((wpt, i) => {
          const done = wpt.status === "completed";
          const active = wpt.status === "arrived" || wpt.status === "active";
          return (
            <div
              key={wpt.id || i}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50"
            >
              <div className="shrink-0">
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : active ? (
                  <div className="w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  </div>
                ) : (
                  <Circle className="h-5 w-5 text-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">
                  {wpt.companyName || "Stop"}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {wpt.address}
                </div>
                {wpt.scheduledTime && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    <Calendar className="inline h-3 w-3 mr-0.5" />
                    {new Date(wpt.scheduledTime).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </div>
                )}
              </div>
              <span
                className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full capitalize
                ${wpt.stopType === "pickup" ? "bg-blue-100 text-blue-700" : ""}
                ${
                  wpt.stopType === "delivery"
                    ? "bg-green-100 text-green-700"
                    : ""
                }
                ${
                  !["pickup", "delivery"].includes(wpt.stopType)
                    ? "bg-slate-100 text-slate-600"
                    : ""
                }
              `}
              >
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
  const shipments = useShipmentStore((state) => state.shipments);
  const isLoading = useShipmentStore((state) => state.isLoading);
  const fetchShipments = useShipmentStore((state) => state.fetchShipments);

  // Fetch once on mount
  useEffect(() => {
    fetchShipments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [result, setResult] = useState(null); // "found" | "not_found" | null
  const [shipment, setShipment] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Directory Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [directorySearch, setDirectorySearch] = useState("");

  const filteredShipments = useMemo(() => {
    return (shipments || []).filter((s) => {
      if (statusFilter !== "all") {
        const sRank = getRankForStatus(s.status);
        const targetRank = parseInt(statusFilter, 10);
        if (!isNaN(targetRank) && sRank !== targetRank) return false;
      }
      if (directorySearch.trim()) {
        const q = directorySearch.trim().toLowerCase();
        const searchTarget = (
          (s.load_number || "") +
          " " +
          (s.tracking_number || "") +
          " " +
          (s.trackingNumber || "") +
          " " +
          (s.origin || "") +
          " " +
          (s.destination || "") +
          " " +
          (s.poNumber || "") +
          " " +
          (s.bolNumber || "") +
          " " +
          (s.customer_name || "")
        ).toLowerCase();
        if (!searchTarget.includes(q)) return false;
      }
      return true;
    });
  }, [shipments, statusFilter, directorySearch]);

  // Search — runs when user submits or selects from directory
  const runSearch = useCallback(
    (q) => {
      const term = q.trim().toLowerCase();
      if (!term) return;
      setSubmittedQuery(q.trim());

      const found = shipments.find(
        (s) =>
          (s.load_number && String(s.load_number).toLowerCase() === term) ||
          (s.tracking_number &&
            String(s.tracking_number).toLowerCase() === term) ||
          (s.trackingNumber &&
            String(s.trackingNumber).toLowerCase() === term) ||
          (s.bolNumber && String(s.bolNumber).toLowerCase() === term) ||
          (s.poNumber && String(s.poNumber).toLowerCase() === term) ||
          (s.pb_num && String(s.pb_num).toLowerCase() === term) ||
          (s.id && String(s.id).toLowerCase() === term) ||
          (s.load_number &&
            String(s.load_number).toLowerCase().includes(term)) ||
          (s.tracking_number &&
            String(s.tracking_number).toLowerCase().includes(term))
      );

      setShipment(found || null);
      setResult(found ? "found" : "not_found");
    },
    [shipments]
  );

  // Default select first shipment if available and not yet searched
  useEffect(() => {
    if (shipments && shipments.length > 0 && result === null) {
      setShipment(shipments[0]);
      setResult("found");
      setSubmittedQuery(
        shipments[0].load_number || shipments[0].tracking_number || "10001"
      );
      setQuery(
        shipments[0].load_number || shipments[0].tracking_number || "10001"
      );
    }
  }, [shipments, result]);

  const handleSubmit = (e) => {
    e.preventDefault();
    runSearch(query);
  };

  const handleRefresh = async () => {
    if (!submittedQuery) return;
    setIsRefreshing(true);
    await fetchShipments();
    setIsRefreshing(false);
    setTimeout(() => runSearch(submittedQuery), 100);
  };

  useEffect(() => {
    if (!submittedQuery || result !== "found") return;
    const term = submittedQuery.toLowerCase();
    const fresh = shipments.find(
      (s) =>
        (s.load_number && String(s.load_number).toLowerCase() === term) ||
        (s.tracking_number &&
          String(s.tracking_number).toLowerCase() === term) ||
        (s.trackingNumber && String(s.trackingNumber).toLowerCase() === term) ||
        (s.bolNumber && String(s.bolNumber).toLowerCase() === term) ||
        (s.poNumber && String(s.poNumber).toLowerCase() === term) ||
        (s.pb_num && String(s.pb_num).toLowerCase() === term)
    );
    if (fresh) setShipment(fresh);
  }, [shipments]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentRank = shipment ? getRankForStatus(shipment.status) : 1;
  const statusMeta = shipment
    ? getNineStatusMeta(shipment.status)
    : NINE_LIFECYCLE_STATUSES[0];
  const eta = shipment
    ? formatETA(shipment.delivery_date || shipment.eta)
    : null;

  const detailRows = useMemo(() => {
    if (!shipment) return [];
    return [
      {
        icon: Hash,
        label: "Load #",
        value: shipment.load_number || shipment.tracking_number || "—",
      },
      {
        icon: FileText,
        label: "B.O.L.",
        value: shipment.bolNumber || shipment.bol_number || "—",
      },
      {
        icon: FileText,
        label: "P.O. #",
        value:
          shipment.poNumber || shipment.po_number || shipment.pb_num || "—",
      },
      {
        icon: User,
        label: "Driver",
        value: shipment.driver_name || shipment.driverName || "—",
      },
      {
        icon: Truck,
        label: "Truck",
        value: shipment.truck_id || shipment.truckNumber || "—",
      },
      {
        icon: Weight,
        label: "Weight",
        value: shipment.weight
          ? `${Number(shipment.weight).toLocaleString()} lbs`
          : "—",
      },
      {
        icon: Layers,
        label: "Pieces",
        value: shipment.pieces ? `${shipment.pieces} plt` : "—",
      },
      {
        icon: Package,
        label: "Commodity",
        value: shipment.commodity || shipment.cargoDescription || "—",
      },
      {
        icon: Calendar,
        label: "Pickup Date",
        value: shipment.pickup_date
          ? new Date(shipment.pickup_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—",
      },
      {
        icon: Calendar,
        label: "Delivery Date",
        value: shipment.delivery_date
          ? new Date(shipment.delivery_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—",
      },
    ].filter((r) => r.value !== "—");
  }, [shipment]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── Search Bar ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-1">
          Track Your Shipment
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Enter your Load #, B.O.L. number, or P.O. reference to get real-time
          status across all 9 lifecycle stages.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 10001, 10042, BOL-10042, PO-10042"
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-sm font-semibold transition-colors shrink-0 cursor-pointer"
          >
            <Search className="h-4 w-4" />
            Track
          </button>
        </form>
      </div>

      {/* ── States ── */}

      {/* Idle / Loading */}
      {result === null && isLoading && (
        <div className="flex items-center justify-center py-12 gap-2 text-sm text-slate-400">
          <RefreshCw className="h-4 w-4 animate-spin" /> Loading cargo shipment
          data...
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
            No load matches{" "}
            <span className="font-semibold text-slate-600">
              "{submittedQuery}"
            </span>
            . Double-check the number and try again, or select from the
            directory below.
          </p>
        </div>
      )}

      {/* Found */}
      {result === "found" && shipment && statusMeta && (
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
                      Load #{shipment.load_number || shipment.tracking_number}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusMeta.bg} ${statusMeta.border} ${statusMeta.color}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`}
                      />
                      {statusMeta.label}
                    </span>
                  </div>

                  {/* Route line */}
                  <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                    <span>
                      {shipment.origin ||
                        shipment.originCity ||
                        shipment.shipper_address ||
                        "—"}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span className="font-bold text-slate-900">
                      {shipment.destination ||
                        shipment.destinationCity ||
                        shipment.consignee_address ||
                        "—"}
                    </span>
                  </div>

                  {/* Customer */}
                  {(shipment.customer_name || shipment.customerName) && (
                    <div className="text-xs text-slate-400">
                      Customer:{" "}
                      <span className="text-slate-700 font-semibold">
                        {shipment.customer_name || shipment.customerName}
                      </span>
                    </div>
                  )}
                </div>

                {/* ETA box */}
                {eta && currentRank < 9 && (
                  <div
                    className={`rounded-xl px-4 py-3 text-right border ${
                      eta.overdue
                        ? "bg-red-50 border-red-100"
                        : "bg-blue-50 border-blue-100"
                    }`}
                  >
                    <div
                      className={`flex items-center gap-1.5 mb-1 justify-end text-xs font-medium ${
                        eta.overdue ? "text-red-500" : "text-blue-500"
                      }`}
                    >
                      {eta.overdue ? (
                        <AlertCircle className="h-3.5 w-3.5" />
                      ) : (
                        <Clock className="h-3.5 w-3.5" />
                      )}
                      {eta.overdue ? "Overdue" : "ETA"}
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {eta.label}
                    </div>
                    <div
                      className={`text-xs ${
                        eta.overdue ? "text-red-400" : "text-blue-500"
                      }`}
                    >
                      {eta.sub}
                    </div>
                  </div>
                )}
                {currentRank === 9 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-right">
                    <div className="flex items-center gap-1.5 mb-1 justify-end text-xs font-extrabold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />{" "}
                      Delivered
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      POD Signed
                    </div>
                    <div className="text-xs text-emerald-600 font-medium">
                      Stage 9 Complete
                    </div>
                  </div>
                )}
              </div>

              {/* 9-Step Stepper */}
              <NineStepStepper rawStatus={shipment.status} />

              {/* Quick stats — driver / truck / weight */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {[
                  {
                    icon: User,
                    label: "Driver",
                    value:
                      shipment.driver_name ||
                      shipment.driverName ||
                      "Unassigned",
                  },
                  {
                    icon: Truck,
                    label: "Truck",
                    value:
                      shipment.truck_id ||
                      shipment.truckNumber ||
                      "TRK-Pending",
                  },
                  {
                    icon: Weight,
                    label: "Weight",
                    value: shipment.weight
                      ? `${Number(shipment.weight).toLocaleString()} lbs`
                      : "—",
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3"
                  >
                    <div className="p-2 bg-white border border-slate-200 rounded-lg">
                      <Icon className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">{label}</div>
                      <div className="text-sm font-semibold text-slate-800 truncate max-w-[110px]">
                        {value}
                      </div>
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
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                  />
                  {isRefreshing ? "Refreshing…" : "Refresh status"}
                </button>
              </div>
            </div>

            {/* Waypoints */}
            <WaypointList waypoints={shipment.waypoints} />

            {/* Shipper / Consignee */}
            {(shipment.shipper_name || shipment.consignee_name) && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-semibold text-slate-900 text-sm mb-4">
                  Parties
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {shipment.shipper_name && (
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        Shipper
                      </div>
                      <div className="text-sm font-medium text-slate-800">
                        {shipment.shipper_name}
                      </div>
                      {shipment.shipper_address && (
                        <div className="text-xs text-slate-400">
                          {shipment.shipper_address}
                        </div>
                      )}
                      {shipment.shipper_phone && (
                        <div className="text-xs text-slate-400">
                          {shipment.shipper_phone}
                        </div>
                      )}
                    </div>
                  )}
                  {shipment.consignee_name && (
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        Consignee
                      </div>
                      <div className="text-sm font-medium text-slate-800">
                        {shipment.consignee_name}
                      </div>
                      {shipment.consignee_address && (
                        <div className="text-xs text-slate-400">
                          {shipment.consignee_address}
                        </div>
                      )}
                      {shipment.consignee_phone && (
                        <div className="text-xs text-slate-400">
                          {shipment.consignee_phone}
                        </div>
                      )}
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
              <h3 className="font-semibold text-slate-900 text-sm pb-3 border-b border-slate-100 mb-4">
                Shipment Details
              </h3>
              <dl className="space-y-3">
                {detailRows.map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-2"
                  >
                    <dt className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </dt>
                    <dd className="text-xs font-semibold text-slate-800 text-right break-all max-w-[170px]">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* 9 Stage History timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900 text-sm pb-3 border-b border-slate-100 mb-4">
                9-Stage Operational Lifecycle History
              </h3>
              <div className="space-y-2.5">
                {NINE_LIFECYCLE_STATUSES.map((step) => {
                  const isCompleted = currentRank > step.rank;
                  const isActive = currentRank === step.rank;

                  return (
                    <div
                      key={step.key}
                      className={`flex items-center gap-3 transition-opacity ${
                        !isCompleted && !isActive ? "opacity-40" : ""
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-mono text-3xs font-bold ${
                          isCompleted
                            ? "bg-emerald-500 text-white"
                            : isActive
                            ? "bg-indigo-600 text-white ring-2 ring-indigo-200 animate-pulse"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-3 w-3" strokeWidth={3} />
                        ) : (
                          step.rank
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-xs ${
                            isActive
                              ? "font-extrabold text-indigo-950"
                              : isCompleted
                              ? "font-semibold text-slate-800"
                              : "font-normal text-slate-400"
                          }`}
                        >
                          {step.label}
                        </div>
                      </div>
                      {isActive && (
                        <span className="text-3xs font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                          Current
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
                For urgent questions about this shipment, contact dispatch
                support directly.
              </p>
              {shipment.customer_email && (
                <a
                  href={`mailto:${shipment.customer_email}`}
                  className="block text-xs text-blue-400 hover:text-blue-300 transition-colors truncate"
                >
                  {shipment.customer_email}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Customer Cargo Directory with All 9 Lifecycle Status Filters ── */}
    </div>
  );
}

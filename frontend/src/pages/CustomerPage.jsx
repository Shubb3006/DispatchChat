import { useState, useEffect, useMemo } from "react";
import { useShipmentStore } from "../stores/useShipmentStore";
import { useMessageStore } from "../stores/useMessageStore";
import { useAuthStore } from "../stores/useAuthStore";
import CustomerDashboard from "../components/CustomerDashboard";
import {
  Search,
  MapPin,
  Truck,
  Package,
  Clock,
  CheckCircle2,
  Globe,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Weight,
  User,
  Download,
  FileText,
} from "lucide-react";

const NINE_LIFECYCLE_STAGES = [
  { rank: 1, key: "entered", name: "1. Entered", desc: "Customer Created" },
  { rank: 2, key: "pickup_assigned", name: "2. Pickup Assigned", desc: "Driver Dispatched" },
  { rank: 3, key: "picked_up", name: "3. Picked Up", desc: "BOL Verified" },
  { rank: 4, key: "origin_hub", name: "4. Origin Hub", desc: "Staged at Bay" },
  { rank: 5, key: "trip_assigned", name: "5. Trip Assigned", desc: "LTL Consolidated" },
  { rank: 6, key: "in_transit", name: "6. In Transit", desc: "Highway En Route" },
  { rank: 7, key: "dest_hub", name: "7. Dest. Hub", desc: "Terminal Inbound" },
  { rank: 8, key: "out_for_delivery", name: "8. Out for Delivery", desc: "Final Mile Dispatch" },
  { rank: 9, key: "delivered", name: "9. Delivered", desc: "POD Signed" },
];

export default function CustomerPage() {
  const shipments = useShipmentStore((state) => state.shipments);
  const fetchShipments = useShipmentStore((state) => state.fetchShipments);
  const messages = useMessageStore((state) => state.messages);
  const fetchMessages = useMessageStore((state) => state.fetchMessages);
  const authUser = useAuthStore((state) => state.authUser);

  // Customer-role users get the scoped portal sections (identity from
  // GET /api/customer/me, their invoices, their document links). The list
  // endpoints are already scoped server-side, so the same store works for
  // admins/dispatchers (all loads) and customers (their loads only).
  const isCustomerRole = String(authUser?.role || "").toLowerCase() === "customer";

  const [searchNumber, setSearchNumber] = useState("");
  const [activeShipment, setActiveShipment] = useState(null);

  useEffect(() => {
    fetchShipments();
    fetchMessages();
  }, [fetchShipments, fetchMessages]);

  // Find shipment by load number
  useEffect(() => {
    if (shipments.length > 0 && searchNumber) {
      const q = (searchNumber || "").trim().toLowerCase();
      const cleanQ = q.replace(/^#/, "").replace(/^load-?/i, "");
      const found = shipments.find((s) => {
        const num = String(s.load_number || s.tracking_number || s.trackingNumber || "").toLowerCase();
        const cleanNum = num.replace(/^#/, "").replace(/^load-?/i, "");
        return cleanNum === cleanQ || num === q || num.includes(q);
      });
      if (found) setActiveShipment(found);
    }
  }, [shipments, searchNumber]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchNumber.trim()) return;
    const q = searchNumber.trim().toLowerCase();
    const cleanQ = q.replace(/^#/, "").replace(/^load-?/i, "");
    const found = shipments.find((s) => {
      const num = String(s.load_number || s.tracking_number || s.trackingNumber || "").toLowerCase();
      const cleanNum = num.replace(/^#/, "").replace(/^load-?/i, "");
      return cleanNum === cleanQ || num === q || num.includes(q);
    });
    if (found) {
      setActiveShipment(found);
    } else {
      alert(`No shipment found matching load #${searchNumber}. Please verify the Load # or Tracking #.`);
    }
  };

  // Compute current lifecycle rank (1 to 9)
  const getRankForStatus = (shipment) => {
    if (!shipment) return 1;
    const st = String(shipment.status || "").toLowerCase().replace(/\s+/g, "_");
    const drvId = shipment.driverId || shipment.driver_id;
    const drvName = shipment.driverName || shipment.driver_name;
    const hasDriver = Boolean(drvId || (drvName && drvName !== "Unassigned"));

    // Check if BOL has been explicitly approved by dispatcher
    const isBolApproved = Boolean(
      shipment.bol_approved ||
      st === "picked_up" ||
      st.includes("picked_up") ||
      st === "at_warehouse" ||
      st === "in_transit" ||
      st === "delivered"
    );

    if (st.includes("delivered") || st.includes("invoiced") || st.includes("completed")) return 9;
    if (st.includes("out_for_delivery") || st.includes("final_mile")) return 8;
    if (st.includes("dest_hub") || st.includes("customs")) return 7;
    if (st.includes("in_transit") || st.includes("shipped") || st.includes("en_route")) return 6;
    if (st.includes("trip_assigned") || st.includes("consolidated")) return 5;
    if (st.includes("origin_hub") || st.includes("at_warehouse") || st.includes("warehouse")) return 4;
    if (isBolApproved) return 3;
    if (st.includes("assigned") || st.includes("dispatched") || st.includes("bol_pending") || hasDriver) return 2;
    return 1;
  };

  const currentRank = activeShipment ? getRankForStatus(activeShipment) : 1;
  const hasDriverAssigned = Boolean(
    activeShipment?.driverId ||
    activeShipment?.driver_id ||
    (activeShipment?.driverName && activeShipment?.driverName !== "Unassigned") ||
    (activeShipment?.driver_name && activeShipment?.driver_name !== "Unassigned")
  );

  const displayDriverName =
    activeShipment?.driverName ||
    activeShipment?.driver_name ||
    (hasDriverAssigned ? "Assigned" : "Unassigned");

  const displayTruckNumber =
    activeShipment?.truckNumber ||
    activeShipment?.truck_number ||
    activeShipment?.truckId ||
    "—";

  // Real ETA only — the load's eta or delivery_date; never a fabricated one.
  const etaValue = activeShipment?.eta || activeShipment?.delivery_date || null;
  const etaDate = etaValue ? new Date(etaValue) : null;
  const etaIsValid = etaDate && !Number.isNaN(etaDate.getTime());
  const etaRemainingMs = etaIsValid ? etaDate.getTime() - Date.now() : null;
  const etaRemainingText =
    etaRemainingMs != null && etaRemainingMs > 0
      ? `${Math.floor(etaRemainingMs / 3600000)}h ${Math.round((etaRemainingMs % 3600000) / 60000)}m remaining`
      : null;

  // Real POD link only.
  const podUrl =
    activeShipment?.pod_url || activeShipment?.podUrl || activeShipment?.image_url || null;

  // Compute 4-Step Stepper Progress
  const stepperProgressPct = currentRank >= 9 ? 100 : currentRank >= 6 ? 66 : currentRank >= 3 ? 33 : currentRank >= 2 ? 15 : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Portal Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 rounded-2xl">
              <Globe className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold font-mono tracking-wide text-white">LogiSync Customer Cargo Portal</h1>
              <p className="text-xs text-slate-400 mt-0.5">Enter your Load # or Tracking # to track real-time cargo status & 9-stage lifecycle.</p>
            </div>
          </div>
          <span className="text-3xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-3 py-1 rounded-full uppercase self-start sm:self-auto">
            ● Live API Connected
          </span>
        </div>

        {/* Load Search Input Form */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <Search className="h-4 w-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Load # (e.g. 10016, 10015)..."
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-800/90 border border-slate-700 text-white rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold font-mono rounded-2xl transition-all cursor-pointer shadow-md flex items-center justify-center space-x-2"
          >
            <span>Track Cargo Status</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Quick Sample Buttons */}
        {/* <div className="flex items-center space-x-2 text-3xs font-mono text-slate-400 pt-1">
          <span>Sample Tracking #s:</span>
          {shipments.slice(0, 3).map((s) => (
            <button
              key={s.id}
              onClick={() => setSearchNumber(String(s.load_number || s.tracking_number || s.trackingNumber))}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-lg cursor-pointer transition-colors"
            >
              #{s.load_number || s.tracking_number || s.trackingNumber}
            </button>
          ))}
        </div> */}
      </div>

      {/* Cargo Status Modal / Card View */}
      {activeShipment ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-8 space-y-6 animate-fade-in">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-extrabold text-slate-900 font-sans tracking-tight">
                  Load #{activeShipment.load_number || activeShipment.tracking_number || activeShipment.trackingNumber}
                </h2>
                <span className={`text-3xs font-mono font-bold px-3 py-1 rounded-full uppercase border ${currentRank >= 9
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : currentRank >= 6
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : currentRank >= 4
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : currentRank >= 2
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}>
                  ● {currentRank >= 9 ? "Delivered & POD Signed" : currentRank >= 8 ? "Out for Delivery" : currentRank >= 7 ? "Inbound Terminal / Customs" : currentRank >= 6 ? "In Transit En Route" : currentRank >= 5 ? "Trip Assigned" : currentRank >= 4 ? "At Origin Warehouse" : currentRank >= 3 ? "Picked Up (BOL Verified)" : currentRank >= 2 ? "Driver Assigned (Pickup Dispatched)" : "Entered (Customer Created)"}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-600 mt-1 font-medium">
                <span>
                  {activeShipment.origin ||
                    [activeShipment.shipper_district, activeShipment.shipper_state].filter(Boolean).join(", ") ||
                    activeShipment.originCity ||
                    "—"}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-indigo-500" />
                <span>
                  {activeShipment.destination ||
                    [activeShipment.consignee_district, activeShipment.consignee_state].filter(Boolean).join(", ") ||
                    activeShipment.destinationCity ||
                    "—"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Customer: <strong className="text-slate-800">{activeShipment.customer_name || activeShipment.customerName || "—"}</strong>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-start sm:self-auto">
              {/* Proof-of-Delivery link — only when a real document URL exists */}
              {podUrl && podUrl !== "#" && (
                <button
                  type="button"
                  onClick={() => window.open(podUrl, "_blank")}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold rounded-2xl transition-all shadow-md flex items-center space-x-2 cursor-pointer shrink-0"
                >
                  <Download className="h-4 w-4" />
                  <span>View Signed POD</span>
                </button>
              )}

              {/* ETA card — real load ETA / delivery date, honest when absent */}
              <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 text-right space-y-0.5 min-w-[200px]">
                <div className="text-3xs font-mono font-bold text-blue-600 uppercase flex items-center justify-end space-x-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{currentRank >= 9 ? "Delivered" : "Estimated Arrival"}</span>
                </div>
                <div className="text-sm font-extrabold text-slate-900 font-mono">
                  {etaIsValid
                    ? etaDate.toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Not available"}
                </div>
                {currentRank < 9 && etaRemainingText && (
                  <div className="text-3xs text-blue-600 font-mono font-semibold">
                    {etaRemainingText}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4-Step Horizontal Stepper Timeline */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between text-3xs font-mono font-bold text-slate-500 uppercase tracking-wider">
              <span>Primary Stepper Timeline</span>
              <span className="text-indigo-600">Stage {currentRank} of 9 Active</span>
            </div>

            <div className="relative">
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
                  style={{ width: `${stepperProgressPct}%` }}
                />
              </div>

              <div className="grid grid-cols-4 gap-2 pt-3 text-center text-xs">
                {[
                  { label: "1. Order Processed", active: currentRank >= 1 },
                  { label: "2. Order Shipped", active: currentRank >= 3 },
                  { label: "3. Order En Route", active: currentRank >= 6 },
                  { label: "4. Order Arrived", active: currentRank >= 9 },
                ].map((step, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className={`w-3 h-3 rounded-full mx-auto border-2 ${step.active ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300"}`} />
                    <span className={`block text-3xs font-bold font-mono ${step.active ? "text-indigo-900 font-extrabold" : "text-slate-400"}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CARGO PROGRESS LIFECYCLE (9 STAGES) GRID */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                <Layers className="h-4 w-4 text-indigo-600" />
                <span>CARGO PROGRESS LIFECYCLE (9 STAGES)</span>
              </h3>
              <span className="text-3xs font-mono font-bold bg-indigo-100 text-indigo-800 px-3 py-0.5 rounded-full uppercase">
                STAGE {currentRank} OF 9
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {NINE_LIFECYCLE_STAGES.map((stg) => {
                const isExactCurrent = currentRank === stg.rank;
                const isCompleted = currentRank > stg.rank;

                // For Stages 1, 2, and 3, once reached/approved they are verified and completed
                const isVerifiedStage = isCompleted || (stg.rank === 3 && currentRank >= 3) || (stg.rank === 2 && currentRank >= 2) || (stg.rank === 1 && currentRank >= 1);
                const isCurrentActive = isExactCurrent && !isVerifiedStage;

                const getStatusLabel = () => {
                  if (stg.rank === 3 && currentRank >= 3) return "Verified & Picked Up";
                  if (stg.rank === 2 && currentRank >= 2) return "Driver Assigned";
                  if (stg.rank === 1 && currentRank >= 1) return "Order Created";
                  return isExactCurrent ? "In Progress" : isCompleted ? "Completed" : "Pending";
                };

                return (
                  <div
                    key={stg.rank}
                    className={`rounded-2xl border p-4 transition-all relative space-y-2 ${isVerifiedStage
                      ? "bg-emerald-50/50 border-emerald-300 shadow-xs"
                      : isCurrentActive
                        ? "bg-indigo-50/80 border-indigo-400 shadow-md ring-2 ring-indigo-300"
                        : "bg-slate-50/50 border-slate-200 opacity-60"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-3xs font-mono font-bold uppercase ${isVerifiedStage ? "text-emerald-800 font-extrabold" : isCurrentActive ? "text-indigo-700" : "text-slate-400"}`}>
                        STAGE {stg.rank}
                      </span>
                      {isVerifiedStage ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : isCurrentActive ? (
                        <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        </div>
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-3xs font-mono font-bold flex items-center justify-center">
                          {stg.rank}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className={`text-xs font-extrabold ${isVerifiedStage ? "text-emerald-950" : isCurrentActive ? "text-indigo-950" : "text-slate-800"}`}>
                        {stg.name}
                      </h4>
                      <p className={`text-3xs font-mono mt-0.5 ${isVerifiedStage ? "text-emerald-700 font-extrabold" : isCurrentActive ? "text-indigo-700 font-bold" : "text-slate-500"}`}>
                        {getStatusLabel()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Vehicle & Driver Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center space-x-3">
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <div className="text-3xs font-mono font-bold text-slate-400 uppercase">Driver</div>
                <div className="text-xs font-extrabold text-slate-900 font-mono">
                  {displayDriverName}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center space-x-3">
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-indigo-600">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-3xs font-mono font-bold text-slate-400 uppercase">Truck</div>
                <div className="text-xs font-extrabold text-slate-900 font-mono">
                  {displayTruckNumber}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center space-x-3">
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-emerald-600">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <div className="text-3xs font-mono font-bold text-slate-400 uppercase">Weight</div>
                <div className="text-xs font-extrabold text-slate-900 font-mono">
                  {activeShipment.weightLbs || activeShipment.weight
                    ? `${Number(activeShipment.weightLbs || activeShipment.weight).toLocaleString()} lbs`
                    : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Refresh Status Control */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => fetchShipments()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-2"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
              <span>Refresh status</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* Customer-role portal: identity (GET /api/customer/me), scoped
          shipments, invoices and document links — all server-scoped. */}
      {isCustomerRole && (
        <CustomerDashboard onSelectShipment={(load) => setActiveShipment(load)} />
      )}
    </div>
  );
}

import React, { useState } from "react";
import {
  Truck,
  MapPin,
  ArrowRight,
  Gauge,
  Fuel,
  History,
  Eye,
  Share2,
  DollarSign,
  Clock,
  ShieldCheck,
  User,
  GripVertical,
  Layers,
  FileSignature,
  Copy,
  Check,
  Sparkles,
  Thermometer,
  Calendar,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

export default function KanbanCard({
  shipment,
  onOpenHistory,
  onOpenDetails,
  cardDensity = "comfortable", // "comfortable" | "compact"
  isDragging = false,
}) {
  const [copied, setCopied] = useState(false);

  const loadNum = shipment.load_number || shipment.tracking_number || shipment.id || "1000";
  const customer = shipment.customer_name || shipment.customerName || "Commercial Freight Account";
  const cargo = shipment.commodity || shipment.cargoDescription || "Commercial Goods";
  const originCity = shipment.shipper_district || shipment.originCity || "Toronto";
  const originState = shipment.shipper_state || shipment.shipperState || "ON";
  const destCity = shipment.consignee_district || shipment.destinationCity || "Chicago";
  const destState = shipment.consignee_state || shipment.consigneeState || "IL";
  const rate = Number(shipment.rate || shipment.priceInvoice) || 2850;
  const driver = shipment.driver_name || shipment.driverName || "Marcus Vance";
  const truck = shipment.truck_number || shipment.truckNumber || shipment.truck || "TRK-104";
  const trailer = shipment.trailer_number || shipment.trailerNumber || shipment.trailer || "53ft Van";
  const loadType = shipment.loadType || (cargo.toLowerCase().includes("ltl") ? "LTL" : "FTL");
  const priority = shipment.priority || (rate > 3500 ? "Expedited" : "Normal");
  const isReefer = trailer.toLowerCase().includes("reefer") || cargo.toLowerCase().includes("frozen") || cargo.toLowerCase().includes("cold");

  const borderStatus = shipment.borderConnectStatus || (shipment.border_direction ? "Accepted (ACE)" : "none");

  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ loadId: shipment.id, currentStatus: shipment.status }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleCopyLoadNum = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(loadNum));
    setCopied(true);
    toast.success(`Copied Load #${loadNum}`);
    setTimeout(() => setCopied(false), 2000);
  };

  if (cardDensity === "compact") {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onClick={() => onOpenDetails && onOpenDetails(shipment)}
        className={`bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs hover:shadow-md hover:border-sky-400 transition-all cursor-pointer group space-y-1.5 select-none ${
          isDragging ? "opacity-30 scale-95 border-sky-500 border-dashed" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <GripVertical className="w-3 h-3 text-slate-300 group-hover:text-slate-500 shrink-0" />
            <span className="font-mono font-black text-sky-700 text-xs truncate">
              #{loadNum}
            </span>
            <span className="text-[10px] text-slate-500 font-bold truncate">
              {originState} ➔ {destState}
            </span>
          </div>
          <span className="font-mono font-black text-slate-900 text-xs shrink-0">
            ${rate.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
          <span className="truncate font-semibold">{driver}</span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleCopyLoadNum}
              className="p-1 hover:text-slate-900 hover:bg-slate-100 rounded transition"
              title="Copy Load #"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenHistory(shipment);
              }}
              className="p-1 hover:text-sky-700 hover:bg-sky-50 rounded transition"
              title="Audit History"
            >
              <History className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onOpenDetails && onOpenDetails(shipment)}
      className={`bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-lg hover:border-sky-400 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group space-y-3 select-none relative overflow-hidden ${
        isDragging ? "opacity-30 scale-95 border-sky-500 border-dashed" : ""
      }`}
    >
      {/* Top Header Row: Load Number + Mode + Priority + Financial Rate */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-500 transition-colors shrink-0" />
          
          <button
            onClick={handleCopyLoadNum}
            className="flex items-center gap-1 font-mono font-black text-sky-800 hover:text-sky-950 text-xs px-2 py-0.5 rounded-lg bg-sky-50 hover:bg-sky-100/80 border border-sky-200/70 transition cursor-pointer"
            title="Click to copy Load #"
          >
            <span>#{loadNum}</span>
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100" />}
          </button>

          <span
            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase font-mono tracking-wider ${
              loadType === "FTL"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {loadType}
          </span>

          {priority === "Urgent" && (
            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              HOT LOAD
            </span>
          )}
          {priority === "Expedited" && (
            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-200">
              EXPEDITED
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-slate-900 text-white font-mono font-black text-xs px-2.5 py-1 rounded-xl shadow-2xs shrink-0">
          <span>${rate.toLocaleString()}</span>
        </div>
      </div>

      {/* Modern Visual Corridor Track (Origin ➔ Transit Line ➔ Destination) */}
      <div className="bg-gradient-to-r from-slate-50 via-sky-50/40 to-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-xs font-black text-slate-900">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500 ring-4 ring-sky-100" />
            <span>{originCity}, {originState}</span>
          </div>
          <div className="flex items-center gap-1.5 text-right">
            <span>{destCity}, {destState}</span>
            <span className="w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-indigo-100" />
          </div>
        </div>

        {/* Visual Track Line */}
        <div className="relative flex items-center justify-center">
          <div className="w-full h-0.5 bg-slate-200 rounded-full" />
          <div className="absolute px-2 bg-white rounded-full border border-slate-200 text-[10px] font-mono text-slate-500 font-bold flex items-center gap-1 shadow-2xs">
            <Truck className="w-2.5 h-2.5 text-sky-600" />
            <span>{shipment.distance || 515} mi</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-0.5">
          <span className="truncate max-w-[140px] font-semibold text-slate-700">{customer}</span>
          <span className="font-mono text-slate-500 font-semibold">{shipment.weightLbs || shipment.weight || 12000} lbs</span>
        </div>
      </div>

      {/* Driver, Equipment & Telematics Strip */}
      <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-2xs">
              {driver[0]}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-slate-900 text-xs truncate leading-tight">{driver}</div>
            <div className="text-[10px] text-slate-400 font-mono font-medium truncate">{truck} • {trailer}</div>
          </div>
        </div>

        {isReefer && (
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-1 shrink-0">
            <Thermometer className="w-3 h-3 text-cyan-600" />
            <span>-18°C</span>
          </span>
        )}
      </div>

      {/* Live Status Telemetry & Border Clearance Badges */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
        {shipment.status === "in_transit" ? (
          <div className="flex items-center gap-2 font-mono font-bold text-slate-700">
            <span className="flex items-center gap-1 text-slate-900 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
              <Gauge className="w-3.5 h-3.5 text-sky-600" />
              {shipment.speedMph || 62} MPH
            </span>
            <span className="flex items-center gap-1 text-slate-500 font-medium">
              <Fuel className="w-3 h-3 text-slate-400" />
              {shipment.fuelLevelPercent || 84}%
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="capitalize font-semibold text-slate-700">{shipment.status?.replace("_", " ") || "Pending"}</span>
          </div>
        )}

        {borderStatus !== "none" && (
          <span className="px-2 py-0.5 rounded-md text-[9px] font-black font-mono uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shrink-0">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>{borderStatus.includes("ACE") ? "ACE ACCEPTED" : "PARS READY"}</span>
          </span>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <span className="text-[10px] text-slate-400 font-mono font-medium">
          ETA: {new Date(shipment.delivery_date || shipment.eta || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Copy Magic Public Tracking Link"
            onClick={(e) => {
              e.stopPropagation();
              const link = `${window.location.origin}/#/track/${loadNum}`;
              navigator.clipboard.writeText(link);
              toast.success(`📋 Live tracking link copied for #${loadNum}!`);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition cursor-pointer shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            title="View Audit Trail & Change History"
            onClick={(e) => {
              e.stopPropagation();
              onOpenHistory(shipment);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-700 hover:bg-sky-50 border border-transparent hover:border-sky-200 transition cursor-pointer shadow-2xs"
          >
            <History className="w-3.5 h-3.5" />
          </button>

          {onOpenDetails && (
            <button
              type="button"
              title="Inspect Full Load Details"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(shipment);
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-sky-700 hover:bg-sky-50 border border-slate-200/80 hover:border-sky-300 transition cursor-pointer shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

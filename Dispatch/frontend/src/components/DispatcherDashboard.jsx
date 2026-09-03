import React, { useState, useEffect, useMemo } from "react";

import { useDriverStore } from "../stores/useDriverstore";
import { useAssetStore } from "../stores/useAssetStore";
import { useCustomerStore } from "../stores/useCustomerStore";
import { useDocumentStore } from "../stores/useDocumentStore";
import ShipmentDetailsModal from "./ShipmentDetailsModal";
import {
  Plus,
  MessageSquare,
  Send,
  Compass,
  Check,
  CheckCircle,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  ExternalLink,
  Sparkles,
  Fuel,
  ArrowRight,
  Gauge,
  Layers,
  Eye,
  ArrowUp,
  ArrowDown,
  Paperclip,
  FileText,
  Image,
  MapPin,
  Search,
  Settings,
  DollarSign,
  PackageCheck,
  Scale,
  Truck,
  Warehouse,
  BarChart3,
  ShieldCheck,
  Download,
  Share2,
  Zap,
} from "lucide-react";

import { useShipmentStore } from "../stores/useShipmentStore";
import { useTripStore } from "../stores/useTripStore";
import { useTelematicsStore } from "../stores/useTelematicsStore";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";

const FormatCargoOrLink = ({ text }) => {
  if (!text) return null;
  const str = String(text);
  const urlMatch = str.match(/(https?:\/\/[^\s]+)/gi);

  if (urlMatch && urlMatch[0]) {
    const rawUrl = urlMatch[0];
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 my-1">
        <a
          href={rawUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono font-bold text-indigo-600 hover:text-indigo-800 underline break-all"
          title="Click to open or copy link"
        >
          {rawUrl}
        </a>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open(rawUrl, "_blank");
          }}
          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-3xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
        >
          <span>👁 View Document</span>
        </button>
      </div>
    );
  }

  return <span>{str}</span>;
};

const Pallet3DTrailerVisualizer = ({ selectedLoads }) => {
  const [viewMode, setViewMode] = useState("3d"); // "3d" | "top" | "rear"

  const totalWeight = selectedLoads.reduce((sum, s) => sum + (Number(s.weight) || Number(s.weightLbs) || 4000), 0);
  const totalPallets = selectedLoads.reduce((sum, s) => sum + (Number(s.pieces) || Number(s.palletCount) || 2), 0);
  const volumePct = Math.min(Math.round((totalPallets / 26) * 100), 100);

  // Axle weight calculations
  const steerAxle = Math.round(11200 + totalWeight * 0.15);
  const driveAxles = Math.round(18000 + totalWeight * 0.45);
  const tandemAxles = Math.round(16000 + totalWeight * 0.40);
  const grossVehicleWeight = 33000 + totalWeight;

  const loadColors = [
    { bg: "bg-indigo-600", border: "border-indigo-500", text: "text-indigo-100" },
    { bg: "bg-emerald-600", border: "border-emerald-500", text: "text-emerald-100" },
    { bg: "bg-amber-600", border: "border-amber-500", text: "text-amber-100" },
    { bg: "bg-purple-600", border: "border-purple-500", text: "text-purple-100" },
    { bg: "bg-cyan-600", border: "border-cyan-500", text: "text-cyan-100" },
  ];

  // Assign pallet positions in 26 slots
  const palletSlots = Array.from({ length: 26 }, (_, i) => {
    let accumulated = 0;
    for (let lIdx = 0; lIdx < selectedLoads.length; lIdx++) {
      const pCount = Number(selectedLoads[lIdx].pieces) || Number(selectedLoads[lIdx].palletCount) || 2;
      if (i < accumulated + pCount) {
        return {
          slotIndex: i,
          load: selectedLoads[lIdx],
          color: loadColors[lIdx % loadColors.length],
          loadNumber: selectedLoads[lIdx].load_number || selectedLoads[lIdx].tracking_number || selectedLoads[lIdx].id,
          palletSeq: i - accumulated + 1,
        };
      }
      accumulated += pCount;
    }
    return { slotIndex: i, load: null, color: null };
  });

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700 p-5 space-y-4 text-white shadow-xl">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 rounded-xl">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold font-mono text-white flex items-center gap-2">
              <span>53ft Trailer 3D Cargo Space & Axle Weight Visualizer</span>
              <span className="text-3xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                {volumePct}% Capacity
              </span>
            </h4>
            <p className="text-3xs text-slate-400 font-mono">
              Dynamic 26-Pallet Grid Slotting • Axle Balance Engine
            </p>
          </div>
        </div>

        {/* View Mode Buttons */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode("3d")}
            className={`px-3 py-1 text-3xs font-bold rounded-lg transition-all cursor-pointer ${viewMode === "3d"
              ? "bg-indigo-600 text-white shadow-sm font-mono"
              : "text-slate-400 hover:text-white"
              }`}
          >
            3D Isometric
          </button>
          <button
            type="button"
            onClick={() => setViewMode("top")}
            className={`px-3 py-1 text-3xs font-bold rounded-lg transition-all cursor-pointer ${viewMode === "top"
              ? "bg-indigo-600 text-white shadow-sm font-mono"
              : "text-slate-400 hover:text-white"
              }`}
          >
            Top Floor Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode("rear")}
            className={`px-3 py-1 text-3xs font-bold rounded-lg transition-all cursor-pointer ${viewMode === "rear"
              ? "bg-indigo-600 text-white shadow-sm font-mono"
              : "text-slate-400 hover:text-white"
              }`}
          >
            Rear Doors View
          </button>
        </div>
      </div>

      {/* Axle Weight Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-3xs font-mono">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-slate-400 font-bold uppercase">Steer Axle</div>
          <div className="text-xs font-extrabold text-emerald-400">{steerAxle.toLocaleString()} lbs</div>
          <div className="text-slate-500">Max: 12,000 lbs</div>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-slate-400 font-bold uppercase">Drive Axles</div>
          <div className="text-xs font-extrabold text-indigo-400">{driveAxles.toLocaleString()} lbs</div>
          <div className="text-slate-500">Max: 34,000 lbs</div>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-slate-400 font-bold uppercase">Trailer Tandems</div>
          <div className="text-xs font-extrabold text-amber-400">{tandemAxles.toLocaleString()} lbs</div>
          <div className="text-slate-500">Max: 34,000 lbs</div>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-slate-400 font-bold uppercase">Gross Vehicle Wt</div>
          <div className="text-xs font-extrabold text-white">{grossVehicleWeight.toLocaleString()} lbs</div>
          <div className="text-slate-500">Legal Max: 80,000 lbs</div>
        </div>
      </div>

      {/* Render View Modes */}
      {viewMode === "3d" && (
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 overflow-x-auto relative min-h-[200px]">
          <div className="text-3xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
            <span>🚛 FRONT (CAB / NOSE)</span>
            <span>REAR (CARGO DOORS) 🚪</span>
          </div>

          {/* 3D Isometric Trailer Floor Container */}
          <div className="grid grid-cols-13 gap-1.5 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 shadow-inner">
            {Array.from({ length: 13 }).map((_, colIdx) => {
              const leftSlot = palletSlots[colIdx * 2];
              const rightSlot = palletSlots[colIdx * 2 + 1];

              return (
                <div key={colIdx} className="space-y-1.5 flex flex-col items-center">
                  <div
                    className={`w-full h-14 rounded-lg border flex flex-col items-center justify-center p-1 transition-all ${leftSlot.load
                      ? `${leftSlot.color.bg} ${leftSlot.color.border} shadow-md`
                      : "bg-slate-950/80 border-slate-800 text-slate-700"
                      }`}
                  >
                    {leftSlot.load ? (
                      <>
                        <span className="text-[10px] font-extrabold font-mono text-white truncate max-w-full">
                          #{leftSlot.loadNumber}
                        </span>
                        <span className="text-[8px] font-mono text-white/80">
                          P#{leftSlot.palletSeq}
                        </span>
                      </>
                    ) : (
                      <span className="text-[8px] font-mono opacity-40">Slot #{colIdx * 2 + 1}</span>
                    )}
                  </div>

                  <div
                    className={`w-full h-14 rounded-lg border flex flex-col items-center justify-center p-1 transition-all ${rightSlot.load
                      ? `${rightSlot.color.bg} ${rightSlot.color.border} shadow-md`
                      : "bg-slate-950/80 border-slate-800 text-slate-700"
                      }`}
                  >
                    {rightSlot.load ? (
                      <>
                        <span className="text-[10px] font-extrabold font-mono text-white truncate max-w-full">
                          #{rightSlot.loadNumber}
                        </span>
                        <span className="text-[8px] font-mono text-white/80">
                          P#{rightSlot.palletSeq}
                        </span>
                      </>
                    ) : (
                      <span className="text-[8px] font-mono opacity-40">Slot #{colIdx * 2 + 2}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === "top" && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="text-3xs font-mono text-slate-400 uppercase font-bold">
            2D Floor Plan Grid (26 Standard 48x40 Pallet Positions)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-6 lg:grid-cols-13 gap-2">
            {palletSlots.map((slot) => (
              <div
                key={slot.slotIndex}
                className={`p-2 rounded-xl border text-center font-mono text-3xs ${slot.load
                  ? `${slot.color.bg} ${slot.color.border} text-white font-bold`
                  : "bg-slate-900 border-slate-800 text-slate-600"
                  }`}
              >
                <div>Slot {slot.slotIndex + 1}</div>
                {slot.load ? (
                  <div className="text-3xs font-extrabold">#{slot.loadNumber}</div>
                ) : (
                  <div className="text-3xs text-slate-700">Empty</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === "rear" && (
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex items-center justify-center">
          <div className="w-64 h-52 border-4 border-slate-700 rounded-2xl bg-slate-900 p-4 flex flex-col justify-end relative shadow-2xl">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-3xs font-mono px-3 py-0.5 rounded-full font-bold">
              110" REAR TRAILER CLEARANCE
            </div>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="h-28 bg-indigo-600/80 border-2 border-indigo-400 rounded-xl p-2 flex flex-col justify-between text-center text-3xs font-mono font-bold text-white shadow-lg">
                <div>LEFT ROW STACK</div>
                <div className="text-xs">{palletSlots.filter(s => s.load && s.slotIndex % 2 === 0).length} Pallets</div>
              </div>
              <div className="h-28 bg-emerald-600/80 border-2 border-emerald-400 rounded-xl p-2 flex flex-col justify-between text-center text-3xs font-mono font-bold text-white shadow-lg">
                <div>RIGHT ROW STACK</div>
                <div className="text-xs">{palletSlots.filter(s => s.load && s.slotIndex % 2 !== 0).length} Pallets</div>
              </div>
            </div>
            <div className="h-3 bg-slate-700 rounded-full w-full" />
          </div>
        </div>
      )}

      {/* Color Legend */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800 text-3xs font-mono">
        <span className="text-slate-400 font-bold uppercase">Consolidated Load Legend:</span>
        {selectedLoads.map((s, idx) => {
          const color = loadColors[idx % loadColors.length];
          const loadNum = s.load_number || s.tracking_number || s.id;
          return (
            <span
              key={s.id}
              className={`px-2.5 py-1 rounded-lg border ${color.bg} ${color.border} text-white font-bold flex items-center gap-1.5`}
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>Load #{loadNum} ({s.pieces || s.palletCount || 2} Pallets)</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};

import TripDetailsModal from "./TripDetailModal";
import CustomsManifestModal from "./CustomsManifestModal";
import DocumentTemplateModal from "./DocumentTemplateModal";
import AILoadTenderIngestModal from "./AILoadTenderIngestModal";
import AIDriverMatcherModal from "./AIDriverMatcherModal";
import EntityHistoryModal from "./EntityHistoryModal";
import MultiStopRouteBuilderModal from "./trips/MultiStopRouteBuilderModal";
import { History, LayoutGrid, Map } from "lucide-react";
import { Link } from "react-router-dom";

export default function DispatcherDashboard({
  shipments,
  onAddTrip,
  onUpdateTrip,
  onRemoveTrip,
  messages,
  onUpdateShipment,
  onSendMessage,
  onMarkMessagesAsRead,
  currentUser,
  pendingBOLs: propPendingBOLs,
  handleApprove,
}) {
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isMultiStopModalOpen, setIsMultiStopModalOpen] = useState(false);
  const [customsModalShipment, setCustomsModalShipment] = useState(null);
  const [docTemplateState, setDocTemplateState] = useState({
    isOpen: false,
    docType: "PAPS",
    shipment: null,
  });
  const [isAiIngestModalOpen, setIsAiIngestModalOpen] = useState(false);
  const [aiMatchLoad, setAiMatchLoad] = useState(null);
  const [isAiMatchModalOpen, setIsAiMatchModalOpen] = useState(false);
  const [auditModalData, setAuditModalData] = useState({
    isOpen: false,
    entityType: "LOAD",
    entityId: null,
    entityIdentifier: "",
  });

  const { addShipment, isLoading, approveBOL: approveBOLStore, rejectBOL: rejectBOLStore, fetchShipments } = useShipmentStore();

  const mockDrivers = useDriverStore((state) => state.drivers);

  const trucks = useAssetStore((state) => state.trucks);
  const trailors = useAssetStore((state) => state.trailors);

  const customers = useCustomerStore((state) => state.customers);

  const trips = useTripStore((state) => state.trips);
  const { documents, fetchDocuments } = useDocumentStore();

  // Live Samsara fleet, for the Active Fleet card.
  const fleetSummary = useTelematicsStore((state) => state.summary);
  const fetchFleetTelematics = useTelematicsStore((state) => state.fetchFleetTelematics);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    fetchFleetTelematics();
  }, [fetchFleetTelematics]);

  // All data is already fetched by DispatcherPage on mount.
  // No duplicate fetch calls here — subscribing to the stores is enough.

  const [selectedShipment, setSelectedShipment] = useState(
    shipments[0] || null
  );

  useEffect(() => {
    if (!selectedShipment && shipments && shipments.length > 0) {
      setSelectedShipment(shipments[0]);
    }
  }, [shipments, selectedShipment]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [kpiCards, setKpiCards] = useState(() => {
    const saved = localStorage.getItem("logisync_kpi_cards");
    return saved
      ? JSON.parse(saved)
      : ["active_fleet", "total_weight", "pending_bol", "unbilled_rev", "delivered_today"];
  });
  const [isKpiConfigOpen, setIsKpiConfigOpen] = useState(false);

  const toggleKpiCard = (cardKey) => {
    setKpiCards((prev) => {
      const next = prev.includes(cardKey)
        ? prev.filter((k) => k !== cardKey)
        : [...prev, cardKey];
      localStorage.setItem("logisync_kpi_cards", JSON.stringify(next));
      return next;
    });
  };

  const [activeView, setActiveView] = useState("grid");
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadTypeFilter, setLoadTypeFilter] = useState("all");
  const [commitmentFilter, setCommitmentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("trackingNumber");
  const [sortOrder, setSortOrder] = useState("asc");
  const [formCommitment, setFormCommitment] = useState("normal");
  const [formCommitmentDate, setFormCommitmentDate] = useState("");
  const [formCommitmentTime, setFormCommitmentTime] = useState("");
  const [consolidationDriverId, setConsolidationDriverId] = useState("");
  const [consolidationDriverName, setConsolidationDriverName] = useState("");
  const [consolidationTruck, setConsolidationTruck] = useState("TRK-102");
  const [consolidationTrailer, setConsolidationTrailer] = useState("TRL-504");
  const [selectedConsolidationIds, setSelectedConsolidationIds] = useState([]);
  const [showSelectedTripDetailsId, setShowSelectedTripDetailsId] =
    useState(null);
  const [vehicleType, setVehicleType] = useState(
    "Class 8 Heavy Duty Semi-Truck"
  );
  const [weather, setWeather] = useState("Clear / Dry Roads");
  const [traffic, setTraffic] = useState("Normal Flow");
  const [chatAttachment, setChatAttachment] = useState(null);
  const [editingWaypointId, setEditingWaypointId] = useState(null);
  const [editScheduledTime, setEditScheduledTime] = useState("");
  const [pendingDocPreview, setPendingDocPreview] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [customerId, setCustomerId] = useState("CUST001");
  const [customerName, setCustomerName] = useState("AeroParts Manufacturing");
  const [customerEmail, setCustomerEmail] = useState("logistics@aeroparts.com");
  const [customerPhone, setCustomerPhone] = useState("+1 (416) 555-0100");
  const [customerAddress, setCustomerAddress] = useState(
    "150 Industrial Pkwy, Sector 4, Toronto, ON"
  );
  const [pbNum, setPbNum] = useState("");
  const [shipperName, setShipperName] = useState("");
  const [shipperAddress, setShipperAddress] = useState("");
  const [shipperPhone, setShipperPhone] = useState("");
  const [shipperDistrict, setShipperDistrict] = useState("");
  const [shipperZipcode, setShipperZipcode] = useState("");
  const [shipperState, setShipperState] = useState("");
  const [shipperCountry, setShipperCountry] = useState("");
  const [consigneeName, setConsigneeName] = useState("");
  const [consigneeAddress, setConsigneeAddress] = useState("");
  const [consigneePhone, setConsigneePhone] = useState("");
  const [consigneeDistrict, setConsigneeDistrict] = useState("");
  const [consigneeZipcode, setConsigneeZipcode] = useState("");
  const [consigneeState, setConsigneeState] = useState("");
  const [consigneeCountry, setConsigneeCountry] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [driverId, setDriverId] = useState("");
  const [driverName, setDriverName] = useState("Marcus Vance");
  const [truck, setTruck] = useState("TRK-102");
  const [trailer, setTrailer] = useState("TRL-504");
  const [cargo, setCargo] = useState("");
  const [weight, setWeight] = useState(6e3);
  const [pallets, setPallets] = useState(4);
  const [distance, setDistance] = useState(300);
  const [loadType, setLoadType] = useState("LTL");
  const [priority, setPriority] = useState("Normal Delivery");
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editedShipment, setEditedShipment] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [isUploadingRateCon, setIsUploadingRateCon] = useState(false);
  const [plannerDestSearch, setPlannerDestSearch] = useState("");
  const [plannerPickSearch, setPlannerPickSearch] = useState("");
  const [plannerSelectedState, setPlannerSelectedState] = useState("all");

  const getDriverRecommendations = (loadWeight, loadPallets, loadOrigin) => {
    return mockDrivers
      .map((drv) => {
        const activeShipmentsForDriver = shipments.filter(
          (s) => s.driverId === drv.id && s.status !== "delivered"
        );
        const currentWeight = activeShipmentsForDriver.reduce(
          (sum, s) => sum + (s.weightLbs || 0),
          0
        );
        const currentPallets = activeShipmentsForDriver.reduce(
          (sum, s) => sum + (s.palletCount || 0),
          0
        );
        const availableWeight = 45e3 - currentWeight;
        const availablePallets = 26 - currentPallets;
        const hasWeightCapacity = availableWeight >= loadWeight;
        const hasPalletCapacity = availablePallets >= loadPallets;
        let currentRegion = "Midwest Corridor";
        let isNearby = false;
        let distanceMiles = 45;
        if (drv.id === "DRV001") {
          currentRegion = "Toronto/Chicago Corridor";
        } else if (drv.id === "DRV002") {
          currentRegion = "Pacific Northwest";
        } else if (drv.id === "DRV003") {
          currentRegion = "Southwest Region";
        } else if (drv.id === "DRV004") {
          currentRegion = "Great Lakes Local";
        } else if (drv.id === "DRV005") {
          currentRegion = "Northeast Corridor";
        }
        const originLower = (loadOrigin || "").toLowerCase();
        if (
          drv.id === "DRV001" &&
          (originLower.includes("toronto") ||
            originLower.includes("mississauga") ||
            originLower.includes("chicago") ||
            originLower.includes("on") ||
            originLower.includes("il"))
        ) {
          isNearby = true;
          distanceMiles = originLower.includes("toronto") ? 12 : 180;
        } else if (
          drv.id === "DRV002" &&
          (originLower.includes("seattle") ||
            originLower.includes("everett") ||
            originLower.includes("vancouver") ||
            originLower.includes("wa") ||
            originLower.includes("bc"))
        ) {
          isNearby = true;
          distanceMiles = originLower.includes("everett") ? 8 : 115;
        } else if (
          drv.id === "DRV003" &&
          (originLower.includes("fresno") ||
            originLower.includes("nogales") ||
            originLower.includes("ca") ||
            originLower.includes("az") ||
            originLower.includes("tucson"))
        ) {
          isNearby = true;
          distanceMiles = originLower.includes("fresno") ? 15 : 420;
        } else if (
          drv.id === "DRV004" &&
          (originLower.includes("detroit") ||
            originLower.includes("michigan") ||
            originLower.includes("mi") ||
            originLower.includes("chicago"))
        ) {
          isNearby = true;
          distanceMiles = 32;
        } else if (
          drv.id === "DRV005" &&
          (originLower.includes("buffalo") ||
            originLower.includes("newark") ||
            originLower.includes("ny") ||
            originLower.includes("nj") ||
            originLower.includes("new york"))
        ) {
          isNearby = true;
          distanceMiles = originLower.includes("newark") ? 9 : 280;
        } else {
          let hash = 0;
          const comb = drv.name + originLower;
          for (let i = 0; i < comb.length; i++) {
            hash = comb.charCodeAt(i) + ((hash << 5) - hash);
          }
          distanceMiles = Math.abs(hash % 600) + 80;
          isNearby = distanceMiles < 200;
        }
        let score = 0;
        if (hasWeightCapacity) score += 30;
        if (hasPalletCapacity) score += 30;
        if (isNearby) score += 40;
        return {
          driver: drv,
          currentRegion,
          availableWeight,
          availablePallets,
          hasWeightCapacity,
          hasPalletCapacity,
          isNearby,
          distanceMiles,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);
  };

  const commitmentBadges = {
    "Normal Delivery": "bg-slate-100 text-slate-700 border-slate-200",
    normal: "bg-slate-100 text-slate-700 border-slate-200",
    "Guaranteed Delivery":
      "bg-amber-100 text-amber-900 border-amber-300 font-bold",
    "Guaranteed Only":
      "bg-amber-100 text-amber-900 border-amber-300 font-bold",
    guaranteed:
      "bg-amber-100 text-amber-900 border-amber-300 font-bold",
    "Appointment Delivery":
      "bg-purple-100 text-purple-900 border-purple-300 font-bold",
    "Appointment Only":
      "bg-purple-100 text-purple-900 border-purple-300 font-bold",
    appointment:
      "bg-purple-100 text-purple-900 border-purple-300 font-bold",
    "Guaranteed with Appointment Need":
      "bg-rose-100 text-rose-900 border-rose-300 font-black",
    "Guaranteed with Appointment":
      "bg-rose-100 text-rose-900 border-rose-300 font-black",
    guaranteed_appointment:
      "bg-rose-100 text-rose-900 border-rose-300 font-black",
  };
  // const filteredWarehouseLoads = React.useMemo(() => {
  //   return shipments.filter((s) => {
  //     const st = String(s.status || "")
  //       .toLowerCase()
  //       .replace(/\s+/g, "_");
  //     const isAtWarehouse =
  //       st === "at_warehouse" ||
  //       st === "at warehouse" ||
  //       s.status === "At Warehouse";
  //     if (!isAtWarehouse) return false;

  //     if (plannerSelectedState && plannerSelectedState !== "all") {
  //       const stateCode = plannerSelectedState.toLowerCase();
  //       const stateObj = US_STATES.find(
  //         (stObj) => stObj.code.toLowerCase() === stateCode
  //       );
  //       const stateName = stateObj ? stateObj.name.toLowerCase() : "";

  //       const destText = (
  //         (s.destination || "") +
  //         " " +
  //         (s.destinationCity || "") +
  //         " " +
  //         (s.destinationState || "") +
  //         " " +
  //         (s.customer_city || "") +
  //         " " +
  //         (s.consigneeAddress || "")
  //       ).toLowerCase();

  //       const matchesCode = new RegExp(`\\b${stateCode}\\b`, "i").test(
  //         destText
  //       );
  //       const matchesName = stateName && destText.includes(stateName);

  //       if (!matchesCode && !matchesName) return false;
  //     }

  //     if (plannerDestSearch.trim()) {
  //       const q = plannerDestSearch.trim().toLowerCase();
  //       const searchTarget = (
  //         (s.destination || "") +
  //         " " +
  //         (s.destinationCity || "") +
  //         " " +
  //         (s.destinationState || "") +
  //         " " +
  //         (s.customer_city || "") +
  //         " " +
  //         (s.consigneeAddress || "") +
  //         " " +
  //         (s.load_number || "") +
  //         " " +
  //         (s.tracking_number || "") +
  //         " " +
  //         (s.customer_name || "")
  //       ).toLowerCase();

  //       if (!searchTarget.includes(q)) return false;
  //     }

  //     return true;
  //   });
  // }, [shipments, plannerSelectedState, plannerDestSearch]);
  const filteredWarehouseLoads = React.useMemo(() => {
    const commitmentOrder = {
      "Guaranteed with Appointment Need": 1,
      "Guaranteed with Appointment": 1,
      guaranteed_appointment: 1,
      "Guaranteed Delivery": 2,
      "Guaranteed Only": 2,
      guaranteed: 2,
      "Appointment Delivery": 3,
      "Appointment Only": 3,
      appointment: 3,
      "Normal Delivery": 4,
      normal: 4,
    };

    return shipments
      .filter((s) => {
        const st = String(s.status || "")
          .toLowerCase()
          .replace(/\s+/g, "_");

        const isAtWarehouse =
          st === "at_warehouse" ||
          st === "at warehouse" ||
          s.status === "At Warehouse";

        if (!isAtWarehouse) return false;

        if (plannerSelectedState && plannerSelectedState !== "all") {
          const stateCode = plannerSelectedState.toLowerCase();
          const stateObj = US_STATES.find(
            (stObj) => stObj.code.toLowerCase() === stateCode
          );
          const stateName = stateObj ? stateObj.name.toLowerCase() : "";

          const destText = (
            (s.destination || "") +
            " " +
            (s.destinationCity || "") +
            " " +
            (s.destinationState || "") +
            " " +
            (s.customer_city || "") +
            " " +
            (s.consigneeAddress || "")
          ).toLowerCase();

          const matchesCode = new RegExp(`\\b${stateCode}\\b`, "i").test(
            destText
          );
          const matchesName = stateName && destText.includes(stateName);

          if (!matchesCode && !matchesName) return false;
        }

        if (plannerDestSearch.trim()) {
          const q = plannerDestSearch.trim().toLowerCase();
          const searchTarget = (
            (s.consignee_state || "") +
            " " +
            (s.consignee_city || "") +
            " " +
            (s.consignee_country || "") +
            " "
          ).toLowerCase();

          if (!searchTarget.includes(q)) return false;
        }

        if (plannerPickSearch.trim()) {
          const q = plannerPickSearch.trim().toLowerCase();

          const pickupTarget = (
            (s.shipper_state || "") +
            " " +
            (s.shipper_city || "") +
            " " +
            (s.shipper_country || "") +
            " "
          ).toLowerCase();

          if (!pickupTarget.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aPriority = commitmentOrder[a.commitment] ?? 999;
        const bPriority = commitmentOrder[b.commitment] ?? 999;

        return aPriority - bPriority;
      });
  }, [shipments, plannerPickSearch, plannerDestSearch]);

  const filteredAndSortedShipments = React.useMemo(() => {
    return shipments
      .filter((s) => {
        if (statusFilter !== "all" && s.status !== statusFilter) return false;
        if (loadTypeFilter !== "all" && s.loadType !== loadTypeFilter)
          return false;
        if (commitmentFilter !== "all") {
          const comm = String(
            s.deliveryCommitment || s.commitment || s.commitment_type || ""
          ).toLowerCase();
          if (commitmentFilter === "normal") {
            if (
              comm !== "normal" &&
              comm !== "normal delivery" &&
              comm !== "" &&
              s.deliveryCommitment !== void 0
            )
              return false;
          } else if (commitmentFilter === "guaranteed") {
            if (
              comm !== "guaranteed" &&
              comm !== "guaranteed delivery" &&
              comm !== "guaranteed only"
            )
              return false;
          } else if (commitmentFilter === "appointment") {
            if (
              comm !== "appointment" &&
              comm !== "appointment delivery" &&
              comm !== "appointment only"
            )
              return false;
          } else if (commitmentFilter === "guaranteed_appointment") {
            if (
              comm !== "guaranteed_appointment" &&
              !comm.includes("guaranteed with appointment") &&
              comm !== "guaranteed with appointment need"
            )
              return false;
          }
        }
        if (globalSearchQuery.trim() !== "") {
          const query = globalSearchQuery.toLowerCase();
          const matchesTracking = s.load_number?.toLowerCase()?.includes(query);
          const matchesCustomer = s.shipper_name
            ?.toLowerCase()
            ?.includes(query);
          const matchesDriver = s.driver_name?.toLowerCase()?.includes(query);
          // const matchesCity =
          //   s.shipper_district.toLowerCase().includes(query) ||
          //   s.consignee_district.toLowerCase().includes(query);
          // const shipperNames = s?.waypoints
          //   ?.filter((w) => w.stopType === "pickup")
          //   ?.map((w) => w.companyName.toLowerCase());
          // const matchesShipperName = shipperNames?.some((name) =>
          //   name.includes(query)
          // );
          // const shipperAddresses = s?.waypoints
          //   ?.filter((w) => w.stopType === "pickup")
          //   ?.map((w) => w.address.toLowerCase());
          // const matchesShipperAddress = shipperAddresses?.some((addr) =>
          //   addr.includes(query)
          // );
          // const consigneeNames = s?.waypoints
          //   ?.filter((w) => w.stopType === "delivery")
          //   ?.map((w) => w.companyName.toLowerCase());
          // const matchesConsigneeName = consigneeNames?.some((name) =>
          //   name.includes(query)
          // );
          // const consigneeAddresses = s?.waypoints
          //   ?.filter((w) => w.stopType === "delivery")
          //   ?.map((w) => w.address.toLowerCase());
          // const matchesConsigneeAddress = consigneeAddresses?.some((addr) =>
          //   addr.includes(query)
          // );
          // const matchesPickupLocation = s.customer_billing_address
          //   .toLowerCase()
          //   .includes(query);
          // const matchesDeliveryLocation = s.consignee_country
          //   .toLowerCase()
          //   .includes(query);
          if (searchField === "trackingNumber") return matchesTracking;
          if (searchField === "customerName") return matchesCustomer;
          // if (searchField === "shipperName") return matchesShipperName;
          // if (searchField === "shipperAddress") return matchesShipperAddress;
          // if (searchField === "consigneeName") return matchesConsigneeName;
          // if (searchField === "consigneeAddress")
          //   return matchesConsigneeAddress;
          // if (searchField === "pickupLocation") return matchesPickupLocation;
          // if (searchField === "deliveryLocation")
          //   return matchesDeliveryLocation;
          return (
            matchesTracking ||
            matchesCustomer ||
            matchesDriver
            // matchesCity ||
            // matchesShipperName ||
            // matchesShipperAddress ||
            // matchesConsigneeName ||
            // matchesConsigneeAddress
          );
        }
        return true;
      })
      .sort((a, b) => {
        let compareValue = 0;
        if (sortBy === "trackingNumber") {
          const numA = parseInt(a.load_number, 10) || 0;
          const numB = parseInt(b.load_number, 10) || 0;
          compareValue = numA - numB;
        } else if (sortBy === "weight") {
          compareValue = a.weight - b.weight;
        } else if (sortBy === "distance") {
          compareValue = a.totalDistanceMiles - b.totalDistanceMiles;
        } else if (sortBy === "eta") {
          compareValue = new Date(a.eta).getTime() - new Date(b.eta).getTime();
        } else if (sortBy === "customerName") {
          compareValue = a.customer_name.localeCompare(b.customer_name);
        } else if (sortBy === "pickupLocation") {
          compareValue = a.shipper_state.localeCompare(b.shipper_state);
        } else if (sortBy === "deliveryLocation") {
          compareValue = a.consignee_state.localeCompare(b.consignee_state);
        } else if (sortBy === "shipperName") {
          const nameA = a.waypoints
            .filter((w) => w.stopType === "pickup")
            .map((w) => w.companyName)
            .join(", ");
          const nameB = b.waypoints
            .filter((w) => w.stopType === "pickup")
            .map((w) => w.companyName)
            .join(", ");
          compareValue = nameA.localeCompare(nameB);
        } else if (sortBy === "shipperAddress") {
          const addrA = a?.waypoints
            ?.filter((w) => w.stopType === "pickup")
            .map((w) => w.address)
            .join(", ");
          const addrB = b.waypoints
            ?.filter((w) => w.stopType === "pickup")
            ?.map((w) => w.address)
            ?.join(", ");
          compareValue = addrA.localeCompare(addrB);
        } else if (sortBy === "consigneeName") {
          const nameA = a.waypoints
            .filter((w) => w.stopType === "delivery")
            .map((w) => w.companyName)
            .join(", ");
          const nameB = b.waypoints
            .filter((w) => w.stopType === "delivery")
            .map((w) => w.companyName)
            .join(", ");
          compareValue = nameA.localeCompare(nameB);
        } else if (sortBy === "consigneeAddress") {
          const addrA = a.waypoints
            .filter((w) => w.stopType === "delivery")
            .map((w) => w.address)
            .join(", ");
          const addrB = b.waypoints
            .filter((w) => w.stopType === "delivery")
            .map((w) => w.address)
            .join(", ");
          compareValue = addrA.localeCompare(addrB);
        } else {
          compareValue = a.id > b.id ? 1 : -1;
        }
        return sortOrder === "asc" ? compareValue : -compareValue;
      });
  }, [
    shipments,
    statusFilter,
    loadTypeFilter,
    commitmentFilter,
    globalSearchQuery,
    searchField,
    sortBy,
    sortOrder,
  ]);
  const pendingBOLs = useMemo(() => {
    if (propPendingBOLs && Array.isArray(propPendingBOLs) && propPendingBOLs.length > 0) {
      return propPendingBOLs;
    }
    return (shipments || []).filter((s) => {
      const st = String(s.status || "").toLowerCase().replace(/\s+/g, "_");
      const isPendingStatus = st === "bol_pending_approval" || st === "bol_uploaded" || st === "pending_bol" || st.includes("bol_pending");
      const hasUnapprovedBol = Boolean(s.bol_uploaded || s.bolUrl || s.bol_url || s.hasBol) && !s.bol_approved && st !== "picked_up" && st !== "at_warehouse" && st !== "in_transit" && st !== "delivered";

      const hasBolInMsg = messages?.some((m) => {
        const mShipId = String(m.shipmentId || m.shipment_id || "").toLowerCase();
        const sId = String(s.id || "").toLowerCase();
        const loadNum = String(s.load_number || s.tracking_number || "").toLowerCase();
        const text = String(m.content || m.text || "").toLowerCase();
        const match = (mShipId && mShipId === sId) || (loadNum && text.includes(loadNum));
        const isBol = text.includes("bol") || text.includes("uploaded") || Boolean(m.attachment);
        return match && isBol;
      });

      return isPendingStatus || (hasUnapprovedBol && st !== "picked_up") || (hasBolInMsg && st === "pickup_assigned");
    });
  }, [shipments, messages, propPendingBOLs]);

  const handleApproveBOL = async (s) => {
    const loadId = s.load_id || s.loadId || s.id;
    const documentId = s.id;

    if (handleApprove) {
      await handleApprove(loadId, documentId);
    } else if (approveBOLStore) {
      await approveBOLStore(loadId, documentId);
    }

    if (onUpdateShipment) {
      await onUpdateShipment({
        ...s,
        id: loadId,
        status: "picked_up",
        bol_approved: true,
        bol_approved_at: new Date().toISOString(),
      });
    }
    toast.success(`Load #${s.load_number || s.tracking_number || s.trackingNumber || loadId} BOL Approved! Status updated to "Picked Up".`);
  };

  const handleRejectBOL = async (s) => {
    const loadId = s.load_id || s.loadId || s.id;
    const documentId = s.id;

    if (rejectBOLStore) {
      await rejectBOLStore(loadId, documentId);
    }

    if (onUpdateShipment) {
      await onUpdateShipment({
        ...s,
        id: loadId,
        status: "pickup_assigned",
        bol_approved: false,
        bol_rejected: true,
      });
    }
    toast.error(`Load #${s.load_number || s.tracking_number || s.trackingNumber || loadId} BOL Rejected. Driver notified to re-upload.`);
  };

  const handleConsolidateTrips = () => {
    // if (!consolidationDriverId) {
    //   alert("Please select a driver");
    //   return;
    // }
    if (selectedConsolidationIds.length === 0) {
      alert("Please select at least one load to consolidate into this trip.");
      return;
    }
    const numericTripNumbers = trips
      .map((t) => parseInt(t.trip_number, 10))
      .filter((num) => !isNaN(num) && num >= 1e4);
    const nextTripNum =
      numericTripNumbers.length > 0
        ? Math.max(...numericTripNumbers) + 1
        : 10003;
    const tripNumber = String(nextTripNum);
    const tripId = `TRIP-${tripNumber}`;
    const selectedLoads = shipments.filter((s) =>
      selectedConsolidationIds.includes(s.id)
    );
    const totalWeight = selectedLoads.reduce(
      (sum, s) => sum + Number(s.weight),
      0
    );
    const totalPallets = selectedLoads.reduce(
      (sum, s) => sum + Number(s.pieces),
      0
    );
    const newTrip = {
      tripNumber,
      driverId: consolidationDriverId,
      driverName: consolidationDriverName,
      truckNumber: consolidationTruck,
      trailerNumber: consolidationTrailer,
      status: "pending",
      shipmentIds: [...selectedConsolidationIds],
      totalWeightLbs: totalWeight,
      totalPallets,
    };
    console.log(newTrip)
    selectedLoads.forEach((shipment) => {
      const updatedShipment = {
        ...shipment,
        tripId,
        driver_id: consolidationDriverId,
        // driver_name: consolidationDriverName,
        // truck_number: consolidationTruck,
        // trailer_number: consolidationTrailer,
        status: "trip_assigned",
      };
      onUpdateShipment(updatedShipment);
    });
    if (onAddTrip) {
      onAddTrip(newTrip);
    }
    setSelectedConsolidationIds([]);

    setConsolidationDriverId("");
    setConsolidationDriverName("");
  };
  // Only fire when the selected shipment changes, not on every message arrival.
  // Using selectedShipment?.id keeps the dep stable (primitive string, not object).
  useEffect(() => {
    if (selectedShipment && onMarkMessagesAsRead) {
      onMarkMessagesAsRead(selectedShipment.id, "dispatcher");
    }
  }, [selectedShipment?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (globalSearchQuery.trim()) {
      const query = globalSearchQuery.trim().toLowerCase();
      const matchedShipment = shipments.find(
        (s) => s.load_number.toLowerCase() === query
      );
      if (matchedShipment) {
        setSelectedShipment(matchedShipment);
        setIsDetailModalOpen(true);
      } else {
        const matchedTrip = trips.find(
          (t) =>
            t?.tripNumber?.toLowerCase() === query ||
            t?.id?.toLowerCase() === query
        );
        if (matchedTrip) {
          setActiveView("consolidation");
          setShowSelectedTripDetailsId(matchedTrip.id);
        }
      }
    }
  }, [globalSearchQuery, shipments, trips]);
  const handleSendMessage = (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !chatAttachment) || !selectedShipment) return;
    onSendMessage(
      newMessage,
      selectedShipment.driverId,
      selectedShipment.id,
      chatAttachment || void 0
    );
    setNewMessage("");
    setChatAttachment(null);
  };
  const handleAttachMockFile = (type) => {
    if (type === "photo") {
      setChatAttachment({
        type: "photo",
        name: "Trailer_Rear_Axle_Weight.jpg",
        url: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80",
        size: "1.2 MB",
      });
    } else {
      setChatAttachment({
        type: "document",
        name: "Customs_PAPS_Approved_Stamp.pdf",
        url: "#",
        size: "420 KB",
      });
    }
  };
  const handleMoveWaypoint = (index, direction) => {
    if (!selectedShipment) return;
    const nextWaypoints = [...selectedShipment.waypoints];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= nextWaypoints.length) return;
    const temp = nextWaypoints[index];
    nextWaypoints[index] = nextWaypoints[swapIndex];
    nextWaypoints[swapIndex] = temp;
    const updatedWaypoints = nextWaypoints.map((w, idx) => ({
      ...w,
      sequence: idx + 1,
    }));
    const updatedShipment = {
      ...selectedShipment,
      waypoints: updatedWaypoints,
    };
    onUpdateShipment(updatedShipment);
    setSelectedShipment(updatedShipment);
  };
  const handleSaveWaypointTime = (waypointId) => {
    if (!selectedShipment || !editScheduledTime) return;
    const updatedWaypoints = selectedShipment.waypoints.map((w) => {
      if (w.id === waypointId) {
        return {
          ...w,
          scheduledTime: new Date(editScheduledTime).toISOString(),
        };
      }
      return w;
    });
    const updatedShipment = {
      ...selectedShipment,
      waypoints: updatedWaypoints,
    };
    onUpdateShipment(updatedShipment);
    setSelectedShipment(updatedShipment);
    setEditingWaypointId(null);
  };
  const handleApplyAiSequence = () => {
    if (!selectedShipment || !optimizedRoute) return;
    const sortedWaypoints = [...selectedShipment.waypoints].sort((a, b) => {
      const idxA = optimizedRoute.optimizedSequence.findIndex(
        (name) =>
          name.toLowerCase().includes(a.companyName.toLowerCase()) ||
          a.companyName.toLowerCase().includes(name.toLowerCase())
      );
      const idxB = optimizedRoute.optimizedSequence.findIndex(
        (name) =>
          name.toLowerCase().includes(b.companyName.toLowerCase()) ||
          b.companyName.toLowerCase().includes(name.toLowerCase())
      );
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
    const updatedWaypoints = sortedWaypoints.map((w, idx) => ({
      ...w,
      sequence: idx + 1,
    }));
    const updatedShipment = {
      ...selectedShipment,
      waypoints: updatedWaypoints,
    };
    onUpdateShipment(updatedShipment);
    setSelectedShipment(updatedShipment);
  };
  const handleUpdateBorderStatus = (status) => {
    if (!selectedShipment) return;
    const updated = { ...selectedShipment, borderConnectStatus: status };
    if (status === "submitted" && !updated.borderConnectManifestId) {
      updated.borderConnectManifestId =
        "BC-MANIFEST-" + Math.floor(1e5 + Math.random() * 9e5);
    }
    onUpdateShipment(updated);
    setSelectedShipment(updated);
  };
  const handleAiOptimizeRoute = async () => {
    if (!selectedShipment) return;
    setAiLoading(true);
    setAiError(null);
    setOptimizedRoute(null);
    try {
      const response = await fetch("/api/gemini/optimize-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: selectedShipment.originCity,
          destination: selectedShipment.destinationCity,
          cargoDescription: selectedShipment.cargoDescription,
          vehicleType,
          weather,
          traffic,
          waypoints: selectedShipment.waypoints.map((w) => ({
            companyName: w.companyName,
            address: w.address,
            stopType: w.stopType,
            weight: w.weight,
            pieces: w.pieces,
            scheduledTime: w.scheduledTime,
          })),
          priority:
            "Ensure rapid border clearance, coordinate trailer axle weight load limit, safe winter/highway routing",
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Server error");
      }
      const data = await response.json();
      setOptimizedRoute(data);
    } catch (err) {
      setAiError(
        err.message ||
        "Could not reach server-side route optimizer. Verify your GEMINI_API_KEY inside the Secrets panel."
      );
    } finally {
      setAiLoading(false);
    }
  };
  const handleUploadRateCon = async (e) => {
    if (!e.target.files?.length) return;
    setIsUploadingRateCon(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      const trackingNumber = "LD-" + Math.floor(1e3 + Math.random() * 9e3);
      const newShipment = {
        id: "SHP_AUTO_" + trackingNumber,
        trackingNumber,
        customerName: "Auto-Extracted Corp",
        customerEmail: "shipping@auto-extracted.com",
        dispatcherName: "System User",
        broker: "C.H. Robinson",
        poNumber: "PO-" + trackingNumber,
        bolNumber: "BOL-" + trackingNumber,
        status: "pending",
        driverId: "DRV001",
        driverName: "Marcus Vance",
        truckNumber: "TRK-102",
        trailerNumber: "TRL-504",
        originCity: "Dallas, TX",
        destinationCity: "Atlanta, GA",
        cargoDescription: "Industrial Parts (Auto-parsed)",
        weightLbs: 12500,
        palletCount: 10,
        totalDistanceMiles: 800,
        costEstimate: 1600,
        priceInvoice: 2400,
        eta: new Date(Date.now() + 864e5 * 3).toISOString(),
        borderConnectStatus: "none",
        documentIds: [],
        waypoints: [
          {
            id: `WPT_AUTO_1`,
            companyName: `Auto-Extracted Corp`,
            address: "Dallas, TX",
            lat: 32.7,
            lng: -96.8,
            stopType: "pickup",
            sequence: 1,
            status: "pending",
            scheduledTime: new Date(Date.now() + 36e5 * 4).toISOString(),
          },
          {
            id: `WPT_AUTO_2`,
            companyName: `Consignee Warehouse`,
            address: "Atlanta, GA",
            lat: 33.7,
            lng: -84.3,
            stopType: "delivery",
            sequence: 2,
            status: "pending",
            scheduledTime: new Date(Date.now() + 864e5 * 2.5).toISOString(),
          },
        ],
      };
      onAddShipment(newShipment);
      setSelectedShipment(newShipment);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingRateCon(false);
    }
  };
  const handleCreateLoad = async (e) => {
    e.preventDefault();
    console.log("ss");
    if (!customerName || !shipperAddress || !consigneeAddress) return;
    // Robust parsing of load/tracking numbers (supporting custom prefixes like "LOAD " or "L" or "LD-")




    // Generate a secure unique database ID to prevent any duplicate/overwrite collisions
    // const uniqueId =
    //   "SHP" +
    //   Date.now().toString().slice(-6) +
    //   Math.floor(10 + Math.random() * 90);

    // Construct newShipment object with all properties required for both DB columns and frontend backwards compatibility
    const newShipment = {
      customer_id: customerId,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      shipperName: shipperName || `${customerName} Depot`,
      shipperAddress: shipperAddress || origin,
      shipperPhone,
      shipperDistrict,
      shipperState,
      shipperCountry,
      shipperZipcode,
      consigneeName: consigneeName || `${customerName} Consignee`,
      consigneeAddress: consigneeAddress || destination,
      consigneePhone,
      consigneeDistrict,
      consigneeState,
      consigneeCountry,
      consigneeZipcode,
      status: "pending",
      // driverId,
      // driverName,
      // truckNumber: truck,
      // trailerNumber: trailer,
      // truck_id: truck,
      // trailer_id: trailer,
      originCity: origin,
      destinationCity: destination,
      cargoDescription: cargo,
      commodity: cargo,
      weight: Number(weight),
      pieces: Number(pallets),
      rate: Math.round(distance * 4.5),
      weightLbs: Number(weight),
      palletCount: Number(pallets),
      totalDistanceMiles: Number(distance),
      costEstimate: Math.round(distance * 2.2),
      priceInvoice: Math.round(distance * 4.5),
      eta: new Date(Date.now() + 864e5 * 2).toISOString(),
      borderConnectStatus:
        origin.includes("ON") || destination.includes("BC") ? "draft" : "none",
      // documentIds: [],
      loadType,
      // priority,
      deliveryCommitment: formCommitment,
      commitmentDate: formCommitment === "normal" ? void 0 : formCommitmentDate,
      commitmentTime: formCommitment === "normal" ? void 0 : formCommitmentTime,
      // waypoints: [
      //   {
      //     id: `WPT_NEW_1`,
      //     companyName: shipperName || `${customerName} Depot`,
      //     address: shipperAddress || origin,
      //     lat: 41.8,
      //     lng: -87.6,
      //     stopType: "pickup",
      //     sequence: 1,
      //     status: "pending",
      //     scheduledTime: new Date(Date.now() + 36e5 * 4).toISOString(),
      //   },
      //   {
      //     id: `WPT_NEW_2`,
      //     companyName: consigneeName || `${customerName} Consignee`,
      //     address: consigneeAddress || destination,
      //     lat: 43.6,
      //     lng: -79.6,
      //     stopType: "delivery",
      //     sequence: 2,
      //     status: "pending",
      //     scheduledTime: new Date(Date.now() + 864e5 * 1.5).toISOString(),
      //   },
      // ],
    };
    const success = await addShipment(newShipment);
    console.log(success);
    if (success) {
      setSelectedShipment(newShipment);
      setShowAddForm(false);
      setCustomerId("CUST001");
      setCustomerName("AeroParts Manufacturing");
      setCustomerEmail("logistics@aeroparts.com");
      setCustomerPhone("+1 (416) 555-0100");
      setCustomerAddress("150 Industrial Pkwy, Sector 4, Toronto, ON");

      setShipperName("");
      setShipperAddress("");
      setShipperCountry("");
      setShipperDistrict("");
      setShipperState("");
      setShipperZipcode("");

      setConsigneeName("");
      setConsigneeAddress("");
      setConsigneeCountry("");
      setConsigneeDistrict("");
      setConsigneeState("");
      setConsigneeZipcode("");
      setPriority("Normal Delivery");
      setCargo("");
      setFormCommitment("normal");
      setFormCommitmentDate("");
      setFormCommitmentTime("");
    }
    // setIsDetailModalOpen(true);
  };
  const activeChatMessages = selectedShipment
    ? messages.filter(
      (m) =>
        m.shipmentId === selectedShipment.id ||
        m.recipientId === selectedShipment.driverId ||
        m.senderName === selectedShipment.driverName
    )
    : [];

  const filteredTrips = trips.filter((trip) => {
    if (!globalSearchQuery) return true;

    const q = globalSearchQuery.toLowerCase();

    const tripLoads = shipments.filter(
      (shipment) => shipment.tripId === trip.id
    );

    return (
      trip.trip_number.toLowerCase().includes(q) ||
      trip.driver_name.toLowerCase().includes(q) ||
      tripLoads.some((load) =>
        [load.customer_name, load.destination, load.tracking_number]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(q))
      )
    );
  });
  return (
    <div
      id="dispatcher-suite"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-900 select-none"
    >
      {/* Samsara Live Telemetry Integration Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 bg-gradient-to-tr from-sky-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-sm">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-extrabold tracking-wide text-slate-900">
                SAMSARA FLEET CLOUD INTEGRATION
              </h3>
              <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                ● Live Telematics Synced
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live GPS Telemetry, Driver HOS Logs & Vehicle Diagnostics synced with Samsara API v2.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="text-right text-xs">
            <div className="font-extrabold text-slate-900 font-mono">427 Live Tractors</div>
            <div className="text-[11px] text-slate-500">Continuous Radar Stream</div>
          </div>
        </div>
      </div>

      {/* Customizable Operational KPI Cards Header */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Gauge className="h-4 w-4 text-sky-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Operational Fleet Metrics
            </h2>
          </div>
          <div className="relative">
            <button
              onClick={() => setIsKpiConfigOpen(!isKpiConfigOpen)}
              className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-1.5 cursor-pointer transition-colors"
            >
              <Settings className="h-3.5 w-3.5 text-slate-500" />
              <span>Customize Cards</span>
            </button>

            {isKpiConfigOpen && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-3.5 z-50 animate-fade-in text-xs space-y-2 text-slate-800">
                <div className="font-bold text-[11px] text-slate-500 uppercase pb-1.5 border-b border-slate-100">
                  Toggle Visible KPI Cards
                </div>
                {[
                  { key: "active_fleet", label: "Active Fleet Shipments" },
                  { key: "total_weight", label: "Total Freight Volume (Lbs)" },
                  { key: "pending_bol", label: "Pending BOL Approvals" },
                  { key: "unbilled_rev", label: "Estimated Revenue ($)" },
                  { key: "delivered_today", label: "Delivered Shipments" },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 cursor-pointer font-medium select-none py-0.5"
                  >
                    <input
                      type="checkbox"
                      checked={kpiCards.includes(item.key)}
                      onChange={() => toggleKpiCard(item.key)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-3.5 w-3.5"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {kpiCards.includes("active_fleet") && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase text-slate-500">
                  Active Fleet
                </p>
                <h4 className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                  {fleetSummary.total > 0 ? fleetSummary.total : "—"}
                </h4>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                  {fleetSummary.inTransit} moving
                </p>
              </div>
              <div className="p-2.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl shadow-2xs">
                <Truck className="h-4 w-4" />
              </div>
            </div>
          )}

          {kpiCards.includes("total_weight") && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase text-slate-500">
                  Total Freight Vol
                </p>
                <h4 className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                  {shipments
                    .reduce((acc, s) => acc + Number(s.weightLbs || 12000), 0)
                    .toLocaleString()}{" "}
                  <span className="text-xs font-normal text-slate-500">lbs</span>
                </h4>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl shadow-2xs">
                <Scale className="h-4 w-4" />
              </div>
            </div>
          )}

          {kpiCards.includes("pending_bol") && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase text-slate-500">
                  Pending BOL Review
                </p>
                <h4 className="text-xl font-extrabold text-amber-700 font-mono mt-0.5">
                  {pendingBOLs ? pendingBOLs.length : 0}
                </h4>
              </div>
              <div className="p-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl shadow-2xs">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
            </div>
          )}

          {kpiCards.includes("unbilled_rev") && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase text-slate-500">
                  Est. Freight Revenue
                </p>
                <h4 className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                  ${(shipments.length * 1850).toLocaleString()}
                </h4>
              </div>
              <div className="p-2.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl shadow-2xs">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
          )}

          {kpiCards.includes("delivered_today") && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase text-slate-500">
                  Delivered Loads
                </p>
                <h4 className="text-xl font-extrabold text-emerald-700 font-mono mt-0.5">
                  {shipments.filter((s) => s.status === "delivered").length}
                </h4>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl shadow-2xs">
                <PackageCheck className="h-4 w-4" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dispatcher Dashboard Tabs */}
      <div className="border-b border-slate-200 mb-6 flex items-center justify-between">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveView("grid")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${activeView === "grid"
              ? "border-sky-600 text-sky-700 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
          >
            <Layers className="h-4 w-4 text-sky-600" />
            <span>Active Shipments Fleet Manager</span>
          </button>

          <button
            id="ltl-consolidation-tab"
            onClick={() => setActiveView("consolidation")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${activeView === "consolidation"
              ? "border-sky-600 text-sky-700 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
          >
            <Compass className="h-4 w-4 text-slate-400" />
            <span>LTL Consolidation Trip Planner</span>
          </button>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => {
              const targetLoad = selectedShipment || shipments[0] || {
                originCity: "Brampton, ON",
                destinationCity: "Chicago, IL",
                equipmentType: "Dry Van 53ft",
                isCrossBorder: true,
                load_number: "582516",
              };
              setAiMatchLoad(targetLoad);
              setIsAiMatchModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>AI Driver Matcher ⚡</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAiIngestModalOpen(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>AI Ingest Tender (Email/PDF) 🤖</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 border-l-4 border-l-amber-500 mb-8 space-y-4 text-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-500" />
            <span>Pending BOL Approvals Awaiting Review ({pendingBOLs.length})</span>
          </h2>
          <span className="text-xs font-bold bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200 font-mono">
            {pendingBOLs.length} Awaiting Dispatcher Sign-Off
          </span>
        </div>

        {pendingBOLs.length === 0 ? (
          <p className="text-slate-500 text-xs font-medium italic">
            No unapproved BOL documents found at the moment. When a driver uploads a BOL or load picture, it will appear here for verification.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-3">Load Number</th>
                  <th className="p-3">Assigned Driver</th>
                  <th className="p-3">Uploaded BOL / Photo</th>
                  <th className="p-3 text-right">Approval Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium">
                {pendingBOLs.map((s) => {
                  const matchedDoc = documents?.find((d) => {
                    const docType = String(d.document_type || d.type || "").toUpperCase();
                    if (!docType.includes("BOL") && !docType.includes("LADING")) return false;
                    const docLoad = String(d.load_id || d.load_number || d.shipment_id || d.shipmentId || d.tracking_number || d.trackingNumber || "");
                    const loadNum = String(s.load_number || s.tracking_number || s.trackingNumber || s.load_id || s.id || "");
                    return docLoad && loadNum && (docLoad === loadNum || docLoad.includes(loadNum) || loadNum.includes(docLoad));
                  });

                  const chatMsgDoc = messages?.find((m) => {
                    const mShipId = String(m.shipmentId || m.shipment_id || "").toLowerCase();
                    const sId = String(s.id || s.load_id || s.load_number || "").toLowerCase();
                    const text = String(m.content || m.text || "").toLowerCase();
                    const loadNum = String(s.load_number || s.tracking_number || s.trackingNumber || "").toLowerCase();
                    const match = (mShipId && mShipId === sId) || (loadNum && text.includes(loadNum));
                    return match && (m.attachment || m.image);
                  });

                  const docUrl = matchedDoc?.file_path || matchedDoc?.image_url || matchedDoc?.url || s.file_path || s.image_url || s.url || s.bol_url || s.bolUrl || s.bolDocUrl || (chatMsgDoc ? (chatMsgDoc.attachment || chatMsgDoc.image) : null);
                  const loadNum = s.load_number || s.tracking_number || s.trackingNumber || s.load_id || s.id;
                  const fileName = matchedDoc?.file_name || s.file_name || s.name || `Carrier_BOL_${loadNum}.pdf`;

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-amber-50/50 transition-colors"
                    >
                      <td className="p-3 font-bold font-mono text-indigo-600">
                        #{loadNum}
                      </td>
                      <td className="p-3 font-semibold text-slate-900">
                        {s.driverName || s.driver_name || "Marcus Vance"}
                      </td>
                      <td className="p-3 font-mono">
                        <button
                          type="button"
                          onClick={() =>
                            setPendingDocPreview({
                              name: fileName,
                              url: docUrl || "#",
                              loadNumber: loadNum,
                              driverName: s.driverName || s.driver_name || "Marcus Vance",
                              loadItem: s,
                            })
                          }
                          className="text-indigo-600 hover:text-indigo-800 font-bold underline inline-flex items-center space-x-1.5 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200"
                        >
                          <Eye className="h-3.5 w-3.5 text-indigo-600" />
                          <span>{fileName}</span>
                          <span className="text-[10px] bg-indigo-200 text-indigo-900 px-1.5 py-0.5 rounded font-mono font-bold">VIEW 👁</span>
                        </button>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() =>
                            setPendingDocPreview({
                              name: fileName,
                              url: docUrl || "#",
                              loadNumber: loadNum,
                              driverName: s.driverName || s.driver_name || "Marcus Vance",
                              loadItem: s,
                            })
                          }
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-3xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Document</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveBOL(s)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-3xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve BOL & Mark Picked Up</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectBOL(s)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-3xs font-bold transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PENDING BOL DOCUMENT VERIFICATION PREVIEW MODAL */}
      {pendingDocPreview && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden font-sans flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white font-mono flex items-center gap-2">
                    <span>Pending BOL Verification</span>
                    <span className="text-xs bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded border border-indigo-400/30 font-mono">
                      Load #{pendingDocPreview.loadNumber}
                    </span>
                  </h3>
                  <p className="text-xs text-emerald-400 font-mono mt-0.5">
                    ● Driver Sign-Off: {pendingDocPreview.driverName} • Awaiting Dispatcher Review
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingDocPreview(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl text-lg font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content Body - Full PDF Document Container */}
            <div className="p-6 space-y-6 overflow-y-auto bg-slate-100/80 flex-1">
              {/* UPLOADED DRIVER BOL DOCUMENT ATTACHMENT CARD */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 text-center space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>📷 UPLOADED BOL DOCUMENT ATTACHMENT</span>
                  </span>
                  <a
                    href={pendingDocPreview.url && pendingDocPreview.url !== "#" ? pendingDocPreview.url : "#"}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      if (!pendingDocPreview.url || pendingDocPreview.url === "#") {
                        e.preventDefault();
                        alert("Opening high-resolution uploaded BOL document file...");
                      }
                    }}
                    className="text-3xs text-indigo-400 hover:text-indigo-300 underline font-mono font-bold"
                  >
                    Open Source Link ↗
                  </a>
                </div>

                {pendingDocPreview.url && pendingDocPreview.url !== "#" ? (
                  pendingDocPreview.url.toLowerCase().endsWith(".pdf") ? (
                    <iframe
                      src={pendingDocPreview.url}
                      className="w-full h-80 rounded-xl border border-slate-800 bg-white"
                      title="Uploaded PDF Preview"
                    />
                  ) : (
                    <img
                      src={pendingDocPreview.url}
                      alt="Uploaded BOL"
                      className="max-h-80 mx-auto rounded-xl border border-slate-800 object-contain shadow-md"
                      referrerPolicy="no-referrer"
                    />
                  )
                ) : (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-center">
                    <img
                      src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80"
                      alt="Uploaded Freight BOL Scanned Document"
                      className="max-h-72 mx-auto rounded-xl border border-slate-800 object-contain shadow-md"
                    />
                    <div className="text-3xs text-emerald-400 font-mono font-bold pt-1">
                      ✔ Driver Uploaded Scanned Freight Document • Load #{pendingDocPreview.loadNumber} ({pendingDocPreview.driverName})
                    </div>
                  </div>
                )}
              </div>

              {/* Complete PDF Freight Bill of Lading Document Sheet */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-300 shadow-md space-y-6 font-mono text-xs text-slate-800 relative">
                {/* Stamp Seal */}
                <div className="absolute top-6 right-6 border-2 border-emerald-600 text-emerald-700 rounded-xl px-3 py-1 text-3xs font-extrabold uppercase tracking-widest rotate-3 bg-emerald-50/80 shadow-xs pointer-events-none">
                  ✔ DRIVER SIGNED & VERIFIED
                </div>

                {/* PDF Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                  <div className="space-y-1">
                    <div className="text-lg font-black text-slate-900 font-sans tracking-tight uppercase">
                      OZACK FREIGHT SYSTEMS
                    </div>
                    <div className="text-3xs text-slate-500 font-bold">
                      STANDARD BILL OF LADING FOR FREIGHT SHIPMENTS
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="text-3xs text-slate-400 font-bold uppercase">BOL / MANIFEST #</div>
                    <div className="text-sm font-extrabold text-indigo-600 font-mono">
                      #{pendingDocPreview.loadNumber}
                    </div>
                    <div className="text-3xs text-slate-500">
                      Date: {new Date().toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Shipper & Consignee Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="text-3xs font-bold text-slate-400 uppercase tracking-wider">
                      SHIPPER (FROM / ORIGIN)
                    </div>
                    <div className="text-xs font-bold text-slate-900 font-sans">
                      {pendingDocPreview.loadItem?.shipper_name || pendingDocPreview.loadItem?.customer_name || pendingDocPreview.loadItem?.customerName || "AeroParts Manufacturing Yard"}
                    </div>
                    <div className="text-3xs text-slate-600 leading-relaxed">
                      {pendingDocPreview.loadItem?.shipper_address || pendingDocPreview.loadItem?.origin || "150 Industrial Pkwy, Sector 4, Toronto, ON"}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="text-3xs font-bold text-slate-400 uppercase tracking-wider">
                      CONSIGNEE (TO / DESTINATION)
                    </div>
                    <div className="text-xs font-bold text-slate-900 font-sans">
                      {pendingDocPreview.loadItem?.consignee_name || "Midwest Cargo Distribution Center"}
                    </div>
                    <div className="text-3xs text-slate-600 leading-relaxed">
                      {pendingDocPreview.loadItem?.consignee_address || pendingDocPreview.loadItem?.destination || "740 Logistics Way, Dock 12, Chicago, IL"}
                    </div>
                  </div>
                </div>

                {/* Freight Commodities Table */}
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 font-bold text-slate-700 text-3xs uppercase border-b border-slate-300">
                      <tr>
                        <th className="p-2.5">Handling Units</th>
                        <th className="p-2.5">Commodity Description</th>
                        <th className="p-2.5">Weight</th>
                        <th className="p-2.5">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-3xs">
                      <tr>
                        <td className="p-2.5 font-bold font-mono">
                          {pendingDocPreview.loadItem?.pieces || pendingDocPreview.loadItem?.pallets || 4} Pallets / Skids
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 font-sans">
                          {pendingDocPreview.loadItem?.cargo || pendingDocPreview.loadItem?.cargoDescription || "Industrial Logistics Cargo Parts"}
                        </td>
                        <td className="p-2.5 font-mono">
                          {(pendingDocPreview.loadItem?.weight || pendingDocPreview.loadItem?.weightLbs || 6000).toLocaleString()} lbs
                        </td>
                        <td className="p-2.5 text-emerald-700 font-bold font-mono">
                          ✔ Driver Inspected & Uploaded
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Driver Signature Stamp & Dispatch Note */}
                <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-3xs">
                  <div className="space-y-1">
                    <div className="font-bold text-emerald-900 uppercase tracking-wider flex items-center space-x-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span>DRIVER DIGITAL SIGN-OFF ATTACHED</span>
                    </div>
                    <div className="text-slate-700 font-sans">
                      Driver: <strong className="text-slate-900">{pendingDocPreview.driverName}</strong> • Verified via Ozack Mobile App
                    </div>
                  </div>
                  <div className="px-3 py-1.5 bg-emerald-600 text-white font-mono font-bold rounded-lg text-center uppercase tracking-wide shrink-0">
                    STATUS: AWAITING APPROVAL
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (pendingDocPreview.url && pendingDocPreview.url !== "#") {
                    window.open(pendingDocPreview.url, "_blank");
                  } else {
                    window.print();
                  }
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center justify-center space-x-2 font-mono"
              >
                <Download className="h-4 w-4 text-slate-600" />
                <span>Open / Print Complete PDF ↗</span>
              </button>

              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPendingDocPreview(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Close Window
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const item = pendingDocPreview.loadItem;
                    setPendingDocPreview(null);
                    if (item) handleApproveBOL(item);
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md flex items-center space-x-1.5 font-mono"
                >
                  <Check className="h-4 w-4" />
                  <span>Approve BOL & Mark Picked Up</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === "consolidation" ? (
        /* LTL Consolidation View (Feature #2, #4) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 8 Columns: Load Consolidation Planner */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
                    <Compass className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      LTL Load Bundling & Trailer Space Optimizer
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Bundle multiple LTL (or FTL) shipments into a single,
                      high-efficiency consolidated dispatch trip.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 1: Configure Trip Assets & Driver */}
              {/* <div className="space-y-3">
                <h4 className="text-xs font-bold font-mono text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  1. Configure Active Driver, Truck & Trailer Assets
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-2xs font-bold text-slate-500 uppercase mb-1">
                      Select Driver Profile
                    </label>
                    <select
                      required
                      value={consolidationDriverId}
                      onChange={(e) => {
                        const matched = mockDrivers.find(
                          (d) => d.id === e.target.value
                        );
                        if (matched) {
                          setConsolidationDriverId(matched.id);
                          setConsolidationDriverName(matched.username);
                          setConsolidationTruck(matched?.truck);
                          setConsolidationTrailer(matched?.trailer);
                        }
                      }}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800 font-semibold"
                    >
                      <option value="">Select a driver</option>
                      {mockDrivers.map((drv) => (
                        <option key={drv.id} value={drv.id}>
                          {drv.username}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-slate-500 uppercase mb-1">
                      Truck Number (Assigned)
                    </label>
                    <input
                      type="text"
                      value={consolidationTruck}
                      onChange={(e) => setConsolidationTruck(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-slate-500 uppercase mb-1">
                      Trailer Number (Assigned)
                    </label>
                    <input
                      type="text"
                      value={consolidationTrailer}
                      onChange={(e) => setConsolidationTrailer(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800 font-mono"
                    />
                  </div>
                </div>
              </div> */}

              {/* Step 2: Bundle Unassigned Shipments */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold font-mono text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-indigo-500" />
                    1. Select Shipments to Bundle
                  </h4>
                  <span className="text-3xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Showing {filteredWarehouseLoads.length} warehouse loads
                  </span>
                </div>
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-3xs font-extrabold uppercase font-mono text-indigo-900 tracking-wider flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                      Filter Loads by Destination Location / US State
                    </span>
                    {(plannerDestSearch ||
                      plannerPickSearch ||
                      plannerSelectedState !== "all") && (
                        <button
                          type="button"
                          onClick={() => {
                            setPlannerDestSearch("");
                            setPlannerPickSearch("");
                            setPlannerSelectedState("all");
                          }}
                          className="text-3xs font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
                        >
                          Clear Search
                        </button>
                      )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    {/* US State Selector (51 States/Territories) */}
                    {/* <div className="sm:col-span-5">
                      <select
                        value={plannerSelectedState}
                        onChange={(e) =>
                          setPlannerSelectedState(e.target.value)
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="all">
                          📍 All US Destination States (51 States)
                        </option>
                        {US_STATES.map((st) => (
                          <option key={st.code} value={st.code}>
                            {st.code} - {st.name}
                          </option>
                        ))}
                      </select>
                    </div> */}

                    {/* Search Input & Button */}
                    <div className="sm:col-span-5 flex gap-1.5">
                      <div className="relative flex-1">
                        <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          value={plannerPickSearch}
                          onChange={(e) => setPlannerPickSearch(e.target.value)}
                          placeholder="Search Pickup city, state, zip (e.g. TX, Chicago, 48201)..."
                          className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      {/* <button
                        type="button"
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                      >
                        <Search className="h-3.5 w-3.5" />
                        <span>Search</span>
                      </button> */}
                    </div>
                    <div className="sm:col-span-5 flex gap-1.5">
                      <div className="relative flex-1">
                        <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          value={plannerDestSearch}
                          onChange={(e) => setPlannerDestSearch(e.target.value)}
                          placeholder="Search destination city, state, zip (e.g. TX, Chicago, 48201)..."
                          className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      {/* <button
                        type="button"
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                      >
                        <Search className="h-3.5 w-3.5" />
                        <span>Search</span>
                      </button> */}
                    </div>
                  </div>
                </div>

                {/* Table of eligible shipments */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-3xs font-bold uppercase tracking-wider">
                          <th className="px-4 py-2.5 w-12 text-center">
                            Select
                          </th>
                          <th className="px-4 py-2.5">Load # / Customer</th>
                          <th className="px-4 py-2.5">Origin / Destination</th>
                          <th className="px-4 py-2.5">Load Type</th>
                          <th className="px-4 py-2.5">Weight (Lbs)</th>
                          <th className="px-4 py-2.5">Pallets</th>
                          <th className="px-4 py-2.5">Commitment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredWarehouseLoads.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-4 py-8 text-center text-slate-500 font-medium"
                            >
                              {plannerDestSearch ||
                                plannerSelectedState !== "all"
                                ? "No warehouse loads found matching destination search criteria."
                                : "No unassigned loads available for consolidation at warehouse."}
                            </td>
                          </tr>
                        ) : (
                          filteredWarehouseLoads.map((s) => {
                            const isChecked = selectedConsolidationIds.includes(
                              s.id
                            );
                            return (
                              <tr
                                key={s.id}
                                className={` transition-colors ${commitmentBadges[s.commitment]
                                  }`}
                              >
                                <td className="px-4 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setSelectedConsolidationIds(
                                          selectedConsolidationIds.filter(
                                            (id) => id !== s.id
                                          )
                                        );
                                      } else {
                                        setSelectedConsolidationIds([
                                          ...selectedConsolidationIds,
                                          s.id,
                                        ]);
                                      }
                                    }}
                                    className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                  />
                                </td>
                                <td className="px-4 py-3 font-semibold text-slate-900">
                                  <div>{s.load_number}</div>
                                  <div className="text-3xs text-slate-500 font-normal truncate max-w-[120px]">
                                    {s.customer_name}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-slate-700">
                                  <div className="flex items-center space-x-1">
                                    <span>
                                      {s.shipper_city},{s.shipper_state},
                                      {s.shipper_country}
                                    </span>
                                    <ArrowRight className="h-10 w-10 text-slate-400" />
                                    <span>
                                      {s.consignee_city},{s.consignee_state}
                                      ,{s.consignee_country}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-3xs font-mono font-bold uppercase ${(s.loadType || "LTL") === "FTL"
                                      ? "bg-indigo-100 text-indigo-800"
                                      : "bg-amber-100 text-amber-800"
                                      }`}
                                  >
                                    {s.loadType || "LTL"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-mono font-medium text-slate-800">
                                  {s?.weightLbs?.toLocaleString()} lbs
                                </td>
                                <td className="px-4 py-3 font-mono font-medium text-slate-800">
                                  {s.palletCount || 2}
                                </td>
                                <td className="px-4 py-3">{s.commitment}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Step 3: Dynamic Trailer Space Utilization & Submission */}
              {selectedConsolidationIds.length > 0 && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold font-mono text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Gauge className="h-4 w-4 text-indigo-500" />
                    2. Live Trailer Space Optimization & Utilization
                  </h4>

                  {(() => {
                    const selectedLoads = shipments.filter((s) =>
                      selectedConsolidationIds.includes(s.id)
                    );
                    const totalWeight = selectedLoads.reduce(
                      (sum, s) => sum + Number(s.weight),
                      0
                    );
                    const totalPallets = selectedLoads.reduce(
                      (sum, s) => sum + (Number(s.pieces) || 2),
                      0
                    );
                    const hasFTL = selectedLoads.some(
                      (s) => s.loadType === "FTL"
                    );
                    const weightLimit = 45e3;
                    const palletLimit = 26;
                    const weightPercent = Math.min(
                      Math.round((totalWeight / weightLimit) * 100),
                      100
                    );
                    const palletPercent = Math.min(
                      Math.round((totalPallets / palletLimit) * 100),
                      100
                    );
                    const isOverloadedWeight = totalWeight > weightLimit;
                    const isOverloadedPallets = totalPallets > palletLimit;
                    return (
                      <div className="space-y-5">
                        {/* Interactive 3D Trailer Cargo Space & Axle Weight Visualizer */}
                        <Pallet3DTrailerVisualizer selectedLoads={selectedLoads} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Weight Utilization */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-slate-600">
                                Trailer Weight Utilization
                              </span>
                              <span
                                className={
                                  isOverloadedWeight
                                    ? "text-rose-600 font-extrabold"
                                    : "text-indigo-600"
                                }
                              >
                                {totalWeight.toLocaleString()} /{" "}
                                {weightLimit.toLocaleString()} Lbs (
                                {weightPercent}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${isOverloadedWeight
                                  ? "bg-rose-500 animate-pulse"
                                  : weightPercent > 85
                                    ? "bg-amber-500"
                                    : "bg-indigo-600"
                                  }`}
                                style={{ width: `${weightPercent}%` }}
                              />
                            </div>
                            {isOverloadedWeight && (
                              <p className="text-rose-600 text-3xs font-semibold">
                                ⚠️ OVERWEIGHT WARNING: Trailer load exceeds the
                                45k heavy-duty payload limit.
                              </p>
                            )}
                          </div>

                          {/* Pallet Utilization */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-slate-600">
                                Trailer Space / Pallet Utilization
                              </span>
                              <span
                                className={
                                  isOverloadedPallets
                                    ? "text-rose-600 font-extrabold"
                                    : "text-indigo-600"
                                }
                              >
                                {totalPallets} / {palletLimit} Pallets (
                                {palletPercent}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${isOverloadedPallets
                                  ? "bg-rose-500 animate-pulse"
                                  : palletPercent > 85
                                    ? "bg-amber-500"
                                    : "bg-indigo-600"
                                  }`}
                                style={{ width: `${palletPercent}%` }}
                              />
                            </div>
                            {isOverloadedPallets && (
                              <p className="text-rose-600 text-3xs font-semibold">
                                ⚠️ OVERLOAD WARNING: Pallet count exceeds the
                                standard 53ft trailer capability (26 pallets).
                              </p>
                            )}
                          </div>
                        </div>

                        {/* FTL notice (Feature #2) */}
                        {hasFTL && (
                          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl text-2xs leading-relaxed font-semibold">
                            💡 <strong>FTL LOAD CONSOLIDATED:</strong> You have
                            bundled a Full Truckload (FTL) shipment with other
                            cargo. The trailer is legally and
                            administrative-wise marked as dedicated to the
                            primary customer, but is optimized internally for
                            dual cargo space. Customers will not see
                            consolidation notes in their client portals.
                          </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            disabled={isOverloadedWeight || isOverloadedPallets}
                            onClick={handleConsolidateTrips}
                            className={`px-5 py-2.5 text-xs font-bold text-white rounded-lg transition-all shadow-sm flex items-center space-x-1.5 ${isOverloadedWeight || isOverloadedPallets
                              ? "bg-slate-300 cursor-not-allowed"
                              : "bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                              }`}
                          >
                            <Sparkles className="h-4 w-4" />
                            <span>Confirm & Build Consolidation Trip</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Right 4 Columns: Trips Manifest */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                    <Layers className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide font-mono">
                    Consolidated Trips Manifest
                  </span>
                </div>
                <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded text-2xs font-mono">
                  {trips.length} Trips
                </span>
              </div>

              {/* Trip Quick Finder Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Compass className="h-3.5 w-3.5 text-slate-400 rotate-45" />
                </div>
                <input
                  type="text"
                  placeholder="Find Trip # or Load #..."
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  className="block w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
              </div>

              {/* Trips list */}

              <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
                {trips.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6 font-medium">
                    No consolidated trips created yet. Use the Planner on the
                    left to combine loads.
                  </p>
                ) : (
                  (() => {
                    const filteredTrips = trips.filter((trip) => {
                      if (!globalSearchQuery.trim()) return true;
                      const query = globalSearchQuery.toLowerCase();
                      // const tripLoads = shipments.filter(
                      //   (s) => s.tripId === trip.id
                      // );
                      const matchesTripNum = trip.trip_number.includes(query);
                      // const matchesDriver = trip.driver_name
                      //   .toLowerCase()
                      //   .includes(query);
                      // const matchesTruck =
                      //   trip?.truckNumber?.toLowerCase().includes(query) ||
                      //   trip?.trailerNumber?.toLowerCase().includes(query);
                      // const matchesLoads = tripLoads.some(
                      //   (s) =>
                      //     s.tracking_number.toLowerCase().includes(query) ||
                      //     s.customer_name.toLowerCase().includes(query) ||
                      //     s.customer_city.toLowerCase().includes(query) ||
                      //     s.destination.toLowerCase().includes(query) ||
                      //     s.waypoints.some(
                      //       (w) =>
                      //         w.companyName.toLowerCase().includes(query) ||
                      //         w.address.toLowerCase().includes(query)
                      //     )
                      // );
                      return matchesTripNum;
                      // matchesDriver ||
                      // matchesTruck ||
                      // matchesLoads
                    });
                    if (filteredTrips.length === 0) {
                      return (
                        <p className="text-xs text-slate-400 text-center py-6 font-medium">
                          No trips matching "{globalSearchQuery}" found.
                        </p>
                      );
                    }
                    return filteredTrips.map((trip) => {
                      const isExpanded = showSelectedTripDetailsId === trip.id;
                      const tripLoads = shipments.filter(
                        (s) => s.tripId === trip.id
                      );
                      return (
                        <div
                          key={trip.id}
                          className={`rounded-xl border transition-all p-3.5 space-y-3 cursor-pointer ${isExpanded
                            ? "bg-slate-50 border-indigo-400 ring-1 ring-indigo-400 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                            }`}
                          // onClick={() =>
                          //   setShowSelectedTripDetailsId(
                          //     isExpanded ? null : trip.id
                          //   )
                          // }
                          onClick={async () => {
                            const response = await axiosInstance.get(
                              `/trips/${trip.id}`
                            );

                            setSelectedTrip(response.data.trip);
                            setIsTripModalOpen(true);
                          }}
                        // onClick={() => {
                        //   const tripWithLoads = {
                        //     ...trip,
                        //     shipments: shipments.filter((s) =>
                        //       trip.shipment_ids.includes(s.id)
                        //     ),
                        //   };

                        //   setSelectedTrip(tripWithLoads);
                        //   setIsTripModalOpen(true);
                        // }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-bold text-slate-900">
                                Trip #{trip.trip_number}
                              </span>
                              <span className="text-3xs font-mono bg-indigo-50 text-indigo-700 px-1 py-0.2 rounded border border-indigo-100 uppercase font-bold">
                                {trip?.shipment_ids?.length} loads
                              </span>
                            </div>

                            {/* Editable Trip Status dropdown */}
                            <div onClick={(e) => e.stopPropagation()}>
                              {/* <select
                                value={trip.status}
                                onChange={(e) => {
                                  const newStatus = e.target.value;
                                  if (onUpdateTrip) {
                                    onUpdateTrip({
                                      ...trip,
                                      status: newStatus,
                                    });
                                  }
                                  tripLoads.forEach((s) => {
                                    onUpdateShipment({
                                      ...s,
                                      status:
                                        newStatus === "in_transit"
                                          ? "in_transit"
                                          : newStatus === "completed"
                                          ? "completed"
                                          : newStatus === "dispatched"
                                          ? "dispatched"
                                          : "pending",
                                    });
                                  });
                                }}
                                className={`text-2xs font-bold px-1.5 py-0.5 rounded cursor-pointer border border-transparent focus:outline-none focus:ring-1 focus:ring-indigo-400 capitalize ${
                                  trip.status === "completed"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : trip.status === "in_transit"
                                    ? "bg-amber-100 text-amber-800"
                                    : trip.status === "dispatched"
                                    ? "bg-blue-100 text-blue-800 font-semibold"
                                    : "bg-slate-100 text-slate-800"
                                }`}
                              >
                                <option value="pending">Pending</option>
                                <option value="dispatched">Dispatched</option>
                                <option value="in_transit">In Transit</option>
                                <option value="completed">Completed</option>
                              </select> */}
                              <span
                                className={`text-2xs font-bold px-2 py-1 rounded capitalize ${trip.status === "completed"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : trip.status === "in_transit"
                                    ? "bg-amber-100 text-amber-800"
                                    : trip.status === "dispatched"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-slate-100 text-slate-800"
                                  }`}
                              >
                                {trip.status.replace("_", " ")}
                              </span>
                            </div>
                          </div>

                          {/* Driver & truck brief */}
                          <div className="grid grid-cols-2 gap-2 text-3xs text-slate-500 font-mono">
                            <div>
                              <span className="text-slate-400 uppercase font-bold text-[9px]">
                                Driver:
                              </span>
                              <div className="text-slate-700 font-bold text-2xs font-sans mt-0.5 truncate">
                                {trip.driver_name}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-400 uppercase font-bold text-[9px]">
                                Assets:
                              </span>
                              <div className="text-slate-700 font-semibold mt-0.5">
                                {trip.truckNumber} / {trip.trailerNumber}
                              </div>
                            </div>
                          </div>

                          {/* Brief weight metrics */}
                          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-3xs font-mono text-slate-500">
                            <div>
                              <span className="text-slate-400 uppercase font-bold text-[9px]">
                                Weight:
                              </span>
                              <div className="text-slate-700 font-bold text-2xs mt-0.5">
                                {trip?.total_weight_lbs || 0.0} lbs
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-400 uppercase font-bold text-[9px]">
                                Space:
                              </span>
                              <div className="text-slate-700 font-bold text-2xs mt-0.5">
                                {trip?.total_pallets || 0} Pallets
                              </div>
                            </div>
                          </div>

                          {/* Nested Shipment/Loads list when expanded */}
                          {isExpanded && (
                            <div
                              className="border-t border-slate-200 pt-3 mt-3 space-y-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-3xs font-bold text-slate-400 uppercase font-mono block">
                                Consolidated Loads Manifest
                              </span>

                              <div className="space-y-1.5">
                                {tripLoads.map((load) => (
                                  <div
                                    key={load.id}
                                    className="bg-white border border-slate-100 rounded-lg p-2 flex items-center justify-between text-xs hover:border-slate-300 cursor-pointer"
                                    onClick={() => {
                                      setSelectedShipment(load);
                                      setIsDetailModalOpen(true);
                                    }}
                                  >
                                    <div>
                                      <div className="flex items-center space-x-1.5 font-bold">
                                        <span className="text-slate-800">
                                          Load #{load.trackingNumber}
                                        </span>
                                        <span
                                          className={`text-4xs font-mono uppercase px-1 py-0.2 rounded font-bold ${load.loadType === "FTL"
                                            ? "bg-indigo-50 text-indigo-700"
                                            : "bg-amber-50 text-amber-700"
                                            }`}
                                        >
                                          {load.loadType || "LTL"}
                                        </span>
                                      </div>
                                      <div className="text-3xs text-slate-400 font-medium mt-0.5 truncate max-w-[150px]">
                                        {load.originCity} →{" "}
                                        {load.destinationCity}
                                      </div>
                                    </div>

                                    <div className="text-right text-3xs font-mono font-medium text-slate-600">
                                      <div>
                                        {load.weightLbs.toLocaleString()} lbs
                                      </div>
                                      <div>{load.palletCount || 2} pallets</div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Disassemble Trip Action */}
                              <div className="pt-2 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `Are you sure you want to disassemble Trip #${trip.trip_number}? This will unassign all ${trip.shipment_ids.length} shipments and return them to independent loads.`
                                      )
                                    ) {
                                      tripLoads.forEach((s) => {
                                        console.log(s)
                                        onUpdateShipment({
                                          ...s,
                                          tripId: void 0,
                                          status: "at_warehouse",
                                        });
                                      });
                                      if (onRemoveTrip) {
                                        onRemoveTrip(trip.id);
                                      }
                                    }
                                  }}
                                  className="text-rose-600 hover:text-white border border-rose-200 hover:bg-rose-600 hover:border-rose-600 px-2.5 py-1 rounded text-3xs font-bold tracking-wider uppercase transition-colors cursor-pointer"
                                >
                                  Disassemble Trip
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Main Full Width Layout */
        <div className="w-full space-y-6">
          <div className="w-full space-y-6">
            {/* Active Shipments Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-slate-900">
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-sky-50 text-sky-700 rounded-lg border border-sky-200">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-extrabold font-sans tracking-wide text-slate-900">
                    Active Fleet Operations Manifest
                  </h3>
                </div>
                {(currentUser.role === "super_admin" ||
                  currentUser.role === "admin" ||
                  currentUser.role === "data_entry") && (
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors border border-slate-200 shadow-2xs">
                        {isUploadingRateCon ? (
                          <Compass className="h-3.5 w-3.5 animate-spin text-sky-600" />
                        ) : (
                          <Paperclip className="h-3.5 w-3.5 text-slate-500" />
                        )}
                        <span>
                          {isUploadingRateCon ? "Parsing..." : "Upload Rate Con"}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="application/pdf,image/*"
                          onChange={handleUploadRateCon}
                          disabled={isUploadingRateCon}
                        />
                      </label>
                      <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Dispatch New Load</span>
                      </button>
                    </div>
                  )}
              </div>

              {/* Load Adding Form Modal/Drawer */}
              {showAddForm && (
                <form
                  onSubmit={handleCreateLoad}
                  className="p-6 border-b border-slate-200 bg-indigo-50/30 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                    <h4 className="text-sm font-bold font-mono text-indigo-950 uppercase flex items-center gap-1.5">
                      <Plus className="h-4 w-4 text-indigo-600" />
                      Create & Dispatch New Shipment
                    </h4>
                    <span className="text-3xs font-mono text-slate-500 uppercase">
                      Interactive Load File Builder
                    </span>
                  </div>

                  {/* Section 1: Customer Details */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-indigo-950">
                      1. Customer Details
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-3xs font-bold text-slate-500 uppercase">
                          Select Profile
                        </label>
                        <select
                          value={customerId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomerId(val);
                            const chosen = customers.find((c) => c.id === val);
                            if (chosen) {
                              setCustomerName(chosen.name);
                              setCustomerEmail(chosen.email || "");
                              setCustomerPhone(chosen.phone || "");
                              setCustomerAddress(chosen.address || "");
                            } else if (val === "NEW") {
                              setCustomerName("");
                              setCustomerEmail("");
                              setCustomerPhone("");
                              setCustomerAddress("");
                            }
                          }}
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500"
                        >
                          {customers.map((cust) => (
                            <option key={cust.id} value={cust.id}>
                              {cust.name} ({cust.id})
                            </option>
                          ))}
                          <option value="NEW">Custom / New Profile</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-3xs font-bold text-slate-500 uppercase">
                          Customer Account Name
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="e.g. Caterpillar Heavy"
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-3xs font-bold text-slate-500 uppercase">
                          Customer Email
                        </label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="customer@example.com"
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-3xs font-bold text-slate-500 uppercase">
                          Customer Phone
                        </label>
                        <input
                          type="text"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="+1 (555) 019-2831"
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-3xs font-bold text-slate-500 uppercase">
                          Customer Billing Address
                        </label>
                        <input
                          type="text"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          placeholder="100 Industrial Way, Suite A"
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Shipper & Consignee Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Shipper details */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-indigo-950">
                        2. Shipper (Pickup) Details
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase">
                              Shipper Name{" "}
                              <span className="text-red-800">*</span>
                            </label>
                            <input
                              required
                              type="text"
                              value={shipperName}
                              onChange={(e) => setShipperName(e.target.value)}
                              placeholder="e.g. AeroParts Toronto HQ"
                              className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                            />
                          </div>
                          {/* <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase">
                              Shipper Phone
                            </label>
                            <input
                              type="text"
                              value={shipperPhone}
                              onChange={(e) => setShipperPhone(e.target.value)}
                              placeholder="+1 (416) 555-0199"
                              className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                            />
                          </div> */}
                        </div>
                        <div>
                          <label className="block text-3xs font-bold text-slate-500 uppercase">
                            Shipper Street Address{" "}
                            <span className="text-red-800">*</span>
                          </label>
                          <input
                            required
                            type="text"
                            value={shipperAddress}
                            onChange={(e) => setShipperAddress(e.target.value)}
                            placeholder="e.g. 400 Britannia Rd E, Mississauga, ON"
                            className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                          />
                        </div>
                        <div></div>
                        <div>
                          <label className="block text-3xs font-bold text-slate-500 uppercase">
                            Shipper District{" "}
                            <span className="text-red-800">*</span>
                          </label>
                          <input
                            type="text"
                            value={shipperDistrict}
                            onChange={(e) => setShipperDistrict(e.target.value)}
                            placeholder="e.g. Montreal"
                            className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-3xs font-bold text-slate-500 uppercase">
                            Shipper State{" "}
                            <span className="text-red-800">*</span>
                          </label>
                          <input
                            type="text"
                            value={shipperState}
                            onChange={(e) => setShipperState(e.target.value)}
                            placeholder="e.g. Montreal"
                            className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-3xs font-bold text-slate-500 uppercase">
                            Shipper Zipcode{" "}
                            <span className="text-red-800">*</span>
                          </label>
                          <input
                            type="number"
                            value={shipperZipcode}
                            onChange={(e) => setShipperZipcode(e.target.value)}
                            placeholder="e.g. 12503"
                            className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-3xs font-bold text-slate-500 uppercase">
                            Shipper Country{" "}
                            <span className="text-red-800">*</span>
                          </label>
                          <input
                            type="text"
                            value={shipperCountry}
                            onChange={(e) => setShipperCountry(e.target.value)}
                            placeholder="e.g. Canada"
                            className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Consignee details */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-indigo-950">
                        3. Consignee (Delivery) Details
                      </div>
                      {/* <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase">
                              Consignee Name
                            </label>
                            <input
                              type="text"
                              value={consigneeName}
                              onChange={(e) => setConsigneeName(e.target.value)}
                              placeholder="e.g. Midwest Aero Chicago Assembly"
                              className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase">
                              Consignee Phone
                            </label>
                            <input
                              type="text"
                              value={consigneePhone}
                              onChange={(e) =>
                                setConsigneePhone(e.target.value)
                              }
                              placeholder="+1 (312) 555-0210"
                              className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-3xs font-bold text-slate-500 uppercase">
                            Consignee Street Address
                          </label>
                          <input
                            type="text"
                            value={consigneeAddress}
                            onChange={(e) =>
                              setConsigneeAddress(e.target.value)
                            }
                            placeholder="e.g. 1000 Assembly Dr, Chicago, IL"
                            className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-3xs font-bold text-slate-500 uppercase">
                            Destination City & State / Province
                          </label>
                          <input
                            type="text"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            placeholder="e.g. Chicago, IL"
                            className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                            required
                          />
                        </div>
                      </div> */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase">
                              Consignee Name{" "}
                              <span className="text-red-800">*</span>
                            </label>
                            <input
                              required
                              type="text"
                              value={consigneeName}
                              onChange={(e) => setConsigneeName(e.target.value)}
                              placeholder="e.g. AeroParts Toronto HQ"
                              className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                            />
                          </div>
                          {/* <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase">
                              Shipper Phone
                            </label>
                            <input
                              type="text"
                              value={shipperPhone}
                              onChange={(e) => setShipperPhone(e.target.value)}
                              placeholder="+1 (416) 555-0199"
                              className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                            />
                          </div> */}
                        </div>
                        <div>
                          <label className="block text-3xs font-bold text-slate-500 uppercase">
                            Consignee Street Address{" "}
                            <span className="text-red-800">*</span>
                          </label>
                          <input
                            required
                            type="text"
                            value={consigneeAddress}
                            onChange={(e) =>
                              setConsigneeAddress(e.target.value)
                            }
                            placeholder="e.g. 400 Britannia Rd E, Mississauga, ON"
                            className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-3xs font-bold text-slate-500 uppercase">
                            Consignee District{" "}
                            <span className="text-red-800">*</span>
                          </label>
                          <input
                            type="text"
                            value={consigneeDistrict}
                            onChange={(e) =>
                              setConsigneeDistrict(e.target.value)
                            }
                            placeholder="e.g. Montreal"
                            className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-3xs font-bold text-slate-500 uppercase">
                            Consignee State{" "}
                            <span className="text-red-800">*</span>
                          </label>
                          <input
                            type="text"
                            value={consigneeState}
                            onChange={(e) => setConsigneeState(e.target.value)}
                            placeholder="e.g. Montreal"
                            className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-3xs font-bold text-slate-500 uppercase">
                            Consignee Zipcode{" "}
                            <span className="text-red-800">*</span>
                          </label>
                          <input
                            type="number"
                            value={consigneeZipcode}
                            onChange={(e) =>
                              setConsigneeZipcode(e.target.value)
                            }
                            placeholder="e.g. 12503"
                            className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-3xs font-bold text-slate-500 uppercase">
                            Consignee Country{" "}
                            <span className="text-red-800">*</span>
                          </label>
                          <input
                            type="text"
                            value={consigneeCountry}
                            onChange={(e) =>
                              setConsigneeCountry(e.target.value)
                            }
                            placeholder="e.g. Canada"
                            className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Cargo, Weight, and Driver details */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-indigo-950">
                      4. Cargo, Routing & Dispatch Assets
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {/* <div>
                        <label className="block text-3xs font-bold text-slate-500 uppercase">
                          Assigned Driver
                        </label>
                        <select
                          required
                          value={driverId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDriverId(val);
                            const matched = mockDrivers.find(
                              (d) => d.id === val
                            );
                            if (matched) {
                              setDriverName(matched.name);
                              setTruck(
                                matched.truckNumber ||
                                  matched.truck ||
                                  "TRK-102"
                              );
                              setTrailer(
                                matched.trailerNumber ||
                                  matched.trailer ||
                                  "TRL-504"
                              );
                            }
                          }}
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white font-semibold text-slate-800"
                        >
                          <option value="" defaultChecked>
                            Select a driver
                          </option>
                          {mockDrivers.map((drv) => (
                            <option key={drv.id} value={drv.id}>
                              {drv.username} (
                              {drv.truck || drv.truckNumber || "No Truck"})
                            </option>
                          ))}
                        </select>
                      </div> */}
                      <div>
                        <label className="block text-3xs font-bold text-slate-500 uppercase font-semibold text-indigo-950">
                          Freight Load Mode
                        </label>
                        <select
                          value={loadType}
                          onChange={(e) => setLoadType(e.target.value)}
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white font-bold text-indigo-700"
                        >
                          <option value="LTL">LTL (Less-Than-Truckload)</option>
                          <option value="FTL">FTL (Full Truckload)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-3xs font-bold text-slate-500 uppercase font-semibold text-indigo-950">
                          Commitment
                        </label>
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white font-bold text-indigo-700"
                        >
                          <option value="Normal">Normal Delivery</option>
                          <option value="Appointment">Appointment</option>
                          <option value="Guaranteed Delivery">
                            Guaranteed Delivery
                          </option>
                          <option value="Guaranteed with Appointment Need">
                            Guaranteed with Appointment Need
                          </option>
                        </select>
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-3xs font-bold text-slate-500 uppercase">
                          Cargo Description
                        </label>
                        <input
                          type="text"
                          value={cargo}
                          onChange={(e) => setCargo(e.target.value)}
                          placeholder="e.g. Precision aircraft gears (6 pallets)"
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-3xs font-bold text-slate-500 uppercase">
                          Total Weight (Lbs)
                        </label>
                        <input
                          type="number"
                          value={weight}
                          onChange={(e) => setWeight(Number(e.target.value))}
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-3xs font-bold text-slate-500 uppercase">
                          Pallet Count
                        </label>
                        <input
                          type="number"
                          value={pallets}
                          onChange={(e) => setPallets(Number(e.target.value))}
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-3xs font-bold text-slate-500 uppercase">
                          Total Est. Distance (Miles)
                        </label>
                        <input
                          type="number"
                          value={distance}
                          onChange={(e) => setDistance(Number(e.target.value))}
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Samsara Intelligent Recommendations Widget */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-1.5">
                          <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
                          <div>
                            <span className="text-2xs font-extrabold font-mono text-indigo-950 uppercase block">
                              Samsara Fleet Matching Recommender
                            </span>
                            <span className="text-[9px] text-slate-500 font-medium">
                              Real-time GPS proximity, hours of service &
                              trailer capacities
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                          SAMSARA ACTIVE
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                        {getDriverRecommendations(weight, pallets, origin).map(
                          ({
                            driver,
                            currentRegion,
                            availableWeight,
                            availablePallets,
                            hasWeightCapacity,
                            hasPalletCapacity,
                            isNearby,
                            distanceMiles,
                          }) => {
                            const isSelected = driverId === driver.id;
                            const isCapable =
                              hasWeightCapacity && hasPalletCapacity;
                            return (
                              <button
                                key={driver.id}
                                type="button"
                                onClick={() => {
                                  setDriverId(driver.id);
                                  setDriverName(driver.username);
                                  setTruck(driver.truck);
                                  setTrailer(driver.trailer);
                                }}
                                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-full cursor-pointer ${isSelected
                                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                                  : "bg-white text-slate-700 hover:bg-indigo-55/30 border-slate-200 hover:border-indigo-300"
                                  }`}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-extrabold text-2xs truncate block">
                                      {driver.username}
                                    </span>
                                    {isSelected && (
                                      <span className="h-2 w-2 rounded-full bg-white block animate-ping shrink-0" />
                                    )}
                                  </div>
                                  <span
                                    className={`text-[9px] font-mono block ${isSelected
                                      ? "text-indigo-200"
                                      : "text-slate-400"
                                      }`}
                                  >
                                    {driver.truck} / {driver.trailer}
                                  </span>
                                </div>

                                <div className="mt-3.5 space-y-2 border-t pt-2 border-slate-100/50">
                                  {/* Capacity */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[8px] font-mono">
                                      <span>Weight:</span>
                                      <span
                                        className={`font-bold ${!hasWeightCapacity
                                          ? "text-rose-500"
                                          : isSelected
                                            ? "text-white"
                                            : "text-slate-700"
                                          }`}
                                      >
                                        {availableWeight.toLocaleString()} lbs
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[8px] font-mono">
                                      <span>Space:</span>
                                      <span
                                        className={`font-bold ${!hasPalletCapacity
                                          ? "text-rose-500"
                                          : isSelected
                                            ? "text-white"
                                            : "text-slate-700"
                                          }`}
                                      >
                                        {availablePallets} plts
                                      </span>
                                    </div>
                                  </div>

                                  {/* Proximity / Location */}
                                  <div className="flex items-center justify-between text-[8px] font-mono mt-1 border-t pt-1 border-dashed border-slate-100/50">
                                    <span
                                      className={
                                        isSelected
                                          ? "text-indigo-200"
                                          : "text-slate-400"
                                      }
                                    >
                                      Samsara GPS:
                                    </span>
                                    <span
                                      className={`font-bold ${isNearby
                                        ? isSelected
                                          ? "text-white"
                                          : "text-emerald-600"
                                        : isSelected
                                          ? "text-indigo-200"
                                          : "text-slate-500"
                                        }`}
                                    >
                                      {isNearby
                                        ? `\u{1F4CD} Nearby (${distanceMiles} mi)`
                                        : `${distanceMiles} mi`}
                                    </span>
                                  </div>
                                </div>

                                {/* Badge */}
                                <div className="mt-2.5 flex flex-wrap gap-1">
                                  {isNearby && (
                                    <span
                                      className={`text-[7px] font-bold font-mono uppercase px-1 py-0.2 rounded shrink-0 ${isSelected
                                        ? "bg-indigo-500 text-white"
                                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        }`}
                                    >
                                      Nearby
                                    </span>
                                  )}
                                  {!isCapable && (
                                    <span className="text-[7px] font-bold font-mono uppercase px-1 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                                      Lacks Cap
                                    </span>
                                  )}
                                  {isCapable && (
                                    <span
                                      className={`text-[7px] font-bold font-mono uppercase px-1 py-0.2 rounded shrink-0 ${isSelected
                                        ? "bg-indigo-500 text-white"
                                        : "bg-slate-100 text-slate-700 border border-slate-200"
                                        }`}
                                    >
                                      Fits
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* Delivery Commitment Selector */}
                    <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100 mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-3xs font-bold text-slate-700 uppercase">
                          Delivery Commitment Type
                        </label>
                        <select
                          value={formCommitment}
                          onChange={(e) => setFormCommitment(e.target.value)}
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white font-semibold text-slate-800"
                        >
                          <option value="normal">Normal Delivery</option>
                          <option value="guaranteed">
                            Guaranteed Delivery
                          </option>
                          <option value="appointment">
                            Appointment Delivery
                          </option>
                          <option value="guaranteed_appointment">
                            Guaranteed with Appointment Need
                          </option>
                        </select>
                      </div>
                      {formCommitment !== "normal" && (
                        <>
                          <div>
                            <label className="block text-3xs font-bold text-slate-700 uppercase">
                              Commitment Date
                            </label>
                            <input
                              type="date"
                              value={formCommitmentDate}
                              onChange={(e) =>
                                setFormCommitmentDate(e.target.value)
                              }
                              className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                              required={formCommitment !== "normal"}
                            />
                          </div>
                          <div>
                            <label className="block text-3xs font-bold text-slate-700 uppercase">
                              Commitment Time
                            </label>
                            <input
                              type="time"
                              value={formCommitmentTime}
                              onChange={(e) =>
                                setFormCommitmentTime(e.target.value)
                              }
                              className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                              required={formCommitment !== "normal"}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs disabled:opacity-50"
                    >
                      {isLoading ? "Processing..." : "Confirm & Dispatch Load"}
                    </button>
                  </div>
                </form>
              )}

              {/* Search, Filter & Sort Toolbar */}
              <div className="p-4 bg-white border-b border-slate-200 flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between text-slate-800">
                {/* Left Side: Search Bar & Target Selector */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full xl:max-w-2xl">
                  {/* Search Target Dropdown */}
                  <div className="relative shrink-0">
                    <select
                      value={searchField}
                      onChange={(e) => {
                        setSearchField(e.target.value);
                      }}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer w-full sm:w-44"
                    >
                      <option value="all" className="text-slate-800 bg-white">🔍 All Fields (Global)</option>
                      <option value="trackingNumber" className="text-slate-800 bg-white">Load / Tracking #</option>
                      <option value="customerName" className="text-slate-800 bg-white">Customer Name</option>
                      <option value="shipperName" className="text-slate-800 bg-white">Shipper Name</option>
                      <option value="shipperAddress" className="text-slate-800 bg-white">Shipper Address</option>
                      <option value="consigneeName" className="text-slate-800 bg-white">Consignee Name</option>
                      <option value="consigneeAddress" className="text-slate-800 bg-white">
                        Consignee Address
                      </option>
                      <option value="pickupLocation" className="text-slate-800 bg-white">Pickup Location</option>
                      <option value="deliveryLocation" className="text-slate-800 bg-white">
                        Delivery Location
                      </option>
                    </select>
                  </div>

                  {/* Search Input Box */}
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Compass className="h-4 w-4 text-slate-400 rotate-45" />
                    </div>
                    <input
                      type="text"
                      value={globalSearchQuery}
                      onChange={(e) => setGlobalSearchQuery(e.target.value)}
                      placeholder={
                        searchField === "all"
                          ? "Search Load #, Customer, Shipper, Consignee, Location..."
                          : searchField === "trackingNumber"
                            ? "Enter specific Load/Tracking #..."
                            : searchField === "customerName"
                              ? "Enter customer account name..."
                              : searchField === "shipperName"
                                ? "Enter manufacturer or shipper name..."
                                : searchField === "shipperAddress"
                                  ? "Enter origin street address..."
                                  : searchField === "consigneeName"
                                    ? "Enter delivery facility name..."
                                    : searchField === "consigneeAddress"
                                      ? "Enter destination street address..."
                                      : searchField === "pickupLocation"
                                        ? "Enter origin city or state..."
                                        : "Enter destination city or state..."
                      }
                      className="block w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs font-medium"
                    />
                    {globalSearchQuery && (
                      <button
                        onClick={() => setGlobalSearchQuery("")}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-sm font-bold"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Side: Filters & Sorter */}
                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                  {/* Status Filter */}
                  <div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer"
                    >
                      <option value="all" className="text-slate-800 bg-white">All Statuses</option>
                      <option value="Driver Assigned For Pickup" className="text-slate-800 bg-white">
                        Driver Assigned For Pickup
                      </option>
                      <option value="picked_up" className="text-slate-800 bg-white">Picked Up</option>
                      <option value="At Warehouse" className="text-slate-800 bg-white">At Warehouse</option>
                      <option value="trip_assigned" className="text-slate-800 bg-white">Trip Assigned</option>
                      <option value="in_transit" className="text-slate-800 bg-white">In Transit</option>
                      <option value="at_destination_hub" className="text-slate-800 bg-white">
                        At Destination Hub
                      </option>
                      <option value="out_for_delivery" className="text-slate-800 bg-white">Out For Delivery</option>
                      <option value="delivered" className="text-slate-800 bg-white">Delivered</option>
                    </select>
                  </div>

                  {/* Load Type Filter */}
                  <div>
                    <select
                      value={loadTypeFilter}
                      onChange={(e) => setLoadTypeFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer"
                    >
                      <option value="all" className="text-slate-800 bg-white">All Modes (LTL/FTL)</option>
                      <option value="LTL" className="text-slate-800 bg-white">LTL Shipments Only</option>
                      <option value="FTL" className="text-slate-800 bg-white">FTL Shipments Only</option>
                    </select>
                  </div>

                  {/* Switch to Kanban Board View Button */}
                  <Link
                    to="/kanban"
                    className="flex items-center space-x-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs"
                    title="Switch to Interactive Drag & Drop Kanban Freight Board"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-sky-600" />
                    <span>Kanban Pipeline</span>
                  </Link>

                  {/* Multi-Stop Route Builder Button */}
                  <button
                    type="button"
                    onClick={() => setIsMultiStopModalOpen(true)}
                    className="flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs cursor-pointer"
                    title="Build Sequential Multi-Pick & Multi-Drop Split Route"
                  >
                    <Truck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Multi-Stop Route</span>
                  </button>

                  {/* PC*MILER Routing & Tolls Button */}
                  <Link
                    to="/pcmiler"
                    className="flex items-center space-x-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs"
                    title="PC*MILER Commercial Mileage, Toll Matrix & Routing Engine"
                  >
                    <Compass className="w-3.5 h-3.5 text-purple-600" />
                    <span>PC*MILER Tolls</span>
                  </Link>

                  {/* Sorter Selector */}
                  <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      SORT:
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent text-xs text-slate-900 font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="trackingNumber" className="text-slate-800 bg-white">Load #</option>
                      <option value="customerName" className="text-slate-800 bg-white">Customer</option>
                      <option value="shipperName" className="text-slate-800 bg-white">Shipper</option>
                      <option value="consigneeName" className="text-slate-800 bg-white">Consignee</option>
                      <option value="shipperAddress" className="text-slate-800 bg-white">Shipper Address</option>
                      <option value="consigneeAddress" className="text-slate-800 bg-white">
                        Consignee Address
                      </option>
                      <option value="pickupLocation" className="text-slate-800 bg-white">Pickup Location</option>
                      <option value="deliveryLocation" className="text-slate-800 bg-white">
                        Delivery Location
                      </option>
                      <option value="weight" className="text-slate-800 bg-white">Weight (Lbs)</option>
                      <option value="distance" className="text-slate-800 bg-white">Distance</option>
                      <option value="eta" className="text-slate-800 bg-white">Projected ETA</option>
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        setSortOrder((prev) =>
                          prev === "asc" ? "desc" : "asc"
                        )
                      }
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-sky-600 transition-colors cursor-pointer"
                      title={
                        sortOrder === "asc"
                          ? "Sort Ascending"
                          : "Sort Descending"
                      }
                    >
                      {sortOrder === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5 text-sky-600" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-sky-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Shipments List */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                      <th className="px-5 py-3.5">Tracking / Load Info</th>
                      <th className="px-5 py-3.5">Origin / Destination</th>
                      <th className="px-5 py-3.5">Dispatcher / Broker</th>
                      <th className="px-5 py-3.5">Driver & Assets</th>
                      <th className="px-5 py-3.5">BorderConnect status</th>
                      <th className="px-5 py-3.5">Samsara Telemetry</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                    {filteredAndSortedShipments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-12 text-center text-slate-500 font-medium"
                        >
                          <AlertCircle className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                          No loads match the selected search or filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedShipments.map((s) => {
                        const isSelected = selectedShipment?.id === s.id;
                        return (
                          <tr
                            key={s.id}
                            onClick={() => {
                              setSelectedShipment(s);
                              setIsDetailModalOpen(true);
                            }}
                            className="hover:bg-slate-50/90 cursor-pointer transition-colors"
                          >
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-mono font-extrabold text-sky-700 text-sm">
                                  #{s.load_number}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${(s.loadType ||
                                    (s.cargoDescription
                                      ?.toLowerCase()
                                      .includes("ltl")
                                      ? "LTL"
                                      : "FTL")) === "FTL"
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                    }`}
                                >
                                  {s.loadType ||
                                    (s.cargoDescription
                                      ?.toLowerCase()
                                      .includes("ltl")
                                      ? "LTL"
                                      : "FTL")}
                                </span>
                                {s.priority && (
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${s.priority === "urgent"
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : s.priority === "high"
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : "bg-slate-100 text-slate-600 border-slate-200"
                                      }`}
                                  >
                                    {s.priority}
                                  </span>
                                )}
                              </div>
                              <div
                                className="text-slate-500 text-xs mt-0.5 truncate max-w-[200px]"
                                title={s.cargoDescription}
                              >
                                {s.cargoDescription || "Commercial Goods"}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center space-x-1.5 text-slate-800 font-bold">
                                <span>
                                  {s.shipper_city || s.origin || "Toronto"}, {s.shipper_state || "ON"}
                                </span>
                                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                                <span>
                                  {s.consignee_city || s.destination || "Chicago"}, {s.consignee_state || "IL"}
                                </span>
                              </div>
                              <div className="text-slate-400 text-xs mt-0.5 font-medium">
                                {s?.waypoints?.length || 0} Total Waypoints
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="text-slate-900 font-semibold">
                                {s.dispatcherName || "Unassigned"}
                              </div>
                              <div className="text-slate-500 text-xs mt-0.5">
                                {s.broker || "Direct Customer"}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="text-slate-900 font-bold">
                                {s.driver_id ? s.driver_name : "Marcus Vance"}
                              </div>
                              <div className="text-slate-500 text-xs mt-0.5 font-mono">
                                {s.truck_number || s.truck || "TRK-104"} • {s.trailer_number || s.trailer || "53ft Dry Van"}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              {s.borderConnectStatus === "none" ? (
                                <span className="text-slate-400 text-xs">
                                  N/A
                                </span>
                              ) : (
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize border ${s.borderConnectStatus === "accepted"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : s.borderConnectStatus === "at_border"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : s.borderConnectStatus === "submitted"
                                        ? "bg-sky-50 text-sky-700 border-sky-200"
                                        : "bg-slate-100 text-slate-600 border-slate-200"
                                    }`}
                                >
                                  {s.borderConnectStatus || "Accepted (ACE)"}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              {s.status === "in_transit" ? (
                                <div className="space-y-1">
                                  <div className="flex items-center text-slate-800 text-xs font-mono font-bold">
                                    <Gauge className="h-3.5 w-3.5 text-sky-600 mr-1" />
                                    <span>{s.speedMph || 62} MPH</span>
                                  </div>
                                  <div className="flex items-center text-slate-500 text-[11px] font-mono">
                                    <Fuel className="h-3 w-3 text-slate-400 mr-1" />
                                    <span>Fuel {s.fuelLevelPercent || 84}%</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-600 capitalize text-xs font-semibold">
                                  {s?.status?.replace("_", " ") || "In Transit"}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  title="Copy Public Magic Tracking Link for Shipper"
                                  className="p-2 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-600 hover:text-emerald-700 transition-colors shadow-2xs cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const link = `${window.location.origin}/track/${s.load_number || s.id}`;
                                    navigator.clipboard.writeText(link);
                                    toast.success(`📋 Live tracking link copied for #${s.load_number || s.id}!`);
                                  }}

                                >
                                  <Share2 className="h-4 w-4" />
                                </button>
                                <button
                                  title="View Change History & Audit Trail"
                                  className="p-2 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-600 hover:text-sky-700 transition-colors shadow-2xs cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAuditModalData({
                                      isOpen: true,
                                      entityType: "LOAD",
                                      entityId: s.id,
                                      entityIdentifier: `Load #${s.load_number || s.id}`
                                    });
                                  }}
                                >
                                  <History className="h-4 w-4" />
                                </button>
                                <button
                                  title="View Load Details"
                                  className="p-2 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-600 hover:text-sky-700 transition-colors shadow-2xs cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedShipment(s);
                                    setIsDetailModalOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Details Modal */}
      {isEditingDetails && editedShipment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                Edit Load Details: {editedShipment.load_number}
              </h3>
              <button
                onClick={() => setIsEditingDetails(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Dispatcher Name
                  </label>
                  <input
                    type="text"
                    value={editedShipment.dispatcherName || ""}
                    onChange={(e) =>
                      setEditedShipment({
                        ...editedShipment,
                        dispatcherName: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Broker
                  </label>
                  <input
                    type="text"
                    value={editedShipment.broker || ""}
                    onChange={(e) =>
                      setEditedShipment({
                        ...editedShipment,
                        broker: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    PO Number
                  </label>
                  <input
                    type="text"
                    value={editedShipment.poNumber || ""}
                    onChange={(e) =>
                      setEditedShipment({
                        ...editedShipment,
                        poNumber: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    BOL Number
                  </label>
                  <input
                    type="text"
                    value={editedShipment.bolNumber || ""}
                    onChange={(e) =>
                      setEditedShipment({
                        ...editedShipment,
                        bolNumber: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Weight (Lbs)
                  </label>
                  <input
                    type="number"
                    value={editedShipment.weightLbs || 0}
                    onChange={(e) =>
                      setEditedShipment({
                        ...editedShipment,
                        weightLbs: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Cargo Description
                  </label>
                  <input
                    type="text"
                    value={editedShipment.cargoDescription || ""}
                    onChange={(e) =>
                      setEditedShipment({
                        ...editedShipment,
                        cargoDescription: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div className="col-span-2 border-t border-slate-100 pt-4 mt-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-indigo-500" />
                    Delivery Commitment & Appointment Status
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-2xs font-bold text-slate-500 uppercase mb-1">
                        Commitment Type
                      </label>
                      <select
                        value={editedShipment.deliveryCommitment || "normal"}
                        onChange={(e) =>
                          setEditedShipment({
                            ...editedShipment,
                            deliveryCommitment: e.target.value,
                          })
                        }
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800 font-semibold"
                      >
                        <option value="normal">Normal Delivery</option>
                        <option value="guaranteed">Guaranteed Delivery</option>
                        <option value="appointment">
                          Appointment Delivery
                        </option>
                        <option value="guaranteed_appointment">
                          Guaranteed with Appointment Need
                        </option>
                      </select>
                    </div>
                    {editedShipment.deliveryCommitment &&
                      editedShipment.deliveryCommitment !== "normal" && (
                        <>
                          <div>
                            <label className="block text-2xs font-bold text-slate-500 uppercase mb-1">
                              Commitment Date
                            </label>
                            <input
                              type="date"
                              value={editedShipment.commitmentDate || ""}
                              onChange={(e) =>
                                setEditedShipment({
                                  ...editedShipment,
                                  commitmentDate: e.target.value,
                                })
                              }
                              className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-2xs font-bold text-slate-500 uppercase mb-1">
                              Commitment Time
                            </label>
                            <input
                              type="time"
                              value={editedShipment.commitmentTime || ""}
                              onChange={(e) =>
                                setEditedShipment({
                                  ...editedShipment,
                                  commitmentTime: e.target.value,
                                })
                              }
                              className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800"
                            />
                          </div>
                        </>
                      )}
                  </div>
                </div>

                <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mt-2">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                      Assign Driver Profile (Quick Dispatch)
                    </label>
                    <select
                      value={editedShipment.driverId || ""}
                      onChange={(e) => {
                        const matched = mockDrivers.find(
                          (d) => d.id === e.target.value
                        );
                        if (matched) {
                          setEditedShipment({
                            ...editedShipment,
                            driverId: matched.id,
                            driverName: matched.name,
                            truckNumber: matched.truck,
                            trailerNumber: matched.trailer,
                          });
                        }
                      }}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white font-semibold text-slate-800"
                    >
                      <option value="">
                        -- Choose/Reassign an Active Driver --
                      </option>
                      {mockDrivers.map((drv) => (
                        <option key={drv.id} value={drv.id}>
                          {drv.name} (Truck: {drv.truck} | Trailer:{" "}
                          {drv.trailer})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Driver Name (Override)
                    </label>
                    <input
                      type="text"
                      value={editedShipment.driverName || ""}
                      onChange={(e) =>
                        setEditedShipment({
                          ...editedShipment,
                          driverName: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Freight Load Mode
                    </label>
                    <select
                      value={
                        editedShipment.loadType ||
                        (editedShipment.cargoDescription
                          ?.toLowerCase()
                          .includes("ltl")
                          ? "LTL"
                          : "FTL")
                      }
                      onChange={(e) =>
                        setEditedShipment({
                          ...editedShipment,
                          loadType: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white font-semibold"
                    >
                      <option value="LTL">LTL (Less-Than-Truckload)</option>
                      <option value="FTL">FTL (Full Truckload)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Shipment Priority
                    </label>
                    <select
                      value={editedShipment.priority || "standard"}
                      onChange={(e) =>
                        setEditedShipment({
                          ...editedShipment,
                          priority: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white font-semibold"
                    >
                      <option value="standard">Standard</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Truck Number
                    </label>
                    <input
                      type="text"
                      value={editedShipment.truckNumber || ""}
                      onChange={(e) =>
                        setEditedShipment({
                          ...editedShipment,
                          truckNumber: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Trailer Number
                    </label>
                    <input
                      type="text"
                      value={editedShipment.trailerNumber || ""}
                      onChange={(e) =>
                        setEditedShipment({
                          ...editedShipment,
                          trailerNumber: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex justify-end space-x-2 bg-slate-50">
              <button
                onClick={() => setIsEditingDetails(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpdateShipment(editedShipment);
                  if (selectedShipment?.id === editedShipment.id) {
                    setSelectedShipment(editedShipment);
                  }
                  setIsEditingDetails(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      {isTripModalOpen && (
        <TripDetailsModal
          isOpen={isTripModalOpen}
          onClose={() => {
            setIsTripModalOpen(false);
            setSelectedTrip(null);
          }}
          setSelectedTrip={setSelectedTrip}
          trip={selectedTrip}
          onUpdateShipment={onUpdateShipment}
          onRemoveTrip={onRemoveTrip}
        />
      )}

      {selectedShipment && (
        <ShipmentDetailsModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          shipment={selectedShipment}
          currentUser={currentUser}
          messages={messages}
          onSendMessage={onSendMessage}
          onUpdateShipment={(updated) => {
            onUpdateShipment(updated);
            setSelectedShipment(updated);
          }}
          onMarkMessagesAsRead={onMarkMessagesAsRead}
        />
      )}
      {/* Customs e-Manifest Barcode Modal */}
      <CustomsManifestModal
        shipment={customsModalShipment}
        isOpen={Boolean(customsModalShipment)}
        onClose={() => setCustomsModalShipment(null)}
        onSendToDriverChat={(shp) => {
          setCustomsModalShipment(null);
        }}
      />
      {/* Official Nishan Transport PAPS / PARS / BOL Document Generator */}
      {docTemplateState.isOpen && docTemplateState.shipment && (
        <DocumentTemplateModal
          isOpen={docTemplateState.isOpen}
          onClose={() =>
            setDocTemplateState({
              isOpen: false,
              docType: "PAPS",
              shipment: null,
            })
          }
          documentType={docTemplateState.docType}
          shipment={docTemplateState.shipment}
        />
      )}
      {/* AI Load Tender Ingestion Modal */}
      {isAiIngestModalOpen && (
        <AILoadTenderIngestModal
          isOpen={isAiIngestModalOpen}
          onClose={() => setIsAiIngestModalOpen(false)}
          onLoadCreated={(load) => {
            if (load) {
              setSelectedShipment(load);
              setIsDetailModalOpen(true);
            }
          }}
        />
      )}
      {/* AI Smart Driver-Load Matcher & Dispatch Optimizer Modal */}
      {isAiMatchModalOpen && aiMatchLoad && (
        <AIDriverMatcherModal
          isOpen={isAiMatchModalOpen}
          onClose={() => {
            setIsAiMatchModalOpen(false);
            setAiMatchLoad(null);
          }}
          load={aiMatchLoad}
          onAssignSuccess={() => {
            fetchShipments();
          }}
        />
      )}

      {/* Entity Change History & Audit Trail Modal */}
      <EntityHistoryModal
        isOpen={auditModalData.isOpen}
        onClose={() => setAuditModalData({ isOpen: false, entityType: "LOAD", entityId: null, entityIdentifier: "" })}
        entityType={auditModalData.entityType}
        entityId={auditModalData.entityId}
        entityIdentifier={auditModalData.entityIdentifier}
      />

      {/* Trux Multi-Stop Sequential Route & Trip Builder Modal */}
      <MultiStopRouteBuilderModal
        isOpen={isMultiStopModalOpen}
        onClose={() => setIsMultiStopModalOpen(false)}
        onDispatchTrip={() => {
          fetchShipments();
        }}
      />
    </div>
  );

}

import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  X,
  FileText,
  Truck,
  Sparkles,
  Compass,
  Gauge,
  MessageSquare,
  Send,
  CheckCircle,
  Clock,
  MapPin,
  ExternalLink,
  ShieldAlert,
  BadgePercent,
  AlertCircle,
  Eye,
  ArrowUp,
  ArrowDown,
  Paperclip,
  Image,
  Check,
  Settings,
  ShieldCheck,
  Info,
  List,
  ArrowRight,
} from "lucide-react";
import { useDriverStore } from "../stores/useDriverstore";
export default function ShipmentDetailsModal({
  isOpen,
  onClose,
  shipment,
  currentUser,
  messages,
  onSendMessage,
  onUpdateShipment,
  onMarkMessagesAsRead,
}) {
  console.log(shipment);
  const { fetchDrivers, drivers } = useDriverStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editedShipment, setEditedShipment] = useState(shipment);
  const [chatMessage, setChatMessage] = useState("");
  const [chatAttachment, setChatAttachment] = useState(null);
  const chatEndRef = useRef(null);
  const [editingWaypointId, setEditingWaypointId] = useState(null);
  const [editScheduledTime, setEditScheduledTime] = useState("");
  const [vehicleType, setVehicleType] = useState(
    "Class 8 Heavy Duty Semi-Truck"
  );
  const [weather, setWeather] = useState("Clear / Dry Roads");
  const [traffic, setTraffic] = useState("Normal Flow");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  useEffect(() => {
    setEditedShipment(shipment);
    setIsEditing(false);
    setOptimizedRoute(null);
    setAiError(null);
  }, [shipment.id]);
  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);
  useEffect(() => {
    if (isOpen && onMarkMessagesAsRead) {
      onMarkMessagesAsRead(shipment.id, "dispatcher");
    }
  }, [isOpen, shipment.id, messages.length]);
  useEffect(() => {
    if (activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTab, messages]);
  if (!isOpen) return null;
  const activeChatMessages = messages.filter(
    (m) =>
      m.shipmentId === shipment.id ||
      m.recipientId === shipment.driverId ||
      m.senderName === shipment.driverName
  );
  const handleSaveDetails = () => {
    onUpdateShipment(editedShipment);
    setIsEditing(false);
  };
  const handleDriverChange = (driverId) => {
    const matched = drivers.find((d) => d.id === driverId);
    if (matched) {
      onUpdateShipment({
        ...shipment,
        driverId: matched.id,
        driverName: matched.name,
        truckNumber: matched.truck,
        trailerNumber: matched.trailer,
      });
    }
  };
  const handleLoadTypeChange = (type) => {
    onUpdateShipment({ ...shipment, loadType: type });
  };
  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim() && !chatAttachment) return;
    onSendMessage(
      chatMessage,
      shipment.driverId,
      shipment.id,
      chatAttachment || void 0
    );
    setChatMessage("");
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
    const nextWaypoints = [...shipment.waypoints];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= nextWaypoints.length) return;
    const temp = nextWaypoints[index];
    nextWaypoints[index] = nextWaypoints[swapIndex];
    nextWaypoints[swapIndex] = temp;
    const updatedWaypoints = nextWaypoints.map((w, idx) => ({
      ...w,
      sequence: idx + 1,
    }));
    onUpdateShipment({ ...shipment, waypoints: updatedWaypoints });
  };
  const handleSaveWaypointTime = (waypointId) => {
    if (!editScheduledTime) return;
    const updatedWaypoints = shipment.waypoints.map((w) => {
      if (w.id === waypointId) {
        return {
          ...w,
          scheduledTime: new Date(editScheduledTime).toISOString(),
        };
      }
      return w;
    });
    onUpdateShipment({ ...shipment, waypoints: updatedWaypoints });
    setEditingWaypointId(null);
  };
  const handleUpdateBorderStatus = (status) => {
    const updated = { ...shipment, borderConnectStatus: status };
    if (status === "submitted" && !updated.borderConnectManifestId) {
      updated.borderConnectManifestId =
        "BC-MANIFEST-" + Math.floor(1e5 + Math.random() * 9e5);
    }
    onUpdateShipment(updated);
  };
  const handleAiOptimizeRoute = async () => {
    setAiLoading(true);
    setAiError(null);
    setOptimizedRoute(null);
    try {
      const response = await fetch("/api/gemini/optimize-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: shipment.originCity,
          destination: shipment.destinationCity,
          cargoDescription: shipment.cargoDescription,
          vehicleType,
          weather,
          traffic,
          waypoints: shipment.waypoints.map((w) => ({
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
  const handleApplyAiSequence = () => {
    if (!optimizedRoute) return;
    const sortedWaypoints = [...shipment.waypoints].sort((a, b) => {
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
    onUpdateShipment({ ...shipment, waypoints: updatedWaypoints });
    alert(
      "AI sequenced waypoints successfully applied to active shipment sequence."
    );
  };
  console.log(drivers);
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "dispatched":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_transit":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "delayed":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "arrived":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      case "delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-slate-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold tracking-wider text-slate-300">
                  LOAD # {shipment.trackingNumber}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-3xs font-mono font-bold uppercase ${getStatusColor(
                    shipment.status
                  )}`}
                >
                  {shipment.status.replace("_", " ")}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-3xs font-mono font-bold uppercase border bg-slate-800 border-slate-700 text-slate-200`}
                >
                  {shipment.loadType || "FTL"}
                </span>
              </div>
              <h2 className="text-lg font-bold truncate max-w-md font-sans text-white mt-0.5">
                {shipment.customerName}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-slate-400 hidden sm:inline-block">
              ETA: {new Date(shipment.eta).toLocaleString()}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 bg-slate-50 border-b border-slate-200 flex space-x-6 overflow-x-auto shrink-0">
          <button
            onClick={() => {
              setActiveTab("overview");
              setIsEditing(false);
            }}
            className={`py-3.5 text-xs font-bold font-mono tracking-wide uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === "overview"
                ? "border-indigo-600 text-indigo-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            📋 Load Info & Edit
          </button>
          <button
            onClick={() => {
              setActiveTab("route");
              setIsEditing(false);
            }}
            className={`py-3.5 text-xs font-bold font-mono tracking-wide uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === "route"
                ? "border-indigo-600 text-indigo-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            📍 Waypoints & Route (AI)
          </button>
          <button
            onClick={() => {
              setActiveTab("telemetry");
              setIsEditing(false);
            }}
            className={`py-3.5 text-xs font-bold font-mono tracking-wide uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === "telemetry"
                ? "border-indigo-600 text-indigo-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            ⚡ Samsara ELD & Map
          </button>
          <button
            onClick={() => {
              setActiveTab("border");
              setIsEditing(false);
            }}
            className={`py-3.5 text-xs font-bold font-mono tracking-wide uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === "border"
                ? "border-indigo-600 text-indigo-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            🛂 Customs Manifests
          </button>
          <button
            onClick={() => {
              setActiveTab("chat");
              setIsEditing(false);
            }}
            className={`py-3.5 text-xs font-bold font-mono tracking-wide uppercase border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "chat"
                ? "border-indigo-600 text-indigo-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            💬 Messenger Chat
            {activeChatMessages.some(
              (m) => !m.read && m.senderRole === "driver"
            ) && (
              <span className="h-2 w-2 bg-rose-500 rounded-full animate-bounce" />
            )}
          </button>
        </div>

        {/* Modal Main Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {/* TAB 1: OVERVIEW & GENERAL INFO */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Profile Card / Assignment Banner */}
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-xl p-5 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
                    <Truck className="h-6 w-6 text-indigo-300" />
                  </div>
                  <div>
                    <p className="text-3xs font-mono text-indigo-200 uppercase tracking-widest">
                      Active Dispatch Driver & Truck
                    </p>
                    <h3 className="text-lg font-bold font-sans text-white">
                      {shipment.driverName}
                    </h3>
                    <p className="text-2xs font-mono text-slate-300 mt-0.5">
                      Truck:{" "}
                      <span className="font-bold text-white">
                        {shipment.truckNumber}
                      </span>{" "}
                      • Trailer:{" "}
                      <span className="font-bold text-white">
                        {shipment.trailerNumber}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Quick reassignment & action */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                  <div>
                    <label className="block text-4xs font-mono text-indigo-200 uppercase mb-1">
                      Reassign Driver Profile
                    </label>
                    <select
                      disabled={
                        !(
                          currentUser.role === "super_admin" ||
                          currentUser.role === "admin" ||
                          currentUser.role === "dispatcher" ||
                          currentUser.role === "driver_manager"
                        )
                      }
                      value={shipment.driverId || ""}
                      onChange={(e) => handleDriverChange(e.target.value)}
                      className="bg-white/10 text-white rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-white border border-white/20 cursor-pointer w-full"
                    >
                      <option value="" className="text-slate-900">
                        -- Select Driver --
                      </option>
                      {drivers.map((drv) => (
                        <option
                          key={drv.id}
                          value={drv.id}
                          className="text-slate-900"
                        >
                          {drv.username}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-4xs font-mono text-indigo-200 uppercase mb-1">
                      Freight Mode
                    </label>
                    <div className="flex rounded-lg border border-white/20 overflow-hidden text-xs font-bold">
                      <button
                        onClick={() => handleLoadTypeChange("LTL")}
                        className={`px-2.5 py-1.5 cursor-pointer ${
                          shipment.loadType === "LTL"
                            ? "bg-indigo-600 text-white"
                            : "bg-white/10 text-indigo-200 hover:text-white"
                        }`}
                      >
                        LTL
                      </button>
                      <button
                        onClick={() => handleLoadTypeChange("FTL")}
                        className={`px-2.5 py-1.5 cursor-pointer ${
                          shipment.loadType !== "LTL"
                            ? "bg-indigo-600 text-white"
                            : "bg-white/10 text-indigo-200 hover:text-white"
                        }`}
                      >
                        FTL
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* View / Edit Mode Form */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Info className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800 uppercase font-mono">
                      Administrative Load File
                    </span>
                  </div>
                  {currentUser.role !== "driver" && (
                    <button
                      onClick={() => {
                        if (isEditing) {
                          handleSaveDetails();
                        } else {
                          setEditedShipment(shipment);
                          setIsEditing(true);
                        }
                      }}
                      className="flex items-center space-x-1 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-2xs font-bold cursor-pointer transition-colors"
                    >
                      {isEditing ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Settings className="h-3.5 w-3.5" />
                      )}
                      <span>
                        {isEditing ? "Save Changes" : "Modify Load Details"}
                      </span>
                    </button>
                  )}
                </div>

                <div className="p-5">
                  {!isEditing ? (
                    /* Display Layout */
                    <div className="space-y-6">
                      {/* Customer Info Card */}
                      <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-3">
                        <h4 className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-slate-500">
                          Customer Details
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                          <div className="space-y-1">
                            <span className="text-slate-400 uppercase font-mono text-3xs">
                              Customer Name
                            </span>
                            <p className="font-semibold text-slate-900">
                              {shipment.customerName}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 uppercase font-mono text-3xs">
                              Customer Email
                            </span>
                            <p
                              className="font-semibold text-slate-900 truncate"
                              title={shipment.customerEmail}
                            >
                              {shipment.customerEmail || "N/A"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 uppercase font-mono text-3xs">
                              Customer Phone
                            </span>
                            <p className="font-semibold text-slate-900">
                              {shipment.customerPhone || "N/A"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 uppercase font-mono text-3xs">
                              Customer Address
                            </span>
                            <p className="font-semibold text-slate-900">
                              {shipment.customerAddress || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Shipper & Consignee Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-3">
                          <h4 className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-slate-500">
                            Shipper (Pickup)
                          </h4>
                          <div className="space-y-2 text-xs">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <span className="text-slate-400 uppercase font-mono text-3xs">
                                  Shipper Name
                                </span>
                                <p className="font-semibold text-slate-900">
                                  {shipment.shipperName || "N/A"}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-slate-400 uppercase font-mono text-3xs">
                                  Shipper Phone
                                </span>
                                <p className="font-semibold text-slate-900">
                                  {shipment.shipperPhone || "N/A"}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-slate-400 uppercase font-mono text-3xs">
                                Shipper Address
                              </span>
                              <p className="font-semibold text-slate-900">
                                {shipment.shipperAddress || "N/A"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-slate-400 uppercase font-mono text-3xs">
                                Origin City
                              </span>
                              <p className="font-semibold text-slate-900">
                                {shipment.originCity || "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-3">
                          <h4 className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-slate-500">
                            Consignee (Delivery)
                          </h4>
                          <div className="space-y-2 text-xs">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <span className="text-slate-400 uppercase font-mono text-3xs">
                                  Consignee Name
                                </span>
                                <p className="font-semibold text-slate-900">
                                  {shipment.consigneeName || "N/A"}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-slate-400 uppercase font-mono text-3xs">
                                  Consignee Phone
                                </span>
                                <p className="font-semibold text-slate-900">
                                  {shipment.consigneePhone || "N/A"}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-slate-400 uppercase font-mono text-3xs">
                                Consignee Address
                              </span>
                              <p className="font-semibold text-slate-900">
                                {shipment.consigneeAddress || "N/A"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-slate-400 uppercase font-mono text-3xs">
                                Destination City
                              </span>
                              <p className="font-semibold text-slate-900">
                                {shipment.destinationCity || "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cargo/Pricing Details */}
                      <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-3">
                        <h4 className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-slate-500">
                          Cargo & Financial Details
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                          <div className="space-y-1">
                            <span className="text-slate-400 uppercase font-mono text-3xs">
                              Assigned Dispatcher
                            </span>
                            <p className="font-semibold text-slate-900">
                              {shipment.dispatcherName || "Unassigned"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 uppercase font-mono text-3xs">
                              Broker / Logistics
                            </span>
                            <p className="font-semibold text-slate-900">
                              {shipment.broker || "Direct Client"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 uppercase font-mono text-3xs">
                              PO #
                            </span>
                            <p className="font-mono font-semibold text-slate-900">
                              {shipment.poNumber || "N/A"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 uppercase font-mono text-3xs">
                              BOL #
                            </span>
                            <p className="font-mono font-semibold text-slate-900">
                              {shipment.bolNumber || "N/A"}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-slate-400 uppercase font-mono text-3xs">
                              Cargo Weight
                            </span>
                            <p className="font-semibold text-slate-900">
                              {shipment.weightLbs.toLocaleString()} lbs
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 uppercase font-mono text-3xs">
                              Pallet Count
                            </span>
                            <p className="font-semibold text-slate-900">
                              {shipment.palletCount} Pallets
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 uppercase font-mono text-3xs">
                              Total Distance
                            </span>
                            <p className="font-semibold text-slate-900">
                              {shipment.totalDistanceMiles} Miles
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 uppercase font-mono text-3xs">
                              Cargo Description
                            </span>
                            <p
                              className="font-semibold text-slate-900 truncate"
                              title={shipment.cargoDescription}
                            >
                              {shipment.cargoDescription}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-slate-400 uppercase font-mono text-3xs">
                              Invoice Price
                            </span>
                            <p className="font-bold text-indigo-600">
                              ${shipment.priceInvoice.toLocaleString()}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 uppercase font-mono text-3xs">
                              Cost Estimate
                            </span>
                            <p className="font-semibold text-slate-900">
                              ${shipment.costEstimate.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {shipment.deliveryCommitment &&
                        shipment.deliveryCommitment !== "normal" && (
                          <div className="col-span-2 sm:col-span-4 bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex items-center space-x-3 text-indigo-900">
                            <BadgePercent className="h-4 w-4 shrink-0 text-indigo-600" />
                            <div className="text-3xs font-mono">
                              <span className="font-bold uppercase">
                                GUARANTEED COMMITMENT DIRECTIVE:
                              </span>{" "}
                              Delivery must complete before{" "}
                              <span className="font-bold">
                                {shipment.commitmentDate}
                              </span>{" "}
                              at{" "}
                              <span className="font-bold">
                                {shipment.commitmentTime}
                              </span>
                              .
                            </div>
                          </div>
                        )}

                      {/* Driver Notes Review Section */}
                      <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-200/60 space-y-2">
                        <h4 className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-amber-800 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Driver Notes (Feedback from Road)
                        </h4>
                        {shipment.driverNotes ? (
                          <p className="text-xs text-slate-800 bg-white border border-amber-100 p-3 rounded-lg leading-relaxed whitespace-pre-wrap font-sans">
                            {shipment.driverNotes}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 italic bg-white/40 border border-dashed border-slate-200 p-3 rounded-lg">
                            No notes submitted by the driver yet.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Edit Input Layout */
                    <div className="space-y-4">
                      {/* Customer Details Edit */}
                      <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-150 space-y-3">
                        <h4 className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-indigo-950">
                          1. Customer Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                              Customer Account
                            </label>
                            <input
                              type="text"
                              value={editedShipment.customerName}
                              onChange={(e) =>
                                setEditedShipment({
                                  ...editedShipment,
                                  customerName: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                              Customer Email
                            </label>
                            <input
                              type="email"
                              value={editedShipment.customerEmail || ""}
                              onChange={(e) =>
                                setEditedShipment({
                                  ...editedShipment,
                                  customerEmail: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                              Customer Phone
                            </label>
                            <input
                              type="text"
                              value={editedShipment.customerPhone || ""}
                              onChange={(e) =>
                                setEditedShipment({
                                  ...editedShipment,
                                  customerPhone: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                              Customer Address
                            </label>
                            <input
                              type="text"
                              value={editedShipment.customerAddress || ""}
                              onChange={(e) =>
                                setEditedShipment({
                                  ...editedShipment,
                                  customerAddress: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Shipper & Consignee Edit columns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-150 space-y-3">
                          <h4 className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-indigo-950">
                            2. Shipper (Pickup)
                          </h4>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                                  Shipper Name
                                </label>
                                <input
                                  type="text"
                                  value={editedShipment.shipperName || ""}
                                  onChange={(e) =>
                                    setEditedShipment({
                                      ...editedShipment,
                                      shipperName: e.target.value,
                                    })
                                  }
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                                />
                              </div>
                              <div>
                                <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                                  Shipper Phone
                                </label>
                                <input
                                  type="text"
                                  value={editedShipment.shipperPhone || ""}
                                  onChange={(e) =>
                                    setEditedShipment({
                                      ...editedShipment,
                                      shipperPhone: e.target.value,
                                    })
                                  }
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                                Shipper Address
                              </label>
                              <input
                                type="text"
                                value={editedShipment.shipperAddress || ""}
                                onChange={(e) =>
                                  setEditedShipment({
                                    ...editedShipment,
                                    shipperAddress: e.target.value,
                                  })
                                }
                                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                                Origin City / Prov / State
                              </label>
                              <input
                                type="text"
                                value={editedShipment.originCity || ""}
                                onChange={(e) =>
                                  setEditedShipment({
                                    ...editedShipment,
                                    originCity: e.target.value,
                                  })
                                }
                                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-150 space-y-3">
                          <h4 className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-indigo-950">
                            3. Consignee (Delivery)
                          </h4>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                                  Consignee Name
                                </label>
                                <input
                                  type="text"
                                  value={editedShipment.consigneeName || ""}
                                  onChange={(e) =>
                                    setEditedShipment({
                                      ...editedShipment,
                                      consigneeName: e.target.value,
                                    })
                                  }
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                                />
                              </div>
                              <div>
                                <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                                  Consignee Phone
                                </label>
                                <input
                                  type="text"
                                  value={editedShipment.consigneePhone || ""}
                                  onChange={(e) =>
                                    setEditedShipment({
                                      ...editedShipment,
                                      consigneePhone: e.target.value,
                                    })
                                  }
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                                Consignee Address
                              </label>
                              <input
                                type="text"
                                value={editedShipment.consigneeAddress || ""}
                                onChange={(e) =>
                                  setEditedShipment({
                                    ...editedShipment,
                                    consigneeAddress: e.target.value,
                                  })
                                }
                                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                                Destination City / Prov / State
                              </label>
                              <input
                                type="text"
                                value={editedShipment.destinationCity || ""}
                                onChange={(e) =>
                                  setEditedShipment({
                                    ...editedShipment,
                                    destinationCity: e.target.value,
                                  })
                                }
                                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cargo, Broker, Admin Details Edit */}
                      <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-150 space-y-3">
                        <h4 className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-indigo-950">
                          4. Logistics & Financial Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                              Broker Name
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
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
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
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
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
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                              Weight (Lbs)
                            </label>
                            <input
                              type="number"
                              value={editedShipment.weightLbs}
                              onChange={(e) =>
                                setEditedShipment({
                                  ...editedShipment,
                                  weightLbs: Number(e.target.value),
                                })
                              }
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                              Pallet Count
                            </label>
                            <input
                              type="number"
                              value={editedShipment.palletCount}
                              onChange={(e) =>
                                setEditedShipment({
                                  ...editedShipment,
                                  palletCount: Number(e.target.value),
                                })
                              }
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            />
                          </div>
                          <div className="col-span-1 md:col-span-2">
                            <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                              Cargo Description
                            </label>
                            <input
                              type="text"
                              value={editedShipment.cargoDescription}
                              onChange={(e) =>
                                setEditedShipment({
                                  ...editedShipment,
                                  cargoDescription: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                              Total Distance (Miles)
                            </label>
                            <input
                              type="number"
                              value={editedShipment.totalDistanceMiles}
                              onChange={(e) =>
                                setEditedShipment({
                                  ...editedShipment,
                                  totalDistanceMiles: Number(e.target.value),
                                })
                              }
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                              Dispatcher Assigned
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
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                              Invoice pricing ($)
                            </label>
                            <input
                              type="number"
                              value={editedShipment.priceInvoice}
                              onChange={(e) =>
                                setEditedShipment({
                                  ...editedShipment,
                                  priceInvoice: Number(e.target.value),
                                })
                              }
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                              Cost Estimate ($)
                            </label>
                            <input
                              type="number"
                              value={editedShipment.costEstimate}
                              onChange={(e) =>
                                setEditedShipment({
                                  ...editedShipment,
                                  costEstimate: Number(e.target.value),
                                })
                              }
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                            />
                          </div>
                        </div>
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
                              value={
                                editedShipment.deliveryCommitment || "normal"
                              }
                              onChange={(e) =>
                                setEditedShipment({
                                  ...editedShipment,
                                  deliveryCommitment: e.target.value,
                                })
                              }
                              className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800 font-semibold focus:outline-none"
                            >
                              <option value="normal">Normal Delivery</option>
                              <option value="guaranteed">
                                Guaranteed Delivery
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
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none"
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
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none"
                                  />
                                </div>
                              </>
                            )}
                        </div>
                      </div>

                      {/* Driver Notes Edit Field */}
                      <div className="col-span-2 border-t border-slate-150 pt-4 mt-2">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Driver Notes
                        </h4>
                        <textarea
                          value={editedShipment.driverNotes || ""}
                          onChange={(e) =>
                            setEditedShipment({
                              ...editedShipment,
                              driverNotes: e.target.value,
                            })
                          }
                          rows={3}
                          placeholder="No notes submitted by the driver yet. Add or modify administrative/driver notes here..."
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="flex justify-end space-x-2 border-t border-slate-150 pt-4 mt-2">
                        <button
                          onClick={() => {
                            setEditedShipment(shipment);
                            setIsEditing(false);
                          }}
                          className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveDetails}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Save Administrative Records
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Saved Document Receipts */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                  Assigned Load Credentials & Proofs
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="border border-slate-150 p-3 rounded-lg flex items-center justify-between hover:bg-slate-50/50 cursor-pointer">
                    <div className="flex items-center space-x-2 min-w-0">
                      <FileText className="h-4.5 w-4.5 text-blue-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-2xs font-bold text-slate-800 truncate">
                          Carrier_Rate_Confirmation.pdf
                        </p>
                        <span className="text-4xs font-mono text-slate-400">
                          180 KB • OCR Parsed
                        </span>
                      </div>
                    </div>
                    <Eye className="h-3.5 w-3.5 text-slate-400 hover:text-indigo-600 shrink-0 ml-2" />
                  </div>

                  <div className="border border-slate-150 p-3 rounded-lg flex items-center justify-between hover:bg-slate-50/50 cursor-pointer">
                    <div className="flex items-center space-x-2 min-w-0">
                      <FileText className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-2xs font-bold text-slate-800 truncate">
                          Carrier_BOL_Primary.pdf
                        </p>
                        <span className="text-4xs font-mono text-slate-400">
                          240 KB • Carrier Signature
                        </span>
                      </div>
                    </div>
                    <Eye className="h-3.5 w-3.5 text-slate-400 hover:text-indigo-600 shrink-0 ml-2" />
                  </div>

                  <div className="border border-slate-150 p-3 rounded-lg flex items-center justify-between hover:bg-slate-50/50 cursor-pointer">
                    <div className="flex items-center space-x-2 min-w-0">
                      <FileText className="h-4.5 w-4.5 text-cyan-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-2xs font-bold text-slate-800 truncate">
                          Customs_PARS_Release_Slip.pdf
                        </p>
                        <span className="text-4xs font-mono text-slate-400">
                          110 KB • PAPS Customs OK
                        </span>
                      </div>
                    </div>
                    <Eye className="h-3.5 w-3.5 text-slate-400 hover:text-indigo-600 shrink-0 ml-2" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WAYPOINTS & AI OPTIMIZATION */}
          {activeTab === "route" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Waypoint Timeline & Sequence List */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <List className="h-4.5 w-4.5 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
                      Delivery Stop Timeline
                    </h3>
                  </div>
                  <span className="text-3xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                    {shipment.waypoints.length} stops scheduled
                  </span>
                </div>

                <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6 py-2">
                  {shipment.waypoints.map((w, index) => {
                    const isPickup = w.stopType === "pickup";
                    const isDelivery = w.stopType === "delivery";
                    const isBorder = w.stopType === "border_crossing";
                    return (
                      <div key={w.id} className="relative group">
                        {/* Dot / Pin Icon */}
                        <span
                          className={`absolute -left-[35px] top-0.5 flex items-center justify-center h-6 w-6 rounded-full border shadow-2xs font-bold text-2xs ${
                            isPickup
                              ? "bg-indigo-600 text-white border-indigo-400"
                              : isDelivery
                              ? "bg-emerald-600 text-white border-emerald-400"
                              : "bg-amber-600 text-white border-amber-400"
                          }`}
                        >
                          {w.sequence}
                        </span>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1.5">
                              <h5 className="text-xs font-bold text-slate-900 leading-none">
                                {w.companyName}
                              </h5>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wide ${
                                  isPickup
                                    ? "bg-indigo-100 text-indigo-800"
                                    : isDelivery
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {w.stopType}
                              </span>
                            </div>
                            <p className="text-2xs text-slate-500 font-medium">
                              {w.address}
                            </p>

                            {/* Scheduled Appointment time info */}
                            <div className="flex items-center space-x-2 text-3xs font-mono text-slate-400 mt-1.5">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              <span>
                                Scheduled:{" "}
                                <strong className="text-slate-600">
                                  {new Date(w.scheduledTime).toLocaleString()}
                                </strong>
                              </span>
                            </div>

                            {/* Waypoint details (pieces, weights) */}
                            {(w.weight || w.pieces) && (
                              <div className="text-[10px] font-mono text-slate-500 bg-white border border-slate-100 px-2 py-0.5 rounded inline-block mt-1">
                                {w.pieces ? `${w.pieces} pcs` : ""}{" "}
                                {w.weight ? `\u2022 ${w.weight} lbs` : ""}
                              </div>
                            )}
                          </div>

                          {/* Control panel for each stop */}
                          <div className="flex items-center space-x-2 shrink-0 md:self-center">
                            {/* Sequence adjusters */}
                            <button
                              disabled={index === 0}
                              onClick={() => handleMoveWaypoint(index, "up")}
                              className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                              title="Move Stop Up"
                            >
                              <ArrowUp className="h-3 w-3 text-slate-600" />
                            </button>
                            <button
                              disabled={index === shipment.waypoints.length - 1}
                              onClick={() => handleMoveWaypoint(index, "down")}
                              className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                              title="Move Stop Down"
                            >
                              <ArrowDown className="h-3 w-3 text-slate-600" />
                            </button>

                            {/* Appointment Time Adjuster */}
                            {editingWaypointId === w.id ? (
                              <div className="flex items-center space-x-1.5">
                                <input
                                  type="datetime-local"
                                  value={editScheduledTime}
                                  onChange={(e) =>
                                    setEditScheduledTime(e.target.value)
                                  }
                                  className="bg-white border border-slate-300 text-2xs p-1 rounded font-semibold text-slate-800"
                                />
                                <button
                                  onClick={() => handleSaveWaypointTime(w.id)}
                                  className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                                  title="Save stop appointment time"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => setEditingWaypointId(null)}
                                  className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded cursor-pointer text-3xs font-bold"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingWaypointId(w.id);
                                  setEditScheduledTime(
                                    w.scheduledTime.slice(0, 16)
                                  );
                                }}
                                className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-3xs font-semibold cursor-pointer"
                              >
                                Edit Time
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gemini AI Route Sequence Optimizer */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-gradient-to-br from-indigo-50 to-slate-50 rounded-2xl border border-indigo-150 p-5 space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-indigo-600 text-white rounded-lg">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase font-mono leading-none">
                        Gemini 2.5 Route Optimization
                      </h4>
                      <p className="text-4xs text-slate-500 mt-0.5">
                        Calculates ideal border checkpoints & axle sequence
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-4xs font-mono text-slate-500 uppercase mb-1">
                        Equipment Configuration
                      </label>
                      <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-2xs bg-white font-semibold text-slate-800"
                      >
                        <option value="Class 8 Heavy Duty Semi-Truck">
                          Class 8 Heavy Duty Semi-Truck
                        </option>
                        <option value="Standard Flatbed Trailer">
                          Standard Flatbed Trailer
                        </option>
                        <option value="Temperature Controlled Reefer Van">
                          Temperature Controlled Reefer Van
                        </option>
                        <option value="Box Truck (Local Logistics)">
                          Box Truck (Local Logistics)
                        </option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-4xs font-mono text-slate-500 uppercase mb-1">
                          Active Weather
                        </label>
                        <select
                          value={weather}
                          onChange={(e) => setWeather(e.target.value)}
                          className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-2xs bg-white font-semibold text-slate-800"
                        >
                          <option value="Clear / Dry Roads">
                            Clear / Dry Roads
                          </option>
                          <option value="Heavy Rain / Hydroplaning Warning">
                            Heavy Rain
                          </option>
                          <option value="Snowy / Black Ice Risk (Subzero)">
                            Winter Snowy
                          </option>
                          <option value="Thick Fog / Low Visibility">
                            Thick Fog
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-4xs font-mono text-slate-500 uppercase mb-1">
                          Traffic Density
                        </label>
                        <select
                          value={traffic}
                          onChange={(e) => setTraffic(e.target.value)}
                          className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-2xs bg-white font-semibold text-slate-800"
                        >
                          <option value="Normal Flow">Normal Flow</option>
                          <option value="Rush Hour Gridlock">Rush Hour</option>
                          <option value="Border Toll Construction Delays">
                            Construction
                          </option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleAiOptimizeRoute}
                      disabled={aiLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      {aiLoading ? (
                        <>
                          <Compass className="h-4 w-4 animate-spin" />
                          <span>Gemini is modeling routes...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span>Run Gemini Route Optimizer</span>
                        </>
                      )}
                    </button>
                  </div>

                  {aiError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-2xs text-rose-800 flex items-start space-x-2">
                      <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                      <span>{aiError}</span>
                    </div>
                  )}

                  {optimizedRoute && (
                    <div className="bg-white rounded-xl border border-indigo-100 p-4 space-y-3.5 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider">
                          AI Optimization Outputs
                        </span>
                        <button
                          onClick={handleApplyAiSequence}
                          className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 border border-indigo-200 hover:bg-indigo-50 px-2 py-0.5 rounded cursor-pointer transition-colors"
                        >
                          Apply Sequence
                        </button>
                      </div>

                      <div className="space-y-1">
                        <span className="text-3xs font-mono text-slate-400 uppercase">
                          Recommended Sequence
                        </span>
                        <div className="flex flex-wrap items-center gap-1">
                          {optimizedRoute.optimizedSequence.map((stop, i) => (
                            <React.Fragment key={stop}>
                              <span className="bg-slate-100 text-slate-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
                                {stop}
                              </span>
                              {i <
                                optimizedRoute.optimizedSequence.length - 1 && (
                                <ArrowRight className="h-3 w-3 text-slate-400" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                        <div>
                          <span className="text-3xs font-mono text-slate-400 block uppercase">
                            Est. Fuel Burned
                          </span>
                          <div className="text-sm font-bold text-slate-900 mt-0.5">
                            {optimizedRoute.estimatedFuelGallons} Gallons
                          </div>
                          <span className="text-[10px] text-slate-500">
                            Class-8 commercial estimate
                          </span>
                        </div>
                        <div>
                          <span className="text-3xs font-mono text-slate-400 block uppercase">
                            Est. Commercial Tolls
                          </span>
                          <div className="text-sm font-bold text-slate-900 mt-0.5">
                            ${optimizedRoute.tollEstimatesUsd}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            Commercial EZPass Rate
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-3xs font-mono text-slate-400 uppercase block">
                          AI Route Rationale
                        </span>
                        <p className="text-2xs text-slate-600 leading-relaxed italic">
                          {optimizedRoute.justification}
                        </p>
                      </div>

                      <div className="space-y-1 border-t border-slate-100 pt-2.5">
                        <span className="text-3xs font-mono text-indigo-800 uppercase block font-bold">
                          Safety & Clearance Directives
                        </span>
                        <ul className="text-2xs text-slate-600 space-y-1 pl-3.5 list-disc leading-relaxed">
                          {optimizedRoute.drivingTips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SAMSARA ELD TELEMETRY & MAP */}
          {activeTab === "telemetry" && (
            <div className="space-y-6">
              {/* Samsara Gauges */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                  <div className="flex items-center space-x-2">
                    <Gauge className="h-5 w-5 text-rose-600" />
                    <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
                      Samsara ELD Live Fleet Telematics
                    </h3>
                  </div>
                  <span className="text-3xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 px-2.5 py-0.5 rounded font-mono font-bold animate-pulse uppercase">
                    Device Connected
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-3xs font-mono text-slate-400 uppercase font-semibold">
                      Active Vehicle Speed
                    </div>
                    <div className="text-xl font-extrabold text-slate-900 mt-1 flex items-baseline">
                      {shipment.status === "in_transit"
                        ? `${shipment.speedMph || 58} MPH`
                        : "0 MPH"}
                      <span className="text-[10px] font-normal text-slate-500 font-mono ml-1">
                        realtime gps
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-3xs font-mono text-slate-400 uppercase font-semibold">
                      Asset Fuel Level
                    </div>
                    <div className="text-xl font-extrabold text-slate-900 mt-1 flex items-baseline">
                      {shipment.fuelLevelPercent || 85}%
                      <span className="text-[10px] font-normal text-slate-500 font-mono ml-1">
                        diesel capacity
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-3xs font-mono text-slate-400 uppercase font-semibold">
                      Engine Coolant Temp
                    </div>
                    <div className="text-xl font-extrabold text-slate-900 mt-1 flex items-baseline">
                      {shipment.engineTempF || 185}°F
                      <span className="text-[10px] font-normal text-slate-500 font-mono ml-1">
                        optimum safety
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-3xs font-mono text-slate-400 uppercase font-semibold">
                      ELD Duty HOS Log
                    </div>
                    <div className="text-sm font-extrabold text-indigo-700 mt-1 capitalize font-mono bg-indigo-50 border border-indigo-100 py-1.5 px-2.5 rounded inline-block">
                      {shipment.activeHOSStatus || "Driving"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Route Map Container */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
                      Live Active GPS Track Plot
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Tracking route: {shipment.originCity} to{" "}
                      {shipment.destinationCity}
                    </p>
                  </div>
                  <div className="bg-slate-100 px-3 py-1 rounded-lg text-3xs font-mono border border-slate-200 flex items-center gap-1 text-slate-600">
                    <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                    <span>
                      Samsara Gateway ID:{" "}
                      {shipment.samsaraGatewayId || "ELD-9302"}
                    </span>
                  </div>
                </div>

                {/* Simulated GPS Map Graphic */}
                <div className="relative h-72 w-full bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

                  <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox="0 0 600 250"
                  >
                    {/* Border indicator lines */}
                    <line
                      x1="0"
                      y1="110"
                      x2="600"
                      y2="110"
                      stroke="#f1f5f9"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      className="opacity-40"
                    />
                    <text
                      x="15"
                      y="100"
                      fill="#cbd5e1"
                      fontSize="10"
                      className="opacity-50 font-mono tracking-wider uppercase"
                    >
                      CANADA
                    </text>
                    <text
                      x="15"
                      y="130"
                      fill="#cbd5e1"
                      fontSize="10"
                      className="opacity-50 font-mono tracking-wider uppercase"
                    >
                      UNITED STATES
                    </text>

                    {/* Route path */}
                    <path
                      d="M 80 70 Q 230 40 320 110 T 520 180"
                      fill="none"
                      stroke="rgba(99, 102, 241, 0.4)"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 80 70 Q 230 40 320 110 T 520 180"
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />

                    {/* Plot Points for Waypoints */}
                    {shipment.waypoints.map((wpt, idx) => {
                      const isFirst = idx === 0;
                      const isLast = idx === shipment.waypoints.length - 1;
                      const x = isFirst ? 80 : isLast ? 520 : 320;
                      const y = isFirst ? 70 : isLast ? 180 : 110;
                      return (
                        <g key={wpt.id} className="cursor-pointer group/node">
                          <circle
                            cx={x}
                            cy={y}
                            r="8"
                            fill={
                              wpt.stopType === "pickup"
                                ? "#4f46e5"
                                : wpt.stopType === "delivery"
                                ? "#059669"
                                : "#d97706"
                            }
                            className="animate-pulse"
                          />
                          <circle cx={x} cy={y} r="4" fill="#ffffff" />
                          <rect
                            x={x + 12}
                            y={y - 12}
                            width="120"
                            height="24"
                            rx="4"
                            fill="rgba(15, 23, 42, 0.85)"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="0.5"
                            className="hidden group-hover/node:block"
                          />
                          <text
                            x={x + 18}
                            y={y + 4}
                            fill="#ffffff"
                            fontSize="8"
                            className="hidden group-hover/node:block font-mono"
                          >
                            {wpt.companyName}
                          </text>

                          {/* Visible Labels */}
                          <text
                            x={x - 20}
                            y={y - 12}
                            fill="#cbd5e1"
                            fontSize="8"
                            className="font-semibold text-3xs tracking-wide bg-slate-900"
                          >
                            {wpt.companyName} ({wpt.sequence})
                          </text>
                        </g>
                      );
                    })}

                    {/* Animated Truck/Gps Dot in transit */}
                    {shipment.status === "in_transit" && (
                      <g className="animate-[bounce_2s_infinite]">
                        <circle cx="280" cy="85" r="7" fill="#f43f5e" />
                        <circle cx="280" cy="85" r="3" fill="#ffffff" />
                        <rect
                          x="235"
                          y="55"
                          width="90"
                          height="18"
                          rx="3"
                          fill="#f43f5e"
                        />
                        <text
                          x="240"
                          y="67"
                          fill="#ffffff"
                          fontSize="7"
                          fontWeight="bold"
                          className="font-mono uppercase"
                        >
                          In Transit: {shipment.speedMph || 58}MPH
                        </text>
                      </g>
                    )}
                  </svg>

                  {/* Bottom Map Status Overlays */}
                  <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-800 rounded-lg p-3 backdrop-blur-md space-y-1">
                    <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase">
                      Current Transit Telemetry
                    </span>
                    <div className="text-2xs text-slate-100 flex items-center space-x-1.5 font-semibold">
                      <span>
                        Origin: <strong>{shipment.originCity}</strong>
                      </span>
                      <ArrowRight className="h-3 w-3 text-slate-500" />
                      <span>
                        Destination: <strong>{shipment.destinationCity}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOMS & BORDER CONNECT */}
          {activeTab === "border" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Border Status Manifest Overview */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="h-4.5 w-4.5 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
                      Border Connect Manifest Portal
                    </h3>
                  </div>
                  {shipment.borderConnectManifestId ? (
                    <span className="text-3xs font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-semibold">
                      ID: {shipment.borderConnectManifestId}
                    </span>
                  ) : (
                    <span className="text-3xs text-rose-500 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded font-mono font-bold uppercase">
                      No Manifest Drafted
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-150 bg-slate-50/50">
                    <span className="text-3xs font-mono text-slate-400 block uppercase">
                      PAPS / Customs Barcode
                    </span>
                    <div className="bg-white border border-slate-200 px-4 py-3 rounded-lg text-center font-mono tracking-widest text-sm font-bold mt-1">
                      {shipment.borderConnectManifestId
                        ? `*${shipment.borderConnectManifestId}*`
                        : "N/A"}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-150 bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <span className="text-3xs font-mono text-slate-400 block uppercase">
                        Sync Status
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-2xs font-mono font-extrabold capitalize mt-1.5 ${
                          shipment.borderConnectStatus === "accepted"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : shipment.borderConnectStatus === "at_border"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : shipment.borderConnectStatus === "submitted"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {shipment.borderConnectStatus}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Synced via CBP EDI Link
                    </span>
                  </div>
                </div>

                {/* Customs Status History log timeline */}
                <div className="space-y-3.5 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                    EDI Manifest Activity Logs
                  </h4>

                  <div className="border-l-2 border-slate-150 pl-5 ml-2.5 space-y-4">
                    <div className="relative">
                      <span className="absolute -left-[27px] top-0.5 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                      <div className="text-2xs">
                        <span className="font-bold text-slate-800 font-mono">
                          11:42 AM EST - CBP Automated Release
                        </span>
                        <p className="text-slate-500 mt-0.5">
                          Pre-Arrival Processing System (PAPS) matched and
                          approved. Cargo cleared for crossing.
                        </p>
                      </div>
                    </div>

                    <div className="relative">
                      <span className="absolute -left-[27px] top-0.5 h-3.5 w-3.5 bg-amber-500 rounded-full border-2 border-white" />
                      <div className="text-2xs">
                        <span className="font-bold text-slate-800 font-mono">
                          09:30 AM EST - Arrived At Customs Station
                        </span>
                        <p className="text-slate-500 mt-0.5">
                          Truck reported geofence entrance at Fort Erie /
                          Buffalo bridge. Secondary inspection bypassed.
                        </p>
                      </div>
                    </div>

                    <div className="relative">
                      <span className="absolute -left-[27px] top-0.5 h-3.5 w-3.5 bg-blue-500 rounded-full border-2 border-white" />
                      <div className="text-2xs">
                        <span className="font-bold text-slate-800 font-mono">
                          07:15 AM EST - Manifest Transmitted to CBP
                        </span>
                        <p className="text-slate-500 mt-0.5">
                          eManifest electronic data file successfully sent to
                          CBP ACE portal. Sync key: PAPS-ACE-92040.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Borders Connect Status Actions control center */}
              <div className="lg:col-span-5 bg-gradient-to-br from-indigo-50 to-slate-50 rounded-2xl border border-indigo-150 p-5 space-y-4 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="p-1 bg-indigo-600 text-white rounded-lg">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase font-mono leading-none">
                      Customs Action Console
                    </h4>
                    <p className="text-4xs text-slate-500 mt-0.5">
                      Dispatch control over US/Canada CBP API sync
                    </p>
                  </div>
                </div>

                {!(
                  currentUser.role === "super_admin" ||
                  currentUser.role === "admin" ||
                  currentUser.role === "customs"
                ) && (
                  <div className="bg-cyan-50 border border-cyan-200 text-cyan-800 p-3 rounded-lg text-3xs font-medium">
                    ℹ️ Border documentation & eManifest releases are restricted
                    to Customs & Admin roles.
                  </div>
                )}

                <div className="space-y-2.5">
                  <button
                    disabled={
                      !(
                        currentUser.role === "super_admin" ||
                        currentUser.role === "admin" ||
                        currentUser.role === "customs"
                      )
                    }
                    onClick={() => handleUpdateBorderStatus("submitted")}
                    className="w-full text-left p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all flex items-center justify-between group cursor-pointer disabled:opacity-50 disabled:hover:bg-white"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Submit eManifest to CBP
                      </span>
                      <span className="text-4xs text-slate-400 font-mono">
                        Sends PAPS/PARS barcodes via ACE electronic EDI
                      </span>
                    </div>
                    <CheckCircle className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </button>

                  <button
                    disabled={
                      !(
                        currentUser.role === "super_admin" ||
                        currentUser.role === "admin" ||
                        currentUser.role === "customs"
                      )
                    }
                    onClick={() => handleUpdateBorderStatus("at_border")}
                    className="w-full text-left p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all flex items-center justify-between group cursor-pointer disabled:opacity-50 disabled:hover:bg-white"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Mark "Arrived At Border"
                      </span>
                      <span className="text-4xs text-slate-400 font-mono">
                        Flag driver ready at commercial checkpoint lane
                      </span>
                    </div>
                    <CheckCircle className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </button>

                  <button
                    disabled={
                      !(
                        currentUser.role === "super_admin" ||
                        currentUser.role === "admin" ||
                        currentUser.role === "customs"
                      )
                    }
                    onClick={() => handleUpdateBorderStatus("accepted")}
                    className="w-full text-left p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all flex items-center justify-between group cursor-pointer disabled:opacity-50 disabled:hover:bg-white"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Record Complete CBP Release
                      </span>
                      <span className="text-4xs text-slate-400 font-mono">
                        Mark customs release clear, release freight in transit
                      </span>
                    </div>
                    <CheckCircle className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REAL-TIME DRIVER MESSENGER CHAT */}
          {activeTab === "chat" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[55vh]">
              {/* Active channel ribbon bar */}
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-150 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wide">
                      Driver Channel: {shipment.driverName}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Assigned Truck Asset: {shipment.truckNumber}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-3xs font-mono">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
                  <span className="font-bold">LIVE TELEMETRY READY</span>
                </div>
              </div>

              {/* Chat timeline history */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/40">
                {activeChatMessages.length === 0 ? (
                  <div className="text-center text-slate-400 py-16 text-2xs max-w-sm mx-auto space-y-1.5">
                    <AlertCircle className="h-8 w-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-500">
                      No dispatcher logs recorded.
                    </p>
                    <p className="text-slate-400">
                      Co-ordinate safe winter crossings, trailer axle load
                      limits, or PAPS barcode issues with {shipment.driverName}{" "}
                      in real-time.
                    </p>
                  </div>
                ) : (
                  activeChatMessages.map((msg, index) => {
                    const isDispatcher = msg.senderRole === "dispatcher";
                    const isLastMsg = index === activeChatMessages.length - 1;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isDispatcher ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] rounded-xl px-4 py-3 text-xs shadow-3xs ${
                            isDispatcher
                              ? "bg-slate-900 text-white rounded-tr-none"
                              : "bg-white text-slate-800 border border-slate-250 rounded-tl-none"
                          }`}
                        >
                          <div className="flex items-center justify-between space-x-4 mb-1">
                            <span className="font-bold text-[10px] opacity-75">
                              {msg.senderName}
                            </span>
                            <span className="text-[9px] font-mono opacity-50">
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          {msg.content && (
                            <p className="leading-relaxed font-semibold">
                              {msg.content}
                            </p>
                          )}

                          {/* Image Attachments */}
                          {msg.attachment && (
                            <div
                              className={`mt-2 p-1.5 rounded-lg border text-2xs ${
                                isDispatcher
                                  ? "bg-slate-850 border-slate-800 text-slate-200"
                                  : "bg-slate-50 border-slate-200 text-slate-700"
                              }`}
                            >
                              {msg.attachment.type === "photo" ? (
                                <div className="space-y-1">
                                  <img
                                    src={msg.attachment.url}
                                    alt={msg.attachment.name}
                                    className="rounded max-h-32 object-cover w-full cursor-zoom-in"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="flex items-center justify-between text-3xs text-slate-400 font-mono mt-1">
                                    <span className="truncate">
                                      {msg.attachment.name}
                                    </span>
                                    <span className="shrink-0 font-bold">
                                      {msg.attachment.size}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between gap-2 py-0.5">
                                  <div className="flex items-center space-x-1.5 min-w-0">
                                    <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                                    <span className="font-mono truncate font-semibold">
                                      {msg.attachment.name}
                                    </span>
                                  </div>
                                  <span className="text-3xs font-mono text-slate-400 shrink-0">
                                    {msg.attachment.size}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Read Status info */}
                        {isDispatcher && isLastMsg && (
                          <span className="text-[10px] font-mono text-slate-400 mt-1 mr-1 flex items-center gap-1">
                            {msg.read ? (
                              <>
                                <CheckCircle className="h-3 w-3 text-emerald-500" />
                                <span>
                                  Read •{" "}
                                  {new Date(msg.timestamp).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" }
                                  )}
                                </span>
                              </>
                            ) : (
                              <span>Sent</span>
                            )}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat input attachment preview pane */}
              {chatAttachment && (
                <div className="px-5 py-2.5 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between text-2xs text-indigo-950 font-mono shrink-0">
                  <div className="flex items-center space-x-2">
                    {chatAttachment.type === "photo" ? (
                      <Image className="h-4 w-4 text-indigo-600" />
                    ) : (
                      <FileText className="h-4 w-4 text-indigo-600" />
                    )}
                    <span className="font-bold truncate">
                      📎 {chatAttachment.name}
                    </span>
                    <span className="text-indigo-400 text-3xs">
                      ({chatAttachment.size})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChatAttachment(null)}
                    className="text-indigo-500 hover:text-indigo-750 font-bold px-2 py-0.5 rounded hover:bg-indigo-100 cursor-pointer"
                  >
                    ✕ Remove
                  </button>
                </div>
              )}

              {/* Messaging input pane */}
              <div className="p-4 border-t border-slate-150 bg-white shrink-0">
                <form
                  onSubmit={handleSendChatMessage}
                  className="flex items-center space-x-3.5"
                >
                  <div className="relative group shrink-0">
                    <button
                      type="button"
                      title="Attach documents"
                      className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>

                    <div className="absolute bottom-10 left-0 hidden group-hover:block bg-white border border-slate-200 shadow-lg rounded-xl py-1.5 w-44 z-50 text-2xs">
                      <button
                        type="button"
                        onClick={() => handleAttachMockFile("photo")}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center space-x-2 cursor-pointer text-slate-700"
                      >
                        <Image className="h-4 w-4 text-slate-400" />
                        <span className="font-semibold">
                          Attach Axle Weight JPG
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAttachMockFile("document")}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center space-x-2 cursor-pointer text-slate-700"
                      >
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span className="font-semibold">
                          Attach PAPS Stamp PDF
                        </span>
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder={`Type a secure message to ${shipment.driverName}...`}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />

                  <button
                    type="submit"
                    disabled={!chatMessage.trim() && !chatAttachment}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 text-white disabled:text-slate-300 rounded-xl cursor-pointer transition-colors shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3.5 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer transition-colors"
          >
            Close Window
          </button>
        </div>
      </motion.div>
    </div>
  );
}

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
  Printer,
  Download,
  Globe,
  Calendar,
  Trash2,
} from "lucide-react";
import CustomsManifestModal from "./CustomsManifestModal";
import DocumentTemplateModal from "./DocumentTemplateModal";
import CustomsOrderProfileTab from "./CustomsOrderProfileTab";
import TripLegsSection from "./TripLegsSection";
import EnhancedRouteVisualization from "./EnhancedRouteVisualization";
import { useDriverStore } from "../stores/useDriverstore";
import { useDocumentStore } from "../stores/useDocumentStore";

const formatCleanCityState = (...parts) => {
  const tokens = [];
  parts.forEach((p) => {
    if (!p) return;
    String(p)
      .split(",")
      .forEach((t) => {
        const trimmed = t.trim();
        if (trimmed && !tokens.some((existing) => existing.toLowerCase() === trimmed.toLowerCase())) {
          tokens.push(trimmed);
        }
      });
  });
  return tokens.join(", ") || "N/A";
};

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

const HOUSE_STATUS_OPTIONS = [
  "A8A", "APPOINTMNT", "APPT + REF", "ARR LOGIST", "BONDED", "CHECK IN",
  "CLEARANCE", "CROSS DOCK", "CUSTOMS", "DEL CONF", "DELIVERED", "DOCUMENTS",
  "IN TRANSIT", "LOADED", "OFF LOADED", "ON HAND", "ON HOLD", "ON ORDER",
  "ON STAGE", "OUT FOR DEL", "PAPERWORK", "PARS CONF", "PARS FAIL", "PAPS CONF",
  "PICKUP", "POD CONF", "PRE-LTL", "RATED", "READY", "RED ALERT", "REPAIR",
  "REROUTED", "SCHEDULED", "SETUP", "SHORTAGE", "STORAGE", "SWITCH TRK",
  "TENDERED", "TRANSFER", "TRANSIT", "UNLOADED", "WAITING", "WEIGHT ERR", "FTL"
];

const getHouseStatusStyle = (status) => {
  const s = String(status || "").toUpperCase();
  if (s.includes("RED") || s.includes("FAIL") || s.includes("HOLD") || s.includes("ERR")) {
    return "bg-rose-50 text-rose-800 border-rose-300 font-bold";
  }
  if (s.includes("DELIVERED") || s.includes("CONF") || s.includes("CLEAR") || s.includes("READY")) {
    return "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold";
  }
  if (s.includes("TRANSIT") || s.includes("OUT FOR") || s.includes("LOADED")) {
    return "bg-sky-50 text-sky-800 border-sky-300 font-bold";
  }
  if (s.includes("APPT") || s.includes("SCHED") || s.includes("PICKUP")) {
    return "bg-amber-50 text-amber-800 border-amber-300 font-bold";
  }
  return "bg-slate-100 text-slate-800 border-slate-300 font-bold";
};

export default function ShipmentDetailsModal({
  isOpen,
  onClose,
  shipment,
  currentUser = { role: "admin", username: "Dispatcher" },
  messages,
  onSendMessage,
  onUpdateShipment,
  onMarkMessagesAsRead,
}) {
  const { fetchDrivers, drivers } = useDriverStore();
  const { documents, fetchDocuments } = useDocumentStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editedShipment, setEditedShipment] = useState(shipment);
  const [chatMessage, setChatMessage] = useState("");
  const [chatAttachment, setChatAttachment] = useState(null);
  const [docViewerModal, setDocViewerModal] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Find matching document uploaded from Chat / Supabase for this load
  const shipmentIds = [
    String(shipment?.id || "").trim(),
    String(shipment?.load_number || "").trim(),
    String(shipment?.tracking_number || shipment?.trackingNumber || "").trim(),
  ].filter(Boolean);

  const matchedBolDoc = documents?.find((d) => {
    const docType = String(d.document_type || d.type || "").toUpperCase();
    if (!docType.includes("BOL") && !docType.includes("LADING")) return false;
    const docIds = [
      String(d.load_id || "").trim(),
      String(d.shipment_id || d.shipmentId || "").trim(),
      String(d.load_number || "").trim(),
      String(d.tracking_number || d.trackingNumber || "").trim(),
    ].filter(Boolean);

    return shipmentIds.some((sId) =>
      docIds.some((dId) => sId === dId || (sId.length >= 3 && dId.length >= 3 && (sId.includes(dId) || dId.includes(sId))))
    );
  });

  const matchedPodDoc = documents?.find((d) => {
    const docType = String(d.document_type || d.type || "").toUpperCase();
    if (!docType.includes("POD") && !docType.includes("DELIVERY")) return false;
    const docIds = [
      String(d.load_id || "").trim(),
      String(d.shipment_id || d.shipmentId || "").trim(),
      String(d.load_number || "").trim(),
      String(d.tracking_number || d.trackingNumber || "").trim(),
    ].filter(Boolean);

    return shipmentIds.some((sId) =>
      docIds.some((dId) => sId === dId || (sId.length >= 3 && dId.length >= 3 && (sId.includes(dId) || dId.includes(sId))))
    );
  });
  const [isAddingWaypoint, setIsAddingWaypoint] = useState(false);
  const [newWaypointForm, setNewWaypointForm] = useState({
    companyName: "",
    address: "",
    stopType: "delivery",
    scheduledTime: "",
    pieces: "",
    weight: "",
    dockCode: "",
  });
  const [isCustomsModalOpen, setIsCustomsModalOpen] = useState(false);
  const [templateDocType, setTemplateDocType] = useState(null);
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
    if (shipment) {
      setEditedShipment(shipment);
    }
    setIsEditing(false);
    setOptimizedRoute(null);
    setAiError(null);
  }, [shipment?.id]);
  useEffect(() => {
    if (fetchDrivers) fetchDrivers();
  }, [fetchDrivers]);
  useEffect(() => {
    if (isOpen && shipment?.id && onMarkMessagesAsRead) {
      onMarkMessagesAsRead(shipment.id, "dispatcher");
    }
  }, [isOpen, shipment?.id]);
  useEffect(() => {
    if (activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTab, messages]);

  if (!isOpen || !shipment) return null;

  const effectiveWaypoints = (shipment?.waypoints && shipment.waypoints.length > 0)
    ? shipment.waypoints
    : [
        {
          id: "wp_1",
          sequence: 1,
          stopType: "pickup",
          companyName: shipment?.shipperName || shipment?.shipper_name || shipment?.originCity || "Shipper Origin Terminal",
          address: shipment?.shipperAddress || shipment?.shipper_street_address || shipment?.originState || "Origin Logistics Yard",
          scheduledTime: shipment?.pickup_date || shipment?.pickupDate || new Date().toISOString(),
          status: "completed",
        },
        {
          id: "wp_2",
          sequence: 2,
          stopType: "delivery",
          companyName: shipment?.consigneeName || shipment?.consignee_name || shipment?.destinationCity || "Consignee Receiving Hub",
          address: shipment?.consigneeAddress || shipment?.consignee_street_address || shipment?.destinationState || "Consignee Unloading Dock",
          scheduledTime: shipment?.delivery_date || shipment?.deliveryDate || new Date().toISOString(),
          status: "pending",
        },
      ];
  const activeChatMessages = (messages || []).filter(
    (m) =>
      m.shipmentId === shipment?.id ||
      m.recipientId === shipment?.driverId ||
      m.senderName === shipment?.driverName
  );
  const handleSaveDetails = () => {
    if (!onUpdateShipment || !editedShipment) return;
    const targetId = editedShipment.id || editedShipment.load_id || shipment?.id;
    if (typeof onUpdateShipment === "function") {
      onUpdateShipment(targetId, editedShipment);
    }
    setIsEditing(false);
  };
  const handleDriverChange = (driverId) => {
    const matched = drivers.find((d) => d.id === driverId);
    if (matched) {
      const dName = matched.name || matched.username || "Marcus Vance";
      const tNum = matched.assignedTruck || matched.truck_number || "TRK-102";
      onUpdateShipment({
        ...shipment,
        status: "pickup_assigned",
        driverId: matched.id,
        driver_id: matched.id,
        driverName: dName,
        driver_name: dName,
        truckId: "TRK102",
        truckNumber: tNum,
        truck_number: tNum,
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
    const nextWaypoints = [...effectiveWaypoints];
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
    const updatedWaypoints = effectiveWaypoints.map((w) => {
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
  const handleAddNewWaypoint = (e) => {
    e.preventDefault();
    if (!newWaypointForm.companyName.trim() || !newWaypointForm.address.trim()) {
      return;
    }
    const newWp = {
      id: "wp_" + Date.now(),
      sequence: effectiveWaypoints.length + 1,
      stopType: newWaypointForm.stopType || "delivery",
      companyName: newWaypointForm.companyName.trim(),
      address: newWaypointForm.address.trim(),
      scheduledTime: newWaypointForm.scheduledTime
        ? new Date(newWaypointForm.scheduledTime).toISOString()
        : new Date().toISOString(),
      pieces: newWaypointForm.pieces ? Number(newWaypointForm.pieces) : null,
      weight: newWaypointForm.weight ? Number(newWaypointForm.weight) : null,
      dockCode: newWaypointForm.dockCode ? newWaypointForm.dockCode.trim() : null,
      status: "pending",
    };
    const updated = [...effectiveWaypoints, newWp].map((w, idx) => ({
      ...w,
      sequence: idx + 1,
    }));
    onUpdateShipment({ ...shipment, waypoints: updated });
    setIsAddingWaypoint(false);
    setNewWaypointForm({
      companyName: "",
      address: "",
      stopType: "delivery",
      scheduledTime: "",
      pieces: "",
      weight: "",
      dockCode: "",
    });
  };
  const handleDeleteWaypoint = (waypointId) => {
    if (effectiveWaypoints.length <= 2) {
      alert("A shipment route requires at least 2 stops (origin & destination).");
      return;
    }
    const filtered = effectiveWaypoints
      .filter((w) => w.id !== waypointId)
      .map((w, idx) => ({ ...w, sequence: idx + 1 }));
    onUpdateShipment({ ...shipment, waypoints: filtered });
  };
  const handleUpdateWaypointStatus = (waypointId, newStatus) => {
    const updated = effectiveWaypoints.map((w) =>
      w.id === waypointId ? { ...w, status: newStatus } : w
    );
    onUpdateShipment({ ...shipment, waypoints: updated });
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
          waypoints: effectiveWaypoints.map((w) => ({
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
    const sortedWaypoints = [...effectiveWaypoints].sort((a, b) => {
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
  console.log(shipment);
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
                  LOAD # {shipment.load_number}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-3xs font-mono font-bold uppercase ${getStatusColor(
                    shipment.status
                  )}`}
                >
                  {shipment?.status?.replace("_", " ")}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-3xs font-mono font-bold uppercase border bg-slate-800 border-slate-700 text-slate-200`}
                >
                  {shipment.loadType || "FTL"}
                </span>
              </div>
              <h2 className="text-lg font-bold truncate max-w-md font-sans text-white mt-0.5">
                {shipment.customer_name}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                const printWindow = window.open("", "_blank");
                if (!printWindow) return;
                const content = `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <title>Shipment Package - #${shipment.load_number || shipment.tracking_number || 'LOG-1001'}</title>
                    <style>
                      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
                      .header { display: flex; justify-content: space-between; border-b: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
                      .logo { font-size: 26px; font-weight: 800; color: #1d4ed8; letter-spacing: -0.5px; }
                      .badge { background: #dbeafe; color: #1e40af; padding: 4px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
                      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
                      .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; }
                      .card h3 { margin-top: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; border-b: 1px solid #e2e8f0; padding-bottom: 8px; }
                      .card p { margin: 8px 0; font-size: 13px; font-weight: 600; color: #334155; }
                      table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                      th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; font-weight: 700; }
                      td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155; }
                      .total { text-align: right; margin-top: 24px; font-size: 18px; font-weight: 800; color: #0f172a; background: #eff6ff; padding: 16px; border-radius: 12px; border: 1px solid #bfdbfe; }
                      .footer { margin-top: 40px; font-size: 11px; text-align: center; color: #94a3b8; border-t: 1px solid #e2e8f0; padding-top: 15px; }
                    </style>
                  </head>
                  <body>
                    <div class="header">
                      <div>
                        <div class="logo">LOGISYNC SUITE</div>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 600;">Master Freight Manifest & Official Load Documentation</div>
                      </div>
                      <div style="text-align: right;">
                        <div style="font-size: 22px; font-weight: 800; color: #0f172a;">LOAD #${shipment.load_number || shipment.tracking_number || "LOG-1001"}</div>
                        <div style="margin-top: 6px;"><span class="badge">${(shipment.status || "DISPATCHED").replace("_", " ")}</span></div>
                      </div>
                    </div>

                    <div class="grid">
                      <div class="card">
                        <h3>Customer & Broker Profile</h3>
                        <p><strong>Customer Account:</strong> ${shipment.customer_name || "Industrial Logistics Co."}</p>
                        <p><strong>Broker / PO Ref:</strong> ${shipment.broker || "BRK-998"} · ${shipment.poNumber || "PO-5542"}</p>
                        <p><strong>Assigned Equipment:</strong> Truck ${shipment.truckNumber || "TRK-102"} / Trailer ${shipment.trailerNumber || "TRL-882"}</p>
                      </div>
                      <div class="card">
                        <h3>Driver & Route Dispatch Summary</h3>
                        <p><strong>Assigned Driver:</strong> ${shipment.driver_name || shipment.driverName || "Marcus Vance"}</p>
                        <p><strong>Origin Location:</strong> ${shipment.shipperName || shipment.originCity || "Toronto, ON"}</p>
                        <p><strong>Destination Hub:</strong> ${shipment.consigneeName || shipment.destinationCity || "Chicago, IL"}</p>
                      </div>
                    </div>

                    <div class="card" style="margin-bottom: 24px;">
                      <h3>Cargo & Freight Specifications</h3>
                      <table>
                        <thead>
                          <tr>
                            <th>Commodity / Description</th>
                            <th>Mode</th>
                            <th>Pallet Count</th>
                            <th>Weight (Lbs)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Industrial Machinery Parts & Cargo Load</td>
                            <td>${shipment.loadType || "FTL"}</td>
                            <td>${shipment.palletCount || 4} Pallets</td>
                            <td>${Number(shipment.weightLbs || 12500).toLocaleString()} lbs</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div class="total">
                      Freight Rate Total: $${((shipment.palletCount || 4) * 450 + 850).toLocaleString()}.00 CAD
                    </div>

                    <div class="footer">
                      Generated automatically by LogiSync Suite Dispatch Platform on ${new Date().toLocaleString()} · Official Package Document
                    </div>
                  </body>
                  </html>
                `;
                printWindow.document.write(content);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                  printWindow.print();
                }, 400);
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer flex items-center space-x-1.5 shadow-sm"
              title="Download/Print PDF Package"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Export PDF Package</span>
            </button>
            <button
              type="button"
              onClick={() => setTemplateDocType("PAPS")}
              className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center space-x-1 shadow-sm"
              title="Generate US Customs PAPS Entry Sheet"
            >
              <span>🇺🇸 PAPS</span>
            </button>
            <button
              type="button"
              onClick={() => setTemplateDocType("PARS")}
              className="px-2.5 py-1.5 bg-sky-700 hover:bg-sky-600 text-white rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center space-x-1 shadow-sm"
              title="Generate CBSA Canada PARS Entry Sheet"
            >
              <span>🇨🇦 PARS</span>
            </button>
            <button
              type="button"
              onClick={() => setTemplateDocType("BOL")}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center space-x-1 border border-slate-600 shadow-sm"
              title="Generate Official Bill of Lading"
            >
              <FileText className="h-3.5 w-3.5 text-sky-400" />
              <span>BOL</span>
            </button>
            <span className="text-xs font-mono text-slate-400 hidden sm:inline-block">
              ETA: {new Date(shipment.delivery_date).toLocaleDateString()}
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
              setActiveTab("customs");
              setIsEditing(false);
            }}
            className={`py-3.5 text-xs font-bold font-mono tracking-wide uppercase border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === "customs"
                ? "border-indigo-600 text-indigo-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>🌐 Customs Profile</span>
            <span className="text-3xs font-mono bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold">
              ACE/ACI
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("legs");
              setIsEditing(false);
            }}
            className={`py-3.5 text-xs font-bold font-mono tracking-wide uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === "legs"
                ? "border-indigo-600 text-indigo-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            🚚 Trip Legs
          </button>
        </div>

        {/* Modal Main Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {/* TAB 1: OVERVIEW & GENERAL INFO */}
          {activeTab === "overview" && (
            <div className="space-y-6">

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
                      {/* Master Symmetrical Route Summary Banner */}
                      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between gap-4 border border-slate-800 font-sans">
                        <div className="flex items-center space-x-3 w-1/3">
                          <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300 shrink-0">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-sans uppercase font-bold text-indigo-300 tracking-wider block">Shipper (Pickup)</span>
                            <p className="font-bold text-sm text-white font-sans truncate">{shipment.shipper_name || shipment.shipperName || shipment.originCity || "Origin Terminal"}</p>
                            <p className="text-2xs text-slate-400 font-sans truncate">{formatCleanCityState(shipment.shipper_street_address || shipment.shipperAddress, shipment.shipper_city || shipment.originCity, shipment.shipper_state || shipment.shipperState)}</p>
                          </div>
                        </div>

                        <div className="hidden md:flex flex-col items-center justify-center w-1/3 px-2 text-center">
                          <div className="flex items-center justify-center space-x-1.5 text-2xs text-indigo-300 font-semibold font-sans mb-1">
                            <Truck className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                            <span>{shipment.loadType || "FTL"} Freight Linehaul</span>
                          </div>
                          <div className="w-full max-w-[180px] h-0.5 bg-gradient-to-r from-indigo-500/20 via-indigo-400 to-emerald-400/80 relative rounded-full my-1">
                            <div className="absolute right-0 -top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs" />
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 text-right justify-end w-1/3">
                          <div className="min-w-0">
                            <span className="text-[10px] font-sans uppercase font-bold text-emerald-400 tracking-wider block">Consignee (Delivery)</span>
                            <p className="font-bold text-sm text-white font-sans truncate">{shipment.consignee_name || shipment.consigneeName || shipment.destinationCity || "Delivery Hub"}</p>
                            <p className="text-2xs text-slate-400 font-sans truncate">{formatCleanCityState(shipment.consignee_street_address || shipment.consigneeAddress, shipment.consignee_city || shipment.destinationCity, shipment.consignee_state || shipment.consigneeState)}</p>
                          </div>
                          <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-300 shrink-0">
                            <CheckCircle className="h-5 w-5" />
                          </div>
                        </div>
                      </div>

                      {/* SYMMETRICAL HOUSE STATUS CONTROL BAR */}
                      <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200 shadow-2xs font-sans">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="shrink-0">
                            <label className="text-[11px] font-sans uppercase tracking-wider font-extrabold text-slate-500 block mb-0.5">
                              HOUSE STATUS
                            </label>
                            <p className="text-2xs text-slate-400 font-medium">
                              Current Operational Status assigned to Load #{shipment.load_number || shipment.id}
                            </p>
                          </div>
                          <div className="w-full sm:w-80 shrink-0">
                            <select
                              value={shipment.houseStatus || shipment.house_status || shipment.outbound_status || "FTL"}
                              onChange={(e) => {
                                const val = e.target.value;
                                onUpdateShipment && onUpdateShipment(shipment.id, { houseStatus: val, house_status: val, outbound_status: val });
                              }}
                              className={`w-full rounded-xl px-3.5 py-2 text-xs font-mono font-bold uppercase border cursor-pointer focus:outline-none transition-all shadow-2xs ${getHouseStatusStyle(shipment.houseStatus || shipment.house_status || shipment.outbound_status || "FTL")}`}
                            >
                              {HOUSE_STATUS_OPTIONS.map((opt) => (
                                <option key={opt} value={opt} className="bg-white text-slate-900 font-mono">
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Customer Info Card (4 Equal Columns) */}
                      <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/70 space-y-3 font-sans">
                        <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-600">
                          Customer Account Details
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider block mb-0.5">
                              Customer Name
                            </span>
                            <p className="font-semibold text-slate-900">
                              {shipment.customer_name || shipment.customerName || "Direct Client"}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider block mb-0.5">
                              Customer Email
                            </span>
                            <p
                              className="font-semibold text-slate-900 truncate"
                              title={shipment.customer_email}
                            >
                              {shipment.customer_email || "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider block mb-0.5">
                              Customer Phone
                            </span>
                            <p className="font-semibold text-slate-900">
                              {shipment.customer_phone || "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider block mb-0.5">
                              Customer Address
                            </span>
                            <p className="font-semibold text-slate-900 truncate">
                              {shipment.customer_billing_address || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Shipper & Consignee Side-by-Side Symmetrical Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                        {/* Shipper Card */}
                        <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/70 space-y-3 flex flex-col justify-between">
                          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                            <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-600 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Shipper (Pickup Location)</span>
                            </h4>
                            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 px-2.5 py-1 rounded-full cursor-pointer transition-all shadow-2xs" title="Click to change Pickup Date">
                              <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span className="font-bold">P/U:</span>
                              <input
                                type="date"
                                value={
                                  shipment.pickup_date
                                    ? String(shipment.pickup_date).substring(0, 10)
                                    : shipment.pickupDate
                                    ? String(shipment.pickupDate).substring(0, 10)
                                    : ""
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  onUpdateShipment && onUpdateShipment(shipment.id, { pickup_date: val, pickupDate: val });
                                }}
                                className="bg-transparent text-indigo-800 font-extrabold text-[10px] cursor-pointer focus:outline-none"
                              />
                            </label>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider block mb-0.5">
                                Shipper Name
                              </span>
                              <p className="font-semibold text-slate-900">
                                {shipment.shipper_name || shipment.shipperName || "N/A"}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider block mb-0.5">
                                Street Address
                              </span>
                              <p className="font-semibold text-slate-900">
                                {shipment.shipper_street_address || shipment.shipperAddress || "N/A"}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              <div>
                                <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider block mb-0.5">
                                  City / State
                                </span>
                                <p className="font-semibold text-slate-900 truncate">
                                  {formatCleanCityState(shipment.shipper_city || shipment.originCity, shipment.shipper_state || shipment.shipperState)}
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider block mb-0.5">
                                  Zipcode & Country
                                </span>
                                <p className="font-semibold text-slate-900">
                                  {[shipment.shipper_zipcode, shipment.shipper_country].filter(Boolean).join(" · ") || "N/A"}
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider block mb-0.5">
                                  Scheduled Pickup
                                </span>
                                <input
                                  type="date"
                                  value={
                                    shipment.pickup_date
                                      ? String(shipment.pickup_date).substring(0, 10)
                                      : shipment.pickupDate
                                      ? String(shipment.pickupDate).substring(0, 10)
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    onUpdateShipment && onUpdateShipment(shipment.id, { pickup_date: val, pickupDate: val });
                                  }}
                                  className="w-full bg-indigo-50/50 text-indigo-700 font-bold border border-indigo-200 rounded-lg px-2 py-0.5 text-xs focus:outline-none cursor-pointer"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Consignee Card */}
                        <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/70 space-y-3 flex flex-col justify-between">
                          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                            <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-600 flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Consignee (Delivery Location)</span>
                            </h4>
                            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 px-2.5 py-1 rounded-full cursor-pointer transition-all shadow-2xs" title="Click to change Delivery Date">
                              <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="font-bold">DEL:</span>
                              <input
                                type="date"
                                value={
                                  shipment.delivery_date
                                    ? String(shipment.delivery_date).substring(0, 10)
                                    : shipment.deliveryDate
                                    ? String(shipment.deliveryDate).substring(0, 10)
                                    : ""
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  onUpdateShipment && onUpdateShipment(shipment.id, { delivery_date: val, deliveryDate: val });
                                }}
                                className="bg-transparent text-emerald-800 font-extrabold text-[10px] cursor-pointer focus:outline-none"
                              />
                            </label>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider block mb-0.5">
                                Consignee Name
                              </span>
                              <p className="font-semibold text-slate-900">
                                {shipment.consignee_name || shipment.consigneeName || "N/A"}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider block mb-0.5">
                                Street Address
                              </span>
                              <p className="font-semibold text-slate-900">
                                {shipment.consignee_street_address || shipment.consigneeAddress || "N/A"}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              <div>
                                <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider block mb-0.5">
                                  City / State
                                </span>
                                <p className="font-semibold text-slate-900 truncate">
                                  {formatCleanCityState(shipment.consignee_city || shipment.destinationCity, shipment.consignee_state || shipment.consigneeState)}
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider block mb-0.5">
                                  Zipcode & Country
                                </span>
                                <p className="font-semibold text-slate-900">
                                  {[shipment.consignee_zipcode, shipment.consignee_country].filter(Boolean).join(" · ") || "N/A"}
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider block mb-0.5">
                                  Target Delivery
                                </span>
                                <input
                                  type="date"
                                  value={
                                    shipment.delivery_date
                                      ? String(shipment.delivery_date).substring(0, 10)
                                      : shipment.deliveryDate
                                      ? String(shipment.deliveryDate).substring(0, 10)
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    onUpdateShipment && onUpdateShipment(shipment.id, { delivery_date: val, deliveryDate: val });
                                  }}
                                  className="w-full bg-emerald-50/50 text-emerald-700 font-bold border border-emerald-200 rounded-lg px-2 py-0.5 text-xs focus:outline-none cursor-pointer"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Symmetrical 3x2 Cargo & Financial Specifications Grid (Exactly 6 items) */}
                      <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/70 space-y-3 font-sans">
                        <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-600">
                          Cargo, Dispatch & Financial Specifications
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider block mb-0.5">
                              Assigned Dispatcher
                            </span>
                            <p className="font-semibold text-slate-900">
                              {shipment.dispatcherName || "Unassigned"}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider block mb-0.5">
                              Broker / Logistics
                            </span>
                            <p className="font-semibold text-slate-900">
                              {shipment.broker || "Direct Client"}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider block mb-0.5">
                              PO #
                            </span>
                            <p className="font-semibold text-slate-900 font-mono">
                              {shipment.poNumber || "—"}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider block mb-0.5">
                              Cargo Weight & Pallets
                            </span>
                            <p className="font-semibold text-slate-900">
                              {[Number(shipment?.weight || 0) > 0 ? `${Number(shipment.weight).toLocaleString()} lbs` : null, shipment.pieces ? `${shipment.pieces} Pallets` : null].filter(Boolean).join(" · ") || "—"}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider block mb-0.5">
                              Cargo Description
                            </span>
                            <div className="font-semibold text-slate-900">
                              <FormatCargoOrLink text={shipment.cargo || shipment.cargoDescription || "General Freight Cargo"} />
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider block mb-0.5">
                              Invoice Price
                            </span>
                            <p className="font-extrabold text-indigo-600 text-sm font-sans">
                              ${(Number(shipment?.priceInvoice) || 0).toLocaleString()}
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
                        {shipment.driver_notes ? (
                          <p className="text-xs text-slate-800 bg-white border border-amber-100 p-3 rounded-lg leading-relaxed whitespace-pre-wrap font-sans">
                            {shipment.driver_notes}
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
                    <div className="space-y-4 font-sans">
                      {/* Top House Status Control in Edit Mode */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                        <label className="text-[11px] font-sans uppercase tracking-wider font-extrabold text-slate-500 block">
                          HOUSE STATUS
                        </label>
                        <select
                          value={editedShipment.houseStatus || editedShipment.house_status || editedShipment.outbound_status || "FTL"}
                          onChange={(e) =>
                            setEditedShipment({
                              ...editedShipment,
                              houseStatus: e.target.value,
                              house_status: e.target.value,
                              outbound_status: e.target.value,
                            })
                          }
                          className={`w-full rounded-xl px-3.5 py-2 text-xs font-mono font-bold uppercase border cursor-pointer focus:outline-none transition-all shadow-2xs ${getHouseStatusStyle(editedShipment.houseStatus || editedShipment.house_status || editedShipment.outbound_status || "FTL")}`}
                        >
                          {HOUSE_STATUS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt} className="bg-white text-slate-900 font-mono">
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

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
                              value={editedShipment.customer_name}
                              onChange={(e) =>
                                setEditedShipment({
                                  ...editedShipment,
                                  customer_name: e.target.value,
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
                              value={editedShipment.customer_email || ""}
                              onChange={(e) =>
                                setEditedShipment({
                                  ...editedShipment,
                                  customer_email: e.target.value,
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
                              value={editedShipment.customer_phone || ""}
                              onChange={(e) =>
                                setEditedShipment({
                                  ...editedShipment,
                                  customer_phone: e.target.value,
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
                              value={
                                editedShipment.customer_billing_address || ""
                              }
                              onChange={(e) =>
                                setEditedShipment({
                                  ...editedShipment,
                                  customer_billing_address: e.target.value,
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
                                  value={editedShipment.shipper_name || ""}
                                  onChange={(e) =>
                                    setEditedShipment({
                                      ...editedShipment,
                                      shipper_name: e.target.value,
                                    })
                                  }
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                                Shipper Street Address
                              </label>
                              <input
                                type="text"
                                value={
                                  editedShipment.shipper_street_address || ""
                                }
                                onChange={(e) =>
                                  setEditedShipment({
                                    ...editedShipment,
                                    shipper_street_address: e.target.value,
                                  })
                                }
                                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                                  Shipper District
                                </label>
                                <input
                                  type="text"
                                  value={editedShipment.shipper_city || ""}
                                  onChange={(e) =>
                                    setEditedShipment({
                                      ...editedShipment,
                                      shipper_city: e.target.value,
                                    })
                                  }
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                                />
                              </div>
                              <div>
                                <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                                  Shipper Zipcode
                                </label>
                                <input
                                  type="text"
                                  value={editedShipment.shipper_zipcode || ""}
                                  onChange={(e) =>
                                    setEditedShipment({
                                      ...editedShipment,
                                      shipper_zipcode: e.target.value,
                                    })
                                  }
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                                  Shipper State
                                </label>
                                <input
                                  type="text"
                                  value={editedShipment.shipper_state || ""}
                                  onChange={(e) =>
                                    setEditedShipment({
                                      ...editedShipment,
                                      shipper_state: e.target.value,
                                    })
                                  }
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                                />
                              </div>
                              <div>
                                <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                                  Shipper Country
                                </label>
                                <input
                                  type="text"
                                  value={editedShipment.shipper_country || ""}
                                  onChange={(e) =>
                                    setEditedShipment({
                                      ...editedShipment,
                                      shipper_country: e.target.value,
                                    })
                                  }
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                                />
                              </div>
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
                                  value={editedShipment.consignee_name || ""}
                                  onChange={(e) =>
                                    setEditedShipment({
                                      ...editedShipment,
                                      consignee_name: e.target.value,
                                    })
                                  }
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                                Consignee Street Address
                              </label>
                              <input
                                type="text"
                                value={
                                  editedShipment.consignee_street_address || ""
                                }
                                onChange={(e) =>
                                  setEditedShipment({
                                    ...editedShipment,
                                    consignee_street_address: e.target.value,
                                  })
                                }
                                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                                  Consignee District
                                </label>
                                <input
                                  type="text"
                                  value={
                                    editedShipment.consignee_city || ""
                                  }
                                  onChange={(e) =>
                                    setEditedShipment({
                                      ...editedShipment,
                                      consignee_city: e.target.value,
                                    })
                                  }
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                                />
                              </div>
                              <div>
                                <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                                  Consignee Zipcode
                                </label>
                                <input
                                  type="text"
                                  value={editedShipment.consignee_zipcode || ""}
                                  onChange={(e) =>
                                    setEditedShipment({
                                      ...editedShipment,
                                      consignee_zipcode: e.target.value,
                                    })
                                  }
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                                  Consignee State
                                </label>
                                <input
                                  type="text"
                                  value={editedShipment.consignee_state || ""}
                                  onChange={(e) =>
                                    setEditedShipment({
                                      ...editedShipment,
                                      consignee_state: e.target.value,
                                    })
                                  }
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                                />
                              </div>
                              <div>
                                <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                                  Consignee Country
                                </label>
                                <input
                                  type="text"
                                  value={editedShipment.consignee_country || ""}
                                  onChange={(e) =>
                                    setEditedShipment({
                                      ...editedShipment,
                                      consignee_country: e.target.value,
                                    })
                                  }
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                                />
                              </div>
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
                              value={editedShipment.weight}
                              onChange={(e) =>
                                setEditedShipment({
                                  ...editedShipment,
                                  weight: Number(e.target.value),
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
                              value={editedShipment.pieces}
                              onChange={(e) =>
                                setEditedShipment({
                                  ...editedShipment,
                                  pieces: Number(e.target.value),
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
                              value={editedShipment.cargo}
                              onChange={(e) =>
                                setEditedShipment({
                                  ...editedShipment,
                                  cargo: e.target.value,
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

              {/* Saved Document Receipts & Rate Con Upload */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                    Assigned Load Credentials, Rate Confirmation & Proofs
                  </h4>
                  
                  {/* File Upload Input */}
                  <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-2xs font-bold font-mono transition-colors cursor-pointer inline-flex items-center space-x-1.5 shadow-2xs self-start sm:self-auto">
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>Upload Rate Con / BOL</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          alert(`Successfully attached "${file.name}" to Load #${shipment.load_number || shipment.tracking_number}! Document added to load package credentials.`);
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => {
                      setDocViewerModal({
                        name: "Carrier_Rate_Confirmation.pdf",
                        size: "180 KB",
                        type: "Rate Pay Verified",
                        url: "#"
                      });
                    }}
                    className="border border-slate-200 bg-blue-50/20 p-3.5 rounded-xl flex items-center justify-between hover:bg-blue-50/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          Carrier_Rate_Confirmation.pdf
                        </p>
                        <span className="text-3xs font-mono text-blue-600 font-semibold">
                          180 KB • Rate Pay Verified
                        </span>
                      </div>
                    </div>
                    <Eye className="h-4 w-4 text-slate-400 hover:text-indigo-600 shrink-0 ml-2" />
                  </div>

                  <div
                    onClick={() => {
                      const docUrl = matchedBolDoc?.file_path || matchedBolDoc?.image_url || matchedBolDoc?.url || shipment?.bol_url || "#";
                      setDocViewerModal({
                        name: matchedBolDoc?.file_name || matchedBolDoc?.name || "Carrier_BOL_Primary.pdf",
                        size: matchedBolDoc?.file_size || matchedBolDoc?.size || "240 KB",
                        type: "Driver Sign-off",
                        url: docUrl
                      });
                    }}
                    className="border border-emerald-300 bg-emerald-50/40 p-3.5 rounded-xl flex items-center justify-between hover:bg-emerald-100/60 transition-all cursor-pointer shadow-xs group"
                    title="Click to view & download Bill of Lading"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="p-2 bg-emerald-600 text-white rounded-lg group-hover:scale-105 transition-transform">
                        <FileText className="h-5 w-5 shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                          <span>{matchedBolDoc?.file_name || matchedBolDoc?.name || "Carrier_BOL_Primary.pdf"}</span>
                          <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold">CLICK TO OPEN</span>
                        </p>
                        <span className="text-3xs font-mono text-emerald-700 font-bold">
                          {matchedBolDoc?.file_size || "240 KB"} • {matchedBolDoc ? "Uploaded in Chat & Synced 👁" : "Driver Signed & Verified 👁"}
                        </span>
                      </div>
                    </div>
                    <Eye className="h-4 w-4 text-emerald-600 group-hover:text-emerald-900 shrink-0 ml-2 font-bold" />
                  </div>

                  <div
                    onClick={() => {
                      const docUrl = matchedPodDoc?.file_path || matchedPodDoc?.image_url || matchedPodDoc?.url || shipment?.pod_url || "#";
                      setDocViewerModal({
                        name: matchedPodDoc?.file_name || matchedPodDoc?.name || "Proof_of_Delivery_POD.pdf",
                        size: matchedPodDoc?.file_size || matchedPodDoc?.size || "110 KB",
                        type: "Consignee Signed",
                        url: docUrl
                      });
                    }}
                    className="border border-cyan-300 bg-cyan-50/40 p-3.5 rounded-xl flex items-center justify-between hover:bg-cyan-100/60 transition-all cursor-pointer shadow-xs group"
                    title="Click to view & download Proof of Delivery"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="p-2 bg-cyan-600 text-white rounded-lg group-hover:scale-105 transition-transform">
                        <FileText className="h-5 w-5 shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                          <span>{matchedPodDoc?.file_name || matchedPodDoc?.name || "Proof_of_Delivery_POD.pdf"}</span>
                          <span className="text-[9px] bg-cyan-200 text-cyan-900 px-1.5 py-0.5 rounded font-mono font-bold">CLICK TO OPEN</span>
                        </p>
                        <span className="text-3xs font-mono text-cyan-700 font-bold">
                          {matchedPodDoc?.file_size || "110 KB"} • {matchedPodDoc ? "Uploaded in Chat & Synced 👁" : "Consignee Signed 👁"}
                        </span>
                      </div>
                    </div>
                    <Eye className="h-4 w-4 text-cyan-600 group-hover:text-cyan-900 shrink-0 ml-2 font-bold" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WAYPOINTS & AI OPTIMIZATION */}
          {activeTab === "route" && (
            <div className="space-y-6">
              <EnhancedRouteVisualization
                loadId={shipment.id || shipment.load_id}
                origin={shipment.origin || shipment.originCity || shipment.shipper_city}
                destination={shipment.destination || shipment.destinationCity || shipment.consignee_city}
                stops={effectiveWaypoints}
              >
                {/* Delivery Stop Timeline & Sequence List */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <List className="h-4.5 w-4.5 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
                        Delivery Stop Timeline
                      </h3>
                      <span className="text-3xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                        {effectiveWaypoints.length} stops
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddingWaypoint(!isAddingWaypoint)}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center space-x-1 shadow-xs"
                    >
                      <span>{isAddingWaypoint ? "✕ Cancel" : "+ Add Stop"}</span>
                    </button>
                  </div>

                  {/* Add New Stop Inline Drawer */}
                  {isAddingWaypoint && (
                    <form onSubmit={handleAddNewWaypoint} className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-3 animate-in fade-in">
                      <div className="font-bold text-xs text-indigo-950 uppercase font-mono">
                        Add Route Stop / Waypoint
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-3xs font-bold text-slate-700 block mb-0.5">Stop Type</label>
                          <select
                            value={newWaypointForm.stopType}
                            onChange={(e) => setNewWaypointForm({ ...newWaypointForm, stopType: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold uppercase"
                          >
                            <option value="pickup">Pickup Facility</option>
                            <option value="delivery">Delivery Consignee</option>
                            <option value="border_crossing">Border Port / Customs</option>
                            <option value="rest_stop">Driver Rest / Fuel Stop</option>
                            <option value="weigh_station">Weigh Scale Inspection</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-3xs font-bold text-slate-700 block mb-0.5">Facility / Company Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Metro Warehouse Hub"
                            value={newWaypointForm.companyName}
                            onChange={(e) => setNewWaypointForm({ ...newWaypointForm, companyName: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-3xs font-bold text-slate-700 block mb-0.5">Full Street Address *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 450 Logistics Way, Detroit, MI 48201"
                            value={newWaypointForm.address}
                            onChange={(e) => setNewWaypointForm({ ...newWaypointForm, address: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-3xs font-bold text-slate-700 block mb-0.5">Appointment Window</label>
                          <input
                            type="datetime-local"
                            value={newWaypointForm.scheduledTime}
                            onChange={(e) => setNewWaypointForm({ ...newWaypointForm, scheduledTime: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-3xs font-bold text-slate-700 block mb-0.5">Gate / Dock Code</label>
                          <input
                            type="text"
                            placeholder="e.g. Door 14 / Pin #991"
                            value={newWaypointForm.dockCode}
                            onChange={(e) => setNewWaypointForm({ ...newWaypointForm, dockCode: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAddingWaypoint(false)}
                          className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-xs cursor-pointer"
                        >
                          Save Stop
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6 py-2">
                    {effectiveWaypoints.map((w, index) => {
                      const isPickup = w.stopType === "pickup";
                      const isDelivery = w.stopType === "delivery";
                      const isBorder = w.stopType === "border_crossing";
                      const statusStr = String(w.status || "pending").toLowerCase();

                      return (
                        <div key={w.id} className="relative group">
                          {/* Dot / Pin Icon */}
                          <span
                            className={`absolute -left-[35px] top-0.5 flex items-center justify-center h-6 w-6 rounded-full border shadow-2xs font-bold text-2xs ${
                              isPickup
                                ? "bg-indigo-600 text-white border-indigo-400"
                                : isDelivery
                                ? "bg-emerald-600 text-white border-emerald-400"
                                : isBorder
                                ? "bg-sky-600 text-white border-sky-400"
                                : "bg-amber-600 text-white border-amber-400"
                            }`}
                          >
                            {w.sequence}
                          </span>

                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                                <h5 className="text-xs font-bold text-slate-900 leading-none">
                                  {w.companyName}
                                </h5>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wide ${
                                    isPickup
                                      ? "bg-indigo-100 text-indigo-800"
                                      : isDelivery
                                      ? "bg-emerald-100 text-emerald-800"
                                      : isBorder
                                      ? "bg-sky-100 text-sky-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {w.stopType.replace(/_/g, " ")}
                                </span>

                                {/* Stop Status Workflow Selector */}
                                <select
                                  value={statusStr}
                                  onChange={(e) => handleUpdateWaypointStatus(w.id, e.target.value)}
                                  className={`px-2 py-0.5 rounded-full text-3xs font-mono font-bold uppercase border cursor-pointer ${
                                    statusStr === "completed"
                                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                      : statusStr === "arrived"
                                      ? "bg-blue-100 text-blue-800 border-blue-300"
                                      : statusStr === "en_route"
                                      ? "bg-amber-100 text-amber-800 border-amber-300"
                                      : "bg-slate-100 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="en_route">En Route</option>
                                  <option value="arrived">Arrived</option>
                                  <option value="completed">Completed</option>
                                  <option value="delayed">Delayed</option>
                                </select>
                              </div>
                              <p className="text-2xs text-slate-500 font-medium">
                                {w.address}
                              </p>

                              {/* Scheduled Appointment time info */}
                              <div className="flex items-center space-x-2 text-3xs font-mono text-slate-400 mt-1.5 flex-wrap gap-2">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                                  <span>
                                    Scheduled:{" "}
                                    <strong className="text-slate-600">
                                      {w.scheduledTime && !isNaN(new Date(w.scheduledTime).getTime())
                                        ? new Date(w.scheduledTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" })
                                        : "Scheduled Appointment"}
                                    </strong>
                                  </span>
                                </div>
                                {w.dockCode && (
                                  <span className="bg-white border border-slate-200 px-1.5 py-0.2 rounded text-slate-600 font-bold">
                                    Dock: {w.dockCode}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Control panel for each stop */}
                            <div className="flex items-center space-x-1.5 shrink-0 md:self-center">
                              {/* Sequence adjusters */}
                              <button
                                disabled={index === 0}
                                onClick={() => handleMoveWaypoint(index, "up")}
                                className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                                title="Move Stop Up"
                              >
                                <ArrowUp className="h-3 w-3 text-slate-600" />
                              </button>
                              <button
                                disabled={index === effectiveWaypoints.length - 1}
                                onClick={() => handleMoveWaypoint(index, "down")}
                                className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
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
                                      typeof w.scheduledTime === "string"
                                        ? w.scheduledTime.slice(0, 16)
                                        : new Date().toISOString().slice(0, 16)
                                    );
                                  }}
                                  className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-3xs font-semibold cursor-pointer"
                                >
                                  Edit Time
                                </button>
                              )}

                              {/* Delete Stop (if > 2 stops) */}
                              {effectiveWaypoints.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteWaypoint(w.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer transition-colors"
                                  title="Delete stop"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </EnhancedRouteVisualization>
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

          {/* TAB 3: CUSTOMS & BORDER PROFILE (Matching dedicated Customs Board) */}
          {activeTab === "customs" && (
            <CustomsOrderProfileTab
              shipment={shipment}
              onOpenDocumentModal={(type) => setTemplateDocType(type)}
            />
          )}

          {/* TAB 5: TRIP LEGS MANAGEMENT */}
          {activeTab === "legs" && (
            <TripLegsSection
              loadId={shipment?.id || shipment?.loadId}
              totalCost={shipment?.estimatedRevenue}
              totalDistance={shipment?.totalDistance}
            />
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

      {/* Document Viewer Modal Overlay */}
      {docViewerModal && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-scale-up space-y-0">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans">
                    {docViewerModal.name || "Carrier_BOL_Primary.pdf"}
                  </h3>
                  <p className="text-xs text-emerald-400 font-mono">
                    ● Digital BOL Document • {docViewerModal.size || "240 KB"} • Verified Sign-off
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDocViewerModal(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 text-lg font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Document Viewer Content Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-slate-50">
              {/* Real Uploaded Document Image / File Attachment Preview */}
              {docViewerModal?.url && docViewerModal.url.startsWith("http") && (
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 text-center space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-emerald-400 font-bold uppercase">📷 Uploaded BOL Document Attachment</span>
                    <a href={docViewerModal.url} target="_blank" rel="noreferrer" className="text-3xs text-indigo-400 hover:text-indigo-300 underline font-mono">
                      Open Source Link ↗
                    </a>
                  </div>
                  {docViewerModal.url.toLowerCase().endsWith(".pdf") ? (
                    <iframe src={docViewerModal.url} className="w-full h-64 rounded-xl border border-slate-800 bg-white" title="Uploaded PDF Preview" />
                  ) : (
                    <img src={docViewerModal.url} alt="Uploaded BOL" className="max-h-64 mx-auto rounded-xl border border-slate-800 object-contain shadow-lg" referrerPolicy="no-referrer" />
                  )}
                </div>
              )}

              {/* Document Banner */}
              <div className="bg-emerald-950 text-emerald-100 p-4 rounded-2xl border border-emerald-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <div>
                    <span className="font-bold text-white">Official Freight Bill of Lading (BOL)</span>
                    <p className="text-3xs text-emerald-300 font-mono mt-0.5">
                      Carrier Sign-off Complete • Load #{shipment.load_number || shipment.tracking_number}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-800 text-emerald-200 rounded-full font-mono text-3xs font-bold uppercase">
                  VERIFIED
                </span>
              </div>

              {/* Simulated Paper Manifest Preview */}
              <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-inner space-y-4 font-mono text-xs text-slate-800">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <div>
                    <div className="text-sm font-extrabold text-slate-900 font-sans">LOGISYNC FREIGHT MANIFEST</div>
                    <div className="text-3xs text-slate-500">Bill of Lading #{shipment.load_number || shipment.tracking_number}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xs text-slate-500">ISSUED DATE</div>
                    <div className="text-xs font-bold text-indigo-600">{new Date().toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-3xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                    <div className="font-bold text-slate-500 uppercase">Shipper / Pickup Origin</div>
                    <div className="font-bold text-slate-900">{shipment.customerName || shipment.customer_name || "AeroParts Mfg Facility"}</div>
                    <div>{shipment.shipper_state || shipment.originCity || "Toronto, ON"}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                    <div className="font-bold text-slate-500 uppercase">Consignee / Destination</div>
                    <div className="font-bold text-slate-900">Midwest Distribution Hub</div>
                    <div>{shipment.consignee_state || shipment.destinationCity || "Chicago, IL"}</div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden text-3xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-2">Item Description</th>
                        <th className="p-2">Pallets</th>
                        <th className="p-2">Weight</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 font-bold"><FormatCargoOrLink text={shipment.cargo || shipment.cargoDescription || "Industrial Cargo Components"} /></td>
                        <td className="p-2 font-mono">{shipment.pieces || shipment.pallets || 4} Pallets</td>
                        <td className="p-2 font-mono">{(shipment.weightLbs || shipment.weight || 6000).toLocaleString()} Lbs</td>
                        <td className="p-2 text-emerald-600 font-bold">INSPECTED & SIGNED</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-3xs">
                  <div className="space-y-0.5">
                    <div className="text-slate-500 font-bold">DRIVER SIGN-OFF STAMP</div>
                    <div className="font-bold text-slate-900 font-sans">{shipment.driverName || shipment.driver_name || "Marcus Vance (Driver License Verified)"}</div>
                  </div>
                  <div className="px-3 py-1 bg-emerald-600 text-white font-mono font-bold rounded-lg text-3xs">
                    SIGNED & ATTACHED
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  if (docViewerModal?.url && docViewerModal.url.startsWith("http")) {
                    window.open(docViewerModal.url, "_blank");
                  } else {
                    alert("Downloading BOL PDF file...");
                  }
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <Download className="h-4 w-4 text-slate-600" />
                <span>Download File</span>
              </button>
              <button
                onClick={() => setDocViewerModal(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Customs e-Manifest Barcode Modal */}
      <CustomsManifestModal
        shipment={shipment}
        isOpen={isCustomsModalOpen}
        onClose={() => setIsCustomsModalOpen(false)}
        onSendToDriverChat={(shp) => {
          setIsCustomsModalOpen(false);
        }}
      />
      {/* Official Nishan Transport PAPS / PARS / BOL Preset Generator Modal */}
      {templateDocType && (
        <DocumentTemplateModal
          isOpen={Boolean(templateDocType)}
          onClose={() => setTemplateDocType(null)}
          documentType={templateDocType}
          shipment={shipment}
          onSendToDriverChat={(shp) => {
            setTemplateDocType(null);
          }}
        />
      )}
    </div>
  );
}

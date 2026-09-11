import React, { useState, useEffect, useMemo } from "react";
import { useShipmentStore } from "../stores/useShipmentStore";
import { useMessageStore } from "../stores/useMessageStore";
import { useAuthStore } from "../stores/useAuthStore";
import WhatsAppChatHub from "../components/WhatsAppChatHub";
import ShipmentDetailsModal from "../components/ShipmentDetailsModal";
import {
  Warehouse,
  PackageCheck,
  ClipboardCheck,
  Boxes,
  CheckCircle2,
  Search,
  MessageSquare,
  Truck,
  Eye,
  Calendar,
  ShieldAlert,
  Clock,
  MapPin,
} from "lucide-react";

export default function WarehouseManagerPage() {
  const shipments = useShipmentStore((state) => state.shipments);
  const fetchShipments = useShipmentStore((state) => state.fetchShipments);
  const updateShipment = useShipmentStore((state) => state.updateShipment);

  const messages = useMessageStore((state) => state.messages);
  const fetchMessages = useMessageStore((state) => state.fetchMessages);
  const sendMessageStore = useMessageStore((state) => state.sendMessage);
  const markAsRead = useMessageStore((state) => state.markAsRead);

  const currentUser = useAuthStore((state) => state.currentUser);

  const [activeTab, setActiveTab] = useState("intake"); // "intake" | "whatsapp"
  const [warehouseIntakeFilter, setWarehouseIntakeFilter] = useState("active"); // "active" | "awaiting" | "at_warehouse" | "departed" | "all"
  const [searchQuery, setSearchQuery] = useState("");
  const [commitmentFilter, setCommitmentFilter] = useState("all");

  const [selectedShipment, setSelectedShipment] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Intake Modal state
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [intakeShipment, setIntakeShipment] = useState(null);
  const [intakeBay, setIntakeBay] = useState("");
  const [intakeNotes, setIntakeNotes] = useState("");
  const [intakePallets, setIntakePallets] = useState(1);
  const [intakeWeight, setIntakeWeight] = useState(1000);
  const [intakeCondition, setIntakeCondition] = useState(
    "Passed Inspection (100% Intact)"
  );
  const [intakeSuccessMsg, setIntakeSuccessMsg] = useState("");

  useEffect(() => {
    fetchShipments();
    fetchMessages();
  }, [fetchShipments, fetchMessages]);

  // Helper for delivery commitment badge info
  const getCommitmentInfo = (s) => {
    const c = String(s.commitment || s.commitment_type || s.deliveryCommitment || "").toLowerCase();
    const needsAppt = Boolean(s.requiresAppointment || s.appointmentNeeded);

    if (needsAppt || c.includes("appointment")) {
      if (c.includes("guaranteed")) {
        return {
          label: "GUARANTEED WITH APPOINTMENT NEEDED",
          weight: 4,
          badgeClass: "bg-rose-100 text-rose-900 border-rose-300 font-black",
          icon: "⭐📅",
        };
      }
      return {
        label: "APPOINTMENT DELIVERY",
        weight: 3,
        badgeClass: "bg-purple-100 text-purple-900 border-purple-300 font-bold",
        icon: "📅",
      };
    }
    if (c.includes("guaranteed")) {
      return {
        label: "GUARANTEED DELIVERY",
        weight: 2,
        badgeClass: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
        icon: "⚡",
      };
    }
    return {
      label: "NORMAL DELIVERY",
      weight: 1,
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
      icon: "📦",
    };
  };

  // Helper to determine status lifecycle stage
  const getStatusStage = (s) => {
    const st = String(s.status || "")
      .toLowerCase()
      .replace(/\s+/g, "_");
    const isAtWh =
      st === "at_warehouse" ||
      st === "at warehouse" ||
      s.status === "At Warehouse";
    const isPostWarehouse =
      st === "in_transit" ||
      st === "out_for_delivery" ||
      st === "delivered" ||
      st === "trip_assigned" ||
      st === "cancelled" ||
      st === "completed";
    const isAwaitingIntake = !isAtWh && !isPostWarehouse;
    return { st, isAtWh, isPostWarehouse, isAwaitingIntake };
  };

  const unreceivedWarehouseCount = useMemo(() => {
    return shipments.filter((s) => getStatusStage(s).isAwaitingIntake).length;
  }, [shipments]);

  const atWarehouseCount = useMemo(() => {
    return shipments.filter((s) => getStatusStage(s).isAtWh).length;
  }, [shipments]);

  const filteredLoads = useMemo(() => {
    return shipments.filter((s) => {
      const { isAtWh, isPostWarehouse, isAwaitingIntake } = getStatusStage(s);

      if (warehouseIntakeFilter === "active" && isPostWarehouse) return false;
      if (warehouseIntakeFilter === "awaiting" && !isAwaitingIntake)
        return false;
      if (warehouseIntakeFilter === "at_warehouse" && !isAtWh) return false;
      if (warehouseIntakeFilter === "departed" && !isPostWarehouse)
        return false;

      if (commitmentFilter !== "all") {
        const info = getCommitmentInfo(s);
        if (commitmentFilter === "guaranteed_appointment" && info.weight !== 4)
          return false;
        if (commitmentFilter === "appointment" && info.weight !== 3)
          return false;
        if (commitmentFilter === "guaranteed" && info.weight !== 2)
          return false;
        if (commitmentFilter === "normal" && info.weight !== 1) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const trk = (s.trackingNumber || s.tracking_number || "").toLowerCase();
        const customer = (
          s.customerName ||
          s.customer_name ||
          ""
        ).toLowerCase();
        const cargo = (
          s.cargoDescription ||
          s.cargo_description ||
          ""
        ).toLowerCase();
        const loc = (
          s.warehouse_location ||
          s.warehouseBay ||
          ""
        ).toLowerCase();
        if (
          !trk.includes(q) &&
          !customer.includes(q) &&
          !cargo.includes(q) &&
          !loc.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [shipments, warehouseIntakeFilter, commitmentFilter, searchQuery]);

  const handleOpenIntakeModal = (s) => {
    setIntakeShipment(s);
    setIntakeBay(
      s.warehouse_location || s.warehouseBay || "Bay A-1 (Origin Hub)"
    );
    setIntakeNotes(s.warehouseNotes || s.inspectionNotes || "");
    setIntakePallets(s.pieces || s.pallets || 1);
    setIntakeWeight(s.weightLbs || s.weight || 1000);
    setIntakeCondition(s.intakeCondition || "Passed Inspection (100% Intact)");
    setIsIntakeModalOpen(true);
  };

  const handleConfirmWarehouseIntake = async () => {
    if (!intakeShipment) return;
    const updated = {
      ...intakeShipment,
      status: "at_warehouse",
      //   warehouse_location: intakeBay,
      //   warehouseBay: intakeBay,
      //   warehouseNotes: intakeNotes,
      pieces: Number(intakePallets) || intakeShipment.palletCount || 1,
      weight: Number(intakeWeight) || intakeShipment.weightLbs || 1000,
      intakeCondition: intakeCondition,
      receivedAtWarehouse: true,
      receivedAtWarehouseDate: new Date().toISOString(),
    };

    await updateShipment(updated);

    if (selectedShipment && selectedShipment.id === intakeShipment.id) {
      setSelectedShipment(updated);
    }
    setIsIntakeModalOpen(false);
    setIntakeSuccessMsg(
      `Shipment #${updated.trackingNumber} checked & updated status to "At Warehouse" (${intakeBay})!`
    );
    setTimeout(() => setIntakeSuccessMsg(""), 5000);
  };

  const handleSendMessage = async (
    content,
    recipientId,
    shipmentId,
    attachment
  ) => {
    await sendMessageStore({
      id: "MSG" + (messages.length + 101),
      senderRole: "warehouse_manager",
      senderName: currentUser?.name || "Warehouse Manager",
      recipientId: recipientId || "DISP_OFFICE",
      content,
      timestamp: new Date().toISOString(),
      read: false,
      shipmentId,
      attachment,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Warehouse className="h-7 w-7 text-amber-600" />
            Warehouse Receiving & Intake Hub
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Origin Cross-Docking & Freight Receiving Terminal for Warehouse
            Managers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("intake")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 border ${activeTab === "intake"
              ? "bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md"
              : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
              }`}
          >
            <Boxes className="h-4 w-4" />
            <span>Dock Intake Desk ({unreceivedWarehouseCount} Pending)</span>
          </button>

          <button
            onClick={() => setActiveTab("whatsapp")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 border ${activeTab === "whatsapp"
              ? "bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md"
              : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
              }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Dock Support Communications</span>
          </button>
        </div>
      </div>

      {intakeSuccessMsg && (
        <div className="bg-emerald-500 text-white p-4 rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-2 font-bold text-sm animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>{intakeSuccessMsg}</span>
          </div>
          <button
            onClick={() => setIntakeSuccessMsg("")}
            className="text-white/80 hover:text-white font-mono text-xs uppercase"
          >
            Dismiss
          </button>
        </div>
      )}

      {activeTab === "whatsapp" ? (
        <WhatsAppChatHub
          messages={messages}
          shipments={shipments}
          currentUser={currentUser}
          onSendMessage={handleSendMessage}
          onMarkMessagesAsRead={markAsRead}
        />
      ) : (
        <div className="space-y-6">
          {/* Top Banner KPI Header */}
          <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl border border-amber-500/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                    Warehouse Receiving Terminal
                  </span>
                  <span className="text-slate-400 text-xs font-mono">
                    Role: Warehouse Manager
                  </span>
                </div>
                <h2 className="text-xl font-bold font-sans text-white tracking-tight flex items-center gap-2">
                  <Warehouse className="h-6 w-6 text-amber-400" />
                  Freight Intake & Cross-Dock Management
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl font-medium">
                  Perform incoming freight checks, log pallet weight &
                  condition, assign warehouse bays, and update load status to{" "}
                  <span className="text-amber-300 font-bold font-mono underline">
                    At Warehouse
                  </span>{" "}
                  for consolidation or driver pickup.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setWarehouseIntakeFilter("awaiting")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 border ${warehouseIntakeFilter === "awaiting"
                    ? "bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md"
                    : "bg-white/10 text-white hover:bg-white/20 border-white/20"
                    }`}
                >
                  <PackageCheck className="h-4 w-4" />
                  <span>Awaiting Intake ({unreceivedWarehouseCount})</span>
                </button>
                <button
                  onClick={() => setWarehouseIntakeFilter("at_warehouse")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 border ${warehouseIntakeFilter === "at_warehouse"
                    ? "bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md"
                    : "bg-white/10 text-white hover:bg-white/20 border-white/20"
                    }`}
                >
                  <Warehouse className="h-4 w-4" />
                  <span>Stored at WH ({atWarehouseCount})</span>
                </button>
              </div>
            </div>

            {/* Metric KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
              <div className="bg-white/5 backdrop-blur rounded-xl p-3.5 border border-white/10">
                <div className="text-[10px] font-mono text-slate-300 font-bold uppercase">
                  Pending WH Intake
                </div>
                <div className="text-2xl font-black text-amber-400 mt-1">
                  {unreceivedWarehouseCount}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5 font-sans">
                  Awaiting dock verification
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3.5 border border-white/10">
                <div className="text-[10px] font-mono text-slate-300 font-bold uppercase">
                  Stored At Warehouse
                </div>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {atWarehouseCount}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5 font-sans">
                  Loads with status "At Warehouse"
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3.5 border border-white/10">
                <div className="text-[10px] font-mono text-slate-300 font-bold uppercase">
                  Guaranteed & Appts
                </div>
                <div className="text-2xl font-black text-rose-400 mt-1">
                  {
                    shipments.filter((s) => {
                      const st = String(s.status || "")
                        .toLowerCase()
                        .replace(/\s+/g, "_");
                      const isWh =
                        st === "at_warehouse" ||
                        st === "at warehouse" ||
                        s.status === "At Warehouse";
                      const info = getCommitmentInfo(s);
                      return isWh && info.weight >= 3;
                    }).length
                  }
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5 font-sans">
                  High priority loads staged
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3.5 border border-white/10">
                <div className="text-[10px] font-mono text-slate-300 font-bold uppercase">
                  Total Staged Pallets
                </div>
                <div className="text-2xl font-black text-indigo-300 mt-1">
                  {shipments.reduce((sum, s) => {
                    const st = String(s.status || "")
                      .toLowerCase()
                      .replace(/\s+/g, "_");
                    const isWh =
                      st === "at_warehouse" ||
                      st === "at warehouse" ||
                      s.status === "At Warehouse";
                    return isWh
                      ? sum + Number(s.pieces || s.pallets || 1)
                      : sum;
                  }, 0)}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5 font-sans">
                  Pallets in origin facility
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tracking #, customer, cargo, bay..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50 text-slate-800 font-medium"
                />
              </div>

              <select
                value={warehouseIntakeFilter}
                onChange={(e) => setWarehouseIntakeFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Freight Loads</option>
                <option value="active">
                  Active Dock Loads (Awaiting + Stored)
                </option>
                <option value="awaiting">Awaiting Dock Intake Only</option>
                <option value="at_warehouse">
                  Stored at Warehouse (Received)
                </option>
                <option value="departed">En Route / Delivered Loads</option>
              </select>

              <select
                value={commitmentFilter}
                onChange={(e) => setCommitmentFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-bold text-amber-800 outline-none cursor-pointer"
              >
                <option value="all">All Delivery Commitments</option>
                <option value="guaranteed_appointment">
                  Guaranteed with Appointment
                </option>
                <option value="appointment">Appointment Delivery</option>
                <option value="guaranteed">Guaranteed Delivery</option>
                <option value="normal">Normal Delivery</option>
              </select>
            </div>

            <div className="text-xs font-mono font-bold text-slate-500">
              Showing{" "}
              <span className="text-slate-900">{filteredLoads.length}</span>{" "}
              shipments
            </div>
          </div>

          {/* Table of Shipments */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase text-slate-500 font-bold">
                    <th className="p-3">Tracking / Customer</th>
                    <th className="p-3">Commitment Level</th>
                    <th className="p-3">Route (Origin → Dest)</th>
                    <th className="p-3">Cargo & Weight</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Warehouse Location</th>
                    <th className="p-3 text-right">Intake Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLoads.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-slate-400 text-xs"
                      >
                        No matching shipments found for the selected warehouse
                        filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLoads.map((s) => {
                      const { st, isAtWh, isPostWarehouse, isAwaitingIntake } =
                        getStatusStage(s);
                      const info = getCommitmentInfo(s);

                      return (
                        <tr
                          key={s.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="p-3">
                            <div className="font-mono font-bold text-indigo-600 text-xs">
                              {s.load_number || s.tracking_number}
                            </div>
                            <div className="text-xs font-semibold text-slate-900 mt-0.5">
                              {s.customerName || s.customer_name}
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-3xs font-extrabold border ${info.badgeClass}`}
                            >
                              <span>{info.icon}</span>
                              <span>{info.label}</span>
                            </span>
                          </td>
                          <td className="p-3 text-xs text-slate-600">
                            <div className="font-semibold text-slate-800">
                              {s.shipper_district},{s.shipper_state},
                              {s.shipper_country}
                            </div>
                            <div className="text-3xs text-slate-400">
                              → {s.consignee_district},{s.consignee_state},
                              {s.consignee_country}
                            </div>
                          </td>
                          <td className="p-3 text-xs text-slate-700">
                            <div className="font-medium text-slate-900">
                              {s.cargo ||
                                s.cargo_description ||
                                "General Freight"}
                            </div>
                            <div className="text-3xs font-mono text-slate-500 mt-0.5">
                              {s.pieces || s.pallets || 1} Pallets •{" "}
                              {s.weight || s.weight || 1000} Lbs
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-3xs font-bold uppercase tracking-wider inline-block ${isAtWh
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : st === "delivered"
                                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                  : isPostWarehouse
                                    ? "bg-indigo-100 text-indigo-900 border border-indigo-300"
                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                }`}
                            >
                              {isAtWh
                                ? "At Warehouse"
                                : st === "in_transit"
                                  ? "In Transit"
                                  : st === "out_for_delivery"
                                    ? "Out for Delivery"
                                    : st === "delivered"
                                      ? "Delivered"
                                      : st === "trip_assigned"
                                        ? "Trip Assigned"
                                        : s.status || "Pending"}
                            </span>
                          </td>
                          <td className="p-3 text-xs">
                            {isAtWh ? (
                              <span className="font-mono font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-3xs">
                                📍{" "}
                                {s.warehouse_location ||
                                  s.warehouseBay ||
                                  "Bay A-1 (Origin Hub)"}
                              </span>
                            ) : isPostWarehouse ? (
                              <span className="text-3xs text-slate-400 font-mono">
                                En Route Linehaul
                              </span>
                            ) : (
                              <span className="text-3xs text-slate-400 italic">
                                Unassigned Dock
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedShipment(s);
                                  setIsDetailModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="View Load Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              {isPostWarehouse ? (
                                <button
                                  onClick={() => {
                                    setSelectedShipment(s);
                                    setIsDetailModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 rounded-lg text-3xs font-bold bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 transition-all cursor-pointer inline-flex items-center space-x-1"
                                  title="This load has already departed or been delivered. Click to view load record."
                                >
                                  <Eye className="h-3 w-3" />
                                  <span>Departed (View)</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenIntakeModal(s)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer inline-flex items-center space-x-1.5 ${isAtWh
                                    ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300"
                                    : "bg-amber-600 hover:bg-amber-700 text-white font-extrabold shadow-amber-200"
                                    }`}
                                >
                                  <Warehouse className="h-3.5 w-3.5" />
                                  <span>
                                    {isAtWh
                                      ? "Edit Bay / Notes"
                                      : "Receive at Warehouse"}
                                  </span>
                                </button>
                              )}
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
      )}

      {/* Warehouse Intake & Inspection Modal */}
      {isIntakeModalOpen && intakeShipment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="bg-gradient-to-r from-slate-900 to-amber-950 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
                  <Warehouse className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Warehouse Intake & Inspection Desk
                  </h3>
                  <p className="text-xs text-amber-300 font-mono">
                    Tracking #
                    {intakeShipment.load_number ||
                      intakeShipment.tracking_number}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsIntakeModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>
                    Customer:{" "}
                    {intakeShipment.customerName ||
                      intakeShipment.customer_name}
                  </span>
                  <span className="font-mono text-3xs uppercase bg-amber-200/80 px-2 py-0.5 rounded text-amber-900">
                    {intakeShipment.commitment || "Normal Delivery"}
                  </span>
                </div>
                <p className="text-slate-700">
                  Cargo:{" "}
                  {intakeShipment.cargo ||
                    intakeShipment.cargo_description ||
                    "General Freight"}
                </p>
                <div className="text-3xs text-slate-500 font-mono pt-1 border-t border-amber-200/50 flex flex-wrap justify-between gap-2">
                  <span>
                    Origin: {intakeShipment.shipper_district},
                    {intakeShipment.shipper_state},
                    {intakeShipment.shipper_country}
                  </span>
                  <span>
                    Destination: {intakeShipment.consignee_district},
                    {intakeShipment.consignee_state},
                    {intakeShipment.consignee_country}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">
                    Warehouse Bay / Dock Assignment *
                  </label>
                  <select
                    value={intakeBay}
                    onChange={(e) => setIntakeBay(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                  >
                    <option value="Bay A-1 (Origin Hub)">
                      Bay A-1 (Origin Main Hub)
                    </option>
                    <option value="Bay A-2 (Origin Hub)">
                      Bay A-2 (Origin Main Hub)
                    </option>
                    <option value="Bay B-1 (Cross-Dock)">
                      Bay B-1 (Cross-Dock Facility)
                    </option>
                    <option value="Dock 04 (Receiving)">
                      Dock 04 (Inbound Receiving)
                    </option>
                    <option value="Dock 08 (Staging Area)">
                      Dock 08 (Consolidation Staging)
                    </option>
                    <option value="Storage Rack 14-B">
                      Storage Rack 14-B (Temperature Control)
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">
                      Verified Pallet Count
                    </label>
                    <input
                      type="number"
                      value={intakePallets}
                      onChange={(e) => setIntakePallets(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">
                      Verified Weight (Lbs)
                    </label>
                    <input
                      type="number"
                      value={intakeWeight}
                      onChange={(e) => setIntakeWeight(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">
                    Cargo Condition Inspection
                  </label>
                  <select
                    value={intakeCondition}
                    onChange={(e) => setIntakeCondition(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                  >
                    <option value="Passed Inspection (100% Intact)">
                      Passed Inspection (100% Intact & Sealed)
                    </option>
                    <option value="Minor Packaging Wear (Acceptable)">
                      Minor Packaging Wear (Acceptable)
                    </option>
                    <option value="Seal Verified at Dock">
                      Seal Verified at Receiving Dock
                    </option>
                    <option value="Re-palletized at Receiving">
                      Re-palletized at Receiving Station
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">
                    Receiving Notes & Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={intakeNotes}
                    onChange={(e) => setIntakeNotes(e.target.value)}
                    placeholder="Enter dock intake remarks, seal status, or storage instructions..."
                    className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsIntakeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmWarehouseIntake}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-all shadow-md shadow-amber-200 flex items-center space-x-2 cursor-pointer"
                >
                  <PackageCheck className="h-4 w-4" />
                  <span>Confirm Intake & Set "At Warehouse"</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedShipment && (
        <ShipmentDetailsModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          shipment={selectedShipment}
          onUpdateShipment={updateShipment}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
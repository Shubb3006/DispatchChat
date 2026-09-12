import React, { useState, useEffect, useMemo } from "react";
import { useShipmentStore } from "../stores/useShipmentStore";
import { useAuditStore } from "../stores/useAuditStore";
import { useTripStore } from "../stores/useTripStore";
import {
  Layers,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Truck,
  Warehouse,
  Gauge,
  FileSignature,
  Clock,
  CheckCircle2,
  FilePlus,
  DollarSign,
  Share2,
  SlidersHorizontal,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  LayoutGrid,
  List,
  Sparkles,
  Download,
  Activity,
  User,
  Zap,
  TableIcon,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import KanbanColumn from "../components/kanban/KanbanColumn";
import LoadOperationsBoard from "../components/kanban/LoadOperationsBoard";
import { MATCHING_STATUSES } from "../lib/loadStatuses";
import EntityHistoryModal from "../components/EntityHistoryModal";
import ShipmentDetailsModal from "../components/ShipmentDetailsModal";

export default function KanbanDispatchPage() {
  const { shipments, fetchShipments, updateShipmentStatus, updateShipment, isLoading } = useShipmentStore();
  const { recordClientAction } = useAuditStore();
  const { trips, fetchTrips } = useTripStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("comfortable"); // "comfortable" | "compact" | "table"
  const [auditModal, setAuditModal] = useState({ isOpen: false, loadId: null, loadIdentifier: "" });
  const [selectedShipmentForDrawer, setSelectedShipmentForDrawer] = useState(null);

  useEffect(() => {
    fetchShipments();
    fetchTrips();
    // Auto-refresh every 10s to sync with warehouse intake and other updates
    const interval = setInterval(() => {
      fetchShipments();
      fetchTrips();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchShipments, fetchTrips]);

  // Define 7 Freight Lifecycle Kanban Columns
  const columns = [
    {
      id: "col_pending",
      title: "1. Open Tenders / Unassigned",
      statusKey: "pending",
      icon: FilePlus,
      colorBg: "bg-amber-50",
      colorBorder: "border-amber-200",
      colorText: "text-amber-700",
      barColor: "bg-amber-400",
      matchingStatuses: MATCHING_STATUSES.col_pending,
    },
    {
      id: "col_dispatched",
      title: "2. Dispatched to Shipper",
      statusKey: "dispatched",
      icon: Truck,
      colorBg: "bg-indigo-50",
      colorBorder: "border-indigo-200",
      colorText: "text-indigo-700",
      barColor: "bg-indigo-500",
      matchingStatuses: MATCHING_STATUSES.col_dispatched,
    },
    {
      id: "col_at_pickup",
      title: "3. At Shipper / Loading Dock",
      statusKey: "at_pickup",
      icon: Warehouse,
      colorBg: "bg-sky-50",
      colorBorder: "border-sky-200",
      colorText: "text-sky-700",
      barColor: "bg-sky-500",
      matchingStatuses: MATCHING_STATUSES.col_at_pickup,
    },
    {
      id: "col_in_transit",
      title: "4. In Transit / Highway GPS",
      statusKey: "in_transit",
      icon: Gauge,
      colorBg: "bg-cyan-50",
      colorBorder: "border-cyan-200",
      colorText: "text-cyan-700",
      barColor: "bg-cyan-500",
      matchingStatuses: MATCHING_STATUSES.col_in_transit,
    },
    {
      id: "col_at_border",
      title: "5. Customs & Border Port",
      statusKey: "at_border",
      icon: FileSignature,
      colorBg: "bg-purple-50",
      colorBorder: "border-purple-200",
      colorText: "text-purple-700",
      barColor: "bg-purple-500",
      matchingStatuses: MATCHING_STATUSES.col_at_border,
    },
    {
      id: "col_at_delivery",
      title: "6. At Receiver / Warehouse Intake",
      statusKey: "at_delivery",
      icon: Clock,
      colorBg: "bg-orange-50",
      colorBorder: "border-orange-200",
      colorText: "text-orange-700",
      barColor: "bg-orange-500",
      matchingStatuses: MATCHING_STATUSES.col_at_delivery,
    },
    {
      id: "col_delivered",
      title: "7. Delivered / Ready to Bill",
      statusKey: "delivered",
      icon: CheckCircle2,
      colorBg: "bg-emerald-50",
      colorBorder: "border-emerald-200",
      colorText: "text-emerald-700",
      barColor: "bg-emerald-500",
      matchingStatuses: MATCHING_STATUSES.col_delivered,
    },
  ];

  // Filter Shipments
  const filteredShipments = useMemo(() => {
    return (shipments || []).filter((s) => {
      // 1. Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const loadNum = String(s.load_number || s.tracking_number || s.id || "").toLowerCase();
        const customer = String(s.customer_name || s.customerName || "").toLowerCase();
        const driver = String(s.driver_name || s.driverName || "").toLowerCase();
        const origin = String(s.shipper_district || s.originCity || "").toLowerCase();
        const dest = String(s.consignee_district || s.destinationCity || "").toLowerCase();

        if (
          !loadNum.includes(q) &&
          !customer.includes(q) &&
          !driver.includes(q) &&
          !origin.includes(q) &&
          !dest.includes(q)
        ) {
          return false;
        }
      }

      // 2. Equipment filter
      if (equipmentFilter !== "ALL") {
        const type = s.loadType || (String(s.commodity || s.cargoDescription).toLowerCase().includes("ltl") ? "LTL" : "FTL");
        if (type !== equipmentFilter) return false;
      }

      // 3. Priority filter
      if (priorityFilter !== "ALL") {
        const p = s.priority || (Number(s.rate || s.priceInvoice) > 3500 ? "Expedited" : "Normal");
        if (p !== priorityFilter) return false;
      }

      return true;
    });
  }, [shipments, searchTerm, equipmentFilter, priorityFilter]);

  // Pipeline Metrics
  const stats = useMemo(() => {
    const totalCount = filteredShipments.length;
    const totalValue = filteredShipments.reduce(
      (acc, s) => acc + (Number(s.rate || s.priceInvoice) || 2850),
      0
    );
    const inTransit = filteredShipments.filter((s) => s.status === "in_transit").length;
    const delivered = filteredShipments.filter((s) => s.status === "delivered").length;
    return { totalCount, totalValue, inTransit, delivered };
  }, [filteredShipments]);

  // Persist an inline edit from the Operations Board, then refetch so the
  // store re-normalizes the row (the update response is a raw DB row).
  const handleSaveLoad = async (loadId, changes) => {
    await updateShipment({ id: loadId, ...changes });
    await fetchShipments();
  };

  // Handle Drag & Drop Status Updates
  const handleDropLoad = async (loadId, newStatus, columnId) => {
    const target = shipments.find((s) => s.id === loadId);
    if (!target) return;

    if (target.status === newStatus) return;

    const oldStatus = target.status || "pending";
    const loadIdentifier = `Load #${target.load_number || target.id}`;

    await updateShipmentStatus(loadId, newStatus);

    await recordClientAction({
      action: "STATUS_CHANGED",
      entity_type: "LOAD",
      entity_id: loadId,
      entity_identifier: loadIdentifier,
      change_summary: `Kanban pipeline drag: Moved ${loadIdentifier} from ${oldStatus.replace("_", " ")} to ${newStatus.replace("_", " ")}`,
      details: {
        previous_status: oldStatus,
        new_status: newStatus,
        column_target: columnId,
      },
    });

    toast.success(`Moved ${loadIdentifier} to ${newStatus.replace("_", " ").toUpperCase()}`);
  };

  const handleExportCsv = () => {
    const headers = ["Load #", "Customer", "Driver", "Origin", "Destination", "Status", "Rate ($)", "Equipment", "Priority"];
    const rows = filteredShipments.map((s) => [
      s.load_number || s.id,
      `"${s.customer_name || s.customerName || ""}"`,
      `"${s.driver_name || s.driverName || ""}"`,
      `"${s.shipper_district || s.originCity || ""}, ${s.shipper_state || s.shipperState || ""}"`,
      `"${s.consignee_district || s.destinationCity || ""}, ${s.consignee_state || s.consigneeState || ""}"`,
      `"${s.status || ""}"`,
      s.rate || s.priceInvoice || 2850,
      s.loadType || "FTL",
      s.priority || "Normal",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Nishan_Kanban_Pipeline_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Kanban freight pipeline exported to CSV!");
  };
  if (shipments.length === 0 && isLoading) {
    return (
      <div className="flex flex-col min-h-[300px] items-center justify-center">
        <Loader2 className="animate-spin" />
        Loading Loads...
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-full pb-10">
      {/* Top Glassmorphic Command Header */}
      <div className="bg-base-100 border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-base-content tracking-tight">
                  Interactive Freight Kanban Pipeline
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  SAMSARA TELEMETRY SYNCED
                </span>
              </div>
              <p className="text-xs text-base-content font-medium mt-0.5">
                End-to-end visual load lifecycle management with drag-and-drop state machines, live Samsara GPS speed, and automated audit logging.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setViewMode("comfortable")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${viewMode === "comfortable" ? "bg-base-100 text-base-content shadow-2xs" : "text-base-content hover:text-base-content"
                }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Full Cards</span>
            </button>
            <button
              onClick={() => setViewMode("compact")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${viewMode === "compact" ? "bg-base-100 text-base-content shadow-2xs" : "text-base-content hover:text-base-content"
                }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Compact</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${viewMode === "table" ? "bg-base-100 text-base-content shadow-2xs" : "text-base-content hover:text-base-content"
                }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-base-100 hover:bg-base-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-base-content" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              fetchShipments();
              toast.success("Pipeline refreshed with live database");
            }}
            disabled={isLoading}
            className="p-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl cursor-pointer transition shadow-xs"
            title="Refresh Pipeline"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Fleet Pipeline Distribution Meter */}
      <div className="bg-base-100 border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-mono font-bold text-slate-700 uppercase text-[11px]">
            <Activity className="w-3.5 h-3.5 text-sky-600" />
            <span>Freight Pipeline Distribution:</span>
            <strong className="text-base-content font-black">{stats.totalCount} Active Loads (${stats.totalValue.toLocaleString()} Total Value)</strong>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">7 Lifecycle Stages Active</span>
        </div>

        {/* Multi-Segment Color Bar */}
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          {columns.map((col) => {
            const count = filteredShipments.filter((s) => {
              const status = s.status ? s.status.toLowerCase() : "pending";
              return col.matchingStatuses.includes(status);
            }).length;
            const pct = stats.totalCount > 0 ? (count / stats.totalCount) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={col.id}
                style={{ width: `${pct}%` }}
                className={`${col.barColor} h-full transition-all duration-300`}
                title={`${col.title}: ${count} loads (${pct.toFixed(0)}%)`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs pt-0.5">
          {columns.map((col) => {
            const count = filteredShipments.filter((s) => {
              const status = s.status ? s.status.toLowerCase() : "pending";
              return col.matchingStatuses.includes(status);
            }).length;
            return (
              <div key={col.id} className="flex items-center gap-1.5 text-[11px]">
                <span className={`w-2 h-2 rounded-full ${col.barColor}`} />
                <span className="text-slate-600 font-medium">{col.title.replace(/^\d+\.\s*/, "")}:</span>
                <strong className="text-base-content font-mono">{count}</strong>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-base-100 border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Load #, Customer, Driver, Origin, or Destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-base-200 border border-slate-200 rounded-xl text-xs text-base-content placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          />
        </div>

        {/* Equipment Selector */}
        <div className="w-full md:w-40">
          <select
            value={equipmentFilter}
            onChange={(e) => setEquipmentFilter(e.target.value)}
            className="w-full px-3 py-2 bg-base-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer"
          >
            <option value="ALL">All Modes (FTL/LTL)</option>
            <option value="FTL">Full Truckload (FTL)</option>
            <option value="LTL">Less Than Truckload (LTL)</option>
          </select>
        </div>

        {/* Priority Selector */}
        <div className="w-full md:w-36">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-2 bg-base-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="Normal">Normal</option>
            <option value="Expedited">Expedited</option>
            <option value="Urgent">Urgent / Hot</option>
          </select>
        </div>

        {(searchTerm || equipmentFilter !== "ALL" || priorityFilter !== "ALL") && (
          <button
            onClick={() => {
              setSearchTerm("");
              setEquipmentFilter("ALL");
              setPriorityFilter("ALL");
            }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* Load Operations Control Board — row-per-load with trip grouping,
          date-range + per-column filters, and inline editing */}
      {viewMode === "table" && (
        <LoadOperationsBoard
          shipments={filteredShipments}
          trips={trips}
          onOpenDetails={(s) => setSelectedShipmentForDrawer(s)}
          onSaveLoad={handleSaveLoad}
        />
      )}

      {/* Horizontal Scrollable Kanban Columns Board */}
      {viewMode !== "table" && (
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 select-none no-scrollbar">
          {columns.map((column) => {
            const columnShipments = filteredShipments.filter((s) => {
              const status = s.status ? s.status.toLowerCase() : "pending";
              return column.matchingStatuses.includes(status);
            });

            return (
              <KanbanColumn
                key={column.id}
                column={column}
                shipments={columnShipments}
                cardDensity={viewMode}
                onDropLoad={handleDropLoad}
                onOpenHistory={(shipment) => {
                  setAuditModal({
                    isOpen: true,
                    loadId: shipment.id,
                    loadIdentifier: `Load #${shipment.load_number || shipment.id}`,
                  });
                }}
                onOpenDetails={(shipment) => {
                  setSelectedShipmentForDrawer(shipment);
                }}
              />
            );
          })}
        </div>
      )}

      {/* Embedded Entity History / Audit Trail Modal */}
      <EntityHistoryModal
        isOpen={auditModal.isOpen}
        onClose={() => setAuditModal({ isOpen: false, loadId: null, loadIdentifier: "" })}
        entityType="LOAD"
        entityId={auditModal.loadId}
        entityIdentifier={auditModal.loadIdentifier}
      />

      {/* Shipment Details Full Inspection & Edit Modal */}
      {selectedShipmentForDrawer && (
        <ShipmentDetailsModal
          isOpen={!!selectedShipmentForDrawer}
          onClose={() => setSelectedShipmentForDrawer(null)}
          shipment={selectedShipmentForDrawer}
          currentUser={{ role: "admin", username: "Dispatcher" }}
          onUpdateShipment={async (updated) => {
            // updateShipment takes the whole shipment and derives the id from
            // it; the old (id, data) call passed the id string as the shipment
            // and PUT to /load/undefined.
            await updateShipment(updated);
            fetchShipments();
          }}
        />
      )}
    </div>
  );
}

import React, { useState, useMemo } from "react";
import KanbanCard from "./KanbanCard";
import {
  Layers,
  Plus,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function KanbanColumn({
  column,
  shipments = [],
  onDropLoad,
  onOpenHistory,
  onOpenDetails,
  cardDensity = "comfortable",
  onQuickAdd,
}) {
  const [isOver, setIsOver] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sortBy, setSortBy] = useState("default"); // "default" | "rate" | "priority"

  const totalColumnValue = useMemo(() => {
    return shipments.reduce(
      (acc, s) => acc + (Number(s.rate || s.priceInvoice) || 2850),
      0
    );
  }, [shipments]);

  // Sort shipments inside column
  const sortedShipments = useMemo(() => {
    const list = [...shipments];
    if (sortBy === "rate") {
      return list.sort((a, b) => (Number(b.rate || b.priceInvoice) || 0) - (Number(a.rate || a.priceInvoice) || 0));
    }
    if (sortBy === "priority") {
      const pScore = (p) => (p === "Urgent" ? 3 : p === "Expedited" ? 2 : 1);
      return list.sort((a, b) => pScore(b.priority) - pScore(a.priority));
    }
    return list;
  }, [shipments, sortBy]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!isOver) setIsOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (data && data.loadId) {
        onDropLoad(data.loadId, column.statusKey, column.id);
      }
    } catch (err) {
      console.warn("Invalid drop data:", err);
    }
  };

  const Icon = column.icon;

  if (isCollapsed) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => setIsCollapsed(false)}
        className={`w-14 shrink-0 bg-slate-100/90 border border-slate-200 rounded-2xl p-3 flex flex-col items-center justify-between cursor-pointer hover:bg-slate-200/80 transition-all ${isOver ? "ring-2 ring-sky-400 bg-sky-100" : ""
          }`}
        title={`Click to expand ${column.title}`}
      >
        <div className="flex flex-col items-center gap-3 pt-1">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-2xs ${column.colorBg} ${column.colorBorder} ${column.colorText}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-base-100 text-slate-800 border border-slate-200 shadow-2xs">
            {shipments.length}
          </span>
        </div>

        <div className="rotate-90 whitespace-nowrap text-xs font-black text-slate-700 tracking-tight my-16 origin-center">
          {column.title.replace(/^\d+\.\s*/, "")}
        </div>

        <ChevronRight className="w-4 h-4 text-slate-400 mb-1" />
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-84 shrink-0 flex flex-col rounded-2xl border transition-all duration-200 ${isOver
        ? "bg-sky-50/80 border-sky-400 ring-2 ring-sky-300 shadow-lg scale-[1.01]"
        : "bg-slate-100/70 border-slate-200/90 hover:border-slate-300"
        }`}
    >
      {/* Modern Glassmorphic Column Header */}
      <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between bg-base-100 rounded-t-2xl shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-2xs shrink-0 ${column.colorBg} ${column.colorBorder} ${column.colorText}`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-black text-base-content tracking-tight truncate">
                {column.title}
              </h3>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-black bg-slate-100 text-slate-800 border border-slate-200">
                {shipments.length}
              </span>
            </div>
            <div className="text-[10px] text-base-content font-mono font-bold">
              ${totalColumnValue.toLocaleString()} Billed
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Quick Sort Button */}
          <button
            type="button"
            onClick={() => setSortBy(sortBy === "default" ? "rate" : sortBy === "rate" ? "priority" : "default")}
            title={`Sort: ${sortBy.toUpperCase()}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-base-content hover:bg-slate-100 transition cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>

          {/* Collapse Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            title="Collapse column"
            className="p-1.5 rounded-lg text-slate-400 hover:text-base-content hover:bg-slate-100 transition cursor-pointer"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Droppable Scrollable Cards Container */}
      <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[520px] max-h-[calc(100vh-270px)] no-scrollbar">
        {sortedShipments.length === 0 ? (
          <div
            className={`h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center transition-all ${isOver
              ? "border-sky-400 bg-sky-100/60 text-sky-800 shadow-inner"
              : "border-slate-300/70 text-slate-400 bg-base-100/50"
              }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-base-100 flex items-center justify-center shadow-2xs border border-slate-200 mb-2">
              <Layers className="w-5 h-5 text-slate-400" />
            </div>
            <span className="text-xs font-bold text-slate-700">Drop Freight Orders Here</span>
            <span className="text-[10px] text-slate-400 mt-0.5">to transition lifecycle stage</span>
          </div>
        ) : (
          sortedShipments.map((shipment) => (
            <KanbanCard
              key={shipment.id}
              shipment={shipment}
              cardDensity={cardDensity}
              onOpenHistory={onOpenHistory}
              onOpenDetails={onOpenDetails}
            />
          ))
        )}
      </div>
    </div>
  );
}

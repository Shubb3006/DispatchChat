import React, { useState, useEffect } from "react";
import { useAuditStore } from "../stores/useAuditStore";
import {
  History,
  X,
  User,
  Clock,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  FileText,
} from "lucide-react";

export default function EntityHistoryModal({
  isOpen,
  onClose,
  entityType = "LOAD",
  entityId,
  entityIdentifier = "",
}) {
  const { selectedEntityLogs, isEntityLoading, fetchEntityAuditLogs } = useAuditStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    if (isOpen && entityId) {
      fetchEntityAuditLogs(entityType, entityId);
    }
  }, [isOpen, entityType, entityId]);

  if (!isOpen) return null;

  const filteredLogs = (selectedEntityLogs || []).filter((log) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (log.username && log.username.toLowerCase().includes(term)) ||
      (log.action && log.action.toLowerCase().includes(term)) ||
      (log.change_summary && log.change_summary.toLowerCase().includes(term))
    );
  });

  const getActionBadge = (action = "") => {
    const act = action.toUpperCase();
    if (act.includes("CREATE")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (act.includes("DELETE") || act.includes("REFUSED") || act.includes("HOLD")) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    if (act.includes("STATUS")) {
      return "bg-sky-50 text-sky-700 border-sky-200";
    }
    if (act.includes("ASSIGN")) {
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-base-100 border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden text-base-content animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-base-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-2xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-base-content">
                  Audit Trail & Change History
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                  {entityType}
                </span>
              </div>
              <p className="text-xs text-base-content font-medium mt-0.5">
                Target: <strong className="text-slate-800 font-mono">{entityIdentifier || entityId}</strong> • Verified user timestamps & modifications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchEntityAuditLogs(entityType, entityId)}
              title="Refresh timeline"
              className="p-2 rounded-xl text-base-content hover:text-base-content hover:bg-slate-100 border border-slate-200 cursor-pointer transition shadow-2xs"
            >
              <RefreshCw className={`w-4 h-4 ${isEntityLoading ? "animate-spin text-sky-600" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-base-content hover:bg-slate-100 border border-slate-200 cursor-pointer transition shadow-2xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Quick Filter */}
        <div className="px-6 py-3 border-b border-slate-100 bg-base-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search user, action, or summary..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-base-200 border border-slate-200 rounded-xl text-xs text-base-content placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
            />
          </div>
          <span className="text-xs font-mono font-bold text-base-content shrink-0">
            {filteredLogs.length} event{filteredLogs.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Chronological Timeline Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-base-200/50">
          {isEntityLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-sky-600" />
              <span className="text-xs font-semibold">Retrieving verified change timeline...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <History className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">No recorded audit history</h3>
              <p className="text-xs text-base-content">
                Any future updates, status changes, or assignments will be recorded with timestamps here.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {filteredLogs.map((log, idx) => {
                const isExpanded = expandedLogId === log.id;
                const details = typeof log.details === "object" ? log.details : {};
                const hasDetails = details && Object.keys(details).length > 0;

                const dateObj = new Date(log.created_at);
                const exactTime = dateObj.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                });

                return (
                  <div key={log.id || idx} className="relative group">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-sky-600 shadow-xs ring-4 ring-sky-50 group-hover:scale-110 transition-transform" />

                    {/* Timeline Card */}
                    <div className="bg-base-100 border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {/* Actor & Action */}
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-black">
                            {log.username?.[0]?.toUpperCase() || "U"}
                          </div>
                          <span className="text-xs font-bold text-base-content">
                            {log.username || "System Automation"}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                            {log.user_role || "DISPATCHER"}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border ${getActionBadge(log.action)}`}>
                            {log.action?.replace("_", " ")}
                          </span>
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-base-content font-semibold">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{exactTime}</span>
                        </div>
                      </div>

                      {/* Summary */}
                      <p className="text-xs font-medium text-slate-700 leading-relaxed">
                        {log.change_summary}
                      </p>

                      {/* Details / Diff Drawer Accordion */}
                      {hasDetails && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="text-[11px] font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? "Hide Field Details" : "View Field Snapshot / Diff"}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>

                          {isExpanded && (
                            <div className="mt-2 p-3 bg-base-200 rounded-lg border border-slate-200 text-xs font-mono space-y-1.5 animate-in fade-in-50">
                              {Object.entries(details).map(([key, val]) => (
                                <div key={key} className="flex items-start justify-between gap-4 py-0.5 border-b border-slate-100 last:border-0">
                                  <span className="text-base-content font-bold uppercase text-[10px]">
                                    {key.replace("_", " ")}:
                                  </span>
                                  <span className="font-semibold text-slate-800 text-right truncate max-w-[280px]">
                                    {typeof val === "object" ? JSON.stringify(val) : String(val ?? "null")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-base-100 flex items-center justify-between text-xs text-base-content">
          <span className="font-medium">All modification records are cryptographically timestamped in PostgreSQL</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

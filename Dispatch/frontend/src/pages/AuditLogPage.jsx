import React, { useState, useEffect } from "react";
import { useAuditStore } from "../stores/useAuditStore";
import {
  History,
  Search,
  Filter,
  RefreshCw,
  User,
  Clock,
  ShieldCheck,
  FileText,
  Truck,
  FileSignature,
  DollarSign,
  Layers,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Activity,
  SlidersHorizontal,
  X,
  ChevronDown,
  ArrowRight,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AuditLogPage() {
  const {
    auditLogs,
    stats,
    filters,
    pagination,
    isLoading,
    fetchAuditLogs,
    fetchAuditStats,
    setFilters,
    setPage,
  } = useAuditStore();

  const [selectedLogForDiff, setSelectedLogForDiff] = useState(null);
  const [searchInput, setSearchInput] = useState(filters.search || "");

  useEffect(() => {
    fetchAuditLogs();
    fetchAuditStats();
    const interval = setInterval(() => {
      fetchAuditStats();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters({ search: searchInput });
  };

  const handleExportCsv = () => {
    if (!auditLogs || auditLogs.length === 0) {
      toast.error("No audit logs to export.");
      return;
    }

    const headers = ["Timestamp", "Username", "Role", "Action", "Entity Type", "Entity Identifier", "Summary", "IP Address"];
    const rows = auditLogs.map((log) => [
      new Date(log.created_at).toISOString(),
      `"${log.username || ""}"`,
      `"${log.user_role || ""}"`,
      `"${log.action || ""}"`,
      `"${log.entity_type || ""}"`,
      `"${log.entity_identifier || ""}"`,
      `"${(log.change_summary || "").replace(/"/g, '""')}"`,
      `"${log.ip_address || ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Nishan_TMS_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit log CSV exported successfully!");
  };

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
    if (act.includes("RATE")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getEntityIcon = (entityType = "") => {
    switch (entityType?.toUpperCase()) {
      case "LOAD":
        return <Truck className="w-3.5 h-3.5 text-sky-600" />;
      case "CUSTOMS":
        return <FileSignature className="w-3.5 h-3.5 text-indigo-600" />;
      case "DETENTION":
        return <Clock className="w-3.5 h-3.5 text-amber-600" />;
      case "MAINTENANCE":
        return <Activity className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="bg-base-100 border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-2xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-base-content tracking-tight">
                  Audit Trail & Change History Radar
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  REAL-TIME LOGGING ACTIVE
                </span>
              </div>
              <p className="text-xs text-base-content font-medium mt-0.5">
                Cryptographic audit trail tracking all modifications, driver assignments, rate changes, and customs filings with login timestamps.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              fetchAuditLogs();
              fetchAuditStats();
              toast.success("Audit records refreshed from PostgreSQL");
            }}
            disabled={isLoading}
            className="px-3 py-2 bg-base-100 hover:bg-base-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-sky-600" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Audit Log</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-base-100 border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-base-content">
              Modifications Today
            </div>
            <div className="text-2xl font-black text-base-content font-mono">
              {stats?.totalToday ?? 0}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Live Synced with Database</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-base-100 border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-base-content">
              Active Editors (7d)
            </div>
            <div className="text-2xl font-black text-base-content font-mono">
              {stats?.activeUsers?.length ?? 0}
            </div>
            <div className="text-[11px] text-base-content font-medium truncate max-w-[150px]">
              Top: {stats?.activeUsers?.[0]?.username || "Nishan Dispatch"}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <User className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-base-100 border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-base-content">
              Critical Actions
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono">
              {stats?.recentCritical?.length ?? 0}
            </div>
            <div className="text-[11px] text-base-content font-medium">
              Status & Assignment Edits
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-base-100 border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-base-content">
              Total Logged Records
            </div>
            <div className="text-2xl font-black text-base-content font-mono">
              {pagination.total ?? 0}
            </div>
            <div className="text-[11px] text-base-content font-medium">
              Across all fleet modules
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-base-100 border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Load #, User Name, Action Type, or Summary..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-base-200 border border-slate-200 rounded-xl text-xs text-base-content placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium shadow-2xs"
            />
          </div>

          {/* Entity Type Selector */}
          <div className="w-full md:w-44">
            <select
              value={filters.entity_type}
              onChange={(e) => setFilters({ entity_type: e.target.value })}
              className="w-full px-3 py-2 bg-base-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer"
            >
              <option value="ALL">All Entities</option>
              <option value="LOAD">Loads & Freight</option>
              <option value="CUSTOMS">Customs (PAPS/PARS)</option>
              <option value="DRIVER">Driver Fleet</option>
              <option value="DETENTION">Facility Detention</option>
              <option value="MAINTENANCE">Maintenance / DTC</option>
            </select>
          </div>

          {/* Action Filter */}
          <div className="w-full md:w-48">
            <select
              value={filters.action}
              onChange={(e) => setFilters({ action: e.target.value })}
              className="w-full px-3 py-2 bg-base-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer"
            >
              <option value="ALL">All Actions</option>
              <option value="STATUS_CHANGED">Status Changed</option>
              <option value="LOAD_CREATED">Load Created</option>
              <option value="LOAD_UPDATED">Load Updated</option>
              <option value="DRIVER_ASSIGNED">Driver Assigned</option>
              <option value="CUSTOMS_CREATED">Customs Created</option>
              <option value="CUSTOMS_UPDATED">Customs Updated</option>
              <option value="LOAD_DELETED">Load Deleted</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-2xs"
          >
            Filter Logs
          </button>

          {(filters.search || filters.entity_type !== "ALL" || filters.action !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setFilters({ search: "", entity_type: "ALL", action: "ALL", username: "ALL" });
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Master Audit Log Stream Table */}
      <div className="bg-base-100 border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-base-200 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-extrabold text-base-content uppercase tracking-wider">
              Chronological Modification Records
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-base-content">
            Showing {auditLogs.length} of {pagination.total} entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-base-200 text-slate-600 font-sans font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">Timestamp (Local)</th>
                <th className="py-3.5 px-4">Actor / User</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Description of Modification</th>
                <th className="py-3.5 px-4 text-center">Diff / Snapshot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mx-auto mb-2" />
                    <span className="text-xs font-semibold">Loading audit trail records...</span>
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm font-bold text-slate-700">No matching audit records found</div>
                    <div className="text-xs text-base-content mt-1">Try clearing filters or performing actions in the dashboard</div>
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => {
                  const dateObj = new Date(log.created_at);
                  const formattedDate = dateObj.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const formattedTime = dateObj.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  });

                  const details = typeof log.details === "object" ? log.details : {};
                  const hasDetails = details && Object.keys(details).length > 0;

                  return (
                    <tr key={log.id} className="hover:bg-base-200/80 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-base-content text-xs">
                          {formattedTime}
                        </div>
                        <div className="text-[10px] text-base-content font-medium">
                          {formattedDate}
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                            {log.username?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <div className="font-extrabold text-base-content text-xs">
                              {log.username || "System Automation"}
                            </div>
                            <span className="text-[10px] text-base-content uppercase font-semibold">
                              {log.user_role || "DISPATCHER"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase border font-mono ${getActionBadge(log.action)}`}>
                          {log.action?.replace("_", " ")}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getEntityIcon(log.entity_type)}
                          <span className="font-mono font-bold text-base-content">
                            {log.entity_identifier || log.entity_id || log.entity_type}
                          </span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 max-w-md">
                        <p className="font-medium text-slate-800 leading-snug line-clamp-2">
                          {log.change_summary}
                        </p>
                      </td>

                      {/* Diff Modal Trigger */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {hasDetails ? (
                          <button
                            type="button"
                            onClick={() => setSelectedLogForDiff(log)}
                            className="px-2.5 py-1 bg-base-100 hover:bg-base-200 text-sky-700 border border-slate-200 rounded-lg text-[11px] font-bold cursor-pointer transition shadow-2xs"
                          >
                            Inspect Diff
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-base-200 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-base-content font-medium">
              Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total records)
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPage(pagination.page - 1)}
                className="px-3 py-1.5 bg-base-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 cursor-pointer transition shadow-2xs flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage(pagination.page + 1)}
                className="px-3 py-1.5 bg-base-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 cursor-pointer transition shadow-2xs flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Field Diff Inspection Modal */}
      {selectedLogForDiff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-base-100 border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden text-base-content animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-base-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-base-content">
                    Field-Level Snapshot & Diff
                  </h3>
                  <p className="text-[10px] text-base-content font-mono">
                    {selectedLogForDiff.entity_identifier || selectedLogForDiff.entity_type} • Action: {selectedLogForDiff.action}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLogForDiff(null)}
                className="p-1.5 text-slate-400 hover:text-base-content rounded-lg hover:bg-slate-100 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto bg-base-200/50">
              <div className="bg-base-100 p-3.5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                <div className="text-xs font-bold text-slate-800">Change Summary:</div>
                <div className="text-xs text-slate-600 leading-relaxed font-medium">
                  {selectedLogForDiff.change_summary}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono text-[10px]">
                  Modified Attributes Snapshot
                </div>

                <div className="bg-base-100 rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                  {Object.entries(selectedLogForDiff.details || {}).map(([key, val]) => (
                    <div key={key} className="p-3 flex items-start justify-between gap-4 text-xs">
                      <span className="font-bold text-slate-600 uppercase font-mono text-[10px]">
                        {key.replace("_", " ")}
                      </span>
                      <span className="font-mono font-semibold text-base-content text-right truncate max-w-[240px]">
                        {typeof val === "object" ? JSON.stringify(val) : String(val ?? "null")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-base-100 flex justify-end">
              <button
                onClick={() => setSelectedLogForDiff(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { useSafetyStore } from "../stores/useSafetyStore";
import { useHOSStore } from "../stores/useHOSStore";
import { ShieldCheck, AlertTriangle, Clock, Search, MapPin } from "lucide-react";

const SEVERITY_STYLES = {
  high: { badge: "bg-red-100 text-red-700", icon: "bg-red-100 text-red-600" },
  medium: { badge: "bg-amber-100 text-amber-700", icon: "bg-amber-100 text-amber-600" },
  low: { badge: "bg-blue-100 text-blue-700", icon: "bg-blue-100 text-blue-600" },
};

const STATUS_STYLES = {
  pending_review: "bg-red-100 text-red-700",
  under_investigation: "bg-amber-100 text-amber-700",
  resolved: "bg-green-100 text-green-700",
};

export default function SafetyPage() {
  const safetyIncidents = useSafetyStore((state) => state.safetyIncidents);
  const safetyScores = useSafetyStore((state) => state.safetyScores);
  const fetchSafetyIncidents = useSafetyStore((state) => state.fetchSafetyIncidents);
  const fetchSafetyScores = useSafetyStore((state) => state.fetchSafetyScores);
  const updateSafetyIncident = useSafetyStore((state) => state.updateSafetyIncident);
  const updateSafetyScore = useSafetyStore((state) => state.updateSafetyScore);
  const hosLogs = useHOSStore((state) => state.hosLogs);
  // Store action was renamed fetchHOSLogs → fetchAllHOSLogs; the old name no
  // longer exists on the store and calling it crashed this page on mount.
  const fetchAllHOSLogs = useHOSStore((state) => state.fetchAllHOSLogs);

  const [filterSeverity, setFilterSeverity] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSafetyIncidents();
    fetchSafetyScores();
    fetchAllHOSLogs();
  }, [fetchSafetyIncidents, fetchSafetyScores, fetchAllHOSLogs]);

  const handleResolveIncident = async (incidentId) => {
    const inc = safetyIncidents.find((i) => i.id === incidentId);
    if (!inc) return;
    await updateSafetyIncident({ ...inc, status: "resolved" });
    const incDriverId = inc.driver_id || inc.driverId;
    const score = safetyScores.find(
      (s) => (s.driver_id || s.driverId) === incDriverId
    );
    if (score) {
      await updateSafetyScore(incDriverId, {
        ...score,
        score: Math.min(100, score.score + 5),
        totalViolations: Math.max(0, score.totalViolations - 1),
      });
    }
  };

  // Backend rows are snake_case (driver_name, truck_number, created_at) —
  // tolerate both shapes and never call .toLowerCase() on undefined.
  const filteredIncidents = safetyIncidents.filter((inc) => {
    const matchesSeverity = filterSeverity === "all" || inc.severity === filterSeverity;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (inc.driver_name || inc.driverName || "").toLowerCase().includes(q) ||
      (inc.description || "").toLowerCase().includes(q) ||
      (inc.location || "").toLowerCase().includes(q);
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Incidents + HOS */}
        <div className="lg:col-span-2 space-y-6">

          {/* Incidents Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h2 className="text-base font-semibold text-slate-900">Safety Incidents</h2>
                <span className="text-xs text-slate-400">({filteredIncidents.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search incidents..."
                    className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-44"
                  />
                </div>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-2.5 py-2 focus:outline-none cursor-pointer"
                >
                  <option value="all">All</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredIncidents.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No incidents match your filters.
                </div>
              ) : (
                filteredIncidents.map((inc) => {
                  const styles = SEVERITY_STYLES[inc.severity] || SEVERITY_STYLES.low;
                  return (
                    <div key={inc.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg mt-0.5 ${styles.icon}`}>
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-slate-900">{inc.driver_name || inc.driverName || "Unknown Driver"}</span>
                            <span className="text-slate-400 text-xs">·</span>
                            <span className="text-xs text-slate-500">Truck {inc.truck_number || inc.truckNumber || "—"}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles.badge}`}>
                              {inc.severity}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">{inc.description}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-400 pt-0.5">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{inc.location || "Unknown location"}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{(inc.created_at || inc.timestamp) ? new Date(inc.created_at || inc.timestamp).toLocaleString() : "—"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 self-start">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[inc.status] || "bg-slate-100 text-slate-600"}`}>
                          {(inc.status || "pending_review").replace(/_/g, " ")}
                        </span>
                        {inc.status !== "resolved" && (
                          <button
                            onClick={() => handleResolveIncident(inc.id)}
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-700 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* HOS Audit Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-500" />
              <h2 className="text-base font-semibold text-slate-900">Hours of Service (ELD Audit)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <th className="px-5 py-3">Driver</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Drive Left</th>
                    <th className="px-5 py-3">Duty Left</th>
                    <th className="px-5 py-3">Cycle Left</th>
                    <th className="px-5 py-3 text-right">Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hosLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">
                        No HOS logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    hosLogs.map((log) => {
                      // Real backend columns (hos_logs joined with drivers/users):
                      // current_status ('D'|'ON'|'SB'|'OFF'), driving_seconds_remaining,
                      // duty_seconds_remaining, cycle_seconds_remaining, username,
                      // driver_code, assigned_truck_number, updated_at.
                      const secToHours = (sec) =>
                        Number(((Number(sec) || 0) / 3600).toFixed(1));
                      const driveLeft = secToHours(log.driving_seconds_remaining);
                      const dutyLeft = secToHours(log.duty_seconds_remaining);
                      const cycleLeft = secToHours(log.cycle_seconds_remaining);
                      const isViolated = driveLeft <= 0 || dutyLeft <= 0 || cycleLeft <= 0;
                      const statusCode = log.current_status || "OFF";
                      const statusLabel =
                        statusCode === "D" ? "Driving" :
                        statusCode === "ON" ? "On Duty" :
                        statusCode === "SB" ? "Sleeper" :
                        "Off Duty";
                      const statusColor =
                        statusCode === "D" ? "bg-indigo-100 text-indigo-700" :
                        statusCode === "ON" ? "bg-green-100 text-green-700" :
                        statusCode === "SB" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-600";
                      return (
                        <tr key={log.id || log.driver_id} className="hover:bg-slate-50">
                          <td className="px-5 py-3.5">
                            <div className="font-medium text-slate-900">{log.username || log.driver_name || "N/A"}</div>
                            <div className="text-xs text-slate-400">
                              {log.driver_code || "—"}
                              {log.assigned_truck_number ? ` · TRK ${log.assigned_truck_number}` : ""}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-700 font-mono text-xs">
                            {driveLeft}h
                          </td>
                          <td className="px-5 py-3.5 text-slate-700 font-mono text-xs">
                            {dutyLeft}h
                          </td>
                          <td className="px-5 py-3.5 text-slate-700 font-mono text-xs">
                            {cycleLeft}h
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {isViolated ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">⚠ Alert</span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">✓ Compliant</span>
                            )}
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

        {/* Right: Safety Scoreboard */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-semibold text-slate-900">Driver Safety Scores</h2>
            </div>

            <div className="space-y-5">
              {safetyScores.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No driver safety score data available.
                </div>
              )}
              {safetyScores.map((score) => {
                const color = score.score >= 90 ? "bg-green-500" : score.score >= 80 ? "bg-blue-500" : "bg-red-500";
                const textColor = score.score >= 90 ? "text-green-600" : score.score >= 80 ? "text-blue-600" : "text-red-600";
                return (
                  <div key={score.driverId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-900">{score.driverName}</span>
                      <span className={`font-bold font-mono ${textColor}`}>{score.score} / 100</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score.score}%` }} />
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-xs text-slate-500">
                      <div>{score.totalMiles} mi</div>
                      <div className="text-center">{score.totalViolations} violations</div>
                      <div className="text-right">{score.hosCompliancePercent}% HOS</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
              Drivers below 80 points are automatically flagged for route review and safety coaching.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

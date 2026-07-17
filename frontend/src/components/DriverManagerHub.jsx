import { useState } from "react";
import WhatsAppChatHub from "./WhatsAppChatHub";
import {
  Headphones,
  Users,
  ClipboardList,
  Clock,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Search,
  MessageSquare,
} from "lucide-react";
import { useDriverStore } from "../store/useDriverstore";
export default function DriverManagerHub({
  shipments,
  messages,
  hosLogs,
  safetyScores,
  onSendMessage,
  onMarkMessagesAsRead,
  currentRole,
  currentUser,
}) {
  const drivers = useDriverStore((state) => state.drivers);
  const [activeTab, setActiveTab] = useState("manifests");
  const [searchQuery, setSearchQuery] = useState("");
  const driversStatusList = drivers.map((drv) => {
    const activeShipment = shipments.find(
      (s) => s.driverId === drv.id && s.status !== "delivered"
    );
    const rawHos = hosLogs.find((l) => l.driverId === drv.id);
    const mappedHos = rawHos
      ? {
          statusCode: rawHos.currentStatus,
          statusLabel:
            rawHos.currentStatus === "D"
              ? "Driving"
              : rawHos.currentStatus === "ON"
              ? "On Duty"
              : rawHos.currentStatus === "SB"
              ? "Sleeper Berth"
              : "Off Duty",
          hoursRemainingToday: parseFloat(
            (rawHos.drivingSecondsRemaining / 3600).toFixed(1)
          ),
          cycleHoursRemaining: parseFloat(
            (rawHos.cycleSecondsRemaining / 3600).toFixed(1)
          ),
          violations:
            rawHos.drivingSecondsRemaining <= 0
              ? ["Drive Limit Violation"]
              : [],
        }
      : {
          statusCode: "OFF",
          statusLabel: "Off Duty",
          hoursRemainingToday: 11,
          cycleHoursRemaining: 70,
          violations: [],
        };
    const rawSafety = safetyScores.find((s) => s.driverId === drv.id);
    const mappedSafety = rawSafety
      ? {
          score: rawSafety.score,
          totalMiles: rawSafety.totalMiles,
          totalViolations: rawSafety.totalViolations,
          hosCompliancePercent: rawSafety.hosCompliancePercent,
        }
      : {
          score: 95,
          totalMiles: 4500,
          totalViolations: 0,
          hosCompliancePercent: 100,
        };
    return {
      ...drv,
      activeShipment,
      hosLog: mappedHos,
      safetyScore: mappedSafety,
    };
  });
  const filteredDrivers = driversStatusList.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.activeShipment?.trackingNumber || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );
  return (
    <div
      id="driver-manager-console"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
    >
      {/* Upper Header and Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-cyan-600 text-white rounded-xl shadow-md shadow-cyan-600/10">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-sans">
                Driver Support & Manifesting Control
              </h2>
              <p className="text-xs text-slate-500">
                Corporate terminal for driver logistics, communication, and HOS
                compliance.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200">
          <button
            onClick={() => setActiveTab("manifests")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wide transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === "manifests"
                ? "bg-white text-cyan-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Active Manifests</span>
          </button>

          <button
            onClick={() => setActiveTab("whatsapp")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wide transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === "whatsapp"
                ? "bg-white text-cyan-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>WhatsApp Chat</span>
          </button>

          <button
            onClick={() => setActiveTab("hos")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wide transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === "hos"
                ? "bg-white text-cyan-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>HOS & ELD Logs</span>
          </button>

          <button
            onClick={() => setActiveTab("safety")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wide transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === "safety"
                ? "bg-white text-cyan-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Driver Safety</span>
          </button>
        </div>
      </div>

      {/* Main Tab Renderings */}
      {activeTab === "manifests" && (
        <div className="space-y-4">
          {/* Filters & Summary */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-cyan-600" />
              <span className="text-sm font-semibold text-slate-800">
                Monitoring {filteredDrivers.length} Active Fleet Drivers
              </span>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search drivers or loads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Drivers Manifest Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrivers.map((drv) => (
              <div
                key={drv.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4 hover:border-cyan-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        {drv.name}
                      </h3>
                      <span className="text-3xs font-mono font-bold text-slate-400 uppercase tracking-tight">
                        Driver ID: {drv.id}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-3xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 block uppercase tracking-wide">
                        TRK: {drv.truck}
                      </span>
                      <span className="text-[9px] text-slate-400 mt-0.5 block">
                        TRL: {drv.trailer}
                      </span>
                    </div>
                  </div>

                  {/* Active Manifest / Load info */}
                  <div className="pt-3 space-y-3">
                    <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wide block">
                      Active Load Manifest
                    </span>
                    {drv.activeShipment ? (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-3xs font-mono">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded">
                              {drv.activeShipment.trackingNumber}
                            </span>
                            {drv.activeShipment.priority && (
                              <span
                                className={`px-1 py-0.5 rounded text-[9px] font-bold uppercase border ${
                                  drv.activeShipment.priority === "urgent"
                                    ? "bg-rose-100 text-rose-800 border-rose-200 animate-pulse"
                                    : drv.activeShipment.priority === "high"
                                    ? "bg-amber-100 text-amber-800 border-amber-200"
                                    : "bg-slate-100 text-slate-600 border-slate-200"
                                }`}
                              >
                                {drv.activeShipment.priority}
                              </span>
                            )}
                          </div>
                          <span className="capitalize font-bold text-indigo-600">
                            {drv.activeShipment.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                          {drv.activeShipment.cargoDescription}
                        </p>
                        <div className="flex justify-between items-center text-3xs text-slate-500 font-mono">
                          <span>
                            Route: {drv.activeShipment.originCity} →{" "}
                            {drv.activeShipment.destinationCity}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">
                        No active load assigned. Status: Available for Dispatch.
                      </p>
                    )}
                  </div>
                </div>

                {/* HOS Quick Badge & Contact */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-cyan-600" />
                    <span className="text-3xs font-mono font-bold text-slate-600 uppercase">
                      HOS: {drv.hosLog.statusLabel} (
                      {drv.hosLog.hoursRemainingToday}h left)
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab("whatsapp");
                    }}
                    className="p-1 text-cyan-600 hover:text-white hover:bg-cyan-600 border border-cyan-200 hover:border-cyan-600 rounded-lg transition-colors cursor-pointer"
                    title="Start WhatsApp Support Chat"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "whatsapp" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-1">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-150 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <h3 className="text-xs font-bold font-mono text-slate-800 uppercase">
                Driver Support WhatsApp Hub
              </h3>
            </div>
            <span className="text-3xs text-slate-400 font-mono">
              Real-time driver group messaging center active
            </span>
          </div>
          <div className="h-[600px]">
            <WhatsAppChatHub
              messages={messages}
              onSendMessage={onSendMessage}
              onMarkMessagesAsRead={onMarkMessagesAsRead}
              currentRole={currentRole}
              currentUser={currentUser}
              shipments={shipments}
            />
          </div>
        </div>
      )}

      {activeTab === "hos" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 font-sans">
              Samsara ELD Hours of Service Audit
            </h3>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 font-mono text-3xs font-bold rounded uppercase">
              Fleet Synced
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-2xs font-bold uppercase tracking-wider">
                  <th className="px-5 py-3">Driver Name</th>
                  <th className="px-5 py-3">Duty Status</th>
                  <th className="px-5 py-3">Drive Time Left (Today)</th>
                  <th className="px-5 py-3">Cycle Remaining (70h/8d)</th>
                  <th className="px-5 py-3">Active Violations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {driversStatusList.map((d) => {
                  const statusColors = {
                    D: "bg-emerald-100 text-emerald-800 border-emerald-200",
                    ON: "bg-blue-100 text-blue-800 border-blue-200",
                    SB: "bg-indigo-100 text-indigo-800 border-indigo-200",
                    OFF: "bg-slate-100 text-slate-500 border-slate-200",
                  };
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {d.name}
                        </div>
                        <div className="text-3xs text-slate-400">
                          ID: {d.id}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 border text-3xs font-bold uppercase rounded ${
                            statusColors[d.hosLog.statusCode] ||
                            "bg-slate-50 text-slate-500"
                          }`}
                        >
                          {d.hosLog.statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-800">
                        {d.hosLog.hoursRemainingToday} Hours
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        {d.hosLog.cycleHoursRemaining} Hours
                      </td>
                      <td className="px-5 py-3.5">
                        {d.hosLog.violations &&
                        d.hosLog.violations.length > 0 ? (
                          <span className="flex items-center space-x-1 text-rose-600 font-bold">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span className="text-[10px]">
                              {d.hosLog.violations.join(", ")}
                            </span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 text-emerald-600 font-bold">
                            <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                            <span className="text-[10px]">Compliant</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "safety" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 font-sans">
              Driver Safety Scorecards (Samsara Telemetry)
            </h3>
            <span className="text-3xs text-slate-400 font-mono">
              Based on last 30 days active metrics
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-2xs font-bold uppercase tracking-wider">
                  <th className="px-5 py-3">Driver Name</th>
                  <th className="px-5 py-3">Safety Score</th>
                  <th className="px-5 py-3">Total Miles (30d)</th>
                  <th className="px-5 py-3">Total Violations</th>
                  <th className="px-5 py-3">HOS Compliance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {driversStatusList.map((d) => {
                  const score = d.safetyScore.score;
                  const scoreColor =
                    score >= 90
                      ? "text-emerald-600"
                      : score >= 80
                      ? "text-amber-600"
                      : "text-rose-600";
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {d.name}
                        </div>
                        <div className="text-3xs text-slate-400">
                          Driver ID: {d.id}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-lg">
                        <span className={scoreColor}>{score} / 100</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-bold">
                        {d.safetyScore.totalMiles.toLocaleString()} mi
                      </td>
                      <td className="px-5 py-3.5">
                        {d.safetyScore.totalViolations > 0 ? (
                          <span className="text-rose-600 font-bold">
                            {d.safetyScore.totalViolations} Alerts
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-bold">0</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-emerald-600 font-bold">
                          {d.safetyScore.hosCompliancePercent}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

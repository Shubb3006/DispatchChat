import { useState, useEffect } from "react";
import { useShipmentStore } from "../stores/useShipmentStore";
import { useMessageStore } from "../stores/useMessageStore";
import { useHOSStore } from "../stores/useHOSStore";
import { useSafetyStore } from "../stores/useSafetyStore";
import { useAuthStore } from "../stores/useAuthStore";
import { useDriverStore } from "../stores/useDriverstore";
import {
  Users, ClipboardList, Clock, ShieldAlert, CheckCircle,
  AlertTriangle, Search, MessageSquare, Truck,
} from "lucide-react";

const TABS = [
  { id: "manifests", label: "Active Manifests", icon: ClipboardList },
  { id: "hos", label: "HOS & ELD", icon: Clock },
  { id: "safety", label: "Safety Scores", icon: ShieldAlert },
];

export default function DriverManagerPage() {
  const shipments = useShipmentStore((state) => state.shipments);
  const fetchShipments = useShipmentStore((state) => state.fetchShipments);
  const messages = useMessageStore((state) => state.messages);
  const fetchMessages = useMessageStore((state) => state.fetchMessages);
  const sendMessageStore = useMessageStore((state) => state.sendMessage);
  const markAsRead = useMessageStore((state) => state.markAsRead);
  const hosLogs = useHOSStore((state) => state.hosLogs);
  const fetchAllHOSLogs = useHOSStore((state) => state.fetchAllHOSLogs);
  const safetyScores = useSafetyStore((state) => state.safetyScores);
  const fetchSafetyScores = useSafetyStore((state) => state.fetchSafetyScores);
  const drivers = useDriverStore((state) => state.drivers);
  const fetchDrivers = useDriverStore((state) => state.fetchDrivers);
  const currentUser = useAuthStore((state) => state.currentUser);

  const [activeTab, setActiveTab] = useState("manifests");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchShipments();
    fetchAllHOSLogs();
    fetchSafetyScores();
    fetchDrivers();
  }, [fetchShipments, fetchAllHOSLogs, fetchSafetyScores, fetchDrivers]);

  useEffect(() => {
    if (activeTab === "whatsapp") fetchMessages();
  }, [activeTab]);

  const handleSendMessage = async (content, recipientId, shipmentId, attachment) => {
    await sendMessageStore({
      id: "MSG" + (messages.length + 101),
      senderRole: "driver_manager",
      senderName: currentUser?.name || "Driver Manager",
      recipientId: recipientId || "DRV001",
      content,
      timestamp: new Date().toISOString(),
      read: false,
      shipmentId,
      attachment,
    });
  };

  const handleMarkMessagesAsRead = async (shipmentId, role) => {
    await markAsRead(shipmentId, role);
  };

  const driversStatusList = drivers.map((drv) => {
    const activeShipment = shipments.find((s) => s.driver_id === drv.id && s.status !== "completed");
    const rawHos = hosLogs.find((l) => l.driver_id === drv.id);
    const hosLog = rawHos ? {
      statusCode: rawHos.current_status,
      statusLabel: rawHos.current_status === "D" ? "Driving" : rawHos.current_status === "ON" ? "On Duty" : rawHos.current_status === "SB" ? "Sleeper" : "Off Duty",
      hoursRemainingToday: Number((rawHos.driving_seconds_remaining / 3600).toFixed(1)),
      cycleHoursRemaining: Number((rawHos.cycle_seconds_remaining / 3600).toFixed(1)),
      violations: rawHos.driving_seconds_remaining <= 0 ? ["Drive Limit Exceeded"] : [],
    } : { statusCode: "OFF", statusLabel: "Off Duty", hoursRemainingToday: 11, cycleHoursRemaining: 70, violations: [] };

    const rawSafety = safetyScores.find((s) => s.driver_id === drv.id);
    const safetyScore = rawSafety || { score: 95, totalMiles: 4500, totalViolations: 0, hosCompliancePercent: 100 };

    return { ...drv, activeShipment, hosLog, safetyScore };
  });

  const filteredDrivers = driversStatusList.filter((d) =>
    d.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.driver_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.activeShipment?.load_number || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hosStatusColors = {
    D: "bg-green-100 text-green-700",
    ON: "bg-blue-100 text-blue-700",
    SB: "bg-amber-100 text-amber-700",
    OFF: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 w-fit shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                isActive ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Manifests Tab */}
      {activeTab === "manifests" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-400" />
              <span className="font-medium text-slate-700">{filteredDrivers.length} drivers</span>
            </div>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search drivers or loads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrivers.map((drv) => (
              <div key={drv.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow space-y-3">
                {/* Driver Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${drv.activeShipment ? "bg-green-500" : "bg-slate-300"}`} />
                      <span className="font-semibold text-slate-900 text-sm">{drv.username}</span>
                    </div>
                    <span className="text-xs text-slate-400 mt-0.5 block">{drv.driver_code}</span>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <div className="font-medium">TRK: {drv.assigned_truck_number || "—"}</div>
                    <div className="text-slate-400">TRL: {drv.assigned_trailer_number || "—"}</div>
                  </div>
                </div>

                {/* Active Load */}
                {drv.activeShipment ? (
                  <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg">{drv.activeShipment.load_number}</span>
                      <span className="font-medium text-slate-600 capitalize">{drv.activeShipment.status?.replace(/_/g, " ")}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium truncate">{drv.activeShipment.cargoDescription}</p>
                    <p className="text-xs text-slate-400 truncate">{drv.activeShipment.customer_billing_address} → {drv.activeShipment.destination}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No active load assigned</p>
                )}

                {/* HOS */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                    <span>{drv.hosLog.statusLabel} · {drv.hosLog.hoursRemainingToday}h left</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HOS Tab */}
      {activeTab === "hos" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">ELD Hours of Service Audit</h2>
            <span className="text-xs text-slate-400">70-hour / 8-day cycle</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-3">Driver</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Drive Left</th>
                  <th className="px-5 py-3">Cycle Left</th>
                  <th className="px-5 py-3">Violations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {driversStatusList.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-900">{d.username}</div>
                      <div className="text-xs text-slate-400">{d.driver_code}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${hosStatusColors[d.hosLog.statusCode] || "bg-slate-100 text-slate-600"}`}>
                        {d.hosLog.statusLabel}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-700 text-sm">{d.hosLog.hoursRemainingToday}h</td>
                    <td className="px-5 py-3.5 font-mono text-slate-700 text-sm">{d.hosLog.cycleHoursRemaining}h</td>
                    <td className="px-5 py-3.5">
                      {d.hosLog.violations?.length > 0 ? (
                        <span className="flex items-center gap-1.5 text-red-600 text-xs font-medium">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {d.hosLog.violations[0]}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Compliant
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Safety Tab */}
      {activeTab === "safety" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Driver Safety Scorecards</h2>
            <p className="text-xs text-slate-400 mt-0.5">Based on last 30 days of Samsara telemetry</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-3">Driver</th>
                  <th className="px-5 py-3">Safety Score</th>
                  <th className="px-5 py-3">Miles (30d)</th>
                  <th className="px-5 py-3">Violations</th>
                  <th className="px-5 py-3">HOS Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {driversStatusList.map((d) => {
                  const sc = d.safetyScore.score;
                  const color = sc >= 90 ? "text-green-600" : sc >= 80 ? "text-amber-600" : "text-red-600";
                  return (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-900">{d.name || d.username}</div>
                        <div className="text-xs text-slate-400">{d.driver_code}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`font-bold text-lg font-mono ${color}`}>{sc}</span>
                        <span className="text-slate-400 text-sm"> / 100</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 font-mono">{d.safetyScore.totalMiles?.toLocaleString()} mi</td>
                      <td className="px-5 py-3.5">
                        {d.safetyScore.totalViolations > 0 ? (
                          <span className="text-red-600 font-semibold">{d.safetyScore.totalViolations}</span>
                        ) : (
                          <span className="text-green-600 font-semibold">0</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-green-600 font-semibold">{d.safetyScore.hosCompliancePercent}%</td>
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

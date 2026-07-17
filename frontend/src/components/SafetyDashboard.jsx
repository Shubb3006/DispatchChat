import { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  Search,
  MapPin
} from "lucide-react";
export default function SafetyDashboard({ incidents, scores, hosLogs, onResolveIncident }) {
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const filteredIncidents = incidents.filter((inc) => {
    const matchesSeverity = filterSeverity === "all" || inc.severity === filterSeverity;
    const matchesSearch = inc.driverName.toLowerCase().includes(searchQuery.toLowerCase()) || inc.description.toLowerCase().includes(searchQuery.toLowerCase()) || inc.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });
  return <div id="safety-compliance" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {
    /* Upper overview and scores cards */
  }
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {
    /* Left Side: Compliance scoreboard & Samsara alert board */
  }
        <div className="lg:col-span-8 space-y-6">
          
          {
    /* Incidents Board */
  }
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-150 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="text-rose-600 h-5 w-5" />
                <h3 className="text-base font-semibold text-slate-900">Samsara Critical Safety Alerts & Incidents</h3>
              </div>
              
              {
    /* Filters */
  }
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="h-3 w-3 absolute left-2.5 top-2 text-slate-400" />
                  <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Search incidents..."
    className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
  />
                </div>
                <select
    value={filterSeverity}
    onChange={(e) => setFilterSeverity(e.target.value)}
    className="bg-white border border-slate-200 rounded-lg text-xs px-2 py-1 focus:outline-none"
  >
                  <option value="all">All Severity</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredIncidents.length === 0 ? <div className="text-center text-slate-400 py-12 text-xs">
                  No active safety alerts triggered. Fleet is driving within compliance guidelines.
                </div> : filteredIncidents.map((inc) => <div key={inc.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start space-x-3.5">
                      <div className={`p-2 rounded-lg mt-0.5 ${inc.severity === "high" ? "bg-rose-100 text-rose-700" : inc.severity === "medium" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                        <AlertTriangle className="h-5 w-5 animate-pulse" />
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-xs">{inc.driverName}</span>
                          <span className="text-slate-400 font-mono text-2xs">•</span>
                          <span className="text-slate-500 font-mono text-2xs">Truck {inc.truckNumber}</span>
                          <span className={`px-2 py-0.5 rounded text-3xs font-mono font-bold uppercase tracking-wider ${inc.severity === "high" ? "bg-rose-100 text-rose-800" : inc.severity === "medium" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
                            {inc.severity} Priority
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-sans">{inc.description}</p>
                        
                        <div className="flex items-center space-x-4 text-3xs font-mono text-slate-500 pt-1">
                          <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> {inc.location}</span>
                          <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {new Date(inc.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-start">
                      <span className={`px-2.5 py-1 rounded text-2xs font-mono uppercase font-bold ${inc.status === "pending_review" ? "bg-rose-100 text-rose-800" : inc.status === "under_investigation" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                        {inc.status.replace("_", " ")}
                      </span>
                      {inc.status !== "resolved" && <button
    onClick={() => onResolveIncident(inc.id)}
    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-2xs font-semibold cursor-pointer transition-colors"
  >
                          Resolve Alert
                        </button>}
                    </div>
                  </div>)}
            </div>
          </div>

          {
    /* HOS Compliance log audit panel */
  }
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Samsara Real-time ELD Duty Audit</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-2xs font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Driver Name</th>
                    <th className="px-4 py-3">Active Status</th>
                    <th className="px-4 py-3">Drive remaining</th>
                    <th className="px-4 py-3">Duty Remaining</th>
                    <th className="px-4 py-3">Cycle Remaining</th>
                    <th className="px-4 py-3 text-right">Violation status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hosLogs.map((log) => {
    const isViolated = log.drivingSecondsRemaining <= 0 || log.dutySecondsRemaining <= 0;
    return <tr key={log.driverId} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900">{log.driverName}</div>
                          <div className="text-slate-400 text-3xs font-mono">{log.driverId}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold font-mono ${log.currentStatus === "D" ? "bg-indigo-100 text-indigo-800" : log.currentStatus === "ON" ? "bg-emerald-100 text-emerald-800" : log.currentStatus === "SB" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-800"}`}>
                            {log.currentStatus === "D" ? "Driving" : log.currentStatus === "ON" ? "On Duty" : log.currentStatus === "SB" ? "Sleeper" : "Off Duty"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono">
                          {Math.floor(log.drivingSecondsRemaining / 3600)}h {Math.floor(log.drivingSecondsRemaining % 3600 / 60)}m
                        </td>
                        <td className="px-4 py-3.5 font-mono">
                          {Math.floor(log.dutySecondsRemaining / 3600)}h {Math.floor(log.dutySecondsRemaining % 3600 / 60)}m
                        </td>
                        <td className="px-4 py-3.5 font-mono">
                          {Math.floor(log.cycleSecondsRemaining / 3600)}h
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {isViolated ? <span className="inline-flex items-center px-2 py-0.5 bg-rose-100 text-rose-800 text-3xs font-bold font-mono uppercase rounded">
                              Violation Active
                            </span> : <span className="inline-flex items-center text-emerald-600 text-3xs font-bold font-mono">
                              Compliant
                            </span>}
                        </td>
                      </tr>;
  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {
    /* Right Side: Driver Safety Scoreboard */
  }
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wide">Driver Safety Scoreboard</h3>
            </div>

            <div className="space-y-4">
              {scores.map((score) => {
    const isExcellent = score.score >= 90;
    const isGood = score.score >= 80 && score.score < 90;
    return <div key={score.driverId} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900">{score.driverName}</span>
                      <span className={`font-mono font-bold ${isExcellent ? "text-emerald-600" : isGood ? "text-indigo-600" : "text-rose-600"}`}>
                        {score.score} pts
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
      className={`h-full ${isExcellent ? "bg-emerald-500" : isGood ? "bg-indigo-500" : "bg-rose-500"}`}
      style={{ width: `${score.score}%` }}
    />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-3xs font-mono text-slate-500 pt-1 border-b border-slate-50 pb-2">
                      <div>Miles: <span className="text-slate-800 font-bold">{score.totalMiles}</span></div>
                      <div>Violations: <span className={`${score.totalViolations > 2 ? "text-rose-600" : "text-slate-800"} font-bold`}>{score.totalViolations}</span></div>
                      <div>HOS Code: <span className="text-slate-800 font-bold">{score.hosCompliancePercent}%</span></div>
                    </div>
                  </div>;
  })}
            </div>

            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-slate-600 text-3xs leading-relaxed">
              <span className="font-bold text-indigo-950 block mb-1 font-mono uppercase">Safety Policy Guidelines</span>
              All safety alerts trigger real-time notification warnings to driver ELD screens. Drivers holding safety scores below 80 are automatically prioritized for dispatcher route reviews and safety coaching.
            </div>
          </div>
        </div>

      </div>
    </div>;
}

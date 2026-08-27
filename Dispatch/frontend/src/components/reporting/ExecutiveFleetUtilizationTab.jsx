import React, { useMemo } from "react";
import {
  Truck,
  Activity,
  Gauge,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  ShieldCheck,
  TrendingUp,
  Percent,
  Layers,
  ArrowUpRight,
} from "lucide-react";

export default function ExecutiveFleetUtilizationTab({
  currency = "USD",
  currencyRate = 1.36,
}) {
  const fmtCurrency = (amount) => {
    const val = currency === "CAD" ? amount * currencyRate : amount;
    return `$${Math.round(val).toLocaleString()} ${currency}`;
  };

  // Fleet Utilization Metrics
  const fleetData = useMemo(() => ({
    totalTractors: 427,
    activeDispatched: 388,
    stagedCrossdock: 24,
    maintenanceDowntime: 15,
    utilizationRate: "90.9%",
    totalDrivers: 512,
    activeDrivers: 462,
    loadedMilesPct: "89.4%",
    deadheadMilesPct: "10.6%",
    totalMilesMonth: 384500,
    deadheadCostWaste: 384500 * 0.106 * 2.48, // miles * deadhead % * CPM
    avgDwellHours: "1h 18m",
    dwellSavings: 18400,
  }), []);

  // Top Driver Productivity Leaderboard
  const drivers = useMemo(() => [
    {
      id: "D1",
      name: "Rajbir Singh",
      tractor: "TRK-213",
      trailer: "53ft Reefer",
      dispatchedMiles: 8420,
      revenueGenerated: 29890,
      safetyScore: "99.4/100",
      onTimePct: "100%",
      hosCompliance: "99.8%",
    },
    {
      id: "D2",
      name: "Ali Haithem",
      tractor: "TRK-212",
      trailer: "53ft Dry Van",
      dispatchedMiles: 7950,
      revenueGenerated: 27825,
      safetyScore: "98.8/100",
      onTimePct: "99.1%",
      hosCompliance: "100%",
    },
    {
      id: "D3",
      name: "Rashid Yasin",
      tractor: "TRK-220",
      trailer: "53ft Dry Van",
      dispatchedMiles: 7810,
      revenueGenerated: 26554,
      safetyScore: "97.9/100",
      onTimePct: "98.5%",
      hosCompliance: "99.2%",
    },
    {
      id: "D4",
      name: "Gurpreet Dhillon",
      tractor: "TRK-208",
      trailer: "53ft Reefer",
      dispatchedMiles: 7640,
      revenueGenerated: 26740,
      safetyScore: "99.1/100",
      onTimePct: "100%",
      hosCompliance: "100%",
    },
    {
      id: "D5",
      name: "Michael Chen",
      tractor: "TRK-198",
      trailer: "Flatbed / Conestoga",
      dispatchedMiles: 7420,
      revenueGenerated: 28196,
      safetyScore: "98.2/100",
      onTimePct: "99.4%",
      hosCompliance: "99.5%",
    },
  ], []);

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards for Fleet Operations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Utilization */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Active Fleet Utilization
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {fleetData.utilizationRate}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{fleetData.activeDispatched} / {fleetData.totalTractors} Power Units Active</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
            <Gauge className="w-6 h-6" />
          </div>
        </div>

        {/* Loaded vs Deadhead */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Loaded Mileage Ratio
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono">
              {fleetData.loadedMilesPct}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Deadhead rate reduced to {fleetData.deadheadMilesPct}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        {/* Average Dwell Time */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Avg. Terminal Dwell
            </div>
            <div className="text-2xl font-black text-indigo-700 font-mono">
              {fleetData.avgDwellHours}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold">
              -42% vs North American average
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Total Monthly Dispatched Miles */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Monthly Fleet Miles
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {fleetData.totalMilesMonth.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Samsara Telematics Verified
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Truck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Asset Allocation & Deadhead Reduction Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tractor Fleet Distribution Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Power Unit Allocation (427 Tractors)
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700">90.9% Active</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>In-Transit / Dispatched with Freight</span>
                <span className="font-bold text-slate-900">388 (90.9%)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-sky-600 rounded-full" style={{ width: "90.9%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Cross-Dock Terminals / Pre-Loaded Staged</span>
                <span className="font-bold text-slate-900">24 (5.6%)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "5.6%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Scheduled Preventative Maintenance</span>
                <span className="font-bold text-slate-900">15 (3.5%)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: "3.5%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Deadhead Optimization Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                AI Deadhead Slicer & Empty Mile Recovery
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700">
              +{fmtCurrency(32400)} Saved this Month
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="text-[10px] font-mono font-bold text-slate-500 uppercase">Loaded Revenue Miles</div>
              <div className="text-xl font-black text-slate-900 font-mono">343,743 mi</div>
              <div className="text-[10px] text-emerald-600 font-semibold">89.4% revenue generating</div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="text-[10px] font-mono font-bold text-slate-500 uppercase">Empty Deadhead Miles</div>
              <div className="text-xl font-black text-amber-700 font-mono">40,757 mi</div>
              <div className="text-[10px] text-slate-500">10.6% repositioning</div>
            </div>

            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
              <div className="text-[10px] font-mono font-bold text-emerald-800 uppercase">AI Re-load Match Rate</div>
              <div className="text-xl font-black text-emerald-700 font-mono">94.2%</div>
              <div className="text-[10px] text-emerald-700 font-semibold">Instant return backhauls</div>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Productivity & Safety Leaderboard */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-0">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Commercial Driver Performance & Revenue Leaderboard
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">512 Drivers Enrolled</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-sans font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Driver Name</th>
                <th className="py-3 px-4">Power Unit & Equipment</th>
                <th className="py-3 px-4">Dispatched Miles</th>
                <th className="py-3 px-4">Gross Revenue</th>
                <th className="py-3 px-4">Safety Score</th>
                <th className="py-3 px-4">HOS Compliance</th>
                <th className="py-3 px-4 text-right">On-Time %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {drivers.map((d, idx) => (
                <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                        {d.name[0]}
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900">{d.name}</div>
                        <span className="text-[10px] text-slate-400 font-mono">Rank #{idx + 1}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                    <div>{d.tractor}</div>
                    <div className="text-[10px] text-slate-400">{d.trailer}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {d.dispatchedMiles.toLocaleString()} mi
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                    {fmtCurrency(d.revenueGenerated)}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                      {d.safetyScore}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">{d.hosCompliance}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-700">{d.onTimePct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

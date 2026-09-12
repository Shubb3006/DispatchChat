import React, { useMemo } from "react";
import {
  ShieldCheck,
  Globe,
  FileSignature,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  DollarSign,
  TrendingUp,
  MapPin,
  ExternalLink,
} from "lucide-react";

export default function ExecutiveCustomsComplianceTab({
  currency = "USD",
  currencyRate = 1.36,
}) {
  const fmtCurrency = (amount) => {
    const val = currency === "CAD" ? amount * currencyRate : amount;
    return `$${Math.round(val).toLocaleString()} ${currency}`;
  };

  const borderPorts = useMemo(() => [
    {
      code: "3801",
      name: "Detroit Ambassador Bridge",
      corridor: "Detroit, MI / Windsor, ON",
      crossingsMonth: 184,
      avgWaitMins: 14,
      firstPassRate: "99.5%",
      fastLaneActive: true,
      congestionLevel: "Low",
    },
    {
      code: "3802",
      name: "Port Huron Blue Water Bridge",
      corridor: "Port Huron, MI / Point Edward, ON",
      crossingsMonth: 112,
      avgWaitMins: 18,
      firstPassRate: "99.1%",
      fastLaneActive: true,
      congestionLevel: "Nominal",
    },
    {
      code: "0901",
      name: "Buffalo Peace Bridge",
      corridor: "Buffalo, NY / Fort Erie, ON",
      crossingsMonth: 78,
      avgWaitMins: 22,
      firstPassRate: "98.7%",
      fastLaneActive: true,
      congestionLevel: "Moderate",
    },
    {
      code: "3004",
      name: "Blaine Pacific Highway",
      corridor: "Blaine, WA / Surrey, BC",
      crossingsMonth: 46,
      avgWaitMins: 16,
      firstPassRate: "100%",
      fastLaneActive: true,
      congestionLevel: "Low",
    },
  ], []);

  const brokers = useMemo(() => [
    {
      name: "Livingston International",
      filerCode: "LVN-9021",
      entries: 168,
      avgClearMins: 18,
      ediSuccess: "99.8%",
      contact: "crossborder@livingstonintl.com",
    },
    {
      name: "Willson International",
      filerCode: "WIL-4402",
      entries: 114,
      avgClearMins: 22,
      ediSuccess: "99.4%",
      contact: "edi@willsonintl.com",
    },
    {
      name: "Cole International",
      filerCode: "COL-3301",
      entries: 82,
      avgClearMins: 25,
      ediSuccess: "99.1%",
      contact: "crossborder@coleintl.com",
    },
    {
      name: "Buckland Customs",
      filerCode: "BCK-1029",
      entries: 56,
      avgClearMins: 20,
      ediSuccess: "99.5%",
      contact: "clearance@buckland.com",
    },
  ], []);

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards for Trade Compliance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* First-Pass Clearance Rate */}
        <div className="bg-base-100 border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-base-content">
              First-Pass Clearance Rate
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono">
              99.4%
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Zero CBP/CBSA border refusals</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Total Crossings */}
        <div className="bg-base-100 border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-base-content">
              Cross-Border Freight Volume
            </div>
            <div className="text-2xl font-black text-base-content font-mono">
              420 Loads
            </div>
            <div className="text-[11px] text-base-content font-medium">
              64% Inbound US • 36% Inbound CA
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
            <Globe className="w-6 h-6" />
          </div>
        </div>

        {/* Average Border Wait Time */}
        <div className="bg-base-100 border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-base-content">
              Avg. Bridge Crossing Wait
            </div>
            <div className="text-2xl font-black text-indigo-700 font-mono">
              16.2 Mins
            </div>
            <div className="text-[11px] text-indigo-600 font-semibold">
              FAST Lane & Pre-Arrival cleared
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* USMCA Duty Avoidance Savings */}
        <div className="bg-base-100 border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-base-content">
              USMCA Duty Savings
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono">
              {fmtCurrency(148200)}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold">
              0% Free Trade tariff applied
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Port of Entry Crossing Radar */}
      <div className="bg-base-100 border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-0">
        <div className="p-4 bg-base-200 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-extrabold text-base-content uppercase tracking-wider">
              US-Canada Port of Entry (POE) Performance & Wait Times
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-base-content">4 Active Major Corridors</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-base-200 text-slate-600 font-sans font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Port of Entry & Crossing</th>
                <th className="py-3 px-4">Monthly Loads</th>
                <th className="py-3 px-4">Avg. Border Wait</th>
                <th className="py-3 px-4">FAST Lane Status</th>
                <th className="py-3 px-4 text-right">EDI 1st Pass Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {borderPorts.map((p) => (
                <tr key={p.code} className="hover:bg-base-200/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-base-content">{p.name} ({p.code})</div>
                    <span className="text-[10px] text-base-content font-mono">{p.corridor}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-base-content">{p.crossingsMonth} Loads</td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className="font-bold text-sky-700">{p.avgWaitMins} mins</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">({p.congestionLevel})</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ FAST Enrolled
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">{p.firstPassRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customs Broker EDI Performance */}
      <div className="bg-base-100 border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-0">
        <div className="p-4 bg-base-200 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-extrabold text-base-content uppercase tracking-wider">
              Authorized Customs Broker Performance & Response SLA
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-base-content">4 Brokers Integrated</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-base-200 text-slate-600 font-sans font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Customs Broker</th>
                <th className="py-3 px-4">Filer Code</th>
                <th className="py-3 px-4">Entries Filed</th>
                <th className="py-3 px-4">Avg. Entry Turnaround</th>
                <th className="py-3 px-4 text-right">EDI Transmission SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {brokers.map((b) => (
                <tr key={b.filerCode} className="hover:bg-base-200/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-base-content">{b.name}</div>
                    <span className="text-[10px] text-slate-400 font-mono">{b.contact}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-sky-700">{b.filerCode}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{b.entries}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">{b.avgClearMins} mins</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">{b.ediSuccess}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

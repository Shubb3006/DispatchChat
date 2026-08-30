import React, { useState, useEffect, useMemo } from "react";
import { useShipmentStore } from "../stores/useShipmentStore";
import { useInvoiceStore } from "../stores/useInvoiceStore";
import { useAuthStore } from "../stores/useAuthStore";
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Truck,
  ShieldCheck,
  Clock,
  Sparkles,
  Download,
  Calendar,
  Layers,
  Printer,
  Globe,
  Radio,
  FileText,
  SlidersHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";

import ExecutivePnlTab from "../components/reporting/ExecutivePnlTab";
import ExecutiveFleetUtilizationTab from "../components/reporting/ExecutiveFleetUtilizationTab";
import ExecutiveCustomsComplianceTab from "../components/reporting/ExecutiveCustomsComplianceTab";
import ExecutiveArCashFlowTab from "../components/reporting/ExecutiveArCashFlowTab";
import ExecutiveAiForecastTab from "../components/reporting/ExecutiveAiForecastTab";

export default function ReportingPage() {
  const shipments = useShipmentStore((state) => state.shipments);
  const fetchShipments = useShipmentStore((state) => state.fetchShipments);
  const invoices = useInvoiceStore((state) => state.invoices);
  const fetchInvoices = useInvoiceStore((state) => state.fetchInvoices);
  const currentUser = useAuthStore((state) => state.currentUser);

  const [activeTab, setActiveTab] = useState("pnl");
  const [currency, setCurrency] = useState("USD"); // "USD" | "CAD"
  const [timeframe, setTimeframe] = useState("30d"); // "7d" | "30d" | "q3" | "ytd"

  useEffect(() => {
    fetchShipments();
    fetchInvoices();
  }, [fetchShipments, fetchInvoices]);

  const tabs = [
    { id: "pnl", label: "P&L Financials & Lane Yield", icon: DollarSign },
    { id: "fleet", label: "Fleet Utilization & Samsara Radar", icon: Truck },
    { id: "customs", label: "Cross-Border & Customs SLA", icon: ShieldCheck },
    { id: "ar", label: "A/R Aging & Cash Flow Engine", icon: Clock },
    { id: "forecast", label: "AI What-If & Yield Horizon", icon: Sparkles },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 print:p-0">
      {/* Executive Command Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-2xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Executive Financial & Fleet Intelligence
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-50 text-purple-800 border border-purple-200">
                  C-SUITE & CONTROLLER VIEW
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Real-time freight unit economics (RPM/CPM), 427-tractor Samsara telematics, cross-border compliance, and A/R aging ledger.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls: Currency, Timeframe & Print */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Currency Toggle */}
          <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-mono font-bold">
            <button
              onClick={() => setCurrency("USD")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                currency === "USD" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency("CAD")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                currency === "CAD" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              CAD ($)
            </button>
          </div>

          {/* Timeframe Selector */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days (Trailing)</option>
            <option value="q3">Q3 2026</option>
            <option value="ytd">Year to Date (YTD)</option>
          </select>

          {/* Print/Export Button */}
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Live System Integration Telemetry Bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-slate-600 font-semibold font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Samsara Telematics: <strong>427 Tractors Active</strong></span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>BorderConnect EDI: <strong>99.4% First-Pass</strong></span>
          </div>
          <div className="hidden md:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span>PostgreSQL Ledger: <strong>Synced</strong></span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-400 font-medium">
          Last Updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* 5-Tab Executive Navigation Toolbar */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto select-none no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "border-sky-600 text-sky-700 bg-sky-50/50 rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-sky-600" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === "pnl" && (
        <ExecutivePnlTab
          shipments={shipments}
          invoices={invoices}
          currency={currency}
          currencyRate={1.36}
          timeframe={timeframe}
        />
      )}

      {activeTab === "fleet" && (
        <ExecutiveFleetUtilizationTab
          currency={currency}
          currencyRate={1.36}
        />
      )}

      {activeTab === "customs" && (
        <ExecutiveCustomsComplianceTab
          currency={currency}
          currencyRate={1.36}
        />
      )}

      {activeTab === "ar" && (
        <ExecutiveArCashFlowTab
          shipments={shipments}
          invoices={invoices}
          currency={currency}
          currencyRate={1.36}
        />
      )}

      {activeTab === "forecast" && (
        <ExecutiveAiForecastTab
          currency={currency}
          currencyRate={1.36}
        />
      )}
    </div>
  );
}

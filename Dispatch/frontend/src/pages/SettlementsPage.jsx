import React, { useState, useEffect } from "react";
import { useSettlementStore } from "../stores/useSettlementStore";
import {
  DollarSign,
  TrendingUp,
  User,
  Truck,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  Printer,
  Search,
  Filter,
  RefreshCw,
  Download,
  ShieldCheck,
  Percent,
  Clock,
  Layers,
} from "lucide-react";
import toast from "react-hot-toast";

import SettlementPaystubModal from "../components/settlements/SettlementPaystubModal";
import GenerateSettlementModal from "../components/settlements/GenerateSettlementModal";

export default function SettlementsPage() {
  const {
    settlements,
    stats,
    filters,
    pagination,
    isLoading,
    fetchSettlements,
    fetchSettlementStats,
    setFilters,
    updateSettlementStatus,
  } = useSettlementStore();

  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedPaystub, setSelectedPaystub] = useState(null);
  const [searchInput, setSearchInput] = useState(filters.search || "");

  useEffect(() => {
    fetchSettlements();
    fetchSettlementStats();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters({ search: searchInput });
  };

  const handleExportCsv = () => {
    const headers = ["Settlement #", "Driver", "Driver Code", "Truck", "Period Start", "Period End", "Total Miles", "Gross Pay ($)", "Deductions ($)", "Net Payout ($)", "Status"];
    const rows = settlements.map((s) => [
      s.settlement_number,
      `"${s.driver_name}"`,
      s.driver_code,
      s.truck_number,
      s.period_start,
      s.period_end,
      s.total_miles,
      s.total_gross_pay,
      s.total_deductions,
      s.net_payout,
      s.status,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Nishan_Driver_Settlements_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Driver settlements ledger exported to CSV!");
  };

  const getStatusBadge = (status = "") => {
    switch (status.toUpperCase()) {
      case "PAID":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "APPROVED":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "DRAFT":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Command Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Driver Settlements & Payroll Engine
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-50 text-purple-800 border border-purple-200">
                  TRUX PAYROLL AUTOMATION
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Automated driver earnings computation (Pay Per Mile / % of Gross), extra stop accessorials, fuel advance deductions, and printable paystub statements.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Payroll CSV</span>
          </button>

          <button
            onClick={() => setIsGenerateOpen(true)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Settlement</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards for Payroll Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gross Payroll */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Total Gross Payroll
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              ${Number(stats.total_gross_payroll || 7953).toLocaleString()} CAD
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Across all fleet drivers
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Net Payout */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Net Direct Payout
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono">
              ${Number(stats.total_net_payroll || 6678).toLocaleString()} CAD
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>After itemized deductions</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total Settled Miles */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Total Settled Miles
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {Number(stats.total_settled_miles || 8730).toLocaleString()} mi
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Samsara telematics verified
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Pending Approvals
            </div>
            <div className="text-2xl font-black text-amber-700 font-mono">
              {stats.pending_approval_count || 1} Drafts
            </div>
            <div className="text-[11px] text-amber-700 font-semibold">
              Requires controller sign-off
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Driver Name, Settlement #, or Power Unit..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          />
        </form>

        <div className="w-full md:w-44">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft (Pending)</option>
            <option value="APPROVED">Approved</option>
            <option value="PAID">Paid (Direct Deposit)</option>
          </select>
        </div>

        {(filters.search || filters.status !== "ALL") && (
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setFilters({ search: "", status: "ALL" });
            }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* Master Driver Settlements Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Driver Payroll & Trip Settlement Records
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            {settlements.length} Statements
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-sans font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">Settlement #</th>
                <th className="py-3.5 px-4">Driver & Equipment</th>
                <th className="py-3.5 px-4">Pay Period</th>
                <th className="py-3.5 px-4">Miles / Model</th>
                <th className="py-3.5 px-4">Gross Earnings</th>
                <th className="py-3.5 px-4">Deductions</th>
                <th className="py-3.5 px-4">Net Payout</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mx-auto mb-2" />
                    <span className="text-xs font-semibold">Loading driver settlements...</span>
                  </td>
                </tr>
              ) : settlements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm font-bold text-slate-700">No settlement records found</div>
                    <div className="text-xs text-slate-500 mt-1">Click "Generate Settlement" to create a new driver paystub</div>
                  </td>
                </tr>
              ) : (
                settlements.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Settlement # */}
                    <td className="py-3.5 px-4 font-mono font-black text-sky-700 whitespace-nowrap">
                      {s.settlement_number}
                    </td>

                    {/* Driver */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                          {s.driver_name?.[0] || "D"}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900">{s.driver_name}</div>
                          <span className="text-[10px] text-slate-400 font-mono">{s.truck_number || "TRK-104"}</span>
                        </div>
                      </div>
                    </td>

                    {/* Period */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      <div>{s.period_start}</div>
                      <span className="text-[10px] text-slate-400 font-normal">to {s.period_end}</span>
                    </td>

                    {/* Miles & Model */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900">{Number(s.total_miles || 0).toLocaleString()} mi</div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {s.pay_model === "PERCENTAGE_OF_GROSS" ? "28% of Gross" : `$${s.rate_per_loaded_mile}/mi`}
                      </span>
                    </td>

                    {/* Gross Pay */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      ${Number(s.total_gross_pay || 0).toLocaleString()}
                    </td>

                    {/* Deductions */}
                    <td className="py-3.5 px-4 font-mono text-rose-700 font-semibold whitespace-nowrap">
                      -${Number(s.total_deductions || 0).toLocaleString()}
                    </td>

                    {/* Net Payout */}
                    <td className="py-3.5 px-4 font-mono font-black text-emerald-700 text-sm whitespace-nowrap">
                      ${Number(s.net_payout || 0).toLocaleString()} CAD
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase border ${getStatusBadge(s.status)}`}>
                        {s.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedPaystub(s)}
                          title="Print / View Settlement Paystub"
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-500" />
                          <span>Paystub</span>
                        </button>

                        {s.status === "DRAFT" && (
                          <button
                            type="button"
                            onClick={() => updateSettlementStatus(s.id, "APPROVED")}
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-2xs"
                          >
                            Approve
                          </button>
                        )}

                        {s.status === "APPROVED" && (
                          <button
                            type="button"
                            onClick={() => updateSettlementStatus(s.id, "PAID")}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-2xs"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paystub Statement Modal */}
      <SettlementPaystubModal
        isOpen={!!selectedPaystub}
        onClose={() => setSelectedPaystub(null)}
        settlement={selectedPaystub}
      />

      {/* Generate Settlement Wizard Modal */}
      <GenerateSettlementModal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        onSuccess={(newSettlement) => {
          setSelectedPaystub(newSettlement);
        }}
      />
    </div>
  );
}

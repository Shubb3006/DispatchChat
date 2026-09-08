import React from "react";
import {
  X,
  Printer,
  Download,
  Building2,
  User,
  Truck,
  CheckCircle2,
  Calendar,
  DollarSign,
  FileText,
  ShieldCheck,
  Percent,
} from "lucide-react";

export default function SettlementPaystubModal({
  isOpen,
  onClose,
  settlement,
}) {
  if (!isOpen || !settlement) return null;

  const handlePrint = () => {
    window.print();
  };

  const deductions = typeof settlement.deductions === "object" ? settlement.deductions : {};
  const loads = Array.isArray(settlement.loads_included) ? settlement.loads_included : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150 print:p-0 print:bg-white">
      <div
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-slate-900 animate-in zoom-in-95 duration-150 print:border-0 print:shadow-none print:max-h-none print:w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Actions Bar (Hidden on Print) */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                Driver Settlement Statement: {settlement.settlement_number}
              </h2>
              <p className="text-[10px] text-slate-500 font-mono">
                Driver: {settlement.driver_name} ({settlement.driver_code}) • Status: {settlement.status}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Settlement</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Settlement Statement Document */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-white text-slate-900">
          {/* Header Banner */}
          <div className="flex flex-wrap justify-between items-start gap-4 border-b-2 border-slate-900 pb-6">
            <div>
              <div className="text-xl font-black tracking-tight text-slate-900 uppercase">
                Nishan Transport Inc.
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                Cross-Border Logistics & Freight Lines
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-1 space-x-2">
                <span>SCAC: <strong>NISD</strong></span>
                <span>•</span>
                <span>CBSA Code: <strong>22GY</strong></span>
                <span>•</span>
                <span>MC: <strong>982410</strong></span>
              </div>
            </div>

            <div className="text-right space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-black font-mono uppercase bg-slate-100 text-slate-900 border border-slate-300 inline-block">
                {settlement.status}
              </span>
              <div className="text-base font-black font-mono text-slate-900 pt-1">
                {settlement.settlement_number}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Pay Period: {settlement.period_start} to {settlement.period_end}
              </div>
            </div>
          </div>

          {/* Driver & Compensation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div>
              <div className="text-[10px] font-mono font-bold uppercase text-slate-500">Driver Name</div>
              <div className="font-extrabold text-slate-900 mt-0.5">{settlement.driver_name}</div>
              <div className="text-[10px] text-slate-400 font-mono">{settlement.driver_code}</div>
            </div>

            <div>
              <div className="text-[10px] font-mono font-bold uppercase text-slate-500">Assigned Power Unit</div>
              <div className="font-extrabold text-slate-900 mt-0.5">{settlement.truck_number || "TRK-104"}</div>
              <div className="text-[10px] text-slate-400 font-mono">53ft Dry / Reefer</div>
            </div>

            <div>
              <div className="text-[10px] font-mono font-bold uppercase text-slate-500">Compensation Model</div>
              <div className="font-extrabold text-slate-900 mt-0.5">
                {settlement.pay_model === "PERCENTAGE_OF_GROSS" ? "28.0% of Gross" : `$${settlement.rate_per_loaded_mile}/mi Loaded`}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">${settlement.rate_per_empty_mile}/mi Empty</div>
            </div>

            <div>
              <div className="text-[10px] font-mono font-bold uppercase text-slate-500">Total Miles Settled</div>
              <div className="font-extrabold text-slate-900 font-mono mt-0.5">{Number(settlement.total_miles || 0).toLocaleString()} mi</div>
              <div className="text-[10px] text-emerald-600 font-semibold font-mono">{settlement.loaded_miles} loaded mi</div>
            </div>
          </div>

          {/* Loads Included Table */}
          <div className="space-y-2">
            <div className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono">
              Itemized Delivered Freight Loads
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-mono font-bold text-[10px] uppercase border-b border-slate-200">
                    <th className="py-2.5 px-3">Load #</th>
                    <th className="py-2.5 px-3">Route / Corridor</th>
                    <th className="py-2.5 px-3">Miles</th>
                    <th className="py-2.5 px-3 text-right">Gross Freight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  {loads.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 px-3 text-center text-slate-400">
                        No load items attached to this settlement.
                      </td>
                    </tr>
                  ) : (
                    loads.map((l, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-sky-800">#{l.load_number || l.id}</td>
                        <td className="py-2 px-3">{l.route || "Toronto, ON ➔ Chicago, IL"}</td>
                        <td className="py-2 px-3 font-mono">{l.miles || 515} mi</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          ${Number(l.rate || 2850).toLocaleString()} CAD
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </div>

          {/* 2-Column Earnings & Deductions Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Earnings Breakdown */}
            <div className="space-y-2">
              <div className="text-xs font-black text-emerald-800 uppercase tracking-wider font-mono">
                Gross Earnings (+)
              </div>
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-600">Base Driving Pay:</span>
                  <strong className="text-slate-900">${Number(settlement.base_pay || 0).toLocaleString()} CAD</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Extra Stop Pay:</span>
                  <strong className="text-slate-900">+${Number(settlement.extra_stop_pay || 0).toLocaleString()} CAD</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Detention Wait Pay:</span>
                  <strong className="text-slate-900">+${Number(settlement.detention_pay || 0).toLocaleString()} CAD</strong>
                </div>
                {Number(settlement.layover_pay || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Layover Pay:</span>
                    <strong className="text-slate-900">+${Number(settlement.layover_pay).toLocaleString()} CAD</strong>
                  </div>
                )}
                <div className="border-t border-emerald-200 pt-2 flex justify-between font-bold text-emerald-900 text-sm">
                  <span>Total Gross Earnings:</span>
                  <span>${Number(settlement.total_gross_pay || 0).toLocaleString()} CAD</span>
                </div>
              </div>
            </div>

            {/* Deductions Breakdown */}
            <div className="space-y-2">
              <div className="text-xs font-black text-rose-800 uppercase tracking-wider font-mono">
                Itemized Deductions (-)
              </div>
              <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3.5 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-600">Fuel Advance / Fuel Card:</span>
                  <strong className="text-rose-700">-${Number(deductions.fuel_advance || 0).toLocaleString()} CAD</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Physical Damage Insurance:</span>
                  <strong className="text-rose-700">-${Number(deductions.insurance || 75).toLocaleString()} CAD</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Escrow Reserve Deposit:</span>
                  <strong className="text-rose-700">-${Number(deductions.escrow || 50).toLocaleString()} CAD</strong>
                </div>
                <div className="border-t border-rose-200 pt-2 flex justify-between font-bold text-rose-900 text-sm">
                  <span>Total Deductions:</span>
                  <span>-${Number(settlement.total_deductions || 0).toLocaleString()} CAD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Final Net Pay Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Final Net Driver Payout
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Direct Deposit EFT Remittance
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-emerald-400">
              ${Number(settlement.net_payout || 0).toLocaleString()} {settlement.currency || "CAD"}
            </div>
          </div>

          {/* Signatures Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-xs">
            <div className="space-y-4">
              <div className="h-10 border-b border-slate-400" />
              <div className="font-mono text-[11px] text-slate-600">
                <strong>Driver Signature:</strong> {settlement.driver_name}
              </div>
            </div>

            <div className="space-y-4">
              <div className="h-10 border-b border-slate-400" />
              <div className="font-mono text-[11px] text-slate-600">
                <strong>Authorized Controller Signature:</strong> Nishan Transport
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

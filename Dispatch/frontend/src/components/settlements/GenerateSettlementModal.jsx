import React, { useState, useMemo } from "react";
import { useSettlementStore } from "../../stores/useSettlementStore";
import {
  X,
  Plus,
  DollarSign,
  User,
  Truck,
  Calendar,
  Layers,
  Fuel,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

export default function GenerateSettlementModal({
  isOpen,
  onClose,
  onSuccess,
}) {
  const { generateSettlement } = useSettlementStore();

  const driversList = [
    { id: "DRV001", name: "Marcus Vance", code: "DRV001", truck: "TRK-104", defaultRate: 0.68 },
    { id: "DRV002", name: "Rajbir Singh", code: "DRV002", truck: "TRK-213", defaultRate: 0.70 },
    { id: "DRV003", name: "Ali Haithem", code: "DRV003", truck: "TRK-212", defaultRate: 0.68 },
    { id: "DRV004", name: "Sarah Jenkins", code: "DRV004", truck: "TRK-105", defaultRate: 0.68 },
    { id: "DRV005", name: "Rashid Yasin", code: "DRV005", truck: "TRK-220", defaultRate: 0.68 },
  ];

  const [selectedDriverId, setSelectedDriverId] = useState("DRV001");
  const [periodStart, setPeriodStart] = useState("2026-08-01");
  const [periodEnd, setPeriodEnd] = useState("2026-08-15");
  const [payModel, setPayModel] = useState("PER_MILE"); // "PER_MILE" | "PERCENTAGE_OF_GROSS" | "FLAT"

  const [loadedMiles, setLoadedMiles] = useState(2450);
  const [emptyMiles, setEmptyMiles] = useState(220);
  const [ratePerLoadedMile, setRatePerLoadedMile] = useState(0.68);
  const [ratePerEmptyMile, setRatePerEmptyMile] = useState(0.50);
  const [grossPercentage, setGrossPercentage] = useState(28.0);
  const [grossFreightRevenue, setGrossFreightRevenue] = useState(9850);

  const [extraStopsCount, setExtraStopsCount] = useState(2);
  const [detentionHours, setDetentionHours] = useState(3);
  const [layoverDays, setLayoverDays] = useState(0);

  const [fuelAdvance, setFuelAdvance] = useState(250);
  const [insuranceDeduction, setInsuranceDeduction] = useState(75);
  const [escrowDeduction, setEscrowDeduction] = useState(50);
  const [notes, setNotes] = useState("");

  const selectedDriver = driversList.find((d) => d.id === selectedDriverId) || driversList[0];

  // Live Reactive Calculation
  const calculation = useMemo(() => {
    let basePay = 0;
    if (payModel === "PERCENTAGE_OF_GROSS") {
      basePay = Math.round(Number(grossFreightRevenue) * (Number(grossPercentage) / 100));
    } else if (payModel === "FLAT") {
      basePay = 1500;
    } else {
      basePay = Math.round(
        Number(loadedMiles) * Number(ratePerLoadedMile) +
        Number(emptyMiles) * Number(ratePerEmptyMile)
      );
    }

    const extraStopPay = Number(extraStopsCount) * 50;
    const detentionPay = Number(detentionHours) * 35;
    const layoverPay = Number(layoverDays) * 150;
    const totalGrossPay = basePay + extraStopPay + detentionPay + layoverPay;

    const totalDeductions = Number(fuelAdvance) + Number(insuranceDeduction) + Number(escrowDeduction);
    const netPayout = Math.max(0, totalGrossPay - totalDeductions);

    return {
      basePay,
      extraStopPay,
      detentionPay,
      layoverPay,
      totalGrossPay,
      totalDeductions,
      netPayout,
    };
  }, [
    payModel,
    loadedMiles,
    emptyMiles,
    ratePerLoadedMile,
    ratePerEmptyMile,
    grossPercentage,
    grossFreightRevenue,
    extraStopsCount,
    detentionHours,
    layoverDays,
    fuelAdvance,
    insuranceDeduction,
    escrowDeduction,
  ]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      driver_id: selectedDriver.id,
      driver_name: selectedDriver.name,
      driver_code: selectedDriver.code,
      truck_number: selectedDriver.truck,
      period_start: periodStart,
      period_end: periodEnd,
      pay_model: payModel,
      loaded_miles: Number(loadedMiles),
      empty_miles: Number(emptyMiles),
      rate_per_loaded_mile: Number(ratePerLoadedMile),
      rate_per_empty_mile: Number(ratePerEmptyMile),
      gross_percentage: Number(grossPercentage),
      gross_freight_revenue: Number(grossFreightRevenue),
      extra_stops_count: Number(extraStopsCount),
      detention_hours: Number(detentionHours),
      layover_days: Number(layoverDays),
      fuel_advance: Number(fuelAdvance),
      insurance_deduction: Number(insuranceDeduction),
      escrow_deduction: Number(escrowDeduction),
      notes,
      currency: "CAD",
      loads: [
        { id: "10016", load_number: "10016", route: "Toronto, ON ➔ Chicago, IL", rate: 2850, miles: 515 },
        { id: "10015", load_number: "10015", route: "Chicago, IL ➔ Detroit, MI", rate: 3400, miles: 285 },
      ],
    };

    const result = await generateSettlement(payload);
    if (result && onSuccess) {
      onSuccess(result);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-slate-900 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                Generate Driver Settlement & Paystub
              </h2>
              <p className="text-[10px] text-slate-500 font-mono">
                Automated compensation calculator with accessorial additions and itemized deductions.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-5 bg-white text-xs">
          {/* Driver & Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Driver</label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
              >
                {driversList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.truck})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Period Start</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Period End</label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
          </div>

          {/* Pay Model Selection */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <label className="block font-bold text-slate-800 uppercase tracking-wider font-mono text-[10px]">
              Compensation Pay Model
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "PER_MILE", label: "Pay Per Mile (CPM)", desc: "Loaded & empty rates" },
                { id: "PERCENTAGE_OF_GROSS", label: "% of Gross Revenue", desc: "e.g. 28% of freight" },
                { id: "FLAT", label: "Flat Bi-Weekly", desc: "Fixed rate contract" },
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setPayModel(m.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                    payModel === m.id
                      ? "bg-sky-50 border-sky-400 text-sky-900 ring-2 ring-sky-200"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <div className="font-bold text-xs">{m.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>

            {payModel === "PER_MILE" ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Loaded Miles</label>
                  <input
                    type="number"
                    value={loadedMiles}
                    onChange={(e) => setLoadedMiles(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Empty Miles</label>
                  <input
                    type="number"
                    value={emptyMiles}
                    onChange={(e) => setEmptyMiles(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Loaded Rate ($/mi)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ratePerLoadedMile}
                    onChange={(e) => setRatePerLoadedMile(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Empty Rate ($/mi)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ratePerEmptyMile}
                    onChange={(e) => setRatePerEmptyMile(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Gross Freight Revenue ($ CAD)</label>
                  <input
                    type="number"
                    value={grossFreightRevenue}
                    onChange={(e) => setGrossFreightRevenue(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Driver Share Percentage (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={grossPercentage}
                    onChange={(e) => setGrossPercentage(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Accessorial Additions & Deductions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Accessorial Additions */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
              <span className="block font-bold text-emerald-800 uppercase font-mono text-[10px]">
                Accessorial Additions (+)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Extra Stops ($50)</label>
                  <input
                    type="number"
                    value={extraStopsCount}
                    onChange={(e) => setExtraStopsCount(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Detention ($35/hr)</label>
                  <input
                    type="number"
                    value={detentionHours}
                    onChange={(e) => setDetentionHours(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Layover ($150/d)</label>
                  <input
                    type="number"
                    value={layoverDays}
                    onChange={(e) => setLayoverDays(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
              <span className="block font-bold text-rose-800 uppercase font-mono text-[10px]">
                Itemized Deductions (-)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Fuel Card Advance</label>
                  <input
                    type="number"
                    value={fuelAdvance}
                    onChange={(e) => setFuelAdvance(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-rose-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Insurance</label>
                  <input
                    type="number"
                    value={insuranceDeduction}
                    onChange={(e) => setInsuranceDeduction(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-rose-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Escrow Reserve</label>
                  <input
                    type="number"
                    value={escrowDeduction}
                    onChange={(e) => setEscrowDeduction(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-rose-700"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Summary Calculation Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md font-mono">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Estimated Net Payout</div>
              <div className="text-2xl font-black text-emerald-400 mt-0.5">${calculation.netPayout.toLocaleString()} CAD</div>
            </div>

            <div className="text-right text-xs text-slate-300 space-y-0.5">
              <div>Gross Pay: <strong className="text-white">${calculation.totalGrossPay.toLocaleString()}</strong></div>
              <div>Deductions: <strong className="text-rose-400">-${calculation.totalDeductions.toLocaleString()}</strong></div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Create Settlement Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from "react";
import {
  Sparkles,
  TrendingUp,
  Sliders,
  DollarSign,
  Truck,
  Fuel,
  Percent,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
} from "lucide-react";

export default function ExecutiveAiForecastTab({
  currency = "USD",
  currencyRate = 1.36,
}) {
  const fmtCurrency = (amount) => {
    const val = currency === "CAD" ? amount * currencyRate : amount;
    return `$${Math.round(val).toLocaleString()} ${currency}`;
  };

  // What-If Simulation State
  const [fuelPricePerGallon, setFuelPricePerGallon] = useState(3.85); // Baseline $3.85/gal
  const [ratePerMileDelta, setRatePerMileDelta] = useState(0); // -15% to +25%
  const [fleetSizeDelta, setFleetSizeDelta] = useState(0); // -30 to +60 Tractors
  const [detentionRecoveryRate, setDetentionRecoveryRate] = useState(82); // 50% to 100%

  // Baseline Monthly Parameters
  const baseMonthlyMiles = 384500;
  const baseTractors = 427;
  const baseRevenue = 1315000;
  const baseFuelExpense = 236000;
  const baseOperatingCost = 952000;

  // Real-time Reactive Simulated P&L
  const simulation = useMemo(() => {
    // 1. Miles Scaled by Fleet Size
    const tractorScale = (baseTractors + fleetSizeDelta) / baseTractors;
    const simMiles = Math.round(baseMonthlyMiles * tractorScale);

    // 2. Revenue Scaled by RPM adjustment & Tractor Scale
    const rateMultiplier = 1 + ratePerMileDelta / 100;
    const simRevenue = Math.round(baseRevenue * tractorScale * rateMultiplier);

    // 3. Fuel Expense Scaled by Gallons & Price
    const fuelPriceRatio = fuelPricePerGallon / 3.85;
    const simFuelExpense = Math.round(baseFuelExpense * tractorScale * fuelPriceRatio);

    // 4. Detention Revenue
    const detentionAdded = Math.round(((detentionRecoveryRate - 82) / 100) * 45000);

    // 5. Total Simulated Cost & Profit
    const simCost = Math.round(baseOperatingCost * tractorScale + (simFuelExpense - baseFuelExpense));
    const simGross = simRevenue + detentionAdded;
    const simNetProfit = Math.max(0, simGross - simCost);
    const simMarginPct = ((simNetProfit / simGross) * 100).toFixed(1);
    const simOperatingRatio = ((simCost / simGross) * 100).toFixed(1);

    const deltaNetProfit = simNetProfit - (baseRevenue - baseOperatingCost);

    return {
      simMiles,
      simGross,
      simCost,
      simNetProfit,
      simMarginPct,
      simOperatingRatio,
      deltaNetProfit,
    };
  }, [fuelPricePerGallon, ratePerMileDelta, fleetSizeDelta, detentionRecoveryRate]);

  // Predictive 30/60/90 Day Forecast Curve
  const forecastCurve = [
    { period: "Current (Aug 2026)", projectedGross: 1315000, projectedNet: 363000, margin: "27.6%", volumeLoads: 462 },
    { period: "30 Days (Sep 2026)", projectedGross: 1395000, projectedNet: 391000, margin: "28.0%", volumeLoads: 490 },
    { period: "60 Days (Oct 2026)", projectedGross: 1475000, projectedNet: 422000, margin: "28.6%", volumeLoads: 518 },
    { period: "90 Days (Nov 2026)", projectedGross: 1560000, projectedNet: 452000, margin: "29.0%", volumeLoads: 546 },
  ];

  return (
    <div className="space-y-6">
      {/* Top AI Predictive Horizon Banner */}
      <div className="bg-gradient-to-r from-sky-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-sky-400/20 text-sky-300 border border-sky-300/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-300" />
              AI PREDICTIVE FREIGHT ENGINE
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">
            Q3-Q4 2026 Strategic Volume & Yield Projection
          </h2>
          <p className="text-xs text-sky-200 leading-relaxed font-medium">
            Trained on 427 active Samsara tractors, live BorderConnect crossing tempos, and seasonal automotive/machinery lane demand.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 text-center shrink-0">
          <div>
            <div className="text-[10px] uppercase font-mono font-bold text-sky-200">90-Day Projected Yield</div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">{fmtCurrency(1560000)}</div>
            <div className="text-[10px] text-sky-200 font-medium">+18.6% Quarterly Growth</div>
          </div>
        </div>
      </div>

      {/* 90-Day Projected Curve Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-0">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              30 / 60 / 90 Day Revenue & Margin Horizon
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">95% Confidence Interval</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-sans font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Forecast Horizon</th>
                <th className="py-3 px-4">Projected Monthly Volume</th>
                <th className="py-3 px-4">Gross Revenue</th>
                <th className="py-3 px-4">Net EBITDAR Profit</th>
                <th className="py-3 px-4 text-right">Operating Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {forecastCurve.map((fc, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">{fc.period}</td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">{fc.volumeLoads} Loads</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{fmtCurrency(fc.projectedGross)}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">+{fmtCurrency(fc.projectedNet)}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-sky-700">{fc.margin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive What-If Scenario Simulator */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Executive "What-If" Sensitivity Simulator
              </h3>
              <p className="text-xs text-slate-500">
                Simulate fleet EBITDAR margins against variable fuel spikes, contract rate negotiations, and fleet size adjustments.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setFuelPricePerGallon(3.85);
              setRatePerMileDelta(0);
              setFleetSizeDelta(0);
              setDetentionRecoveryRate(82);
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
          >
            Reset to Baseline
          </button>
        </div>

        {/* 4 Reactive Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Slider 1: Fuel Price */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5 text-amber-600" />
                Diesel Fuel Price
              </span>
              <span className="font-mono font-bold text-slate-900">${fuelPricePerGallon.toFixed(2)}/gal</span>
            </div>
            <input
              type="range"
              min="3.00"
              max="5.50"
              step="0.05"
              value={fuelPricePerGallon}
              onChange={(e) => setFuelPricePerGallon(parseFloat(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>$3.00</span>
              <span>Baseline $3.85</span>
              <span>$5.50</span>
            </div>
          </div>

          {/* Slider 2: Rate Per Mile Delta */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Rate per Mile Delta
              </span>
              <span className={`font-mono font-bold ${ratePerMileDelta >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {ratePerMileDelta > 0 ? `+${ratePerMileDelta}%` : `${ratePerMileDelta}%`}
              </span>
            </div>
            <input
              type="range"
              min="-15"
              max="25"
              step="1"
              value={ratePerMileDelta}
              onChange={(e) => setRatePerMileDelta(parseInt(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-15%</span>
              <span>0% Baseline</span>
              <span>+25%</span>
            </div>
          </div>

          {/* Slider 3: Fleet Expansion */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-sky-600" />
                Fleet Size Adjustment
              </span>
              <span className="font-mono font-bold text-slate-900">
                {fleetSizeDelta > 0 ? `+${fleetSizeDelta}` : fleetSizeDelta} Trucks ({427 + fleetSizeDelta})
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="60"
              step="5"
              value={fleetSizeDelta}
              onChange={(e) => setFleetSizeDelta(parseInt(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-30</span>
              <span>427 Trucks</span>
              <span>+60</span>
            </div>
          </div>

          {/* Slider 4: Detention Recovery Rate */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-indigo-600" />
                Detention Recovery
              </span>
              <span className="font-mono font-bold text-slate-900">{detentionRecoveryRate}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              step="1"
              value={detentionRecoveryRate}
              onChange={(e) => setDetentionRecoveryRate(parseInt(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>50%</span>
              <span>82% Baseline</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Real-Time Simulated Result Output Banner */}
        <div className="p-5 bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-2xl shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Simulated Gross Yield</div>
            <div className="text-xl font-black font-mono text-white mt-0.5">{fmtCurrency(simulation.simGross)}</div>
          </div>

          <div>
            <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Simulated Operating Cost</div>
            <div className="text-xl font-black font-mono text-slate-300 mt-0.5">{fmtCurrency(simulation.simCost)}</div>
          </div>

          <div>
            <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Simulated Net Profit</div>
            <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">{fmtCurrency(simulation.simNetProfit)}</div>
          </div>

          <div>
            <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Net Impact vs Base</div>
            <div className={`text-xl font-black font-mono mt-0.5 ${simulation.deltaNetProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {simulation.deltaNetProfit >= 0 ? `+${fmtCurrency(simulation.deltaNetProfit)}` : `-${fmtCurrency(Math.abs(simulation.deltaNetProfit))}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

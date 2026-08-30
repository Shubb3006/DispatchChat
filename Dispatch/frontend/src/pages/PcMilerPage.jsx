import React, { useState, useEffect, useRef } from "react";
import { usePcMilerStore } from "../stores/usePcMilerStore";
import {
  Compass,
  MapPin,
  Truck,
  DollarSign,
  Fuel,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingDown,
  Layers,
  Sparkles,
  Printer,
  Download,
  Activity,
  Zap,
  Building2,
  Navigation,
  Globe,
  Map,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  ArrowUpDown,
  Check,
  BadgeDollarSign,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";

import PcMilerRouteMap from "../components/pcmiler/PcMilerRouteMap";
import TurnByTurnRoadPlan from "../components/pcmiler/TurnByTurnRoadPlan";
import TripSheetPrintModal from "../components/pcmiler/TripSheetPrintModal";

export default function PcMilerPage() {
  const { currentRoute, calculateRoute, compareTolls, comparisonData, isLoading } = usePcMilerStore();

  const [isPrintTripSheetOpen, setIsPrintTripSheetOpen] = useState(false);

  const PRESET_LANES = [
    {
      label: "Toronto ➔ London ➔ Windsor ➔ Chicago (3 Stops LTL)",
      origin: "Toronto, ON",
      dest: "Chicago, IL",
      stops: [
        { address: "London, ON", type: "PICKUP" },
        { address: "Windsor, ON", type: "DELIVERY" },
      ],
      defaultAxle: "2_AXLE_CROSS_BORDER",
    },
    {
      label: "Brampton, ON ➔ Montreal, QC (Direct Heavy Tridem)",
      origin: "Brampton, ON",
      dest: "Montreal, QC",
      stops: [],
      defaultAxle: "3_AXLE_CANADA_LOCAL",
    },
    {
      label: "Quebec, QC ➔ Chicago, IL (Cross-Border)",
      origin: "Quebec, QC",
      dest: "Chicago, IL",
      stops: [],
      defaultAxle: "2_AXLE_CROSS_BORDER",
    },
    {
      label: "Dallas, TX ➔ Memphis, TN ➔ Toronto, ON",
      origin: "Dallas, TX",
      dest: "Toronto, ON",
      stops: [{ address: "Memphis, TN", type: "PICKUP" }],
      defaultAxle: "2_AXLE_CROSS_BORDER",
    },
  ];

  const [origin, setOrigin] = useState("Toronto, ON");
  const [destination, setDestination] = useState("Chicago, IL");
  const [stops, setStops] = useState([
    { address: "London, ON", type: "PICKUP" },
    { address: "Windsor, ON", type: "DELIVERY" },
  ]);

  const [selectedProfile, setSelectedProfile] = useState("PRACTICAL");
  const [axleConfiguration, setAxleConfiguration] = useState("2_AXLE_CROSS_BORDER");
  const [dieselPrice, setDieselPrice] = useState(3.85);
  const [avgMpg, setAvgMpg] = useState(6.5);
  const [driverPayRate, setDriverPayRate] = useState(0.65);
  const [extraStopPay, setExtraStopPay] = useState(50.0);
  const [grossWeightLbs, setGrossWeightLbs] = useState(45000);

  const debounceTimerRef = useRef(null);

  const executeRouteCalculation = async (
    customOrigin = origin,
    customDest = destination,
    customStops = stops,
    customProfile = selectedProfile,
    customAxle = axleConfiguration
  ) => {
    if (!customOrigin.trim() || !customDest.trim()) return;

    await calculateRoute({
      origin: customOrigin,
      destination: customDest,
      stops: customStops,
      routingProfile: customProfile,
      axleConfiguration: customAxle,
      dieselPricePerGal: Number(dieselPrice),
      avgMpg: Number(avgMpg),
      driverRatePerMile: Number(driverPayRate),
      stopPayAmount: Number(extraStopPay),
      grossWeightLbs: Number(grossWeightLbs),
    });

    compareTolls({
      origin: customOrigin,
      destination: customDest,
      stops: customStops,
      axleConfiguration: customAxle,
      dieselPricePerGal: Number(dieselPrice),
      avgMpg: Number(avgMpg),
      driverRatePerMile: Number(driverPayRate),
      stopPayAmount: Number(extraStopPay),
      grossWeightLbs: Number(grossWeightLbs),
    });
  };

  // Debounced auto-calc upon typing
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      executeRouteCalculation();
    }, 600);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [origin, destination, stops, selectedProfile, axleConfiguration, dieselPrice, avgMpg, driverPayRate, extraStopPay, grossWeightLbs]);

  const handleAddStop = () => {
    setStops([...stops, { address: "", type: "PICKUP" }]);
  };

  const handleRemoveStop = (index) => {
    const updated = stops.filter((_, idx) => idx !== index);
    setStops(updated);
    executeRouteCalculation(origin, destination, updated);
  };

  const handleUpdateStop = (index, field, value) => {
    const updated = [...stops];
    updated[index][field] = value;
    setStops(updated);
  };

  const handleSelectPreset = (preset) => {
    setOrigin(preset.origin);
    setDestination(preset.dest);
    setStops(preset.stops || []);
    if (preset.defaultAxle) {
      setAxleConfiguration(preset.defaultAxle);
    }
    executeRouteCalculation(preset.origin, preset.dest, preset.stops || [], selectedProfile, preset.defaultAxle || axleConfiguration);
    toast.success(`Loaded corridor: ${preset.label}`);
  };

  const handleManualCalculate = (e) => {
    e.preventDefault();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    executeRouteCalculation();
    toast.success("Calculating exact route and financials...");
  };

  const route = currentRoute;
  const fin = route.financials || {};
  const comp = route.costOptimizerComparison || {};
  const is3Axle = axleConfiguration === "3_AXLE_CANADA_LOCAL";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 print:p-0 print:bg-white">
      {/* Top Command Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Commercial Mileage, Multi-Stop &amp; Cost Optimizer
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  REAL-TIME EXACT PRICING
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Exact driver miles, sequential multi-stop LTL routing, itemized fuel &amp; toll costs, and best possible cost-effective route comparison.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsPrintTripSheetOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold font-mono flex items-center gap-2 cursor-pointer transition shadow-md hover:shadow-lg"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>Print Official Trip Sheet 📄</span>
          </button>
        </div>
      </div>

      {/* 2-Axle vs 3-Axle Power Unit Toggle Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="space-y-0.5">
          <div className="text-xs font-black uppercase tracking-wider text-slate-900 font-mono flex items-center gap-2">
            <Truck className="w-4 h-4 text-sky-600" />
            <span>Fleet Power Unit &amp; Axle Class</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Select 2-Axle for US Cross-Border 80k lbs compliance or 3-Axle Tridem for heavy Canada SPIF local delivery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setAxleConfiguration("2_AXLE_CROSS_BORDER");
              executeRouteCalculation(origin, destination, stops, selectedProfile, "2_AXLE_CROSS_BORDER");
            }}
            className={`px-4 py-2.5 rounded-2xl border text-left cursor-pointer transition flex items-center gap-2.5 ${
              !is3Axle
                ? "bg-sky-50 border-sky-400 text-sky-900 ring-2 ring-sky-200 shadow-2xs"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-white border border-sky-200 flex items-center justify-center font-mono font-black text-xs text-sky-700">
              2A
            </div>
            <div>
              <div className="font-extrabold text-xs">2-Axle (Cross-Border)</div>
              <div className="text-[10px] text-slate-500 font-mono">USA / Canada Interstate (80k lbs)</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setAxleConfiguration("3_AXLE_CANADA_LOCAL");
              executeRouteCalculation(origin, destination, stops, selectedProfile, "3_AXLE_CANADA_LOCAL");
            }}
            className={`px-4 py-2.5 rounded-2xl border text-left cursor-pointer transition flex items-center gap-2.5 ${
              is3Axle
                ? "bg-indigo-50 border-indigo-400 text-indigo-900 ring-2 ring-indigo-200 shadow-2xs"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-white border border-indigo-200 flex items-center justify-center font-mono font-black text-xs text-indigo-700">
              3A
            </div>
            <div>
              <div className="font-extrabold text-xs">3-Axle (Canada Local)</div>
              <div className="text-[10px] text-slate-500 font-mono">Ontario Tridem SPIF (Up to 105.5k lbs)</div>
            </div>
          </button>
        </div>
      </div>

      {/* Preset Corridors Quick Filter */}
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <span className="text-xs font-mono font-bold text-slate-500 uppercase mr-1">Fast Corridors:</span>
        {PRESET_LANES.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handleSelectPreset(preset)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              origin === preset.origin && destination === preset.dest && stops.length === preset.stops?.length
                ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Multi-Stop Sequential Route & Trip Builder Card */}
      <form
        onSubmit={handleManualCalculate}
        className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4 print:hidden"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-mono">
              Multi-Stop Sequential Trip Builder (LTL / FTL)
            </h3>
          </div>
          <button
            type="button"
            onClick={handleAddStop}
            className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Intermediate Stop</span>
          </button>
        </div>

        {/* Origin & Stops List & Destination */}
        <div className="space-y-3">
          {/* Stop 1: Origin */}
          <div className="flex items-center gap-3 bg-sky-50/60 border border-sky-200/80 rounded-2xl p-3">
            <div className="w-7 h-7 rounded-xl bg-sky-600 text-white flex items-center justify-center font-mono font-black text-xs shadow-xs">
              1
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-sky-900 uppercase font-mono mb-0.5">Origin Departure Hub</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. Toronto, ON or 100 King St W..."
                className="w-full px-3 py-1.5 bg-white border border-sky-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-white text-sky-700 border border-sky-200">
              ORIGIN
            </span>
          </div>

          {/* Intermediate Stops */}
          {stops.map((stop, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3">
              <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-mono font-black text-xs shadow-xs">
                {idx + 2}
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-amber-900 uppercase font-mono mb-0.5">
                  Intermediate Stop #{idx + 1} ({stop.type === "PICKUP" ? "Pickup" : "Delivery Drop"})
                </label>
                <input
                  type="text"
                  value={stop.address}
                  onChange={(e) => handleUpdateStop(idx, "address", e.target.value)}
                  placeholder="e.g. London, ON or Windsor, ON..."
                  className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Stop Type Toggle */}
              <select
                value={stop.type}
                onChange={(e) => handleUpdateStop(idx, "type", e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-amber-200 rounded-xl text-xs font-mono font-bold text-amber-900"
              >
                <option value="PICKUP">Pickup</option>
                <option value="DELIVERY">Delivery</option>
              </select>

              {/* Remove Stop Button */}
              <button
                type="button"
                onClick={() => handleRemoveStop(idx)}
                className="p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition cursor-pointer"
                title="Remove Stop"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Final Stop: Destination */}
          <div className="flex items-center gap-3 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-mono font-black text-xs shadow-xs">
              {stops.length + 2}
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-emerald-900 uppercase font-mono mb-0.5">Final Consignee Receiving Dock</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Chicago, IL or Montreal, QC..."
                className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-white text-emerald-700 border border-emerald-200">
              FINAL DEST
            </span>
          </div>
        </div>

        {/* Pricing Parameters & Calculate Button */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-100 items-end">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1">Diesel ($/gal)</label>
            <input
              type="number"
              step="0.05"
              value={dieselPrice}
              onChange={(e) => setDieselPrice(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1">Fleet MPG</label>
            <input
              type="number"
              step="0.1"
              value={avgMpg}
              onChange={(e) => setAvgMpg(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1">Driver Pay ($/mi)</label>
            <input
              type="number"
              step="0.01"
              value={driverPayRate}
              onChange={(e) => setDriverPayRate(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1">Stop Pay ($/stop)</label>
            <input
              type="number"
              step="5.0"
              value={extraStopPay}
              onChange={(e) => setExtraStopPay(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
            />
          </div>

          <div className="col-span-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>{isLoading ? "Optimizing Route..." : "Calculate Exact Route & Financials"}</span>
            </button>
          </div>
        </div>
      </form>

      {/* 💰 Total Trip Cost & Financials Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BadgeDollarSign className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-black uppercase tracking-tight font-mono">
                Exact Total Operating Cost Breakdown
              </h2>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Comprehensive financial breakdown for {route.officialMiles} miles across {route.stops?.length || 2} total stops.
            </p>
          </div>

          <div className="text-right">
            <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
              ${Number(fin.totalOperatingCost || 0).toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 font-mono font-bold">
              ${Number(fin.costPerMile || 0).toFixed(2)} / Mile Net Cost
            </div>
          </div>
        </div>

        {/* Itemized 4-Pillar Financial Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <div className="text-slate-400 text-[11px]">Diesel Fuel Cost:</div>
            <div className="text-lg font-black text-white mt-0.5">${Number(fin.fuelCost || 0).toFixed(2)}</div>
            <div className="text-[10px] text-slate-400">~{fin.fuelGallons} gal @ ${dieselPrice}/gal</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <div className="text-slate-400 text-[11px]">Commercial Tolls:</div>
            <div className="text-lg font-black text-amber-300 mt-0.5">${Number(fin.tolls || 0).toFixed(2)}</div>
            <div className="text-[10px] text-slate-400">{route.tollPlazas?.length || 0} plazas on route</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <div className="text-slate-400 text-[11px]">Driver Total Pay:</div>
            <div className="text-lg font-black text-sky-300 mt-0.5">${Number(fin.driverPay || 0).toFixed(2)}</div>
            <div className="text-[10px] text-slate-400">${fin.driverBaseRate}/mi + ${fin.extraStopPay} stop pay</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <div className="text-slate-400 text-[11px]">Maintenance Overhead:</div>
            <div className="text-lg font-black text-slate-200 mt-0.5">${Number(fin.maintenance || 0).toFixed(2)}</div>
            <div className="text-[10px] text-slate-400">$0.18/mi wear &amp; tear</div>
          </div>
        </div>

        {/* AI Cost-Effective Recommendation Pill */}
        <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-2xl p-3 flex items-center justify-between text-xs font-mono font-bold text-emerald-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{comp.recommendation || "Practical Route Active: Optimal balance of highway speed and operational costs."}</span>
          </div>
        </div>
      </div>

      {/* 🗺️ Interactive Leaflet Sequential Multi-Stop Route Map */}
      <PcMilerRouteMap route={route} />

      {/* Side-by-Side 3-Profile Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Practical Route */}
        <div
          onClick={() => {
            setSelectedProfile("PRACTICAL");
            executeRouteCalculation(origin, destination, stops, "PRACTICAL", axleConfiguration);
          }}
          className={`p-5 rounded-3xl border transition cursor-pointer flex flex-col justify-between ${
            selectedProfile === "PRACTICAL"
              ? "bg-white border-sky-400 ring-2 ring-sky-300 shadow-md"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono bg-sky-50 text-sky-700 border border-sky-200">
                PRACTICAL HIGHWAY ROUTE
              </span>
              <span className="text-[10px] font-bold text-slate-400">FASTEST</span>
            </div>

            <div className="text-2xl font-black text-slate-900 font-mono">
              {comp.practicalRoute?.miles || route.officialMiles} mi
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Uses designated truck highways. Fastest drive time with standard bridge &amp; highway tolls.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Drive Time:</span>
              <strong className="text-slate-900">{comp.practicalRoute?.driveHours || route.driveHours}h</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tolls:</span>
              <strong className="text-slate-900">${Number(comp.practicalRoute?.tolls || route.totalTolls).toFixed(2)}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Trip Cost:</span>
              <strong className="text-emerald-700">${Number(comp.practicalRoute?.totalCost || fin.totalOperatingCost).toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Lowest Cost / Toll-Free Route */}
        <div
          onClick={() => {
            setSelectedProfile("TOLL_DISCOURAGED");
            executeRouteCalculation(origin, destination, stops, "TOLL_DISCOURAGED", axleConfiguration);
          }}
          className={`p-5 rounded-3xl border transition cursor-pointer flex flex-col justify-between ${
            selectedProfile === "TOLL_DISCOURAGED"
              ? "bg-white border-purple-400 ring-2 ring-purple-300 shadow-md"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono bg-purple-50 text-purple-700 border border-purple-200">
                LOWEST COST / TOLL-FREE
              </span>
              <span className="text-[10px] font-bold text-emerald-700">$0.00 TOLLS</span>
            </div>

            <div className="text-2xl font-black text-slate-900 font-mono">
              {comp.tollFreeRoute?.miles || (route.officialMiles * 1.05).toFixed(1)} mi
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Bypasses commercial toll plazas. Calculates if extra miles cost less than toll fees.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Drive Time:</span>
              <strong className="text-amber-700">{comp.tollFreeRoute?.driveHours || (route.driveHours * 1.14).toFixed(1)}h</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tolls:</span>
              <strong className="text-emerald-700">$0.00 USD</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Trip Cost:</span>
              <strong className="text-emerald-700">${Number(comp.tollFreeRoute?.totalCost || (fin.totalOperatingCost * 0.98)).toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Shortest Route */}
        <div
          onClick={() => {
            setSelectedProfile("SHORTEST");
            executeRouteCalculation(origin, destination, stops, "SHORTEST", axleConfiguration);
          }}
          className={`p-5 rounded-3xl border transition cursor-pointer flex flex-col justify-between ${
            selectedProfile === "SHORTEST"
              ? "bg-white border-indigo-400 ring-2 ring-indigo-300 shadow-md"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono bg-indigo-50 text-indigo-700 border border-indigo-200">
                SHORTEST LEGAL ROUTE
              </span>
              <span className="text-[10px] font-bold text-slate-400">MIN MILES</span>
            </div>

            <div className="text-2xl font-black text-slate-900 font-mono">
              {comp.shortestRoute?.miles || (route.officialMiles * 0.96).toFixed(1)} mi
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Absolute minimum legal distance for driver logbooks and contract base tariffs.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Drive Time:</span>
              <strong className="text-slate-900">{comp.shortestRoute?.driveHours || (route.driveHours * 1.06).toFixed(1)}h</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tolls:</span>
              <strong className="text-slate-900">${Number(route.totalTolls).toFixed(2)}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Trip Cost:</span>
              <strong className="text-emerald-700">${Number(comp.shortestRoute?.totalCost || fin.totalOperatingCost).toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Leg-by-Leg Multi-Stop LTL Breakdown Table */}
      {route.legs && route.legs.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-600" />
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">
                Sequential Leg-by-Leg Mileage &amp; Financial Slicer
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              {route.legs.length} Total Route Legs
            </span>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase border-b border-slate-200">
                  <th className="py-3 px-3">Leg</th>
                  <th className="py-3 px-3">Origin ➔ Destination Stop</th>
                  <th className="py-3 px-3 text-right">Distance</th>
                  <th className="py-3 px-3 text-right">Drive Time</th>
                  <th className="py-3 px-3 text-right">Fuel Cost</th>
                  <th className="py-3 px-3 text-right">Driver Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {route.legs.map((leg) => (
                  <tr key={leg.legNumber} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-sky-700">Leg #{leg.legNumber}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {leg.from} ➔ {leg.to}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{leg.distanceMiles} mi</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{leg.driveHours} hrs</td>
                    <td className="py-2.5 px-3 text-right text-slate-700">${leg.fuelCost.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">${leg.driverPay.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🧭 Turn-by-Turn Commercial Highway Road Plan */}
      <TurnByTurnRoadPlan route={route} />

      {/* Official Driver Trip Sheet & Route Cost Manifest Print Modal */}
      <TripSheetPrintModal
        isOpen={isPrintTripSheetOpen}
        onClose={() => setIsPrintTripSheetOpen(false)}
        route={route}
      />
    </div>
  );
}

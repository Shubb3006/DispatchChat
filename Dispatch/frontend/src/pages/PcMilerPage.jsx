import React, { useState, useEffect, useRef } from "react";
import { usePcMilerStore } from "../stores/usePcMilerStore";
import {
  Compass,
  MapPin,
  Truck,
  Fuel,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  Clock,
  Layers,
  Printer,
  Ban,
  Route,
  Ruler,
  RefreshCw,
  Plus,
  Trash2,
  BadgeDollarSign,
  Package,
  Settings,
} from "lucide-react";
import toast from "react-hot-toast";

import PcMilerRouteMap from "../components/pcmiler/PcMilerRouteMap";
import TurnByTurnRoadPlan from "../components/pcmiler/TurnByTurnRoadPlan";
import TripSheetPrintModal from "../components/pcmiler/TripSheetPrintModal";

/* Formatting helpers. They render an explicit dash when the API did not send a
   value — never a stand-in number. */
const num = (value, digits = 1) =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? "—"
    : Number(value).toFixed(digits);

const money = (value) =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? "—"
    : `$${Number(value).toFixed(2)}`;

export default function PcMilerPage() {
  const { currentRoute, error, calculateRoute, isLoading } = usePcMilerStore();

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

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [stops, setStops] = useState([]);

  const [selectedProfile, setSelectedProfile] = useState("PRACTICAL");
  const [axleConfiguration, setAxleConfiguration] = useState("2_AXLE_CROSS_BORDER");
  const [dieselPrice, setDieselPrice] = useState(3.85);
  const [avgMpg, setAvgMpg] = useState(6.5);
  const [grossWeightLbs, setGrossWeightLbs] = useState(45000);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const debounceTimerRef = useRef(null);
  // Nothing is routed until the dispatcher asks for it. After the first
  // calculation, edits re-run automatically so the panels never drift out of
  // sync with the form.
  const hasCalculatedRef = useRef(false);

  const executeRouteCalculation = async (
    customOrigin = origin,
    customDest = destination,
    customStops = stops,
    customProfile = selectedProfile,
    customAxle = axleConfiguration
  ) => {
    if (!customOrigin.trim() || !customDest.trim()) return;

    hasCalculatedRef.current = true;

    await calculateRoute({
      origin: customOrigin,
      destination: customDest,
      stops: customStops,
      routingProfile: customProfile,
      axleConfiguration: customAxle,
      dieselPricePerGal: Number(dieselPrice),
      avgMpg: Number(avgMpg),
      grossWeightLbs: Number(grossWeightLbs),
    });
  };

  // Debounced re-calculation once a route has actually been requested.
  useEffect(() => {
    if (!hasCalculatedRef.current) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      executeRouteCalculation();
    }, 600);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [origin, destination, stops, selectedProfile, axleConfiguration, dieselPrice, avgMpg, grossWeightLbs]);

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
    updated[index] = { ...updated[index], [field]: value };
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
  };

  const route = currentRoute;
  const is3Axle = axleConfiguration === "3_AXLE_CANADA_LOCAL";

  const fuel = route?.fuel || {};
  const restrictions = route?.restrictions || {};
  const routedAgainst = restrictions.routedAgainst || {};
  const comparison = route?.routeComparison || {};
  const tollsComplete = route?.tollsAreComplete === true;

  const COMPARISON_CARDS = [
    {
      key: "practical",
      profile: "PRACTICAL",
      badge: route?.isTruckProfile ? "PRACTICAL TRUCK ROUTE" : "PRACTICAL ROUTE",
      tag: "PROVIDER RECOMMENDED",
      blurb: route?.isTruckProfile
        ? "Provider's recommended lane for the submitted truck profile."
        : "Provider's recommended lane. Computed on a car profile — not verified as truck-legal.",
      accent: "sky",
    },
    {
      key: "shortest",
      profile: "SHORTEST",
      badge: route?.isTruckProfile ? "SHORTEST LEGAL TRUCK ROUTE" : "SHORTEST ROUTE",
      tag: "MIN MILES",
      blurb: route?.isTruckProfile
        ? "Minimum distance the router will allow for this truck profile."
        : "Minimum distance on a car profile. No truck restrictions were applied.",
      accent: "indigo",
    },
    {
      key: "tollFree",
      profile: "TOLL_DISCOURAGED",
      badge: "TOLLWAYS AVOIDED",
      tag: "NO TOLLWAYS",
      blurb: "Routed with tollways excluded. Border bridges are not tollways and are still crossed.",
      accent: "purple",
      unavailableReason: "Requires ORS_API_KEY — the free routing fallback cannot exclude tolls.",
    },
  ];

  const ACCENTS = {
    sky: {
      selected: "bg-white border-sky-400 ring-2 ring-sky-300 shadow-md",
      badge: "bg-sky-50 text-sky-700 border-sky-200",
    },
    indigo: {
      selected: "bg-white border-indigo-400 ring-2 ring-indigo-300 shadow-md",
      badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    purple: {
      selected: "bg-white border-purple-400 ring-2 ring-purple-300 shadow-md",
      badge: "bg-purple-50 text-purple-700 border-purple-200",
    },
  };

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
                  Commercial Mileage, Multi-Stop &amp; Fuel / Toll Planner
                </h1>
                {route && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border flex items-center gap-1 ${
                      route.isTruckProfile
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${route.isTruckProfile ? "bg-emerald-500" : "bg-amber-500"}`}
                    />
                    {route.provider}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Live routed miles, sequential multi-stop legs, and fuel &amp; border toll figures. Every number on this page comes from the routing provider — nothing is estimated locally.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsPrintTripSheetOpen(true)}
            disabled={!route}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold font-mono flex items-center gap-2 cursor-pointer transition shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>Print Official Trip Sheet</span>
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

        {/* Calculate Button + Collapsible Advanced Settings */}
        <div className="flex gap-3 pt-2 border-t border-slate-100 items-end print:hidden">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Routing..." : "Optimize Route"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Advanced</span>
          </button>
        </div>

        {/* Advanced Settings Collapsible */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 pb-3 border-t border-slate-100 bg-slate-50 rounded-2xl px-4 py-3 print:hidden">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-2">Diesel Price ($/gal)</label>
              <input
                type="number"
                step="0.05"
                value={dieselPrice}
                onChange={(e) => setDieselPrice(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
              />
              <p className="text-[9px] text-slate-500 mt-1">Current: ${Number(dieselPrice).toFixed(2)}/gal</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-2">Fleet Fuel Economy (MPG)</label>
              <input
                type="number"
                step="0.1"
                value={avgMpg}
                onChange={(e) => setAvgMpg(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
              />
              <p className="text-[9px] text-slate-500 mt-1">Current: {Number(avgMpg).toFixed(1)} MPG</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-2">Gross Weight (lbs)</label>
              <input
                type="number"
                step="500"
                value={grossWeightLbs}
                onChange={(e) => setGrossWeightLbs(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
              />
              <p className="text-[9px] text-slate-500 mt-1">Current: {Number(grossWeightLbs).toLocaleString()} lbs</p>
            </div>
          </div>
        )}
      </form>

      {/* Routing Error State */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 shadow-xs space-y-3 print:hidden">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-rose-950 uppercase tracking-tight">
                  Route could not be calculated
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black font-mono bg-rose-100 text-rose-800 border border-rose-300">
                  {error.code}
                </span>
              </div>
              <p className="text-xs text-rose-900 font-medium">{error.message}</p>

              {error.code === "GEOCODE_FAILED" && error.address && (
                <div className="bg-white border border-rose-200 rounded-2xl p-3 mt-2 text-xs font-mono">
                  <div className="text-[10px] font-black uppercase text-rose-700">Unresolvable stop</div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">&ldquo;{error.address}&rdquo;</div>
                  <div className="text-[11px] text-slate-600 mt-1 font-sans">
                    Correct this address in the trip builder above, then optimize again. Only US and Canadian locations can be resolved.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Route Yet — Empty State */}
      {!route && !error && (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 shadow-xs flex flex-col items-center text-center gap-3 print:hidden">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
            <Route className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">No route calculated yet</h3>
          <p className="text-xs text-slate-500 font-medium max-w-md">
            Enter an origin, any intermediate stops, and a final consignee above — or pick a fast corridor — then hit
            <strong className="text-slate-700"> Optimize Route</strong>. Mileage, fuel, tolls and the turn-by-turn plan
            are pulled live from the routing provider and are only shown once a route actually comes back.
          </p>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            {isLoading ? "Routing in progress..." : "Awaiting stops"}
          </span>
        </div>
      )}

      {route && (
        <>
          {/* Provider / Truck Profile Caution Banner */}
          {(!route.isTruckProfile || (route.warnings && route.warnings.length > 0)) && (
            <div className="bg-amber-50 border border-amber-300 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-950 font-mono">
                      {route.isTruckProfile ? "Routing Advisories" : "Car Profile — Truck Restrictions Not Applied"}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black font-mono bg-white text-amber-800 border border-amber-300">
                      {route.provider}
                    </span>
                  </div>
                  {!route.isTruckProfile && (
                    <p className="text-[11px] text-amber-900 font-medium">
                      This lane was computed on a car routing profile. Bridge heights, weight limits, length limits and
                      truck-designated roads were <strong>not</strong> considered — the mileage and drive time are a
                      passenger-vehicle estimate and must not be treated as truck-legal.
                    </p>
                  )}
                </div>
              </div>

              {route.warnings && route.warnings.length > 0 && (
                <ul className="space-y-1.5">
                  {route.warnings.map((warning, idx) => (
                    <li
                      key={idx}
                      className="bg-white/70 border border-amber-200 rounded-xl px-3 py-2 text-[11px] font-mono text-amber-900 flex items-start gap-2"
                    >
                      <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Routed Distance, Fuel & Toll Panel */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 shadow-lg space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <BadgeDollarSign className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-black uppercase tracking-tight font-mono">
                    Routed Distance, Fuel &amp; Tolls
                  </h2>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  {route.origin} ➔ {route.destination} • {route.stops?.length ?? 0} sequential stops
                  {route.intermediateStopsCount > 0 ? ` (${route.intermediateStopsCount} intermediate)` : ""}
                </p>
              </div>

              <div className="text-right font-mono">
                <div className="text-3xl font-black text-sky-400 tracking-tight">{num(route.officialMiles)} mi</div>
                <div className="text-xs text-slate-400 font-bold">
                  {num(route.driveHours, 2)} h driving • {route.routingProfile}
                </div>
              </div>
            </div>

            {/* Fuel & Tolls — the only two figures the provider lets us stand behind */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5 text-sky-400" />
                  <span>Diesel Fuel Cost</span>
                </div>
                <div className="text-2xl font-black text-white">{money(fuel.cost)}</div>
                <div className="text-[10px] text-slate-400">
                  {num(fuel.gallons)} gal @ {money(fuel.dieselPricePerGal)}/gal
                  {fuel.mpgUsed !== undefined && fuel.mpgUsed !== null ? ` • ${num(fuel.mpgUsed, 2)} MPG applied` : ""}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                    <BadgeDollarSign className="w-3.5 h-3.5 text-amber-300" />
                    <span>Commercial Tolls</span>
                  </div>
                  {!tollsComplete && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400/20 text-amber-200 border border-amber-300/40">
                      PARTIAL — NOT A TOTAL
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black text-amber-300">{money(route.totalTolls)}</div>
                <div className="text-[10px] text-slate-300 leading-relaxed">
                  {route.tollNote}
                </div>
                <div className="text-[10px] text-slate-400">
                  {route.tollPlazas?.length ?? 0} priced {route.tollPlazas?.length === 1 ? "facility" : "facilities"}
                  {route.borderCrossing ? ` • ${route.borderCrossing}` : ""}
                </div>
              </div>
            </div>

            {/* Priced Toll Facilities */}
            {route.tollPlazas && route.tollPlazas.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-2">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                  Priced toll facilities
                </div>
                {route.tollPlazas.map((tp, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 text-xs font-mono">
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{tp.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {tp.state} • {tp.axleCategory} • source: {tp.source}
                      </div>
                    </div>
                    <strong className="text-amber-300 shrink-0">{money(tp.cost)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Leaflet Sequential Multi-Stop Route Map */}
          <PcMilerRouteMap route={route} />

          {/* Side-by-Side 3-Profile Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COMPARISON_CARDS.map((card) => {
              const variant = comparison[card.key] || { available: false };
              const isSelected = selectedProfile === card.profile;
              const accent = ACCENTS[card.accent];

              return (
                <div
                  key={card.key}
                  onClick={() => {
                    if (!variant.available) return;
                    setSelectedProfile(card.profile);
                    executeRouteCalculation(origin, destination, stops, card.profile, axleConfiguration);
                  }}
                  className={`p-5 rounded-3xl border transition flex flex-col justify-between ${
                    !variant.available
                      ? "bg-slate-50 border-slate-200 opacity-80 cursor-not-allowed"
                      : isSelected
                      ? `${accent.selected} cursor-pointer`
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-xs cursor-pointer"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono border ${
                          variant.available ? accent.badge : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {card.badge}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {variant.available ? card.tag : "UNAVAILABLE"}
                      </span>
                    </div>

                    {variant.available ? (
                      <div className="text-2xl font-black text-slate-900 font-mono">{num(variant.miles)} mi</div>
                    ) : (
                      <div className="text-sm font-black text-slate-400 font-mono flex items-center gap-1.5 py-1">
                        <Ban className="w-4 h-4" />
                        <span>Not returned</span>
                      </div>
                    )}

                    <p className="text-xs text-slate-500 font-medium">
                      {variant.available
                        ? card.blurb
                        : card.unavailableReason || "The routing provider did not return this variant for this lane."}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-slate-600">
                      <span>Drive Time:</span>
                      <strong className="text-slate-900">
                        {variant.available ? `${num(variant.driveHours, 2)} h` : "—"}
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Routed Miles:</span>
                      <strong className="text-slate-900">
                        {variant.available ? `${num(variant.miles)} mi` : "—"}
                      </strong>
                    </div>
                    {card.key === "shortest" && comparison.milesSavedByShortest !== null && comparison.milesSavedByShortest !== undefined && (
                      <div className="flex justify-between text-slate-600">
                        <span>vs Practical:</span>
                        <strong className="text-indigo-700">
                          {comparison.milesSavedByShortest >= 0 ? "-" : "+"}
                          {num(Math.abs(comparison.milesSavedByShortest))} mi
                        </strong>
                      </div>
                    )}
                    {card.key === "tollFree" && comparison.extraMilesToAvoidTolls !== null && comparison.extraMilesToAvoidTolls !== undefined && (
                      <div className="flex justify-between text-slate-600">
                        <span>vs Practical:</span>
                        <strong className="text-purple-700">
                          {comparison.extraMilesToAvoidTolls >= 0 ? "+" : "-"}
                          {num(Math.abs(comparison.extraMilesToAvoidTolls))} mi
                        </strong>
                      </div>
                    )}

                    {/* A real route the router returned, but not a dispatchable
                        one — the detour around the toll bridge dwarfs the lane. */}
                    {card.key === "tollFree" && comparison.tollFreeIsImpractical && comparison.tollFreeNote && (
                      <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5">
                        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <p className="text-[11px] font-semibold leading-snug text-amber-900">
                          {comparison.tollFreeNote}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vehicle Profile Submitted To The Router */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-sky-600" />
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">
                  Vehicle Profile Submitted To The Router
                </h3>
              </div>

              {restrictions.enforcedByProvider ? (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ENFORCED BY {route.provider}</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black font-mono bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>NOT ENFORCED ON THIS ROUTE</span>
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 font-medium">
              {restrictions.enforcedByProvider
                ? "These dimensions were sent to the routing provider and the returned geometry respects them."
                : "These dimensions were prepared for the truck router but the fallback car profile ignored them. No clearance, weight or length compliance is claimed for this route."}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-mono">
              {[
                { label: "Height", value: routedAgainst.height, unit: "m" },
                { label: "Width", value: routedAgainst.width, unit: "m" },
                { label: "Length", value: routedAgainst.length, unit: "m" },
                { label: "Weight", value: routedAgainst.weight, unit: "t" },
                { label: "Axle Load", value: routedAgainst.axleload, unit: "t" },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <div className="text-[10px] font-bold uppercase text-slate-500">{item.label}</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    {item.value === undefined || item.value === null ? "—" : `${item.value} ${item.unit}`}
                  </div>
                </div>
              ))}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                <div className="text-[10px] font-bold uppercase text-slate-500">Hazmat</div>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  {routedAgainst.hazmat === undefined ? "—" : routedAgainst.hazmat ? "Yes" : "No"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                <div className="text-[10px] font-bold uppercase text-slate-500">Axle Configuration</div>
                <div className="text-xs font-black text-slate-900 mt-1">{restrictions.axleType || "—"}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                <div className="text-[10px] font-bold uppercase text-slate-500">Gross Weight</div>
                <div className="text-xs font-black text-slate-900 mt-1">
                  {restrictions.grossWeightLbs !== undefined && restrictions.grossWeightLbs !== null
                    ? `${Number(restrictions.grossWeightLbs).toLocaleString()} lbs`
                    : "—"}
                  {restrictions.maxAllowedGrossWeight !== undefined && restrictions.maxAllowedGrossWeight !== null
                    ? ` / max ${Number(restrictions.maxAllowedGrossWeight).toLocaleString()} lbs`
                    : ""}
                </div>
              </div>
              <div
                className={`border rounded-xl p-2.5 ${
                  restrictions.isWeightCompliant
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-rose-50 border-rose-200"
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-slate-500">Declared Weight vs Limit</div>
                <div
                  className={`text-xs font-black mt-1 ${
                    restrictions.isWeightCompliant ? "text-emerald-800" : "text-rose-800"
                  }`}
                >
                  {restrictions.isWeightCompliant ? "Within declared axle limit" : "Over declared axle limit"}
                </div>
              </div>
            </div>

            {route.isCrossBorder && route.borderCrossing && (
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 flex items-center gap-2 text-xs font-mono text-purple-900">
                <MapPin className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  <strong className="font-black">Border crossing on route:</strong> {route.borderCrossing}
                </span>
              </div>
            )}
          </div>

          {/* Leg-by-Leg Multi-Stop LTL Breakdown Table */}
          {route.legs && route.legs.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-sky-600" />
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">
                    Sequential Leg-by-Leg Mileage Breakdown
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
                      <th className="py-3 px-3 text-right">Fuel Burn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                    {route.legs.map((leg) => (
                      <tr key={leg.legNumber} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-sky-700">Leg #{leg.legNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {leg.from} ➔ {leg.to}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">{num(leg.distanceMiles)} mi</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">{num(leg.driveHours, 2)} hrs</td>
                        <td className="py-2.5 px-3 text-right text-slate-700">{num(leg.fuelGallons)} gal</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                <span>Calculated {new Date(route.calculatedAt).toLocaleString()} via {route.provider}</span>
              </div>
            </div>
          )}

          {/* Turn-by-Turn Commercial Highway Road Plan */}
          <TurnByTurnRoadPlan route={route} />
        </>
      )}

      {/* Official Driver Trip Sheet & Route Manifest Print Modal */}
      <TripSheetPrintModal
        isOpen={isPrintTripSheetOpen}
        onClose={() => setIsPrintTripSheetOpen(false)}
        route={route}
      />
    </div>
  );
}

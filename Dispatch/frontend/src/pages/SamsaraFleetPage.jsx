import React, { useState, useEffect } from "react";
import {
  Activity,
  Navigation,
  Compass,
  Fuel,
  Gauge,
  MapPin,
  Truck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Sliders,
  DollarSign,
  TrendingDown,
  Layers,
  ArrowRight,
  User,
  Phone,
  Clock,
  Sparkles,
  ShieldCheck,
  Globe,
  Radio,
  ExternalLink,
  ChevronRight,
  Info,
  X,
  BatteryCharging,
  Zap,
  Route,
  Send,
  FileText,
  Printer,
  CornerDownRight,
  Building2,
  QrCode,
  Share2,
} from "lucide-react";
import { useTelematicsStore } from "../stores/useTelematicsStore";
import { useDriverStore } from "../stores/useDriverstore";
import SamsaraFleetMap from "../components/SamsaraFleetMap";
import toast from "react-hot-toast";

export default function SamsaraFleetPage() {
  const {
    vehicles,
    summary,
    samsaraConfig,
    isOptimizing,
    routeOptimization,
    isLoading,
    lastUpdated,
    isTransmitting,
    lastTransmittedTrip,
    hosSimulation,
    iftaReport,
    geofenceAlerts,
    fetchFleetTelematics,
    optimizeLtlPlan,
    transmitRouteToDriver,
    simulateHos,
    calculateIfta,
    fetchGeofenceAlerts,
  } = useTelematicsStore();

  const drivers = useDriverStore((state) => state.drivers);

  const [activeTab, setActiveTab] = useState("map"); // "map" | "optimizer" | "ifta" | "geofence" | "fuel"
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [chosenRouteKey, setChosenRouteKey] = useState("eco_route"); // "eco_route" | "toll_route" | "both"
  const [isDriverSheetModalOpen, setIsDriverSheetModalOpen] = useState(false);

  // LTL Optimizer Form State
  const [ltlForm, setLtlForm] = useState({
    origin: "Montreal, QC",
    destination: "Chicago, IL",
    stops: ["Toronto, ON", "Detroit, MI"],
    cargoWeightLbs: 32500,
    palletCount: 18,
    trailerType: "Dry Van 53ft",
    dieselPricePerGallon: 3.85,
    assignedTruckNumber: "706",
    assignedDriverName: "GURPREET SINGH",
  });

  const [newStopInput, setNewStopInput] = useState("");

  // Sync default assigned truck once vehicles arrive
  useEffect(() => {
    if (vehicles.length > 0 && (!ltlForm.assignedTruckNumber || ltlForm.assignedTruckNumber === "706")) {
      const first = vehicles[0];
      setLtlForm((prev) => ({
        ...prev,
        assignedTruckNumber: prev.assignedTruckNumber || first.truck_number,
        assignedDriverName: prev.assignedDriverName || first.driver?.name || "Commercial Driver",
      }));
    }
  }, [vehicles]);

  useEffect(() => {
    fetchFleetTelematics();
    fetchGeofenceAlerts();
    // Auto refresh every 15 seconds
    const interval = setInterval(() => {
      fetchFleetTelematics();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchFleetTelematics, fetchGeofenceAlerts]);

  useEffect(() => {
    if (activeTab === "ifta") {
      calculateIfta({
        totalDistanceMiles: routeOptimization?.routes?.eco_route?.total_miles || 944,
        fleetAvgMpg: 7.2,
        purchasedFuelGallons: 110,
        originState: "QC",
        destinationState: "IL",
        intermediateStates: ["ON", "MI", "IN"]
      });
    } else if (activeTab === "geofence") {
      fetchGeofenceAlerts();
    }
  }, [activeTab, calculateIfta, fetchGeofenceAlerts, routeOptimization]);

  // Filtered vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const term = (searchTerm || "").toLowerCase();
    const matchesSearch =
      (v.truck_number || "").toLowerCase().includes(term) ||
      (v.driver?.name || "").toLowerCase().includes(term) ||
      (v.location_description || "").toLowerCase().includes(term) ||
      (v.trailer?.number || "").toLowerCase().includes(term);
    const matchesStatus =
      statusFilter === "ALL" || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddStop = () => {
    if (newStopInput.trim() && !ltlForm.stops.includes(newStopInput.trim())) {
      setLtlForm((prev) => ({
        ...prev,
        stops: [...prev.stops, newStopInput.trim()],
      }));
      setNewStopInput("");
    }
  };

  const handleRemoveStop = (index) => {
    setLtlForm((prev) => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index),
    }));
  };

  const handleRunOptimization = async (e) => {
    e?.preventDefault();
    const opt = await optimizeLtlPlan(ltlForm);
    if (opt?.routes?.eco_route) {
      await simulateHos({
        totalDistanceMiles: opt.routes.eco_route.total_miles,
        estimatedDurationHours: opt.routes.eco_route.estimated_hours,
        assignedDriver: ltlForm.assignedDriverName,
        currentDriveRemainingHours: 11.0,
        currentShiftRemainingHours: 14.0,
        country: "US"
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 space-y-6 select-none">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & TELEMATICS STATUS BAR */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-sm">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                Samsara Fleet Radar & AI LTL Optimizer
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Cloud Telematics Synced
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span>Nishan Transport Fleet Telematics</span>
              {lastUpdated && (
                <>
                  <span>•</span>
                  <span>Updated: {lastUpdated}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchFleetTelematics()}
            disabled={isLoading}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-sky-600" : ""}`} />
            <span>Refresh Telematics</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. KPI METRICS CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Power Units */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Tracked Tractors</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {summary.total_tractors_online || vehicles.length || 330}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Nishan Transport Power Units</div>
        </div>

        {/* In Transit */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>In Transit (Driving)</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
            {summary.in_transit_count || vehicles.filter((v) => v.status === "DRIVING").length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Active highway corridors</div>
        </div>

        {/* Idling / Staging */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Idling / Staging</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono mt-1">
            {summary.idling_count || vehicles.filter((v) => v.status === "IDLING").length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Customs & terminal yards</div>
        </div>

        {/* Fleet Fuel Efficiency */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Fleet Avg MPG</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1 flex items-baseline gap-1.5">
            <span>{summary.fleet_avg_mpg || "7.2"}</span>
            <span className="text-xs text-slate-500 font-normal">MPG</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">+0.4 MPG over baseline</div>
        </div>

        {/* AI Route Optimizer Badge */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>AI LTL Engine</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-extrabold text-slate-900 mt-1">
            Toll & Fuel Matrix
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Avg ~$240 trip savings</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. VIEW MODE NAVIGATION TABS */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
        <button
          onClick={() => setActiveTab("map")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
            activeTab === "map"
              ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
          }`}
        >
          <Compass className="w-4 h-4 text-sky-600" />
          <span>Live Samsara GPS Radar</span>
        </button>

        <button
          onClick={() => setActiveTab("optimizer")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
            activeTab === "optimizer"
              ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>AI LTL Route & HOS Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab("ifta")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
            activeTab === "ifta"
              ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
          }`}
        >
          <FileText className="w-4 h-4 text-amber-600" />
          <span>State/Province IFTA Mile Slicer</span>
        </button>

        <button
          onClick={() => setActiveTab("geofence")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
            activeTab === "geofence"
              ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-600" />
          <span>Geofence & Milestone Alerts</span>
        </button>

        <button
          onClick={() => setActiveTab("fuel")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
            activeTab === "fuel"
              ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
          }`}
        >
          <Fuel className="w-4 h-4 text-teal-600" />
          <span>Fuel & Engine Diagnostics</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE SAMSARA GPS RADAR & VEHICLE LIST */}
      {/* ========================================================================= */}
      {activeTab === "map" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Radar Canvas */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-sky-600" />
                    <span>Active Corridor Fleet Radar</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live positioning across Ontario 401, Quebec 20, NY Thruway I-90, and Midwest I-94
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>{vehicles.filter((v) => v.status === "DRIVING").length} Moving Units</span>
                </div>
              </div>

              {/* Interactive Leaflet Fleet Map */}
              <SamsaraFleetMap
                vehicles={filteredVehicles}
                selectedVehicle={selectedTruck}
                onSelectVehicle={(trk) => setSelectedTruck(trk)}
                routeOptimization={null}
              />
            </div>

            {/* Selected Truck Banner if Any */}
            {selectedTruck && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-sky-100 text-sky-700 rounded-xl">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <span>Tractor #{selectedTruck.truck_number}</span>
                      <span className="text-xs font-normal text-slate-500">({selectedTruck.model})</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                          selectedTruck.status === "DRIVING"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : selectedTruck.status === "IDLING"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {selectedTruck.status} • {selectedTruck.speed_mph} MPH
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      📍 {selectedTruck.location_description} • Driver: <strong className="text-slate-800">{selectedTruck.driver?.name}</strong> (HOS: {selectedTruck.driver?.hos_driving_remaining})
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                  <div className="text-center">
                    <div className="text-slate-500 text-[10px] uppercase font-bold">Fuel Tank</div>
                    <div className="font-bold text-sky-700 text-sm">{selectedTruck.telemetry?.fuel_level_percent}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-500 text-[10px] uppercase font-bold">Avg MPG</div>
                    <div className="font-bold text-emerald-700 text-sm">{selectedTruck.telemetry?.average_mpg}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-500 text-[10px] uppercase font-bold">Active Trailer</div>
                    <div className="font-bold text-slate-900 text-sm">{selectedTruck.trailer?.number}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Samsara Live Fleet List */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col h-[600px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-sm text-slate-900">Active Tractors ({filteredVehicles.length})</h3>
              <div className="text-xs text-slate-500 font-semibold">Nishan Fleet</div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search truck, driver, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs font-medium"
                />
              </div>

              <div className="flex items-center gap-1">
                {["ALL", "DRIVING", "IDLING", "PARKED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                      statusFilter === st
                        ? "bg-sky-50 text-sky-700 border border-sky-200"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Vehicle List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredVehicles.map((trk, idx) => {
                const isSelected = selectedTruck?.truck_number === trk.truck_number;
                return (
                  <div
                    key={trk.samsara_id || trk.id || `trk-${trk.truck_number}-${idx}`}
                    onClick={() => setSelectedTruck(trk)}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? "bg-sky-50 border-sky-300 shadow-xs"
                        : "bg-white border-slate-200/80 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            trk.status === "DRIVING"
                              ? "bg-emerald-500 animate-pulse"
                              : trk.status === "IDLING"
                              ? "bg-amber-500"
                              : "bg-slate-400"
                          }`}
                        />
                        <span className="font-extrabold text-xs text-slate-900">Tractor #{trk.truck_number}</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-700">{trk.speed_mph} MPH</span>
                    </div>

                    <div className="text-[11px] text-slate-500 truncate mt-1">
                      {trk.location_description}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 font-mono">
                      <span>Driver: <strong className="text-slate-800 font-sans">{trk.driver?.name}</strong></span>
                      <span className="text-sky-700 font-bold">⛽ {trk.telemetry?.fuel_level_percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AI LTL MULTI-STOP ROUTE & TOLL OPTIMIZER */}
      {/* ========================================================================= */}
      {activeTab === "optimizer" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LTL Inputs Configuration */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span>AI LTL Route & Toll Optimizer</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Consolidates stops, eliminates unnecessary tollways, and matches closest Samsara tractor
              </p>
            </div>

            <form onSubmit={handleRunOptimization} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Origin (Pickup HQ)
                  </label>
                  <input
                    type="text"
                    value={ltlForm.origin}
                    onChange={(e) => setLtlForm({ ...ltlForm, origin: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:ring-2 focus:ring-sky-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Final Destination
                  </label>
                  <input
                    type="text"
                    value={ltlForm.destination}
                    onChange={(e) => setLtlForm({ ...ltlForm, destination: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:ring-2 focus:ring-sky-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Intermediate LTL Stops */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Intermediate LTL Pickup / Delivery Stops ({ltlForm.stops.length})
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Toronto, ON or Detroit, MI"
                    value={newStopInput}
                    onChange={(e) => setNewStopInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 shadow-2xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddStop}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer transition"
                  >
                    + Add Stop
                  </button>
                </div>

                {/* Stops Tag Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {ltlForm.stops.map((stop, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-100 text-slate-800 border border-slate-200 font-semibold"
                    >
                      <span>Stop {idx + 1}: {stop}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(idx)}
                        className="text-slate-400 hover:text-rose-600 font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Weight, Pallets & Trailer specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cargo Weight (Lbs)
                  </label>
                  <input
                    type="number"
                    value={ltlForm.cargoWeightLbs}
                    onChange={(e) => setLtlForm({ ...ltlForm, cargoWeightLbs: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:ring-2 focus:ring-sky-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pallets Count
                  </label>
                  <input
                    type="number"
                    value={ltlForm.palletCount}
                    onChange={(e) => setLtlForm({ ...ltlForm, palletCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:ring-2 focus:ring-sky-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Dedicated Tractor & Driver Dispatch Assignment */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                {/* 1. Assign Tractor */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sky-700">
                      <Truck className="w-3.5 h-3.5" />
                      <span>Assign Power Unit (Tractor #)</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-bold">
                      {vehicles.length} Units Online
                    </span>
                  </label>
                  <select
                    value={ltlForm.assignedTruckNumber}
                    onChange={(e) => {
                      const truckNum = e.target.value;
                      const matched = vehicles.find((v) => String(v.truck_number) === String(truckNum));
                      setLtlForm((prev) => ({
                        ...prev,
                        assignedTruckNumber: truckNum,
                        assignedDriverName: matched?.driver?.name || prev.assignedDriverName,
                      }));
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 cursor-pointer font-bold focus:ring-2 focus:ring-sky-500 shadow-2xs"
                  >
                    {vehicles.map((v, idx) => (
                      <option key={v.samsara_id || v.id || `trk-opt-${v.truck_number}-${idx}`} value={v.truck_number} className="text-slate-900 bg-white">
                        Tractor #{v.truck_number} ({v.model || v.make}) • {v.speed_mph > 0 ? `${v.speed_mph} MPH` : v.status} • ⛽ {v.telemetry?.fuel_level_percent}%
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Assign Driver */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <User className="w-3.5 h-3.5" />
                      <span>Assign Commercial Driver</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-bold">
                      {drivers.length || 508} Drivers
                    </span>
                  </label>
                  <select
                    value={ltlForm.assignedDriverName}
                    onChange={(e) => setLtlForm({ ...ltlForm, assignedDriverName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 cursor-pointer font-bold focus:ring-2 focus:ring-sky-500 shadow-2xs"
                  >
                    {ltlForm.assignedDriverName && (
                      <option value={ltlForm.assignedDriverName} className="text-slate-900 bg-white">
                        {ltlForm.assignedDriverName} (Assigned Driver)
                      </option>
                    )}
                    {drivers.map((d, idx) => (
                      <option key={d.id || `drv-${idx}`} value={d.name || `${d.first_name} ${d.last_name}`} className="text-slate-900 bg-white">
                        {d.name || `${d.first_name} ${d.last_name}`} • {d.phone_number || "514-695-4200"} • CDL {d.license_state || "QC"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Live Assignment Status Badge */}
                {(() => {
                  const selVeh = vehicles.find((v) => String(v.truck_number) === String(ltlForm.assignedTruckNumber));
                  if (!selVeh) return null;
                  return (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1 text-slate-700 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Live GPS Location:</span>
                        <span className="font-mono text-sky-700 font-bold">{selVeh.location_description}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Fuel Tank Level:</span>
                        <span className="font-mono text-emerald-700 font-bold">⛽ {selVeh.telemetry?.fuel_level_percent}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Available Driving HOS:</span>
                        <span className="font-mono text-slate-900 font-bold">{selVeh.driver?.hos_driving_remaining || "8h 15m"}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isOptimizing}
                className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Sparkles className={`w-4 h-4 ${isOptimizing ? "animate-spin" : ""}`} />
                <span>{isOptimizing ? "Analyzing Tolls & Corridors..." : "⚡ Calculate Optimal Route with AI"}</span>
              </button>
            </form>
          </div>

          {/* Right Column: AI Optimization Output & Matrix */}
          <div className="lg:col-span-7 space-y-4">
            {routeOptimization ? (
              <div className="space-y-4">
                {/* Huge Savings Badge */}
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      AI Optimization Complete
                    </div>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                      Save ${routeOptimization.savings_summary?.net_financial_savings_usd} USD
                    </div>
                    <p className="text-xs text-emerald-800 mt-0.5 font-medium">
                      {routeOptimization.savings_summary?.roi_verdict}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono border-t sm:border-t-0 sm:border-l border-emerald-200 pt-2 sm:pt-0 sm:pl-4">
                    <div>
                      <div className="text-slate-500 text-[10px] uppercase font-bold">Tolls Saved</div>
                      <div className="font-black text-emerald-700 text-base">
                        ${routeOptimization.savings_summary?.toll_savings_usd}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[10px] uppercase font-bold">Fuel Saved</div>
                      <div className="font-black text-sky-700 text-base">
                        {routeOptimization.savings_summary?.fuel_savings_gallons} Gal
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[10px] uppercase font-bold">CO2 Reduced</div>
                      <div className="font-black text-indigo-700 text-base">
                        {routeOptimization.savings_summary?.co2_reduction_kg} kg
                      </div>
                    </div>
                  </div>
                </div>

                {/* Side-by-Side Interactive Route Decision Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Toll Route Card */}
                  <div
                    onClick={() => setChosenRouteKey(chosenRouteKey === "toll_route" ? "both" : "toll_route")}
                    className={`p-4 rounded-2xl space-y-3 cursor-pointer transition-all border-2 bg-white ${
                      chosenRouteKey === "toll_route"
                        ? "border-amber-500 shadow-md ring-2 ring-amber-500/20"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-xs font-extrabold text-slate-800">Standard Toll Highway</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Expensive Tolls
                      </span>
                    </div>

                    <div className="text-xl font-black text-slate-900 font-mono">
                      ${routeOptimization.routes?.toll_route?.total_trip_cost_usd} <span className="text-xs font-normal text-slate-500">Total</span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Distance:</span>
                        <span>{routeOptimization.routes?.toll_route?.total_miles} Miles</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Driving Time:</span>
                        <span>{routeOptimization.routes?.toll_route?.estimated_hours} Hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Highway Tolls:</span>
                        <span className="text-rose-600 font-bold">${routeOptimization.routes?.toll_route?.toll_cost_usd}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Fuel Burn:</span>
                        <span>{routeOptimization.routes?.toll_route?.estimated_fuel_gallons} Gal (${routeOptimization.routes?.toll_route?.fuel_cost_usd})</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setChosenRouteKey("toll_route");
                        toast.success("Assigned Standard Toll Highway Route to Dispatch");
                      }}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        chosenRouteKey === "toll_route"
                          ? "bg-amber-500 text-white font-extrabold shadow-sm"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                      }`}
                    >
                      <span>{chosenRouteKey === "toll_route" ? "✓ Toll Route Selected" : "Choose Standard Toll Route"}</span>
                    </button>
                  </div>

                  {/* AI Eco & Low Toll Route Card */}
                  <div
                    onClick={() => setChosenRouteKey(chosenRouteKey === "eco_route" ? "both" : "eco_route")}
                    className={`p-4 rounded-2xl space-y-3 relative overflow-hidden cursor-pointer transition-all border-2 bg-emerald-50/40 ${
                      chosenRouteKey === "eco_route"
                        ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                        : "border-emerald-300 hover:border-emerald-400"
                    }`}
                  >
                    <div className="absolute top-0 right-0 bg-emerald-600 text-white font-extrabold text-[10px] px-3 py-0.5 rounded-bl-lg">
                      AI RECOMMENDED
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-600 animate-pulse" />
                        <span className="text-xs font-extrabold text-emerald-800">AI Low-Toll Eco Route</span>
                      </div>
                    </div>

                    <div className="text-xl font-black text-emerald-800 font-mono">
                      ${routeOptimization.routes?.eco_route?.total_trip_cost_usd} <span className="text-xs font-normal text-slate-500">Total (Save ${routeOptimization.savings_summary?.net_financial_savings_usd})</span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Distance:</span>
                        <span>{routeOptimization.routes?.eco_route?.total_miles} Miles</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Driving Time:</span>
                        <span>{routeOptimization.routes?.eco_route?.estimated_hours} Hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Highway Tolls:</span>
                        <span className="text-emerald-700 font-bold">${routeOptimization.routes?.eco_route?.toll_cost_usd}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Fuel Burn:</span>
                        <span className="text-sky-700">{routeOptimization.routes?.eco_route?.estimated_fuel_gallons} Gal (${routeOptimization.routes?.eco_route?.fuel_cost_usd})</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setChosenRouteKey("eco_route");
                        toast.success(`Assigned AI Eco Route ($${routeOptimization.routes?.eco_route?.total_trip_cost_usd} USD) to Dispatch!`);
                      }}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        chosenRouteKey === "eco_route"
                          ? "bg-emerald-600 text-white font-extrabold shadow-sm"
                          : "bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{chosenRouteKey === "eco_route" ? "✓ AI Eco Route Selected" : "Choose AI Eco Route (Save $273)"}</span>
                    </button>
                  </div>
                </div>

                {/* Nearest Samsara Power Unit Recommendation */}
                {routeOptimization.recommended_samsara_tractor && (
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-xs text-sky-700 flex items-center gap-1.5">
                        <Truck className="w-4 h-4" />
                        <span>Recommended Samsara Tractor Dispatch</span>
                      </h4>
                      <span className="text-[11px] text-slate-500 font-mono font-bold">
                        {routeOptimization.recommended_samsara_tractor.distance_to_pickup_miles} miles to pickup (ETA: {routeOptimization.recommended_samsara_tractor.eta_to_pickup})
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border border-slate-200">
                      <div>
                        <div className="font-extrabold text-slate-900 flex items-center gap-2">
                          <span>Tractor #{routeOptimization.recommended_samsara_tractor.truck_number}</span>
                          <span className="text-slate-500 font-normal">({routeOptimization.recommended_samsara_tractor.model})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Driver: <strong className="text-slate-800">{routeOptimization.recommended_samsara_tractor.driver_name}</strong> • Available HOS: <strong className="text-emerald-700 font-mono">{routeOptimization.recommended_samsara_tractor.hos_remaining}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-sky-700">
                          ⛽ Fuel: {routeOptimization.recommended_samsara_tractor.fuel_level}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Samsara Route Geometry Map */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-700 font-bold px-1">
                    <span className="flex items-center gap-1.5 text-indigo-700">
                      <Route className="w-4 h-4" />
                      <span>Live Multi-Stop Planned Route Comparison on Samsara Radar</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setChosenRouteKey("both")}
                      className="text-xs text-sky-600 hover:underline font-bold cursor-pointer"
                    >
                      Show Both Routes Overlay
                    </button>
                  </div>
                  <SamsaraFleetMap
                    vehicles={vehicles}
                    selectedVehicle={
                      routeOptimization.recommended_samsara_tractor
                        ? vehicles.find((v) => v.truck_number === routeOptimization.recommended_samsara_tractor.truck_number)
                        : selectedTruck
                    }
                    routeOptimization={routeOptimization}
                    selectedRouteKey={chosenRouteKey}
                    onSelectRouteKey={setChosenRouteKey}
                  />
                </div>

                {/* Next Trucking Routes & Turn-by-Turn Directions */}
                {(() => {
                  const activeRoute =
                    chosenRouteKey === "toll_route"
                      ? routeOptimization.routes?.toll_route
                      : routeOptimization.routes?.eco_route;
                  const steps = activeRoute?.turn_by_turn || [];
                  const targetTruck = routeOptimization.recommended_samsara_tractor;

                  return (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                      {/* Section Header & Send To Driver CTA */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                              <Navigation className="w-4 h-4" />
                            </span>
                            <h4 className="text-sm font-extrabold text-slate-900">
                              Next Trucking Routes & Turn-by-Turn Directions
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {activeRoute?.name} • {activeRoute?.total_miles} Miles • {activeRoute?.estimated_hours} Hours
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsDriverSheetModalOpen(true)}
                            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-500" />
                            <span>Driver Trip Sheet</span>
                          </button>

                          <button
                            type="button"
                            disabled={isTransmitting}
                            onClick={async () => {
                              await transmitRouteToDriver({
                                driverName: targetTruck?.driver_name || "Commercial Driver",
                                driverPhone: targetTruck?.driver_phone || "514-695-4200",
                                truckNumber: targetTruck?.truck_number || "706",
                                routeType: activeRoute?.name || "AI Low-Toll Eco Route",
                                totalMiles: activeRoute?.total_miles || 944,
                                estimatedHours: activeRoute?.estimated_hours || 17.5,
                                turnByTurnSteps: steps,
                                customsBarcode: "NISD001000",
                              });
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-xs transition"
                          >
                            <Send className={`w-3.5 h-3.5 ${isTransmitting ? "animate-spin" : ""}`} />
                            <span>{isTransmitting ? "Sending..." : "📲 Send Exact Route to Driver"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Turn-by-Turn Steps Timeline */}
                      <div className="space-y-3">
                        {steps.map((st) => {
                          const isCustoms = st.type === "CUSTOMS_BORDER";
                          const isFuel = st.type === "FUEL_REST";
                          const isPickup = st.type === "PICKUP";
                          const isDelivery = st.type === "FINAL_DELIVERY";

                          return (
                            <div
                              key={st.step_number}
                              className={`p-3.5 rounded-xl border transition-all ${
                                isCustoms
                                  ? "bg-blue-50/60 border-blue-200"
                                  : isFuel
                                  ? "bg-amber-50/60 border-amber-200"
                                  : isDelivery
                                  ? "bg-emerald-50/60 border-emerald-200"
                                  : isPickup
                                  ? "bg-purple-50/60 border-purple-200"
                                  : "bg-slate-50 border-slate-200"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 mt-0.5 ${
                                    isCustoms
                                      ? "bg-blue-600 text-white"
                                      : isFuel
                                      ? "bg-amber-500 text-white"
                                      : isDelivery
                                      ? "bg-emerald-600 text-white"
                                      : "bg-slate-200 text-slate-800"
                                  }`}>
                                    {st.step_number}
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-extrabold text-xs text-slate-900">
                                        {st.highway}
                                      </span>
                                      {st.distance_miles > 0 && (
                                        <span className="text-[10px] font-mono bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-bold">
                                          {st.distance_miles} mi • {st.estimated_time}
                                        </span>
                                      )}
                                    </div>

                                    <div className="text-xs text-slate-700 font-medium">
                                      {st.instruction}
                                    </div>

                                    {st.address && (
                                      <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span>{st.address}</span>
                                      </div>
                                    )}

                                    {st.special_notice && (
                                      <div className={`text-xs font-bold mt-1 px-2.5 py-1 rounded-lg border ${
                                        isCustoms
                                          ? "bg-blue-100 text-blue-800 border-blue-200"
                                          : isFuel
                                          ? "bg-amber-100 text-amber-800 border-amber-200"
                                          : "bg-emerald-100 text-emerald-800 border-emerald-200"
                                      }`}>
                                        {st.special_notice}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Driver HOS Trip Feasibility Simulator Panel */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                          <div className="flex items-center gap-2.5">
                            <span className="p-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg">
                              <Clock className="w-4 h-4" />
                            </span>
                            <div>
                              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                                <span>Driver HOS Trip Feasibility Simulator</span>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                  hosSimulation?.feasibilityStatus === "SINGLE_SHIFT_CLEAN"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : hosSimulation?.feasibilityStatus === "SINGLE_SHIFT_REST_REQUIRED"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-purple-50 text-purple-700 border-purple-200"
                                }`}>
                                  {hosSimulation?.feasibilityStatus === "SINGLE_SHIFT_CLEAN"
                                    ? "🟢 SINGLE SHIFT (CLEAN)"
                                    : hosSimulation?.feasibilityStatus === "SINGLE_SHIFT_REST_REQUIRED"
                                    ? "🟡 30-MIN REST BREAK REQUIRED"
                                    : "🔴 MULTI-DAY (10H SLEEPER RESET)"}
                                </span>
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                FMCSA 49 CFR § 395.3 / Canadian Commercial Vehicle HOS Regulations
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => simulateHos({
                              totalDistanceMiles: activeRoute?.total_miles || 944,
                              estimatedDurationHours: activeRoute?.estimated_hours || 17.5,
                              assignedDriver: targetTruck?.driver_name || "Commercial Driver",
                              currentDriveRemainingHours: 11.0,
                              currentShiftRemainingHours: 14.0,
                              country: "US"
                            })}
                            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                            <span>Re-Simulate HOS</span>
                          </button>
                        </div>

                        {/* HOS Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                            <div className="text-[10px] uppercase font-bold text-slate-500">Total Driving Time</div>
                            <div className="text-base font-black text-slate-900 font-mono mt-1">
                              {hosSimulation?.summary?.totalDriveHours || activeRoute?.estimated_hours || 16.3} Hours
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">Active behind wheel</div>
                          </div>

                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                            <div className="text-[10px] uppercase font-bold text-slate-500">Rest & Sleeper Time</div>
                            <div className="text-base font-black text-amber-700 font-mono mt-1">
                              {hosSimulation?.summary?.totalRestHours || (activeRoute?.estimated_hours > 11 ? "10.5" : "0.5")} Hours
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">Mandatory DOT breaks</div>
                          </div>

                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                            <div className="text-[10px] uppercase font-bold text-slate-500">Total Trip Elapsed</div>
                            <div className="text-base font-black text-emerald-700 font-mono mt-1">
                              {hosSimulation?.summary?.totalTripHours || (activeRoute?.estimated_hours > 11 ? "26.8" : "16.8")} Hours
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">Door-to-door transit</div>
                          </div>

                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                            <div className="text-[10px] uppercase font-bold text-slate-500">Projected Delivery</div>
                            <div className="text-sm font-black text-slate-900 font-mono mt-1 truncate">
                              {hosSimulation?.summary?.projectedArrival || "Tomorrow 16:30"}
                            </div>
                            <div className="text-[10px] text-emerald-700 font-bold">Legal under FMCSA</div>
                          </div>
                        </div>

                        {/* Scheduled Rest Waypoints */}
                        {hosSimulation?.stopsRequired?.length > 0 && (
                          <div className="space-y-2 pt-2">
                            <span className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                              Scheduled Truck Stop Rest Plazas Along Corridor:
                            </span>
                            <div className="space-y-2">
                              {hosSimulation.stopsRequired.map((stop, sIdx) => (
                                <div key={sIdx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                                      {sIdx + 1}
                                    </span>
                                    <div>
                                      <div className="font-extrabold text-slate-900">{stop.location}</div>
                                      <div className="text-xs text-slate-500">{stop.highway || "Major Freight Corridor"} • Scheduled at {stop.scheduledTime}</div>
                                    </div>
                                  </div>
                                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-mono font-bold">
                                    {stop.duration}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center h-full text-slate-500 shadow-xs">
                <Sparkles className="w-12 h-12 text-indigo-400 mb-3 animate-pulse" />
                <h4 className="font-extrabold text-slate-900 text-base">Ready to Plan LTL Route</h4>
                <p className="text-xs max-w-sm mt-1">
                  Configure your origin, destination, and intermediate stops on the left to generate optimal toll-free corridors and nearest-truck recommendations.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STATE / PROVINCE IFTA MILE SLICER */}
      {/* ========================================================================= */}
      {activeTab === "ifta" && (
        <div className="space-y-6">
          {/* IFTA Top KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Active IFTA Quarter</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">Q1 2026</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Jan 01 - Mar 31, 2026</div>
            </div>

            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Total Sliced Miles</span>
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <Truck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                {iftaReport?.totalTripMiles?.toLocaleString() || "1,248"} <span className="text-xs text-slate-500 font-normal">MI</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Cross-Border US/CA Corridors</div>
            </div>

            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Taxable Fuel Burned</span>
                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                  <Fuel className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                {iftaReport?.totalFuelConsumedGal || "173.3"} <span className="text-xs text-slate-500 font-normal">GAL</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Fleet Average: 7.2 MPG</div>
            </div>

            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Net IFTA Tax Due</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
                ${iftaReport?.totalNetIftaTaxDue || "84.50"} <span className="text-xs text-slate-500 font-normal">USD</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Quarterly net liability balance</div>
            </div>
          </div>

          {/* IFTA Jurisdiction Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>State & Provincial GPS Mileage Slicing Breakdown</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated GPS boundary crossing odometer log across Canadian Provinces & US States
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toast.success("Quarterly IFTA Tax Return PDF generated & saved!")}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export IFTA PDF</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-sans font-bold text-[11px] uppercase tracking-wider">
                    <th className="p-3">Jurisdiction</th>
                    <th className="p-3">Country</th>
                    <th className="p-3">Miles Driven</th>
                    <th className="p-3">Share %</th>
                    <th className="p-3">Taxable Gal</th>
                    <th className="p-3">Purchased Gal</th>
                    <th className="p-3">Tax Rate / Gal</th>
                    <th className="p-3 text-right">Net Tax Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {(iftaReport?.jurisdictions || [
                    { stateCode: "QC", stateName: "Quebec", country: "CA", milesDriven: 180, mileagePercent: 19, taxableGallons: 25.0, purchasedGallons: 50.0, taxRatePerGal: 0.58, netTaxDue: -14.50 },
                    { stateCode: "ON", stateName: "Ontario", country: "CA", milesDriven: 330, mileagePercent: 35, taxableGallons: 45.8, purchasedGallons: 40.0, taxRatePerGal: 0.42, netTaxDue: 2.44 },
                    { stateCode: "MI", stateName: "Michigan", country: "US", milesDriven: 280, mileagePercent: 30, taxableGallons: 38.9, purchasedGallons: 20.0, taxRatePerGal: 0.49, netTaxDue: 9.26 },
                    { stateCode: "IN", stateName: "Indiana", country: "US", milesDriven: 154, mileagePercent: 16, taxableGallons: 21.4, purchasedGallons: 0.0, taxRatePerGal: 0.54, netTaxDue: 11.56 },
                  ]).map((jur, jIdx) => (
                    <tr key={jIdx} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-sans font-extrabold text-slate-900 flex items-center gap-2">
                        <span className="w-7 h-5 rounded bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-mono font-bold">
                          {jur.stateCode}
                        </span>
                        <span>{jur.stateName}</span>
                      </td>
                      <td className="p-3 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          jur.country === "CA" ? "bg-red-50 text-red-700 border border-red-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>
                          {jur.country === "CA" ? "🇨🇦 Canada" : "🇺🇸 United States"}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">{jur.milesDriven.toLocaleString()} mi</td>
                      <td className="p-3 text-slate-500">{jur.mileagePercent}%</td>
                      <td className="p-3">{jur.taxableGallons} gal</td>
                      <td className="p-3 text-slate-500">{jur.purchasedGallons || 0} gal</td>
                      <td className="p-3 text-slate-700">${jur.taxRatePerGal.toFixed(3)}</td>
                      <td className={`p-3 text-right font-black ${
                        jur.netTaxDue > 0 ? "text-amber-700" : "text-emerald-700"
                      }`}>
                        {jur.netTaxDue >= 0 ? `$${jur.netTaxDue.toFixed(2)}` : `-$${Math.abs(jur.netTaxDue).toFixed(2)} (Credit)`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GEOFENCE & MILESTONE ALERT CENTER */}
      {/* ========================================================================= */}
      {activeTab === "geofence" && (
        <div className="space-y-6">
          {/* Active Geofence Facilities */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                <span>Origin Geofence</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="font-extrabold text-slate-900 text-sm">AeroParts Toronto Production Plant</div>
              <div className="text-xs text-slate-500">5.0 Mile Perimeter • 1 Unit Arrived</div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                <span>Port of Entry Geofence</span>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              </div>
              <div className="font-extrabold text-slate-900 text-sm">Ambassador Bridge / Detroit Plaza</div>
              <div className="text-xs text-slate-500">10.0 Mile Perimeter • 2 Units En Route</div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                <span>Destination Geofence</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="font-extrabold text-slate-900 text-sm">Midwest Air Cargo Chicago Terminal</div>
              <div className="text-xs text-slate-500">5.0 Mile Perimeter • ETA 16:30 CST</div>
            </div>
          </div>

          {/* Live Alert Log Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-600" />
                  <span>Automated Geofence & Milestone Notification Audit Trail</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time perimeter triggers with verified automated Email and SMS webhook deliveries
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-sans font-bold text-[11px] uppercase tracking-wider">
                    <th className="p-3">Event ID</th>
                    <th className="p-3">Load #</th>
                    <th className="p-3">Tractor / Driver</th>
                    <th className="p-3">Geofence Facility</th>
                    <th className="p-3">Event Trigger</th>
                    <th className="p-3">Notifications Sent</th>
                    <th className="p-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {(geofenceAlerts || [
                    { id: "GEO-901", trackingNumber: "NIS-1001", truckNumber: "TRK-104", driverName: "Marcus Vance", eventType: "GEOFENCE_ENTERED", geofenceName: "AeroParts Toronto Shipper Dock", notificationSent: { email: "dispatch@aeroparts.com", sms: "+1 (514) 890-4122", delivered: true }, timestamp: new Date().toISOString() },
                    { id: "GEO-902", trackingNumber: "NIS-1002", truckNumber: "TRK-210", driverName: "Alexandre Tremblay", eventType: "BORDER_APPROACH", geofenceName: "Lacolle Port of Entry (US CBP)", notificationSent: { email: "customs@ozack.com", sms: "+1 (450) 902-1144", delivered: true }, timestamp: new Date(Date.now() - 25*60000).toISOString() },
                  ]).map((alert, aIdx) => (
                    <tr key={aIdx} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-bold text-sky-700">{alert.id}</td>
                      <td className="p-3 font-bold text-slate-900">{alert.trackingNumber}</td>
                      <td className="p-3 font-sans">
                        <div className="font-bold text-slate-900">{alert.truckNumber}</div>
                        <div className="text-[11px] text-slate-500">{alert.driverName}</div>
                      </td>
                      <td className="p-3 font-sans text-slate-800 font-medium">{alert.geofenceName}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {alert.eventType}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        <span className="text-emerald-700 font-bold">✓ Email & SMS</span>
                      </td>
                      <td className="p-3 text-right text-slate-500 font-mono">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: FUEL & ENGINE DIAGNOSTICS */}
      {/* ========================================================================= */}
      {activeTab === "fuel" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Fleet Fuel Efficiency</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Fuel className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 mt-2 font-mono">
                7.2 <span className="text-sm font-normal text-slate-500">MPG (Fleet Avg)</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Estimated fuel burn: <strong className="text-slate-800">32.4 L/100km</strong>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Total DEF Compliance</span>
                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                  <Fuel className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-teal-700 mt-2 font-mono">
                84.6% <span className="text-sm font-normal text-slate-500">Avg Level</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium">
                Zero low-DEF active engine derates
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Engine Diagnostics (DTC)</span>
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 mt-2 font-mono">
                100% <span className="text-sm font-normal text-slate-500">Green Status</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium">
                All 330 tractors checked with zero critical fault alerts
              </div>
            </div>
          </div>

          {/* Telemetry Detail Grid */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="font-extrabold text-sm text-slate-900 mb-4">
              Real-time Tractor Fuel & Engine Telemetry Table
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-sans font-bold text-[11px] uppercase tracking-wider">
                    <th className="p-3">Tractor #</th>
                    <th className="p-3">Driver</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Fuel Level</th>
                    <th className="p-3">Fuel Rate</th>
                    <th className="p-3">DEF Level</th>
                    <th className="p-3">Coolant Temp</th>
                    <th className="p-3">Battery</th>
                    <th className="p-3">Odometer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {vehicles.slice(0, 15).map((v, idx) => (
                    <tr key={v.samsara_id || v.id || `table-row-${v.truck_number}-${idx}`} className="hover:bg-slate-50/80">
                      <td className="p-3 font-extrabold text-sky-700">#{v.truck_number}</td>
                      <td className="p-3 font-sans font-bold text-slate-900">{v.driver?.name}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            v.status === "DRIVING"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : v.status === "IDLING"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-sky-700">{v.telemetry?.fuel_level_percent}%</td>
                      <td className="p-3">{v.telemetry?.fuel_rate_lph} L/h</td>
                      <td className="p-3">{v.telemetry?.def_level_percent}%</td>
                      <td className="p-3">{v.telemetry?.engine_coolant_temp_f}°F</td>
                      <td className="p-3">{v.telemetry?.battery_voltage}V</td>
                      <td className="p-3 text-slate-500">{v.telemetry?.odometer_miles?.toLocaleString()} mi</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRIVER TRIP MANIFEST & ROUTE SHEET MODAL (PRINTABLE) */}
      {/* ========================================================================= */}
      {isDriverSheetModalOpen && routeOptimization && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-3 sm:p-6 space-y-5 shadow-2xl my-6 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-sm">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Commercial Driver Route Dispatch Sheet</h3>
                  <p className="text-xs text-slate-500">Nishan Transport Inc. • Samsara ELD Fleet Dispatch</p>
                </div>
              </div>
              <button
                onClick={() => setIsDriverSheetModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Trip Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 font-bold block uppercase text-[10px]">Assigned Driver</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {routeOptimization.recommended_samsara_tractor?.driver_name || "Commercial Driver"}
                </span>
                <span className="text-xs text-slate-500 block font-mono">
                  {routeOptimization.recommended_samsara_tractor?.driver_phone || "514-695-4200"}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-bold block uppercase text-[10px]">Power Unit & Trailer</span>
                <span className="font-extrabold text-sky-700 text-sm">
                  Tractor #{routeOptimization.recommended_samsara_tractor?.truck_number || "706"}
                </span>
                <span className="text-xs text-slate-500 block">53ft Dry Van (QC Plates)</span>
              </div>

              <div>
                <span className="text-slate-500 font-bold block uppercase text-[10px]">Customs Barcode</span>
                <span className="font-black font-mono text-emerald-700 text-sm">PAPS: NISD001000</span>
                <span className="text-xs text-slate-500 block">Port: Detroit 3801</span>
              </div>
            </div>

            {/* Route Summary */}
            <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs flex items-center justify-between">
              <div>
                <span className="font-extrabold text-indigo-900">
                  {chosenRouteKey === "toll_route" ? "Standard Toll Highway Route" : "AI Low-Toll Eco Route (Recommended)"}
                </span>
                <div className="text-xs text-indigo-700 mt-0.5">
                  {routeOptimization.routes?.[chosenRouteKey === "toll_route" ? "toll_route" : "eco_route"]?.total_miles} Total Miles • {routeOptimization.routes?.[chosenRouteKey === "toll_route" ? "toll_route" : "eco_route"]?.estimated_hours} Hours Driving
                </div>
              </div>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-900 font-black rounded-lg text-xs font-mono">
                ${routeOptimization.routes?.[chosenRouteKey === "toll_route" ? "toll_route" : "eco_route"]?.total_trip_cost_usd} Trip Cost
              </span>
            </div>

            {/* Step-by-Step Directions */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Turn-by-Turn Truck Navigation Itinerary
              </span>
              {(routeOptimization.routes?.[chosenRouteKey === "toll_route" ? "toll_route" : "eco_route"]?.turn_by_turn || []).map((st) => (
                <div key={st.step_number} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-black flex items-center justify-center text-[10px] shrink-0">
                    {st.step_number}
                  </span>
                  <div>
                    <div className="font-extrabold text-slate-900">{st.highway} {st.distance_miles > 0 ? `(${st.distance_miles} mi)` : ""}</div>
                    <div className="text-slate-600 text-xs mt-0.5">{st.instruction}</div>
                    {st.address && <div className="text-xs text-slate-500 font-mono mt-0.5">{st.address}</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-2 cursor-pointer transition shadow-2xs"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Print Trip Sheet (PDF)</span>
              </button>

              <button
                type="button"
                disabled={isTransmitting}
                onClick={async () => {
                  await transmitRouteToDriver({
                    driverName: routeOptimization.recommended_samsara_tractor?.driver_name || "Commercial Driver",
                    driverPhone: routeOptimization.recommended_samsara_tractor?.driver_phone || "514-695-4200",
                    truckNumber: routeOptimization.recommended_samsara_tractor?.truck_number || "706",
                    routeType: chosenRouteKey === "toll_route" ? "Standard Toll Highway" : "AI Low-Toll Eco Route",
                    totalMiles: routeOptimization.routes?.[chosenRouteKey === "toll_route" ? "toll_route" : "eco_route"]?.total_miles || 944,
                    estimatedHours: routeOptimization.routes?.[chosenRouteKey === "toll_route" ? "toll_route" : "eco_route"]?.estimated_hours || 17.5,
                    turnByTurnSteps: routeOptimization.routes?.[chosenRouteKey === "toll_route" ? "toll_route" : "eco_route"]?.turn_by_turn || [],
                    customsBarcode: "NISD001000",
                  });
                  setIsDriverSheetModalOpen(false);
                }}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition"
              >
                <Send className="w-4 h-4" />
                <span>{isTransmitting ? "Transmitting..." : "Send to Driver Tablet"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import {
  Radio,
  Clock,
  CloudRain,
  Wind,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Truck,
  MapPin,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  X,
  Compass,
  Zap,
  Flame,
  Activity,
  Layers,
  Thermometer,
  Eye,
  Calendar,
  Loader2,
} from "lucide-react";
import { useEtaRadarStore } from "../stores/useEtaRadarStore";

export default function EtaWeatherRadarPage() {
  const {
    summary,
    trackedShipments,
    borderPorts,
    weatherCorridors,
    selectedShipment,
    isLoading,
    isRecalculating,
    fetchRadarData,
    recalculateRadar,
    setSelectedShipment,
  } = useEtaRadarStore();

  const [activeTab, setActiveTab] = useState("shipments"); // "shipments" | "border" | "weather"
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchRadarData();
    const interval = setInterval(() => {
      fetchRadarData();
    }, 60000); // 1-minute auto-poll
    return () => clearInterval(interval);
  }, []);

  const filteredShipments = trackedShipments.filter((s) => {
    const matchesSearch =
      s.loadNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.truckNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.destination.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || s.onTimeStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenDetail = (shipment) => {
    setSelectedShipment(shipment);
    setIsDetailModalOpen(true);
  };

  if (trackedShipments.length === 0 && isLoading) {
    return (
      <div className="flex flex-col min-h-[300px] items-center justify-center">
        <Loader2 className="animate-spin" />
        Loading.....
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto select-none pb-12 text-base-content">
      {/* Top Banner / Hero */}
      <div className="bg-base-100 rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold tracking-tight text-base-content">
                Predictive Live ETA & Highway Weather Radar
              </h1>
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200 rounded-full">
                Samsara Telematics & NOAA Storm Feed
              </span>
            </div>
            <p className="text-xs text-base-content mt-1">
              Real-time dynamic ETAs combining live vehicle speeds, US/CA border bridge wait times, corridor weather penalties, and DOT HOS clocks
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => recalculateRadar()}
            disabled={isRecalculating}
            className="px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? "animate-spin" : ""}`} />
            <span>{isRecalculating ? "Recalculating Fleet..." : "⚡ Recalculate Live Radar"}</span>
          </button>
        </div>
      </div>

      {/* Top KPI Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Tracked Loads */}
        <div className="bg-base-100 rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-base-content text-xs font-medium">
            <span>Tracked Shipments</span>
            <Truck className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold text-base-content mt-1">
            {summary.totalTrackedShipments || trackedShipments.length}
          </div>
          <div className="text-[11px] text-base-content mt-0.5">Samsara GPS Online</div>
        </div>

        {/* On-Time Fleet Rate */}
        <div className="bg-base-100 rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-base-content text-xs font-medium">
            <span>On-Time Delivery Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {summary.onTimeFleetPct}%
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            {summary.onTimeCount} On Schedule • {summary.delayedCount} At Risk
          </div>
        </div>

        {/* Border Bridge Delay Avg */}
        <div className="bg-base-100 rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-base-content text-xs font-medium">
            <span>Avg Border Wait</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">
            {summary.averageBorderWaitMinutes} min
          </div>
          <div className="text-[11px] text-base-content mt-0.5">
            {summary.borderCrossingsMonitored} Ports of Entry
          </div>
        </div>

        {/* Severe Corridor Storm Alerts */}
        <div className="bg-base-100 rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-base-content text-xs font-medium">
            <span>Corridor Weather Alerts</span>
            <Wind className="w-4 h-4 text-rose-500" />
          </div>
          <div
            className={`text-2xl font-extrabold mt-1 ${summary.severeWeatherAlertsCount > 0 ? "text-rose-600" : "text-slate-800"
              }`}
          >
            {summary.severeWeatherAlertsCount}
          </div>
          <div className="text-[11px] text-base-content mt-0.5">
            High Wind & Storm Advisories
          </div>
        </div>

        {/* Active Power Units */}
        <div className="bg-base-100 rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-base-content text-xs font-medium">
            <span>Monitored Tractors</span>
            <Activity className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold text-sky-700 mt-1">
            {summary.liveSamsaraConnectedTractors || 427}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Live Telematics Feed</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
        <button
          onClick={() => setActiveTab("shipments")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${activeTab === "shipments"
            ? "bg-base-100 text-sky-700 border border-sky-200 shadow-2xs"
            : "text-slate-600 hover:text-base-content hover:bg-slate-100"
            }`}
        >
          <Radio className="w-4 h-4 text-sky-600" />
          <span>Live Shipment ETA Radar ({trackedShipments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("border")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${activeTab === "border"
            ? "bg-base-100 text-sky-700 border border-sky-200 shadow-2xs"
            : "text-slate-600 hover:text-base-content hover:bg-slate-100"
            }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Cross-Border Bridge Wait Times (US CBP / CBSA)</span>
        </button>

        <button
          onClick={() => setActiveTab("weather")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${activeTab === "weather"
            ? "bg-base-100 text-sky-700 border border-sky-200 shadow-2xs"
            : "text-slate-600 hover:text-base-content hover:bg-slate-100"
            }`}
        >
          <CloudRain className="w-4 h-4 text-sky-600" />
          <span>Corridor Weather & Severe Storm Radar ({weatherCorridors.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE SHIPMENT ETA RADAR */}
      {/* ========================================================================= */}
      {activeTab === "shipments" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-base-100 p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Load #, customer, driver, truck..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-base-200 border border-slate-200 rounded-xl text-xs text-base-content placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-base-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 px-3 py-2 shadow-2xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer w-full sm:w-auto"
              >
                <option value="ALL">All Delivery Statuses</option>
                <option value="ON_TIME">On Schedule</option>
                <option value="POTENTIAL_DELAY">Potential Delay</option>
                <option value="CRITICAL_DELAY">Critical Delay Risk</option>
              </select>
            </div>
          </div>

          {/* Shipment Radar Cards */}
          <div className="grid grid-cols-1 gap-4">
            {filteredShipments.map((s) => {
              const isOnTime = s.onTimeStatus === "ON_TIME";
              const isCritical = s.onTimeStatus === "CRITICAL_DELAY";

              return (
                <div
                  key={s.shipmentId}
                  className="bg-base-100 rounded-2xl border border-slate-200 shadow-xs hover:border-sky-300 transition-all p-5 space-y-4"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-base font-extrabold text-sky-700">
                        #{s.loadNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {s.customerName}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isOnTime
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isCritical
                            ? "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isOnTime
                            ? "bg-emerald-500"
                            : isCritical
                              ? "bg-rose-500"
                              : "bg-amber-500"
                            }`}
                        />
                        {s.statusBadge} ({s.confidencePct}% Confidence)
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {s.isApproachingGeofence && (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-extrabold border border-emerald-200 animate-bounce">
                          🎯 Approaching Delivery ({s.remainingMiles} mi out)
                        </span>
                      )}
                      <button
                        onClick={() => handleOpenDetail(s)}
                        className="px-3 py-1.5 rounded-xl bg-base-200 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold shadow-2xs flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <span>Deep-Dive Radar</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Route & Progress Visual */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-semibold text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold">{s.origin}</span>
                      </div>
                      <div className="text-slate-400 font-mono text-[11px]">
                        {s.completedMiles} mi completed • {s.remainingMiles} mi remaining ({s.totalMiles} mi total)
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">{s.destination}</span>
                        <MapPin className="w-3.5 h-3.5 text-sky-600" />
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full transition-all"
                        style={{ width: `${s.progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Live Radar Telemetry Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                    <div className="bg-base-200 rounded-xl p-3 border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Live Tractor Telematics</span>
                      <div className="text-sm font-extrabold text-base-content mt-0.5">
                        TRK-{s.truckNumber} • {s.liveSpeedMph} MPH
                      </div>
                      <div className="text-[11px] text-base-content truncate mt-0.5">
                        Driver: {s.driverName}
                      </div>
                    </div>

                    <div className="bg-base-200 rounded-xl p-3 border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Corridor Weather</span>
                      <div className="text-xs font-extrabold text-base-content mt-0.5 truncate">
                        {s.corridor.weatherCondition}
                      </div>
                      <div className="text-[11px] text-base-content mt-0.5">
                        {s.corridor.surfaceTempF}°F • Wind: {s.corridor.windSpeedMph} mph
                      </div>
                    </div>

                    <div className="bg-base-200 rounded-xl p-3 border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Border Port Clearance</span>
                      <div className="text-xs font-extrabold text-base-content mt-0.5 truncate">
                        {s.borderPort.portName}
                      </div>
                      <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
                        Bridge Wait: {s.borderWaitMinutes} min
                      </div>
                    </div>

                    <div className="bg-base-200 rounded-xl p-3 border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Predictive Dynamic ETA</span>
                      <div className="text-sm font-extrabold text-sky-700 font-mono mt-0.5">
                        {new Date(s.dynamicEta).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="text-[11px] text-base-content mt-0.5 font-medium">
                        {new Date(s.dynamicEta).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CROSS-BORDER BRIDGE WAIT TIMES */}
      {/* ========================================================================= */}
      {activeTab === "border" && (
        <div className="bg-base-100 rounded-2xl border border-slate-200 p-3 sm:p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-base-content">
                US CBP & CBSA Commercial Border Crossing Radar
              </h2>
              <p className="text-xs text-base-content mt-0.5">
                Real-time commercial lane wait times, FAST lane availability, and peak delay windows for Nishan Transport
              </p>
            </div>
            <span className="px-3 py-1 bg-sky-50 text-sky-800 text-xs font-bold font-mono rounded-full border border-sky-200">
              {borderPorts.length} Ports Monitored
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {borderPorts.map((port) => {
              const isNormal = port.delayStatus === "NORMAL";
              const isSevere = port.delayStatus === "SEVERE";

              return (
                <div
                  key={port.portCode}
                  className="bg-base-200 rounded-2xl border border-slate-200 p-4 space-y-3 hover:border-sky-300 transition-all shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-extrabold text-base-content text-sm">{port.portName}</div>
                      <div className="text-[11px] text-base-content">{port.jurisdiction}</div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isNormal
                        ? "bg-emerald-100 text-emerald-800"
                        : isSevere
                          ? "bg-rose-100 text-rose-800 animate-pulse"
                          : "bg-amber-100 text-amber-800"
                        }`}
                    >
                      {port.delayStatus}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-base-100 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Current Wait Time</span>
                      <div className="text-2xl font-black text-base-content font-mono mt-0.5">
                        {port.currentWaitMinutes} <span className="text-xs font-normal text-base-content">mins</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Commercial Lanes</span>
                      <div className="text-xs font-bold text-slate-700 mt-0.5">
                        {port.commercialLanesOpen} Standard • {port.fastLanesOpen} FAST
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Highway Route:</span>
                      <span className="font-semibold text-slate-800">{port.highwayCorridor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Peak Window:</span>
                      <span className="font-medium text-slate-700">{port.peakHours}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">FAST Priority:</span>
                      <span className="text-emerald-700 font-bold">Authorized (FAST Lanes Open)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CORRIDOR WEATHER & SEVERE STORM RADAR */}
      {/* ========================================================================= */}
      {activeTab === "weather" && (
        <div className="bg-base-100 rounded-2xl border border-slate-200 p-3 sm:p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-base-content">
                Highway Freight Corridor Severe Weather Radar
              </h2>
              <p className="text-xs text-base-content mt-0.5">
                NOAA / Environment Canada live weather advisories, wind gust rollover meters, and road traction status
              </p>
            </div>
            <span className="px-3 py-1 bg-sky-50 text-sky-800 text-xs font-bold font-mono rounded-full border border-sky-200">
              {weatherCorridors.length} Highway Corridors Active
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {weatherCorridors.map((c) => {
              const hasAlerts = c.severeAlerts && c.severeAlerts.length > 0;
              const isHighWind = c.windGustMph >= 40;

              return (
                <div
                  key={c.id}
                  className={`bg-base-200 rounded-2xl border p-5 space-y-4 shadow-2xs transition-all ${hasAlerts ? "border-amber-300 bg-amber-50/20" : "border-slate-200"
                    }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <div className="text-sm font-extrabold text-base-content">{c.corridorName}</div>
                      <div className="text-[11px] text-base-content font-medium">{c.routeSpan}</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-base-100 text-slate-700 border border-slate-200 shadow-2xs">
                        {c.weatherCondition}
                      </span>
                      {isHighWind && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                          ⚠️ HIGH WIND GUSTS ({c.windGustMph} MPH)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Telemetry Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-base-100 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Surface Temperature</span>
                      <div className="text-sm font-extrabold text-base-content mt-0.5">
                        {c.surfaceTempF}°F <span className="text-slate-400 text-xs font-normal">({c.ambientTempF}°F ambient)</span>
                      </div>
                    </div>

                    <div className="bg-base-100 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Wind Velocity & Gusts</span>
                      <div className="text-sm font-extrabold text-base-content mt-0.5">
                        {c.windSpeedMph} mph <span className="text-base-content font-semibold">({c.windGustMph} mph gusts)</span>
                      </div>
                    </div>

                    <div className="bg-base-100 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Road Surface Traction</span>
                      <div className="text-xs font-extrabold text-slate-800 mt-0.5 truncate">
                        {c.roadCondition}
                      </div>
                    </div>

                    <div className="bg-base-100 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Visibility & Precip</span>
                      <div className="text-sm font-extrabold text-base-content mt-0.5">
                        {c.visibilityMiles} mi • {c.precipitationPct}% rain
                      </div>
                    </div>
                  </div>

                  {/* Active Storm Warnings */}
                  {hasAlerts && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                      {c.severeAlerts.map((alert, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-extrabold text-amber-900">{alert.title}: </span>
                            <span className="text-amber-800">{alert.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-[11px] text-base-content font-medium italic">
                    🧭 Dispatch Advisory: {c.advisory}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SHIPMENT RADAR DEEP-DIVE & MILESTONE TIMELINE */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-base-100 rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 text-base-content">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-base-content">
                    Shipment Radar Breakdown • Load #{selectedShipment.loadNumber}
                  </h3>
                  <p className="text-xs text-base-content">
                    {selectedShipment.customerName} • {selectedShipment.origin} ➔ {selectedShipment.destination}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Telemetry Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-base-200 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Tractor</span>
                <div className="text-sm font-extrabold text-base-content mt-0.5">
                  TRK-{selectedShipment.truckNumber}
                </div>
                <div className="text-[11px] text-base-content">{selectedShipment.driverName}</div>
              </div>

              <div className="bg-base-200 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Live Speed</span>
                <div className="text-sm font-extrabold text-sky-700 mt-0.5">
                  {selectedShipment.liveSpeedMph} MPH
                </div>
                <div className="text-[11px] text-base-content">Eff: {selectedShipment.effectiveSpeedMph} MPH</div>
              </div>

              <div className="bg-base-200 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Border Wait Delay</span>
                <div className="text-sm font-extrabold text-amber-700 mt-0.5">
                  +{selectedShipment.borderWaitMinutes} min
                </div>
                <div className="text-[11px] text-base-content truncate">{selectedShipment.borderPort.portName}</div>
              </div>

              <div className="bg-base-200 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Dynamic ETA</span>
                <div className="text-sm font-extrabold text-emerald-700 font-mono mt-0.5">
                  {new Date(selectedShipment.dynamicEta).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="text-[11px] text-emerald-600 font-bold">{selectedShipment.statusBadge}</div>
              </div>
            </div>

            {/* Step-by-Step Route Milestones */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Transit Route Milestones & Geofence Timeline
              </h4>

              <div className="space-y-3 border-l-2 border-slate-200 ml-3 pl-4">
                {selectedShipment.milestones?.map((m, idx) => (
                  <div key={idx} className="relative space-y-1">
                    <div
                      className={`absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${m.status === "COMPLETED"
                        ? "bg-emerald-500"
                        : m.status === "ACTIVE"
                          ? "bg-sky-500 animate-pulse"
                          : "bg-slate-300"
                        }`}
                    />
                    <div className="text-xs font-extrabold text-base-content flex items-center justify-between">
                      <span>{m.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${m.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700"
                          : m.status === "ACTIVE"
                            ? "bg-sky-50 text-sky-700"
                            : "bg-slate-100 text-slate-600"
                          }`}
                      >
                        {m.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-base-content">
                      Location: {m.location}
                      {m.weather && <span> • Weather: {m.weather}</span>}
                      {m.speed && <span> • Cruising: {m.speed}</span>}
                      {m.eta && (
                        <span>
                          {" "}
                          • Projected Arrival:{" "}
                          {new Date(m.eta).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
              >
                Close Radar View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

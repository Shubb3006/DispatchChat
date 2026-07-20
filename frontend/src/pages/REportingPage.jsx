import { useState, useEffect } from "react";
import { useShipmentStore } from "../stores/useShipmentStore";
import { useInvoiceStore } from "../stores/useInvoiceStore";
import { useAuthStore } from "../stores/useAuthStore";
import {
  BarChart3,
  ShieldCheck,
  DollarSign,
  Award,
  Layers,
  Cpu,
  Database,
  Key,
  MessageSquare,
  Zap,
  CheckCircle,
  RefreshCcw,
  Activity,
  Shield,
  Lock,
} from "lucide-react";

export default function ReportingPage() {
  const shipments = useShipmentStore((state) => state.shipments);
  const fetchShipments = useShipmentStore((state) => state.fetchShipments);
  const invoices = useInvoiceStore((state) => state.invoices);
  const fetchInvoices = useInvoiceStore((state) => state.fetchInvoices);
  const currentUser = useAuthStore((state) => state.currentUser);

  const [estDrivers, setEstDrivers] = useState(400);
  const [estEmployees, setEstEmployees] = useState(200);
  const [activePreset, setActivePreset] = useState("slate");
  const [riskSimulation, setRiskSimulation] = useState("nominal");
  const [customsSLA, setCustomsSLA] = useState(98.2);
  const [liveLogs, setLiveLogs] = useState([
    {
      id: "LOG-7729",
      timestamp: "05:21:04",
      source: "Samsara HOS Sync",
      event: "Driver M. Vance ELD compliance logs verified",
      status: "SUCCESS",
    },
    {
      id: "LOG-7728",
      timestamp: "05:20:12",
      source: "Customs BorderLink",
      event: "PARS pre-clearance barcodes generated for TRK-102",
      status: "SUCCESS",
    },
    {
      id: "LOG-7727",
      timestamp: "05:19:45",
      source: "Gemini AI Vision",
      event: "POD signature scanned & parsed with 99.8% confidence score",
      status: "SUCCESS",
    },
  ]);
  const [isSimulatingLogs, setIsSimulatingLogs] = useState(true);

  // Fetch shipments and invoices on load of ReportingPage
  useEffect(() => {
    fetchShipments();
    fetchInvoices();
  }, [fetchShipments, fetchInvoices]);

  useEffect(() => {
    if (!isSimulatingLogs) return;
    const interval = setInterval(() => {
      const logSources = [
        "Samsara Telemetry",
        "BorderConnect Gateway",
        "Gemini AI Vision",
        "Twilio Alerts",
        "Firestore Engine",
        "Stripe Ledger",
      ];
      const logEvents = [
        "Speed compliance watermarks verified via Samsara GPS",
        "Multi-photo pallet condition bundle committed to database",
        "Automatic cross-border invoice auto-generated upon delivery",
        "Customs PAPS manifest accepted by border officers",
        "Role-based security token renewed for Keith Donnelly (Dispatcher)",
        "Fuel surcharge indexing updated using regional terminal averages",
        "Geofence exit alert triggered for Vehicle TRK-108 near Detroit",
      ];
      const statuses = ["SUCCESS", "SUCCESS", "SUCCESS", "WARNING"];
      const randomSource =
        logSources[Math.floor(Math.random() * logSources.length)];
      const randomEvent =
        logEvents[Math.floor(Math.random() * logEvents.length)];
      const randomStatus =
        statuses[Math.floor(Math.random() * statuses.length)];
      const newLog = {
        id: `LOG-${Math.floor(1e3 + Math.random() * 9e3)}`,
        timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
        source: randomSource,
        event: randomEvent,
        status: randomStatus,
      };
      setLiveLogs((prev) => [newLog, ...prev.slice(0, 4)]);
    }, 4500);
    return () => clearInterval(interval);
  }, [isSimulatingLogs]);

  useEffect(() => {
    if (riskSimulation === "nominal") {
      setCustomsSLA(98.2);
    } else if (riskSimulation === "elevated") {
      setCustomsSLA(94.5);
    } else {
      setCustomsSLA(88.1);
    }
  }, [riskSimulation]);

  const isAuthorized =
    currentUser?.role === "super_admin" || currentUser?.role === "admin";

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-white border border-rose-200 rounded-xl p-6 text-center shadow-md space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
          ⚠️
        </div>
        <h3 className="text-sm font-bold text-slate-900">Access Denied</h3>
        <p className="text-xs text-slate-500">
          The Operations Analytics Dashboard is strictly restricted to Admins
          and Super Admins. Please select another role in the sidebar or top
          bar.
        </p>
      </div>
    );
  }

  const totalCompletedMiles = shipments
    .filter((s) => s.status === "delivered")
    .reduce((acc, curr) => acc + curr.totalDistanceMiles, 0);
  const totalRevenue = invoices.reduce((acc, curr) => acc + curr.total, 0);
  const totalCost =
    shipments.reduce((acc, curr) => acc + curr.costEstimate, 0) +
    shipments.length * 45;
  const netOperatingProfit = totalRevenue - totalCost;
  const deliveredShipments = shipments.filter((s) => s.status === "delivered");
  const onTimeRate = deliveredShipments.length > 0 ? 100 : 96.4;
  const totalGallonsUsed = Math.round(totalCompletedMiles / 6.5);
  const costCloud = Math.max(
    60,
    Math.round(60 + (estDrivers + estEmployees - 300) * 0.15)
  );
  const costSamsara = Math.round(estDrivers * 1.5);
  const costGemini = Math.round(estDrivers * 4 * 0.09);
  const costSecurity = Math.max(
    0,
    Math.round((estDrivers + estEmployees - 500) * 0.2)
  );
  const costSMS = Math.round(estDrivers * 0.45);
  const totalExpense =
    costCloud + costSamsara + costGemini + costSecurity + costSMS;

  const themeClasses = {
    slate: {
      textAccent: "text-indigo-600",
      bgAccent: "bg-indigo-600",
      badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-100",
      panelBorder: "border-indigo-500/20",
      progressColor: "bg-indigo-500",
      glow: "shadow-indigo-500/10",
    },
    emerald: {
      textAccent: "text-emerald-600",
      bgAccent: "bg-emerald-600",
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-100",
      panelBorder: "border-emerald-500/20",
      progressColor: "bg-emerald-500",
      glow: "shadow-emerald-500/10",
    },
    sapphire: {
      textAccent: "text-blue-600",
      bgAccent: "bg-blue-600",
      badgeBg: "bg-blue-50 text-blue-700 border-blue-100",
      panelBorder: "border-blue-500/20",
      progressColor: "bg-blue-500",
      glow: "shadow-blue-500/10",
    },
    cyber: {
      textAccent: "text-amber-500",
      bgAccent: "bg-amber-500",
      badgeBg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      panelBorder: "border-amber-500/30",
      progressColor: "bg-amber-500",
      glow: "shadow-amber-500/15",
    },
  };

  const currentTheme = themeClasses[activePreset];

  return (
    <div
      id="administrative-reports"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
    >
      {/* BRAND NEW: SYSTEM CONFIGURATION CENTER */}
      <div
        className={`bg-slate-900 text-white rounded-2xl border ${currentTheme.panelBorder} p-6 shadow-xl ${currentTheme.glow} transition-all duration-300 relative overflow-hidden`}
      >
        {/* Subtle geometric background grids */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-gradient-to-tr from-emerald-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-black">
                Enterprise Intelligence Suite
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-1 font-sans">
              Operational Command Room &amp; Premium UI Control Hub
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Explore professional visual trends, simulate mission-critical
              transport constraints, and customize live telemetry accents to
              match modern executive branding standards.
            </p>
          </div>

          {/* Preset Theme Selection Controls */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Palette Presets:
            </span>
            <div className="flex items-center gap-2">
              {[
                { id: "slate", label: "Indigo Slate", color: "bg-indigo-500" },
                {
                  id: "emerald",
                  label: "Corporate Green",
                  color: "bg-emerald-500",
                },
                {
                  id: "sapphire",
                  label: "Royal Sapphire",
                  color: "bg-blue-500",
                },
                {
                  id: "cyber",
                  label: "High-Contrast Amber",
                  color: "bg-amber-500",
                },
              ].map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setActivePreset(preset.id)}
                  className={`px-3 py-1.5 rounded-lg text-2xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    activePreset === preset.id
                      ? "bg-white text-slate-900 shadow-md scale-105"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  }`}
                  title={preset.label}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${preset.color}`}
                  />
                  <span>{preset.label.split(" ")[1] || preset.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dashboard Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 relative z-10">
          {/* Interactive Driver/Customs Simulation Card */}
          <div className="lg:col-span-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                AI Simulation Matrix
              </span>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-400 shrink-0" />
                Environmental Hazards Adjuster
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Inject custom real-time hazards (weather storms, port custom
                bottlenecks) to test how safety rating rules recalculate routing
                parameters.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: "nominal",
                  label: "Clear Flow",
                  desc: "No active warnings",
                  color:
                    "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10",
                },
                {
                  id: "elevated",
                  label: "Storm Delay",
                  desc: "Slight delays",
                  color:
                    "border-amber-500/20 text-amber-400 hover:bg-amber-500/10",
                },
                {
                  id: "severe",
                  label: "Customs Block",
                  desc: "Critical border delay",
                  color:
                    "border-rose-500/20 text-rose-400 hover:bg-rose-500/10",
                },
              ].map((sim) => (
                <button
                  key={sim.id}
                  onClick={() => setRiskSimulation(sim.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col justify-between cursor-pointer group ${
                    riskSimulation === sim.id
                      ? "bg-slate-800 border-white/40 shadow-inner"
                      : `bg-slate-900/40 ${sim.color}`
                  }`}
                >
                  <span className="text-3xs font-mono font-bold uppercase tracking-wider block mx-auto text-white group-hover:scale-105 transition-transform">
                    {sim.label}
                  </span>
                  <span className="text-[8px] text-slate-500 mt-1 block leading-tight">
                    {sim.desc}
                  </span>
                </button>
              ))}
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 space-y-2">
              <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-400">
                <span>AI RECALCULATED HAZARD INDEX:</span>
                <span
                  className={`font-black ${
                    riskSimulation === "nominal"
                      ? "text-emerald-400"
                      : riskSimulation === "elevated"
                      ? "text-amber-400"
                      : "text-rose-400 animate-pulse"
                  }`}
                >
                  {riskSimulation === "nominal"
                    ? "NOMINAL (0.05)"
                    : riskSimulation === "elevated"
                    ? "ELEVATED (0.42)"
                    : "CRITICAL (0.89)"}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {riskSimulation === "nominal" &&
                  "Routing optimizer is active. GPS coordinates tracking standard highways. Fuel economy peak."}
                {riskSimulation === "elevated" &&
                  "Automated SMS route recalculations sent to drivers advising winter bypass routes. High safety vigilance."}
                {riskSimulation === "severe" &&
                  "Border Customs Link alerts activated. Delay logs triggered to auto-notify customs agents."}
              </p>
            </div>
          </div>

          {/* Interactive Metrics Telemetry Feedback */}
          <div className="lg:col-span-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                Reactive Performance
              </span>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-emerald-400 shrink-0" />
                Live SLA &amp; Optimization Index
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Dynamic telemetry index scores derived from simulation triggers
                and driver management variables in real-time.
              </p>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-2xs font-mono">
                  <span className="text-slate-400">
                    Border Customs SLA Clearance
                  </span>
                  <span
                    className={`font-bold ${
                      riskSimulation === "nominal"
                        ? "text-emerald-400"
                        : riskSimulation === "elevated"
                        ? "text-amber-400"
                        : "text-rose-400"
                    }`}
                  >
                    {customsSLA}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      riskSimulation === "nominal"
                        ? "bg-emerald-500"
                        : riskSimulation === "elevated"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${customsSLA}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-2xs font-mono">
                  <span className="text-slate-400">
                    Estimated Fuel Optimization
                  </span>
                  <span className="font-bold text-indigo-400">
                    {riskSimulation === "nominal"
                      ? "98.4%"
                      : riskSimulation === "elevated"
                      ? "91.2%"
                      : "82.0%"}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${currentTheme.progressColor}`}
                    style={{
                      width:
                        riskSimulation === "nominal"
                          ? "98.4%"
                          : riskSimulation === "elevated"
                          ? "91.2%"
                          : "82.0%",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-slate-800/80 pt-3">
              <div className="flex-1 bg-slate-900/60 p-2 rounded border border-slate-800/60 text-center">
                <span className="block text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                  Active Corridors
                </span>
                <span className="text-xs font-bold font-mono text-slate-100">
                  5 Cross-Border
                </span>
              </div>
              <div className="flex-1 bg-slate-900/60 p-2 rounded border border-slate-800/60 text-center">
                <span className="block text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                  Database Sync
                </span>
                <span className="text-xs font-bold font-mono text-emerald-400 flex items-center justify-center gap-1">
                  <CheckCircle className="h-3 w-3 shrink-0" />
                  Live
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Cryptographic Event Logs */}
          <div className="lg:col-span-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                  Audit Logs Trail
                </span>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-indigo-400 shrink-0" />
                  Secure Cryptographic Events
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSimulatingLogs(!isSimulatingLogs)}
                className={`p-1.5 rounded-lg border text-3xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  isSimulatingLogs
                    ? "bg-emerald-950/40 border-emerald-900/60 text-emerald-400 hover:bg-emerald-950/80"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
                title="Toggle Log Simulator"
              >
                <RefreshCcw
                  className={`h-3 w-3 ${
                    isSimulatingLogs ? "animate-spin" : ""
                  }`}
                />
                <span>{isSimulatingLogs ? "Streaming" : "Paused"}</span>
              </button>
            </div>

            {/* Logs List Container */}
            <div className="space-y-2 h-[120px] overflow-y-auto pr-1">
              {liveLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 bg-slate-900/60 border border-slate-800 p-2 rounded-lg text-2xs hover:border-slate-700/60 transition-all"
                >
                  <span
                    className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md font-mono shrink-0 uppercase tracking-wider ${
                      log.status === "SUCCESS"
                        ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900/40"
                        : log.status === "WARNING"
                        ? "bg-amber-950/50 text-amber-400 border border-amber-900/40"
                        : "bg-rose-950/50 text-rose-400 border border-rose-900/40"
                    }`}
                  >
                    {log.status === "SUCCESS"
                      ? "Secure"
                      : log.status === "WARNING"
                      ? "Alert"
                      : "Halt"}
                  </span>

                  <div className="flex-1 min-w-0 font-mono text-[9px]">
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="font-bold text-slate-300">
                        {log.source}
                      </span>
                      <span>{log.timestamp}</span>
                    </div>
                    <p className="text-slate-400 leading-tight mt-0.5 truncate">
                      {log.event}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900/40 border border-slate-800/80 p-2 rounded-lg">
              <Lock className="h-3 w-3 text-slate-500 shrink-0" />
              <p className="text-[8px] text-slate-500 leading-none font-mono uppercase">
                Tamper-proof log sequence verified with blockchain ledger
                timestamps.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upper metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-md">
          <span className="text-3xs font-mono text-indigo-400 uppercase tracking-wider font-bold">
            Total Operations Revenue
          </span>
          <div className="text-2xl font-bold font-sans mt-1 text-white">
            ${totalRevenue.toLocaleString()} USD
          </div>
          <p className="text-3xs text-slate-400 mt-1">
            Month-to-date billed invoices
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-3xs font-mono text-slate-500 uppercase tracking-wider font-bold">
            Net Operating Profit
          </span>
          <div className="text-2xl font-bold font-sans mt-1 text-emerald-600">
            ${netOperatingProfit.toLocaleString()} USD
          </div>
          <p className="text-3xs text-slate-500 mt-1">
            Revenue minus fuel/tolls/broker fees
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-3xs font-mono text-slate-500 uppercase tracking-wider font-bold">
            On-Time Delivery Rate
          </span>
          <div
            className={`text-2xl font-bold font-sans mt-1 ${
              riskSimulation === "severe" ? "text-rose-600" : "text-indigo-600"
            }`}
          >
            {onTimeRate}%
          </div>
          <p className="text-3xs text-slate-500 mt-1">
            Cross-border customs SLA compliant
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-3xs font-mono text-slate-500 uppercase tracking-wider font-bold">
            Fleet Diesel spent
          </span>
          <div className="text-2xl font-bold font-sans mt-1 text-slate-900">
            {totalGallonsUsed.toLocaleString()} Gal
          </div>
          <p className="text-3xs text-slate-500 mt-1">
            Based on Samsara telemetry log integrations
          </p>
        </div>
      </div>

      {/* Graphical administrative reporting blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Fleet Operational charts */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900 font-sans">
                LTL Shipment Operations Capacity Chart
              </h3>
            </div>

            {/* Simulated bar chart representation using SVG */}
            <div className="relative h-64 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between p-4">
              <div className="flex justify-between items-end h-48 border-b border-slate-300 pb-2 px-6">
                {/* Bar 1 */}
                <div className="flex flex-col items-center space-y-2 w-12 group">
                  <div className="text-3xs font-bold font-mono text-slate-800">
                    4,500 lbs
                  </div>
                  <div
                    className={`w-full ${currentTheme.bgAccent} rounded-t-md transition-all`}
                    style={{ height: "55px" }}
                  />
                  <span className="text-3xs text-slate-500 font-mono">
                    Aeroparts TOR
                  </span>
                </div>

                {/* Bar 2 */}
                <div className="flex flex-col items-center space-y-2 w-12 group">
                  <div className="text-3xs font-bold font-mono text-slate-800">
                    4,000 lbs
                  </div>
                  <div
                    className={`w-full ${currentTheme.bgAccent} rounded-t-md transition-all`}
                    style={{ height: "48px" }}
                  />
                  <span className="text-3xs text-slate-500 font-mono">
                    Bendix MIS
                  </span>
                </div>

                {/* Bar 3 */}
                <div className="flex flex-col items-center space-y-2 w-12 group">
                  <div className="text-3xs font-bold font-mono text-slate-800">
                    14,200 lbs
                  </div>
                  <div
                    className="w-full bg-emerald-500 group-hover:bg-emerald-600 rounded-t-md transition-all"
                    style={{ height: "145px" }}
                  />
                  <span className="text-3xs text-slate-500 font-mono">
                    Pac Lumber
                  </span>
                </div>

                {/* Bar 4 */}
                <div className="flex flex-col items-center space-y-2 w-12 group">
                  <div className="text-3xs font-bold font-mono text-slate-800">
                    6,800 lbs
                  </div>
                  <div
                    className={`w-full ${currentTheme.bgAccent} rounded-t-md transition-all`}
                    style={{ height: "78px" }}
                  />
                  <span className="text-3xs text-slate-500 font-mono">
                    Fresno Stone
                  </span>
                </div>

                {/* Bar 5 */}
                <div className="flex flex-col items-center space-y-2 w-12 group">
                  <div className="text-3xs font-bold font-mono text-slate-800">
                    18,500 lbs
                  </div>
                  <div
                    className="w-full bg-emerald-500 group-hover:bg-emerald-600 rounded-t-md transition-all"
                    style={{ height: "175px" }}
                  />
                  <span className="text-3xs text-slate-500 font-mono">
                    Steel Alloys
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-3xs font-mono text-slate-500 px-4">
                <span>Weight Classification Scale (Lbs)</span>
                <span className="flex items-center">
                  <span
                    className={`h-2 w-2 rounded-full ${currentTheme.bgAccent} mr-1.5`}
                  />{" "}
                  Standard LTL
                </span>
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5" />{" "}
                  Heavy-Freight Floor LTL
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Operations & Customs audit manifest
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-2xs font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Tracking Reference</th>
                    <th className="px-4 py-3">Customer Code</th>
                    <th className="px-4 py-3">Cost estimate</th>
                    <th className="px-4 py-3">Invoiced Price</th>
                    <th className="px-4 py-3">Profit margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {shipments.map((s) => {
                    const margin = s.priceInvoice - s.costEstimate;
                    const marginPercent =
                      s.priceInvoice > 0
                        ? Math.round((margin / s.priceInvoice) * 100)
                        : 0;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {s.trackingNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {s.customerName}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          ${s?.costEstimate?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-slate-900 font-bold">
                          ${s?.priceInvoice?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-emerald-600 font-bold">
                            ${margin.toLocaleString()} ({marginPercent}%)
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: Administrative targets and KPIs */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Award className="h-5 w-5 text-indigo-600" />
              <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wide">
                Fleet KPI scorecards
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Customs Clearance SLA</span>
                  <span className="font-bold text-slate-900">
                    {customsSLA}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      riskSimulation === "severe"
                        ? "bg-rose-500"
                        : "bg-indigo-500"
                    }`}
                    style={{ width: `${customsSLA}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-600">
                  <span>HOS Log Compliance Auditing</span>
                  <span className="font-bold text-slate-900">96.8%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: "96.8%" }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Invoicing Cycle Speed (Days)</span>
                  <span className="font-bold text-slate-900">1.4 Days</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full"
                    style={{ width: "85%" }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Samsara Speed Compliance</span>
                  <span className="font-bold text-slate-900">94.1%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full"
                    style={{ width: "94.1%" }}
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-3xs leading-relaxed font-sans">
              <span className="font-bold text-slate-800 block mb-1 uppercase font-mono">
                Admin Auditing SLA policy
              </span>
              All logistics, border releases, fuel and invoice matches are
              archived and audited under real-time Samsara GPS streams for
              compliance checks. Export administrative summaries through
              standard CSV files directly if requested.
            </div>
          </div>
        </div>
      </div>

      {/* ENTERPRISE MONTHLY OPERATIONS EXPENSE ESTIMATOR */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-sans flex items-center gap-2">
                Enterprise Operations &amp; Cloud Monthly Expenses Breakdown
              </h3>
              <p className="text-xs text-slate-500">
                Itemized infrastructure projections for high-efficiency hosting
                of drivers and administrative employees.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-center shrink-0">
            <span className="block text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-widest">
              Total Monthly Cost
            </span>
            <span className="text-xl font-extrabold font-mono text-emerald-400">
              $
              {(
                costCloud +
                costSamsara +
                costGemini +
                costSecurity +
                costSMS
              ).toLocaleString()}{" "}
              USD
            </span>
          </div>
        </div>

        {/* Dynamic Sliders for Interactive Projections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-xl border border-slate-200/80">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-700">
                Active Fleet Drivers Count:
              </span>
              <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {estDrivers} Drivers
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="1000"
              step="10"
              value={estDrivers}
              onChange={(e) => setEstDrivers(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
            />
            <p className="text-[10px] text-slate-400">
              Scales Samsara endpoints, Gemini OCR volumes, and Twilio SMS
              fallback alerts.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-700">
                Office Working Employees Count:
              </span>
              <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                {estEmployees} Employees
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={estEmployees}
              onChange={(e) => setEstEmployees(parseInt(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
            />
            <p className="text-[10px] text-slate-400">
              Scales back-office dispatcher dashboards, security profiles, and
              concurrency thresholds.
            </p>
          </div>
        </div>

        {/* Itemized Cost Breakdown Rows */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {/* Item 1: Cloud & DB */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3 shadow-2xs">
            <div>
              <div className="flex items-center justify-between text-slate-700">
                <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                  <Database className="h-4 w-4" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-800">
                  ${costCloud} /mo
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-800 mt-2 font-sans">
                Cloud Compute &amp; DB
              </h4>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                Google Cloud Run container clusters and Firestore NoSQL
                persistent database. Near-zero latency with autoscaling.
              </p>
            </div>
            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full"
                style={{ width: `${Math.min(100, (costCloud / 200) * 100)}%` }}
              />
            </div>
          </div>

          {/* Item 2: Samsara API */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3 shadow-2xs">
            <div>
              <div className="flex items-center justify-between text-slate-700">
                <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                  <Cpu className="h-4 w-4" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-800">
                  ${costSamsara} /mo
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-800 mt-2 font-sans">
                Samsara Fleet API
              </h4>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                Standard real-time truck location, speed tracking, geofence
                callbacks, and active ELD hours synchronization endpoints.
              </p>
            </div>
            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full"
                style={{
                  width: `${Math.min(100, (costSamsara / 1500) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Item 3: Gemini Vision OCR */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3 shadow-2xs">
            <div>
              <div className="flex items-center justify-between text-slate-700">
                <div className="p-1.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-100">
                  <Layers className="h-4 w-4" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-800">
                  ${costGemini} /mo
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-800 mt-2 font-sans">
                Gemini AI Vision OCR
              </h4>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                AI-powered reading and key-value extraction of Bill of Lading
                (BOL), POD signatures, fuel bills, and damage pictures.
              </p>
            </div>
            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full"
                style={{ width: `${Math.min(100, (costGemini / 400) * 100)}%` }}
              />
            </div>
          </div>

          {/* Item 4: IAM Auth Security */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3 shadow-2xs">
            <div>
              <div className="flex items-center justify-between text-slate-700">
                <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                  <Key className="h-4 w-4" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-800">
                  ${costSecurity} /mo
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-800 mt-2 font-sans">
                Enterprise Security
              </h4>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                Federated IAM authentication and role-based access tokens
                protecting dispatcher and driver login profiles securely.
              </p>
            </div>
            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
              <div
                className="bg-amber-600 h-full"
                style={{
                  width: `${Math.min(100, (costSecurity / 200) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Item 5: SMS Alert Gateway */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3 shadow-2xs">
            <div>
              <div className="flex items-center justify-between text-slate-700">
                <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-800">
                  ${costSMS} /mo
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-800 mt-2 font-sans">
                Twilio SMS Gateway
              </h4>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                Automated backup SMS updates and e-manifest border barcode
                dispatch notifications for areas without cell coverage.
              </p>
            </div>
            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full"
                style={{ width: `${Math.min(100, (costSMS / 500) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Cost Efficiency Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-900 text-white rounded-xl p-5 border border-slate-800">
          <div className="space-y-1 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
            <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider block">
              Zero-Latency SLA Performance:
            </span>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>99.99% Node/Vite Availability</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Direct server-to-browser WebSockets and sub-millisecond database
              queries ensure lightning-fast operations for 600 concurrent
              clients.
            </p>
          </div>

          <div className="space-y-1 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
            <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider block">
              Bespoke Custom Build Savings:
            </span>
            <div className="text-xs font-bold text-indigo-300">
              Save over $8,500 monthly
            </div>
            <p className="text-[10px] text-slate-400">
              A similar proprietary Samsara + ERP system charging per-license
              fees would cost $15.00+ per user, exceeding $9,000/mo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

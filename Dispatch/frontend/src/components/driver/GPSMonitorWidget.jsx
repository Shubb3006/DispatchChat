import React from "react";
import { Compass, MapPin, RefreshCcw, ShieldAlert, Satellite } from "lucide-react";

const STATUS_META = {
  active: { label: "Live GPS Lock", dot: "bg-emerald-400", text: "text-emerald-400" },
  starting: { label: "Acquiring GPS Fix…", dot: "bg-amber-400 animate-pulse", text: "text-amber-300" },
  denied: { label: "Permission Denied", dot: "bg-rose-500", text: "text-rose-400" },
  unavailable: { label: "GPS Unavailable", dot: "bg-rose-500", text: "text-rose-400" },
  error: { label: "GPS Error", dot: "bg-rose-500", text: "text-rose-400" },
  off: { label: "GPS Off", dot: "bg-base-2000", text: "text-slate-400" },
  simulated: { label: "DEV Simulated Position", dot: "bg-amber-400", text: "text-amber-300" },
};

export default function GPSMonitorWidget({
  driverLocation,
  gpsStatus,
  gpsError,
  gpsEnabled,
  setGpsEnabled,
  isNative,
  lastSyncAt,
  syncError,
  simulateMode,
  setSimulateMode,
  setSimulatedLocation,
  myShipment,
}) {
  const isDev = import.meta.env.DEV;
  const meta = STATUS_META[gpsStatus] || STATUS_META.off;

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-2xl border border-indigo-950 shadow-md p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/40 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-600/30 rounded-xl text-indigo-300 border border-indigo-500/20">
            <Compass
              className="h-5 w-5 animate-spin-slow"
              style={{ animationDuration: "8s" }}
            />
          </div>
          <div>
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
              Real-Time GPS Monitor
            </h3>
            <p className="text-3xs text-indigo-200/70 font-mono uppercase mt-0.5">
              {isNative ? "NATIVE DEVICE GEOLOCATION (CAPACITOR)" : "BROWSER GEOLOCATION FEED"}
            </p>
          </div>
        </div>

        {/* Live Device GPS Toggle */}
        <button
          type="button"
          onClick={() => setGpsEnabled((prev) => !prev)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center space-x-2 cursor-pointer ${gpsEnabled
            ? "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 shadow-md"
            : "bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/40"
            }`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${gpsEnabled ? "bg-base-100 animate-pulse" : "bg-indigo-500"
              }`}
          />
          <span>{gpsEnabled ? "Device GPS: On" : "Enable Device GPS"}</span>
        </button>
      </div>

      {gpsError && (
        <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-200 text-2xs flex items-start space-x-2 font-mono">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
          <span>{gpsError}</span>
        </div>
      )}

      {syncError && (
        <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-200 text-2xs flex items-start space-x-2 font-mono">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
          <span>{syncError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Telemetry Display */}
        <div className="md:col-span-6 bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-2.5">
          <span className="text-3xs text-slate-400 uppercase tracking-widest font-mono font-bold block">
            Current Driver Telemetry
          </span>
          <div className="space-y-1.5">
            <div className="flex justify-between text-2xs">
              <span className="text-base-content font-mono">Latitude:</span>
              <span className="font-mono text-indigo-300 font-bold">
                {driverLocation ? driverLocation.lat.toFixed(6) : "— awaiting fix —"}
              </span>
            </div>
            <div className="flex justify-between text-2xs">
              <span className="text-base-content font-mono">Longitude:</span>
              <span className="font-mono text-indigo-300 font-bold">
                {driverLocation ? driverLocation.lng.toFixed(6) : "— awaiting fix —"}
              </span>
            </div>
            {driverLocation?.accuracy != null && (
              <div className="flex justify-between text-2xs">
                <span className="text-base-content font-mono">Accuracy:</span>
                <span className="font-mono text-indigo-300 font-bold">
                  ±{Math.round(driverLocation.accuracy)} m
                </span>
              </div>
            )}
            <div className="flex justify-between text-2xs">
              <span className="text-base-content font-mono">Status:</span>
              <span className={`font-mono font-bold flex items-center gap-1 ${meta.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
            </div>
          </div>
        </div>

        {/* Dispatch Position Sync */}
        <div className="md:col-span-6 bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-2.5">
          <span className="text-3xs text-slate-400 uppercase tracking-widest font-mono font-bold flex items-center gap-1.5">
            <Satellite className="h-3 w-3 text-indigo-400" />
            Dispatch Position Sync
          </span>
          <p className="text-3xs text-slate-400 leading-relaxed font-sans">
            While GPS is on, your position is periodically reported to dispatch
            so your truck shows correctly on the fleet map and stop check-ins
            can be verified.
          </p>
          <div className="flex justify-between text-2xs">
            <span className="text-base-content font-mono">Last synced:</span>
            <span className="font-mono text-indigo-300 font-bold">
              {lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString() : "Not synced yet"}
            </span>
          </div>
        </div>
      </div>

      {/* DEV-only Simulation Panel (never shipped in production builds) */}
      {isDev && (
        <div className="space-y-2 border-t border-amber-500/20 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-3xs text-amber-300 uppercase tracking-widest font-mono font-bold">
              Dev-Only GPS Simulation
            </span>
            <button
              type="button"
              onClick={() => setSimulateMode((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg text-3xs font-bold font-mono border transition-all cursor-pointer ${simulateMode
                ? "bg-amber-500/20 border-amber-500/50 text-amber-200"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                }`}
            >
              {simulateMode ? "Simulation: ON" : "Simulation: OFF"}
            </button>
          </div>

          {simulateMode && (
            <>
              <p className="text-3xs text-slate-300 leading-relaxed font-sans">
                Simulation overrides the live GPS feed for local testing only
                (import.meta.env.DEV). Teleport near a stop to test the 500 m
                check-in geofence:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {myShipment?.waypoints?.map((wpt, idx) => {
                  if (wpt.status === "completed" || wpt.lat == null || wpt.lng == null)
                    return null;
                  return (
                    <button
                      key={wpt.id}
                      type="button"
                      onClick={() =>
                        setSimulatedLocation({ lat: wpt.lat, lng: wpt.lng })
                      }
                      className="py-1.5 px-2.5 bg-amber-600/15 hover:bg-amber-600/30 border border-amber-500/30 hover:border-amber-500 rounded-lg text-3xs font-bold text-amber-200 hover:text-white transition-all text-left flex items-center space-x-1.5 cursor-pointer truncate"
                      title={`Teleport to ${wpt.companyName || `Stop #${idx + 1}`}`}
                    >
                      <MapPin className="h-3 w-3 shrink-0 text-amber-400" />
                      <span className="truncate">Teleport to Stop #{idx + 1}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() =>
                    setSimulatedLocation({ lat: 42.3314, lng: -83.0458 })
                  }
                  className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-3xs font-bold text-slate-300 hover:text-white transition-all text-left flex items-center space-x-1.5 cursor-pointer"
                >
                  <RefreshCcw className="h-3 w-3 text-slate-400 shrink-0" />
                  <span>Reset (Detroit — Out of Range)</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

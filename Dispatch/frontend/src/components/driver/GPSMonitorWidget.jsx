import React from "react";
import { Compass, MapPin, RefreshCcw, ShieldAlert } from "lucide-react";

export default function GPSMonitorWidget({
  driverLocation,
  setDriverLocation,
  isLiveGps,
  setIsLiveGps,
  gpsError,
  myShipment,
}) {
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
              Real-Time GPS Geofence Monitor
            </h3>
            <p className="text-3xs text-indigo-200/70 font-mono uppercase mt-0.5">
              SAMSARA SECURE GEOFENCING TELEMETRY
            </p>
          </div>
        </div>

        {/* Live Device GPS Toggle */}
        <button
          type="button"
          onClick={() => setIsLiveGps((prev) => !prev)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center space-x-2 cursor-pointer ${
            isLiveGps
              ? "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 shadow-md"
              : "bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/40"
          }`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isLiveGps ? "bg-white animate-pulse" : "bg-indigo-500"
            }`}
          />
          <span>
            {isLiveGps ? "Device GPS: Connected" : "Connect Device GPS"}
          </span>
        </button>
      </div>

      {gpsError && (
        <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-200 text-2xs flex items-start space-x-2 font-mono">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
          <span>{gpsError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Telemetry Display */}
        <div className="md:col-span-5 bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-2.5">
          <span className="text-3xs text-slate-400 uppercase tracking-widest font-mono font-bold block">
            Current Driver Telemetry
          </span>
          <div className="space-y-1.5">
            <div className="flex justify-between text-2xs">
              <span className="text-slate-500 font-mono">Latitude:</span>
              <span className="font-mono text-indigo-300 font-bold">
                {driverLocation?.lat?.toFixed(6) ?? "0.000000"}
              </span>
            </div>
            <div className="flex justify-between text-2xs">
              <span className="text-slate-500 font-mono">Longitude:</span>
              <span className="font-mono text-indigo-300 font-bold">
                {driverLocation?.lng?.toFixed(6) ?? "0.000000"}
              </span>
            </div>
            <div className="flex justify-between text-2xs">
              <span className="text-slate-500 font-mono">Status:</span>
              <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {isLiveGps ? "HTML5 Browser Feed" : "Simulated GPS"}
              </span>
            </div>
          </div>
        </div>

        {/* Simulation Action Panel */}
        <div className="md:col-span-7 space-y-2">
          <span className="text-3xs text-slate-400 uppercase tracking-widest font-mono font-bold block">
            Sandbox Teleport Shortcuts
          </span>
          <p className="text-3xs text-slate-300 leading-relaxed font-sans">
            To sign a stop, you must be physically within 500m of its
            coordinates. Use quick shortcuts below to teleport there instantly
            for sandbox testing:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {myShipment?.waypoints?.map((wpt, idx) => {
              if (wpt.status === "completed") return null;
              return (
                <button
                  key={wpt.id}
                  type="button"
                  onClick={() => {
                    setDriverLocation({ lat: wpt.lat, lng: wpt.lng });
                    setIsLiveGps(false);
                  }}
                  className="py-1.5 px-2.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 hover:border-indigo-500 rounded-lg text-3xs font-bold text-indigo-200 hover:text-white transition-all text-left flex items-center space-x-1.5 cursor-pointer truncate"
                  title={`Teleport to ${wpt.companyName}`}
                >
                  <MapPin className="h-3 w-3 shrink-0 text-indigo-400" />
                  <span className="truncate">Teleport to Stop #{idx + 1}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setDriverLocation({ lat: 42.3314, lng: -83.0458 });
                setIsLiveGps(false);
              }}
              className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-3xs font-bold text-slate-300 hover:text-white transition-all text-left flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCcw className="h-3 w-3 text-slate-400 shrink-0" />
              <span>Reset GPS (Detroit - Out of Range)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { AlertOctagon, PhoneCall, ShieldAlert, X, Check } from "lucide-react";

export default function SOSBeaconModal({
  sosActive,
  sosSecondsLeft,
  triggerSOS,
  cancelSOS,
  confirmSOSNow,
}) {
  return (
    <>
      {/* Floating Emergency SOS Trigger Button */}
      <div className="fixed bottom-20 right-4 z-40 sm:bottom-6 sm:right-6">
        <button
          type="button"
          onClick={triggerSOS}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-mono font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-rose-950/40 hover:shadow-rose-600/30 transition-all cursor-pointer border border-rose-400/30 active:scale-95"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-200 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <AlertOctagon className="h-4 w-4" />
          <span>Emergency SOS</span>
        </button>
      </div>

      {/* SOS Active Countdown Overlay Modal */}
      {sosActive && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-600/80 rounded-3xl w-full max-w-lg p-6 sm:p-8 text-center text-white shadow-2xl relative overflow-hidden space-y-6 animate-in fade-in zoom-in duration-200">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative inline-flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-rose-600/20 border-2 border-rose-500/40 flex items-center justify-center animate-pulse">
                <ShieldAlert className="h-12 w-12 text-rose-500" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-black font-mono text-white">
                  {sosSecondsLeft}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tight text-white font-mono">
                Emergency Beacon Primed
              </h2>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Dispatch, Safety Operations, and Local Authorities will be
                notified with your exact GPS telemetry coordinates in{" "}
                <strong className="text-rose-400 font-mono">
                  {sosSecondsLeft} seconds
                </strong>
                .
              </p>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-left space-y-1.5 font-mono text-2xs">
              <div className="flex justify-between text-slate-400">
                <span>INCIDENT TYPE:</span>
                <span className="text-rose-400 font-bold">
                  HIGH PRIORITY SOS BEACON
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>AUTOMATIC DISPATCH:</span>
                <span className="text-emerald-400 font-bold">
                  KEITH (DISPATCH LEAD)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={cancelSOS}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold uppercase font-mono tracking-wider transition-colors cursor-pointer border border-slate-700"
              >
                Cancel Beacon
              </button>
              <button
                type="button"
                onClick={confirmSOSNow}
                className="py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase font-mono tracking-wider transition-colors cursor-pointer shadow-lg shadow-rose-950/50 flex items-center justify-center gap-1.5"
              >
                <PhoneCall className="h-4 w-4" />
                <span>Broadcast Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

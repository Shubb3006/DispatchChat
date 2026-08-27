import React from "react";
import { Clock, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function HOSClockWidget({ myHOSLog }) {
  if (!myHOSLog) return null;

  const drivingHours = Math.floor(
    (myHOSLog.drivingSecondsRemaining || 0) / 3600
  );
  const drivingMins = Math.floor(
    ((myHOSLog.drivingSecondsRemaining || 0) % 3600) / 60
  );

  const dutyHours = Math.floor((myHOSLog.dutySecondsRemaining || 0) / 3600);
  const dutyMins = Math.floor(
    ((myHOSLog.dutySecondsRemaining || 0) % 3600) / 60
  );

  const cycleHours = Math.floor((myHOSLog.cycleSecondsRemaining || 0) / 3600);

  const breakHours = Math.floor((myHOSLog.breakSecondsRemaining || 0) / 3600);
  const breakMins = Math.floor(
    ((myHOSLog.breakSecondsRemaining || 0) % 3600) / 60
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
              Samsara Active ELD Clock (Hours of Service)
            </h3>
            <p className="text-3xs text-slate-400 font-mono mt-0.5">
              FMCSA COMPLIANCE LOG • CARRIER USDOT 3821092-A
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
          ELD Active
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Driving Time */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-center space-y-1">
          <span className="text-3xs font-mono font-bold text-slate-500 uppercase block">
            Driving Time
          </span>
          <div
            className={`text-xl font-black font-mono ${
              myHOSLog?.current_status === "D"
                ? "text-indigo-600"
                : "text-slate-800"
            }`}
          >
            {drivingHours}h {drivingMins}m
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-indigo-600 h-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  ((myHOSLog.drivingSecondsRemaining || 0) / 39600) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* On-Duty Time */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-center space-y-1">
          <span className="text-3xs font-mono font-bold text-slate-500 uppercase block">
            On-Duty Time
          </span>
          <div className="text-xl font-black font-mono text-slate-800">
            {dutyHours}h {dutyMins}m
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-emerald-600 h-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  ((myHOSLog.dutySecondsRemaining || 0) / 50400) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* 70-Hr Cycle */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-center space-y-1">
          <span className="text-3xs font-mono font-bold text-slate-500 uppercase block">
            70-Hr Cycle Remaining
          </span>
          <div className="text-xl font-black font-mono text-slate-800">
            {cycleHours}h
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-slate-600 h-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  ((myHOSLog.cycleSecondsRemaining || 0) / 252000) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Next Mandatory Rest */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-center space-y-1">
          <span className="text-3xs font-mono font-bold text-slate-500 uppercase block">
            Next Mandatory Rest
          </span>
          <div className="text-xl font-black font-mono text-rose-600">
            In {breakHours}h {breakMins}m
          </div>
          <span className="text-3xs text-slate-400 font-mono block">
            30-min break required
          </span>
        </div>
      </div>
    </div>
  );
}

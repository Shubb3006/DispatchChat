import React from "react";
import { Clock, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function HOSClockWidget({ myHOSLog }) {
  if (!myHOSLog) return null;

  // Backend hos_logs rows are snake_case (driving_seconds_remaining, ...);
  // keep camelCase fallbacks for any locally-constructed log objects.
  const drivingSec =
    Number(myHOSLog.driving_seconds_remaining ?? myHOSLog.drivingSecondsRemaining) || 0;
  const dutySec =
    Number(myHOSLog.duty_seconds_remaining ?? myHOSLog.dutySecondsRemaining) || 0;
  const cycleSec =
    Number(myHOSLog.cycle_seconds_remaining ?? myHOSLog.cycleSecondsRemaining) || 0;
  const breakSec =
    Number(myHOSLog.break_seconds_remaining ?? myHOSLog.breakSecondsRemaining) || 0;

  const drivingHours = Math.floor(drivingSec / 3600);
  const drivingMins = Math.floor((drivingSec % 3600) / 60);

  const dutyHours = Math.floor(dutySec / 3600);
  const dutyMins = Math.floor((dutySec % 3600) / 60);

  const cycleHours = Math.floor(cycleSec / 3600);

  const breakHours = Math.floor(breakSec / 3600);
  const breakMins = Math.floor((breakSec % 3600) / 60);

  return (
    <div className="bg-base-100 rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
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
        <div className="bg-base-200 p-3.5 rounded-xl border border-slate-200/60 text-center space-y-1">
          <span className="text-3xs font-mono font-bold text-base-content uppercase block">
            Driving Time
          </span>
          <div
            className={`text-xl font-black font-mono ${myHOSLog?.current_status === "D"
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
                width: `${Math.min((drivingSec / 39600) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* On-Duty Time */}
        <div className="bg-base-200 p-3.5 rounded-xl border border-slate-200/60 text-center space-y-1">
          <span className="text-3xs font-mono font-bold text-base-content uppercase block">
            On-Duty Time
          </span>
          <div className="text-xl font-black font-mono text-slate-800">
            {dutyHours}h {dutyMins}m
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-emerald-600 h-full transition-all duration-300"
              style={{
                width: `${Math.min((dutySec / 50400) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* 70-Hr Cycle */}
        <div className="bg-base-200 p-3.5 rounded-xl border border-slate-200/60 text-center space-y-1">
          <span className="text-3xs font-mono font-bold text-base-content uppercase block">
            70-Hr Cycle Remaining
          </span>
          <div className="text-xl font-black font-mono text-slate-800">
            {cycleHours}h
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-slate-600 h-full transition-all duration-300"
              style={{
                width: `${Math.min((cycleSec / 252000) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Next Mandatory Rest */}
        <div className="bg-base-200 p-3.5 rounded-xl border border-slate-200/60 text-center space-y-1">
          <span className="text-3xs font-mono font-bold text-base-content uppercase block">
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

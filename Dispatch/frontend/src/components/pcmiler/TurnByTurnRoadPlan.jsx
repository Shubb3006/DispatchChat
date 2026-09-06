import React from "react";
import { ShieldAlert, Navigation } from "lucide-react";

export default function TurnByTurnRoadPlan({ route }) {
  if (!route || !route.roadPlan || route.roadPlan.length === 0) return null;

  const is3Axle = route.is3Axle;
  const legCount = route.legs?.length ?? 0;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">
                Turn-by-Turn Road Plan
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black font-mono bg-sky-50 text-sky-700 border border-sky-200">
                {route.roadPlan.length} STEPS
              </span>
              {legCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black font-mono bg-slate-100 text-slate-600 border border-slate-200">
                  {legCount} {legCount === 1 ? "LEG" : "LEGS"}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              Manoeuvres exactly as returned by {route.provider}. Toll plazas are not priced per step by the routing
              provider and are therefore not shown here.
            </p>
          </div>
        </div>

        <div className="text-right font-mono text-xs">
          <span className="text-slate-400 font-normal">Active Axle Setup:</span>{" "}
          <strong className="text-sky-800 font-extrabold">
            {is3Axle ? "3-Axle Tridem (Canada Local)" : "2-Axle (Cross-Border)"}
          </strong>
        </div>
      </div>

      {/* Car-profile caution — the manoeuvres are not truck-legal in this case */}
      {!route.isTruckProfile && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-[11px] font-mono text-amber-900 flex items-start gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong className="font-black">Car profile:</strong> these manoeuvres were generated without truck
            restrictions. Verify clearances, weight limits and truck-designated roads before dispatching.
          </span>
        </div>
      )}

      {/* Sequential Route Steps List */}
      <div className="space-y-3">
        {route.roadPlan.map((step) => (
          <div
            key={step.step}
            className={`border rounded-2xl p-4 transition space-y-2.5 ${
              step.isLegHeader
                ? "bg-sky-50/70 border-sky-200 hover:bg-sky-50"
                : "bg-slate-50/70 border-slate-200/90 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {/* Step Number Badge */}
                <div
                  className={`w-7 h-7 rounded-xl text-white font-mono font-black text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                    step.isLegHeader ? "bg-sky-600" : "bg-slate-900"
                  }`}
                >
                  {step.step}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-black font-mono shadow-2xs border ${
                        step.isLegHeader
                          ? "bg-white text-sky-800 border-sky-300"
                          : "bg-white text-slate-900 border-slate-300"
                      }`}
                    >
                      {step.highway}
                    </span>

                    <span className="text-xs font-bold text-slate-500 font-mono">
                      {step.distanceMiles} mi • ~{step.driveMins} mins
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-900 leading-relaxed">{step.instruction}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import React from "react";
import {
  MapPin,
  Truck,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CreditCard,
  Clock,
  Compass,
  FileText,
  Navigation,
} from "lucide-react";

export default function TurnByTurnRoadPlan({ route }) {
  if (!route || !route.roadPlan || route.roadPlan.length === 0) return null;

  const is3Axle = route.is3Axle;

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
                Exact Commercial Turn-by-Turn Road Plan
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black font-mono bg-sky-50 text-sky-700 border border-sky-200">
                {route.roadPlan.length} ROUTE LEGS
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              Specific highway segments, weigh stations, MTO/DOT inspection points, and 5-axle commercial toll plazas.
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

      {/* Sequential Route Steps List */}
      <div className="space-y-3">
        {route.roadPlan.map((step) => {
          const tollFee = is3Axle ? step.toll3Axle : step.toll2Axle;
          const isTollStep = !!step.tollFacility;

          return (
            <div
              key={step.step}
              className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 hover:bg-slate-50 transition space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {/* Step Number Badge */}
                  <div className="w-7 h-7 rounded-xl bg-slate-900 text-white font-mono font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {step.step}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-black font-mono bg-white text-slate-900 border border-slate-300 shadow-2xs">
                        {step.highway}
                      </span>

                      <span className="text-xs font-bold text-slate-500 font-mono">
                        {step.distanceMiles} mi • ~{step.driveMins} mins
                      </span>

                      {isTollStep && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black font-mono bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          <span>Toll: ${tollFee?.toFixed(2)} USD</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-bold text-slate-900 leading-relaxed">
                      {step.instruction}
                    </div>
                  </div>
                </div>
              </div>

              {/* Commercial Advisory / Weigh Scale / Inspection Station */}
              {step.advisory && (
                <div className="ml-10 bg-white border border-slate-200 rounded-xl p-2 text-[11px] font-mono text-slate-600 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>
                    <strong className="text-slate-800">Commercial Advisory:</strong> {step.advisory}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

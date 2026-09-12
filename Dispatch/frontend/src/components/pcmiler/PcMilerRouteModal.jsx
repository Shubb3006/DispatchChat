import React, { useState } from "react";
import { usePcMilerStore } from "../../stores/usePcMilerStore";
import {
  X,
  Compass,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  Route,
} from "lucide-react";

const num = (value, digits = 1) =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? "—"
    : Number(value).toFixed(digits);

const money = (value) =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? "—"
    : `$${Number(value).toFixed(2)}`;

export default function PcMilerRouteModal({
  isOpen,
  onClose,
  initialOrigin = "",
  initialDestination = "",
}) {
  const { currentRoute, error, calculateRoute, isLoading } = usePcMilerStore();

  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);
  const [profile, setProfile] = useState("PRACTICAL"); // "PRACTICAL" | "SHORTEST" | "TOLL_DISCOURAGED"

  if (!isOpen) return null;

  const handleCalculate = (selectedProfile = profile) => {
    if (!origin.trim() || !destination.trim()) return;
    calculateRoute({
      origin,
      destination,
      routingProfile: selectedProfile,
    });
  };

  const route = currentRoute;
  const fuel = route?.fuel || {};
  const restrictions = route?.restrictions || {};
  const routedAgainst = restrictions.routedAgainst || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-base-100 border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-base-content animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-base-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-base-content">
                  Commercial Routing &amp; Border Toll Calculator
                </h2>
                {route && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black font-mono border ${route.isTruckProfile
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-amber-50 text-amber-800 border-amber-300"
                      }`}
                  >
                    {route.provider}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-base-content font-mono">
                Live routed miles, drive time and fuel burn. Highway tolls are not priced by the routing provider.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-base-content hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-base-100 text-xs">
          {/* Corridor Input & Profile Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-base-200 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Origin City / Postal Code</label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-sky-600" />
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. Toronto, ON"
                  className="w-full pl-8 pr-3 py-1.5 bg-base-100 border border-slate-200 rounded-xl font-bold text-base-content text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Destination City / Zip Code</label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Chicago, IL"
                  className="w-full pl-8 pr-3 py-1.5 bg-base-100 border border-slate-200 rounded-xl font-bold text-base-content text-xs"
                />
              </div>
            </div>
          </div>

          {/* 3 Routing Profile Selector */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "PRACTICAL", label: "Practical Route", desc: "Provider's recommended lane" },
              { id: "SHORTEST", label: "Shortest Route", desc: "Minimum routed distance" },
              { id: "TOLL_DISCOURAGED", label: "Tollways Avoided", desc: "Requires a truck routing key" },
            ].map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => {
                  setProfile(p.id);
                  handleCalculate(p.id);
                }}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition ${profile === p.id
                  ? "bg-sky-50 border-sky-400 text-sky-900 ring-2 ring-sky-200 shadow-2xs"
                  : "bg-base-200 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
              >
                <div className="font-extrabold text-xs">{p.label}</div>
                <div className="text-[10px] text-base-content mt-0.5 font-medium">{p.desc}</div>
              </button>
            ))}
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="text-xs font-black text-rose-950 uppercase">Route could not be calculated</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black font-mono bg-rose-100 text-rose-800 border border-rose-300">
                  {error.code}
                </span>
              </div>
              <p className="text-[11px] text-rose-900 font-medium">{error.message}</p>
              {error.code === "GEOCODE_FAILED" && error.address && (
                <p className="text-[11px] text-rose-900 font-mono">
                  Fix this stop: <strong>&ldquo;{error.address}&rdquo;</strong>
                </p>
              )}
            </div>
          )}

          {/* Empty State */}
          {!route && !error && (
            <div className="border border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center text-center gap-2">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                <Route className="w-5 h-5" />
              </div>
              <div className="text-xs font-black text-base-content uppercase">No route calculated yet</div>
              <p className="text-[11px] text-base-content max-w-sm">
                Enter an origin and destination, then pick a routing profile. Mileage, fuel and tolls appear only once
                the routing provider returns a route.
              </p>
            </div>
          )}

          {route && (
            <>
              {/* Provider caution */}
              {(!route.isTruckProfile || route.warnings?.length > 0) && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase font-mono text-amber-950">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {route.isTruckProfile
                        ? "Routing advisories"
                        : "Car profile — truck restrictions not applied"}
                    </span>
                  </div>
                  {route.warnings?.map((warning, idx) => (
                    <div
                      key={idx}
                      className="bg-base-100/70 border border-amber-200 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-amber-900 flex items-start gap-2"
                    >
                      <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Primary Route Output Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xs font-mono">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Routed Miles</div>
                  <div className="text-2xl font-black text-sky-400 mt-0.5">{num(route.officialMiles)} mi</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{num(route.driveHours, 2)}h Driving</div>
                </div>

                <div className="bg-base-100 border border-slate-200 p-4 rounded-2xl shadow-xs font-mono">
                  <div className="text-[10px] text-base-content font-bold uppercase">Tolls (Partial)</div>
                  <div className="text-2xl font-black text-base-content mt-0.5">{money(route.totalTolls)}</div>
                  <div className="text-[10px] text-amber-700 font-bold mt-0.5">
                    {route.tollsAreComplete ? "Complete" : "Excludes highway tolls"}
                  </div>
                </div>

                <div className="bg-base-100 border border-slate-200 p-4 rounded-2xl shadow-xs font-mono">
                  <div className="text-[10px] text-base-content font-bold uppercase">Est. Fuel Consumption</div>
                  <div className="text-2xl font-black text-base-content mt-0.5">{num(fuel.gallons)} gal</div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                    {money(fuel.cost)} @ {money(fuel.dieselPricePerGal)}/gal
                  </div>
                </div>

                <div className="bg-base-100 border border-slate-200 p-4 rounded-2xl shadow-xs font-mono">
                  <div className="text-[10px] text-base-content font-bold uppercase">Border Port Clearance</div>
                  <div className="text-xs font-black text-purple-700 mt-1 truncate">
                    {route.borderCrossing || "None on this lane"}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                    {route.isCrossBorder ? "Cross-border lane" : "Domestic lane"}
                  </div>
                </div>
              </div>

              {/* Priced Toll Facilities */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-base-content uppercase text-[11px]">
                    Priced Toll Facilities
                  </span>
                  <span className="font-mono text-[10px] text-base-content">{route.tollNote}</span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-mono font-bold text-[10px] uppercase border-b border-slate-200">
                        <th className="py-2.5 px-3">Facility</th>
                        <th className="py-2.5 px-3">State/Prov</th>
                        <th className="py-2.5 px-3">Axle Category</th>
                        <th className="py-2.5 px-3 text-right">Published Fee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                      {!route.tollPlazas || route.tollPlazas.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-3 px-3 text-center text-slate-400 font-mono">
                            No priced facility on this route.
                          </td>
                        </tr>
                      ) : (
                        route.tollPlazas.map((tp, idx) => (
                          <tr key={idx} className="hover:bg-base-200 font-mono">
                            <td className="py-2 px-3 font-semibold text-base-content">{tp.name}</td>
                            <td className="py-2 px-3 text-base-content">{tp.state}</td>
                            <td className="py-2 px-3 text-base-content">{tp.axleCategory}</td>
                            <td className="py-2 px-3 text-right font-bold text-base-content">{money(tp.cost)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Vehicle profile the route was computed against */}
              <div
                className={`rounded-2xl p-3.5 flex items-center justify-between gap-3 border ${restrictions.enforcedByProvider
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-amber-50 border-amber-300"
                  }`}
              >
                <div className="flex items-center gap-2">
                  {restrictions.enforcedByProvider ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <div
                      className={`font-bold text-xs ${restrictions.enforcedByProvider ? "text-emerald-950" : "text-amber-950"
                        }`}
                    >
                      {restrictions.enforcedByProvider
                        ? "Vehicle restrictions enforced by the router"
                        : "Vehicle restrictions were NOT applied to this route"}
                    </div>
                    <div
                      className={`text-[10px] font-medium font-mono ${restrictions.enforcedByProvider ? "text-emerald-700" : "text-amber-800"
                        }`}
                    >
                      Routed against: {routedAgainst.height ?? "—"} m H • {routedAgainst.width ?? "—"} m W •{" "}
                      {routedAgainst.length ?? "—"} m L • {routedAgainst.weight ?? "—"} t •{" "}
                      {routedAgainst.axleload ?? "—"} t/axle
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black font-mono border shrink-0 ${restrictions.isWeightCompliant
                    ? "bg-base-100 text-slate-700 border-slate-300"
                    : "bg-rose-100 text-rose-800 border-rose-300"
                    }`}
                >
                  {restrictions.isWeightCompliant ? "WITHIN DECLARED LIMIT" : "OVER DECLARED LIMIT"}
                </span>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold cursor-pointer transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => handleCalculate()}
              disabled={isLoading || !origin.trim() || !destination.trim()}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Compass className="w-4 h-4" />
              <span>{isLoading ? "Routing..." : "Calculate Route"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

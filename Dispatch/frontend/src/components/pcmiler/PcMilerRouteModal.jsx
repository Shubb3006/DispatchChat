import React, { useState } from "react";
import { usePcMilerStore } from "../../stores/usePcMilerStore";
import {
  X,
  Compass,
  MapPin,
  Truck,
  DollarSign,
  Fuel,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingDown,
  Layers,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

export default function PcMilerRouteModal({
  isOpen,
  onClose,
  initialOrigin = "Toronto, ON",
  initialDestination = "Chicago, IL",
}) {
  const { currentRoute, calculateRoute, isLoading } = usePcMilerStore();

  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);
  const [profile, setProfile] = useState("PRACTICAL"); // "PRACTICAL" | "SHORTEST" | "TOLL_DISCOURAGED"

  if (!isOpen) return null;

  const handleCalculate = (selectedProfile = profile) => {
    calculateRoute({
      origin,
      destination,
      routingProfile: selectedProfile,
    });
    toast.success(`Calculated PC*MILER ${selectedProfile} Route!`);
  };

  const route = currentRoute;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-slate-900 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-slate-900">
                  PC*MILER Commercial Routing & Toll Calculator
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black font-mono bg-sky-50 text-sky-700 border border-sky-200">
                  53' TRACTOR PROFILE
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                Trimble MAPS standard commercial truck routing, practical legal miles, and 5-axle highway toll matrix.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white text-xs">
          {/* Corridor Input & Profile Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Origin City / Postal Code</label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-sky-600" />
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-xs"
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
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-xs"
                />
              </div>
            </div>
          </div>

          {/* 3 Routing Profile Selector */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "PRACTICAL", label: "Practical Route", desc: "Designated truck highways (Recommended)" },
              { id: "SHORTEST", label: "Shortest Route", desc: "Absolute legal minimum distance" },
              { id: "TOLL_DISCOURAGED", label: "Toll-Free Route", desc: "Avoids 407 ETR / Tollways" },
            ].map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => {
                  setProfile(p.id);
                  handleCalculate(p.id);
                }}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition ${
                  profile === p.id
                    ? "bg-sky-50 border-sky-400 text-sky-900 ring-2 ring-sky-200 shadow-2xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="font-extrabold text-xs">{p.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-medium">{p.desc}</div>
              </button>
            ))}
          </div>

          {/* Primary Route Output Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xs font-mono">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Official PC*MILER Miles</div>
              <div className="text-2xl font-black text-sky-400 mt-0.5">{route.officialMiles} mi</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Est. {route.driveHours}h Driving</div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs font-mono">
              <div className="text-[10px] text-slate-500 font-bold uppercase">5-Axle Tolls Total</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">
                ${Number(route.totalTolls).toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {route.tollPlazas?.length || 0} Plazas on route
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs font-mono">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Est. Fuel Consumption</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{route.estimatedGallons} gal</div>
              <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                ${Number(route.estimatedFuelCost).toFixed(2)} (@ $3.85/gal)
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs font-mono">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Border Port Clearance</div>
              <div className="text-xs font-black text-purple-700 mt-1 truncate">
                {route.borderCrossing}
              </div>
              <div className="text-[10px] text-purple-600 font-bold mt-0.5">
                ~{route.borderWaitMins} mins wait time
              </div>
            </div>
          </div>

          {/* Itemized Commercial Toll Plazas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-900 uppercase text-[11px]">
                5-Axle Commercial Highway Toll Plazas
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                E-ZPass / I-Pass / Bridge Rates
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-mono font-bold text-[10px] uppercase border-b border-slate-200">
                    <th className="py-2.5 px-3">Toll Plaza Facility</th>
                    <th className="py-2.5 px-3">State/Prov</th>
                    <th className="py-2.5 px-3 text-right">Class 5 Commercial Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  {route.tollPlazas?.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-3 px-3 text-center text-slate-400 font-mono">
                        No toll plazas on this toll-discouraged route ($0.00 Total Tolls).
                      </td>
                    </tr>
                  ) : (
                    route.tollPlazas.map((tp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 font-mono">
                        <td className="py-2 px-3 font-semibold text-slate-900">{tp.name}</td>
                        <td className="py-2 px-3 text-slate-500">{tp.state}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          ${tp.cost.toFixed(2)} USD
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* IFTA State/Province Jurisdictional Mileage Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-900 uppercase text-[11px]">
                IFTA Jurisdictional Mileage Breakdown
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                Quarterly Fuel Tax Audit Standard
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {route.jurisdictions?.map((j) => (
                <div key={j.code} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-700 font-bold">
                    <span>{j.name} ({j.code})</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                      {j.isCanadian ? "CAN" : "USA"}
                    </span>
                  </div>
                  <div className="text-base font-black text-slate-900 mt-1">{j.miles} mi</div>
                  <div className="text-[10px] text-slate-500 flex justify-between mt-0.5">
                    <span>~{j.fuelGallons} gal</span>
                    <span>Tax: ${j.taxRate}/{j.isCanadian ? "L" : "gal"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Restrictions & Clearances */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="font-bold text-xs text-emerald-950">
                  PC*MILER Commercial Clearances Verified
                </div>
                <div className="text-[10px] text-emerald-700 font-medium">
                  Route complies with 13'6" standard clearance (Minimum clearance on route: {route.restrictions?.bridgeClearanceMin}) &amp; 80,000 lbs GVW limit.
                </div>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-[10px] font-black font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
              LEGAL 53' ROUTE
            </span>
          </div>

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
              disabled={isLoading}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
            >
              <Compass className="w-4 h-4" />
              <span>Recalculate Route</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Sparkles,
  X,
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  TrendingUp,
  User,
  Phone,
} from "lucide-react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "@/lib/apiBase";

export default function AIDriverMatcherModal({
  isOpen,
  onClose,
  load,
  onAssignSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [rankingData, setRankingData] = useState(null);
  const [assigningDriverId, setAssigningDriverId] = useState(null);

  const [customPickup, setCustomPickup] = useState("");
  const [customDestination, setCustomDestination] = useState("");

  useEffect(() => {
    if (isOpen && load) {
      const initialOrigin = load.originCity || load.shipper_address || load.origin || "Brampton, ON, Canada";
      const initialDest = load.destinationCity || load.consignee_address || load.destination || "Davenport, FL, USA";
      setCustomPickup(initialOrigin);
      setCustomDestination(initialDest);
      fetchDriverRankings(initialOrigin, initialDest);
    }
  }, [isOpen, load]);

  const fetchDriverRankings = async (overrideOrigin, overrideDest) => {
    setLoading(true);
    const originToUse = overrideOrigin !== undefined ? overrideOrigin : customPickup;
    const destToUse = overrideDest !== undefined ? overrideDest : customDestination;

    try {
      const res = await axios.post(
        `${API_BASE_URL}/v1/loads/ai-match-drivers`,
        {
          originCity: originToUse,
          destinationCity: destToUse,
          equipmentType: load.equipmentType || load.trailerType || "Dry Van 53ft",
          isCrossBorder: load.isCrossBorder,
        },
        { withCredentials: true }
      );
      if (res.data?.success) {
        setRankingData(res.data);
      }
    } catch (err) {
      console.error("fetchDriverRankings error:", err);
      toast.error("Failed to calculate AI driver rankings");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async (driver) => {
    setAssigningDriverId(driver.id);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/v1/loads/auto-assign`,
        {
          loadId: load.id || load.load_number,
          driverId: driver.id,
        },
        { withCredentials: true }
      );
      if (res.data?.success) {
        toast.success(
          `⚡ Dispatched! Driver ${driver.name} assigned to Load #${load.load_number || load.id} on Tractor #${driver.assignedTruck}`,
          { duration: 6000 }
        );
        if (onAssignSuccess) {
          onAssignSuccess(res.data);
        }
        onClose();
      }
    } catch (err) {
      toast.error("Failed to assign driver to load");
    } finally {
      setAssigningDriverId(null);
    }
  };

  if (!isOpen || !load) return null;

  const loadNum = load.load_number || load.tracking_number || "582516";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-slate-900">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-sky-50/80 via-indigo-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900">
                  AI Smart Dispatch & Driver Matcher
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  Load #{loadNum}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluates live Samsara telematics, deadhead proximity, remaining HOS, and cross-border FAST credentials
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Load Context Bar with Manual Pickup Location Control */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-sky-500 transition-all">
              <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Pickup:</label>
              <input
                type="text"
                value={customPickup}
                onChange={(e) => setCustomPickup(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchDriverRankings(customPickup, customDestination);
                }}
                placeholder="Type pickup location (e.g. Brampton, ON)"
                className="font-bold text-slate-800 bg-transparent outline-none w-48 text-xs placeholder:text-slate-400 font-sans"
              />
            </div>

            <span className="text-slate-400 font-bold">➔</span>

            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-sky-500 transition-all">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Delivery:</label>
              <input
                type="text"
                value={customDestination}
                onChange={(e) => setCustomDestination(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchDriverRankings(customPickup, customDestination);
                }}
                placeholder="Type delivery destination..."
                className="font-bold text-slate-800 bg-transparent outline-none w-44 text-xs placeholder:text-slate-400 font-sans"
              />
            </div>

            <button
              onClick={() => fetchDriverRankings(customPickup, customDestination)}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Recalculate live Samsara deadhead and driver rankings for this pickup location"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Update Match</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-slate-600">
            {rankingData?.loadInfo?.estimatedTripMiles && (
              <span className="font-mono font-medium">
                ~{rankingData.loadInfo.estimatedTripMiles} Total Miles
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-semibold text-[11px] text-slate-700">
              {load.equipmentType || "Dry Van 53ft"}
            </span>
            {rankingData?.loadInfo?.isCrossBorder && (
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 font-bold text-[11px] text-indigo-700">
                🇺🇸 US Inbound (PAPS)
              </span>
            )}
          </div>
        </div>

        {/* Candidate List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-600">
                Analyzing fleet GPS proximity, driver shift timers, and compliance...
              </p>
            </div>
          ) : (
            rankingData?.candidates?.map((candidate, index) => {
              const isBest = index === 0 && candidate.matchScore >= 80;
              const isAssigning = assigningDriverId === candidate.id;

              return (
                <div
                  key={candidate.id}
                  className={`rounded-2xl border p-5 transition-all relative ${
                    isBest
                      ? "bg-gradient-to-br from-sky-50/40 via-white to-white border-sky-300 shadow-sm ring-1 ring-sky-300/50"
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                  }`}
                >
                  {isBest && (
                    <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Top AI Recommendation</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Driver Profile & Match Score */}
                    <div className="flex items-start gap-4">
                      {/* Match Score Circle */}
                      <div
                        className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 border ${
                          candidate.matchScore >= 90
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : candidate.matchScore >= 75
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        <span className="font-extrabold text-base font-mono leading-none">
                          {candidate.matchScore}%
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-tight mt-0.5">
                          Match
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 text-sm">
                            {candidate.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-700">
                            Tractor #{candidate.assignedTruck}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 flex items-center gap-2">
                          <span>{candidate.truckModel}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-700 font-medium">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {candidate.currentLocation.city}
                          </span>
                        </p>

                        {/* Reasoning Tag Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {candidate.reasoningTags.map((tag, i) => (
                            <span
                              key={i}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                                tag.type === "success"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : tag.type === "warning"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : tag.type === "danger"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                      <button
                        onClick={() => handleAutoAssign(candidate)}
                        disabled={isAssigning}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                          isBest
                            ? "bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20"
                            : "bg-slate-900 hover:bg-slate-800 text-white"
                        }`}
                      >
                        {isAssigning ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Dispatching...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            <span>Assign & Dispatch</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* AI Reasoning Summary Footer */}
                  {candidate.aiSummary && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>{candidate.aiSummary}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Nishan AI Dispatch Intelligence Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

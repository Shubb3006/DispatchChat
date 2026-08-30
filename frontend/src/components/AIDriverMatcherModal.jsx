import { useState, useEffect } from "react";
import { axiosInstance } from "../lib/axios";
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

export default function AIDriverMatcherModal({
  isOpen,
  onClose,
  load,
  onAssignSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [factorsUsed, setFactorsUsed] = useState([]);
  const [assigningDriverId, setAssigningDriverId] = useState(null);

  useEffect(() => {
    if (isOpen && load) {
      fetchMatches();
    }
  }, [isOpen, load]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.post("/load/ai-match-drivers", { loadId: load.id });
      if (res.data?.ok) {
        setMatches(res.data.matches || []);
        setFactorsUsed(res.data.factors_used || []);
      } else if (res.status === 503) {
        toast.error("Samsara not configured");
      }
    } catch (err) {
      console.error("fetchMatches error:", err);
      toast.error(err.response?.data?.message || "Failed to calculate AI driver rankings");
    } finally {
      setLoading(false);
    }
  };

  const autoAssign = async (driverId, driverName) => {
    setAssigningDriverId(driverId);
    try {
      const res = await axiosInstance.post("/load/auto-assign", { loadId: load.id, driverId });
      if (res.data?.ok) {
        toast.success(`✓ Assigned to ${driverName}`, { duration: 6000 });
        if (onAssignSuccess) {
          onAssignSuccess(res.data.assignment);
        }
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Assignment failed");
    } finally {
      setAssigningDriverId(null);
    }
  };

  if (!isOpen || !load) return null;

  const loadNum = load.load_number || load.tracking_number || "582516";
  const origin = load.originCity || load.shipper_address || "Brampton, ON";
  const destination = load.destinationCity || load.consignee_address || "Chicago, IL";

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

        {/* Load Context Bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="font-bold text-slate-800">{origin}</span>
            <span className="text-slate-400">➔</span>
            <span className="font-bold text-slate-800">{destination}</span>
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
            matches.map((match, index) => {
              const isBest = index === 0 && match.score >= 80;
              const isAssigning = assigningDriverId === match.driver_id;

              return (
                <div
                  key={match.driver_id}
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
                          match.score >= 90
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : match.score >= 75
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        <span className="font-extrabold text-base font-mono leading-none">
                          {match.score}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-tight mt-0.5">
                          Score
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 text-sm">
                            {match.driver_name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-700">
                            {match.truck_number}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 flex items-center gap-2">
                          <span>Position</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-700 font-medium">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {match.current_location || "Unknown"}
                          </span>
                        </p>

                        {match.position_unknown && (
                          <p className="text-xs text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Position unknown
                          </p>
                        )}

                        {/* Factors Breakdown */}
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                          {factorsUsed.map((f) => (
                            <div key={f} className="text-slate-600">
                              <span className="font-semibold">{f}:</span> {match.breakdown[f]}%
                            </div>
                          ))}
                          <div className="text-slate-600">
                            <span className="font-semibold">Deadhead:</span> {match.deadhead_miles} mi
                          </div>
                          <div className="text-slate-600">
                            <span className="font-semibold">HOS:</span> {match.hos_remaining_hours}h
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Score & Action Button */}
                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-sky-600">{match.score}</p>
                      </div>
                      <button
                        onClick={() => autoAssign(match.driver_id, match.driver_name)}
                        disabled={isAssigning}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                          isBest
                            ? "bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20"
                            : "bg-slate-900 hover:bg-slate-800 text-white"
                        } disabled:opacity-50`}
                      >
                        {isAssigning ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Assigning...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            <span>Assign</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

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

import { useState, useEffect, useCallback } from "react";
import { axiosInstance } from "@/lib/axios";
import {
  Sparkles,
  X,
  MapPin,
  AlertTriangle,
  Loader2,
  Zap,
  Clock,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

// Human labels for the factor keys the backend can emit. Only factors that are
// actually present in a match's breakdown are ever rendered — never fake 100s.
const FACTOR_LABELS = {
  proximity: "Proximity",
  hos: "HOS",
  cross_border: "Cross-Border",
  performance: "On-Time Performance",
};

const ERROR_MESSAGES = {
  load_id_required: "No load id was provided to the matcher.",
  not_found: "This load could not be found on the server.",
  samsara_not_configured:
    "Samsara telematics is not configured — live driver positions are unavailable, so AI matching cannot run.",
  samsara_unavailable:
    "Samsara telematics is currently unreachable. Try again in a few minutes.",
};

function formatLocation(loc) {
  if (!loc) return null;
  if (loc.description) return loc.description;
  const lat = Number(loc.lat);
  const lng = Number(loc.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
  }
  return null;
}

export default function AIDriverMatcherModal({
  isOpen,
  onClose,
  load,
  onAssignSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [factorsUsed, setFactorsUsed] = useState([]);
  const [excludedFactors, setExcludedFactors] = useState([]);
  const [loadInfo, setLoadInfo] = useState(null);
  const [matchError, setMatchError] = useState(null);
  const [assignError, setAssignError] = useState(null);
  const [assigningDriverId, setAssigningDriverId] = useState(null);

  const fetchMatches = useCallback(async () => {
    if (!load?.id) {
      setMatchError("This load has no server id, so drivers cannot be matched.");
      return;
    }
    setLoading(true);
    setMatchError(null);
    setAssignError(null);
    try {
      const res = await axiosInstance.post("/load/ai-match-drivers", {
        loadId: load.id,
      });
      if (res.data?.ok) {
        setMatches(res.data.matches || []);
        setFactorsUsed(res.data.factors_used || []);
        setExcludedFactors(res.data.excluded_factors || []);
        setLoadInfo(res.data.load || null);
      } else {
        setMatches([]);
        setMatchError(
          ERROR_MESSAGES[res.data?.error] || res.data?.error || "AI matching failed."
        );
      }
    } catch (err) {
      const code = err.response?.data?.error;
      setMatches([]);
      setMatchError(
        ERROR_MESSAGES[code] ||
          code ||
          err.response?.data?.message ||
          "Failed to reach the AI matching service."
      );
    } finally {
      setLoading(false);
    }
  }, [load?.id]);

  useEffect(() => {
    if (isOpen && load) {
      fetchMatches();
    }
  }, [isOpen, load, fetchMatches]);

  const autoAssign = async (driverId, driverName) => {
    if (!load?.id) return;
    setAssigningDriverId(driverId);
    setAssignError(null);
    try {
      const res = await axiosInstance.post("/load/auto-assign", {
        loadId: load.id,
        driverId,
      });
      if (res.data?.ok && res.data.assignment) {
        toast.success(`Assigned to ${driverName || "driver"}`, { duration: 6000 });
        if (onAssignSuccess) onAssignSuccess(res.data.assignment);
        onClose();
      } else {
        const code = res.data?.error;
        setAssignError(ERROR_MESSAGES[code] || code || "Assignment failed.");
      }
    } catch (err) {
      const code = err.response?.data?.error;
      const msg =
        ERROR_MESSAGES[code] ||
        code ||
        err.response?.data?.message ||
        "Assignment failed.";
      setAssignError(msg);
      toast.error(msg);
    } finally {
      setAssigningDriverId(null);
    }
  };

  if (!isOpen || !load) return null;

  const loadNum = loadInfo?.load_number || load.load_number || load.tracking_number || load.id;
  const origin =
    loadInfo?.origin || load.origin || load.originCity || load.shipper_address || null;
  const destination =
    loadInfo?.destination || load.destination || load.destinationCity || load.consignee_address || null;

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
                Ranks drivers on live Samsara telemetry — only the factors actually computed are shown
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
            <span className="font-bold text-slate-800">{origin || "Origin unknown"}</span>
            <span className="text-slate-400">➔</span>
            <span className="font-bold text-slate-800">{destination || "Destination unknown"}</span>
          </div>

          <div className="flex items-center gap-3 text-slate-600">
            {loadInfo?.estimated_trip_miles != null && (
              <span className="font-mono font-medium">
                ~{loadInfo.estimated_trip_miles} Total Miles
              </span>
            )}
            {loadInfo?.is_cross_border && (
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 font-bold text-[11px] text-indigo-700">
                Cross-Border
              </span>
            )}
          </div>
        </div>

        {/* Factors used */}
        {!loading && !matchError && factorsUsed.length > 0 && (
          <div className="px-6 py-2.5 border-b border-slate-100 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="font-bold text-slate-500 uppercase tracking-wide">Factors used:</span>
            {factorsUsed.map((f) => (
              <span
                key={f}
                className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold"
              >
                {FACTOR_LABELS[f] || f}
              </span>
            ))}
            {excludedFactors.map((ex) => (
              <span
                key={ex.factor}
                title={ex.reason}
                className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 font-semibold line-through"
              >
                {FACTOR_LABELS[ex.factor] || ex.factor}
              </span>
            ))}
          </div>
        )}

        {/* Assignment error (visible, honest) */}
        {assignError && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{assignError}</span>
          </div>
        )}

        {/* Candidate List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-600">
                Analyzing fleet GPS proximity, HOS clocks, and compliance...
              </p>
            </div>
          ) : matchError ? (
            <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
              <AlertTriangle className="w-10 h-10 text-amber-500" />
              <p className="text-sm font-semibold text-slate-700 max-w-md">{matchError}</p>
              <button
                onClick={fetchMatches}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : matches.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
              <AlertTriangle className="w-8 h-8 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">
                No available drivers could be ranked for this load.
              </p>
            </div>
          ) : (
            matches.map((match, index) => {
              const isBest = index === 0 && match.score >= 80;
              const isAssigning = assigningDriverId === match.driver_id;
              const presentFactors = factorsUsed.filter(
                (f) => match.breakdown && match.breakdown[f] !== undefined
              );
              const locationText = formatLocation(match.current_location);

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
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-slate-900 text-sm">
                            {match.driver_name}
                          </h3>
                          {match.truck_number && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-700">
                              {match.truck_number}
                            </span>
                          )}
                          {match.position_unknown && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Position unknown
                            </span>
                          )}
                        </div>

                        {locationText && (
                          <p className="text-xs text-slate-500 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-700 font-medium">{locationText}</span>
                          </p>
                        )}

                        {/* Factors Breakdown — only factors the backend computed */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
                          {presentFactors.map((f) => (
                            <div key={f} className="text-slate-600">
                              <span className="font-semibold">{FACTOR_LABELS[f] || f}:</span>{" "}
                              {match.breakdown[f]}
                            </div>
                          ))}
                          {match.deadhead_miles != null && (
                            <div className="text-slate-600">
                              <span className="font-semibold">Deadhead:</span>{" "}
                              {Math.round(match.deadhead_miles)} mi
                            </div>
                          )}
                          {match.hos_remaining_hours != null && (
                            <div className="text-slate-600 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span className="font-semibold">HOS:</span>{" "}
                              {Number(match.hos_remaining_hours).toFixed(1)}h remaining
                            </div>
                          )}
                        </div>
                        {presentFactors.length === 0 &&
                          match.deadhead_miles == null &&
                          match.hos_remaining_hours == null && (
                            <p className="text-[11px] text-slate-400 italic mt-1">
                              No live scoring factors available for this driver.
                            </p>
                          )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex sm:flex-col items-end justify-end gap-2 shrink-0">
                      <button
                        onClick={() => autoAssign(match.driver_id, match.driver_name)}
                        disabled={assigningDriverId !== null}
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

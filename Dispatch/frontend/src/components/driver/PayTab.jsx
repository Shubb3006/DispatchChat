import React, { useEffect, useState } from "react";
import {
  DollarSign,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  Wallet,
  MinusCircle,
  Route,
} from "lucide-react";
import { axiosInstance } from "@/lib/axios";

const STATUS_BADGES = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  approved: "bg-indigo-50 text-indigo-700 border-indigo-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  void: "bg-rose-50 text-rose-700 border-rose-200",
};

const fmtMoney = (v) =>
  (Number(v) || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
};

export default function PayTab() {
  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        // FROZEN CONTRACT: GET /api/settlement/me →
        // { ok, settlements:[{id, period_start, period_end, status, gross_pay,
        //   total_deductions, net_pay, deductions:[...], lines:[...]}] }
        const response = await axiosInstance.get("/settlement/me");
        if (cancelled) return;
        if (response.data?.ok) {
          setSettlements(response.data.settlements || []);
        } else {
          setError(response.data?.error || "Failed to load settlements.");
        }
      } catch (err) {
        if (cancelled) return;
        const serverMsg =
          err.response?.data?.error || err.response?.data?.message;
        if (err.response?.status === 404) {
          setError(
            serverMsg || "No driver profile is linked to this account."
          );
        } else if (err.response?.status === 403 || err.response?.status === 401) {
          setError(serverMsg || "Not authorized to view driver settlements.");
        } else {
          setError(serverMsg || "Could not reach the settlement service.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-base-100 rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
              My Pay &amp; Settlements
            </h3>
            <p className="text-3xs text-slate-400 font-mono mt-0.5">
              LAST {settlements.length || 0} SETTLEMENT PERIODS • NEWEST FIRST
            </p>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-10 text-slate-400 text-xs font-mono">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading settlements…
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-2xs flex items-start space-x-2 font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Honest empty state */}
        {!isLoading && !error && settlements.length === 0 && (
          <div className="text-center py-10 space-y-1.5">
            <DollarSign className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">
              No settlements yet
            </p>
            <p className="text-2xs text-slate-400 max-w-xs mx-auto">
              Once payroll generates a settlement for your loads, it will
              appear here with a full per-load pay breakdown.
            </p>
          </div>
        )}

        {/* Settlement List */}
        {!isLoading && !error && settlements.length > 0 && (
          <div className="mt-4 space-y-3">
            {settlements.map((stl) => {
              const isOpen = expandedId === stl.id;
              const badge =
                STATUS_BADGES[(stl.status || "").toLowerCase()] ||
                STATUS_BADGES.draft;
              const lines = Array.isArray(stl.lines) ? stl.lines : [];
              const deductions = Array.isArray(stl.deductions)
                ? stl.deductions
                : [];
              return (
                <div
                  key={stl.id}
                  className="border border-slate-200 rounded-xl overflow-hidden"
                >
                  {/* Summary Row */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : stl.id)}
                    className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-base-200/60 hover:bg-base-200 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <span className="block text-xs font-bold text-slate-800">
                          {fmtDate(stl.period_start)} – {fmtDate(stl.period_end)}
                        </span>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded-full border text-3xs font-mono font-bold uppercase ${badge}`}
                        >
                          {stl.status || "draft"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right sm:pl-4">
                      <div>
                        <span className="block text-3xs font-mono text-slate-400 uppercase">
                          Gross
                        </span>
                        <span className="block text-xs font-bold font-mono text-slate-700">
                          {fmtMoney(stl.gross_pay)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-3xs font-mono text-slate-400 uppercase">
                          Deductions
                        </span>
                        <span className="block text-xs font-bold font-mono text-rose-600">
                          −{fmtMoney(stl.total_deductions)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-3xs font-mono text-slate-400 uppercase">
                          Net Pay
                        </span>
                        <span className="block text-sm font-black font-mono text-emerald-700">
                          {fmtMoney(stl.net_pay)}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Detail */}
                  {isOpen && (
                    <div className="p-3.5 space-y-4 border-t border-slate-100 bg-base-100">
                      {/* Per-load / per-leg pay lines */}
                      <div className="space-y-1.5">
                        <span className="text-3xs font-bold font-mono text-base-content uppercase tracking-wider flex items-center gap-1.5">
                          <Route className="h-3 w-3 text-indigo-500" />
                          Load &amp; Leg Pay Lines
                        </span>
                        {lines.length === 0 ? (
                          <p className="text-2xs text-slate-400 italic">
                            No pay lines recorded on this settlement.
                          </p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-2xs">
                              <thead>
                                <tr className="text-left text-3xs font-mono font-bold text-slate-400 uppercase border-b border-slate-100">
                                  <th className="py-1.5 pr-3">Load</th>
                                  <th className="py-1.5 pr-3">Route</th>
                                  <th className="py-1.5 pr-3 text-right">Miles</th>
                                  <th className="py-1.5 pr-3 text-right">Rate</th>
                                  <th className="py-1.5 text-right">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {lines.map((line, idx) => (
                                  <tr key={idx}>
                                    <td className="py-2 pr-3">
                                      <span className="font-bold text-slate-800">
                                        {line.load_number || "—"}
                                      </span>
                                      {line.leg_seq != null && (
                                        <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded font-mono text-3xs font-bold">
                                          Leg {line.leg_seq}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 pr-3 text-slate-600">
                                      {(line.origin || "—") + " → " + (line.destination || "—")}
                                    </td>
                                    <td className="py-2 pr-3 text-right font-mono text-slate-700">
                                      {line.miles != null ? Number(line.miles).toLocaleString() : "—"}
                                    </td>
                                    <td className="py-2 pr-3 text-right font-mono text-slate-700">
                                      {line.rate != null ? fmtMoney(line.rate) : "—"}
                                      {line.rate_type ? (
                                        <span className="text-slate-400"> /{line.rate_type}</span>
                                      ) : null}
                                    </td>
                                    <td className="py-2 text-right font-mono font-bold text-slate-800">
                                      {fmtMoney(line.amount)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Deductions */}
                      <div className="space-y-1.5">
                        <span className="text-3xs font-bold font-mono text-base-content uppercase tracking-wider flex items-center gap-1.5">
                          <MinusCircle className="h-3 w-3 text-rose-500" />
                          Deductions
                        </span>
                        {deductions.length === 0 ? (
                          <p className="text-2xs text-slate-400 italic">
                            No deductions on this settlement.
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {deductions.map((ded, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 bg-rose-50/50 border border-rose-100 rounded-lg"
                              >
                                <div>
                                  <span className="block text-2xs font-bold text-slate-700 capitalize">
                                    {(ded.type || "deduction").replace(/_/g, " ")}
                                  </span>
                                  {ded.note && (
                                    <span className="block text-3xs text-slate-400">
                                      {ded.note}
                                    </span>
                                  )}
                                </div>
                                <span className="text-2xs font-mono font-bold text-rose-600">
                                  −{fmtMoney(ded.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Totals footer */}
                      <div className="flex items-center justify-end gap-4 pt-2 border-t border-slate-100 text-2xs font-mono">
                        <span className="text-base-content">
                          Gross {fmtMoney(stl.gross_pay)}
                        </span>
                        <span className="text-rose-600">
                          − {fmtMoney(stl.total_deductions)}
                        </span>
                        <span className="font-black text-emerald-700 text-xs">
                          = {fmtMoney(stl.net_pay)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

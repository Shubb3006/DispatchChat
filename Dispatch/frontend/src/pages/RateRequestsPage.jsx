import { useEffect, useState, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/axios";
import { API_BASE_URL } from "@/lib/apiBase";
import { Inbox, Loader2, DollarSign, CheckCircle2, XCircle, Clock3, RefreshCw } from "lucide-react";

const STATUS_STYLES = {
  PENDING: "bg-blue-100 text-blue-700",
  QUOTED: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-slate-200 text-slate-600",
};

// Staff-side view of customer portal rate requests: dispatchers see every
// incoming request, quote a price, and watch acceptance in real time.
export default function RateRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quotingId, setQuotingId] = useState(null);
  const [quoteForm, setQuoteForm] = useState({ price: "", currency: "USD", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/rates", { params: { limit: 100 } });
      if (res.data?.success) setRequests(res.data.rate_requests);
    } catch (error) {
      console.warn("fetchRequests failed:", error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load + slow poll as a safety net under the live stream
  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  // Live alerts: the backend emits an SSE event for every portal action
  // (new request, quote accepted/rejected, tender uploaded).
  const esRef = useRef(null);
  useEffect(() => {
    let es;
    try {
      es = new EventSource(`${API_BASE_URL}/rates/notifications/stream`, {
        withCredentials: true,
      });
      esRef.current = es;
      es.addEventListener("connected", () => setLiveConnected(true));
      es.addEventListener("dispatch-alert", (e) => {
        try {
          const event = JSON.parse(e.data);
          toast(`🔔 ${event.title}`, { duration: 8000 });
          fetchRequests();
        } catch {
          fetchRequests();
        }
      });
      es.onerror = () => setLiveConnected(false);
    } catch (err) {
      console.warn("SSE unavailable, relying on polling:", err.message);
    }
    return () => {
      es?.close();
    };
  }, [fetchRequests]);

  const submitQuote = async (id) => {
    const price = Number(quoteForm.price);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Enter a valid quote amount");
      return;
    }
    setSubmitting(true);
    try {
      const res = await axiosInstance.patch(`/rates/${id}/quote`, {
        quoted_price: price,
        currency: quoteForm.currency,
        notes: quoteForm.notes || null,
      });
      if (res.data?.success) {
        toast.success("Quote sent — the customer has been notified.");
        setQuotingId(null);
        setQuoteForm({ price: "", currency: "USD", notes: "" });
        fetchRequests();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send quote");
    } finally {
      setSubmitting(false);
    }
  };

  const pending = requests.filter((r) => r.status === "PENDING");
  const quoted = requests.filter((r) => r.status === "QUOTED");
  const accepted = requests.filter((r) => r.status === "ACCEPTED");

  const fmtFreight = (fd) => {
    if (!fd || typeof fd !== "object") return null;
    const parts = [];
    if (fd.skids) parts.push(`${fd.skids} skids`);
    if (fd.weight_lbs) parts.push(`${Number(fd.weight_lbs).toLocaleString()} lbs`);
    if (fd.dims?.length_in) parts.push(`${fd.dims.length_in}x${fd.dims.width_in || "?"}x${fd.dims.height_in || "?"} in`);
    if (fd.commodity) parts.push(fd.commodity);
    return parts.join(" · ");
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
            <Inbox className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Customer Rate Requests</h1>
            <p className="text-xs text-slate-500">
              Incoming quote requests from the customer portal
              <span className={`ml-2 inline-flex items-center gap-1 ${liveConnected ? "text-emerald-600" : "text-slate-400"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${liveConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                {liveConnected ? "Live alerts on" : "Polling every 30s"}
              </span>
            </p>
          </div>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-3">
          <Clock3 className="w-8 h-8 text-blue-500" />
          <div>
            <p className="text-2xl font-black text-slate-900">{pending.length}</p>
            <p className="text-xs font-semibold text-slate-500 uppercase">Awaiting Quote</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-amber-500" />
          <div>
            <p className="text-2xl font-black text-slate-900">{quoted.length}</p>
            <p className="text-xs font-semibold text-slate-500 uppercase">Quoted — Awaiting Customer</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
          <div>
            <p className="text-2xl font-black text-slate-900">{accepted.length}</p>
            <p className="text-xs font-semibold text-slate-500 uppercase">Accepted</p>
          </div>
        </div>
      </div>

      {/* Request list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No rate requests yet.</p>
          <p className="text-sm text-slate-400 mt-1">
            When a customer submits a request from the portal, it appears here instantly.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-900">{r.company_name || "Unknown customer"}</p>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${STATUS_STYLES[r.status] || "bg-slate-100 text-slate-600"}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mt-1">
                    {r.origin} → {r.destination}
                  </p>
                  {fmtFreight(r.freight_details) && (
                    <p className="text-xs text-slate-500 mt-1">{fmtFreight(r.freight_details)}</p>
                  )}
                  {r.freight_details?.notes && (
                    <p className="text-xs text-slate-400 mt-1 italic">"{r.freight_details.notes}"</p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-2 font-mono">
                    {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  {r.quoted_price != null && (
                    <p className="text-lg font-black text-slate-900">
                      ${Number(r.quoted_price).toFixed(2)}
                      <span className="text-xs font-semibold text-slate-500 ml-1">{r.quote_currency || "USD"}</span>
                    </p>
                  )}
                  {r.status === "PENDING" && quotingId !== r.id && (
                    <button
                      onClick={() => setQuotingId(r.id)}
                      className="px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition-colors"
                    >
                      Quote This Lane
                    </button>
                  )}
                  {r.status === "REJECTED" && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <XCircle className="w-3.5 h-3.5" /> Customer declined
                    </span>
                  )}
                </div>
              </div>

              {/* Inline quote form */}
              {quotingId === r.id && (
                <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Quote (all-in)</label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={quoteForm.price}
                      onChange={(e) => setQuoteForm((f) => ({ ...f, price: e.target.value }))}
                      placeholder="e.g. 2850.00"
                      className="w-36 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Currency</label>
                    <select
                      value={quoteForm.currency}
                      onChange={(e) => setQuoteForm((f) => ({ ...f, currency: e.target.value }))}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="USD">USD</option>
                      <option value="CAD">CAD</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Notes (optional)</label>
                    <input
                      type="text"
                      value={quoteForm.notes}
                      onChange={(e) => setQuoteForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Valid 7 days, fuel included…"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setQuotingId(null)}
                      disabled={submitting}
                      className="px-3 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => submitQuote(r.id)}
                      disabled={submitting}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Send Quote
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

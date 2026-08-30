import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePortalStore } from "../stores/usePortalStore";
import { Plus, LogOut, MapPin, Truck, FileUp, AlertCircle } from "lucide-react";

export default function PortalDashboardPage() {
  const navigate = useNavigate();
  const {
    portalUser,
    portalLogout,
    rateRequests,
    loads,
    fetchRateRequests,
    fetchPortalLoads,
    isLoading,
    respondToRate,
    uploadTender,
    isUploadingTender,
  } = usePortalStore();

  const [activeTab, setActiveTab] = useState("rates");

  useEffect(() => {
    if (!portalUser) navigate("/portal/login", { replace: true });
  }, [portalUser, navigate]);

  useEffect(() => {
    fetchRateRequests();
    fetchPortalLoads();
    const interval = setInterval(() => {
      fetchRateRequests();
      fetchPortalLoads();
    }, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await portalLogout();
    navigate("/portal/login", { replace: true });
  };

  const handleQuoteAction = async (id, decision) => {
    await respondToRate(id, decision);
    fetchRateRequests();
  };

  if (!portalUser) return null;

  const pendingRates = rateRequests.filter((r) => r.status === "PENDING");
  const quotedRates = rateRequests.filter((r) => r.status === "QUOTED");
  const acceptedRates = rateRequests.filter((r) => r.status === "ACCEPTED");
  const activeLoads = loads.filter((l) => !["delivered", "completed", "billed"].includes(l.status?.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Nishan Transport Portal</h1>
            <p className="text-sm text-slate-600">{portalUser.company_name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Sign out</span>
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Pending Quotes</p>
            <p className="text-3xl font-black text-sky-600">{pendingRates.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Ready to Accept</p>
            <p className="text-3xl font-black text-amber-600">{quotedRates.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Active Loads</p>
            <p className="text-3xl font-black text-green-600">{activeLoads.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-1">All Requests</p>
            <p className="text-3xl font-black text-slate-900">{rateRequests.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("rates")}
            className={`px-4 py-2 font-semibold text-sm border-b-2 transition-colors ${
              activeTab === "rates"
                ? "text-sky-600 border-sky-600"
                : "text-slate-600 border-transparent hover:text-slate-900"
            }`}
          >
            Rate Requests ({rateRequests.length})
          </button>
          <button
            onClick={() => setActiveTab("loads")}
            className={`px-4 py-2 font-semibold text-sm border-b-2 transition-colors ${
              activeTab === "loads"
                ? "text-sky-600 border-sky-600"
                : "text-slate-600 border-transparent hover:text-slate-900"
            }`}
          >
            Active Loads ({activeLoads.length})
          </button>
        </div>

        {/* Rate Requests Tab */}
        {activeTab === "rates" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Rate Requests</h2>
              <button
                onClick={() => navigate("/portal/rate-request")}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                New Rate Request
              </button>
            </div>

            {rateRequests.length === 0 ? (
              <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
                <p className="text-slate-600">No rate requests yet.</p>
                <button
                  onClick={() => navigate("/portal/rate-request")}
                  className="mt-4 text-sky-600 font-semibold hover:underline"
                >
                  Submit your first rate request →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {rateRequests.map((r) => (
                  <div key={r.id} className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">
                          {r.origin} → {r.destination}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Status: <span className="font-semibold capitalize">{r.status}</span>
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          r.status === "PENDING"
                            ? "bg-blue-100 text-blue-700"
                            : r.status === "QUOTED"
                            ? "bg-amber-100 text-amber-700"
                            : r.status === "ACCEPTED"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>

                    {r.freight_details && (
                      <p className="text-sm text-slate-600 mt-2">
                        {r.freight_details.skids ? `${r.freight_details.skids} skids` : ""}
                        {r.freight_details.weight_lbs ? `, ${r.freight_details.weight_lbs} lbs` : ""}
                      </p>
                    )}

                    {r.status === "QUOTED" && (
                      <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                        <p className="font-bold text-lg text-slate-900">
                          ${Number(r.quoted_price || 0).toFixed(2)} {r.quote_currency || "USD"}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleQuoteAction(r.id, "REJECT")}
                            className="px-3 py-1 text-sm font-medium text-slate-600 border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleQuoteAction(r.id, "ACCEPT")}
                            className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                          >
                            Accept & Upload Tender
                          </button>
                        </div>
                      </div>
                    )}

                    {r.status === "ACCEPTED" && (
                      <label className={`mt-3 w-full px-3 py-2 text-sm font-medium rounded transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                        isUploadingTender
                          ? "text-slate-400 bg-slate-50 cursor-wait"
                          : "text-sky-600 bg-sky-50 hover:bg-sky-100"
                      }`}>
                        {isUploadingTender ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            AI is parsing your tender…
                          </>
                        ) : (
                          <>
                            <FileUp className="w-4 h-4" />
                            Upload Load Tender (PDF)
                          </>
                        )}
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          disabled={isUploadingTender}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (file) {
                              const result = await uploadTender(file, r.id);
                              if (result) setActiveTab("loads");
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loads Tab */}
        {activeTab === "loads" && (
          <div className="space-y-3">
            {isLoading ? (
              <div className="bg-white rounded-lg p-8 text-center text-slate-600">
                Loading your loads...
              </div>
            ) : activeLoads.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center text-slate-600">
                No active loads yet.
              </div>
            ) : (
              activeLoads.map((load) => (
                <div key={load.id} className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/portal/loads/${load.id}`)}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-900">Load #{load.load_number}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {load.origin} → {load.destination}
                        </span>
                        <span className="flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          {load.commodity}
                        </span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      load.status?.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-700'
                        : load.status?.toLowerCase()?.includes('transit') ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {load.status}
                    </span>
                  </div>
                  {load.is_cross_border && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded w-fit">
                      <AlertCircle className="w-3 h-3" />
                      Cross-border shipment
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

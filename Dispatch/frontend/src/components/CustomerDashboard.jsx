import { useState, useEffect, useCallback } from "react";
import { axiosInstance } from "@/lib/axios";
import { useShipmentStore } from "../stores/useShipmentStore";
import {
  Globe,
  MapPin,
  Truck,
  RefreshCw,
  FileText,
  Receipt,
  Loader2,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

/**
 * Customer portal dashboard.
 *
 * All data comes from the customer-scoped backend endpoints — for
 * customer-role users the regular list endpoints already return only their
 * own loads/invoices/documents, and GET /api/customer/me returns the linked
 * customer record. Nothing here is simulated or fabricated: when the backend
 * has no data (or no linked customer), the honest empty state is shown.
 */

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");
const fmtMoney = (n) =>
  n == null || n === "" ? "—" : `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const statusBadgeClass = (status) => {
  const st = String(status || "").toLowerCase();
  if (st.includes("delivered") || st === "paid") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (st.includes("transit") || st === "sent") return "bg-sky-50 text-sky-700 border-sky-200";
  if (st.includes("dispatch") || st.includes("assigned")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
  if (st === "overdue" || st.includes("exception") || st.includes("cancel")) return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
};

const routeText = (load) => {
  const from =
    load.origin ||
    [load.shipper_city, load.shipper_state].filter(Boolean).join(", ") ||
    null;
  const to =
    load.destination ||
    [load.consignee_city, load.consignee_state].filter(Boolean).join(", ") ||
    null;
  return { from: from || "—", to: to || "—" };
};

export default function CustomerDashboard({ onSelectShipment }) {
  const shipments = useShipmentStore((state) => state.shipments);
  const shipmentsLoading = useShipmentStore((state) => state.isLoading);
  const fetchShipments = useShipmentStore((state) => state.fetchShipments);

  const [me, setMe] = useState(null);
  const [meError, setMeError] = useState(null);
  const [meLoading, setMeLoading] = useState(true);

  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [invoicesError, setInvoicesError] = useState(null);

  const [docsLoad, setDocsLoad] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState(null);

  // Identity header — GET /api/customer/me
  const fetchMe = useCallback(async () => {
    setMeLoading(true);
    setMeError(null);
    try {
      const res = await axiosInstance.get("/customer/me");
      setMe(res.data?.customer || null);
    } catch (err) {
      setMe(null);
      setMeError(
        err.response?.status === 404
          ? "No customer record is linked to this login yet — contact dispatch to be linked."
          : "Could not load your customer profile."
      );
    } finally {
      setMeLoading(false);
    }
  }, []);

  // Invoices — server-side scoped for customer users
  const fetchInvoices = useCallback(async () => {
    setInvoicesLoading(true);
    setInvoicesError(null);
    try {
      const res = await axiosInstance.get("/invoices");
      const rows = Array.isArray(res.data)
        ? res.data
        : res.data?.invoices || res.data?.data || [];
      setInvoices(rows);
    } catch (err) {
      setInvoices([]);
      setInvoicesError("Failed to fetch your invoices.");
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
    fetchInvoices();
    fetchShipments();
  }, [fetchMe, fetchInvoices, fetchShipments]);

  // Documents for one load — server-side scoped
  const openDocuments = async (load) => {
    setDocsLoad(load);
    setDocuments([]);
    setDocsError(null);
    if (!load?.load_number && !load?.id) return;
    setDocsLoading(true);
    try {
      const res = await axiosInstance.get(
        `/upload/load/${encodeURIComponent(load.load_number || load.id)}`
      );
      setDocuments(res.data?.documents || []);
    } catch (err) {
      setDocsError(
        err.response?.status === 404
          ? "Load not found on the server."
          : "Failed to fetch documents for this load."
      );
    } finally {
      setDocsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Identity header — real data from GET /api/customer/me */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 rounded-2xl">
              <Globe className="h-7 w-7" />
            </div>
            <div>
              {meLoading ? (
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading your account...
                </div>
              ) : me ? (
                <>
                  <h2 className="text-xl font-extrabold tracking-wide">{me.name || "Customer"}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {[me.email, me.phone].filter(Boolean).join(" • ") || "Customer account"}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-extrabold tracking-wide">Customer Portal</h2>
                  {meError && <p className="text-xs text-amber-300 mt-0.5">{meError}</p>}
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              fetchMe();
              fetchInvoices();
              fetchShipments();
            }}
            className="self-start sm:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* My shipments (server-scoped to this customer) */}
      <div className="bg-base-100 rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Truck className="h-4 w-4 text-indigo-600" />
          My Shipments
        </h3>

        {shipmentsLoading ? (
          <div className="py-8 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> Loading shipments...
          </div>
        ) : shipments.length === 0 ? (
          <div className="py-8 text-center text-base-content text-sm">
            <AlertCircle className="h-6 w-6 mx-auto mb-2 text-slate-300" />
            No shipments found for your account.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-base-200 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">Load #</th>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Pickup</th>
                  <th className="px-4 py-3">Delivery</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Documents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shipments.map((load) => {
                  const route = routeText(load);
                  return (
                    <tr
                      key={load.id}
                      className="hover:bg-base-200 cursor-pointer"
                      onClick={() => onSelectShipment && onSelectShipment(load)}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                        #{load.load_number || load.tracking_number || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 font-medium text-slate-800">
                          <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                          {route.from}
                          <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                          {route.to}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{fmtDate(load.pickup_date)}</td>
                      <td className="px-4 py-3 text-slate-600">{fmtDate(load.delivery_date)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[11px] font-bold capitalize ${statusBadgeClass(
                            load.status
                          )}`}
                        >
                          {String(load.status || "—").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDocuments(load);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Documents panel for the selected load */}
      {docsLoad && (
        <div className="bg-base-100 rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              Documents — Load #{docsLoad.load_number || docsLoad.id}
            </h3>
            <button
              onClick={() => setDocsLoad(null)}
              className="text-xs font-bold text-base-content hover:text-slate-800"
            >
              Close
            </button>
          </div>

          {docsLoading ? (
            <div className="py-6 flex items-center justify-center gap-2 text-slate-400 text-sm">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> Loading documents...
            </div>
          ) : docsError ? (
            <div className="py-6 text-center text-rose-600 text-sm flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" /> {docsError}
            </div>
          ) : documents.length === 0 ? (
            <p className="py-4 text-center text-base-content text-sm">
              No documents uploaded for this load yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between px-4 py-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">
                      {doc.file_name || doc.document_type || "Document"}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                      {doc.document_type || "DOC"}
                    </span>
                    {doc.is_approved && (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                        <CheckCircle2 className="h-3 w-3" /> Approved
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-slate-400">{fmtDate(doc.created_at)}</span>
                    {doc.file_path ? (
                      <a
                        href={doc.file_path}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400">No file</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* My invoices (server-scoped to this customer) */}
      <div className="bg-base-100 rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Receipt className="h-4 w-4 text-indigo-600" />
          My Invoices
        </h3>

        {invoicesLoading ? (
          <div className="py-8 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> Loading invoices...
          </div>
        ) : invoicesError ? (
          <div className="py-6 text-center text-rose-600 text-sm flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4" /> {invoicesError}
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-8 text-center text-base-content text-sm">
            <AlertCircle className="h-6 w-6 mx-auto mb-2 text-slate-300" />
            No invoices on your account.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-base-200 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Load / Tracking</th>
                  <th className="px-4 py-3">Issued</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-base-200">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">
                      {String(inv.id || "").slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono">
                      {inv.tracking_number || inv.shipment_id || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{fmtDate(inv.issue_date)}</td>
                    <td className="px-4 py-3 text-slate-600">{fmtDate(inv.due_date)}</td>
                    <td className="px-4 py-3 text-right font-bold text-base-content">
                      {fmtMoney(inv.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[11px] font-bold capitalize ${statusBadgeClass(
                          inv.status
                        )}`}
                      >
                        {inv.status || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

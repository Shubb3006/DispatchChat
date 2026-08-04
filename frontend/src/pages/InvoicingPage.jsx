import { useState, useEffect, useMemo } from "react";
import { useInvoiceStore } from "../stores/useInvoiceStore";
import { useShipmentStore } from "../stores/useShipmentStore";
import { useDocumentStore } from "../stores/useDocumentStore";
import {
  FileText, DollarSign, Calculator, Send, CheckSquare,
  FileSpreadsheet, Check, Search, AlertCircle,
} from "lucide-react";

const STATUS_BADGE = {
  paid: "bg-green-100 text-green-700",
  sent: "bg-blue-100 text-blue-700",
  overdue: "bg-red-100 text-red-700",
  draft: "bg-slate-100 text-slate-600",
};

export default function InvoicingPage() {
  const invoices = useInvoiceStore((state) => state.invoices);
  const fetchInvoices = useInvoiceStore((state) => state.fetchInvoices);
  const addInvoice = useInvoiceStore((state) => state.addInvoice);
  const updateInvoice = useInvoiceStore((state) => state.updateInvoice);
  const shipments = useShipmentStore((state) => state.shipments);
  const fetchShipments = useShipmentStore((state) => state.fetchShipments);
  const updateShipment = useShipmentStore((state) => state.updateShipment);
  const documents = useDocumentStore((state) => state.documents);
  const fetchDocuments = useDocumentStore((state) => state.fetchDocuments);
  const updateDocument = useDocumentStore((state) => state.updateDocument);

  useEffect(() => {
    fetchInvoices();
    fetchShipments();
    fetchDocuments();
  }, [fetchInvoices, fetchShipments, fetchDocuments]);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [docSearch, setDocSearch] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("all");

  // LTL Calculator
  const [calcPallets, setCalcPallets] = useState(4);
  const [calcWeight, setCalcWeight] = useState(6000);
  const [calcDistance, setCalcDistance] = useState(450);
  const [calcClass, setCalcClass] = useState(70);
  const [calculatedRate, setCalculatedRate] = useState(null);

  useEffect(() => {
    if (!selectedInvoice && invoices.length > 0) setSelectedInvoice(invoices[0]);
  }, [invoices, selectedInvoice]);

  const processedDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const q = docSearch.toLowerCase().trim();
      if (q && !doc.fileName.toLowerCase().includes(q) && !doc.trackingNumber.toLowerCase().includes(q)) return false;
      if (docTypeFilter !== "all" && doc.type !== docTypeFilter) return false;
      return true;
    });
  }, [documents, docSearch, docTypeFilter]);

  const pendingDocs = processedDocuments.filter((d) => d.status === "pending_review");
  const approvedDocs = processedDocuments.filter((d) => d.status === "approved");

  const calculateLtlRate = () => {
    const rate = Math.round((calcWeight * 0.12 + calcDistance * 1.85) * (calcClass / 100) + calcPallets * 45);
    setCalculatedRate(rate);
  };

  const handleCreateInvoiceFromDoc = async (doc) => {
    const matchedShipment = shipments.find((s) => s.id === doc.shipmentId);
    const invoiceId = "INV" + Math.floor(10000 + Math.random() * 90000);
    const subtotal = matchedShipment ? matchedShipment.priceInvoice : Math.round((doc.extractedData?.weightLbs || 5000) * 0.4);
    const tax = Math.round(subtotal * 0.08);
    const newInvoice = {
      id: invoiceId, shipmentId: doc.shipmentId, trackingNumber: doc.trackingNumber,
      customerName: doc.extractedData?.consigneeName || matchedShipment?.customerName || "General Consignee",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 86400000 * 30).toISOString().split("T")[0],
      subtotal, tax, total: subtotal + tax, status: "draft", paymentTerms: "Net 30",
      notes: `Auto-generated from BOL ${doc.extractedData?.bolNumber || ""}.`,
    };
    await addInvoice(newInvoice);
    await updateDocument({ ...doc, status: "matched_to_invoice" });
    setSelectedInvoice(newInvoice);
  };

  const handleVerifyDocument = async (docId, status) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;
    await updateDocument({ ...doc, status });
    if (status === "approved") {
      const ship = shipments.find((s) => s.id === doc.shipmentId);
      if (ship && !ship.documentIds?.includes(docId)) {
        await updateShipment({ ...ship, documentIds: [...(ship.documentIds || []), docId] });
      }
    }
  };

  const handleUpdateInvoiceStatus = async (id, status) => {
    const inv = invoices.find((i) => i.id === id);
    if (inv) await updateInvoice({ ...inv, status });
  };

  const handleUpdateInvoice = async (updated) => {
    await updateInvoice(updated);
  };

  // Summary stats
  const outstanding = invoices.filter((i) => i.status !== "paid").reduce((a, c) => a + c.total, 0);
  const collected = invoices.filter((i) => i.status === "paid").reduce((a, c) => a + c.total, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Outstanding", value: `$${outstanding.toLocaleString()}`, icon: DollarSign, color: "text-red-600 bg-red-50", border: "border-red-100" },
          { label: "Collected This Month", value: `$${collected.toLocaleString()}`, icon: CheckSquare, color: "text-green-600 bg-green-50", border: "border-green-100" },
          { label: "Pending Documents", value: `${documents.filter((d) => d.status === "pending_review").length} pending`, icon: FileText, color: "text-amber-600 bg-amber-50", border: "border-amber-100" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`bg-white rounded-2xl border ${card.border} shadow-sm p-4 flex items-center justify-between`}>
              <div>
                <p className="text-xs font-medium text-slate-500">{card.label}</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{card.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${card.color}`}><Icon className="h-5 w-5" /></div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Doc Queue + Invoice Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Verification Queue */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-500" />
                <h2 className="font-semibold text-slate-900">Document Queue</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text" value={docSearch} onChange={(e) => setDocSearch(e.target.value)}
                    placeholder="Search docs..."
                    className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-40"
                  />
                </div>
                <select value={docTypeFilter} onChange={(e) => setDocTypeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-2.5 py-2 focus:outline-none cursor-pointer">
                  <option value="all">All Types</option>
                  <option value="bol">BOL</option>
                  <option value="pod">POD</option>
                  <option value="skid_picture">Skid Photos</option>
                </select>
              </div>
            </div>

            {/* Pending Section */}
            {pendingDocs.length > 0 && (
              <div className="p-4 border-b border-slate-100">
                <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Pending Review ({pendingDocs.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pendingDocs.map((doc) => {
                    const ship = shipments.find((s) => s.id === doc.shipmentId || s.trackingNumber === doc.trackingNumber);
                    return (
                      <div key={doc.id} className="border border-amber-200 bg-amber-50/30 rounded-xl p-3.5 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-semibold text-slate-900 block">{doc.fileName}</span>
                            <span className="text-xs text-slate-500">{doc.trackingNumber} · {doc.type.toUpperCase()}</span>
                          </div>
                          <span className="text-xs text-slate-400 shrink-0">{new Date(doc.uploadDate).toLocaleDateString()}</span>
                        </div>
                        {doc.extractedData && (
                          <div className="text-xs text-slate-600 space-y-0.5 bg-white rounded-lg p-2 border border-slate-100">
                            {doc.extractedData.shipperName && <div>Shipper: <span className="font-medium">{doc.extractedData.shipperName}</span></div>}
                            {doc.extractedData.consigneeName && <div>Consignee: <span className="font-medium">{doc.extractedData.consigneeName}</span></div>}
                            {doc.extractedData.weightLbs && <div>Weight: <span className="font-medium">{doc.extractedData.weightLbs} lbs</span></div>}
                          </div>
                        )}
                        {ship && <div className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${ship.status === "delivered" ? "bg-green-100 text-green-700" : ship.status === "in_transit" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>Load: {ship.status}</div>}
                        <div className="flex items-center gap-2 pt-1">
                          <button onClick={() => handleVerifyDocument(doc.id, "rejected")}
                            className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium cursor-pointer transition-colors">
                            Reject
                          </button>
                          <button onClick={() => handleVerifyDocument(doc.id, "approved")}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors">
                            <Check className="h-3 w-3" /> Approve
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Approved / Ready for Invoicing */}
            {approvedDocs.length > 0 && (
              <div className="p-4">
                <h3 className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Approved – Ready to Invoice ({approvedDocs.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {approvedDocs.map((doc) => (
                    <div key={doc.id} className="border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-semibold text-slate-900 block">{doc.fileName}</span>
                          <span className="text-xs text-slate-500">{doc.trackingNumber} · {doc.type.toUpperCase()}</span>
                        </div>
                        <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full shrink-0">Verified</span>
                      </div>
                      <button onClick={() => handleCreateInvoiceFromDoc(doc)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors w-full justify-center">
                        <FileSpreadsheet className="h-3.5 w-3.5" /> Create LTL Invoice
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingDocs.length === 0 && approvedDocs.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">
                No documents match your search or filters.
              </div>
            )}
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-500" />
              <h2 className="font-semibold text-slate-900">Invoices</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <th className="px-5 py-3">Invoice #</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3">Due</th>
                    <th className="px-5 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} onClick={() => setSelectedInvoice(inv)}
                      className={`cursor-pointer hover:bg-slate-50 transition-colors ${selectedInvoice?.id === inv.id ? "bg-blue-50/40" : ""}`}>
                      <td className="px-5 py-3.5 font-mono font-medium text-slate-900">{inv.id}</td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium">{inv.customerName}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">${inv.total.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{inv.dueDate}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[inv.status] || "bg-slate-100 text-slate-600"}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Invoice Detail + LTL Calculator */}
        <div className="space-y-6">
          {/* Invoice Detail */}
          {selectedInvoice && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="font-semibold text-slate-900">Invoice Detail</h2>
                <span className="text-xs font-mono text-slate-400">{selectedInvoice.id}</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Customer</span><span className="font-medium text-slate-900">{selectedInvoice.customerName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Issued</span><span className="font-mono text-slate-700">{selectedInvoice.issueDate}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Status</span>
                  <select value={selectedInvoice.status}
                    onChange={(e) => { handleUpdateInvoiceStatus(selectedInvoice.id, e.target.value); setSelectedInvoice({ ...selectedInvoice, status: e.target.value }); }}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Payment Terms</span>
                  <select value={selectedInvoice.paymentTerms}
                    onChange={(e) => { const terms = e.target.value; const days = terms === "Net 15" ? 15 : terms === "Net 60" ? 60 : terms === "COD" ? 0 : 30; const due = new Date(selectedInvoice.issueDate); due.setDate(due.getDate() + days); const updated = { ...selectedInvoice, paymentTerms: terms, dueDate: due.toISOString().split("T")[0] }; setSelectedInvoice(updated); handleUpdateInvoice(updated); }}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="COD">COD</option>
                  </select>
                </div>
                <div className="flex justify-between"><span className="text-slate-500">Due Date</span><span className="font-medium text-blue-600">{selectedInvoice.dueDate}</span></div>
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>${selectedInvoice.subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-500 text-xs"><span>Tax (8%)</span><span>${selectedInvoice.tax.toLocaleString()}</span></div>
                  <div className="flex justify-between font-bold text-slate-900 text-base"><span>Total</span><span>${selectedInvoice.total.toLocaleString()}</span></div>
                </div>
                {selectedInvoice.notes && <p className="text-xs text-slate-400 bg-slate-50 p-2.5 rounded-lg leading-relaxed">{selectedInvoice.notes}</p>}
                <div className="pt-1 space-y-2">
                  {selectedInvoice.status === "draft" && (
                    <button onClick={() => { handleUpdateInvoiceStatus(selectedInvoice.id, "sent"); setSelectedInvoice({ ...selectedInvoice, status: "sent" }); }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold cursor-pointer transition-colors">
                      <Send className="h-4 w-4" /> Send to Customer
                    </button>
                  )}
                  {selectedInvoice.status === "sent" && (
                    <button onClick={() => { handleUpdateInvoiceStatus(selectedInvoice.id, "paid"); setSelectedInvoice({ ...selectedInvoice, status: "paid" }); }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold cursor-pointer transition-colors">
                      <Check className="h-4 w-4" /> Mark as Paid
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* LTL Rate Calculator */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Calculator className="h-5 w-5 text-blue-400" />
              <h2 className="font-semibold">LTL Rate Calculator</h2>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Freight Class</label>
                <select value={calcClass} onChange={(e) => setCalcClass(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 cursor-pointer">
                  <option value="50">Class 50 – Heavy Steel</option>
                  <option value="70">Class 70 – Machinery</option>
                  <option value="100">Class 100 – Standard</option>
                  <option value="150">Class 150 – Electronics</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Weight (lbs)", value: calcWeight, set: setCalcWeight },
                  { label: "Pallets", value: calcPallets, set: setCalcPallets },
                ].map(({ label, value, set }) => (
                  <div key={label} className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-medium">{label}</label>
                    <input type="number" value={value} onChange={(e) => set(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Route Miles</label>
                <input type="number" value={calcDistance} onChange={(e) => setCalcDistance(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <button onClick={calculateLtlRate}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold cursor-pointer transition-colors">
                Calculate Rate
              </button>
              {calculatedRate !== null && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
                  <div className="text-xs text-slate-400 mb-1">Estimated Spot Rate</div>
                  <div className="text-2xl font-bold text-blue-300">${calculatedRate.toLocaleString()}</div>
                  <div className="text-xs text-slate-500 mt-1">USD · Zero-rated commercial pricing</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { useInvoiceStore } from "../stores/useInvoiceStore";
import { useShipmentStore } from "../stores/useShipmentStore";
import { useDocumentStore } from "../stores/useDocumentStore";
import {
  FileText,
  DollarSign,
  Calculator,
  Send,
  CheckSquare,
  FileSpreadsheet,
  Scale,
  Check,
  Search,
} from "lucide-react";

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

  // Fetch all invoicing-related stores on load
  useEffect(() => {
    fetchInvoices();
    fetchShipments();
    fetchDocuments();
  }, [fetchInvoices, fetchShipments, fetchDocuments]);

  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Update selected invoice when invoices list updates or loads
  useEffect(() => {
    if (!selectedInvoice && invoices.length > 0) {
      setSelectedInvoice(invoices[0]);
    }
  }, [invoices, selectedInvoice]);

  const [matchingDocument, setMatchingDocument] = useState(null);
  const [docSearch, setDocSearch] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("all");
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState("all");
  const [docSort, setDocSort] = useState("date_desc");

  const processedDocuments = useMemo(() => {
    return documents
      .filter((doc) => {
        const query = docSearch.toLowerCase().trim();
        const matchedShipment = shipments.find(
          (s) =>
            s.id === doc.shipmentId || s.trackingNumber === doc.trackingNumber
        );
        if (query) {
          const fileNameMatch = doc.fileName.toLowerCase().includes(query);
          const trackingNumberMatch = doc.trackingNumber
            .toLowerCase()
            .includes(query);
          const idMatch = doc.id.toLowerCase().includes(query);
          const uploadedByMatch = doc.uploadedBy.toLowerCase().includes(query);
          const shipperMatch =
            doc.extractedData?.shipperName?.toLowerCase().includes(query) ||
            false;
          const consigneeMatch =
            doc.extractedData?.consigneeName?.toLowerCase().includes(query) ||
            false;
          const customerMatch =
            matchedShipment?.customerName?.toLowerCase().includes(query) ||
            false;
          if (
            !fileNameMatch &&
            !trackingNumberMatch &&
            !idMatch &&
            !uploadedByMatch &&
            !shipperMatch &&
            !consigneeMatch &&
            !customerMatch
          ) {
            return false;
          }
        }
        if (docTypeFilter !== "all") {
          if (docTypeFilter === "receipt") {
            const isReceipt = [
              "scale_ticket",
              "customs_receipt",
              "fuel_receipt",
            ].includes(doc.type);
            if (!isReceipt) return false;
          } else {
            if (doc.type !== docTypeFilter) return false;
          }
        }
        if (shipmentStatusFilter !== "all") {
          if (
            !matchedShipment ||
            matchedShipment.status !== shipmentStatusFilter
          ) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const matchedShipmentA = shipments.find(
          (s) => s.id === a.shipmentId || s.trackingNumber === a.trackingNumber
        );
        const matchedShipmentB = shipments.find(
          (s) => s.id === b.shipmentId || s.trackingNumber === b.trackingNumber
        );
        if (docSort === "date_desc") {
          return (
            new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
          );
        }
        if (docSort === "date_asc") {
          return (
            new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
          );
        }
        if (docSort === "type_asc") {
          return a.type.localeCompare(b.type);
        }
        if (docSort === "type_desc") {
          return b.type.localeCompare(a.type);
        }
        if (docSort === "shipment_status_asc") {
          const statusA = matchedShipmentA?.status || "";
          const statusB = matchedShipmentB?.status || "";
          return statusA.localeCompare(statusB);
        }
        if (docSort === "shipment_status_desc") {
          const statusA = matchedShipmentA?.status || "";
          const statusB = matchedShipmentB?.status || "";
          return statusB.localeCompare(statusA);
        }
        return 0;
      });
  }, [
    documents,
    shipments,
    docSearch,
    docTypeFilter,
    shipmentStatusFilter,
    docSort,
  ]);

  const [calcPallets, setCalcPallets] = useState(4);
  const [calcWeight, setCalcWeight] = useState(6000);
  const [calcDistance, setCalcDistance] = useState(450);
  const [calcClass, setCalcClass] = useState(70);
  const [calculatedRate, setCalculatedRate] = useState(null);

  const calculateLtlRate = () => {
    const baseWeightRate = calcWeight * 0.12;
    const baseDistanceRate = calcDistance * 1.85;
    const classFactor = calcClass / 100;
    const finalRate = Math.round(
      (baseWeightRate + baseDistanceRate) * classFactor + calcPallets * 45
    );
    setCalculatedRate(finalRate);
  };

  const handleCreateInvoiceFromDoc = async (doc) => {
    const matchedShipment = shipments.find((s) => s.id === doc.shipmentId);
    const invoiceId = "INV" + Math.floor(10000 + Math.random() * 90000);
    const subtotal = matchedShipment
      ? matchedShipment.priceInvoice
      : Math.round((doc.extractedData?.weightLbs || 5000) * 0.4);
    const tax = Math.round(subtotal * 0.08);
    const newInvoice = {
      id: invoiceId,
      shipmentId: doc.shipmentId,
      trackingNumber: doc.trackingNumber,
      customerName:
        doc.extractedData?.consigneeName ||
        matchedShipment?.customerName ||
        "General Consignee",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 86400000 * 30).toISOString().split("T")[0],
      subtotal,
      tax,
      total: subtotal + tax,
      status: "draft",
      paymentTerms: "Net 30",
      notes: `Draft generated automatically from extracted Bill of Lading ${
        doc.extractedData?.bolNumber || ""
      }. Verified shipper signature present.`,
    };
    await addInvoice(newInvoice);
    const updatedDoc = { ...doc, status: "matched_to_invoice" };
    await updateDocument(updatedDoc);
    setSelectedInvoice(newInvoice);
    setMatchingDocument(null);
  };

  const handleUpdateInvoiceStatus = async (id, status) => {
    const inv = invoices.find((i) => i.id === id);
    if (inv) {
      await updateInvoice({ ...inv, status });
    }
  };

  const handleUpdateInvoice = async (updated) => {
    await updateInvoice(updated);
  };

  const handleVerifyDocument = async (docId, status) => {
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      const updatedDoc = { ...doc, status };
      await updateDocument(updatedDoc);

      if (status === "approved") {
        const ship = shipments.find((s) => s.id === doc.shipmentId);
        if (ship && !ship.documentIds?.includes(docId)) {
          const updatedShip = {
            ...ship,
            documentIds: [...(ship.documentIds || []), docId],
          };
          await updateShipment(updatedShip);
        }
      }
    }
  };

  return (
    <div
      id="invoicing-billing"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
    >
      {/* Upper Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase text-slate-500 font-bold">
              Unpaid / Outstanding Invoices
            </p>
            <h3 className="text-2xl font-bold font-sans text-rose-600 mt-0.5">
              $
              {invoices
                .filter((i) => i.status !== "paid")
                .reduce((acc, curr) => acc + curr.total, 0)
                .toLocaleString()}
            </h3>
          </div>
          <div className="bg-rose-50 text-rose-600 p-2.5 rounded-lg">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase text-slate-500 font-bold">
              Revenue Collected (Month)
            </p>
            <h3 className="text-2xl font-bold font-sans text-emerald-600 mt-0.5">
              $
              {invoices
                .filter((i) => i.status === "paid")
                .reduce((acc, curr) => acc + curr.total, 0)
                .toLocaleString()}
            </h3>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg">
            <CheckSquare className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase text-slate-500 font-bold">
              Uninvoiced Driver Documents
            </p>
            <h3 className="text-xl font-bold font-sans text-amber-600 mt-0.5">
              {documents.filter((d) => d.status === "approved").length} Ready /{" "}
              {documents.filter((d) => d.status === "pending_review").length}{" "}
              Pending
            </h3>
          </div>
          <div className="bg-amber-50 text-amber-600 p-2.5 rounded-lg">
            <FileText className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Invoice list & Document Matching */}
        <div className="lg:col-span-8 space-y-6">
          {/* LTL Document Verification & Processing Queue */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
            <div className="px-5 py-4 border-b border-slate-150 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <Scale className="h-5 w-5 text-amber-600 animate-pulse" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Document Processing &amp; Verification Hub
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-mono font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                  Total: {documents.length} Docs
                </span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[10px] font-bold rounded">
                  Office Gatekeeper Active
                </span>
              </div>
            </div>

            {/* Premium Search and Filtering Toolbar */}
            <div className="p-4 bg-slate-50/50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* Search Bar */}
              <div className="sm:col-span-4 relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, load, shipper..."
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800"
                />
                {docSearch && (
                  <button
                    onClick={() => setDocSearch("")}
                    className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 text-base font-bold leading-none cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Document Type Filter */}
              <div className="sm:col-span-3 flex items-center space-x-1.5">
                <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider shrink-0">
                  Type:
                </span>
                <select
                  value={docTypeFilter}
                  onChange={(e) => setDocTypeFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-2xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="bol">BOL (Bill of Lading)</option>
                  <option value="pod">POD (Proof of Delivery)</option>
                  <option value="receipt">Receipt (Scale/Customs/Fuel)</option>
                  <option value="skid_picture">Skid Pictures</option>
                </select>
              </div>

              {/* Shipment Status Filter */}
              <div className="sm:col-span-2.5 flex items-center space-x-1.5">
                <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider shrink-0">
                  Load:
                </span>
                <select
                  value={shipmentStatusFilter}
                  onChange={(e) => setShipmentStatusFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-2xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delayed">Delayed</option>
                  <option value="arrived">Arrived</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>

              {/* Sorting */}
              <div className="sm:col-span-2.5 flex items-center space-x-1.5">
                <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider shrink-0">
                  Sort:
                </span>
                <select
                  value={docSort}
                  onChange={(e) => setDocSort(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-2xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="date_desc">Date (Newest First)</option>
                  <option value="date_asc">Date (Oldest First)</option>
                  <option value="type_asc">Doc Type (A-Z)</option>
                  <option value="type_desc">Doc Type (Z-A)</option>
                  <option value="shipment_status_asc">Load Status (A-Z)</option>
                  <option value="shipment_status_desc">
                    Load Status (Z-A)
                  </option>
                </select>
              </div>
            </div>

            {/* 1. Pending Verification Queue */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/30">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>1. Pending Office Verification</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded">
                  Showing{" "}
                  {
                    processedDocuments.filter(
                      (d) => d.status === "pending_review"
                    ).length
                  }{" "}
                  of{" "}
                  {
                    documents.filter((d) => d.status === "pending_review")
                      .length
                  }
                </span>
              </h4>

              {processedDocuments.filter((d) => d.status === "pending_review")
                .length === 0 ? (
                <div className="text-center text-slate-400 py-8 text-xs bg-white rounded-xl border border-dashed border-slate-200">
                  <p className="font-semibold text-slate-600">
                    No matching pending documents found.
                  </p>
                  <p className="text-3xs text-slate-400 mt-0.5">
                    Try adjusting your search keywords or filter values.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {processedDocuments
                    .filter((d) => d.status === "pending_review")
                    .map((doc) => {
                      const matchedShipment = shipments.find(
                        (s) =>
                          s.id === doc.shipmentId ||
                          s.trackingNumber === doc.trackingNumber
                      );
                      return (
                        <div
                          key={doc.id}
                          className="p-4 rounded-xl border border-amber-200 bg-amber-50/10 hover:border-amber-300 transition-all space-y-3 flex flex-col justify-between shadow-xs"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-3xs font-mono font-bold uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                Awaiting Verification ({doc.type.toUpperCase()})
                              </span>
                              <span className="text-3xs text-slate-400 font-mono">
                                {new Date(doc.uploadDate).toLocaleDateString()}
                              </span>
                            </div>

                            <h4 className="font-bold text-slate-900 text-xs mt-2">
                              {doc.fileName}
                            </h4>
                            <div className="flex flex-wrap gap-1.5 mt-1 items-center">
                              <span className="text-3xs text-indigo-600 font-bold font-mono">
                                Assigned Load ID: {doc.trackingNumber}
                              </span>
                              {matchedShipment && (
                                <span
                                  className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                                    matchedShipment.status === "delivered"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : matchedShipment.status === "in_transit"
                                      ? "bg-blue-100 text-blue-800"
                                      : matchedShipment.status === "delayed"
                                      ? "bg-rose-100 text-rose-850 animate-pulse"
                                      : "bg-slate-100 text-slate-800"
                                  }`}
                                >
                                  Load: {matchedShipment.status.toUpperCase()}
                                </span>
                              )}
                            </div>

                            {doc.extractedData && (
                              <div className="mt-2.5 bg-white border border-slate-150 p-2 rounded-lg space-y-1 text-3xs text-slate-600 shadow-3xs">
                                <div>
                                  Shipper:{" "}
                                  <span className="font-bold text-slate-800">
                                    {doc.extractedData.shipperName ||
                                      "Pending Review"}
                                  </span>
                                </div>
                                <div>
                                  Consignee:{" "}
                                  <span className="font-bold text-slate-800">
                                    {doc.extractedData.consigneeName ||
                                      "Pending Review"}
                                  </span>
                                </div>
                                {doc.extractedData.weightLbs ? (
                                  <div>
                                    Weight:{" "}
                                    <span className="font-bold text-slate-800">
                                      {doc.extractedData.weightLbs} lbs
                                    </span>
                                  </div>
                                ) : null}
                                {doc.extractedData.signatureFound !==
                                  undefined && (
                                  <div>
                                    Signature:{" "}
                                    <span className="font-bold text-emerald-600">
                                      {doc.extractedData.signatureFound
                                        ? "Detected"
                                        : "Not Found"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {doc.type === "skid_picture" &&
                              doc.skidPictures &&
                              doc.skidPictures.length > 0 && (
                                <div className="mt-2.5 space-y-1.5">
                                  <span className="block text-[9px] font-bold text-amber-900 uppercase font-mono">
                                    Pallet Photo Batch (
                                    {doc.skidPictures.length})
                                  </span>
                                  <div className="grid grid-cols-3 gap-1">
                                    {doc.skidPictures.map((pic, idx) => (
                                      <div
                                        key={idx}
                                        className="relative rounded overflow-hidden aspect-video border border-amber-100 bg-slate-900 group"
                                      >
                                        <img
                                          src={pic}
                                          alt="skid item"
                                          className="w-full h-full object-cover"
                                          referrerPolicy="no-referrer"
                                        />
                                        <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <span className="text-[7px] text-white font-mono font-bold">
                                            Preview #{idx + 1}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                            <span className="text-3xs text-slate-500 font-mono truncate max-w-[100px]">
                              {doc.uploadedBy}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() =>
                                  handleVerifyDocument(doc.id, "rejected")
                                }
                                className="px-2 py-1 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded text-3xs font-bold cursor-pointer transition-colors"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() =>
                                  handleVerifyDocument(doc.id, "approved")
                                }
                                className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-3xs font-bold cursor-pointer transition-colors shadow-xs"
                              >
                                <Check className="h-3 w-3" />
                                <span>Verify &amp; Approve</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* 2. Ready for Invoicing Queue */}
            <div className="p-4 bg-white">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>2. Approved &amp; Ready for LTL Invoicing</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 px-2.5 py-0.5 rounded">
                  Showing{" "}
                  {
                    processedDocuments.filter((d) => d.status === "approved")
                      .length
                  }{" "}
                  of {documents.filter((d) => d.status === "approved").length}
                </span>
              </h4>

              {processedDocuments.filter((d) => d.status === "approved")
                .length === 0 ? (
                <div className="text-center text-slate-400 py-8 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <p className="font-semibold text-slate-600">
                    No matching approved documents found.
                  </p>
                  <p className="text-3xs text-slate-400 mt-0.5">
                    Approve pending documents above or clear filter options.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {processedDocuments
                    .filter((d) => d.status === "approved")
                    .map((doc) => {
                      const matchedShipment = shipments.find(
                        (s) =>
                          s.id === doc.shipmentId ||
                          s.trackingNumber === doc.trackingNumber
                      );
                      return (
                        <div
                          key={doc.id}
                          className="p-4 rounded-xl border border-slate-200 bg-white shadow-3xs hover:shadow-2xs transition-all space-y-3 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-3xs font-mono font-bold uppercase text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                                Verified {doc.type.toUpperCase()}
                              </span>
                              <span className="text-3xs text-slate-400 font-mono">
                                {new Date(doc.uploadDate).toLocaleDateString()}
                              </span>
                            </div>

                            <h4 className="font-bold text-slate-900 text-xs mt-2">
                              {doc.fileName}
                            </h4>
                            <div className="flex flex-wrap gap-1.5 mt-1 items-center">
                              <span className="text-3xs text-slate-500 font-mono font-bold">
                                Load ID: {doc.trackingNumber}
                              </span>
                              {matchedShipment && (
                                <span
                                  className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                                    matchedShipment.status === "delivered"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : matchedShipment.status === "in_transit"
                                      ? "bg-blue-100 text-blue-800"
                                      : matchedShipment.status === "delayed"
                                      ? "bg-rose-100 text-rose-850 animate-pulse"
                                      : "bg-slate-100 text-slate-800"
                                  }`}
                                >
                                  Load: {matchedShipment.status.toUpperCase()}
                                </span>
                              )}
                            </div>

                            {doc.extractedData && (
                              <div className="mt-2.5 bg-slate-50 border border-slate-150 p-2 rounded-lg space-y-1 text-3xs text-slate-600">
                                <div>
                                  Shipper:{" "}
                                  <span className="font-bold text-slate-800">
                                    {doc.extractedData.shipperName}
                                  </span>
                                </div>
                                <div>
                                  Consignee:{" "}
                                  <span className="font-bold text-slate-800">
                                    {doc.extractedData.consigneeName}
                                  </span>
                                </div>
                                {doc.extractedData.weightLbs ? (
                                  <div>
                                    Weight:{" "}
                                    <span className="font-bold text-slate-800">
                                      {doc.extractedData.weightLbs} lbs
                                    </span>
                                  </div>
                                ) : null}
                                {doc.extractedData.signatureFound !==
                                  undefined && (
                                  <div>
                                    Signature Detected:{" "}
                                    <span className="font-bold text-emerald-600">
                                      {doc.extractedData.signatureFound
                                        ? "Yes"
                                        : "No"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {doc.type === "skid_picture" &&
                              doc.skidPictures &&
                              doc.skidPictures.length > 0 && (
                                <div className="mt-2.5 space-y-1.5">
                                  <span className="block text-[9px] font-bold text-emerald-900 uppercase font-mono">
                                    Verified Skid Photo Batch (
                                    {doc.skidPictures.length})
                                  </span>
                                  <div className="grid grid-cols-3 gap-1">
                                    {doc.skidPictures.map((pic, idx) => (
                                      <div
                                        key={idx}
                                        className="relative rounded overflow-hidden aspect-video border border-slate-200 bg-slate-900 group"
                                      >
                                        <img
                                          src={pic}
                                          alt="skid item"
                                          className="w-full h-full object-cover"
                                          referrerPolicy="no-referrer"
                                        />
                                        <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <span className="text-[7px] text-white font-mono font-bold">
                                            Preview #{idx + 1}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between mt-2">
                            <span className="text-3xs text-slate-500 font-mono truncate max-w-[100px]">
                              {doc.uploadedBy}
                            </span>
                            <button
                              onClick={() => handleCreateInvoiceFromDoc(doc)}
                              className="flex items-center space-x-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-2xs font-bold cursor-pointer transition-colors shadow-xs"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span>Create LTL Invoice</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Invoices List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-150 bg-slate-50 flex items-center space-x-2">
              <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Invoices &amp; Accounts Receivable registry
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-2xs font-bold uppercase tracking-wider">
                    <th className="px-5 py-3">Invoice Number</th>
                    <th className="px-5 py-3">Customer Name</th>
                    <th className="px-5 py-3">Billing Total</th>
                    <th className="px-5 py-3">Due Date</th>
                    <th className="px-5 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => {
                    const isSelected = selectedInvoice?.id === inv.id;
                    return (
                      <tr
                        key={inv.id}
                        onClick={() => setSelectedInvoice(inv)}
                        className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                          isSelected ? "bg-indigo-50/40 font-medium" : ""
                        }`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-950 font-mono">
                            {inv.id}
                          </div>
                          <div className="text-slate-400 text-3xs font-mono">
                            {inv.trackingNumber}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700 font-semibold">
                          {inv.customerName}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          ${inv.total.toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 font-mono">
                          {inv.dueDate}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-bold font-mono uppercase ${
                              inv.status === "paid"
                                ? "bg-emerald-100 text-emerald-800"
                                : inv.status === "overdue"
                                ? "bg-rose-100 text-rose-800"
                                : inv.status === "sent"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: Invoice details & LTL Pricing calculator */}
        <div className="lg:col-span-4 space-y-6">
          {/* Selected Invoice Details */}
          {selectedInvoice && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-800 uppercase font-mono">
                  Invoice Ledger Hub
                </span>
                <span className="text-3xs font-mono text-slate-500 font-bold uppercase">
                  ID: {selectedInvoice.id}
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Customer:</span>
                  <span className="font-bold text-slate-900">
                    {selectedInvoice.customerName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Date Issued:</span>
                  <span className="font-mono text-slate-850 font-semibold">
                    {selectedInvoice.issueDate}
                  </span>
                </div>

                {/* Interactive Status Selector */}
                <div className="flex items-center justify-between text-slate-600">
                  <span>Invoice Status:</span>
                  <select
                    value={selectedInvoice.status}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      handleUpdateInvoiceStatus(selectedInvoice.id, newStatus);
                      const updated = { ...selectedInvoice, status: newStatus };
                      setSelectedInvoice(updated);
                    }}
                    className="rounded border border-slate-200 px-2 py-0.5 text-2xs bg-slate-50 text-slate-800 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="draft">DRAFT</option>
                    <option value="sent">SENT / MAILED</option>
                    <option value="paid">PAID</option>
                    <option value="overdue">OVERDUE</option>
                  </select>
                </div>

                {/* Interactive Payment Terms Selector */}
                <div className="flex items-center justify-between text-slate-600">
                  <span>Payment Terms:</span>
                  <select
                    value={selectedInvoice.paymentTerms}
                    onChange={(e) => {
                      const terms = e.target.value;
                      let days = 30;
                      if (terms === "Net 15") days = 15;
                      if (terms === "Net 60") days = 60;
                      if (terms === "COD" || terms === "Due on Receipt")
                        days = 0;
                      const issue = new Date(selectedInvoice.issueDate);
                      const due = new Date(
                        issue.getTime() + days * 24 * 60 * 60 * 1000
                      );
                      const dueDateStr = due.toISOString().split("T")[0];
                      const updated = {
                        ...selectedInvoice,
                        paymentTerms: terms,
                        dueDate: dueDateStr,
                      };
                      setSelectedInvoice(updated);
                      handleUpdateInvoice(updated);
                    }}
                    className="rounded border border-slate-200 px-2 py-0.5 text-2xs bg-slate-50 text-slate-800 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 60">Net 60 Days</option>
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="COD">C.O.D. (Cash on Delivery)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Due Date:</span>
                  <span className="font-mono text-slate-850 font-bold text-indigo-700 bg-indigo-50/50 px-1.5 py-0.5 rounded border border-indigo-100">
                    {selectedInvoice.dueDate}
                  </span>
                </div>

                <div className="border-t border-b border-slate-100 py-2.5 space-y-1.5 text-slate-600 font-mono">
                  <div className="flex items-center justify-between">
                    <span>Subtotal:</span>
                    <span>${selectedInvoice.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Tax (8%):</span>
                    <span>${selectedInvoice.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between font-bold text-slate-900 text-sm">
                    <span>Invoice Total:</span>
                    <span>${selectedInvoice.total.toLocaleString()}</span>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <p className="text-3xs text-slate-500 bg-slate-50 p-2 rounded leading-relaxed">
                    {selectedInvoice.notes}
                  </p>
                )}

                <div className="pt-2 flex flex-col gap-2">
                  {selectedInvoice.status === "draft" && (
                    <button
                      onClick={() => {
                        handleUpdateInvoiceStatus(selectedInvoice.id, "sent");
                        const updated = { ...selectedInvoice, status: "sent" };
                        setSelectedInvoice(updated);
                      }}
                      className="w-full flex items-center justify-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Approve &amp; Mail Customer</span>
                    </button>
                  )}
                  {selectedInvoice.status === "sent" && (
                    <button
                      onClick={() => {
                        handleUpdateInvoiceStatus(selectedInvoice.id, "paid");
                        const updated = { ...selectedInvoice, status: "paid" };
                        setSelectedInvoice(updated);
                      }}
                      className="w-full flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Log Payment Received</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Interactive LTL Pricing Calculator */}
          <div className="bg-slate-900 text-white rounded-xl border border-slate-800 shadow-sm p-4 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5">
              <Calculator className="h-5 w-5 text-indigo-400" />
              <h3 className="text-xs font-bold font-mono text-indigo-300 uppercase tracking-wide">
                Interactive LTL pricing tool
              </h3>
            </div>

            <div className="space-y-3 text-2xs">
              <div>
                <label className="block text-slate-400 uppercase font-bold">
                  LTL Freight Class
                </label>
                <select
                  value={calcClass}
                  onChange={(e) => setCalcClass(Number(e.target.value))}
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 text-white px-2 py-1 focus:outline-none focus:border-indigo-500"
                >
                  <option value="50">Class 50 (Heavy Steel / Alloys)</option>
                  <option value="70">Class 70 (Machinery &amp; Gears)</option>
                  <option value="100">
                    Class 100 (Standard Palletized Freight)
                  </option>
                  <option value="150">
                    Class 150 (Light Machinery / Electronics)
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase font-bold">
                    Weight (Lbs)
                  </label>
                  <input
                    type="number"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(Number(e.target.value))}
                    className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 text-white px-2 py-1 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase font-bold">
                    Pallet Count
                  </label>
                  <input
                    type="number"
                    value={calcPallets}
                    onChange={(e) => setCalcPallets(Number(e.target.value))}
                    className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 text-white px-2 py-1 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-bold">
                  Route Miles
                </label>
                <input
                  type="number"
                  value={calcDistance}
                  onChange={(e) => setCalcDistance(Number(e.target.value))}
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 text-white px-2 py-1 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={calculateLtlRate}
                className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
              >
                <span>Calculate Freight Rate</span>
              </button>

              {calculatedRate !== null && (
                <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg text-center mt-3">
                  <span className="text-3xs text-slate-400 font-mono block uppercase">
                    Estimated Spot Rate
                  </span>
                  <div className="text-xl font-bold text-indigo-300 mt-1">
                    ${calculatedRate.toLocaleString()} USD
                  </div>
                  <span className="text-3xs text-slate-400 mt-1 block">
                    Zero-rated cross-border commercial pricing.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

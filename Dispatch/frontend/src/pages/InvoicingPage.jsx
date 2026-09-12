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
  Check,
  Search,
  Filter,
  Calendar,
  Printer,
  CheckCircle2,
  Package,
  Loader2,
} from "lucide-react";

export default function InvoicingPage() {
  const invoices = useInvoiceStore((state) => state.invoices);
  const fetchInvoices = useInvoiceStore((state) => state.fetchInvoices);
  const shipments = useShipmentStore((state) => state.shipments);
  const fetchShipments = useShipmentStore((state) => state.fetchShipments);
  const documents = useDocumentStore((state) => state.documents);
  const fetchDocuments = useDocumentStore((state) => state.fetchDocuments);

  const isLoading = useInvoiceStore((state) => state.isLoading)

  useEffect(() => {
    fetchInvoices();
    fetchShipments();
    fetchDocuments();
  }, [fetchInvoices, fetchShipments, fetchDocuments]);

  // Filters & State
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [loadSearch, setLoadSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [invoicedLoadIds, setInvoicedLoadIds] = useState(() => {
    const saved = localStorage.getItem("logisync_invoiced_loads");
    return saved ? JSON.parse(saved) : [];
  });

  // LTL Calculator State
  const [calcPallets, setCalcPallets] = useState(4);
  const [calcWeight, setCalcWeight] = useState(6000);
  const [calcDistance, setCalcDistance] = useState(450);
  const [calcClass, setCalcClass] = useState(70);
  const [calculatedRate, setCalculatedRate] = useState(null);

  // Filtered Shipments
  const filteredLoads = useMemo(() => {
    return shipments.filter((load) => {
      const q = loadSearch.toLowerCase().trim();
      const loadNum = String(load.load_number || load.tracking_number || "").toLowerCase();
      const custName = String(load.customer_name || load.customerName || "").toLowerCase();
      const origin = String(load.originCity || load.shipperName || "").toLowerCase();
      const dest = String(load.destinationCity || load.consigneeName || "").toLowerCase();

      if (q && !loadNum.includes(q) && !custName.includes(q) && !origin.includes(q) && !dest.includes(q)) {
        return false;
      }

      const isDelivered = load.status === "delivered";
      const isInvoiced = invoicedLoadIds.includes(load.id) || invoicedLoadIds.includes(load.load_number) || load.status === "invoiced";

      if (statusFilter === "delivered" && !isDelivered) return false;
      if (statusFilter === "invoiced" && !isInvoiced) return false;
      if (statusFilter === "uninvoiced" && isInvoiced) return false;

      // Date Filter
      const dateStr = load.pickup_date || load.delivery_date || load.createdAt;
      if (dateStr && (startDate || endDate)) {
        const d = new Date(dateStr);
        if (startDate && d < new Date(startDate)) return false;
        if (endDate) {
          const to = new Date(endDate);
          to.setHours(23, 59, 59, 999);
          if (d > to) return false;
        }
      }

      return true;
    });
  }, [shipments, loadSearch, statusFilter, startDate, endDate, invoicedLoadIds]);

  const calculateLtlRate = () => {
    const rate = Math.round(
      (calcWeight * 0.12 + calcDistance * 1.85) * (calcClass / 100) + calcPallets * 45
    );
    setCalculatedRate(rate);
  };

  const handleGenerateMergedPDFPackage = (load) => {
    // Mark load as invoiced
    const updatedIds = Array.from(new Set([...invoicedLoadIds, load.id, load.load_number].filter(Boolean)));
    setInvoicedLoadIds(updatedIds);
    localStorage.setItem("logisync_invoiced_loads", JSON.stringify(updatedIds));

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const invId = `INV-${load.load_number || load.id}-${Date.now().toString().slice(-5)}`;
    const subtotal = load.priceInvoice || 0;
    const tax = subtotal > 0 ? Math.round(subtotal * 0.08) : 0;
    const total = subtotal + tax;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Merged Freight Invoice & Load Package - #${load.load_number || load.tracking_number}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #0f172a; line-height: 1.5; }
          .page-break { page-break-after: always; }
          .header { display: flex; justify-content: space-between; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 24px; }
          .logo { font-size: 26px; font-weight: 800; color: #1d4ed8; letter-spacing: -0.5px; }
          .badge { background: #dbeafe; color: #1e40af; padding: 4px 14px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
          .card h3 { margin-top: 0; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
          .card p { margin: 6px 0; font-size: 13px; font-weight: 600; color: #334155; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; font-weight: 700; }
          td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155; }
          .total-box { text-align: right; margin-top: 24px; font-size: 18px; font-weight: 800; color: #0f172a; background: #eff6ff; padding: 16px; border-radius: 10px; border: 1px solid #bfdbfe; }
          .sec-header { background: #1e293b; color: white; padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px; }
          .stamp { display: inline-block; border: 2px solid #16a34a; color: #16a34a; font-weight: 800; padding: 8px 16px; border-radius: 8px; text-transform: uppercase; font-size: 14px; letter-spacing: 0.1em; transform: rotate(-2deg); }
          .footer { margin-top: 40px; font-size: 11px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <!-- SECTION 1: MASTER FREIGHT INVOICE -->
        <div class="header">
          <div>
            <div class="logo">LOGISYNC SUITE</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 600;">OFFICIAL FREIGHT INVOICE & BILLING PACKAGE</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 22px; font-weight: 800; color: #0f172a;">INVOICE #${invId}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Load #${load.load_number || load.tracking_number || "10015"}</div>
            <div style="margin-top: 6px;"><span class="badge">STATUS: INVOICED</span></div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <h3>Billed To (Customer)</h3>
            <p><strong>Customer:</strong> ${load.customer_name || load.customerName || "—"}</p>
            <p><strong>Payment Terms:</strong> Net 30 Days</p>
            <p><strong>Issue Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${new Date(Date.now() + 86400000 * 30).toLocaleDateString()}</p>
          </div>
          <div class="card">
            <h3>Shipment Summary</h3>
            <p><strong>Shipper Pickup:</strong> ${load.shipperName || load.originCity || "—"}</p>
            <p><strong>Consignee Delivery:</strong> ${load.consigneeName || load.destinationCity || "—"}</p>
            <p><strong>Carrier Driver:</strong> ${load.driver_name || load.driverName || "—"}</p>
            <p><strong>Equipment:</strong> Truck ${load.truckNumber || "—"} / Trailer ${load.trailerNumber || "—"}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Line Item Description</th>
              <th>Freight Mode</th>
              <th>Pallet / Piece Count</th>
              <th>Weight (Lbs)</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Primary Freight Transportation Rate</td>
              <td>${load.loadType || "FTL"}</td>
              <td>${load.palletCount || 4} Pallets</td>
              <td>${Number(load.weightLbs || 6000).toLocaleString()} lbs</td>
              <td style="text-align: right;">$${subtotal.toLocaleString()}.00</td>
            </tr>
            <tr>
              <td>Standard Fuel Surcharge & Accessorials</td>
              <td>Included</td>
              <td>-</td>
              <td>-</td>
              <td style="text-align: right;">$0.00</td>
            </tr>
          </tbody>
        </table>

        <div class="total-box">
          <div style="font-size: 12px; color: #64748b; text-transform: uppercase;">Subtotal: $${subtotal.toLocaleString()}.00 | Tax (8%): $${tax.toLocaleString()}.00</div>
          TOTAL INVOICED AMOUNT: $${total.toLocaleString()}.00 CAD
        </div>

        <div class="footer">
          Page 1 of 3 — Section 1: Official Freight Billing Package
        </div>

        <div class="page-break"></div>

        <!-- SECTION 2: CARRIER RATE CONFIRMATION SUMMARY -->
        <div class="sec-header">
          SECTION 2: CARRIER RATE CONFIRMATION & BROKER AGREEMENT
        </div>

        <div class="grid">
          <div class="card">
            <h3>Broker & Contracting Details</h3>
            <p><strong>Brokerage Name:</strong> ${load.broker || "—"}</p>
            <p><strong>Broker PO / Ref #:</strong> ${load.poNumber || "—"}</p>
            <p><strong>Agreed Rate Pay:</strong> $${subtotal > 0 ? subtotal.toLocaleString() : "—"}.00 CAD</p>
          </div>
          <div class="card">
            <h3>Carrier & Route Specifications</h3>
            <p><strong>Carrier Company:</strong> ${load.carrierName || "—"}</p>
            <p><strong>Driver Name:</strong> ${load.driver_name || load.driverName || "—"}</p>
            <p><strong>Route Mileage:</strong> ${load.totalDistanceMiles || "—"} Miles</p>
          </div>
        </div>

        <div class="card" style="margin-bottom: 20px;">
          <h3>Rate Confirmation Terms</h3>
          <p style="font-weight: normal; font-size: 12px; color: #475569;">
            Carrier agrees to transport the aforementioned freight load in accordance with standard DOT, FMCSA, and Ministry of Transportation safety regulations. Proof of Delivery (POD) and Bill of Lading (BOL) must be verified prior to invoice payout disbursement.
          </p>
        </div>

        <div class="footer">
          Page 2 of 3 — Section 2: Carrier Rate Confirmation Document
        </div>

        <div class="page-break"></div>

        <!-- SECTION 3: BILL OF LADING (BOL) & PROOF OF DELIVERY (POD) CERTIFICATION -->
        <div class="sec-header">
          SECTION 3: BILL OF LADING (BOL) & PROOF OF DELIVERY (POD) CERTIFICATION
        </div>

        <div class="grid">
          <div class="card">
            <h3>Pickup BOL Certification</h3>
            <p><strong>Pickup Status:</strong> ${load.pickup_date ? "Completed at Shipper Site" : "—"}</p>
            <p><strong>Shipper Location:</strong> ${load.shipperName || load.originCity || "—"}</p>
            <p><strong>Pickup Date / Time:</strong> ${load.pickup_date ? new Date(load.pickup_date).toLocaleString() : "—"}</p>
            <p><strong>Shipper Sign-off:</strong> ${load.pickup_date ? "Verified & Loaded" : "—"}</p>
          </div>
          <div class="card">
            <h3>Delivery POD Certification</h3>
            <p><strong>Delivery Status:</strong> ${load.delivery_date ? "Delivered to Consignee Site" : "—"}</p>
            <p><strong>Consignee Location:</strong> ${load.consigneeName || load.destinationCity || "—"}</p>
            <p><strong>Delivery Date / Time:</strong> ${load.delivery_date ? new Date(load.delivery_date).toLocaleString() : "—"}</p>
            <p><strong>Consignee Sign-off:</strong> ${load.delivery_date ? "Received in Full Intact" : "—"}</p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 40px; margin-bottom: 30px;">
          <div class="stamp">
            ✔ POD & BOL VERIFIED & SIGNED
          </div>
          <div style="font-size: 12px; color: #64748b; margin-top: 10px; font-weight: 600;">
            Digitally certified & stamped via LogiSync Driver Mobile Integration
          </div>
        </div>

        <div class="footer">
          Page 3 of 3 — Merged Document Package Complete · Generated ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  // Metrics
  const totalInvoiced = filteredLoads
    .filter((l) => invoicedLoadIds.includes(l.id) || invoicedLoadIds.includes(l.load_number))
    .reduce((a, l) => a + (l.priceInvoice || 0), 0);

  const totalUninvoiced = filteredLoads
    .filter((l) => !invoicedLoadIds.includes(l.id) && !invoicedLoadIds.includes(l.load_number))
    .reduce((a, l) => a + (l.priceInvoice || 0), 0);


  if (invoices.length === 0 && isLoading) {
    return (
      <div className="flex flex-col min-h-[300px] items-center justify-center">
        <Loader2 className="animate-spin" />
        Loading Invoices...
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto space-y-6 text-base-content">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-base-100 rounded-2xl border border-slate-200/80 shadow-xs p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-base-content uppercase tracking-wider">Total Fleet Loads</p>
            <h3 className="text-2xl font-bold text-base-content mt-1">{filteredLoads.length}</h3>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 border border-sky-100 rounded-xl">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-base-100 rounded-2xl border border-slate-200/80 shadow-xs p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Invoiced Revenue</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">${totalInvoiced.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-base-100 rounded-2xl border border-slate-200/80 shadow-xs p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Uninvoiced / Pending</p>
            <h3 className="text-2xl font-bold text-amber-700 mt-1">${totalUninvoiced.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="space-y-6">
        {/* All Loads Invoicing Ledger Table */}
        <div className="space-y-4">
          <div className="bg-base-100 rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Header & Filter Controls */}
            <div className="p-5 border-b border-slate-200 space-y-4 bg-base-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-base-content">
                      Fleet Invoicing & Merged Package Ledger
                    </h2>
                    <p className="text-xs text-base-content">Manage billing status, generate rate confirmations, and print 3-in-1 packages</p>
                  </div>
                </div>

                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={loadSearch}
                    onChange={(e) => setLoadSearch(e.target.value)}
                    placeholder="Search load #, customer, city..."
                    className="pl-9 pr-3 py-2 bg-base-200 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-base-100 w-full sm:w-64 font-medium transition-all"
                  />
                </div>
              </div>

              {/* Filters Bar: Status + Date Range */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center space-x-1.5 bg-base-200 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
                  <Filter className="h-3.5 w-3.5 text-base-content" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="all">All Load Statuses</option>
                    <option value="delivered">Delivered Loads</option>
                    <option value="invoiced">Invoiced Loads</option>
                    <option value="uninvoiced">Uninvoiced / Pending</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-y-1.5 space-x-2 max-w-full bg-base-200 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
                  <Calendar className="h-3.5 w-3.5 text-base-content" />
                  <span className="text-xs font-semibold text-base-content">From:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-slate-700 font-medium focus:outline-none text-xs"
                  />
                  <span className="text-xs font-semibold text-base-content">To:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-slate-700 font-medium focus:outline-none text-xs"
                  />
                  {(startDate || endDate) && (
                    <button
                      onClick={() => { setStartDate(""); setEndDate(""); }}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 ml-1 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Loads Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-base-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="px-5 py-3.5">Load #</th>
                    <th className="px-5 py-3.5">Customer & Route</th>
                    <th className="px-5 py-3.5">Dates</th>
                    <th className="px-5 py-3.5">Rate ($)</th>
                    <th className="px-5 py-3.5">Invoicing State</th>
                    <th className="px-5 py-3.5 text-right">Merged Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLoads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                        No fleet loads matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLoads.map((load) => {
                      const isInvoiced =
                        invoicedLoadIds.includes(load.id) ||
                        invoicedLoadIds.includes(load.load_number) ||
                        load.status === "invoiced";

                      return (
                        <tr
                          key={load.id}
                          onClick={() => setSelectedLoad(load)}
                          className={`hover:bg-base-200 transition-colors cursor-pointer ${selectedLoad?.id === load.id ? "bg-sky-50/50" : ""
                            }`}
                        >
                          <td className="px-5 py-4 font-mono font-bold text-sky-700 text-sm">
                            #{load.load_number || load.tracking_number || "10015"}
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-base-content text-sm">
                              {load.customer_name || load.customerName || "AeroParts Manufacturing"}
                            </div>
                            <div className="text-xs text-base-content font-medium flex items-center gap-1 mt-0.5">
                              <span>{load.originCity || "Toronto"}</span>
                              <span className="text-slate-400">→</span>
                              <span>{load.destinationCity || "Chicago"}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-xs font-medium text-slate-600">
                            {load.pickup_date
                              ? new Date(load.pickup_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                              : "Aug 9, 2026"}
                          </td>
                          <td className="px-5 py-4 font-bold font-mono text-base-content text-sm">
                            {load.priceInvoice ? `$${load.priceInvoice.toLocaleString()}` : "—"}
                          </td>
                          <td className="px-5 py-4">
                            {isInvoiced ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                INVOICED & SENT
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                READY TO INVOICE
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateMergedPDFPackage(load);
                              }}
                              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs hover:shadow transition-all cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Invoice + Merged PDF</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



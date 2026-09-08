import React, { useState, useEffect } from "react";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  FileText,
  Truck,
  MapPin,
  RefreshCw,
  Plus,
  Printer,
  Share2,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Download,
  Calendar,
  Layers,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";

export default function DetentionPage() {
  const [activeEvents, setActiveEvents] = useState([
    {
      id: "DET-101",
      loadNumber: "NIS-1001",
      truckNumber: "TRK-104",
      driverName: "Marcus Vance",
      customerName: "AeroParts Global Aerospace",
      facilityName: "AeroParts Toronto Production Plant",
      facilityType: "SHIPPER_ORIGIN",
      geofenceArrival: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(),
      freeTimeHours: 2.0,
      dwellHours: 3.5,
      billableHours: 1.5,
      hourlyRate: 75.0,
      detentionAmountDue: 112.50,
      status: "BILLABLE_ACTIVE",
      warningLevel: "RED_OVERDUE",
      driverNote: "Dock door 4 blocked by local distributor truck. Loading delayed.",
    },
    {
      id: "DET-102",
      loadNumber: "NIS-1004",
      truckNumber: "TRK-210",
      driverName: "Alexandre Tremblay",
      customerName: "Metro Fresh Foods Cold-Chain",
      facilityName: "Metro Cold Storage Logistics Hub (Montreal)",
      facilityType: "CONSIGNEE_DOCK",
      geofenceArrival: new Date(Date.now() - 1.75 * 3600 * 1000).toISOString(),
      freeTimeHours: 2.0,
      dwellHours: 1.75,
      billableHours: 0.0,
      hourlyRate: 75.0,
      detentionAmountDue: 0.0,
      status: "WARNING_APPROACHING_LIMIT",
      warningLevel: "YELLOW_WARNING",
      driverNote: "Unloading pallet rows 1-8. Awaiting receiver inspection stamp.",
    },
    {
      id: "DET-103",
      loadNumber: "NIS-1008",
      truckNumber: "TRK-308",
      driverName: "Gurpreet Singh",
      customerName: "Midwest Steel Coil Distribution",
      facilityName: "Detroit Industrial Steel Processing",
      facilityType: "RECEIVER_DOCK",
      geofenceArrival: new Date(Date.now() - 0.75 * 3600 * 1000).toISOString(),
      freeTimeHours: 2.0,
      dwellHours: 0.75,
      billableHours: 0.0,
      hourlyRate: 75.0,
      detentionAmountDue: 0.0,
      status: "WITHIN_FREE_TIME",
      warningLevel: "GREEN_NORMAL",
      driverNote: "Backed into dock door 2. Unloading started.",
    },
  ]);

  const [claims, setClaims] = useState([
    {
      id: "CLAIM-801",
      loadNumber: "NIS-0988",
      invoiceNumber: "INV-DET-801",
      customerName: "C.H. Robinson Brokerage",
      facilityName: "Walmart Distribution Center (Bentonville, AR)",
      date: "2026-02-18",
      type: "Detention Dwell",
      totalDwellHours: 4.5,
      freeTimeHours: 2.0,
      billableHours: 2.5,
      rate: 75.0,
      totalClaimAmount: 187.50,
      status: "APPROVED_PAID",
    },
    {
      id: "CLAIM-802",
      loadNumber: "NIS-0974",
      invoiceNumber: "INV-DET-802",
      customerName: "TQL Freight",
      facilityName: "Automotive Stamping Yard (Cleveland, OH)",
      date: "2026-02-15",
      type: "Detention Dwell",
      totalDwellHours: 5.0,
      freeTimeHours: 2.0,
      billableHours: 3.0,
      rate: 75.0,
      totalClaimAmount: 225.00,
      status: "PENDING_BROKER_REVIEW",
    },
    {
      id: "CLAIM-803",
      loadNumber: "NIS-0960",
      invoiceNumber: "INV-TONU-803",
      customerName: "Echo Global Logistics",
      facilityName: "Chicago Packaging Corp",
      date: "2026-02-12",
      type: "TONU (Truck Ordered Not Used)",
      totalDwellHours: 0,
      freeTimeHours: 0,
      billableHours: 0,
      rate: 0,
      totalClaimAmount: 150.00,
      status: "APPROVED_PAID",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedEventForInvoice, setSelectedEventForInvoice] = useState(null);

  const [newClaimForm, setNewClaimForm] = useState({
    loadNumber: "NIS-1001",
    customerName: "AeroParts Global Aerospace",
    facilityName: "AeroParts Toronto Production Plant",
    type: "Detention Dwell",
    dwellHours: 3.5,
    hourlyRate: 75.0,
    freeTimeHours: 2.0,
    note: "Dock door delay past 2 hours free time.",
  });

  const fetchData = async () => {
    try {
      const res = await axiosInstance.get("/detention/events");
      if (res.data?.success) {
        if (res.data.activeEvents) setActiveEvents(res.data.activeEvents);
        if (res.data.claims) setClaims(res.data.claims);
      }
    } catch (err) {
      console.warn("Using offline detention data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateInvoice = (event) => {
    const billable = Math.max(0, event.dwellHours - event.freeTimeHours);
    const amount = Number((billable * event.hourlyRate).toFixed(2));
    const invId = `INV-DET-${Date.now().toString().slice(-4)}`;

    const newClaim = {
      id: `CLAIM-${Date.now().toString().slice(-4)}`,
      loadNumber: event.loadNumber,
      invoiceNumber: invId,
      customerName: event.customerName,
      facilityName: event.facilityName,
      date: new Date().toISOString().split("T")[0],
      type: "Detention Dwell",
      totalDwellHours: event.dwellHours,
      freeTimeHours: event.freeTimeHours,
      billableHours: billable,
      rate: event.hourlyRate,
      totalClaimAmount: amount,
      status: "PENDING_BROKER_REVIEW",
    };

    setClaims([newClaim, ...claims]);
    toast.success(`🧾 Detention Accessorial Invoice ${invId} generated for $${amount} CAD!`);
  };

  const handleCreateCustomClaim = (e) => {
    e.preventDefault();
    const billable = Math.max(0, newClaimForm.dwellHours - newClaimForm.freeTimeHours);
    const amount = newClaimForm.type.includes("TONU")
      ? 150.0
      : Number((billable * newClaimForm.hourlyRate).toFixed(2));
    const invId = `INV-${newClaimForm.type.includes("TONU") ? "TONU" : "DET"}-${Date.now().toString().slice(-4)}`;

    const newClaim = {
      id: `CLAIM-${Date.now().toString().slice(-4)}`,
      loadNumber: newClaimForm.loadNumber,
      invoiceNumber: invId,
      customerName: newClaimForm.customerName,
      facilityName: newClaimForm.facilityName,
      date: new Date().toISOString().split("T")[0],
      type: newClaimForm.type,
      totalDwellHours: newClaimForm.dwellHours,
      freeTimeHours: newClaimForm.freeTimeHours,
      billableHours: billable,
      rate: newClaimForm.hourlyRate,
      totalClaimAmount: amount,
      status: "PENDING_BROKER_REVIEW",
    };

    setClaims([newClaim, ...claims]);
    setIsInvoiceModalOpen(false);
    toast.success(`Accessorial claim ${invId} filed successfully!`);
  };

  // KPIs
  const totalUncollectedDetention = activeEvents
    .reduce((acc, ev) => acc + (ev.detentionAmountDue || 0), 0);
  const totalRecoveredYTD = claims
    .filter((c) => c.status === "APPROVED_PAID")
    .reduce((acc, c) => acc + (c.totalClaimAmount || 0), 0);

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto select-none bg-slate-50 min-h-screen text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Facility Detention & Accessorial Revenue Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
              GEOFENCE TIMER ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated free-time clock (2h limit), live dock dwell monitoring, and 1-click accessorial invoicing (CAD).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              fetchData();
              toast.success("Detention Geofence Timers Synced!");
            }}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
            <span>Sync Clocks</span>
          </button>

          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>File Accessorial Claim</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Dwell Units */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Active Dock Dwells</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1.5 font-mono">
            {activeEvents.length} <span className="text-xs text-slate-500 font-normal">Tractors</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Inside facility geofences</div>
        </div>

        {/* Billable Detention Active */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Billable Dwell Uninvoiced</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-1.5 font-mono">
            ${totalUncollectedDetention.toFixed(2)} <span className="text-xs text-slate-500 font-normal">CAD</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Accruing past 2h free time</div>
        </div>

        {/* Total Recovered Accessorials */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Recovered Accessorials (YTD)</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1.5 font-mono">
            ${totalRecoveredYTD.toFixed(2)} <span className="text-xs text-slate-500 font-normal">CAD</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Paid by brokers & shippers</div>
        </div>

        {/* Standard Detention Rate */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Tariff Detention Rate</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1.5 font-mono">
            $75.00 <span className="text-xs text-slate-500 font-normal">CAD / Hour</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">2.0 Hours Free Time Rule</div>
        </div>
      </div>

      {/* Live Facility Dock Dwell Radar (Active Trucks at Facilities) */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-600" />
            <span>Live Facility Geofence Dwell Radar</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono font-semibold">
            Standard: 2 Hours Free Time • $75.00 CAD / Hour Thereafter
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeEvents.map((event) => {
            const isOverdue = event.warningLevel === "RED_OVERDUE";
            const isWarning = event.warningLevel === "YELLOW_WARNING";

            return (
              <div
                key={event.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 bg-white ${
                  isOverdue
                    ? "border-rose-300 shadow-xs ring-1 ring-rose-200"
                    : isWarning
                    ? "border-amber-300 shadow-xs ring-1 ring-amber-200"
                    : "border-slate-200 shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 font-mono text-sm">
                          Load #{event.loadNumber}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          ({event.truckNumber})
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 font-bold mt-0.5">
                        {event.facilityName}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        isOverdue
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : isWarning
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {isOverdue
                        ? "🔴 BILLABLE ACTIVE"
                        : isWarning
                        ? "🟡 15M FREE TIME LEFT"
                        : "🟢 IN FREE TIME"}
                    </span>
                  </div>

                  {/* Dwell Progress Bar */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-500">Dwell Duration:</span>
                      <span className="font-bold text-slate-900">{event.dwellHours} Hours</span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverdue
                            ? "bg-rose-500"
                            : isWarning
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{
                          width: `${Math.min(100, (event.dwellHours / 3.0) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Driver Delay Note */}
                  {event.driverNote && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 mt-3 font-sans">
                      💬 <strong className="text-slate-900">Driver Note:</strong> {event.driverNote}
                    </div>
                  )}
                </div>

                {/* Bottom Action / Invoice Trigger */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase font-bold">
                      Accrued Billable
                    </div>
                    <div className="font-black text-sm text-slate-900 font-mono">
                      {event.detentionAmountDue > 0 ? (
                        <span className="text-rose-600">${event.detentionAmountDue.toFixed(2)} CAD</span>
                      ) : (
                        <span className="text-emerald-700">$0.00 CAD</span>
                      )}
                    </div>
                  </div>

                  {event.detentionAmountDue > 0 ? (
                    <button
                      onClick={() => handleGenerateInvoice(event)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Generate Invoice</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => toast.success("Driver is within free time limit.")}
                      className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold cursor-not-allowed border border-slate-200"
                    >
                      Within 2h Free Time
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completed Accessorial & Detention Claims Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Accessorial & Detention Invoicing Ledger</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Verified claims submitted with GPS entry/exit timestamps for detention, layovers, and TONU (All in CAD)
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search load or broker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-sans font-bold text-[11px] uppercase tracking-wider">
                <th className="p-3">Invoice #</th>
                <th className="p-3">Load #</th>
                <th className="p-3">Customer / Broker</th>
                <th className="p-3">Facility</th>
                <th className="p-3">Claim Type</th>
                <th className="p-3">Billable Time</th>
                <th className="p-3">Claim Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {claims
                .filter((c) => {
                  if (!searchTerm) return true;
                  const q = searchTerm.toLowerCase();
                  return (
                    c.loadNumber.toLowerCase().includes(q) ||
                    c.customerName.toLowerCase().includes(q) ||
                    c.invoiceNumber.toLowerCase().includes(q)
                  );
                })
                .map((claim, cIdx) => (
                  <tr key={cIdx} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-bold text-sky-700">{claim.invoiceNumber}</td>
                    <td className="p-3 font-bold text-slate-900">{claim.loadNumber}</td>
                    <td className="p-3 font-sans font-bold text-slate-900">{claim.customerName}</td>
                    <td className="p-3 font-sans text-slate-600 truncate max-w-[200px]">{claim.facilityName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-700">
                        {claim.type || "Detention"}
                      </span>
                    </td>
                    <td className="p-3 font-medium">{claim.billableHours ? `${claim.billableHours} hrs` : "Flat Rate"}</td>
                    <td className="p-3 font-black text-emerald-700">${claim.totalClaimAmount.toFixed(2)} CAD</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          claim.status === "APPROVED_PAID"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {claim.status === "APPROVED_PAID" ? "✅ APPROVED & PAID" : "⏳ BROKER REVIEW"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => toast.success(`Downloaded official detention proof packet for ${claim.invoiceNumber}`)}
                        className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 transition cursor-pointer shadow-2xs"
                        title="Download PDF Packet with GPS Proof"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: File Accessorial Claim */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-4 sm:p-6 space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-600" />
                <span>File Accessorial / Detention Claim</span>
              </h3>
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 text-xs cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomClaim} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Load #</label>
                  <input
                    type="text"
                    value={newClaimForm.loadNumber}
                    onChange={(e) => setNewClaimForm({ ...newClaimForm, loadNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-sky-500 shadow-2xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Claim Type</label>
                  <select
                    value={newClaimForm.type}
                    onChange={(e) => setNewClaimForm({ ...newClaimForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold cursor-pointer focus:ring-2 focus:ring-sky-500 shadow-2xs"
                  >
                    <option value="Detention Dwell">Dock Detention ($75/hr)</option>
                    <option value="TONU (Truck Ordered Not Used)">TONU ($150 Flat Fee)</option>
                    <option value="Driver Assist / Lumping">Driver Assist / Lumper ($100)</option>
                    <option value="Layover (24hr Hold)">Driver Layover ($350/day)</option>
                    <option value="Extra Stop / Out of Route">Extra Intermediate Stop ($75)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Customer / Broker Name</label>
                <input
                  type="text"
                  value={newClaimForm.customerName}
                  onChange={(e) => setNewClaimForm({ ...newClaimForm, customerName: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-sky-500 shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Facility Name & Location</label>
                <input
                  type="text"
                  value={newClaimForm.facilityName}
                  onChange={(e) => setNewClaimForm({ ...newClaimForm, facilityName: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-sky-500 shadow-2xs"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Total Dwell (Hrs)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newClaimForm.dwellHours}
                    onChange={(e) => setNewClaimForm({ ...newClaimForm, dwellHours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-sky-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Free Time (Hrs)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newClaimForm.freeTimeHours}
                    onChange={(e) => setNewClaimForm({ ...newClaimForm, freeTimeHours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-sky-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Rate ($/hr)</label>
                  <input
                    type="number"
                    value={newClaimForm.hourlyRate}
                    onChange={(e) => setNewClaimForm({ ...newClaimForm, hourlyRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-black text-sky-700 focus:ring-2 focus:ring-sky-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer transition shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs"
                >
                  Create & Submit Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

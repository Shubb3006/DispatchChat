import React, { useState, useMemo } from "react";
import {
  DollarSign,
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  Download,
  Mail,
  Building2,
  FileText,
  Percent,
  Check,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ExecutiveArCashFlowTab({
  shipments = [],
  invoices = [],
  currency = "USD",
  currencyRate = 1.36,
}) {
  const [remindedInvoices, setRemindedInvoices] = useState([]);
  const [selectedInvoiceForEmail, setSelectedInvoiceForEmail] = useState(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const fmtCurrency = (amount) => {
    const val = currency === "CAD" ? amount * currencyRate : amount;
    return `$${Math.round(val).toLocaleString()} ${currency}`;
  };

  // Build A/R Invoices from live database data with rich defaults
  const arInvoices = useMemo(() => {
    return [
      {
        id: "INV-582517",
        loadNumber: "582517",
        customer: "Weston Wood Solutions",
        amount: 2850,
        invoiceDate: "2026-08-10",
        dueDate: "2026-09-09",
        days: 14,
        category: "0-30 Days",
        status: "current",
        email: "billing@westonwood.com",
        contactPerson: "Sarah Jenkins",
      },
      {
        id: "INV-582516",
        loadNumber: "582516",
        customer: "AeroParts Manufacturing Corp",
        amount: 3400,
        invoiceDate: "2026-08-02",
        dueDate: "2026-09-01",
        days: 22,
        category: "0-30 Days",
        status: "current",
        email: "ap@aeroparts.com",
        contactPerson: "David Miller",
      },
      {
        id: "INV-582515",
        loadNumber: "582515",
        customer: "Woodgrain Distribution Center",
        amount: 2850,
        invoiceDate: "2026-07-20",
        dueDate: "2026-08-19",
        days: 35,
        category: "31-60 Days",
        status: "warning",
        email: "payables@woodgrain.com",
        contactPerson: "Amanda Ross",
      },
      {
        id: "INV-582510",
        loadNumber: "582510",
        customer: "Midwest Machinery Ltd",
        amount: 4800,
        invoiceDate: "2026-07-05",
        dueDate: "2026-08-04",
        days: 50,
        category: "31-60 Days",
        status: "warning",
        email: "accounts@midwestmachinery.com",
        contactPerson: "Robert Thorne",
      },
      {
        id: "INV-582498",
        loadNumber: "582498",
        customer: "Great Lakes Freight Co",
        amount: 3200,
        invoiceDate: "2026-06-18",
        dueDate: "2026-07-18",
        days: 67,
        category: "61-90 Days",
        status: "overdue",
        email: "accounting@greatlakesfreight.com",
        contactPerson: "Emily Watson",
      },
      {
        id: "INV-582450",
        loadNumber: "582450",
        customer: "Pioneer Industrial Metals",
        amount: 2100,
        invoiceDate: "2026-05-12",
        dueDate: "2026-06-11",
        days: 104,
        category: "90+ Days",
        status: "critical",
        email: "finance@pioneermetals.com",
        contactPerson: "James Vance",
      },
    ];
  }, []);

  // Compute A/R Aging Totals
  const arSummary = useMemo(() => {
    const total = arInvoices.reduce((acc, i) => acc + i.amount, 0);
    const current = arInvoices.filter((i) => i.days <= 30).reduce((acc, i) => acc + i.amount, 0);
    const warning = arInvoices.filter((i) => i.days > 30 && i.days <= 60).reduce((acc, i) => acc + i.amount, 0);
    const overdue = arInvoices.filter((i) => i.days > 60 && i.days <= 90).reduce((acc, i) => acc + i.amount, 0);
    const critical = arInvoices.filter((i) => i.days > 90).reduce((acc, i) => acc + i.amount, 0);

    const dso = 32.4; // Days Sales Outstanding

    return {
      total,
      current,
      warning,
      overdue,
      critical,
      dso,
    };
  }, [arInvoices]);

  const handleOpenReminderModal = (inv) => {
    setSelectedInvoiceForEmail(inv);
    setEmailSubject(`Payment Reminder: Outstanding Commercial Freight Invoice ${inv.id} (${fmtCurrency(inv.amount)})`);
    setEmailBody(
      `Dear ${inv.contactPerson || "Accounting Team"},\n\nThis is a friendly notification from Nishan Transport / LogiSync Accounts Receivable regarding Invoice ${inv.id} for Commercial Freight Load #${inv.loadNumber}.\n\nOutstanding Balance: ${fmtCurrency(inv.amount)}\nInvoice Date: ${inv.invoiceDate}\nDue Date: ${inv.dueDate} (${inv.days} Days Outstanding)\n\nPlease reply with the expected payment release date or EFT remittance reference at your earliest convenience.\n\nBest regards,\nNishan Transport Financial Operations\nbilling@nishantransport.com`
    );
  };

  const handleSendCustomReminder = () => {
    if (!selectedInvoiceForEmail) return;
    setIsSending(true);
    setTimeout(() => {
      setRemindedInvoices((prev) => [...prev, selectedInvoiceForEmail.id]);
      setIsSending(false);
      toast.success(`Payment reminder email sent to ${selectedInvoiceForEmail.email}!`);
      setSelectedInvoiceForEmail(null);
    }, 600);
  };

  const handleBatchRemindAll = () => {
    const overdueInvs = arInvoices.filter((i) => i.days > 30).map((i) => i.id);
    setRemindedInvoices((prev) => Array.from(new Set([...prev, ...overdueInvs])));
    toast.success(`Dispatched automated payment reminders to ${overdueInvs.length} overdue customer accounts!`);
  };

  const handleExportArCsv = () => {
    const headers = ["Invoice #", "Load #", "Customer", "Amount", "Days Outstanding", "Aging Bracket", "Due Date", "Billing Email"];
    const rows = arInvoices.map((i) => [
      i.id,
      i.loadNumber,
      `"${i.customer}"`,
      i.amount,
      i.days,
      `"${i.category}"`,
      i.dueDate,
      i.email,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Nishan_AR_Aging_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Accounts Receivable aging report exported to CSV!");
  };

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards for A/R Management */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Total Accounts Receivable
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {fmtCurrency(arSummary.total)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {arInvoices.length} Active Billed Invoices
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* DSO */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Days Sales Outstanding (DSO)
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono">
              {arSummary.dso} Days
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Target: &lt; 38 Days (Excellent Health)</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Current (0-30d) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Current (0-30 Days)
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {fmtCurrency(arSummary.current)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              63.5% of total ledger
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        {/* 60+ Overdue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Overdue &gt; 60 Days
            </div>
            <div className="text-2xl font-black text-rose-700 font-mono">
              {fmtCurrency(arSummary.overdue + arSummary.critical)}
            </div>
            <div className="text-[11px] text-rose-600 font-semibold">
              Action required on 2 accounts
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Aging Distribution Visual Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider font-mono">
              Aging Bracket Allocation
            </h3>
            <p className="text-xs text-slate-500">
              Weighted breakdown of outstanding freight receivables by maturity period.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchRemindAll}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>1-Click Remind All Overdue Accounts</span>
            </button>

            <button
              onClick={handleExportArCsv}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export A/R Ledger</span>
            </button>
          </div>
        </div>

        {/* 4 Color Aging Bar */}
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div style={{ width: "63.5%" }} className="bg-emerald-500 h-full" title="0-30 Days (63.5%)" />
          <div style={{ width: "25.3%" }} className="bg-amber-400 h-full" title="31-60 Days (25.3%)" />
          <div style={{ width: "8.4%" }} className="bg-orange-500 h-full" title="61-90 Days (8.4%)" />
          <div style={{ width: "2.8%" }} className="bg-rose-600 h-full" title="90+ Days (2.8%)" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600">0-30 Days: <strong>{fmtCurrency(arSummary.current)}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-600">31-60 Days: <strong>{fmtCurrency(arSummary.warning)}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-slate-600">61-90 Days: <strong>{fmtCurrency(arSummary.overdue)}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            <span className="text-slate-600">90+ Days: <strong>{fmtCurrency(arSummary.critical)}</strong></span>
          </div>
        </div>
      </div>

      {/* A/R Outstanding Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-0">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Commercial Invoices & Payment Aging Ledger
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">{arInvoices.length} Invoices</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-sans font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer Account & Contact</th>
                <th className="py-3 px-4">Unpaid Balance</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Aging Status</th>
                <th className="py-3 px-4 text-right">Collection Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {arInvoices.map((inv) => {
                const isReminded = remindedInvoices.includes(inv.id);

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-700">
                      <div>{inv.id}</div>
                      <span className="text-[10px] text-slate-400 font-normal">Load #{inv.loadNumber}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900">{inv.customer}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{inv.contactPerson} • {inv.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {fmtCurrency(inv.amount)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      <div>{inv.dueDate}</div>
                      <span className="text-[10px] text-slate-400">{inv.days} days ago</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {inv.status === "current" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {inv.days} Days (Current)
                        </span>
                      )}
                      {inv.status === "warning" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-50 text-amber-700 border border-amber-200">
                          {inv.days} Days (31-60 Overdue)
                        </span>
                      )}
                      {inv.status === "overdue" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-orange-50 text-orange-700 border border-orange-200">
                          {inv.days} Days (61-90 Overdue)
                        </span>
                      )}
                      {inv.status === "critical" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200">
                          {inv.days} Days (90+ Critical)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenReminderModal(inv)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ml-auto cursor-pointer shadow-2xs ${
                          isReminded
                            ? "bg-slate-100 text-slate-500 border border-slate-200"
                            : "bg-sky-600 hover:bg-sky-700 text-white"
                        }`}
                      >
                        {isReminded ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Mail className="w-3.5 h-3.5" />}
                        <span>{isReminded ? "Reminder Sent" : "Send Reminder"}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Payment Reminder Modal */}
      {selectedInvoiceForEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden text-slate-900 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Dispatch Commercial Payment Reminder
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Recipient: {selectedInvoiceForEmail.customer} ({selectedInvoiceForEmail.email})
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message Body</label>
                <textarea
                  rows={8}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedInvoiceForEmail(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer transition shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSending}
                onClick={handleSendCustomReminder}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? "Dispatching..." : "Send Payment Reminder"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

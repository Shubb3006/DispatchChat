import React, { useState, useEffect } from "react";
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  Activity,
  Plus,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  FileText,
  Printer,
  X,
  User,
  MapPin,
  Flame,
  ShieldCheck,
  Zap,
  Radio,
  Sliders,
  Loader2,
} from "lucide-react";
import { useMaintenanceStore } from "../stores/useMaintenanceStore";

export default function MaintenanceRadarPage() {
  const {
    summary,
    activeFaultCodes,
    fleetPmSchedule,
    workOrders,
    isLoading,
    isCreatingWorkOrder,
    fetchMaintenanceData,
    createWorkOrder,
    updateWorkOrderStatus,
    clearFaultCode,
  } = useMaintenanceStore();

  const [activeTab, setActiveTab] = useState("faults"); // "faults" | "pm" | "work_orders"
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState(false);
  const [selectedFaultForOrder, setSelectedFaultForOrder] = useState(null);

  // New Work Order Form State
  const [orderForm, setOrderForm] = useState({
    truckNumber: "712",
    title: "Aftertreatment DPF Forced Regeneration & Diagnostic Scan",
    faultRef: "DTC-8801",
    assignedMechanic: "Dave Kowalski (Lead Shop Tech)",
    priority: "CRITICAL",
    laborHours: 3.5,
    laborRate: 125.0,
    partsDescription: "Detroit Diesel DPF Pressure Sensor & Gasket Kit",
    partsCost: 320.0,
    scheduledDate: new Date().toISOString().split("T")[0],
    notes: "Tractor stationed in Shop Bay 2 for high differential pressure remediation.",
  });

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  const handleOpenCreateOrder = (fault = null) => {
    if (fault) {
      setSelectedFaultForOrder(fault);
      setOrderForm({
        truckNumber: fault.truckNumber,
        title: `Repair ${fault.spnDescription} (SPN ${fault.spn})`,
        faultRef: fault.id,
        assignedMechanic: "Dave Kowalski (Lead Shop Tech)",
        priority: fault.severity === "CRITICAL" ? "CRITICAL" : "NORMAL",
        laborHours: 2.5,
        laborRate: 125.0,
        partsDescription: `Replacement components for ${fault.system}`,
        partsCost: 250.0,
        scheduledDate: new Date().toISOString().split("T")[0],
        notes: fault.recommendedAction,
      });
    }
    setIsWorkOrderModalOpen(true);
  };

  const handleSaveWorkOrder = async (e) => {
    e.preventDefault();
    await createWorkOrder({
      truckNumber: orderForm.truckNumber,
      title: orderForm.title,
      faultRef: orderForm.faultRef,
      assignedMechanic: orderForm.assignedMechanic,
      priority: orderForm.priority,
      laborHours: orderForm.laborHours,
      laborRate: orderForm.laborRate,
      partsList: [
        {
          description: orderForm.partsDescription,
          qty: 1,
          cost: parseFloat(orderForm.partsCost) || 0,
        },
      ],
      scheduledDate: orderForm.scheduledDate,
      notes: orderForm.notes,
    });
    setIsWorkOrderModalOpen(false);
  };

  const handlePrintWorkOrder = (wo) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Work Order #${wo.id} — Nishan Fleet Maintenance</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #0f172a; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: bold; color: #0f172a; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 11px; background: #e0f2fe; color: #0369a1; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f1f5f9; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
          td { padding: 10px 8px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .sign-box { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
          .line { border-bottom: 1px solid #94a3b8; height: 35px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">NISHAN TRANSPORT FLEET MAINTENANCE</div>
            <div style="font-size: 12px; color: #64748b;">Terminal Maintenance Facility · Bay Shop Service Order</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 16px; font-weight: bold;">WORK ORDER #${wo.id}</div>
            <div style="font-size: 12px; color: #64748b;">Date: ${wo.scheduledDate}</div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <strong>Power Unit:</strong> Tractor #${wo.truckNumber}<br/>
            <strong>Service Title:</strong> ${wo.title}<br/>
            <strong>Priority:</strong> ${wo.priority}
          </div>
          <div class="card">
            <strong>Assigned Mechanic:</strong> ${wo.assignedMechanic}<br/>
            <strong>Status:</strong> ${wo.status}<br/>
            <strong>Estimated Total:</strong> $${(wo.totalEstimatedCost || 0).toLocaleString()} CAD
          </div>
        </div>

        <h3>Parts & Labor Specification</h3>
        <table>
          <thead>
            <tr>
              <th>Item / Service Description</th>
              <th>Quantity / Hours</th>
              <th>Rate / Unit Cost</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Certified Technician Labor</td>
              <td>${wo.laborHours || 2.5} hrs</td>
              <td>$${wo.laborRate || 125.0}/hr</td>
              <td style="text-align: right;">$${((wo.laborHours || 2.5) * (wo.laborRate || 125.0)).toFixed(2)}</td>
            </tr>
            ${(wo.partsList || []).map((p) => `
              <tr>
                <td>${p.description || "Replacement Component"}</td>
                <td>${p.qty || 1}</td>
                <td>$${p.cost || 0}</td>
                <td style="text-align: right;">$${((p.qty || 1) * (p.cost || 0)).toFixed(2)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="card" style="margin-top: 20px;">
          <strong>Diagnostic Notes & Action Taken:</strong><br/>
          <p style="font-size: 12px; color: #475569; margin-top: 5px;">${wo.notes}</p>
        </div>

        <div class="sign-box">
          <div>
            <div style="font-size: 12px; font-weight: bold;">Lead Mechanic Sign-off:</div>
            <div class="line"></div>
          </div>
          <div>
            <div style="font-size: 12px; font-weight: bold;">Fleet Maintenance Manager Approval:</div>
            <div class="line"></div>
          </div>
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

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-[300px] items-center justify-center">
        <Loader2 className="animate-spin" />
        Loading.....
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Predictive Fleet Maintenance & Engine Fault (DTC) Radar
            </h1>
            <p className="text-xs text-slate-500">
              Live J1939 diagnostic trouble codes, predictive PM milestones, and terminal shop work orders
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fetchMaintenanceData()}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs flex items-center gap-2 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-sky-600" : ""}`} />
            <span>Scan Engine Telematics</span>
          </button>

          <button
            onClick={() => handleOpenCreateOrder()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Work Order</span>
          </button>
        </div>
      </div>

      {/* Top KPI Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Monitored */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Power Units Monitored</span>
            <Truck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {summary.totalTractorsMonitored || 330}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Samsara J1939 Online</div>
        </div>

        {/* Fleet Health Index */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Fleet Health Index</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {summary.fleetHealthIndexPct || 88}%
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Nominal Fleet Health</div>
        </div>

        {/* Active Engine Faults */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Active Faults (DTC)</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">
            {summary.activeEngineFaultsCount || 3}
          </div>
          <div className="text-[11px] text-rose-600 font-semibold mt-0.5">
            {summary.criticalFaultsCount || 1} Stop Lamp Alert
          </div>
        </div>

        {/* Overdue PM Services */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>PM Services Due</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">
            {summary.overduePmServicesCount || 1}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-0.5">Upcoming Maintenance</div>
        </div>

        {/* Active Shop Work Orders */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Shop Work Orders</span>
            <Wrench className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold text-sky-700 mt-1">
            {summary.activeWorkOrdersCount || 1}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">In Shop Bays</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
        <button
          onClick={() => setActiveTab("faults")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${activeTab === "faults"
            ? "bg-white text-sky-700 border border-sky-200 shadow-2xs"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>Live DTC Engine Fault Radar ({activeFaultCodes.filter((f) => f.status === "OPEN").length})</span>
        </button>

        <button
          onClick={() => setActiveTab("pm")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${activeTab === "pm"
            ? "bg-white text-sky-700 border border-sky-200 shadow-2xs"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Predictive PM Service Calendar</span>
        </button>

        <button
          onClick={() => setActiveTab("work_orders")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${activeTab === "work_orders"
            ? "bg-white text-sky-700 border border-sky-200 shadow-2xs"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
        >
          <FileText className="w-4 h-4 text-sky-600" />
          <span>Terminal Work Orders & Shop Ledger ({workOrders.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE DTC ENGINE FAULT RADAR */}
      {/* ========================================================================= */}
      {activeTab === "faults" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {activeFaultCodes.map((fault) => {
              const isCritical = fault.severity === "CRITICAL";
              const isWarning = fault.severity === "WARNING";
              const isOpen = fault.status === "OPEN";

              return (
                <div
                  key={fault.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs transition-all ${!isOpen
                    ? "opacity-60 border-slate-200"
                    : isCritical
                      ? "border-rose-300 ring-1 ring-rose-200"
                      : isWarning
                        ? "border-amber-300 ring-1 ring-amber-200"
                        : "border-slate-200"
                    }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Fault Details */}
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-2xs ${isCritical
                          ? "bg-rose-50 text-rose-600 border border-rose-200"
                          : isWarning
                            ? "bg-amber-50 text-amber-600 border border-amber-200"
                            : "bg-sky-50 text-sky-600 border border-sky-200"
                          }`}
                      >
                        <AlertTriangle className="w-6 h-6" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-extrabold text-base text-slate-900">
                            Tractor #{fault.truckNumber}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${isCritical
                              ? "bg-rose-100 text-rose-800 border border-rose-200 animate-pulse"
                              : isWarning
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-sky-100 text-sky-800 border border-sky-200"
                              }`}
                          >
                            {fault.severity} — {fault.lampStatus}
                          </span>
                          <span className="font-mono text-xs text-slate-500 font-bold">
                            SPN {fault.spn} · FMI {fault.fmi}
                          </span>
                          {fault.workOrderId && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
                              Work Order: {fault.workOrderId}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm">
                          {fault.spnDescription}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">{fault.model}</span>
                          <span>•</span>
                          <span>Driver: {fault.driverName}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {fault.currentLocation}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isOpen ? (
                        <>
                          <button
                            onClick={() => handleOpenCreateOrder(fault)}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>Create Work Order</span>
                          </button>

                          <button
                            onClick={() => clearFaultCode(fault.id, "Manually cleared after sensor inspection.")}
                            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
                          >
                            Dismiss Fault
                          </button>
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4" />
                          Resolved & Cleared
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sensor Diagnostics Grid & Action Recommendation */}
                  <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1 max-w-2xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Recommended Preventive Action:
                      </span>
                      <p className="text-slate-700 font-medium">
                        {fault.recommendedAction}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-2xs font-mono text-xs shrink-0">
                      <div>
                        <div className="text-[10px] text-slate-400">Odometer</div>
                        <div className="font-bold text-slate-800">{fault.odometerMiles.toLocaleString()} mi</div>
                      </div>
                      <div className="h-6 w-[1px] bg-slate-200" />
                      <div>
                        <div className="text-[10px] text-slate-400">Engine Hours</div>
                        <div className="font-bold text-slate-800">{fault.engineHours} hrs</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PREDICTIVE PM SERVICE CALENDAR */}
      {/* ========================================================================= */}
      {activeTab === "pm" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">
              Predictive Fleet PM (Preventive Maintenance) Milestone Schedule
            </h2>
            <p className="text-xs text-slate-500">
              Automated service intervals calculated against Samsara live odometer and engine run telemetry
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="px-5 py-3.5">Tractor #</th>
                  <th className="px-5 py-3.5">Assigned Driver</th>
                  <th className="px-5 py-3.5">Required Service Type</th>
                  <th className="px-5 py-3.5">Odometer / Interval</th>
                  <th className="px-5 py-3.5">Miles Remaining</th>
                  <th className="px-5 py-3.5">Status & Due Date</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fleetPmSchedule.map((pm, idx) => {
                  const isOverdue = pm.status === "OVERDUE";
                  const isUpcoming = pm.status === "UPCOMING";

                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-sky-700 text-sm">
                        #{pm.truckNumber}
                        <div className="text-[11px] font-sans font-normal text-slate-500">{pm.model}</div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {pm.driver}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {pm.serviceType}
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-600">
                        <div>{pm.odometerMiles.toLocaleString()} mi current</div>
                        <div className="text-[11px] text-slate-400">Every {pm.serviceIntervalMiles.toLocaleString()} mi</div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`font-mono font-bold text-sm ${isOverdue
                            ? "text-rose-600"
                            : isUpcoming
                              ? "text-amber-600"
                              : "text-emerald-700"
                            }`}
                        >
                          {pm.milesUntilDue > 0 ? `${pm.milesUntilDue.toLocaleString()} mi` : "OVERDUE"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isOverdue
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : isUpcoming
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isOverdue ? "bg-rose-500" : isUpcoming ? "bg-amber-500" : "bg-emerald-500"}`} />
                          {pm.status} ({pm.estimatedDueDate})
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() =>
                            handleOpenCreateOrder({
                              truckNumber: pm.truckNumber,
                              spnDescription: pm.serviceType,
                              id: null,
                              severity: isOverdue ? "CRITICAL" : "NORMAL",
                              recommendedAction: `Perform scheduled ${pm.serviceType} at nearest service bay.`,
                            })
                          }
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 cursor-pointer shadow-2xs"
                        >
                          Schedule Shop
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WORK ORDERS & TERMINAL SHOP LEDGER */}
      {/* ========================================================================= */}
      {activeTab === "work_orders" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Terminal Shop Work Orders Ledger
              </h2>
              <p className="text-xs text-slate-500">
                Track parts costs, labor hours, technician assignments, and maintenance history
              </p>
            </div>

            <button
              onClick={() => handleOpenCreateOrder()}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Work Order</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="px-5 py-3.5">Order ID</th>
                  <th className="px-5 py-3.5">Tractor #</th>
                  <th className="px-5 py-3.5">Service Title</th>
                  <th className="px-5 py-3.5">Mechanic</th>
                  <th className="px-5 py-3.5">Estimated Cost</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-sky-700">
                      {wo.id}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-slate-900 text-sm">
                      #{wo.truckNumber}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{wo.title}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Scheduled: {wo.scheduledDate} · Priority: {wo.priority}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-700 font-medium">
                      {wo.assignedMechanic}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-slate-900 text-sm">
                      ${(wo.totalEstimatedCost || 0).toLocaleString()} CAD
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={wo.status}
                        onChange={(e) => updateWorkOrderStatus(wo.id, e.target.value)}
                        className={`text-xs font-bold rounded-xl px-2.5 py-1.5 border cursor-pointer focus:outline-none ${wo.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : wo.status === "IN_PROGRESS"
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handlePrintWorkOrder(wo)}
                        title="Print Work Order PDF"
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE WORK ORDER */}
      {/* ========================================================================= */}
      {isWorkOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden overflow-y-auto text-slate-900">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-sm">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Create Terminal Shop Work Order
                  </h2>
                  <p className="text-xs text-slate-500">
                    Assign technician, schedule bay downtime, and log repair costs
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWorkOrderModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkOrder} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Power Unit (Tractor #)
                  </label>
                  <input
                    type="text"
                    required
                    value={orderForm.truckNumber}
                    onChange={(e) => setOrderForm({ ...orderForm, truckNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Priority Level
                  </label>
                  <select
                    value={orderForm.priority}
                    onChange={(e) => setOrderForm({ ...orderForm, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="CRITICAL">CRITICAL (Stop Engine)</option>
                    <option value="NORMAL">NORMAL (Scheduled)</option>
                    <option value="ROUTINE">ROUTINE (PM Service)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Service Title & Description
                </label>
                <input
                  type="text"
                  required
                  value={orderForm.title}
                  onChange={(e) => setOrderForm({ ...orderForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Assigned Mechanic
                  </label>
                  <input
                    type="text"
                    required
                    value={orderForm.assignedMechanic}
                    onChange={(e) => setOrderForm({ ...orderForm, assignedMechanic: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Scheduled Bay Date
                  </label>
                  <input
                    type="date"
                    required
                    value={orderForm.scheduledDate}
                    onChange={(e) => setOrderForm({ ...orderForm, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Labor Hours (Est.)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={orderForm.laborHours}
                    onChange={(e) => setOrderForm({ ...orderForm, laborHours: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Estimated Parts Cost ($)
                  </label>
                  <input
                    type="number"
                    step="10"
                    value={orderForm.partsCost}
                    onChange={(e) => setOrderForm({ ...orderForm, partsCost: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Diagnostic Notes & Instructions
                </label>
                <textarea
                  rows={3}
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsWorkOrderModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCreatingWorkOrder}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <Wrench className="w-4 h-4" />
                  <span>{isCreatingWorkOrder ? "Creating..." : "Create Work Order"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

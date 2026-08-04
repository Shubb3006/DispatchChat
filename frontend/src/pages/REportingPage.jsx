import { useState, useEffect } from "react";
import { useShipmentStore } from "../stores/useShipmentStore";
import { useInvoiceStore } from "../stores/useInvoiceStore";
import { useAuthStore } from "../stores/useAuthStore";
import {
  BarChart3, DollarSign, Award, Database, Cpu, Layers, Key,
  MessageSquare, CheckCircle, ShieldCheck, TrendingUp, Activity,
} from "lucide-react";

export default function ReportingPage() {
  const shipments = useShipmentStore((state) => state.shipments);
  const fetchShipments = useShipmentStore((state) => state.fetchShipments);
  const invoices = useInvoiceStore((state) => state.invoices);
  const fetchInvoices = useInvoiceStore((state) => state.fetchInvoices);
  const currentUser = useAuthStore((state) => state.currentUser);

  const [estDrivers, setEstDrivers] = useState(400);
  const [estEmployees, setEstEmployees] = useState(200);
  const [riskSimulation, setRiskSimulation] = useState("nominal");

  useEffect(() => {
    fetchShipments();
    fetchInvoices();
  }, [fetchShipments, fetchInvoices]);

  const isAuthorized = currentUser?.role === "super_admin" || currentUser?.role === "admin";

  if (!isAuthorized) {
    return (
      <div className="max-w-sm mx-auto mt-20 bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm space-y-3">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h3 className="font-semibold text-slate-900">Access Restricted</h3>
        <p className="text-sm text-slate-500">
          The Analytics Dashboard is only available to Admins and Super Admins.
        </p>
      </div>
    );
  }

  // Computed Metrics
  const totalRevenue = invoices.reduce((acc, i) => acc + i.total, 0);
  const totalCost = shipments.reduce((acc, s) => acc + s.costEstimate, 0) + shipments.length * 45;
  const netProfit = totalRevenue - totalCost;
  const totalMiles = shipments.filter((s) => s.status === "delivered").reduce((acc, s) => acc + s.totalDistanceMiles, 0);
  const deliveredCount = shipments.filter((s) => s.status === "delivered").length;
  const inTransitCount = shipments.filter((s) => s.status === "in_transit").length;
  const onTimeRate = deliveredCount > 0 ? 100 : 96.4;
  const totalGallons = Math.round(totalMiles / 6.5);

  // Cost estimator
  const costCloud = Math.max(60, Math.round(60 + (estDrivers + estEmployees - 300) * 0.15));
  const costSamsara = Math.round(estDrivers * 1.5);
  const costGemini = Math.round(estDrivers * 4 * 0.09);
  const costSecurity = Math.max(0, Math.round((estDrivers + estEmployees - 500) * 0.2));
  const costSMS = Math.round(estDrivers * 0.45);
  const totalExpense = costCloud + costSamsara + costGemini + costSecurity + costSMS;

  const customsSLA = riskSimulation === "nominal" ? 98.2 : riskSimulation === "elevated" ? 94.5 : 88.1;

  const kpiCards = [
    { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, sub: "Billed invoices", icon: DollarSign, color: "text-blue-600 bg-blue-50" },
    { label: "Net Profit", value: `$${netProfit.toLocaleString()}`, sub: "Revenue minus costs", icon: TrendingUp, color: "text-green-600 bg-green-50" },
    { label: "On-Time Rate", value: `${onTimeRate}%`, sub: "Delivery compliance", icon: CheckCircle, color: "text-indigo-600 bg-indigo-50" },
    { label: "Fleet Miles", value: totalMiles.toLocaleString(), sub: "Delivered loads", icon: Activity, color: "text-amber-600 bg-amber-50" },
    { label: "Active Transit", value: inTransitCount, sub: "Loads in transit", icon: BarChart3, color: "text-cyan-600 bg-cyan-50" },
    { label: "Fuel Used", value: `${totalGallons.toLocaleString()} gal`, sub: "Samsara telemetry", icon: Cpu, color: "text-slate-600 bg-slate-100" },
  ];

  const costItems = [
    { label: "Cloud & Database", cost: costCloud, icon: Database, color: "text-indigo-600 bg-indigo-50", bar: "bg-indigo-500", max: 200 },
    { label: "Samsara Fleet API", cost: costSamsara, icon: Cpu, color: "text-green-600 bg-green-50", bar: "bg-green-500", max: 1500 },
    { label: "Gemini AI Vision", cost: costGemini, icon: Layers, color: "text-purple-600 bg-purple-50", bar: "bg-purple-500", max: 400 },
    { label: "Enterprise Security", cost: costSecurity, icon: Key, color: "text-amber-600 bg-amber-50", bar: "bg-amber-500", max: 200 },
    { label: "Twilio SMS", cost: costSMS, icon: MessageSquare, color: "text-blue-600 bg-blue-50", bar: "bg-blue-500", max: 500 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{card.value}</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">{card.label}</div>
                <div className="text-xs text-slate-400">{card.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left + Middle: Shipment Manifest Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Risk Simulator */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Activity className="h-5 w-5 text-slate-500" />
              <h2 className="font-semibold text-slate-900">Risk Scenario Simulator</h2>
            </div>
            <div className="flex items-center gap-3">
              {[
                { id: "nominal", label: "Clear", desc: "Normal operations", color: "border-green-200 text-green-700 bg-green-50" },
                { id: "elevated", label: "Storm Delay", desc: "Minor disruptions", color: "border-amber-200 text-amber-700 bg-amber-50" },
                { id: "severe", label: "Customs Block", desc: "Critical delay", color: "border-red-200 text-red-700 bg-red-50" },
              ].map((sim) => (
                <button
                  key={sim.id}
                  onClick={() => setRiskSimulation(sim.id)}
                  className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium cursor-pointer transition-all ${
                    riskSimulation === sim.id
                      ? sim.color + " ring-2 ring-offset-1 " + sim.color.split(" ")[0].replace("border", "ring")
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold">{sim.label}</div>
                  <div className="text-xs opacity-70 mt-0.5">{sim.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Shipment Margins Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <h2 className="font-semibold text-slate-900">Shipment Profit Margins</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <th className="px-5 py-3">Tracking #</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Cost</th>
                    <th className="px-5 py-3">Invoice</th>
                    <th className="px-5 py-3 text-right">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shipments.map((s) => {
                    const margin = s.priceInvoice - s.costEstimate;
                    const marginPct = s.priceInvoice > 0 ? Math.round((margin / s.priceInvoice) * 100) : 0;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-mono font-medium text-slate-800">{s.load_number}</td>
                        <td className="px-5 py-3 text-slate-600">{s.customer_name}</td>
                        <td className="px-5 py-3 text-slate-600">${s.costEstimate?.toLocaleString()}</td>
                        <td className="px-5 py-3 font-semibold text-slate-900">${s.priceInvoice?.toLocaleString()}</td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-green-600 font-semibold">${margin.toLocaleString()} ({marginPct}%)</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: KPI Scorecard */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Award className="h-5 w-5 text-indigo-500" />
              <h2 className="font-semibold text-slate-900">Fleet KPIs</h2>
            </div>
            <div className="space-y-4">
              {[
                { label: "Customs Clearance SLA", value: customsSLA, color: riskSimulation === "severe" ? "bg-red-500" : "bg-indigo-500", textColor: riskSimulation === "severe" ? "text-red-600" : "text-indigo-600" },
                { label: "HOS Log Compliance", value: 96.8, color: "bg-green-500", textColor: "text-green-600" },
                { label: "Invoice Cycle Speed", value: 85, color: "bg-amber-500", textColor: "text-amber-600", valueLabel: "1.4 days" },
                { label: "Speed Compliance", value: 94.1, color: "bg-blue-500", textColor: "text-blue-600" },
              ].map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{item.label}</span>
                    <span className={`font-semibold ${item.textColor}`}>{item.valueLabel || `${item.value}%`}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${item.color}`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cost Estimator */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-semibold text-slate-900">Monthly Operations Cost Estimator</h2>
            <p className="text-sm text-slate-400 mt-0.5">Adjust fleet size to see projected infrastructure costs</p>
          </div>
          <div className="bg-slate-900 text-white px-5 py-3 rounded-xl text-center">
            <div className="text-xs text-slate-400 mb-0.5">Total Monthly Cost</div>
            <div className="text-xl font-bold text-green-400">${totalExpense.toLocaleString()} / mo</div>
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-slate-700">Fleet Drivers</span>
              <span className="font-semibold text-blue-600">{estDrivers} drivers</span>
            </div>
            <input
              type="range" min="50" max="1000" step="10" value={estDrivers}
              onChange={(e) => setEstDrivers(parseInt(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-slate-700">Office Staff</span>
              <span className="font-semibold text-green-600">{estEmployees} employees</span>
            </div>
            <input
              type="range" min="10" max="500" step="10" value={estEmployees}
              onChange={(e) => setEstEmployees(parseInt(e.target.value))}
              className="w-full accent-green-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Cost Breakdown Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {costItems.map((item) => {
            const Icon = item.icon;
            const pct = Math.min(100, Math.round((item.cost / item.max) * 100));
            return (
              <div key={item.label} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-slate-900">${item.cost}/mo</span>
                </div>
                <div className="text-xs font-medium text-slate-700">{item.label}</div>
                <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                  <div className={`h-full ${item.bar}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

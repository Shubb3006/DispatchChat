import {
  Navigation as NavIcon,
  FileText,
  Globe,
  BarChart3,
  Users,
  LogOut,
  FilePlus,
  FileSignature,
  Warehouse,
  Radio,
  Clock,
  Wrench,
  Compass,
  History,
  LayoutGrid,
  DollarSign,
  Map,
} from "lucide-react";

export default function Navigation({
  currentRole,
  onChangeRole,
  activeShipmentsCount,
  unreadMessagesCount,
  currentUser,
  onLogout,
}) {
  const allTabs = [
    {
      id: "data_entry",
      label: "Live Dispatch",
      icon: FilePlus,
      badge: activeShipmentsCount,
    },
    { id: "kanban", label: "Kanban Freight Pipeline", icon: LayoutGrid },
    { id: "pcmiler", label: "PC*MILER Routing & Tolls", icon: Map },
    { id: "telematics", label: "Samsara Fleet Radar & AI Routing", icon: Radio },
    { id: "eta_radar", label: "Predictive Live ETA & Weather Radar", icon: Compass },
    { id: "maintenance", label: "Predictive Fleet Maintenance & DTC Radar", icon: Wrench },
    { id: "customs", label: "Customs Clearance (PAPS/PARS)", icon: FileSignature },
    { id: "detention", label: "Facility Detention & Accessorial Tracker", icon: Clock },
    { id: "settlements", label: "Driver Settlements & Payroll", icon: DollarSign },
    { id: "audit_logs", label: "Audit Trail & Change History Radar", icon: History },
    { id: "customer", label: "Customer Tracking", icon: Globe },
    { id: "warehouse_manager", label: "Cross-Dock Warehouse", icon: Warehouse },
    { id: "invoicing", label: "Freight Billing & Invoicing", icon: FileText },
    { id: "reporting", label: "Executive Analytics", icon: BarChart3 },
    { id: "hr", label: "Driver HR & Fleet", icon: Users },
  ];



  const filteredTabs = allTabs.filter((tab) => {
    if (tab.id === "reporting") {
      return (
        currentUser?.role === "super_admin" ||
        currentUser?.role === "admin" ||
        currentUser?.role === "superAdmin"
      );
    }
    if (currentUser?.role === "super_admin" || currentUser?.role === "admin")
      return true;
    return currentUser?.allowed_modules?.includes(tab.id);
  });

  return (
    <aside className="w-16 flex flex-col items-center py-4 bg-white border-r border-slate-200 shrink-0 h-full select-none z-30 shadow-xs">
      {/* Modern High-End Logo */}
      <div className="w-9 h-9 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-xl flex items-center justify-center mb-5 shrink-0 shadow-sm">
        <span className="text-white font-black text-xs tracking-wider">NT</span>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-1.5 w-full items-center flex-1">
        {filteredTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentRole === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeRole(tab.id)}
              title={tab.label}
              className={`relative w-10 h-10 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-150 group ${
                isActive
                  ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
              }`}
            >
              <Icon className={`w-4.5 h-4.5 transition-colors ${isActive ? "text-sky-600" : "text-slate-500 group-hover:text-slate-900"}`} />

              {/* Clean Minimal Active Bar */}
              {isActive && (
                <span className="absolute -left-1 w-1 h-5 bg-sky-600 rounded-r" />
              )}

              {/* Tooltip */}
              <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-opacity duration-150 whitespace-nowrap z-50 shadow-xl border border-slate-800">
                {tab.label}
              </span>

              {/* Badge */}
              {tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold text-white bg-rose-500 shadow-xs">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom: User Avatar + Logout */}
      <div className="flex flex-col items-center gap-2 mt-auto pt-3 border-t border-slate-200 w-full">
        <div
          className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-700 font-bold cursor-default shadow-2xs"
          title={`${currentUser?.name || currentUser?.username || "Admin"}`}
        >
          {currentUser?.username?.[0]?.toUpperCase() || "N"}
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign Out"
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );

}

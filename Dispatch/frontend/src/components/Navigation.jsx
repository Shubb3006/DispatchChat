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
  Inbox,
  ShieldCheck,
} from "lucide-react";

export default function Navigation({
  currentRole,
  onChangeRole,
  activeShipmentsCount,
  unreadMessagesCount,
  currentUser,
  onLogout,
  mobileOpen = false,
  onCloseMobile,
}) {
  const allTabs = [
    {
      id: "data_entry",
      label: "Live Dispatch",
      icon: FilePlus,
      badge: activeShipmentsCount,
    },
    { id: "kanban", label: "Kanban Freight Pipeline", icon: LayoutGrid },
    { id: "rates", label: "Customer Rate Requests", icon: Inbox },
    { id: "pcmiler", label: "PC*MILER Routing & Tolls", icon: Map },
    { id: "telematics", label: "Samsara Fleet Radar & AI Routing", icon: Radio },
    { id: "eta_radar", label: "Predictive Live ETA & Weather Radar", icon: Compass },
    { id: "maintenance", label: "Predictive Fleet Maintenance & DTC Radar", icon: Wrench },
    { id: "customs", label: "Customs Clearance (PAPS/PARS)", icon: FileSignature },
    { id: "detention", label: "Facility Detention & Accessorial Tracker", icon: Clock },
    { id: "safety", label: "Safety & Compliance", icon: ShieldCheck },
    { id: "settlements", label: "Driver Settlements & Payroll", icon: DollarSign },
    { id: "audit_logs", label: "Audit Trail & Change History Radar", icon: History },
    { id: "customer", label: "Customer Tracking", icon: Globe },
    { id: "warehouse_manager", label: "Cross-Dock Warehouse", icon: Warehouse },
    { id: "invoicing", label: "Freight Billing & Invoicing", icon: FileText },
    { id: "reporting", label: "Executive Analytics", icon: BarChart3 },
    { id: "hr", label: "Driver HR & Fleet", icon: Users },
  ];



  const filteredTabs = allTabs.filter((tab) => {
    // Rate requests are a dispatch function — visible to every dispatcher
    // without needing an allowed_modules entry.
    if (tab.id === "rates" && currentUser?.role === "dispatcher") {
      return true;
    }
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
    <>
    {/* Mobile drawer (below md) — full labels, opened via header hamburger */}
    {mobileOpen && (
      <div className="md:hidden fixed inset-0 z-50 flex">
        <div
          className="absolute inset-0 bg-slate-900/50"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
        <aside className="relative w-72 max-w-[85vw] h-full bg-white border-r border-slate-200 shadow-2xl flex flex-col py-4 px-3 overflow-y-auto">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white font-black text-xs tracking-wider">NT</span>
              </div>
              <span className="font-extrabold text-slate-900 text-sm tracking-wide">NISHAN TMS</span>
            </div>
            <button
              onClick={onCloseMobile}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              aria-label="Close navigation menu"
            >
              ✕
            </button>
          </div>
          <nav className="flex flex-col gap-1 flex-1">
            {filteredTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentRole === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onChangeRole(tab.id)}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${isActive
                    ? "bg-sky-50 text-sky-700 border border-sky-200"
                    : "text-slate-600 hover:bg-slate-100 border border-transparent"
                    }`}
                >
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? "text-sky-600" : "text-slate-500"}`} />
                  <span className="truncate">{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className="ml-auto w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold text-white bg-rose-500 shrink-0">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-200 px-1">
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-700 font-bold">
              {currentUser?.username?.[0]?.toUpperCase() || "N"}
            </div>
            <span className="text-xs font-bold text-slate-700 truncate flex-1">
              {currentUser?.name || currentUser?.username || "Admin"}
            </span>
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
      </div>
    )}

    {/* Desktop / tablet icon sidebar (md and up) */}
    <aside className="hidden md:flex w-16 flex-col items-center py-4 bg-white border-r border-slate-200 shrink-0 h-full select-none z-30 shadow-xs">
      {/* Modern High-End Logo */}
      <div className="w-9 h-9 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-xl flex items-center justify-center mb-5 shrink-0 shadow-sm">
        <span className="text-white font-black text-xs tracking-wider">NT</span>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-1.5 w-full items-center flex-1 min-h-0 py-1">
        {filteredTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentRole === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeRole(tab.id)}
              title={tab.label}
              className={`relative w-10 h-10 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-150 group ${isActive
                ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
                }`}
            >
              <Icon className={`w-4.5 h-4.5 transition-colors ${isActive ? "text-sky-600" : "text-slate-500 group-hover:text-slate-900"}`} />

              {/* {isActive && (
                <span className="absolute -left-1 w-1 h-5 bg-sky-600 rounded-r" />
              )} */}

              <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-opacity duration-150 whitespace-nowrap z-50 shadow-xl border border-slate-800">
                {tab.label}
              </span>

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
    </>
  );

}

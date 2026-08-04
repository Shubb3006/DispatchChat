import {
  Truck,
  Navigation as NavIcon,
  ShieldCheck,
  FileText,
  Globe,
  BarChart3,
  Users,
  LogOut,
  FilePlus,
  Headphones,
  FileSignature,
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
    { id: "reporting", label: "Analytics", icon: BarChart3 },
    { id: "data_entry", label: "Data Entry", icon: FilePlus },
    { id: "dispatcher", label: "Dispatch", icon: Truck, badge: activeShipmentsCount },
    { id: "driver_manager", label: "Driver Manager", icon: Headphones },
    { id: "customs", label: "Customs", icon: FileSignature },
    { id: "safety", label: "Safety", icon: ShieldCheck },
    { id: "invoicing", label: "Invoicing", icon: FileText },
    { id: "customer", label: "Customer", icon: Globe },
    { id: "driver", label: "Driver App", icon: NavIcon, badge: unreadMessagesCount },
    { id: "hr", label: "HR", icon: Users },
  ];

  const filteredTabs = allTabs.filter((tab) => {
    if (currentUser.role === "super_admin" || currentUser.role === "admin") return true;
    return currentUser.allowed_modules?.includes(tab.id);
  });

  const roleColors = {
    super_admin: "bg-purple-500",
    admin: "bg-rose-500",
    dispatcher: "bg-blue-500",
    driver_manager: "bg-cyan-500",
    customs: "bg-teal-500",
    safety: "bg-orange-500",
    data_entry: "bg-indigo-500",
    invoicing: "bg-emerald-500",
    driver: "bg-slate-500",
  };

  return (
    <aside className="w-16 flex flex-col items-center py-5 bg-slate-900 shrink-0 h-full select-none">
      {/* Logo */}
      <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center mb-6 shrink-0">
        <span className="text-white font-bold text-xs">OZ</span>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-1 w-full items-center flex-1">
        {filteredTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentRole === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeRole(tab.id)}
              title={tab.label}
              className={`relative w-10 h-10 flex items-center justify-center rounded-xl cursor-pointer transition-all group ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon className="w-4.5 h-4.5" />

              {/* Tooltip */}
              <span className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-opacity whitespace-nowrap z-50 shadow-lg border border-slate-700">
                {tab.label}
              </span>

              {/* Badge */}
              {tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold text-white bg-blue-500">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom: Avatar + Logout */}
      <div className="flex flex-col items-center gap-2 mt-4">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold cursor-default ${
            roleColors[currentUser.role] || "bg-slate-600"
          }`}
          title={`${currentUser.name} · ${currentUser.role.replace("_", " ")}`}
        >
          {currentUser.username?.[0]?.toUpperCase()}
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign Out"
            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl cursor-pointer transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}

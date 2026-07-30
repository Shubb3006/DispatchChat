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
    { id: "reporting", label: "Analytics Hub (Admin)", icon: BarChart3 },
    { id: "data_entry", label: "Data Entry Portal", icon: FilePlus },
    {
      id: "dispatcher",
      label: "Dispatch Console",
      icon: Truck,
      badge: activeShipmentsCount,
      badgeColor: "bg-blue-600",
    },
    { id: "driver_manager", label: "Driver Manager Hub", icon: Headphones },
    { id: "customs", label: "Border Customs Link", icon: FileSignature },
    { id: "safety", label: "Safety Compliance", icon: ShieldCheck },
    { id: "invoicing", label: "Billing & Invoicing", icon: FileText },
    { id: "customer", label: "Customer Tracking Portal", icon: Globe },
    {
      id: "driver",
      label: "Driver Terminal",
      icon: NavIcon,
      badge: unreadMessagesCount,
      badgeColor: "bg-emerald-600",
    },
    { id: "hr", label: "HR User Directory", icon: Users },
  ];
  // const filteredTabs = allTabs.filter((tab) => {

  //   const isSuperOrAdmin =
  //     currentUser.role === "super_admin" || currentUser.role === "admin";
  //   if (isSuperOrAdmin) {
  //     return true;
  //   }
  //   if (tab.id === "reporting") {
  //     return false;
  //   }
  //   if (tab.id === "hr") {
  //     return false;
  //   }
  //   if (tab.id === "data_entry") {
  //     return currentUser.role === "data_entry";
  //   }
  //   if (tab.id === "dispatcher") {
  //     return currentUser.role === "dispatcher";
  //   }
  //   if (tab.id === "driver_manager") {
  //     return currentUser.role === "driver_manager";
  //   }
  //   if (tab.id === "customs") {
  //     return currentUser.role === "customs";
  //   }
  //   if (tab.id === "safety") {
  //     return currentUser.role === "safety";
  //   }
  //   if (tab.id === "invoicing") {
  //     return currentUser.role === "invoicing";
  //   }
  //   if (tab.id === "driver") {
  //     return currentUser.role === "driver";
  //   }
  //   return currentUser.allowed_modules.includes(tab.id);
  // });

  // const getInitials = (name) => {
  //   return name
  //     .split(" ")
  //     .map((part) => part[0])
  //     .join("")
  //     .substring(0, 2)
  //     .toUpperCase();
  // };

  const filteredTabs = allTabs.filter((tab) => {
    if (currentUser.role === "super_admin" || currentUser.role === "admin") {
      return true;
    }

    return currentUser.allowed_modules.includes(tab.id);
  });
  const avatarColors = {
    super_admin: "bg-purple-600",
    admin: "bg-rose-600",
    dispatcher: "bg-blue-600",
    driver_manager: "bg-cyan-600",
    customs: "bg-teal-600",
    safety: "bg-orange-600",
    data_entry: "bg-indigo-600",
    invoicing: "bg-emerald-600",
    driver: "bg-slate-600",
  };
  return (
    <aside className="w-16 flex flex-col items-center py-4 bg-[#1A1D23] border-r border-[#343A40] shrink-0 h-full select-none">
      <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center mb-8 shrink-0 shadow-md">
        <span className="text-white font-bold text-sm">OZ</span>
      </div>

      <nav className="flex flex-col gap-5 text-gray-400 w-full items-center">
        {filteredTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentRole === tab.id;
          return (
            <button
              id={`nav-btn-${tab.id}`}
              key={tab.id}
              onClick={() => onChangeRole(tab.id)}
              title={tab.label}
              className={`p-2 rounded cursor-pointer transition-colors relative group ${
                isActive
                  ? "bg-blue-600/10 text-blue-500 border border-blue-500/20"
                  : "hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon className="w-5 h-5" />
              {/* Tooltip */}
              <span className="absolute left-16 top-1/2 -translate-y-1/2 scale-0 group-hover:scale-100 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded transition-all whitespace-nowrap z-50 shadow-md border border-slate-700">
                {tab.label}
              </span>
              {/* Badge */}
              {tab.badge !== void 0 && tab.badge > 0 && (
                <span
                  className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white ${
                    tab.badgeColor || "bg-blue-600"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User profile avatar based on active role */}
      <div className="mt-auto flex flex-col items-center gap-3">
        <div
          className={`w-8 h-8 rounded-full border-2 border-[#343A40] flex items-center justify-center text-[10px] text-white font-bold select-none cursor-help transition-transform hover:scale-105 ${
            avatarColors[currentUser.role] || "bg-slate-500"
          }`}
          title={`Logged in as ${
            currentUser.name
          } (${currentUser.role.toUpperCase()})`}
        >
          {currentUser.username[0]}
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            title="Log Out of Session"
            className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-all cursor-pointer group relative"
          >
            <LogOut className="w-4 h-4" />
            <span className="absolute left-16 top-1/2 -translate-y-1/2 scale-0 group-hover:scale-100 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded transition-all whitespace-nowrap z-50 shadow-md border border-slate-700">
              Sign Out
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}

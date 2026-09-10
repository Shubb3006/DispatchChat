import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";
import {
  Users,
  UserPlus,
  Trash2,
  Check,
  Lock,
  AlertCircle,
  UserCheck,
} from "lucide-react";

const AVAILABLE_MODULES = [
  {
    id: "dispatcher",
    label: "Dispatch Console",
    description: "Dispatch shipments & route sequences",
  },
  {
    id: "driver",
    label: "Driver Terminal",
    description: "Logs, stop statuses, and document uploads",
  },
  {
    id: "safety",
    label: "Safety Compliance",
    description: "Safety incidents & HOS log reviews",
  },
  {
    id: "invoicing",
    label: "Billing & LTL",
    description: "Invoice creation & freight rate calculators",
  },
  {
    id: "customer",
    label: "Customer Portal",
    description: "Shipment searches and client status updates",
  },
  {
    id: "warehouse_manager",
    label: "Warehouse Portal",
    description: "Checks in the loads to the warehouse",
  },

];

const ROLE_COLORS = {
  warehouse_manager: "bg-amber-100 text-amber-800 border-amber-200",
  super_admin: "bg-purple-100 text-purple-700 border-purple-200",
  admin: "bg-red-100 text-red-700 border-red-200",
  dispatcher: "bg-blue-100 text-blue-700 border-blue-200",
  driver: "bg-green-100 text-green-700 border-green-200",
  driver_manager: "bg-cyan-100 text-cyan-700 border-cyan-200",
  customs: "bg-teal-100 text-teal-700 border-teal-200",
  safety: "bg-orange-100 text-orange-700 border-orange-200",
  data_entry: "bg-indigo-100 text-indigo-700 border-indigo-200",
  invoicing: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function HRPage() {
  const users = useAuthStore((state) => state.users);
  const isLoading = useAuthStore((state) => state.isLoading);
  const currentUser = useAuthStore((state) => state.currentUser);
  const fetchUsers = useAuthStore((state) => state.fetchUsers);
  const addUser = useAuthStore((state) => state.addUser);
  const deleteUser = useAuthStore((state) => state.deleteUser);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("driver");
  const [selectedModules, setSelectedModules] = useState(["driver"]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    const defaults = {
      customer: ["customer"],
      driver: ["driver"],
      dispatcher: ["dispatcher"],
      driver_manager: ["dispatcher"],
      customs: ["dispatcher"],
      data_entry: ["dispatcher"],
      safety: ["safety"],
      warehouse_manager: ["warehouse_manager"],
      invoicing: ["invoicing"],
      admin: [
        "dispatcher",
        "driver",
        "warehouse_manager",
        "safety",
        "invoicing",
        "customer",
      ],
      super_admin: [
        "dispatcher",
        "warehouse_manager",
        "driver",
        "safety",
        "invoicing",
        "customer",
      ],
    };
    setSelectedModules(defaults[newRole] || ["driver"]);
  };

  const handleToggleModule = (modId) => {
    if (role === "admin" || role === "super_admin") return;
    setSelectedModules((prev) =>
      prev.includes(modId) ? prev.filter((m) => m !== modId) : [...prev, modId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter a full name.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter a password.");
      return;
    }
    if (!username.trim()) {
      setError("Please enter a username.");
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, "_");
    if (users.some((u) => u.username === cleanUsername)) {
      setError(`Username "@${cleanUsername}" is already taken.`);
      return;
    }

    const newUser = {
      id: "USR" + Math.floor(1e3 + Math.random() * 9e3),
      name: name.trim(),
      username: cleanUsername,
      password,
      role,
      allowedModules:
        role === "admin" || role === "super_admin"
          ? [
            "dispatcher",
            "driver",
            "safety",
            "warehouse",
            "invoicing",
            "customer",
          ]
          : selectedModules,
      createdAt: new Date().toISOString().split("T")[0],
    };

    await addUser(newUser);
    setSuccess(`"${newUser.name}" added as ${role}.`);
    setName("");
    setUsername("");
    setPassword("");
    setRole("driver");
    setSelectedModules(["driver"]);
  };

  const handleDeleteUser = async (id) => {
    await deleteUser(id);
    if (currentUser?.id === id) {
      const remaining = useAuthStore.getState().users.find((u) => u.id !== id);
      if (remaining) {
        useAuthStore.setState({ currentUser: remaining });
        const target =
          remaining.role === "super_admin" || remaining.role === "admin"
            ? "reporting"
            : remaining.allowedModules[0] || "customer";
        navigate("/" + target);
      } else {
        useAuthStore.setState({ currentUser: null, isLoggedIn: false });
        navigate("/login");
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-full lg:overflow-hidden">
      {/* User Directory */}
      <div className="lg:col-span-2 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold text-slate-900">Team Directory</h2>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
            {users.length} accounts
          </span>
        </div>

        <div className="flex-1 overflow-auto divide-y divide-slate-100">
          {users.map((user) => {
            const isSelf = user.id === currentUser?.id;
            const isProtected =
              user.role === "super_admin" &&
              currentUser?.role !== "super_admin";
            const roleStyle =
              ROLE_COLORS[user.role] ||
              "bg-slate-100 text-slate-600 border-slate-200";
            return (
              <div
                key={user.id}
                className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-900">
                      {user.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      @{user.username}
                    </span>
                    {isSelf && (
                      <span className="px-1.5 py-0.5 text-xs bg-blue-50 text-blue-600 border border-blue-100 rounded-full font-medium">
                        You
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full border capitalize ${roleStyle}`}
                    >
                      {user.role.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-slate-400">
                      Joined {user.createdAt}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-slate-400">Access:</span>
                    {user.role === "admin" || user.role === "super_admin" ? (
                      <span className="text-xs text-slate-500 italic">
                        All modules
                      </span>
                    ) : (
                      user.allowedModules?.map((mod) => (
                        <span
                          key={mod}
                          className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full capitalize"
                        >
                          {mod}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="ml-4 shrink-0">
                  {isProtected ? (
                    <Lock className="h-4 w-4 text-slate-300" />
                  ) : isSelf ? (
                    <span className="text-xs text-slate-400 italic">
                      Current session
                    </span>
                  ) : (
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Remove user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Register Form */}
      <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-slate-900">Add Team Member</h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 flex-1 overflow-auto space-y-4"
        >
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
              <UserCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {[
            {
              label: "Full Name",
              value: name,
              set: setName,
              placeholder: "e.g. Marcus Vance",
              type: "text",
            },
            {
              label: "Username",
              value: username,
              set: setUsername,
              placeholder: "e.g. marcus_drv",
              type: "text",
            },
            {
              label: "Password",
              value: password,
              set: setPassword,
              placeholder: "Min 6 characters",
              type: "password",
              minLength: 6,
            },
          ].map(({ label, value, set, placeholder, type, minLength }) => (
            <div key={label} className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                {label}
              </label>
              <input
                type={type}
                required
                minLength={minLength}
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
            </div>
          ))}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Role</label>
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer"
            >
              <option value="driver">Driver</option>
              <option value="customer">Customer</option>
              <option value="dispatcher">Dispatcher</option>
              <option value="driver_manager">Driver Manager</option>
              <option value="customs">Customs Specialist</option>
              <option value="warehouse_manager">Warehouse Manager</option>
              <option value="safety">Safety Officer</option>
              <option value="data_entry">Data Entry Clerk</option>
              <option value="invoicing">Billing & Invoicing</option>
              <option value="admin">Administrator</option>
              <option value="super_admin">Super Administrator</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Module Access
            </label>
            {role === "admin" || role === "super_admin" ? (
              <p className="text-xs text-slate-500 italic">
                Full access to all modules
              </p>
            ) : (
              <div className="space-y-2">
                {AVAILABLE_MODULES.map((mod) => {
                  const isSelected = selectedModules.includes(mod.id);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => handleToggleModule(mod.id)}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all ${isSelected
                        ? "bg-blue-50 border-blue-200 text-slate-800"
                        : "bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200"
                        }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 ${isSelected
                          ? "bg-blue-600 border-blue-600"
                          : "border border-slate-300 bg-white"
                          }`}
                      >
                        {isSelected && (
                          <Check
                            className="h-3 w-3 text-white"
                            strokeWidth={3}
                          />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{mod.label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {mod.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 px-4 rounded-xl cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            <span>{isLoading ? "Adding..." : "Create Account"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState } from "react";
import {
  Lock,
  User,
  Truck,
  AlertCircle,
  Sparkles,
  UserPlus,
  KeyRound,
} from "lucide-react";
import { useAuthStore } from "../stores/useAuthStore";
import { useNavigate } from "react-router-dom";
export default function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("driver");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const authLogin = useAuthStore((state) => state.login);
  const authSignUp = useAuthStore((state) => state.signup);
  const isLoading = useAuthStore((state) => state.isLoading);
  const storeError = useAuthStore((state) => state.error);
  const handleAction = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!username.trim() || !password) {
      setError("Please provide both username and password.");
      return;
    }
    if (isSignUp) {
      if (!fullName.trim()) {
        setError("Please enter your full name.");
        return;
      }
      let allowedModules = ["driver"];
      if (role === "dispatcher") {
        allowedModules = [
          "reporting",
          "data_entry",
          "dispatcher",
          "driver_manager",
          "customs",
          "safety",
          "invoicing",
        ];
      } else if (role === "safety") {
        allowedModules = ["reporting", "safety"];
      } else if (role === "invoicing") {
        allowedModules = ["reporting", "invoicing"];
      } else if (role === "customer") {
        allowedModules = ["customer"];
      } else if (role === "hr") {
        allowedModules = ["hr", "reporting"];
      } else if (role === "super_admin") {
        allowedModules = [
          "reporting",
          "data_entry",
          "dispatcher",
          "driver_manager",
          "customs",
          "safety",
          "invoicing",
          "customer",
          "driver",
          "hr",
        ];
      }
      const newUser = {
        name: fullName.trim(),
        username: username.trim().toLowerCase(),
        password,
        role,
        allowedModules,
      };
      const signedUp = await authSignUp(newUser);
      if (signedUp) {
        setSuccess(
          "Registration successful! You can now log in with your credentials."
        );
        setIsSignUp(false);
        setPassword("");
      } else {
        setError(
          storeError || "Failed to register account. Username might be taken."
        );
      }
    } else {
      const loggedIn = await authLogin({ username, password });
      if (loggedIn) {
        const currentUser = useAuthStore.getState().authUser;
        if (currentUser) {
          if (
            currentUser.role === "super_admin" ||
            currentUser.role === "admin"
          ) {
            navigate("/reporting");
          } else if (currentUser.role === "driver") {
            // Drivers always land on the standalone Driver App.
            navigate("/driver");
          } else {
            // The backend returns snake_case `allowed_modules` — the old
            // `currentUser.allowedModules[0]` threw a TypeError here for every
            // non-admin login, leaving the redirect to App.jsx's effect.
            const modules =
              currentUser.allowed_modules || currentUser.allowedModules || [];
            navigate("/" + (modules[0] || "customer"));
          }
        }
      } else {
        setError(
          storeError ||
            "Invalid credentials. Please verify your username and password."
        );
      }
    }
  };
  // const handleQuickLogin = (user) => {
  //   setUsername(user.username);
  //   setPassword(user.password || "password");
  //   setIsSignUp(false);
  //   setError(null);
  // };
  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100 font-sans p-6 selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-950 pointer-events-none z-0" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-2xl shadow-inner">
            <Truck className="h-10 w-10 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-indigo-200 to-slate-400 bg-clip-text text-transparent">
              NISHAN TMS
            </h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase font-mono mt-1">
              Samsara &amp; BorderConnect Carrier Hub
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
          <button
            onClick={() => {
              setIsSignUp(false);
              setError(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              !isSignUp
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsSignUp(true);
              setError(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              isSignUp
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Login Form Card */}
        <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl p-6 space-y-6">
          <div className="border-b border-slate-700/50 pb-4">
            <h2 className="text-lg font-bold text-white">
              {isSignUp ? "Register Corporate Profile" : "Sign In to Dashboard"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isSignUp
                ? "Fill in details to provision your profile."
                : "Enter credentials to access active portals."}
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start space-x-2 text-rose-300 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start space-x-2 text-emerald-300 text-xs">
              <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleAction} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-3xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sophia Chen"
                    className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-3xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                Corporate Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. marcus_drv"
                  className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-3xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                Secure Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-3xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                  Functional Corporate Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                >
                  <option value="driver">Driver (Mobile App View)</option>
                  <option value="dispatcher">
                    Dispatcher (Dispatch Terminal)
                  </option>
                  <option value="safety">
                    Safety Manager (Fleet Compliance)
                  </option>
                  <option value="invoicing">Billing Clerk (Financials)</option>
                  <option value="hr">HR Administrator (Team Portal)</option>
                  <option value="customer">
                    Client Representative (Track Loads)
                  </option>
                  <option value="super_admin">
                    Super Administrator (Full System)
                  </option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg hover:shadow-indigo-500/10 cursor-pointer transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Processing...</span>
              ) : (
                <>
                  {isSignUp ? (
                    <UserPlus className="h-4 w-4" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )}
                  <span>
                    {isSignUp
                      ? "Provision Corporate Profile"
                      : "Authenticate Session"}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quick Testing Panel (Only shown in Sign In mode) */}
        {!isSignUp && (
          <div className="bg-slate-800/30 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800/60 pb-2">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <h3 className="text-3xs font-bold font-mono text-indigo-300 uppercase tracking-wider">
                Quick-Test Developer Sandbox Accounts
              </h3>
            </div>

            {/* <div className="grid grid-cols-2 gap-2 text-2xs">
              {users.slice(0, 4).map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleQuickLogin(user)}
                  className="p-2 text-left bg-slate-800/40 hover:bg-slate-800 border border-slate-700/35 hover:border-indigo-500/40 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    {(user.role || "").replace("_", " ")}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                    User: {user.username}
                  </div>
                </button>
              ))}
            </div> */}
            <div className="text-[10px] text-center text-slate-500 font-mono">
              Default sandbox password is{" "}
              <span className="font-bold text-indigo-400">password</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

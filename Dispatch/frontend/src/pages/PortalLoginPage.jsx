import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePortalStore } from "../stores/usePortalStore";
import { Loader2 } from "lucide-react";

export default function PortalLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { portalUser, isLoggingIn, portalLogin, isCheckingAuth } = usePortalStore();

  useEffect(() => {
    if (portalUser) navigate("/portal/dashboard", { replace: true });
  }, [portalUser, navigate]);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    await portalLogin(username, password);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-500 to-sky-600 px-8 py-12 text-center">
            <h1 className="text-3xl font-black text-white mb-2">Nishan Transport</h1>
            <p className="text-sky-50 text-sm font-medium">Customer Portal</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                disabled={isLoggingIn}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoggingIn}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || !username || !password}
              className="w-full bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold py-3 rounded-lg hover:from-sky-600 hover:to-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoggingIn && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoggingIn ? "Signing in..." : "Sign in to Portal"}
            </button>
          </form>

          {/* Footer */}
          <div className="bg-slate-50 px-8 py-4 text-center text-xs text-slate-600 border-t border-slate-200">
            <p>For account access issues, contact your Nishan Transport coordinator.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

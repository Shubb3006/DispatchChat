import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { useLanguageStore } from "../store/useLanguageStore";
import { LANGUAGES } from "../lib/translations";
import { getServerBaseHost, DEFAULT_SERVER_IP } from "../lib/config";
import {
  Sun,
  Moon,
  LogOut,
  MessageSquare,
  User,
  Shield,
  Globe,
  Radio,
  Smartphone,
  Wifi,
  Server,
  X,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import BroadcastModal from "./BroadcastModal";
import Avatar from "./Avatar";
import toast from "react-hot-toast";

const Navbar = () => {
  const { authUser, logout, checkAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { language, setLanguage, t } = useLanguageStore();
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState("");
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    setCustomServerUrl(localStorage.getItem("custom_server_url") || "");
  }, [showServerModal]);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      alert("To install Fleet Hub on iOS or Android: tap Share ➡️ 'Add to Home Screen' in your mobile browser!");
    }
  };

  const handleSaveServerConfig = (e) => {
    e.preventDefault();
    if (customServerUrl.trim()) {
      let formatted = customServerUrl.trim();
      if (!formatted.startsWith("http://") && !formatted.startsWith("https://")) {
        formatted = `http://${formatted}`;
      }
      localStorage.setItem("custom_server_url", formatted);
      toast.success(`Server backend updated to ${formatted}`);
    } else {
      localStorage.removeItem("custom_server_url");
      toast.success("Reset to default server IP host!");
    }
    setShowServerModal(false);
    checkAuth();
  };

  function handleLogout() {
    logout();
  }

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const activeBackendHost = getServerBaseHost();

  return (
    <header className="glass-nav h-14 sm:h-16 px-4 border-b border-base-300/50">
      <div className="container mx-auto h-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="size-8 sm:size-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <img src="/logo.png" className="size-6 object-contain" alt="Logo" />
            </div>
            <h1 className="text-header text-sm sm:text-base hidden xs:block font-bold">
              OZACK_CHAT
            </h1>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Admin / Broadcast Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {authUser && ["super_user", "admin"].includes(authUser?.role) && (
              <button
                onClick={() => setShowBroadcastModal(true)}
                className="btn btn-xs sm:btn-sm btn-primary gap-1.5 rounded-xl shadow-sm"
                title="Send Fleet Announcement"
              >
                <Radio className="size-3.5 sm:size-4 animate-pulse" />
                <span className="hidden md:inline font-bold">Broadcast</span>
              </button>
            )}

            {authUser && ["super_user", "admin", "hr"].includes(authUser?.role) && (
              <Link to="/admin" className="btn btn-xs sm:btn-sm btn-outline btn-primary gap-1.5 rounded-xl" title="Admin Panel">
                <Shield className="size-3.5 sm:size-4" />
              </Link>
            )}
          </div>

          <div className="h-6 w-[1px] bg-base-300/50 mx-1 hidden sm:block"></div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Server Settings */}
            <button
              onClick={() => setShowServerModal(true)}
              className="btn btn-xs sm:btn-sm btn-ghost btn-circle text-primary hover:bg-primary/10"
              title={`Server: ${activeBackendHost}`}
            >
              <Wifi className="size-3.5 sm:size-4 animate-pulse text-emerald-500" />
            </button>

            {/* Install App */}
            <button
              onClick={handleInstallApp}
              className="btn btn-xs sm:btn-sm btn-ghost btn-circle text-accent"
              title="Install App"
            >
              <Smartphone className="size-3.5 sm:size-4" />
            </button>

            {/* Language Selector */}
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-xs sm:btn-sm btn-ghost gap-1 rounded-xl px-2"
              >
                <Globe className="size-3.5 sm:size-4 text-primary" />
                <span className="text-[10px] sm:text-xs font-bold">{currentLangObj.flag}</span>
              </div>
              <ul tabIndex={0} className="dropdown-content z-[50] menu p-2 shadow-2xl bg-base-100 rounded-2xl w-44 border border-base-300 mt-2 gap-1">
                {LANGUAGES.map((lang) => (
                  <li key={lang.code}>
                    <button
                      onClick={() => setLanguage(lang.code)}
                      className={`flex items-center justify-between text-xs rounded-xl ${
                        language === lang.code ? "active font-bold btn-primary" : ""
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="btn btn-xs sm:btn-sm btn-ghost btn-circle"
              title="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="size-4 text-amber-400" />
              ) : (
                <Moon className="size-4 text-sky-600" />
              )}
            </button>
          </div>

          <div className="h-6 w-[1px] bg-base-300/50 mx-1"></div>

          {/* User Profile / Auth */}
          {authUser ? (
            <div className="flex items-center gap-2">
              <Link to="/profile" className="flex items-center gap-2 group">
                <Avatar src={authUser.profilePic} name={authUser.fullName} size="size-7 sm:size-8" />
                <span className="hidden lg:inline text-xs font-semibold max-w-[100px] truncate">{authUser.fullName}</span>
              </Link>
              <button onClick={handleLogout} className="btn btn-ghost btn-circle btn-xs sm:btn-sm text-error" title="Logout">
                <LogOut className="size-3.5 sm:size-4" />
              </button>
            </div>
          ) : (
            <Link to="/signin" className="btn btn-primary btn-xs sm:btn-sm rounded-xl px-3 sm:px-4 font-bold text-[10px] sm:text-xs">
              SIGN IN
            </Link>
          )}
        </div>
      </div>

      <BroadcastModal isOpen={showBroadcastModal} onClose={() => setShowBroadcastModal(false)} />

      {/* Server Connection Modal */}
      {showServerModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-base-100 p-6 rounded-3xl border border-base-300 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-base-300 pb-3">
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Server className="size-5 text-primary" /> Connection Settings
              </h3>
              <button onClick={() => setShowServerModal(false)} className="btn btn-ghost btn-xs btn-circle">
                <X className="size-4" />
              </button>
            </div>

            <div className="bg-base-200/80 p-3 rounded-2xl border border-base-300/80 space-y-2 text-xs">
              <div className="flex items-center justify-between font-medium">
                <span className="opacity-70">Active Endpoint:</span>
                <span className="font-mono text-emerald-500 font-bold truncate max-w-[200px]">{activeBackendHost}</span>
              </div>
            </div>

            <form onSubmit={handleSaveServerConfig} className="space-y-4">
              <div>
                <label className="label text-xs font-semibold">Custom Server URL:</label>
                <input
                  type="text"
                  placeholder={`http://${DEFAULT_SERVER_IP}:5500`}
                  value={customServerUrl}
                  onChange={(e) => setCustomServerUrl(e.target.value)}
                  className="input input-bordered w-full text-xs font-mono rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-base-300">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("custom_server_url");
                    setCustomServerUrl("");
                    toast.success("Reset to default!");
                    setShowServerModal(false);
                    checkAuth();
                  }}
                  className="btn btn-ghost btn-xs text-error"
                >
                  Reset
                </button>
                <button type="submit" className="btn btn-primary btn-sm rounded-xl text-xs font-bold px-4">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

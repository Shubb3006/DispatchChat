import React, { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { useLanguageStore } from "../store/useLanguageStore";
import { LANGUAGES } from "../lib/translations";
import { getServerBaseHost, DEFAULT_SERVER_IP } from "../lib/config";
import { getRole, roleToneClass, cleanName } from "../lib/roles";
import {
  Sun,
  Moon,
  LogOut,
  User,
  Shield,
  Globe,
  Radio,
  Smartphone,
  Server,
  Activity,
  ChevronDown,
  CircleDot,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import BroadcastModal from "./BroadcastModal";
import Avatar from "./Avatar";
import BrandLogo from "./BrandLogo";
import Modal from "./Modal";
import toast from "react-hot-toast";

/* Browser reachability and socket state are external stores, so they are read
   with useSyncExternalStore rather than mirrored into state from an effect. */
const subscribeToNetwork = (onChange) => {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
};

const useIsOnline = () =>
  useSyncExternalStore(
    subscribeToNetwork,
    () => navigator.onLine,
    () => true
  );

const useSocketConnected = (socket) => {
  const subscribe = useCallback(
    (onChange) => {
      if (!socket) return () => { };
      socket.on("connect", onChange);
      socket.on("disconnect", onChange);
      return () => {
        socket.off("connect", onChange);
        socket.off("disconnect", onChange);
      };
    },
    [socket]
  );

  return useSyncExternalStore(
    subscribe,
    () => Boolean(socket?.connected),
    () => false
  );
};

/** Live transport state: socket connection + browser reachability. */
const useConnectionState = (socket) => {
  const online = useIsOnline();
  const connected = useSocketConnected(socket);

  if (!online) return { tone: "error", label: "Offline", detail: "Messages will queue and send on reconnect" };
  if (!connected) return { tone: "warning", label: "Connecting", detail: "Reaching the dispatch server" };
  return { tone: "success", label: "Live", detail: "Real-time channel connected" };
};

const TONE_PILL = {
  success: "bg-success/10 text-success ring-success/20",
  warning: "bg-warning/10 text-warning ring-warning/20",
  error: "bg-error/10 text-error ring-error/20",
};

const Navbar = () => {
  const { authUser, logout, checkAuth, socket, onlineUsers } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState("");
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const conn = useConnectionState(socket);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);


  /* Seeded on open rather than in an effect keyed on the modal flag. */
  const openServerModal = () => {
    setCustomServerUrl(localStorage.getItem("custom_server_url") || "");
    setShowServerModal(true);
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") setDeferredPrompt(null);
    } else {
      toast("On mobile: tap Share, then 'Add to Home Screen'.", { icon: "📲" });
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
      toast.success(`Server updated to ${formatted}`);
    } else {
      localStorage.removeItem("custom_server_url");
      toast.success("Reset to the default server host");
    }
    setShowServerModal(false);
    checkAuth();
  };

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const activeBackendHost = getServerBaseHost();
  const role = getRole(authUser?.role);
  const canBroadcast = ["super_user", "admin"].includes(authUser?.role);
  const canAdmin = ["super_user", "admin", "hr"].includes(authUser?.role);
  const peersOnline = Math.max((onlineUsers?.length || 0) - 1, 0);

  return (
    <header className="sticky top-0 z-0 glass-nav h-14 sm:h-16">
      <div className="mx-auto flex h-full max-w-none items-center justify-between gap-3 px-3 sm:px-5">
        {/* Brand */}
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Nishan_teams home">
          <BrandLogo
            markClass="size-8 sm:size-9"
            subtitle="Dispatch Suite"
            className="hidden sm:flex"
          />
          <BrandLogo markClass="size-8" showWordmark={false} className="sm:hidden" />
        </Link>

        {authUser ? (
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            {/* Connection status */}
            <button
              onClick={openServerModal}
              title={`${conn.detail} — ${activeBackendHost}`}
              className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold
                ring-1 ring-inset transition-colors sm:flex ${TONE_PILL[conn.tone]}`}
            >
              <CircleDot className={`size-3 ${conn.tone === "success" ? "animate-pulse" : ""}`} />
              <span>{conn.label}</span>
            </button>

            {/* Fleet presence count */}
            {peersOnline > 0 && (
              <span
                className="hidden items-center gap-1.5 rounded-full bg-base-200 px-2.5 py-1 text-[11px]
                  font-semibold text-base-content/70 ring-1 ring-inset ring-base-300 xl:flex"
                title={`${peersOnline} teammate${peersOnline === 1 ? "" : "s"} online now`}
              >
                <Activity className="size-3 text-success" />
                <span className="nums">{peersOnline}</span>
                <span className="opacity-60">online</span>
              </span>
            )}

            <span className="mx-1 hidden h-6 w-px bg-base-300 sm:block" />

            {/* Primary actions */}
            {canBroadcast && (
              <button
                onClick={() => setShowBroadcastModal(true)}
                className="btn btn-primary btn-sm gap-1.5 rounded-lg font-semibold shadow-sm"
                title="Send an announcement to the whole fleet"
              >
                <Radio className="size-4" />
                <span className="hidden md:inline">Broadcast</span>
              </button>
            )}

            {canAdmin && (
              <Link
                to="/admin"
                className="btn btn-ghost btn-sm gap-1.5 rounded-lg font-semibold"
                title="Admin panel"
              >
                <Shield className="size-4 text-secondary" />
                <span className="hidden lg:inline">Admin</span>
              </Link>
            )}

            <span className="mx-1 hidden h-6 w-px bg-base-300 sm:block" />

            {/* Utilities */}
            <button
              onClick={handleInstallApp}
              className="btn btn-ghost btn-sm btn-square rounded-lg"
              title="Install as an app"
            >
              <Smartphone className="size-4" />
            </button>

            {/* <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-sm gap-1 rounded-lg px-2"

                title="Language"
              >
                <Globe className="size-4" />
                <span className="text-xs">{currentLangObj.flag}</span>
              </div>
              <ul
                tabIndex={0}
                className="menu dropdown-content elevated z-50 mt-2 w-48 gap-0.5 rounded-xl
                  border border-base-300 bg-base-100 p-1.5"
              >
                <li className="menu-title px-2 pb-1 pt-1.5 text-[10px] uppercase tracking-widest">
                  Language
                </li>
                {LANGUAGES.map((lang) => (
                  <li key={lang.code}>
                    <button
                      onClick={() => setLanguage(lang.code)}
                      className="flex items-center justify-between rounded-lg text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                      {language === lang.code && <Check className="size-4 text-primary" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div> */}

            <div className="relative">
              <button
                type="button"
                onClick={() => setLanguageOpen((prev) => !prev)}
                className="btn btn-ghost btn-sm gap-1 rounded-lg px-2"
                title="Language"
              >
                <Globe className="size-4" />
                <span className="text-xs">{currentLangObj.flag}</span>
              </button>

              {languageOpen && (
                <div
                  className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl
        border border-base-300 bg-base-100 p-1.5 shadow-xl"
                >
                  <div className="px-2 pb-1 pt-1.5 text-[10px] uppercase tracking-widest text-base-content/50">
                    Language
                  </div>

                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setLanguage(lang.code);
                        setLanguageOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-lg
            px-3 py-2 text-sm hover:bg-base-200"
                    >
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>

                      {language === lang.code && (
                        <Check className="size-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={toggleTheme}
              className="btn btn-ghost btn-sm btn-square rounded-lg"
              title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              {theme === "dark" ? (
                <Sun className="size-4 text-warning" />
              ) : (
                <Moon className="size-4" />
              )}
            </button>

            <span className="mx-1 h-6 w-px bg-base-300" />

            {/* Account menu */}
            {/* <div className="dropdown dropdown-end"> */}
            {/* <div className={`dropdown dropdown-end ${accountOpen ? "dropdown-open" : ""}`}>
              <div
                tabIndex={0}
                role="button"
                onClick={() => setAccountOpen((prev) => !prev)}
                className="cursor-pointer flex items-center gap-2 rounded-lg py-1 pl-1 pr-1.5 transition-colors hover:bg-base-200"
                title="Account"
              >
                <Avatar
                  src={authUser.profilePic}
                  name={authUser.fullName}
                  size="size-8"
                  isOnline
                  showPresence
                />
                <span className="hidden min-w-0 flex-col items-start leading-tight lg:flex">
                  <span className="max-w-[130px] truncate text-xs font-semibold">
                    {cleanName(authUser.fullName)}
                  </span>
                  <span className="text-[10px] font-medium text-base-content/50">{role.label}</span>
                </span>
                <ChevronDown className="hidden size-3.5 opacity-40 lg:block" />
              </div>

              <ul
                tabIndex={0}
                className="menu dropdown-content elevated z-50 mt-2 w-64 gap-0.5 rounded-xl
                  border border-base-300 bg-base-100 p-1.5"
              >
                <li className="pointer-events-none px-2 pb-2 pt-1">
                  <div className="flex items-center gap-3 hover:bg-transparent">
                    <Avatar src={authUser.profilePic} name={authUser.fullName} size="size-10" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {cleanName(authUser.fullName)}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px]
                            font-bold uppercase tracking-wide ring-1 ring-inset ${roleToneClass(authUser?.role)}`}
                        >
                          <role.icon className="size-2.5" />
                          {role.label}
                        </span>
                        {authUser.unitNumber && (
                          <span className="nums text-[10px] text-base-content/50">
                            #{authUser.unitNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>

                <li className="menu-title px-2 py-1 text-[10px] uppercase tracking-widest">Account</li>
                <li>

                  <Link to="/profile" onClick={() => setAccountOpen(false)} className="rounded-lg text-sm">
                    <User className="size-4" /> Profile & settings
                  </Link>
                </li>
                <li>
                  <Link to="/status" className="rounded-lg text-sm">
                    <Activity className="size-4" /> Fleet status board
                  </Link>
                </li>
                <li>
                  <button onClick={openServerModal} className="rounded-lg text-sm">
                    <Server className="size-4" /> Connection settings
                  </button>
                </li>

                <div className="my-1 h-px bg-base-300" />
                <li>
                  <button onClick={logout} className="rounded-lg text-sm text-error">
                    <LogOut className="size-4" /> Sign out
                  </button>
                </li>
              </ul>
            </div> */}
            {/* <div className={`dropdown dropdown-end ${accountOpen ? "dropdown-open" : ""}`}>
              <div
                tabIndex={0}
                role="button"
                onClick={() => setAccountOpen((prev) => !prev)}
                className="cursor-pointer flex items-center gap-2 rounded-lg py-1 pl-1 pr-1.5 transition-colors hover:bg-base-200"
                title="Account"
              >
                <Avatar
                  src={authUser.profilePic}
                  name={authUser.fullName}
                  size="size-8"
                  isOnline
                  showPresence
                />

                <span className="hidden min-w-0 flex-col items-start leading-tight lg:flex">
                  <span className="max-w-[130px] truncate text-xs font-semibold">
                    {cleanName(authUser.fullName)}
                  </span>

                  <span className="text-[10px] font-medium text-base-content/50">
                    {role.label}
                  </span>
                </span>

                <ChevronDown className="hidden size-3.5 opacity-40 lg:block" />
              </div>

              <ul
                className="menu dropdown-content elevated z-50 mt-2 w-64 gap-0.5 rounded-xl
      border border-base-300 bg-base-100 p-1.5"
              >
                <li className="pointer-events-none px-2 pb-2 pt-1">
                  <div className="flex items-center gap-3 hover:bg-transparent">
                    <Avatar
                      src={authUser.profilePic}
                      name={authUser.fullName}
                      size="size-10"
                    />

                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {cleanName(authUser.fullName)}
                      </div>

                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px]
                font-bold uppercase tracking-wide ring-1 ring-inset
                ${roleToneClass(authUser?.role)}`}
                        >
                          <role.icon className="size-2.5" />
                          {role.label}
                        </span>

                        {authUser.unitNumber && (
                          <span className="nums text-[10px] text-base-content/50">
                            #{authUser.unitNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>

                <li className="menu-title px-2 py-1 text-[10px] uppercase tracking-widest">
                  Account
                </li>

                <li>
                  <Link
                    to="/profile"
                    onClick={() => setAccountOpen(false)}
                    className="rounded-lg text-sm"
                  >
                    <User className="size-4" />
                    Profile & settings
                  </Link>
                </li>

                <li>
                  <Link
                    to="/status"
                    onClick={() => setAccountOpen(false)}
                    className="rounded-lg text-sm"
                  >
                    <Activity className="size-4" />
                    Fleet status board
                  </Link>
                </li>

                <li>
                  <button
                    onClick={() => {
                      setAccountOpen(false);
                      openServerModal();
                    }}
                    className="rounded-lg text-sm"
                  >
                    <Server className="size-4" />
                    Connection settings
                  </button>
                </li>

                <div className="my-1 h-px bg-base-300" />

                <li>
                  <button
                    onClick={() => {
                      setAccountOpen(false);
                      logout();
                    }}
                    className="rounded-lg text-sm text-error"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </li>
              </ul>
            </div> */}
            <div className="relative">
              {/* Account button */}
              <button
                type="button"
                onClick={() => setAccountOpen((prev) => !prev)}
                className="cursor-pointer flex items-center gap-2 rounded-lg py-1 pl-1 pr-1.5
      transition-colors hover:bg-base-200"
                title="Account"
              >
                <Avatar
                  src={authUser.profilePic}
                  name={authUser.fullName}
                  size="size-8"
                  isOnline
                  showPresence
                />

                <span className="hidden min-w-0 flex-col items-start leading-tight lg:flex">
                  <span className="max-w-[130px] truncate text-xs font-semibold">
                    {cleanName(authUser.fullName)}
                  </span>

                  <span className="text-[10px] font-medium text-base-content/50">
                    {role.label}
                  </span>
                </span>

                <ChevronDown className="hidden size-3.5 opacity-40 lg:block" />
              </button>

              {/* Dropdown */}
              {accountOpen && (
                <div
                  className="absolute right-0 top-full z-50 mt-2 w-64
        rounded-xl border border-base-300 bg-base-100 p-1.5
        shadow-xl"
                >
                  <div className="px-2 pb-2 pt-1">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={authUser.profilePic}
                        name={authUser.fullName}
                        size="size-10"
                      />

                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {cleanName(authUser.fullName)}
                        </div>

                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5
                  text-[10px] font-bold uppercase tracking-wide
                  ring-1 ring-inset ${roleToneClass(authUser?.role)}`}
                          >
                            <role.icon className="size-2.5" />
                            {role.label}
                          </span>

                          {authUser.unitNumber && (
                            <span className="nums text-[10px] text-base-content/50">
                              #{authUser.unitNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-2 py-1 text-[10px] uppercase tracking-widest text-base-content/50">
                    Account
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-base-200"
                  >
                    <User className="size-4" />
                    Profile & settings
                  </Link>

                  <Link
                    to="/status"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-base-200"
                  >
                    <Activity className="size-4" />
                    Fleet status board
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setAccountOpen(false);
                      openServerModal();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-base-200"
                  >
                    <Server className="size-4" />
                    Connection settings
                  </button>

                  <div className="my-1 h-px bg-base-300" />

                  <button
                    type="button"
                    onClick={() => {
                      setAccountOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-error hover:bg-error/10"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Link to="/signin" className="btn btn-primary btn-sm rounded-lg px-4 font-semibold">
            Sign in
          </Link>
        )}
      </div>

      <BroadcastModal isOpen={showBroadcastModal} onClose={() => setShowBroadcastModal(false)} />

      {/* Connection settings */}
      <Modal
        isOpen={showServerModal}
        onClose={() => setShowServerModal(false)}
        title="Connection settings"
        subtitle="Where this app looks for the dispatch server"
        icon={Server}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("custom_server_url");
                setCustomServerUrl("");
                toast.success("Reset to default");
                setShowServerModal(false);
                checkAuth();
              }}
              className="btn btn-ghost btn-sm rounded-lg text-error"
            >
              Reset
            </button>
            <button
              type="submit"
              form="server-form"
              className="btn btn-primary btn-sm rounded-lg px-4 font-semibold"
            >
              Save
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <dl className="space-y-2 rounded-xl border border-base-300 bg-base-200 p-3 text-xs">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-base-content/60">Status</dt>
              <dd>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px]
                    font-semibold ring-1 ring-inset ${TONE_PILL[conn.tone]}`}
                >
                  <CircleDot className="size-3" /> {conn.label}
                </span>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-base-content/60">Endpoint</dt>
              <dd className="nums max-w-[220px] truncate text-[11px] font-semibold">
                {activeBackendHost}
              </dd>
            </div>
          </dl>

          <form id="server-form" onSubmit={handleSaveServerConfig}>
            <label htmlFor="server-url" className="label-caps mb-1 block">
              Custom server URL
            </label>
            <input
              id="server-url"
              type="text"
              placeholder={`http://${DEFAULT_SERVER_IP}:5500`}
              value={customServerUrl}
              onChange={(e) => setCustomServerUrl(e.target.value)}
              className="input input-bordered nums w-full rounded-lg text-xs"
            />
            <p className="mt-1.5 text-[11px] text-base-content/50">
              Leave blank to auto-detect. Useful when testing from a phone on the same network.
            </p>
          </form>
        </div>
      </Modal>
    </header>
  );
};

export default Navbar;

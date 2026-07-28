import React, { useEffect, useState } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Navigation from "./components/Navigation";
import { useAuthStore } from "./stores/useAuthStore";
import { useShipmentStore } from "./stores/useShipmentStore";
import { useMessageStore } from "./stores/useMessageStore";

import LoginPage from "./pages/LoginPage";
import DispatcherPage from "./pages/DispatcherPage";
import DriverManagerPage from "./pages/DriverManagerPage";
import DriverPage from "./pages/DriverPage";
import SafetyPage from "./pages/SafetyPage";
import InvoicingPage from "./pages/InvoicingPage";
import CustomerPage from "./pages/CustomerPage";
import HRPage from "./pages/HRPage";
import ReportingPage from "./pages/REportingPage";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./ProtectedRoute";
import { Loader, Loader2 } from "lucide-react";

function LogiSyncApp() {
  const location = useLocation();
  const navigate = useNavigate();

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const currentUser = useAuthStore((state) => state.currentUser);
  const users = useAuthStore((state) => state.users);
  const logoutAction = useAuthStore((state) => state.logout);
  const setCurrentUser = (user) => useAuthStore.setState({ currentUser: user });

  const checkAuth = useAuthStore((state) => state.checkAuth);
  const fetchShipments = useShipmentStore((state) => state.fetchShipments);
  useEffect(() => {
    fetchShipments();
  }, [checkAuth]);

  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  useEffect(() => {
    checkAuth();
  }, []);

  const [currentRole, setCurrentRole] = useState("dispatcher");
  const [systemTime, setSystemTime] = useState("");

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSystemTime(now.toLocaleTimeString("en-US", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch only necessary initial data to bootstrap state
  const fetchUsers = useAuthStore((state) => state.fetchUsers);

  React.useEffect(() => {
    fetchUsers();
  }, []);

  // Sync route layout path to currentRole, perform redirection
  React.useEffect(() => {
    if (!isLoggedIn) {
      if (location.pathname !== "/login") {
        navigate("/login");
      }
      return;
    }

    if (currentUser?.role === "driver") {
      if (location.pathname !== "/driver") {
        navigate("/driver");
      }
      return;
    }

    const cleanPath = location.pathname.replace("/", "");
    const validRoles = [
      "dispatcher",
      "driver_manager",
      "driver",
      "safety",
      "invoicing",
      "customer",
      "hr",
      "reporting",
      "data_entry",
      "customs",
    ];
    if (validRoles.includes(cleanPath)) {
      if (currentRole !== cleanPath) {
        setCurrentRole(cleanPath);
      }
    } else {
      const isSuperOrAdmin =
        currentUser?.role === "super_admin" || currentUser?.role === "admin";
      const defaultRole = isSuperOrAdmin
        ? "reporting"
        : currentUser?.allowedModules?.[0] || "customer";
      setCurrentRole(defaultRole);
      navigate("/" + defaultRole);
    }
  }, [location.pathname, isLoggedIn, currentUser, navigate, currentRole]);

  // Read message count and active shipments from stores for Navigation badges
  const messages = useMessageStore((state) => state.messages);
  const shipments = useShipmentStore((state) => state.shipments);

  const unreadMessagesCount = messages.filter(
    (m) =>
      !m.read &&
      m.recipientId === (currentRole === "driver" ? "DRV001" : "DISP_OFFICE")
  ).length;
  const activeShipmentsCount = shipments.filter(
    (s) => s.status !== "delivered" && s.status !== "pending"
  ).length;
  console.log(shipments);

  console.log(activeShipmentsCount);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (currentUser?.role === "driver") {
    return (
      <Routes>
        <Route path="/driver" element={<DriverPage />} />
        <Route path="*" element={<Navigate to="/driver" replace />} />
      </Routes>
    );
  }

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (currentUser && currentUser.role === "driver") {
    return (
      <Routes>
        <Route path="/driver" element={<DriverPage />} />
        <Route path="*" element={<Navigate to="/driver" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F1F3F5] text-[#1D2125] font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Platform Navigation (Sidebar) */}
      <Navigation
        currentRole={currentRole}
        onChangeRole={(role) => {
          setCurrentRole(role);
          navigate("/" + role);
        }}
        activeShipmentsCount={activeShipmentsCount}
        unreadMessagesCount={unreadMessagesCount}
        currentUser={currentUser}
        onLogout={() => {
          logoutAction();
          navigate("/login");
        }}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Control Bar */}
        <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 select-none">
          <div className="flex items-center gap-4">
            <h1 className="font-bold text-sm uppercase tracking-wider text-gray-700">
              {currentRole === "dispatcher"
                ? "Dispatch Console"
                : currentRole === "driver"
                ? "Driver Terminal"
                : currentRole === "safety"
                ? "Safety Compliance Audit"
                : currentRole === "invoicing"
                ? "Invoicing Ledger & LTL"
                : currentRole === "customer"
                ? "Customer Visibility Link"
                : currentRole === "hr"
                ? "HR Personnel & Roles Directory"
                : "Operations Analytics"}
            </h1>
            <div className="h-4 w-[1px] bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-tight">
                SAMSARA: CONNECTED
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-tight">
                BORDER CONNECT: ACTIVE
              </span>
            </div>
          </div>

          {/* User selector dropdown in header */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 text-slate-700 rounded-lg border border-slate-200 transition-colors">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                Session:
              </span>
              <select
                value={currentUser?.id}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const found = users.find((u) => u.id === selectedId);
                  if (found) {
                    setCurrentUser(found);
                    const isSuperOrAdmin =
                      found.role === "super_admin" || found.role === "admin";
                    const target = isSuperOrAdmin
                      ? "reporting"
                      : found.allowedModules[0] || "customer";
                    setCurrentRole(target);
                    navigate("/" + target);
                  }
                }}
                className="bg-transparent font-bold text-xs text-slate-800 focus:outline-none cursor-pointer"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role.toUpperCase().replace("_", " ")})
                  </option>
                ))}
              </select>
            </div>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 font-mono text-[10px] font-bold rounded-sm uppercase">
              Active: {currentRole}
            </span>
          </div>
        </header>

        {/* Primary Content Grid - Controlled by Route matches */}
        <div className="flex-1 overflow-auto bg-[#F1F3F5] p-3">
          <Routes>
            <Route path="/dispatcher" element={<DispatcherPage />} />
            <Route path="/data_entry" element={<DispatcherPage />} />
            <Route path="/customs" element={<DispatcherPage />} />
            <Route path="/driver_manager" element={<DriverManagerPage />} />
            <Route path="/driver" element={<DriverPage />} />
            <Route path="/safety" element={<SafetyPage />} />
            <Route path="/invoicing" element={<InvoicingPage />} />
            <Route path="/customer" element={<CustomerPage />} />
            <Route path="/hr" element={<HRPage />} />
            <Route path="/reporting" element={<ReportingPage />} />
            <Route
              path="*"
              element={<Navigate to={`/${currentRole}`} replace />}
            />
          </Routes>
        </div>

        {/* Footer Info Bar */}
        <footer className="h-6 bg-[#1A1D23] text-gray-400 text-[10px] flex items-center justify-between px-4 shrink-0 select-none">
          <div className="flex gap-4">
            <span>v4.2.1-Stable</span>
            <span>Server: US-EAST-1</span>
          </div>
          <div className="flex gap-4">
            <span className="text-blue-400 font-mono">
              BorderConnect Sync: OK
            </span>
            <span className="text-blue-400 font-mono">
              Samsara Fleet API: 142ms
            </span>
            <span className="text-white font-mono uppercase">
              System Time: {systemTime}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster />
      <LogiSyncApp />
    </>
  );
}

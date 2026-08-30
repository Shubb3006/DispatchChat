// import React, { useEffect, useState } from "react";
// import {
//   HashRouter as Router,
//   Routes,
//   Route,
//   Navigate,
//   useNavigate,
//   useLocation,
// } from "react-router-dom";
// import Navigation from "./components/Navigation";
// import { useAuthStore } from "./stores/useAuthStore";
// import { useShipmentStore } from "./stores/useShipmentStore";
// import { useMessageStore } from "./stores/useMessageStore";

// import LoginPage from "./pages/LoginPage";
// import DispatcherPage from "./pages/DispatcherPage";
// import DriverManagerPage from "./pages/DriverManagerPage";
// import DriverPage from "./pages/DriverPage";
// import SafetyPage from "./pages/SafetyPage";
// import InvoicingPage from "./pages/InvoicingPage";
// import CustomerPage from "./pages/CustomerPage";
// import HRPage from "./pages/HRPage";
// import ReportingPage from "./pages/REportingPage";
// import { Toaster } from "react-hot-toast";
// import ProtectedRoute from "./ProtectedRoute";
// import { Loader, Loader2 } from "lucide-react";

// function LogiSyncApp() {
//   const location = useLocation();
//   const navigate = useNavigate();

//   const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
//   const currentUser = useAuthStore((state) => state.currentUser);
//   const users = useAuthStore((state) => state.users);
//   const logoutAction = useAuthStore((state) => state.logout);
//   const setCurrentUser = (user) => useAuthStore.setState({ currentUser: user });

//   const checkAuth = useAuthStore((state) => state.checkAuth);
//   const fetchShipments = useShipmentStore((state) => state.fetchShipments);
//   useEffect(() => {
//     fetchShipments();
//   }, [checkAuth]);

//   const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
//   useEffect(() => {
//     checkAuth();
//   }, []);

//   const [currentRole, setCurrentRole] = useState("dispatcher");
//   const [systemTime, setSystemTime] = useState("");

//   React.useEffect(() => {
//     const updateTime = () => {
//       const now = new Date();
//       setSystemTime(now.toLocaleTimeString("en-US", { hour12: false }));
//     };
//     updateTime();
//     const interval = setInterval(updateTime, 1000);
//     return () => clearInterval(interval);
//   }, []);

//   // Fetch only necessary initial data to bootstrap state
//   const fetchUsers = useAuthStore((state) => state.fetchUsers);

//   React.useEffect(() => {
//     fetchUsers();
//   }, []);

//   // Sync route layout path to currentRole, perform redirection
//   React.useEffect(() => {
//     if (!isLoggedIn) {
//       if (location.pathname !== "/login") {
//         navigate("/login");
//       }
//       return;
//     }

//     if (currentUser?.role === "driver") {
//       if (location.pathname !== "/driver") {
//         navigate("/driver");
//       }
//       return;
//     }

//     const cleanPath = location.pathname.replace("/", "");
//     const validRoles = [
//       "dispatcher",
//       "driver_manager",
//       "driver",
//       "safety",
//       "invoicing",
//       "customer",
//       "hr",
//       "reporting",
//       "data_entry",
//       "customs",
//     ];
//     if (validRoles.includes(cleanPath)) {
//       if (currentRole !== cleanPath) {
//         setCurrentRole(cleanPath);
//       }
//     } else {
//       const isSuperOrAdmin =
//         currentUser?.role === "super_admin" || currentUser?.role === "admin";
//       const defaultRole = isSuperOrAdmin
//         ? "reporting"
//         : currentUser?.allowedModules?.[0] || "customer";
//       setCurrentRole(defaultRole);
//       navigate("/" + defaultRole);
//     }
//   }, [location.pathname, isLoggedIn, currentUser, navigate, currentRole]);

//   // Read message count and active shipments from stores for Navigation badges
//   const messages = useMessageStore((state) => state.messages);
//   const shipments = useShipmentStore((state) => state.shipments);

//   const unreadMessagesCount = messages.filter(
//     (m) =>
//       !m.read &&
//       m.recipientId === (currentRole === "driver" ? "DRV001" : "DISP_OFFICE")
//   ).length;
//   const activeShipmentsCount = shipments.filter(
//     (s) => s.status !== "delivered" && s.status !== "pending"
//   ).length;
//   console.log(shipments);

//   console.log(activeShipmentsCount);

//   if (isCheckingAuth) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <Loader2 className="animate-spin" />
//       </div>
//     );
//   }

//   if (!isLoggedIn) {
//     return (
//       <Routes>
//         <Route path="/login" element={<LoginPage />} />
//         <Route path="*" element={<Navigate to="/login" replace />} />
//       </Routes>
//     );
//   }

//   if (currentUser?.role === "driver") {
//     return (
//       <Routes>
//         <Route path="/driver" element={<DriverPage />} />
//         <Route path="*" element={<Navigate to="/driver" replace />} />
//       </Routes>
//     );
//   }

//   if (!isLoggedIn) {
//     return (
//       <Routes>
//         <Route path="/login" element={<LoginPage />} />
//         <Route path="*" element={<Navigate to="/login" replace />} />
//       </Routes>
//     );
//   }

//   if (currentUser && currentUser.role === "driver") {
//     return (
//       <Routes>
//         <Route path="/driver" element={<DriverPage />} />
//         <Route path="*" element={<Navigate to="/driver" replace />} />
//       </Routes>
//     );
//   }

//   return (
//     <div className="flex h-screen w-screen overflow-hidden bg-[#F1F3F5] text-[#1D2125] font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
//       {/* Platform Navigation (Sidebar) */}
//       <Navigation
//         currentRole={currentRole}
//         onChangeRole={(role) => {
//           setCurrentRole(role);
//           navigate("/" + role);
//         }}
//         activeShipmentsCount={activeShipmentsCount}
//         unreadMessagesCount={unreadMessagesCount}
//         currentUser={currentUser}
//         onLogout={() => {
//           logoutAction();
//           navigate("/login");
//         }}
//       />

//       {/* Main Workspace */}
//       <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
//         {/* Top Control Bar */}
//         <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 select-none">
//           <div className="flex items-center gap-4">
//             <h1 className="font-bold text-sm uppercase tracking-wider text-gray-700">
//               {currentRole === "dispatcher"
//                 ? "Dispatch Console"
//                 : currentRole === "driver"
//                 ? "Driver Terminal"
//                 : currentRole === "safety"
//                 ? "Safety Compliance Audit"
//                 : currentRole === "invoicing"
//                 ? "Invoicing Ledger & LTL"
//                 : currentRole === "customer"
//                 ? "Customer Visibility Link"
//                 : currentRole === "hr"
//                 ? "HR Personnel & Roles Directory"
//                 : "Operations Analytics"}
//             </h1>
//             <div className="h-4 w-[1px] bg-gray-300" />
//             <div className="flex items-center gap-2">
//               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
//               <span className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-tight">
//                 SAMSARA: CONNECTED
//               </span>
//             </div>
//             <div className="flex items-center gap-2">
//               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
//               <span className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-tight">
//                 BORDER CONNECT: ACTIVE
//               </span>
//             </div>
//           </div>

//           {/* User selector dropdown in header */}
//           <div className="flex items-center gap-3">
//             <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 text-slate-700 rounded-lg border border-slate-200 transition-colors">
//               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
//                 Session:
//               </span>
//               <select
//                 value={currentUser?.id}
//                 onChange={(e) => {
//                   const selectedId = e.target.value;
//                   const found = users.find((u) => u.id === selectedId);
//                   if (found) {
//                     setCurrentUser(found);
//                     const isSuperOrAdmin =
//                       found.role === "super_admin" || found.role === "admin";
//                     const target = isSuperOrAdmin
//                       ? "reporting"
//                       : found.allowedModules[0] || "customer";
//                     setCurrentRole(target);
//                     navigate("/" + target);
//                   }
//                 }}
//                 className="bg-transparent font-bold text-xs text-slate-800 focus:outline-none cursor-pointer"
//               >
//                 {users.map((u) => (
//                   <option key={u.id} value={u.id}>
//                     {u.name} ({u.role.toUpperCase().replace("_", " ")})
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 font-mono text-[10px] font-bold rounded-sm uppercase">
//               Active: {currentRole}
//             </span>
//           </div>
//         </header>

//         {/* Primary Content Grid - Controlled by Route matches */}
//         <div className="flex-1 overflow-auto bg-[#F1F3F5] p-3">
//           <Routes>
//             <Route path="/dispatcher" element={<DispatcherPage />} />
//             <Route path="/data_entry" element={<DispatcherPage />} />
//             <Route path="/customs" element={<DispatcherPage />} />
//             <Route path="/driver_manager" element={<DriverManagerPage />} />
//             <Route path="/driver" element={<DriverPage />} />
//             <Route path="/safety" element={<SafetyPage />} />
//             <Route path="/invoicing" element={<InvoicingPage />} />
//             <Route path="/customer" element={<CustomerPage />} />
//             <Route path="/hr" element={<HRPage />} />
//             <Route path="/reporting" element={<ReportingPage />} />
//             <Route
//               path="*"
//               element={<Navigate to={`/${currentRole}`} replace />}
//             />
//           </Routes>
//         </div>

//         {/* Footer Info Bar */}
//         <footer className="h-6 bg-[#1A1D23] text-gray-400 text-[10px] flex items-center justify-between px-4 shrink-0 select-none">
//           <div className="flex gap-4">
//             <span>v4.2.1-Stable</span>
//             <span>Server: US-EAST-1</span>
//           </div>
//           <div className="flex gap-4">
//             <span className="text-blue-400 font-mono">
//               BorderConnect Sync: OK
//             </span>
//             <span className="text-blue-400 font-mono">
//               Samsara Fleet API: 142ms
//             </span>
//             <span className="text-white font-mono uppercase">
//               System Time: {systemTime}
//             </span>
//           </div>
//         </footer>
//       </div>
//     </div>
//   );
// }

// export default function App() {
//   return (
//     <>
//       <Toaster />
//       <LogiSyncApp />
//     </>
//   );
// }

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
import { Loader2, UserCircle, Activity } from "lucide-react";
import WarehouseManagerPage from "./pages/WareHouseManagerPage";
import CustomsPage from "./pages/CustomsPage";
import SamsaraFleetPage from "./pages/SamsaraFleetPage";
import PublicTrackingPage from "./pages/PublicTrackingPage";
import DetentionPage from "./pages/DetentionPage";
import MaintenanceRadarPage from "./pages/MaintenanceRadarPage";
import EtaWeatherRadarPage from "./pages/EtaWeatherRadarPage";
import AuditLogPage from "./pages/AuditLogPage";
import KanbanDispatchPage from "./pages/KanbanDispatchPage";
import SettlementsPage from "./pages/SettlementsPage";
import PcMilerPage from "./pages/PcMilerPage";
import PortalLoginPage from "./pages/PortalLoginPage";
import PortalDashboardPage from "./pages/PortalDashboardPage";
import PortalRateRequestPage from "./pages/PortalRateRequestPage";
import PortalLoadDetailPage from "./pages/PortalLoadDetailPage";
import { usePortalStore } from "./stores/usePortalStore";



// Isolated clock component — only this tiny component re-renders every second,
// not the entire app shell.
function SystemClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-US", { hour12: true })
  );
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-US", { hour12: true }));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{time}</span>;
}

function LogiSyncApp() {
  const location = useLocation();
  const navigate = useNavigate();

  // Select only the specific slices needed — avoids re-rendering on unrelated auth state changes
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const currentUser = useAuthStore((state) => state.currentUser);
  const users = useAuthStore((state) => state.users);
  const logout = useAuthStore((state) => state.logout);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const fetchUsers = useAuthStore((state) => state.fetchUsers);

  const setCurrentUser = (user) => useAuthStore.setState({ currentUser: user });

  const fetchShipments = useShipmentStore((state) => state.fetchShipments);
  const shipments = useShipmentStore((state) => state.shipments);
  const messages = useMessageStore((state) => state.messages);

  const [currentRole, setCurrentRole] = useState("data_entry");

  // Bootstrap Data — run once on mount only
  useEffect(() => {
    checkAuth();
    fetchUsers();
    fetchShipments();
  }, []);

  // System Clock — intentionally omitted from LogiSyncApp state.
  // The <SystemClock /> component below manages its own tick so the
  // rest of the app shell does NOT re-render every second.

  // Role & Routing Logic
  useEffect(() => {
    if (location.pathname.startsWith("/track")) {
      return; // Public Magic Tracking Route (Zero-Login)
    }

    if (!isLoggedIn && location.pathname !== "/login") {
      navigate("/login");
      return;
    }

    if (currentUser?.role === "driver" && location.pathname !== "/driver") {
      navigate("/driver");
      return;
    }

    const cleanPath = location.pathname.replace("/", "");
    const validRoles = [
      "dispatcher",
      "driver_manager",
      "warehouse_manager",
      "driver",
      "safety",
      "invoicing",
      "customer",
      "hr",
      "reporting",
      "data_entry",
      "kanban",
      "pcmiler",
      "customs",
      "telematics",
      "detention",
      "settlements",
      "maintenance",
      "eta_radar",
      "eta-radar",
      "audit_logs",
      "audit-logs",
    ];


    if (validRoles.includes(cleanPath)) {
      if (currentRole !== cleanPath) setCurrentRole(cleanPath);
    } else if (currentUser) {
      const isSuperOrAdmin =
        currentUser.role === "super_admin" || currentUser.role === "admin";
      const modules =
        currentUser.allowedModules || currentUser.allowed_modules || [];
      const defaultRole = isSuperOrAdmin
        ? "reporting"
        : modules[0] || "customer";
      setCurrentRole(defaultRole);
      navigate("/" + defaultRole);
    }
  }, [location.pathname, isLoggedIn, currentUser, navigate, currentRole]);

  // Portal routing (customer/broker login — separate surface from staff app)
  if (location.pathname.startsWith("/portal")) {
    const portalUser = usePortalStore((state) => state.portalUser);
    const isCheckingPortalAuth = usePortalStore((state) => state.isCheckingAuth);
    const checkPortalAuth = usePortalStore((state) => state.checkPortalAuth);

    useEffect(() => {
      checkPortalAuth();
    }, []);

    if (isCheckingPortalAuth) {
      return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        </div>
      );
    }

    return (
      <>
        <Routes>
          <Route path="/portal/login" element={<PortalLoginPage />} />
          <Route
            path="/portal/dashboard"
            element={portalUser ? <PortalDashboardPage /> : <Navigate to="/portal/login" replace />}
          />
          <Route
            path="/portal/rate-request"
            element={portalUser ? <PortalRateRequestPage /> : <Navigate to="/portal/login" replace />}
          />
          <Route
            path="/portal/loads/:id"
            element={portalUser ? <PortalLoadDetailPage /> : <Navigate to="/portal/login" replace />}
          />
          <Route path="/portal" element={<Navigate to="/portal/dashboard" replace />} />
          <Route path="/portal/*" element={<Navigate to="/portal/dashboard" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </>
    );
  }

  // Public Tracking Route Bypass (No Login Required)
  if (location.pathname.startsWith("/track")) {
    return (
      <Routes>
        <Route path="/track/:trackingNumber" element={<PublicTrackingPage />} />
        <Route path="/track" element={<PublicTrackingPage />} />
      </Routes>
    );
  }

  // Badges
  const unreadMessagesCount = messages.filter(
    (m) =>
      !m.read &&
      m.recipientId === (currentRole === "driver" ? "DRV001" : "DISP_OFFICE")
  ).length;

  const activeShipmentsCount = shipments.filter(
    (s) => s.status !== "delivered" && s.status !== "pending"
  ).length;

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/track/:trackingNumber" element={<PublicTrackingPage />} />
        <Route path="/track" element={<PublicTrackingPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 font-sans antialiased selection:bg-sky-100 selection:text-sky-900">
      {/* Sidebar Navigation */}
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
          logout();
          navigate("/login");
        }}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50">
        {/* Modern Clean Crisp Top Header */}
        <header className="h-14 border-b border-slate-200 flex items-center justify-between px-6 shrink-0 bg-white select-none z-20 shadow-xs">
          {/* Left: Clean Breadcrumb */}
          <div className="flex items-center gap-2.5 text-xs">
            <span className="font-bold text-sky-700 tracking-wider">
              NISHAN TMS
            </span>
            <span className="text-slate-300">/</span>
            <span className="font-extrabold text-slate-900 capitalize text-sm">
              {currentRole.replace("_", " ")}
            </span>
          </div>

          {/* Right: Cloud Status, Time & User */}
          <div className="flex items-center gap-4">
            {/* Cloud Status Badges */}
            <div className="hidden lg:flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-semibold">Samsara</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-semibold">BorderConnect</span>
              </div>
            </div>

            {/* System Clock */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono text-slate-600 shadow-2xs">
              <SystemClock />
            </div>

            <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />

            {/* User Profile */}
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-800">
                  {currentUser?.username || "Nishan Admin"}
                </div>
                <div className="text-[10px] text-slate-500 font-medium capitalize">
                  {currentUser?.role ? currentUser.role.replace("_", " ") : "Administrator"}
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-sm">
                {currentUser?.username?.[0]?.toUpperCase() || "N"}
              </div>
            </div>
          </div>
        </header>

        {/* Primary Content Grid */}
        <div className="flex-1 overflow-auto bg-slate-50/70 p-4 sm:p-6 text-slate-900">
          <Routes>
            <Route path="/" element={<Navigate to="/data_entry" replace />} />
            <Route path="/dispatcher" element={<Navigate to="/data_entry" replace />} />
            <Route path="/data_entry" element={<DispatcherPage />} />
            <Route path="/kanban" element={<KanbanDispatchPage />} />
            <Route path="/pcmiler" element={<PcMilerPage />} />
            <Route path="/telematics" element={<SamsaraFleetPage />} />
            <Route path="/eta_radar" element={<EtaWeatherRadarPage />} />
            <Route path="/eta-radar" element={<EtaWeatherRadarPage />} />
            <Route path="/maintenance" element={<MaintenanceRadarPage />} />

            <Route path="/customs" element={<CustomsPage />} />
            <Route path="/detention" element={<DetentionPage />} />
            <Route path="/settlements" element={<SettlementsPage />} />
            <Route path="/audit_logs" element={<AuditLogPage />} />
            <Route path="/audit-logs" element={<AuditLogPage />} />
            <Route
              path="/warehouse_manager"
              element={<WarehouseManagerPage />}
            />
            <Route path="/invoicing" element={<InvoicingPage />} />
            <Route path="/customer" element={<CustomerPage />} />
            <Route path="/hr" element={<HRPage />} />
            <Route path="/reporting" element={<ReportingPage />} />
            <Route
              path="*"
              element={<Navigate to="/data_entry" replace />}
            />
          </Routes>
        </div>


        {/* Subtle Footer */}
        <footer className="h-8 bg-white border-t border-slate-200 text-slate-500 text-xs flex items-center justify-between px-6 shrink-0 select-none">
          <div className="flex gap-4">
            <span className="font-mono text-[11px] font-medium text-slate-600">NISHAN TMS Enterprise v5.1</span>
          </div>
          <div className="flex gap-4 items-center font-mono text-[11px] text-slate-600">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>Samsara Radar: ONLINE</span>
            <div className="h-3 w-[1px] bg-slate-200" />
            <SystemClock />
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

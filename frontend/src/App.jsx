// import React, { useState } from "react";
// import {
//   HashRouter as Router,
//   Routes,
//   Route,
//   Navigate,
//   useNavigate,
//   useLocation,
// } from "react-router-dom";
// import Navigation from "./components/Navigation";
// import { useAuthStore } from "./store/useAuthStore";
// import { useShipmentStore } from "./store/useShipmentStore";
// import { useTripStore } from "./store/useTripStore";
// import { useMessageStore } from "./store/useMessageStore";
// import { useDocumentStore } from "./store/useDocumentStore";
// import { useInvoiceStore } from "./store/useInvoiceStore";
// import { useSafetyStore } from "./store/useSafetyStore";
// import { useHOSStore } from "./store/useHOSStore";
// import { useCustomerStore } from "./store/useCustomerStore";
// import { useAssetStore } from "./store/useAssetStore";
// import { useLocationStore } from "./store/useLocationStore";
// import LoginPage from "./pages/LoginPage";
// import DispatcherPage from "./pages/DispatcherPage";
// import DriverManagerPage from "./pages/DriverManagerPage";
// import DriverPage from "./pages/DriverPage";
// import SafetyPage from "./pages/SafetyPage";
// import InvoicingPage from "./pages/InvoicingPage";
// import CustomerPage from "./pages/CustomerPage";
// import HRPage from "./pages/HRPage";
// import ReportingPage from "./pages/ReportingPage";
// import { useDriverStore } from "./store/useDriverstore";
// const INITIAL_USERS = [
//   {
//     id: "USR001",
//     name: "Sophia Chen",
//     username: "superadmin",
//     password: "password",
//     role: "super_admin",
//     allowedModules: [
//       "reporting",
//       "data_entry",
//       "dispatcher",
//       "driver_manager",
//       "customs",
//       "safety",
//       "invoicing",
//       "customer",
//       "driver",
//       "hr",
//     ],
//     createdAt: "2026-01-10",
//   },
//   {
//     id: "USR002",
//     name: "Alex Mercer",
//     username: "alex_admin",
//     password: "password",
//     role: "admin",
//     allowedModules: [
//       "reporting",
//       "data_entry",
//       "dispatcher",
//       "driver_manager",
//       "customs",
//       "safety",
//       "invoicing",
//       "customer",
//       "driver",
//     ],
//     createdAt: "2026-02-15",
//   },
//   {
//     id: "USR003",
//     name: "Keith Donnelly",
//     username: "keith_disp",
//     password: "password",
//     role: "dispatcher",
//     allowedModules: ["dispatcher"],
//     createdAt: "2026-04-05",
//   },
//   {
//     id: "USR004",
//     name: "Sarah Jenkins",
//     username: "sarah_dm",
//     password: "password",
//     role: "driver_manager",
//     allowedModules: ["driver_manager"],
//     createdAt: "2026-03-12",
//   },
//   {
//     id: "USR005",
//     name: "Juan Carlos",
//     username: "juan_customs",
//     password: "password",
//     role: "customs",
//     allowedModules: ["customs"],
//     createdAt: "2026-05-18",
//   },
//   {
//     id: "USR006",
//     name: "Officer Dale",
//     username: "dale_safety",
//     password: "password",
//     role: "safety",
//     allowedModules: ["safety"],
//     createdAt: "2026-06-01",
//   },
//   {
//     id: "USR007",
//     name: "Emily Brown",
//     username: "emily_data",
//     password: "password",
//     role: "data_entry",
//     allowedModules: ["data_entry"],
//     createdAt: "2026-06-20",
//   },
//   {
//     id: "USR008",
//     name: "Michael Scott",
//     username: "michael_billing",
//     password: "password",
//     role: "invoicing",
//     allowedModules: ["invoicing"],
//     createdAt: "2026-07-02",
//   },
//   {
//     id: "USR009",
//     name: "Marcus Vance",
//     username: "marcus_drv",
//     password: "password",
//     role: "driver",
//     allowedModules: ["driver"],
//     createdAt: "2026-05-12",
//   },
//   {
//     id: "USR010",
//     name: "Midwest Assembly (Customer)",
//     username: "midwest_customer",
//     password: "password",
//     role: "customer",
//     allowedModules: ["customer"],
//     createdAt: "2026-07-10",
//   },
// ];
// function LogiSyncApp() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
//   const currentUser = useAuthStore((state) => state.currentUser);
//   const users = useAuthStore((state) => state.users);
//   const logoutAction = useAuthStore((state) => state.logout);
//   const setCurrentUser = (user) => useAuthStore.setState({ currentUser: user });
//   const setIsLoggedIn = (val) => useAuthStore.setState({ isLoggedIn: val });
//   const [currentRole, setCurrentRole] = useState("dispatcher");
//   const [systemTime, setSystemTime] = useState("");
//   React.useEffect(() => {
//     const updateTime = () => {
//       const now = /* @__PURE__ */ new Date();
//       setSystemTime(now.toLocaleTimeString("en-US", { hour12: false }));
//     };
//     updateTime();
//     const interval = setInterval(updateTime, 1e3);
//     return () => clearInterval(interval);
//   }, []);
//   const shipments = useShipmentStore((state) => state.shipments);
//   const trips = useTripStore((state) => state.trips);
//   const messages = useMessageStore((state) => state.messages);
//   const documents = useDocumentStore((state) => state.documents);
//   const invoices = useInvoiceStore((state) => state.invoices);
//   const safetyIncidents = useSafetyStore((state) => state.safetyIncidents);
//   const safetyScores = useSafetyStore((state) => state.safetyScores);
//   const hosLogs = useHOSStore((state) => state.hosLogs);
//   const fetchUsers = useAuthStore((state) => state.fetchUsers);
//   const fetchShipments = useShipmentStore((state) => state.fetchShipments);
//   const fetchTrips = useTripStore((state) => state.fetchTrips);
//   const fetchMessages = useMessageStore((state) => state.fetchMessages);
//   const fetchDocuments = useDocumentStore((state) => state.fetchDocuments);
//   const fetchInvoices = useInvoiceStore((state) => state.fetchInvoices);
//   const fetchSafetyIncidents = useSafetyStore(
//     (state) => state.fetchSafetyIncidents
//   );
//   const fetchSafetyScores = useSafetyStore((state) => state.fetchSafetyScores);
//   const fetchHOSLogs = useHOSStore((state) => state.fetchHOSLogs);
//   const fetchCustomers = useCustomerStore((state) => state.fetchCustomers);
//   const fetchDrivers = useDriverStore((state) => state.fetchDrivers);
//   const fetchTrucks = useAssetStore((state) => state.fetchTrucks);
//   const fetchTrailors = useAssetStore((state) => state.fetchTrailors);
//   const fetchLocations = useLocationStore((state) => state.fetchLocations);

//   React.useEffect(() => {
//     fetchShipments();
//     fetchTrips();
//     fetchMessages();
//     fetchDocuments();
//     fetchInvoices();
//     fetchSafetyIncidents();
//     fetchSafetyScores();
//     fetchHOSLogs();
//     fetchCustomers();
//     fetchDrivers();
//     fetchTrucks();
//     fetchTrailors();
//     fetchLocations();
//   }, []);
//   React.useEffect(() => {
//     if (!isLoggedIn) {
//       if (location.pathname !== "/login") {
//         navigate("/login");
//       }
//       return;
//     }
//     if (currentUser.role === "driver") {
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
//         currentUser.role === "super_admin" || currentUser.role === "admin";
//       const defaultRole = isSuperOrAdmin
//         ? "reporting"
//         : currentUser.allowedModules[0] || "customer";
//       setCurrentRole(defaultRole);
//       navigate("/" + defaultRole);
//     }
//   }, [location.pathname, isLoggedIn, currentUser, navigate, currentRole]);
//   const handleAddTrip = async (newTrip) => {
//     await useTripStore.getState().addTrip(newTrip);
//   };
//   const handleUpdateTrip = async (updated) => {
//     await useTripStore.getState().updateTrip(updated);
//   };
//   const handleRemoveTrip = async (tripId) => {
//     await useTripStore.getState().removeTrip(tripId);
//   };
//   const handleAddShipment = async (newShipment) => {
//     await useShipmentStore.getState().addShipment(newShipment);
//   };
//   const handleUpdateShipment = async (updated) => {
//     await useShipmentStore.getState().updateShipment(updated);
//   };
//   const handleUpdateShipmentStatus = async (
//     shipmentId,
//     status,
//     waypoints,
//     borderConnectStatus
//   ) => {
//     await useShipmentStore
//       .getState()
//       .updateShipmentStatus(shipmentId, status, waypoints, borderConnectStatus);
//   };
//   const handleSendMessage = async (
//     content,
//     recipientId,
//     shipmentId,
//     attachment
//   ) => {
//     const isDispatcher = currentRole === "dispatcher";
//     const newMessage = {
//       id: "MSG" + (messages.length + 101),
//       senderRole: currentRole,
//       senderName: isDispatcher ? "Chief Dispatcher Keith" : "Marcus Vance",
//       recipientId: isDispatcher ? recipientId : "DISP_OFFICE",
//       recipientName: isDispatcher ? "Marcus Vance" : "Chief Dispatcher Keith",
//       content,
//       timestamp: /* @__PURE__ */ new Date().toISOString(),
//       read: false,
//       shipmentId,
//       attachment,
//     };
//     await useMessageStore.getState().sendMessage(newMessage);
//   };
//   const handleMarkMessagesAsRead = React.useCallback(
//     async (shipmentId, role) => {
//       await useMessageStore.getState().markAsRead(shipmentId, role);
//     },
//     []
//   );
//   const handleResolveIncident = async (incidentId) => {
//     const inc = safetyIncidents.find((i) => i.id === incidentId);
//     if (inc) {
//       const updatedInc = { ...inc, status: "resolved" };
//       await useSafetyStore.getState().updateSafetyIncident(updatedInc);
//       const score = safetyScores.find((s) => s.driverId === inc.driverId);
//       if (score) {
//         const updatedScore = {
//           ...score,
//           score: Math.min(100, score.score + 5),
//           totalViolations: Math.max(0, score.totalViolations - 1),
//         };
//         await useSafetyStore
//           .getState()
//           .updateSafetyScore(inc.driverId, updatedScore);
//       }
//     }
//   };
//   const handleCreateSafetyIncident = async (incident) => {
//     await useSafetyStore.getState().addSafetyIncident(incident);
//   };
//   const handleAddDocument = async (newDoc) => {
//     await useDocumentStore.getState().addDocument(newDoc);
//     if (newDoc.status === "approved") {
//       const ship = shipments.find((s) => s.id === newDoc.shipmentId);
//       if (ship && !ship.documentIds.includes(newDoc.id)) {
//         const updatedShip = {
//           ...ship,
//           documentIds: [...ship.documentIds, newDoc.id],
//         };
//         await useShipmentStore.getState().updateShipment(updatedShip);
//       }
//     }
//   };
//   const handleUpdateDocument = async (updatedDoc) => {
//     await useDocumentStore.getState().updateDocument(updatedDoc);
//   };
//   const handleVerifyDocument = async (docId, status) => {
//     const doc = documents.find((d) => d.id === docId);
//     if (doc) {
//       const updatedDoc = { ...doc, status };
//       await useDocumentStore.getState().updateDocument(updatedDoc);
//       if (status === "approved") {
//         const ship = shipments.find((s) => s.id === doc.shipmentId);
//         if (ship && !ship.documentIds.includes(docId)) {
//           const updatedShip = {
//             ...ship,
//             documentIds: [...ship.documentIds, docId],
//           };
//           await useShipmentStore.getState().updateShipment(updatedShip);
//         }
//       }
//     }
//   };
//   const handleAddInvoice = async (newInvoice) => {
//     await useInvoiceStore.getState().addInvoice(newInvoice);
//     const doc = documents.find((d) => d.shipmentId === newInvoice.shipmentId);
//     if (doc) {
//       const updatedDoc = { ...doc, status: "matched_to_invoice" };
//       await useDocumentStore.getState().updateDocument(updatedDoc);
//     }
//   };
//   const handleUpdateInvoiceStatus = async (id, status) => {
//     const inv = invoices.find((i) => i.id === id);
//     if (inv) {
//       await useInvoiceStore.getState().updateInvoice({ ...inv, status });
//     }
//   };
//   const handleUpdateInvoice = async (updated) => {
//     await useInvoiceStore.getState().updateInvoice(updated);
//   };
//   const handleUpdateHOSLog = async (updatedLog) => {
//     await useHOSStore.getState().updateHOSLog(updatedLog.driverId, updatedLog);
//   };
//   const handleDeleteUser = async (id) => {
//     await useAuthStore.getState().deleteUser(id);
//     if (currentUser && currentUser.id === id) {
//       const fallback = users.find((u) => u.id !== id) || INITIAL_USERS[0];
//       useAuthStore.setState({ currentUser: fallback });
//       const isSuperOrAdmin =
//         fallback.role === "super_admin" || fallback.role === "admin";
//       const target = isSuperOrAdmin
//         ? "reporting"
//         : fallback.allowedModules[0] || "customer";
//       setCurrentRole(target);
//       navigate("/" + target);
//     }
//   };
//   const unreadCount = messages.filter(
//     (m) =>
//       !m.read &&
//       m.recipientId === (currentRole === "driver" ? "DRV001" : "DISP_OFFICE")
//   ).length;
//   if (!isLoggedIn) {
//     return (
//       <Routes>
//         <Route
//           path="/login"
//           element={
//             <LoginPage
//             // users={users}
//             // onLoginSuccess={(u) => {
//             //   setCurrentUser(u);
//             //   setIsLoggedIn(true);
//             //   const isSuperOrAdmin = u.role === "super_admin" || u.role === "admin";
//             //   const target = isSuperOrAdmin ? "reporting" : u.allowedModules[0] || "customer";
//             //   setCurrentRole(target);
//             //   navigate("/" + target);
//             // }}
//             />
//           }
//         />
//         <Route path="*" element={<Navigate to="/login" replace />} />
//       </Routes>
//     );
//   }
//   if (currentUser && currentUser.role === "driver") {
//     return (
//       <Routes>
//         <Route
//           path="/driver"
//           element={
//             <DriverPage
//               shipments={shipments}
//               messages={messages}
//               documents={documents}
//               hosLogs={hosLogs}
//               onAddDocument={handleAddDocument}
//               onUpdateDocument={handleUpdateDocument}
//               onSendMessage={handleSendMessage}
//               onUpdateHOSLog={handleUpdateHOSLog}
//               onUpdateShipmentStatus={handleUpdateShipmentStatus}
//               onMarkMessagesAsRead={handleMarkMessagesAsRead}
//               onAddSafetyIncident={handleCreateSafetyIncident}
//               onUpdateShipment={handleUpdateShipment}
//               currentUser={currentUser}
//               onLogout={() => {
//                 setIsLoggedIn(false);
//                 navigate("/login");
//               }}
//             />
//           }
//         />
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
//         activeShipmentsCount={
//           shipments.filter(
//             (s) => s.status !== "delivered" && s.status !== "pending"
//           ).length
//         }
//         unreadMessagesCount={unreadCount}
//         currentUser={currentUser}
//         onLogout={() => {
//           setIsLoggedIn(false);
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
//                 value={currentUser.id}
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
//             <Route
//               path="/dispatcher"
//               element={
//                 <DispatcherPage
//                   shipments={shipments}
//                   trips={trips}
//                   onAddTrip={handleAddTrip}
//                   onUpdateTrip={handleUpdateTrip}
//                   onRemoveTrip={handleRemoveTrip}
//                   messages={messages}
//                   onAddShipment={handleAddShipment}
//                   onUpdateShipment={handleUpdateShipment}
//                   onSendMessage={handleSendMessage}
//                   onMarkMessagesAsRead={handleMarkMessagesAsRead}
//                   currentUser={currentUser}
//                 />
//               }
//             />
//             {/* Map data_entry and customs directly to DispatcherPage since they use same component view */}
//             <Route
//               path="/data_entry"
//               element={
//                 <DispatcherPage
//                   shipments={shipments}
//                   trips={trips}
//                   onAddTrip={handleAddTrip}
//                   onUpdateTrip={handleUpdateTrip}
//                   onRemoveTrip={handleRemoveTrip}
//                   messages={messages}
//                   onAddShipment={handleAddShipment}
//                   onUpdateShipment={handleUpdateShipment}
//                   onSendMessage={handleSendMessage}
//                   onMarkMessagesAsRead={handleMarkMessagesAsRead}
//                   currentUser={currentUser}
//                 />
//               }
//             />
//             <Route
//               path="/customs"
//               element={
//                 <DispatcherPage
//                   shipments={shipments}
//                   trips={trips}
//                   onAddTrip={handleAddTrip}
//                   onUpdateTrip={handleUpdateTrip}
//                   onRemoveTrip={handleRemoveTrip}
//                   messages={messages}
//                   onAddShipment={handleAddShipment}
//                   onUpdateShipment={handleUpdateShipment}
//                   onSendMessage={handleSendMessage}
//                   onMarkMessagesAsRead={handleMarkMessagesAsRead}
//                   currentUser={currentUser}
//                 />
//               }
//             />

//             <Route
//               path="/driver_manager"
//               element={
//                 <DriverManagerPage
//                   shipments={shipments}
//                   messages={messages}
//                   hosLogs={hosLogs}
//                   safetyScores={safetyScores}
//                   onSendMessage={handleSendMessage}
//                   onMarkMessagesAsRead={handleMarkMessagesAsRead}
//                   currentRole={currentRole}
//                   currentUser={currentUser}
//                 />
//               }
//             />

//             <Route
//               path="/driver"
//               element={
//                 <DriverPage
//                   shipments={shipments}
//                   messages={messages}
//                   documents={documents}
//                   hosLogs={hosLogs}
//                   onAddDocument={handleAddDocument}
//                   onUpdateDocument={handleUpdateDocument}
//                   onSendMessage={handleSendMessage}
//                   onUpdateHOSLog={handleUpdateHOSLog}
//                   onUpdateShipmentStatus={handleUpdateShipmentStatus}
//                   onMarkMessagesAsRead={handleMarkMessagesAsRead}
//                   onAddSafetyIncident={handleCreateSafetyIncident}
//                   onUpdateShipment={handleUpdateShipment}
//                   currentUser={currentUser}
//                   onLogout={() => {
//                     setIsLoggedIn(false);
//                     navigate("/login");
//                   }}
//                 />
//               }
//             />

//             <Route
//               path="/safety"
//               element={
//                 <SafetyPage
//                   incidents={safetyIncidents}
//                   scores={safetyScores}
//                   hosLogs={hosLogs}
//                   onResolveIncident={handleResolveIncident}
//                 />
//               }
//             />

//             <Route
//               path="/invoicing"
//               element={
//                 <InvoicingPage
//                   invoices={invoices}
//                   shipments={shipments}
//                   documents={documents}
//                   onAddInvoice={handleAddInvoice}
//                   onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
//                   onUpdateInvoice={handleUpdateInvoice}
//                   onVerifyDocument={handleVerifyDocument}
//                 />
//               }
//             />

//             <Route
//               path="/customer"
//               element={<CustomerPage shipments={shipments} />}
//             />

//             <Route
//               path="/hr"
//               element={
//                 <HRPage
//                   users={users}
//                   currentUser={currentUser}
//                   onAddUser={
//                     async (u) => {
//                     await useAuthStore.getState().addUser(u);
//                   }}
//                   onDeleteUser={handleDeleteUser}
//                 />
//               }
//             />

//             <Route
//               path="/reporting"
//               element={
//                 <ReportingPage
//                   shipments={shipments}
//                   invoices={invoices}
//                   currentUser={currentUser}
//                 />
//               }
//             />

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
//   return <LogiSyncApp />;
// }

import React, { useState } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Navigation from "./components/Navigation";
import { useAuthStore } from "./store/useAuthStore";
import { useShipmentStore } from "./store/useShipmentStore";
import { useTripStore } from "./store/useTripStore";
import { useMessageStore } from "./store/useMessageStore";
import { useDocumentStore } from "./store/useDocumentStore";
import { useInvoiceStore } from "./store/useInvoiceStore";
import { useSafetyStore } from "./store/useSafetyStore";
import { useHOSStore } from "./store/useHOSStore";
import { useCustomerStore } from "./store/useCustomerStore";
import { useAssetStore } from "./store/useAssetStore";
import { useLocationStore } from "./store/useLocationStore";

import LoginPage from "./pages/LoginPage";
import DispatcherPage from "./pages/DispatcherPage";
import DriverManagerPage from "./pages/DriverManagerPage";
import DriverPage from "./pages/DriverPage";
import SafetyPage from "./pages/SafetyPage";
import InvoicingPage from "./pages/InvoicingPage";
import CustomerPage from "./pages/CustomerPage";
import HRPage from "./pages/HRPage";
import { useDriverStore } from "./store/useDriverstore";
import ReportingPage from "./pages/REportingPage";
import { Toaster } from "react-hot-toast";

function LogiSyncApp() {
  const location = useLocation();
  const navigate = useNavigate();

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const currentUser = useAuthStore((state) => state.currentUser);
  const users = useAuthStore((state) => state.users);
  const logoutAction = useAuthStore((state) => state.logout);
  const setCurrentUser = (user) => useAuthStore.setState({ currentUser: user });

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

  // Fetch all initial data to bootstrap state
  const fetchUsers = useAuthStore((state) => state.fetchUsers);
  const fetchShipments = useShipmentStore((state) => state.fetchShipments);
  const fetchTrips = useTripStore((state) => state.fetchTrips);
  const fetchMessages = useMessageStore((state) => state.fetchMessages);
  const fetchDocuments = useDocumentStore((state) => state.fetchDocuments);
  const fetchInvoices = useInvoiceStore((state) => state.fetchInvoices);
  const fetchSafetyIncidents = useSafetyStore(
    (state) => state.fetchSafetyIncidents
  );
  const fetchSafetyScores = useSafetyStore((state) => state.fetchSafetyScores);
  const fetchHOSLogs = useHOSStore((state) => state.fetchHOSLogs);
  const fetchCustomers = useCustomerStore((state) => state.fetchCustomers);
  const fetchDrivers = useDriverStore((state) => state.fetchDrivers);
  const fetchTrucks = useAssetStore((state) => state.fetchTrucks);
  const fetchTrailors = useAssetStore((state) => state.fetchTrailors);
  const fetchLocations = useLocationStore((state) => state.fetchLocations);

  React.useEffect(() => {
    fetchUsers();
    fetchShipments();
    fetchTrips();
    fetchMessages();
    fetchDocuments();
    fetchInvoices();
    fetchSafetyIncidents();
    fetchSafetyScores();
    fetchHOSLogs();
    fetchCustomers();
    fetchDrivers();
    fetchTrucks();
    fetchTrailors();
    fetchLocations();
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

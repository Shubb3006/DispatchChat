// import { useState } from "react";
// import {
//   Users,
//   UserPlus,
//   Trash2,
//   Check,
//   Lock,
//   UserCheck,
//   AlertCircle,
// } from "lucide-react";
// import { useAuthStore } from "../stores/useAuthStore";
// const AVAILABLE_MODULES = [
//   {
//     id: "dispatcher",
//     label: "Dispatch Console",
//     description: "Access to dispatch shipments & route sequences",
//   },
//   {
//     id: "driver",
//     label: "Driver Terminal",
//     description:
//       "Access to logs, routing stop statuses, and document scan uploads",
//   },
//   {
//     id: "safety",
//     label: "Safety Compliance",
//     description: "Access to safety incidents & Samsara HOS driver log reviews",
//   },
//   {
//     id: "invoicing",
//     label: "Billing & LTL",
//     description: "Access to invoice creation & freight rate calculators",
//   },
//   {
//     id: "customer",
//     label: "Customer Portal",
//     description: "Access to shipment searches and client-facing status updates",
//   },
// ];
// export default function HRDashboard({
//   users,
//   currentUser,

//   onDeleteUser,
// }) {
//   const addUser = useAuthStore((state) => state.addUser);
//   const isLoading = useAuthStore((state) => state.isLoading);
//   const [name, setName] = useState("");
//   const [username, setUsername] = useState("");
//   const [role, setRole] = useState("driver");
//   const [selectedModules, setSelectedModules] = useState(["driver"]);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const handleRoleChange = (newRole) => {
//     setRole(newRole);
//     if (newRole === "driver") {
//       setSelectedModules(["driver"]);
//     } else if (newRole === "dispatcher") {
//       setSelectedModules(["dispatcher"]);
//     } else if (newRole === "driver_manager") {
//       setSelectedModules(["dispatcher"]);
//     } else if (newRole === "customs") {
//       setSelectedModules(["dispatcher"]);
//     } else if (newRole === "data_entry") {
//       setSelectedModules(["dispatcher"]);
//     } else if (newRole === "safety") {
//       setSelectedModules(["safety"]);
//     } else if (newRole === "invoicing") {
//       setSelectedModules(["invoicing"]);
//     } else if (newRole === "admin" || newRole === "super_admin") {
//       setSelectedModules([
//         "dispatcher",
//         "driver",
//         "safety",
//         "invoicing",
//         "customer",
//       ]);
//     }
//   };
//   const handleToggleModule = (modId) => {
//     if (role === "admin" || role === "super_admin") return;
//     setSelectedModules((prev) => {
//       if (prev.includes(modId)) {
//         return prev.filter((m) => m !== modId);
//       } else {
//         return [...prev, modId];
//       }
//     });
//   };
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");
//     if (!name.trim()) {
//       setError("Please enter a full name.");
//       return;
//     }
//     if (!username.trim()) {
//       setError("Please enter a unique username.");
//       return;
//     }
//     const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, "_");
//     const usernameExists = users.some((u) => u.username === cleanUsername);
//     if (usernameExists) {
//       setError(`Username "@${cleanUsername}" is already taken.`);
//       return;
//     }
//     const newUser = {
//       name: name.trim(),
//       username: cleanUsername,
//       role,
//       allowedModules:
//         role === "admin" || role === "super_admin"
//           ? ["dispatcher", "driver", "safety", "invoicing", "customer"]
//           : selectedModules,
//     };
//     const success = await addUser(newUser);
//     if (success) {
//       setSuccess(
//         `User "${
//           newUser.name
//         }" was successfully registered as ${role.toUpperCase()}!`
//       );

//       setName("");
//       setUsername("");
//       setRole("driver");
//       setSelectedModules(["driver"]);
//     }
//   };

//   return (
//     <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:h-full lg:overflow-hidden">
//       {/* Left and Middle Column: Directory List */}
//       <div className="lg:col-span-2 flex flex-col bg-base-100 rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full">
//         <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-base-200/50">
//           <div className="flex items-center space-x-2">
//             <Users className="h-5 w-5 text-slate-600" />
//             <div>
//               <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
//                 Active Team Directory
//               </h2>
//               <p className="text-[10px] text-base-content">
//                 Corporate users, credentials, and functional access permissions
//               </p>
//             </div>
//           </div>
//           <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-slate-200/60 text-slate-700 rounded-full">
//             Total Accounts: {users.length}
//           </span>
//         </div>

//         <div className="flex-1 overflow-auto divide-y divide-slate-100">
//           {users.map((user) => {
//             const isSelf = user.id === currentUser.id;
//             const isProtected =
//               user.role === "super_admin" && currentUser.role !== "super_admin";
//             return (
//               <div
//                 key={user.id}
//                 className="p-4 flex items-start justify-between hover:bg-base-200/40 transition-colors"
//               >
//                 <div className="space-y-1.5 min-w-0">
//                   <div className="flex items-center gap-2">
//                     <span className="font-bold text-xs text-slate-800">
//                       {user.name}
//                     </span>
//                     <span className="text-[10px] font-mono text-slate-400">
//                       @{user.username}
//                     </span>
//                     {isSelf && (
//                       <span className="px-1.5 py-0.5 text-[8px] bg-indigo-50 text-indigo-600 border border-indigo-100 rounded font-bold uppercase tracking-wider">
//                         You
//                       </span>
//                     )}
//                   </div>

//                   {/* Role Badge */}
//                   <div className="flex flex-wrap items-center gap-1.5">
//                     <span
//                       className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded-sm border ${
//                         user.role === "super_admin"
//                           ? "bg-purple-50 text-purple-700 border-purple-100"
//                           : user.role === "admin"
//                           ? "bg-rose-50 text-rose-700 border-rose-100"
//                           : user.role === "dispatcher"
//                           ? "bg-blue-50 text-blue-700 border-blue-100"
//                           : user.role === "driver"
//                           ? "bg-emerald-50 text-emerald-700 border-emerald-100"
//                           : user.role === "driver_manager"
//                           ? "bg-cyan-50 text-cyan-700 border-cyan-100"
//                           : user.role === "customs"
//                           ? "bg-teal-50 text-teal-700 border-teal-100"
//                           : user.role === "safety"
//                           ? "bg-orange-50 text-orange-700 border-orange-100"
//                           : user.role === "data_entry"
//                           ? "bg-indigo-50 text-indigo-700 border-indigo-100"
//                           : user.role === "invoicing"
//                           ? "bg-green-50 text-green-700 border-green-100"
//                           : "bg-base-200 text-slate-700 border-slate-200"
//                       }`}
//                     >
//                       {user.role.replace("_", " ")}
//                     </span>

//                     <span className="text-[10px] text-slate-400 font-mono">
//                       • Created:{" "}
//                       {new Date(user.created_at).toLocaleDateString() ||
//                         new Date(Date.now()).toLocaleTimeString()}
//                     </span>
//                   </div>

//                   {/* Modules list */}
//                   <div className="flex flex-wrap items-center gap-1">
//                     <span className="text-[9px] font-bold text-slate-400 uppercase font-mono mr-1">
//                       Access:
//                     </span>
//                     {user.role === "admin" || user.role === "super_admin" ? (
//                       <span className="text-[9px] font-semibold text-base-content bg-slate-100 px-1.5 py-0.2 rounded font-mono">
//                         ✨ Unrestricted Master Access (All Modules & Reporting)
//                       </span>
//                     ) : (
//                       <>
//                         {user?.allowed_modules?.map((mod) => (
//                           <span
//                             key={mod}
//                             className="text-[9px] font-semibold text-indigo-600 bg-indigo-50/50 border border-indigo-100 px-1.5 py-0.2 rounded font-mono uppercase"
//                           >
//                             {mod}
//                           </span>
//                         ))}
//                         {user?.allowed_modules?.length === 0 && (
//                           <span className="text-[9px] font-bold text-slate-400 italic">
//                             No modules assigned
//                           </span>
//                         )}
//                       </>
//                     )}
//                   </div>
//                 </div>

//                 {/* Actions */}
//                 <div className="flex items-center gap-2">
//                   {isProtected ? (
//                     <span
//                       className="text-slate-400 p-1"
//                       title="Super Admin Account Protected"
//                     >
//                       <Lock className="h-3.5 w-3.5" />
//                     </span>
//                   ) : isSelf ? (
//                     <span className="text-[10px] font-mono text-slate-400 italic">
//                       Current Session
//                     </span>
//                   ) : (
//                     <button
//                       onClick={() => onDeleteUser(user.id)}
//                       className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
//                       title="Deactivate / Delete User Account"
//                     >
//                       <Trash2 className="h-4 w-4" />
//                     </button>
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* Right Column: Register Account Form */}
//       <div className="flex flex-col bg-base-100 rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full">
//         <div className="p-4 border-b border-slate-100 flex items-center space-x-2 bg-base-200/50">
//           <UserPlus className="h-5 w-5 text-indigo-600" />
//           <div>
//             <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
//               Register Team Account
//             </h2>
//             <p className="text-[10px] text-base-content">
//               Create login and assign role capabilities
//             </p>
//           </div>
//         </div>

//         <form
//           onSubmit={handleSubmit}
//           className="p-4 flex-1 overflow-auto space-y-4"
//         >
//           {error && (
//             <div className="p-2.5 bg-red-50 border border-red-100 text-red-700 rounded-lg text-[11px] flex items-start space-x-1.5">
//               <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
//               <span>{error}</span>
//             </div>
//           )}

//           {success && (
//             <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-[11px] flex items-start space-x-1.5">
//               <UserCheck className="h-3.5 w-3.5 shrink-0 mt-0.5" />
//               <span>{success}</span>
//             </div>
//           )}

//           {/* Full Name */}
//           <div className="space-y-1">
//             <label className="text-[10px] font-bold text-base-content uppercase tracking-wider block">
//               Full Name
//             </label>
//             <input
//               type="text"
//               required
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               placeholder="e.g. Marcus Vance"
//               className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
//             />
//           </div>

//           {/* Username */}
//           <div className="space-y-1">
//             <label className="text-[10px] font-bold text-base-content uppercase tracking-wider block">
//               Username
//             </label>
//             <div className="relative">
//               <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
//                 @
//               </span>
//               <input
//                 type="text"
//                 required
//                 value={username}
//                 onChange={(e) => setUsername(e.target.value)}
//                 placeholder="marcus_driver"
//                 className="w-full text-xs border border-slate-200 rounded-lg pl-6 pr-2 py-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
//               />
//             </div>
//           </div>

//           {/* Base Role Selector */}
//           <div className="space-y-1">
//             <label className="text-[10px] font-bold text-base-content uppercase tracking-wider block">
//               Main Corporate Role
//             </label>
//             <select
//               value={role}
//               onChange={(e) => handleRoleChange(e.target.value)}
//               className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-base-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer font-bold"
//             >
//               <option value="driver">Driver</option>
//               <option value="dispatcher">Dispatcher</option>
//               <option value="driver_manager">Driver Manager</option>
//               <option value="customs">Customs Specialist</option>
//               <option value="safety">Safety Officer</option>
//               <option value="data_entry">Data Entry Clerk</option>
//               <option value="invoicing">Billing & Invoicing</option>
//               <option value="admin">Administrator</option>
//               <option value="super_admin">Super Administrator</option>
//             </select>
//           </div>

//           {/* Module Capabilities Checklist */}
//           <div className="space-y-2">
//             <div className="flex items-center justify-between">
//               <label className="text-[10px] font-bold text-base-content uppercase tracking-wider block">
//                 Functional Capabilities
//               </label>
//               {(role === "admin" || role === "super_admin") && (
//                 <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.2 rounded font-mono uppercase">
//                   Locked (Full Access)
//                 </span>
//               )}
//             </div>

//             <p className="text-[9px] text-slate-400 italic">
//               Note: Reporting / Analytics module is restricted and only
//               available to Administrators.
//             </p>

//             <div className="space-y-1.5">
//               {AVAILABLE_MODULES.map((mod) => {
//                 const isSelected =
//                   role === "admin" ||
//                   role === "super_admin" ||
//                   selectedModules.includes(mod.id);
//                 const isDisabled = role === "admin" || role === "super_admin";
//                 return (
//                   <button
//                     key={mod.id}
//                     type="button"
//                     disabled={isDisabled}
//                     onClick={() => handleToggleModule(mod.id)}
//                     className={`w-full flex items-start text-left p-2 rounded-lg border text-xs transition-colors ${
//                       isSelected
//                         ? "bg-indigo-50/40 border-indigo-200 text-slate-800"
//                         : "bg-base-200/50 border-slate-100 text-base-content"
//                     } ${
//                       isDisabled
//                         ? "opacity-85"
//                         : "cursor-pointer hover:border-indigo-300"
//                     }`}
//                   >
//                     <div className="pt-0.5 mr-2">
//                       <div
//                         className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
//                           isSelected
//                             ? "bg-indigo-600 border-indigo-600 text-white"
//                             : "border-slate-300 bg-base-100"
//                         }`}
//                       >
//                         {isSelected && (
//                           <Check className="h-2.5 w-2.5 stroke-[3]" />
//                         )}
//                       </div>
//                     </div>
//                     <div>
//                       <div className="font-bold text-[11px] font-sans uppercase tracking-tight">
//                         {mod.label}
//                       </div>
//                       <div className="text-[9px] text-slate-400 font-sans leading-tight mt-0.5">
//                         {mod.description}
//                       </div>
//                     </div>
//                   </button>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Submit Button */}
//           <button
//             type="submit"
//             disabled={isLoading}
//             className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-4 rounded-lg cursor-pointer transition-colors shadow-sm flex items-center justify-center space-x-1.5 disabled:opacity-50"
//           >
//             {isLoading ? (
//               <span>Adding User.....</span>
//             ) : (
//               <>
//                 <UserPlus className="h-4 w-4" />
//                 <span>Create & Register User</span>
//               </>
//             )}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

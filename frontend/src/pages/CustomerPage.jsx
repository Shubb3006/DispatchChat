// import { useState, useEffect, useMemo } from "react";
// import { useShipmentStore } from "../stores/useShipmentStore";
// import {
//   Globe,
//   Search,
//   MapPin,
//   Truck,
//   AlertTriangle,
//   Sparkles,
//   Mail,
//   Compass,
//   RefreshCw,
//   Bell,
//   ShieldCheck,
//   Clock,
//   Check,
//   HelpCircle,
//   Activity,
// } from "lucide-react";

// export default function CustomerPage() {
//   const shipments = useShipmentStore((state) => state.shipments);
//   const fetchShipments = useShipmentStore((state) => state.fetchShipments);

//   // Fetch shipments on load
//   useEffect(() => {
//     fetchShipments();
//   }, [fetchShipments]);

//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchedShipment, setSearchedShipment] = useState(null);

//   // Automatically select matching shipment when list loads

//   const [aiLoading, setAiLoading] = useState(false);
//   const [aiError, setAiError] = useState(null);
//   const [aiReport, setAiReport] = useState(null);
//   const [isAutoPolling, setIsAutoPolling] = useState(true);
//   const [secondsLeft, setSecondsLeft] = useState(12);
//   const [simulatedLat, setSimulatedLat] = useState(42.3314);
//   const [simulatedLng, setSimulatedLng] = useState(-83.0458);
//   const [simulatedSpeed, setSimulatedSpeed] = useState(62);
//   const [pollingLogs, setPollingLogs] = useState([]);
//   const [emailSub, setEmailSub] = useState("");
//   const [phoneSub, setPhoneSub] = useState("");
//   const [subSuccess, setSubSuccess] = useState(false);
//   const [subMessage, setSubMessage] = useState("");
//   const [activeFaq, setActiveFaq] = useState(null);
//   const [simulatedRemainingDistance, setSimulatedRemainingDistance] =
//     useState(145);

//   console.log(searchedShipment);

//   useEffect(() => {
//     if (searchedShipment) {
//       const isDelivered = searchedShipment.status === "delivered";
//       const isArrived = searchedShipment.status === "arrived";
//       let initialDist = 0;
//       if (isDelivered || isArrived) {
//         initialDist = 0;
//       } else if (
//         searchedShipment.status === "pending" ||
//         searchedShipment.status === "dispatched"
//       ) {
//         initialDist = searchedShipment.totalDistanceMiles || 320;
//       } else {
//         initialDist = Math.max(
//           10,
//           Math.round((searchedShipment.totalDistanceMiles || 320) * 0.45)
//         );
//       }
//       setSimulatedRemainingDistance(initialDist);
//       setSimulatedLat(41.8781 + (Math.random() - 0.5) * 0.5);
//       setSimulatedLng(-84.6298 + (Math.random() - 0.5) * 0.5);
//       setSimulatedSpeed(
//         isDelivered || isArrived ? 0 : 58 + Math.floor(Math.random() * 10)
//       );
//       const timestamp = new Date().toLocaleTimeString();
//       setPollingLogs([
//         `[${timestamp}] Telemetry stream initiated for Load #${searchedShipment.load_number}.`,
//         `[${timestamp}] Route validation: ${searchedShipment.customer_billing_address} to ${searchedShipment.destination}.`,
//         `[${timestamp}] Cabin sensor calibration complete. Environment set to cargo-safe.`,
//         `[${timestamp}] Load starting distance: ${initialDist} miles remaining.`,
//       ]);
//       setAiReport(null);
//     }
//   }, [searchedShipment]);

//   const calculateDynamicEta = () => {
//     if (!searchedShipment) return null;
//     const isDelivered = searchedShipment.status === "delivered";
//     const isArrived = searchedShipment.status === "arrived";
//     if (isDelivered) {
//       return {
//         etaString: "Delivered",
//         hours: 0,
//         minutes: 0,
//         milesLeft: 0,
//         speedMph: 0,
//         durationText: "Fully Delivered",
//         message: "Load has arrived and cargo has been fully delivered.",
//       };
//     }
//     if (isArrived) {
//       return {
//         etaString: "Arrived at Receiver",
//         hours: 0,
//         minutes: 0,
//         milesLeft: 0,
//         speedMph: 0,
//         durationText: "Arrived at Dock",
//         message: "Vehicle has arrived at the receiving facility dock.",
//       };
//     }
//     const currentSpeed = simulatedSpeed || searchedShipment.speedMph || 60;
//     const remainingMiles =
//       simulatedRemainingDistance > 0 ? simulatedRemainingDistance : 1;
//     const totalHours = remainingMiles / currentSpeed;
//     const hours = Math.floor(totalHours);
//     const minutes = Math.round((totalHours - hours) * 60);
//     const etaDate = new Date();
//     etaDate.setMinutes(etaDate.getMinutes() + Math.round(totalHours * 60));
//     const timeFormatter = new Intl.DateTimeFormat("en-US", {
//       month: "short",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//       hour12: true,
//     });
//     const formattedEta = timeFormatter.format(etaDate);
//     let durationText = "";
//     if (hours > 0) {
//       durationText += `${hours}h `;
//     }
//     durationText += `${minutes}m remaining`;
//     return {
//       etaString: formattedEta,
//       hours,
//       minutes,
//       durationText,
//       milesLeft: remainingMiles,
//       speedMph: currentSpeed,
//       message: `En route: ${remainingMiles} miles remaining at ${currentSpeed} MPH`,
//     };
//   };

//   const handleTrackSubmit = (e) => {
//     e.preventDefault();
//     if (!searchQuery.trim()) return;
//     const found = shipments.find(
//       (s) =>
//         s?.load_number?.trim().toLowerCase() ===
//           searchQuery.trim().toLowerCase() ||
//         (s.poNumber &&
//           s.poNumber.trim().toLowerCase() ===
//             searchQuery.trim().toLowerCase()) ||
//         (s.bolNumber &&
//           s.bolNumber.trim().toLowerCase() === searchQuery.trim().toLowerCase())
//     );
//     setSearchedShipment(found);
//     setAiReport(null);
//   };

//   useEffect(() => {
//     if (!isAutoPolling || !searchedShipment) return;
//     const interval = setInterval(() => {
//       setSecondsLeft((prev) => {
//         if (prev <= 1) {
//           const timestamp = new Date().toLocaleTimeString();
//           const isDelivered = searchedShipment.status === "delivered";
//           const isArrived = searchedShipment.status === "arrived";
//           if (!isDelivered && !isArrived) {
//             setSimulatedLat((lat) => lat + (Math.random() - 0.4) * 0.002);
//             setSimulatedLng((lng) => lng + (Math.random() - 0.6) * 0.002);
//             setSimulatedSpeed((speed) =>
//               Math.max(
//                 50,
//                 Math.min(70, speed + Math.round((Math.random() - 0.5) * 4))
//               )
//             );
//             setSimulatedRemainingDistance((dist) =>
//               Math.max(
//                 1,
//                 Number(Math.max(0, dist - 0.2 - Math.random() * 0.3).toFixed(1))
//               )
//             );
//           } else {
//             setSimulatedSpeed(0);
//             setSimulatedRemainingDistance(0);
//           }
//           const logTemplates = [
//             `[${timestamp}] ELD Heartbeat: Ping received from truck unit ${
//               searchedShipment.truckNumber || "TRK-102"
//             }.`,
//             `[${timestamp}] GPS telemetry verified: Lat ${simulatedLat.toFixed(
//               5
//             )}, Lng ${simulatedLng.toFixed(5)}.`,
//             `[${timestamp}] Carrier temperature sensors confirm payload environment is secure (36.4°F).`,
//             `[${timestamp}] Border Connect Link: Customs clearance manifest verified (${searchedShipment.borderConnectStatus?.toUpperCase()}).`,
//             `[${timestamp}] Samsara Diagnostics: Engine coolant safe, speed set at ${simulatedSpeed} MPH.`,
//             `[${timestamp}] Transit Update: GPS tracking shows route progression.`,
//           ];
//           const randomLog =
//             logTemplates[Math.floor(Math.random() * logTemplates.length)];
//           setPollingLogs((prevLogs) => [randomLog, ...prevLogs.slice(0, 6)]);
//           return 12;
//         }
//         return prev - 1;
//       });
//     }, 1000);
//     return () => clearInterval(interval);
//   }, [
//     isAutoPolling,
//     searchedShipment,
//     simulatedLat,
//     simulatedLng,
//     simulatedSpeed,
//   ]);

//   const handleAlertSubscribe = (e) => {
//     e.preventDefault();
//     if (!emailSub && !phoneSub) {
//       alert(
//         "Please provide either an email or mobile phone number to register for automated pings."
//       );
//       return;
//     }
//     setSubSuccess(true);
//     setSubMessage(
//       `Successfully registered! Milestones for Load #${
//         searchedShipment?.load_number
//       } will automatically push to ${emailSub || phoneSub}.`
//     );
//     setTimeout(() => {
//       setSubSuccess(false);
//       setEmailSub("");
//       setPhoneSub("");
//     }, 6000);
//   };

//   const handleGenerateAiReport = async () => {
//     if (!searchedShipment) return;
//     setAiLoading(true);
//     setAiError(null);
//     setAiReport(null);
//     try {
//       const response = await fetch("/api/gemini/customer-update", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           load_number: searchedShipment.load_number,
//           customerName: searchedShipment.customerName,
//           origin: searchedShipment.originCity,
//           destination: searchedShipment.destinationCity,
//           currentStatus: searchedShipment.status,
//           speedMph: simulatedSpeed,
//           eta: searchedShipment.eta,
//           borderStatus: searchedShipment.borderConnectStatus,
//           cargoDescription: searchedShipment.cargoDescription,
//         }),
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(
//           errorData.details || errorData.error || "Connection failed."
//         );
//       }
//       const data = await response.json();
//       setAiReport(data);
//     } catch (err) {
//       setAiError(
//         err.message ||
//           "Verification failed. Please check your system settings or GEMINI_API_KEY environment variable."
//       );
//     } finally {
//       setAiLoading(false);
//     }
//   };

//   const isOutboundShipment = (shipment) => {
//     const isCrossBorderStatus =
//       shipment.borderConnectStatus && shipment.borderConnectStatus !== "none";
//     const hasBorderCrossingWaypoint =
//       shipment.waypoints &&
//       shipment.waypoints.some((w) => w.stopType === "border_crossing");
//     return !!(isCrossBorderStatus || hasBorderCrossingWaypoint);
//   };

//   const getTrackingSteps = (shipment) => {
//     const isOutbound = isOutboundShipment(shipment);
//     const status = shipment.status;
//     const step1Completed = status !== "pending";
//     const step1Active = status === "pending";
//     const step2Completed = status === "delivered" || status === "arrived";
//     const step2Active =
//       !step2Completed &&
//       ["in_transit", "dispatched", "delayed"].includes(status);
//     if (isOutbound) {
//       const step3Completed =
//         shipment.borderConnectStatus === "released" ||
//         ["delivered", "arrived"].includes(status);
//       const step3Active =
//         !step3Completed &&
//         ["at_border", "submitted", "accepted"].includes(
//           shipment.borderConnectStatus
//         );
//       const step4Completed =
//         shipment.borderConnectStatus === "released" ||
//         ["delivered", "arrived"].includes(status);
//       const step4Active =
//         !step4Completed && shipment.borderConnectStatus === "released";
//       const step5Completed = status === "delivered";
//       const step5Active = status === "arrived";
//       return [
//         {
//           title: "Load Picked up at Warehouse",
//           description: step1Completed
//             ? "Departed carrier terminal. Cargo secured."
//             : "Awaiting dispatch and dock release loading.",
//           key: "picked",
//           status: step1Completed
//             ? "completed"
//             : step1Active
//             ? "active"
//             : "pending",
//         },
//         {
//           title: "Out for Delivery",
//           description: step2Completed
//             ? "Transit corridor finished."
//             : step2Active
//             ? `Currently en route under active transit.`
//             : "Awaiting route start.",
//           key: "out",
//           status: step2Completed
//             ? "completed"
//             : step2Active
//             ? "active"
//             : "pending",
//         },
//         {
//           title: "On Border",
//           description: step3Completed
//             ? "Customs Port paperwork approved."
//             : step3Active
//             ? `Arrived at Customs Gate. Status: ${shipment.borderConnectStatus?.toUpperCase()}`
//             : "Approaching international border line.",
//           key: "border",
//           status: step3Completed
//             ? "completed"
//             : step3Active
//             ? "active"
//             : "pending",
//         },
//         {
//           title: "Border Crossed",
//           description: step4Completed
//             ? "Successfully crossed boundary. Cleared US/Canada customs."
//             : step4Active
//             ? "Manifest handshake active."
//             : "Awaiting Port entry handshake.",
//           key: "border_cross",
//           status: step4Completed
//             ? "completed"
//             : step4Active
//             ? "active"
//             : "pending",
//         },
//         {
//           title: "Done with Delivery",
//           description: step5Completed
//             ? "Delivered. Proof of Delivery (POD) signed and submitted."
//             : step5Active
//             ? "Docked at receiver. Offloading in progress."
//             : "Final stop terminal scheduled.",
//           key: "done",
//           status: step5Completed
//             ? "completed"
//             : step5Active
//             ? "active"
//             : "pending",
//         },
//       ];
//     } else {
//       const step3Completed = status === "delivered";
//       const step3Active = status === "arrived";
//       return [
//         {
//           title: "Load Picked up at Warehouse",
//           description: step1Completed
//             ? "Departed warehouse. Regional delivery trailer dispatched."
//             : "Staged at outbound bay, awaiting regional driver.",
//           key: "picked",
//           status: step1Completed
//             ? "completed"
//             : step1Active
//             ? "active"
//             : "pending",
//         },
//         {
//           title: "Out for Delivery",
//           description: step2Completed
//             ? "Regional transit completed."
//             : step2Active
//             ? `Regional dispatch active. Scheduled for local arrival.`
//             : "Pending pickup completion.",
//           key: "out",
//           status: step2Completed
//             ? "completed"
//             : step2Active
//             ? "active"
//             : "pending",
//         },
//         {
//           title: "Done with Delivery",
//           description: step3Completed
//             ? "Delivered. Signed by receiver."
//             : step3Active
//             ? "Arrived at destination address."
//             : "Scheduled local handoff.",
//           key: "done",
//           status: step3Completed
//             ? "completed"
//             : step3Active
//             ? "active"
//             : "pending",
//         },
//       ];
//     }
//   };

//   const getBadgeStyles = (status) => {
//     switch (status) {
//       case "delivered":
//         return "bg-emerald-50 text-emerald-800 border-emerald-200";
//       case "in_transit":
//         return "bg-blue-50 text-blue-800 border-blue-200";
//       case "delayed":
//         return "bg-amber-50 text-amber-800 border-amber-200";
//       default:
//         return "bg-slate-50 text-slate-800 border-slate-200";
//     }
//   };

//   const faqData = [
//     {
//       q: "How does this portal track loads in real-time without a password?",
//       a: "For ease of use, we provide password-free public lookup. Your unique 5-digit Load Number (or B.O.L. / purchase order reference) is connected directly to our Samsara ELD transponders and GPS beacons on the assigned truck, maintaining privacy while giving you live telemetry.",
//     },
//     {
//       q: "What is the difference between Local and Outbound (Cross-Border) tracking milestones?",
//       a: "Local deliveries skip customs gates entirely and move directly from picking to delivery. Outbound deliveries route through US-Canada border crossings, displaying 'On Border' and 'Border Crossed' steps linked directly to real-time ACE/ACI customs manifest releases.",
//     },
//     {
//       q: "What should I do if my load shows as 'delayed'?",
//       a: "Delays are caused by sudden winter weather, highway blockages, or mandatory driver hours-of-service rest breaks. Our dispatch updates arrival times instantly. You can compile a live AI advisory update report below for detailed delay resolutions.",
//     },
//   ];

//   return (
//     <div
//       id="customer-tracking-portal"
//       className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
//     >
//       {/* Header Banner */}
//       <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
//         <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
//           <Globe
//             className="h-48 w-48 animate-spin"
//             style={{ animationDuration: "60s" }}
//           />
//         </div>

//         <div className="max-w-3xl space-y-4">
//           <div className="inline-flex items-center space-x-2 bg-indigo-500/20 border border-indigo-500/30 px-3.5 py-1.5 rounded-full">
//             <span className="flex h-2 w-2 relative">
//               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
//               <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
//             </span>
//             <span className="text-3xs font-bold font-mono text-indigo-300 uppercase tracking-widest">
//               Public Cargo Tracking Panel
//             </span>
//           </div>

//           <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
//             Real-Time Automated Load Checker
//           </h1>
//           <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-2xl">
//             Input your unique Load Number, B.O.L., or Purchase Order reference.
//             Our system automatically streams real-time HOS driver feeds and
//             customs progress, skipping border checkpoints for regional domestic
//             freight.
//           </p>

//           {/* Centered lookup input box */}
//           <form onSubmit={handleTrackSubmit} className="pt-3 max-w-md">
//             <div className="flex flex-col sm:flex-row gap-2.5">
//               <div className="relative flex-1">
//                 <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
//                 <input
//                   type="text"
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   placeholder="Enter Load # (e.g., 10001, 10003)"
//                   className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
//                 />
//               </div>
//               <button
//                 type="submit"
//                 className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
//               >
//                 <Compass className="h-4 w-4" />
//                 <span>Track Cargo</span>
//               </button>
//             </div>
//           </form>

//           {/* Quick Click Demo Tracker Links */}
//           <div className="flex flex-wrap items-center gap-2 pt-2 text-2xs text-slate-400">
//             <span className="font-mono uppercase text-indigo-300 tracking-wider font-extrabold mr-1">
//               Demo Quick Links:
//             </span>

//             <button
//               type="button"
//               onClick={() => {
//                 setSearchQuery("10001");
//                 const ship =
//                   shipments.find((s) => s.load_number === "10001") ||
//                   shipments[0];
//                 if (ship) setSearchedShipment(ship);
//               }}
//               className="bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/25 px-2.5 py-1 rounded-lg text-white font-bold cursor-pointer transition-all"
//             >
//               Load #10001 (Outbound Cross-Border)
//             </button>

//             <button
//               type="button"
//               onClick={() => {
//                 setSearchQuery("10003");
//                 const ship =
//                   shipments.find((s) => s.load_number === "10003") ||
//                   shipments[2];
//                 if (ship) setSearchedShipment(ship);
//               }}
//               className="bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/25 px-2.5 py-1 rounded-lg text-white font-bold cursor-pointer transition-all"
//             >
//               Load #10003 (Local Regional)
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Main Results Section */}
//       {searchedShipment ? (
//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
//           {/* Left Column - Stepper Progress & Live Telemetry Map */}
//           <div className="lg:col-span-8 space-y-6">
//             {/* The Custom Dynamic Milestone Stepper */}
//             <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
//               <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4">
//                 <div>
//                   <div className="flex items-center space-x-2">
//                     <span className="text-lg font-black text-slate-900 font-mono tracking-tight">
//                       Load #{searchedShipment.load_number}
//                     </span>
//                     <span
//                       className={`text-3xs font-bold px-2 py-0.5 rounded border uppercase ${getBadgeStyles(
//                         searchedShipment.status
//                       )}`}
//                     >
//                       {searchedShipment.status?.replace("_", " ")}
//                     </span>
//                     <span
//                       className={`text-3xs font-mono font-bold px-2 py-0.5 rounded border ${
//                         isOutboundShipment(searchedShipment)
//                           ? "bg-purple-50 text-purple-800 border-purple-200"
//                           : "bg-teal-50 text-teal-800 border-teal-200"
//                       }`}
//                     >
//                       {isOutboundShipment(searchedShipment)
//                         ? "Outbound Cross-Border"
//                         : "Local Regional"}
//                     </span>
//                   </div>
//                   <p className="text-3xs text-slate-400 mt-0.5 font-medium">
//                     Shipper:{" "}
//                     <span className="text-slate-700 font-semibold">
//                       {searchedShipment.shipperName ||
//                         searchedShipment.originCity}
//                     </span>{" "}
//                     • Consignee:{" "}
//                     <span className="text-slate-700 font-semibold">
//                       {searchedShipment.consigneeName ||
//                         searchedShipment.destinationCity}
//                     </span>
//                   </p>
//                 </div>

//                 <div className="text-right bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-2xl transition-all shadow-xs">
//                   <div className="flex items-center justify-end space-x-1.5 text-indigo-600 mb-0.5">
//                     <Clock className="h-3.5 w-3.5 animate-pulse" />
//                     <span className="text-[10px] font-extrabold font-mono uppercase tracking-wider text-indigo-700">
//                       Dynamic Telemetry ETA
//                     </span>
//                   </div>
//                   {(() => {
//                     const dynamicEta = calculateDynamicEta();
//                     if (!dynamicEta)
//                       return (
//                         <span className="text-xs font-bold text-slate-800 font-mono">
//                           {new Date(searchedShipment.eta).toLocaleString()}
//                         </span>
//                       );
//                     return (
//                       <>
//                         <span className="text-xs font-black text-slate-900 font-mono block tracking-tight">
//                           {dynamicEta.etaString}
//                         </span>
//                         <span className="text-[10px] font-bold text-indigo-600 block mt-0.5">
//                           {dynamicEta.durationText
//                             ? `${dynamicEta.durationText} (${dynamicEta.milesLeft} mi @ ${dynamicEta.speedMph} MPH)`
//                             : dynamicEta.message}
//                         </span>
//                       </>
//                     );
//                   })()}
//                 </div>
//               </div>

//               {/* Progress Stepper Visualiser */}
//               <div className="relative py-4">
//                 <div className="hidden md:block absolute top-[27px] left-[5%] right-[5%] h-1 bg-slate-100 -z-10 rounded-full overflow-hidden">
//                   <div
//                     className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-1000"
//                     style={{
//                       width: `${
//                         getTrackingSteps(searchedShipment).filter(
//                           (s) => s.status === "completed"
//                         ).length === getTrackingSteps(searchedShipment).length
//                           ? 100
//                           : Math.max(
//                               0,
//                               (getTrackingSteps(searchedShipment).filter(
//                                 (s) => s.status === "completed"
//                               ).length /
//                                 (getTrackingSteps(searchedShipment).length -
//                                   1)) *
//                                 100
//                             )
//                       }%`,
//                     }}
//                   />
//                 </div>

//                 <div
//                   className={`grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 relative`}
//                 >
//                   {getTrackingSteps(searchedShipment).map((step, idx) => {
//                     const isCompleted = step.status === "completed";
//                     const isActive = step.status === "active";
//                     return (
//                       <div
//                         key={idx}
//                         className="flex md:flex-col items-start md:items-center text-left md:text-center space-x-4 md:space-x-0 relative group"
//                       >
//                         <div
//                           className={`flex-shrink-0 h-10 w-10 rounded-full border-2 bg-white flex items-center justify-center transition-all shadow-sm ${
//                             isCompleted
//                               ? "border-emerald-500 text-emerald-500 bg-emerald-50 shadow-emerald-100"
//                               : isActive
//                               ? "border-indigo-600 text-indigo-600 bg-indigo-50 animate-pulse shadow-indigo-100"
//                               : "border-slate-200 text-slate-300 bg-slate-50"
//                           }`}
//                         >
//                           {isCompleted ? (
//                             <Check className="h-5 w-5 stroke-[3]" />
//                           ) : isActive ? (
//                             <div className="h-3 w-3 bg-indigo-600 rounded-full animate-ping" />
//                           ) : (
//                             <span className="text-xs font-mono font-bold">
//                               {idx + 1}
//                             </span>
//                           )}
//                         </div>

//                         <div className="space-y-1 mt-0 md:mt-3 flex-1">
//                           <h4
//                             className={`text-xs font-extrabold tracking-tight ${
//                               isCompleted
//                                 ? "text-slate-800"
//                                 : isActive
//                                 ? "text-indigo-900"
//                                 : "text-slate-400"
//                             }`}
//                           >
//                             {step.title}
//                           </h4>
//                           <p className="text-[10px] text-slate-500 leading-normal font-normal md:max-w-[160px] md:mx-auto">
//                             {step.description}
//                           </p>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>

//               {/* Real-time calculated telemetry summary */}
//               {(() => {
//                 const dynamicEta = calculateDynamicEta();
//                 if (!dynamicEta) return null;
//                 return (
//                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gradient-to-br from-slate-900 to-slate-950 p-4 rounded-2xl text-white border border-slate-850">
//                     <div className="space-y-1">
//                       <span className="text-[9px] text-indigo-300 font-mono font-bold uppercase tracking-widest block">
//                         REMAINING DISTANCE
//                       </span>
//                       <div className="flex items-baseline space-x-1">
//                         <span className="text-lg font-black font-mono text-white">
//                           {dynamicEta.milesLeft}
//                         </span>
//                         <span className="text-[10px] text-slate-400 font-semibold font-mono">
//                           MILES TO GO
//                         </span>
//                       </div>
//                       <p className="text-[10px] text-slate-400 font-medium">
//                         Based on current active route coordinates
//                       </p>
//                     </div>

//                     <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
//                       <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-widest block">
//                         TELEMETRY SPEED
//                       </span>
//                       <div className="flex items-baseline space-x-1">
//                         <span className="text-lg font-black font-mono text-emerald-400">
//                           {dynamicEta.speedMph}
//                         </span>
//                         <span className="text-[10px] text-slate-400 font-semibold font-mono">
//                           MPH INSTANT
//                         </span>
//                       </div>
//                       <p className="text-[10px] text-slate-400 font-medium">
//                         Live feedback from truck transponder
//                       </p>
//                     </div>

//                     <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
//                       <span className="text-[9px] text-indigo-300 font-mono font-bold uppercase tracking-widest block">
//                         SPEED-CALCULATED ETA
//                       </span>
//                       <div className="flex items-baseline space-x-1.5">
//                         <span className="text-[11px] font-black font-mono text-white truncate max-w-[160px]">
//                           {dynamicEta.etaString}
//                         </span>
//                       </div>
//                       <p className="text-[10px] text-indigo-300 font-mono font-bold">
//                         {dynamicEta.durationText || "Ready"}
//                       </p>
//                     </div>
//                   </div>
//                 );
//               })()}

//               {/* Waypoints sequence table summary */}
//               <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3">
//                 <div className="flex items-center justify-between">
//                   <span className="text-3xs font-bold text-slate-400 font-mono uppercase tracking-wider">
//                     Verifiable Chain-Of-Custody Waypoints
//                   </span>
//                   <span className="text-[10px] font-mono font-semibold text-slate-500">
//                     Completed stops:{" "}
//                     <span className="font-bold text-slate-800">
//                       {searchedShipment.waypoints?.filter(
//                         (w) => w.status === "completed"
//                       ).length || 0}
//                     </span>{" "}
//                     / {searchedShipment.waypoints?.length || 0}
//                   </span>
//                 </div>

//                 <div className="space-y-2">
//                   {searchedShipment.waypoints?.map((wpt) => {
//                     const isCompleted = wpt.status === "completed";
//                     const isArrived = wpt.status === "arrived";
//                     return (
//                       <div
//                         key={wpt.id}
//                         className="bg-white border border-slate-100 p-2.5 rounded-xl flex items-center justify-between text-3xs"
//                       >
//                         <div className="flex items-center space-x-3">
//                           <div
//                             className={`p-1.5 rounded-lg ${
//                               isCompleted
//                                 ? "bg-emerald-50 text-emerald-600"
//                                 : isArrived
//                                 ? "bg-amber-50 text-amber-600"
//                                 : "bg-slate-50 text-slate-400"
//                             }`}
//                           >
//                             {wpt.stopType === "pickup" ? (
//                               <MapPin className="h-3.5 w-3.5" />
//                             ) : wpt.stopType === "border_crossing" ? (
//                               <ShieldCheck className="h-3.5 w-3.5" />
//                             ) : (
//                               <Truck className="h-3.5 w-3.5" />
//                             )}
//                           </div>
//                           <div>
//                             <div className="font-bold text-slate-800 flex items-center space-x-1.5">
//                               <span>{wpt.companyName}</span>
//                               <span className="text-[8px] uppercase bg-slate-100 text-slate-500 px-1 rounded-sm font-bold">
//                                 {wpt.stopType}
//                               </span>
//                             </div>
//                             <div className="text-slate-400 font-medium">
//                               {wpt.address}
//                             </div>
//                           </div>
//                         </div>

//                         <div className="text-right">
//                           <span
//                             className={`font-mono font-black uppercase text-[8px] px-1.5 py-0.5 rounded ${
//                               isCompleted
//                                 ? "bg-emerald-100 text-emerald-800"
//                                 : isArrived
//                                 ? "bg-amber-100 text-amber-800"
//                                 : "bg-slate-100 text-slate-500"
//                             }`}
//                           >
//                             {wpt.status}
//                           </span>
//                           {wpt.actualTime && (
//                             <span className="block text-[8px] font-mono text-slate-400 mt-1">
//                               {new Date(wpt.actualTime).toLocaleTimeString()}
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>

//             {/* Live ELD Telemetry Simulation Screen */}
//             <div className="bg-[#111317] border border-slate-800 rounded-3xl p-6 text-white space-y-4 shadow-xl">
//               <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
//                 <div className="flex items-center space-x-3">
//                   <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
//                     <Activity className="h-5 w-5 animate-pulse" />
//                   </div>
//                   <div>
//                     <h3 className="text-sm font-extrabold font-mono uppercase tracking-wider">
//                       Samsara Cab Telemetry Terminal
//                     </h3>
//                     <p className="text-3xs text-slate-400 font-mono">
//                       Live streaming cab diagnostics &amp; speed limit bounds
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex items-center space-x-4">
//                   <div className="text-right">
//                     <span className="text-[9px] font-mono text-slate-400 block uppercase">
//                       Satellite Poller
//                     </span>
//                     <span className="text-xs font-mono font-bold text-emerald-400">
//                       {isAutoPolling ? `PING IN ${secondsLeft}S` : "MUTED"}
//                     </span>
//                   </div>
//                   <button
//                     onClick={() => {
//                       setIsAutoPolling(!isAutoPolling);
//                       if (!isAutoPolling) setSecondsLeft(12);
//                     }}
//                     className={`px-3 py-1.5 rounded-xl text-3xs font-mono font-bold uppercase transition-all cursor-pointer ${
//                       isAutoPolling
//                         ? "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
//                         : "bg-indigo-600 text-white hover:bg-indigo-500"
//                     }`}
//                   >
//                     {isAutoPolling ? "Pause Polling" : "Resume Polling"}
//                   </button>
//                 </div>
//               </div>

//               {/* Grid telemetry parameters */}
//               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
//                 <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
//                   <span className="text-[9px] text-slate-400 font-mono block uppercase">
//                     GPS LATITUDE
//                   </span>
//                   <span className="font-mono font-bold text-xs text-white block mt-1">
//                     {simulatedLat.toFixed(5)}
//                   </span>
//                 </div>
//                 <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
//                   <span className="text-[9px] text-slate-400 font-mono block uppercase">
//                     GPS LONGITUDE
//                   </span>
//                   <span className="font-mono font-bold text-xs text-white block mt-1">
//                     {simulatedLng.toFixed(5)}
//                   </span>
//                 </div>
//                 <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
//                   <span className="text-[9px] text-slate-400 font-mono block uppercase">
//                     SPEED VELOCITY
//                   </span>
//                   <span className="font-mono font-extrabold text-xs text-emerald-400 block mt-1">
//                     {simulatedSpeed > 0
//                       ? `${simulatedSpeed} MPH`
//                       : "0 MPH (STOPPED)"}
//                   </span>
//                 </div>
//                 <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
//                   <span className="text-[9px] text-slate-400 font-mono block uppercase">
//                     HOS DRIVER STATUS
//                   </span>
//                   <span className="font-mono font-bold text-xs text-indigo-300 block mt-1 uppercase">
//                     {searchedShipment.activeHOSStatus?.replace("_", " ") ||
//                       "driving"}
//                   </span>
//                 </div>
//               </div>

//               {/* Scrolling Sync Log list */}
//               <div className="space-y-1.5">
//                 <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest flex items-center space-x-1.5">
//                   <RefreshCw
//                     className={`h-3 w-3 ${isAutoPolling ? "animate-spin" : ""}`}
//                   />
//                   <span>Telemetry Feed Buffer Logs</span>
//                 </div>

//                 <div className="bg-black p-4 rounded-2xl border border-slate-800/80 font-mono text-[10px] text-slate-300 space-y-1.5 h-36 overflow-y-auto animate-fade-in">
//                   {pollingLogs.map((log, idx) => (
//                     <div
//                       key={idx}
//                       className={idx === 0 ? "text-emerald-400 font-bold" : ""}
//                     >
//                       {idx === 0 && (
//                         <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 animate-ping" />
//                       )}
//                       {log}
//                     </div>
//                   ))}
//                   {pollingLogs.length === 0 && (
//                     <div className="text-slate-500">
//                       Awaiting starting telemetry heartbeat signal...
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* General FAQs Desk */}
//             <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
//               <div>
//                 <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
//                   <HelpCircle className="h-4.5 w-4.5 text-indigo-500" />
//                   <span>Logistics FAQ Desk</span>
//                 </h3>
//                 <p className="text-3xs text-slate-400">
//                   Essential details regarding border clearance schedules &amp;
//                   tracking latency
//                 </p>
//               </div>

//               <div className="space-y-2.5">
//                 {faqData.map((faq, idx) => {
//                   const isOpen = activeFaq === idx;
//                   return (
//                     <div
//                       key={idx}
//                       className="border border-slate-150 rounded-xl overflow-hidden transition-all"
//                     >
//                       <button
//                         onClick={() => setActiveFaq(isOpen ? null : idx)}
//                         className="w-full flex items-center justify-between p-3.5 text-left bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
//                       >
//                         <span className="text-xs font-bold text-slate-800">
//                           {faq.q}
//                         </span>
//                         <span className="text-xs font-mono font-bold text-indigo-600">
//                           {isOpen ? "−" : "+"}
//                         </span>
//                       </button>
//                       {isOpen && (
//                         <div className="p-3.5 bg-white border-t border-slate-150 text-xs text-slate-600 leading-relaxed">
//                           {faq.a}
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           </div>

//           {/* Right Column - Manifest Summary & Alerts Subscription */}
//           <div className="lg:col-span-4 space-y-6">
//             {/* Instant Alerts Subscription form */}
//             <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
//               <div className="flex items-start space-x-3">
//                 <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
//                   <Bell className="h-4 w-4" />
//                 </div>
//                 <div>
//                   <h3 className="text-sm font-bold text-slate-900">
//                     Instant Milestones Alerts
//                   </h3>
//                   <p className="text-3xs text-slate-400 leading-normal">
//                     Subscribe to get instant Email/SMS alerts when milestones
//                     transition.
//                   </p>
//                 </div>
//               </div>

//               {subSuccess && (
//                 <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-3xs text-emerald-800 font-bold leading-normal">
//                   {subMessage}
//                 </div>
//               )}

//               <form onSubmit={handleAlertSubscribe} className="space-y-3">
//                 <div className="space-y-1">
//                   <label className="block text-3xs font-mono font-bold text-slate-400 uppercase">
//                     Corporate Email
//                   </label>
//                   <input
//                     type="email"
//                     value={emailSub}
//                     onChange={(e) => setEmailSub(e.target.value)}
//                     placeholder="logistics@customer.com"
//                     className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
//                   />
//                 </div>

//                 <div className="space-y-1">
//                   <label className="block text-3xs font-mono font-bold text-slate-400 uppercase">
//                     Mobile Number (For SMS)
//                   </label>
//                   <input
//                     type="tel"
//                     value={phoneSub}
//                     onChange={(e) => setPhoneSub(e.target.value)}
//                     placeholder="+1 (555) 491-0391"
//                     className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
//                   />
//                 </div>

//                 <button
//                   type="submit"
//                   className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
//                 >
//                   Save Alerts Subscription
//                 </button>
//               </form>
//             </div>

//             {/* Gemini Dynamic Advisories */}
//             <div className="bg-white rounded-3xl border border-[#D1E0FF] bg-gradient-to-b from-indigo-50/20 to-white shadow-sm p-6 space-y-4">
//               <div className="flex items-start space-x-3">
//                 <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/10">
//                   <Sparkles className="h-4.5 w-4.5" />
//                 </div>
//                 <div>
//                   <h3 className="text-sm font-bold text-slate-900">
//                     On-Demand AI Advisory
//                   </h3>
//                   <p className="text-3xs text-slate-400">
//                     Compile a customer advisory email instantly using
//                     server-side Gemini intelligence.
//                   </p>
//                 </div>
//               </div>

//               <button
//                 onClick={handleGenerateAiReport}
//                 disabled={aiLoading}
//                 className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
//               >
//                 {aiLoading ? (
//                   <>
//                     <span className="animate-spin h-3.5 w-3.5 border-2 border-slate-400 border-t-white rounded-full" />
//                     <span>Compiling Report...</span>
//                   </>
//                 ) : (
//                   <>
//                     <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
//                     <span>Compile AI Advisory</span>
//                   </>
//                 )}
//               </button>

//               {aiError && (
//                 <div className="p-3.5 bg-rose-50 border border-rose-150 rounded-2xl flex items-start space-x-2.5">
//                   <AlertTriangle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
//                   <div>
//                     <div className="text-3xs font-black text-rose-800 uppercase font-mono">
//                       Service Warning
//                     </div>
//                     <p className="text-3xs text-rose-700 mt-0.5 leading-normal">
//                       {aiError}
//                     </p>
//                   </div>
//                 </div>
//               )}

//               {aiReport && (
//                 <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl animate-fade-in">
//                   <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
//                     <div className="bg-slate-100/75 p-2.5 border-b border-slate-200 text-3xs space-y-1">
//                       <div>
//                         <span className="text-slate-400 font-mono font-bold uppercase">
//                           To:
//                         </span>{" "}
//                         <span className="text-slate-700 font-semibold">
//                           {searchedShipment.customerEmail ||
//                             "logistics@customer.com"}
//                         </span>
//                       </div>
//                       <div>
//                         <span className="text-slate-400 font-mono font-bold uppercase">
//                           Subject:
//                         </span>{" "}
//                         <span className="text-indigo-900 font-bold">
//                           {aiReport.subject}
//                         </span>
//                       </div>
//                     </div>

//                     <div className="p-3 text-[11px] font-sans text-slate-700 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap bg-white select-text font-mono">
//                       {aiReport.emailBody}
//                     </div>
//                   </div>

//                   {aiReport.keyHighlights &&
//                     aiReport.keyHighlights.length > 0 && (
//                       <div className="space-y-1.5">
//                         <span className="text-[9px] font-bold text-slate-400 block font-mono uppercase tracking-wider">
//                           Key Cargo Bulletins
//                         </span>
//                         <ul className="text-3xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed font-semibold">
//                           {aiReport.keyHighlights.map((hl, idx) => (
//                             <li key={idx} className="text-slate-700">
//                               {hl}
//                             </li>
//                           ))}
//                         </ul>
//                       </div>
//                     )}

//                   <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-2.5 text-indigo-700 text-3xs leading-relaxed flex items-start space-x-2">
//                     <Mail className="h-3.5 w-3.5 shrink-0 text-indigo-500 mt-0.5" />
//                     <span>
//                       The template above represents live telemetry parsed via
//                       Samsara GPS and Border Connect. Feel free to copy.
//                     </span>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Manifest summary details */}
//             <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
//               <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest">
//                 Active Manifest Details
//               </h3>

//               <div className="grid grid-cols-2 gap-4 text-3xs font-mono">
//                 <div>
//                   <span className="text-slate-400 block font-mono">
//                     B.O.L. NUMBER
//                   </span>
//                   <span className="font-bold text-slate-800 block mt-0.5">
//                     {searchedShipment.bolNumber || "BOL-381029"}
//                   </span>
//                 </div>
//                 <div>
//                   <span className="text-slate-400 block font-mono">
//                     P.O. NUMBER
//                   </span>
//                   <span className="font-bold text-slate-800 block mt-0.5">
//                     {searchedShipment.poNumber || "PO-294012"}
//                   </span>
//                 </div>
//                 <div>
//                   <span className="text-slate-400 block font-mono">
//                     TOTAL WEIGHT
//                   </span>
//                   <span className="font-bold text-slate-800 block mt-0.5">
//                     {searchedShipment.weightLbs?.toLocaleString()} lbs
//                   </span>
//                 </div>
//                 <div>
//                   <span className="text-slate-400 block font-mono">
//                     PALLET COUNT
//                   </span>
//                   <span className="font-bold text-slate-800 block mt-0.5">
//                     {searchedShipment.palletCount} Plts
//                   </span>
//                 </div>
//                 <div>
//                   <span className="text-slate-400 block font-mono font-mono">
//                     CARGO CONTENTS
//                   </span>
//                   <span
//                     className="font-bold text-slate-800 block mt-0.5 truncate max-w-[140px]"
//                     title={searchedShipment.cargoDescription}
//                   >
//                     {searchedShipment.cargoDescription}
//                   </span>
//                 </div>
//                 <div>
//                   <span className="text-slate-400 block font-mono">
//                     BORDER MANIFEST
//                   </span>
//                   <span className="font-black text-indigo-600 block mt-0.5 uppercase">
//                     {searchedShipment.borderConnectStatus === "none"
//                       ? "LOCAL (SKIP CHECK)"
//                       : searchedShipment.borderConnectStatus}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       ) : (
//         <div className="text-center text-slate-400 py-16 bg-white rounded-3xl border border-dashed border-slate-200 max-w-xl mx-auto space-y-2">
//           <p className="font-bold text-slate-600 text-sm">
//             No load currently active or match found.
//           </p>
//           <p className="text-xs text-slate-500">
//             Please enter a valid Load # in the search bar above to begin
//             streaming telemetry.
//           </p>
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useEffect, useMemo } from "react";
import { useShipmentStore } from "../stores/useShipmentStore";
import {
  Globe,
  Search,
  MapPin,
  Truck,
  AlertTriangle,
  Sparkles,
  Mail,
  Compass,
  RefreshCw,
  Bell,
  ShieldCheck,
  Clock,
  Check,
  HelpCircle,
  Activity,
  UserCheck,
  Layers,
  Box,
  CheckCircle2,
} from "lucide-react";

export const getNormalizedCustomerStatus = (shipment) => {
  if (!shipment) return "pending";
  if (shipment.status === "delivered") return "delivered";
  if (shipment.status === "in_transit") return "in_transit";
  if (shipment.status === "dispatched") return "dispatched";
  if (
    shipment.status === "assigned" ||
    (shipment.tripId && shipment.tripId !== "")
  )
    return "assigned";
  return "pending";
};

export default function CustomerPage() {
  const shipments = useShipmentStore((state) => state.shipments);
  const fetchShipments = useShipmentStore((state) => state.fetchShipments);

  // Fetch shipments on load
  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const [searchQuery, setSearchQuery] = useState("10001");
  const [searchedShipment, setSearchedShipment] = useState(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [listSearchQuery, setListSearchQuery] = useState("");

  // Automatically select matching shipment when list loads
  useEffect(() => {
    if (!searchedShipment && shipments.length > 0) {
      const found =
        shipments.find((s) => s.load_number === "10001") || shipments[0];
      setSearchedShipment(found);
    }
  }, [shipments, searchedShipment]);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiReport, setAiReport] = useState(null);
  const [isAutoPolling, setIsAutoPolling] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(12);
  const [simulatedLat, setSimulatedLat] = useState(42.3314);
  const [simulatedLng, setSimulatedLng] = useState(-83.0458);
  const [simulatedSpeed, setSimulatedSpeed] = useState(62);
  const [pollingLogs, setPollingLogs] = useState([]);
  const [emailSub, setEmailSub] = useState("");
  const [phoneSub, setPhoneSub] = useState("");
  const [subSuccess, setSubSuccess] = useState(false);
  const [subMessage, setSubMessage] = useState("");
  const [activeFaq, setActiveFaq] = useState(null);
  const [simulatedRemainingDistance, setSimulatedRemainingDistance] =
    useState(145);

  useEffect(() => {
    if (searchedShipment) {
      const isDelivered = searchedShipment.status === "delivered";
      const isArrived = searchedShipment.status === "arrived";
      let initialDist = 0;
      if (isDelivered || isArrived) {
        initialDist = 0;
      } else if (
        searchedShipment.status === "pending" ||
        searchedShipment.status === "dispatched"
      ) {
        initialDist = searchedShipment.totalDistanceMiles || 320;
      } else {
        initialDist = Math.max(
          10,
          Math.round((searchedShipment.totalDistanceMiles || 320) * 0.45)
        );
      }
      setSimulatedRemainingDistance(initialDist);
      setSimulatedLat(41.8781 + (Math.random() - 0.5) * 0.5);
      setSimulatedLng(-84.6298 + (Math.random() - 0.5) * 0.5);
      setSimulatedSpeed(
        isDelivered || isArrived ? 0 : 58 + Math.floor(Math.random() * 10)
      );
      const timestamp = new Date().toLocaleTimeString();
      setPollingLogs([
        `[${timestamp}] Telemetry stream initiated for Load #${searchedShipment.trackingNumber}.`,
        `[${timestamp}] Route validation: ${searchedShipment.originCity} to ${searchedShipment.destinationCity}.`,
        `[${timestamp}] Cabin sensor calibration complete. Environment set to cargo-safe.`,
        `[${timestamp}] Load starting distance: ${initialDist} miles remaining.`,
      ]);
      setAiReport(null);
    }
  }, [searchedShipment]);

  // Compute status counts for top metric cards
  const counts = useMemo(() => {
    const c = {
      all: shipments.length,
      pending: 0,
      assigned: 0,
      dispatched: 0,
      in_transit: 0,
      delivered: 0,
    };
    shipments.forEach((s) => {
      const norm = getNormalizedCustomerStatus(s);
      if (c[norm] !== undefined) c[norm]++;
    });
    return c;
  }, [shipments]);

  // Filtered customer shipments list
  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      const norm = getNormalizedCustomerStatus(s);
      if (selectedStatusFilter !== "all" && norm !== selectedStatusFilter) {
        return false;
      }
      if (listSearchQuery.trim()) {
        const q = listSearchQuery.toLowerCase().trim();
        const matchTrack = s.trackingNumber?.toLowerCase().includes(q);
        const matchCustomer = s.customerName?.toLowerCase().includes(q);
        const matchPo = s.poNumber?.toLowerCase().includes(q);
        const matchBol = s.bolNumber?.toLowerCase().includes(q);
        const matchCity =
          s.originCity?.toLowerCase().includes(q) ||
          s.destinationCity?.toLowerCase().includes(q);
        const matchDriver = s.driverName?.toLowerCase().includes(q);
        const matchTrip = s.tripId?.toLowerCase().includes(q);
        return (
          matchTrack ||
          matchCustomer ||
          matchPo ||
          matchBol ||
          matchCity ||
          matchDriver ||
          matchTrip
        );
      }
      return true;
    });
  }, [shipments, selectedStatusFilter, listSearchQuery]);

  const calculateDynamicEta = () => {
    if (!searchedShipment) return null;
    const isDelivered = searchedShipment.status === "delivered";
    const isArrived = searchedShipment.status === "arrived";
    if (isDelivered) {
      return {
        etaString: "Delivered",
        hours: 0,
        minutes: 0,
        milesLeft: 0,
        speedMph: 0,
        durationText: "Fully Delivered",
        message: "Load has arrived and cargo has been fully delivered.",
      };
    }
    if (isArrived) {
      return {
        etaString: "Arrived at Receiver",
        hours: 0,
        minutes: 0,
        milesLeft: 0,
        speedMph: 0,
        durationText: "Arrived at Dock",
        message: "Vehicle has arrived at the receiving facility dock.",
      };
    }
    const currentSpeed = simulatedSpeed || searchedShipment.speedMph || 60;
    const remainingMiles =
      simulatedRemainingDistance > 0 ? simulatedRemainingDistance : 1;
    const totalHours = remainingMiles / currentSpeed;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    const etaDate = new Date();
    etaDate.setMinutes(etaDate.getMinutes() + Math.round(totalHours * 60));
    const timeFormatter = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const formattedEta = timeFormatter.format(etaDate);
    let durationText = "";
    if (hours > 0) {
      durationText += `${hours}h `;
    }
    durationText += `${minutes}m remaining`;
    return {
      etaString: formattedEta,
      hours,
      minutes,
      durationText,
      milesLeft: remainingMiles,
      speedMph: currentSpeed,
      message: `En route: ${remainingMiles} miles remaining at ${currentSpeed} MPH`,
    };
  };

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const found = shipments.find(
      (s) =>
        s.load_number.trim().toLowerCase() ===
          searchQuery.trim().toLowerCase() ||
        (s.poNumber &&
          s.poNumber.trim().toLowerCase() ===
            searchQuery.trim().toLowerCase()) ||
        (s.bolNumber &&
          s.bolNumber.trim().toLowerCase() === searchQuery.trim().toLowerCase())
    );
    setSearchedShipment(found || null);
    setAiReport(null);
  };

  useEffect(() => {
    if (!isAutoPolling || !searchedShipment) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          const timestamp = new Date().toLocaleTimeString();
          const isDelivered = searchedShipment.status === "delivered";
          const isArrived = searchedShipment.status === "arrived";
          if (!isDelivered && !isArrived) {
            setSimulatedLat((lat) => lat + (Math.random() - 0.4) * 0.002);
            setSimulatedLng((lng) => lng + (Math.random() - 0.6) * 0.002);
            setSimulatedSpeed((speed) =>
              Math.max(
                50,
                Math.min(70, speed + Math.round((Math.random() - 0.5) * 4))
              )
            );
            setSimulatedRemainingDistance((dist) =>
              Math.max(
                1,
                Number(Math.max(0, dist - 0.2 - Math.random() * 0.3).toFixed(1))
              )
            );
          } else {
            setSimulatedSpeed(0);
            setSimulatedRemainingDistance(0);
          }
          const logTemplates = [
            `[${timestamp}] ELD Heartbeat: Ping received from truck unit ${
              searchedShipment.truckNumber || "TRK-102"
            }.`,
            `[${timestamp}] GPS telemetry verified: Lat ${simulatedLat.toFixed(
              5
            )}, Lng ${simulatedLng.toFixed(5)}.`,
            `[${timestamp}] Carrier temperature sensors confirm payload environment is secure (36.4°F).`,
            `[${timestamp}] Border Connect Link: Customs clearance manifest verified (${searchedShipment.borderConnectStatus?.toUpperCase()}).`,
            `[${timestamp}] Samsara Diagnostics: Engine coolant safe, speed set at ${simulatedSpeed} MPH.`,
            `[${timestamp}] Transit Update: GPS tracking shows route progression.`,
          ];
          const randomLog =
            logTemplates[Math.floor(Math.random() * logTemplates.length)];
          setPollingLogs((prevLogs) => [randomLog, ...prevLogs.slice(0, 6)]);
          return 12;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [
    isAutoPolling,
    searchedShipment,
    simulatedLat,
    simulatedLng,
    simulatedSpeed,
  ]);

  const handleAlertSubscribe = (e) => {
    e.preventDefault();
    if (!emailSub && !phoneSub) {
      alert(
        "Please provide either an email or mobile phone number to register for automated pings."
      );
      return;
    }
    setSubSuccess(true);
    setSubMessage(
      `Successfully registered! Milestones for Load #${
        searchedShipment?.trackingNumber
      } will automatically push to ${emailSub || phoneSub}.`
    );
    setTimeout(() => {
      setSubSuccess(false);
      setEmailSub("");
      setPhoneSub("");
    }, 6000);
  };

  const handleGenerateAiReport = async () => {
    if (!searchedShipment) return;
    setAiLoading(true);
    setAiError(null);
    setAiReport(null);
    try {
      const response = await fetch("/api/gemini/customer-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber: searchedShipment.trackingNumber,
          customerName: searchedShipment.customerName,
          origin: searchedShipment.originCity,
          destination: searchedShipment.destinationCity,
          currentStatus: searchedShipment.status,
          speedMph: simulatedSpeed,
          eta: searchedShipment.eta,
          borderStatus: searchedShipment.borderConnectStatus,
          cargoDescription: searchedShipment.cargoDescription,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details || errorData.error || "Connection failed."
        );
      }
      const data = await response.json();
      setAiReport(data);
    } catch (err) {
      setAiError(
        err.message ||
          "Verification failed. Please check your system settings or GEMINI_API_KEY environment variable."
      );
    } finally {
      setAiLoading(false);
    }
  };

  // 5-Stage Customer Load Tracking Stepper
  const getTrackingSteps = (shipment) => {
    const norm = getNormalizedCustomerStatus(shipment);

    // Status level mapping:
    // pending = 0, assigned = 1, dispatched = 2, in_transit = 3, delivered = 4
    let level = 0;
    if (norm === "assigned") level = 1;
    if (norm === "dispatched") level = 2;
    if (norm === "in_transit") level = 3;
    if (norm === "delivered") level = 4;

    const tripInfo = shipment.tripId
      ? `Trip #${shipment.tripId.replace("TRIP-", "")}`
      : null;
    const driverInfo = shipment.driverName || "Assigned Driver";

    return [
      {
        stage: "Pending",
        title: "1. Pending Assignment",
        description:
          level > 0
            ? "Load created & staged at warehouse."
            : "Load created. Awaiting trip and driver assignment.",
        key: "pending",
        status: level >= 1 ? "completed" : level === 0 ? "active" : "pending",
      },
      {
        stage: "Assigned",
        title: "2. Assigned to Trip & Driver",
        description:
          level >= 1
            ? `${tripInfo ? `${tripInfo} • ` : ""}${driverInfo}`
            : "Pending trip assignment with driver.",
        key: "assigned",
        status: level >= 2 ? "completed" : level === 1 ? "active" : "pending",
      },
      {
        stage: "Dispatched",
        title: "3. Dispatched from Warehouse",
        description:
          level >= 2
            ? "Out of warehouse. Released from loading dock."
            : "Awaiting warehouse dispatch release.",
        key: "dispatched",
        status: level >= 3 ? "completed" : level === 2 ? "active" : "pending",
      },
      {
        stage: "In Transit",
        title: "4. In Transit on Route",
        description:
          level >= 3
            ? `Actively en route to ${
                shipment.destinationCity || "destination"
              }.`
            : "Awaiting active highway transit.",
        key: "in_transit",
        status: level >= 4 ? "completed" : level === 3 ? "active" : "pending",
      },
      {
        stage: "Delivered",
        title: "5. Delivered at Consignee",
        description:
          level === 4
            ? "Arrived at destination address and signed off."
            : "Final arrival & offloading scheduled.",
        key: "delivered",
        status: level === 4 ? "completed" : "pending",
      },
    ];
  };

  const getStatusBadge = (shipment) => {
    const norm = getNormalizedCustomerStatus(shipment);
    switch (norm) {
      case "pending":
        return {
          label: "Pending (Unassigned)",
          className: "bg-slate-100 text-slate-700 border-slate-300 font-bold",
        };
      case "assigned":
        return {
          label: "Assigned ",
          className:
            "bg-indigo-100 text-indigo-800 border-indigo-300 font-bold",
        };
      case "dispatched":
        return {
          label: "Dispatched (Out of Warehouse)",
          className: "bg-blue-100 text-blue-800 border-blue-300 font-bold",
        };
      case "in_transit":
        return {
          label: "In Transit",
          className: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
        };
      case "delivered":
        return {
          label: "Delivered",
          className:
            "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold",
        };
      default:
        return {
          label: shipment.status || "Pending",
          className: "bg-slate-100 text-slate-800 border-slate-200 font-bold",
        };
    }
  };

  const faqData = [
    {
      q: "How are load statuses tracked on this dashboard?",
      a: "Our tracking pipeline follows 5 real-time stages: 'Pending' (staged in warehouse, awaiting trip), 'Assigned' (matched with a trip & driver), 'Dispatched' (departed warehouse), 'In Transit' (on the road), and 'Delivered'.",
    },
    {
      q: "How does the portal track loads without requiring a login?",
      a: "You can track any load using your unique Load Number (or B.O.L. / purchase order reference) connected directly to Samsara ELD transponders and GPS beacons on the assigned truck.",
    },
    {
      q: "What happens when a trip is cancelled by dispatcher?",
      a: "If a trip is cancelled or disassembled by dispatch, the load automatically returns to 'Pending' status so it can be reassigned to a new trip.",
    },
  ];

  console.log(searchedShipment);

  return (
    <div
      id="customer-tracking-portal"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
          <Globe
            className="h-48 w-48 animate-spin"
            style={{ animationDuration: "60s" }}
          />
        </div>

        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/20 border border-indigo-500/30 px-3.5 py-1.5 rounded-full">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-3xs font-bold font-mono text-indigo-300 uppercase tracking-widest">
              Customer Tracking Dashboard
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Real-Time Cargo &amp; Load Tracking Portal
          </h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Track your loads seamlessly through every stage:{" "}
            <strong className="text-slate-100">Pending</strong> (unassigned),{" "}
            <strong className="text-indigo-300">Assigned</strong> (trip &amp;
            driver matched),{" "}
            <strong className="text-blue-300">Dispatched</strong> (out of
            warehouse), <strong className="text-amber-300">In Transit</strong>,
            and <strong className="text-emerald-300">Delivered</strong>.
          </p>

          {/* Centered lookup input box */}
          <form onSubmit={handleTrackSubmit} className="pt-3 max-w-md">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Load # (e.g., 10001, 10003, PO-294012)"
                  className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
              >
                <Compass className="h-4 w-4" />
                <span>Track Load</span>
              </button>
            </div>
          </form>

          {/* Quick Click Demo Tracker Links */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-2xs text-slate-400">
            <span className="font-mono uppercase text-indigo-300 tracking-wider font-extrabold mr-1">
              Quick Select:
            </span>
            {shipments.slice(0, 4).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSearchQuery(s.load_number);
                  setSearchedShipment(s);
                }}
                className="bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/25 px-2.5 py-1 rounded-lg text-white font-bold cursor-pointer transition-all"
              >
                Load #{s.load_number} (
                {getNormalizedCustomerStatus(s).replace("_", " ")})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Status Summary Cards */}
      {/* <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => setSelectedStatusFilter("all")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatusFilter === "all"
              ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-indigo-500"
              : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-80">
            <span>All Loads</span>
            <Layers className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black mt-2 font-mono">{counts.all}</div>
          <div className="text-3xs mt-1 opacity-70">Total in system</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatusFilter("pending")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatusFilter === "pending"
              ? "bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-400"
              : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600">
            <span>Pending</span>
            <Box className="h-4 w-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black mt-2 font-mono text-slate-900">
            {counts.pending}
          </div>
          <div className="text-3xs mt-1 text-slate-500">Unassigned</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatusFilter("assigned")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatusFilter === "assigned"
              ? "bg-indigo-900 text-white border-indigo-900 shadow-md ring-2 ring-indigo-400"
              : "bg-indigo-50/50 text-indigo-950 border-indigo-200 hover:border-indigo-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-700">
            <span>Assigned</span>
            <UserCheck className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black mt-2 font-mono text-indigo-950">
            {counts.assigned}
          </div>
          <div className="text-3xs mt-1 text-indigo-600">Trip &amp; Driver</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatusFilter("dispatched")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatusFilter === "dispatched"
              ? "bg-blue-900 text-white border-blue-900 shadow-md ring-2 ring-blue-400"
              : "bg-blue-50/50 text-blue-950 border-blue-200 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-blue-700">
            <span>Dispatched</span>
            <Truck className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black mt-2 font-mono text-blue-950">
            {counts.dispatched}
          </div>
          <div className="text-3xs mt-1 text-blue-600">Out of Warehouse</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatusFilter("in_transit")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatusFilter === "in_transit"
              ? "bg-amber-900 text-white border-amber-900 shadow-md ring-2 ring-amber-400"
              : "bg-amber-50/50 text-amber-950 border-amber-200 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-800">
            <span>In Transit</span>
            <Activity className="h-4 w-4 text-amber-600 animate-pulse" />
          </div>
          <div className="text-2xl font-black mt-2 font-mono text-amber-950">
            {counts.in_transit}
          </div>
          <div className="text-3xs mt-1 text-amber-700">On Highway</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatusFilter("delivered")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatusFilter === "delivered"
              ? "bg-emerald-900 text-white border-emerald-900 shadow-md ring-2 ring-emerald-400"
              : "bg-emerald-50/50 text-emerald-950 border-emerald-200 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-800">
            <span>Delivered</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black mt-2 font-mono text-emerald-950">
            {counts.delivered}
          </div>
          <div className="text-3xs mt-1 text-emerald-700">Completed</div>
        </button>
      </div> */}

      {/* Customer Loads Directory Table */}
      {/* <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Customer Loads Directory</h2>
            <p className="text-xs text-slate-500">Select any load to view real-time status and live telemetry tracking.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={listSearchQuery}
                onChange={(e) => setListSearchQuery(e.target.value)}
                placeholder="Filter loads..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {["all", "pending", "assigned", "dispatched", "in_transit", "delivered"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg capitalize text-3xs font-bold transition-all cursor-pointer ${
                    selectedStatusFilter === st
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-mono text-3xs uppercase tracking-wider border-y border-slate-100">
                <th className="px-4 py-3 font-bold">Load #</th>
                <th className="px-4 py-3 font-bold">Customer</th>
                <th className="px-4 py-3 font-bold">Route</th>
                <th className="px-4 py-3 font-bold">Trip &amp; Driver</th>
                <th className="px-4 py-3 font-bold">Customer Status</th>
                <th className="px-4 py-3 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-medium">
                    No matching customer loads found for this filter.
                  </td>
                </tr>
              ) : (
                filteredShipments.map((s) => {
                  const badge = getStatusBadge(s);
                  const isSelected = searchedShipment?.id === s.id;
                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? "bg-indigo-50/40" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-black text-slate-900">
                        #{s.trackingNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{s.customerName}</div>
                        <div className="text-3xs text-slate-400 font-mono">{s.cargoDescription}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        {s.originCity} <span className="text-slate-400">→</span> {s.destinationCity}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {s.tripId ? (
                          <div>
                            <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-3xs border border-indigo-200">
                              Trip #{s.tripId.replace("TRIP-", "")}
                            </span>
                            <span className="block text-3xs text-slate-600 font-semibold mt-0.5">
                              {s.driverName || "Assigned Driver"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-3xs italic font-medium">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-3xs border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSearchedShipment(s);
                            setSearchQuery(s.trackingNumber);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-3xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {isSelected ? "Tracking Active" : "Track Load"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div> */}

      {/* Main Results Section for Searched / Selected Load */}

      {searchedShipment ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Stepper Progress & Live Telemetry Map */}
          <div className="lg:col-span-8 space-y-6">
            {/* The 5-Stage Customer Tracking Stepper */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-lg font-black text-slate-900 font-mono tracking-tight">
                      Load #{searchedShipment.load_number}
                    </span>
                    <span
                      className={`text-3xs px-2.5 py-0.5 rounded-full border ${
                        getStatusBadge(searchedShipment).className
                      }`}
                    >
                      {getStatusBadge(searchedShipment).label}
                    </span>
                  </div>
                  <p className="text-3xs text-slate-400 mt-1 font-medium">
                    Shipper:{" "}
                    <span className="text-slate-700 font-semibold">
                      {searchedShipment.shipperName ||
                        searchedShipment.originCity}
                    </span>{" "}
                    • Consignee:{" "}
                    <span className="text-slate-700 font-semibold">
                      {searchedShipment.consigneeName ||
                        searchedShipment.destinationCity}
                    </span>
                  </p>
                </div>

                <div className="text-right bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-2xl transition-all shadow-xs">
                  <div className="flex items-center justify-end space-x-1.5 text-indigo-600 mb-0.5">
                    <Clock className="h-3.5 w-3.5 animate-pulse" />
                    <span className="text-[10px] font-extrabold font-mono uppercase tracking-wider text-indigo-700">
                      Dynamic Telemetry ETA
                    </span>
                  </div>
                  {(() => {
                    const dynamicEta = calculateDynamicEta();
                    if (!dynamicEta)
                      return (
                        <span className="text-xs font-bold text-slate-800 font-mono">
                          {new Date(searchedShipment.eta).toLocaleString()}
                        </span>
                      );
                    return (
                      <>
                        <span className="text-xs font-black text-slate-900 font-mono block tracking-tight">
                          {dynamicEta.etaString}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-600 block mt-0.5">
                          {dynamicEta.durationText
                            ? `${dynamicEta.durationText} (${dynamicEta.milesLeft} mi @ ${dynamicEta.speedMph} MPH)`
                            : dynamicEta.message}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* 5-Step Customer Progress Pipeline Stepper */}
              <div className="relative py-4">
                <div className="hidden md:block absolute top-[27px] left-[10%] right-[10%] h-1 bg-slate-100 -z-10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500 transition-all duration-1000"
                    style={{
                      width: `${
                        getTrackingSteps(searchedShipment).filter(
                          (s) => s.status === "completed"
                        ).length === 5
                          ? 100
                          : (getTrackingSteps(searchedShipment).filter(
                              (s) => s.status === "completed"
                            ).length /
                              4) *
                            100
                      }%`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                  {getTrackingSteps(searchedShipment).map((step, idx) => {
                    const isCompleted = step.status === "completed";
                    const isActive = step.status === "active";
                    return (
                      <div
                        key={idx}
                        className="flex md:flex-col items-start md:items-center text-left md:text-center space-x-3 md:space-x-0 relative group"
                      >
                        <div
                          className={`flex-shrink-0 h-10 w-10 rounded-full border-2 bg-white flex items-center justify-center transition-all shadow-sm ${
                            isCompleted
                              ? "border-emerald-500 text-emerald-500 bg-emerald-50 shadow-emerald-100"
                              : isActive
                              ? "border-indigo-600 text-indigo-600 bg-indigo-50 animate-pulse ring-4 ring-indigo-100 shadow-indigo-100"
                              : "border-slate-200 text-slate-300 bg-slate-50"
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="h-5 w-5 stroke-[3]" />
                          ) : isActive ? (
                            <div className="h-3 w-3 bg-indigo-600 rounded-full animate-ping" />
                          ) : (
                            <span className="text-xs font-mono font-bold">
                              {idx + 1}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 mt-0 md:mt-3 flex-1">
                          <h4
                            className={`text-2xs font-extrabold tracking-tight ${
                              isCompleted
                                ? "text-slate-800"
                                : isActive
                                ? "text-indigo-900"
                                : "text-slate-400"
                            }`}
                          >
                            {step.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 leading-tight font-normal md:max-w-[130px] md:mx-auto">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Real-time calculated telemetry summary */}
              {(() => {
                const dynamicEta = calculateDynamicEta();
                if (!dynamicEta) return null;
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gradient-to-br from-slate-900 to-slate-950 p-4 rounded-2xl text-white border border-slate-850">
                    <div className="space-y-1">
                      <span className="text-[9px] text-indigo-300 font-mono font-bold uppercase tracking-widest block">
                        REMAINING DISTANCE
                      </span>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-lg font-black font-mono text-white">
                          {dynamicEta.milesLeft}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold font-mono">
                          MILES TO GO
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Based on active GPS coordinates
                      </p>
                    </div>

                    <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
                      <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-widest block">
                        TELEMETRY SPEED
                      </span>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-lg font-black font-mono text-emerald-400">
                          {dynamicEta.speedMph}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold font-mono">
                          MPH INSTANT
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Live feedback from truck transponder
                      </p>
                    </div>

                    <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
                      <span className="text-[9px] text-indigo-300 font-mono font-bold uppercase tracking-widest block">
                        DYNAMIC ETA
                      </span>
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-[11px] font-black font-mono text-white truncate max-w-[160px]">
                          {dynamicEta.etaString}
                        </span>
                      </div>
                      <p className="text-[10px] text-indigo-300 font-mono font-bold">
                        {dynamicEta.durationText || "Ready"}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Waypoints sequence table summary */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xs font-bold text-slate-400 font-mono uppercase tracking-wider">
                    Verifiable Chain-Of-Custody Waypoints
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-slate-500">
                    Completed stops:{" "}
                    <span className="font-bold text-slate-800">
                      {searchedShipment.waypoints?.filter(
                        (w) => w.status === "completed"
                      ).length || 0}
                    </span>{" "}
                    / {searchedShipment.waypoints?.length || 0}
                  </span>
                </div>

                <div className="space-y-2">
                  {searchedShipment.waypoints?.map((wpt) => {
                    const isCompleted = wpt.status === "completed";
                    const isArrived = wpt.status === "arrived";
                    return (
                      <div
                        key={wpt.id}
                        className="bg-white border border-slate-100 p-2.5 rounded-xl flex items-center justify-between text-3xs"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-1.5 rounded-lg ${
                              isCompleted
                                ? "bg-emerald-50 text-emerald-600"
                                : isArrived
                                ? "bg-amber-50 text-amber-600"
                                : "bg-slate-50 text-slate-400"
                            }`}
                          >
                            {wpt.stopType === "pickup" ? (
                              <MapPin className="h-3.5 w-3.5" />
                            ) : wpt.stopType === "border_crossing" ? (
                              <ShieldCheck className="h-3.5 w-3.5" />
                            ) : (
                              <Truck className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                              <span>{wpt.companyName}</span>
                              <span className="text-[8px] uppercase bg-slate-100 text-slate-500 px-1 rounded-sm font-bold">
                                {wpt.stopType}
                              </span>
                            </div>
                            <div className="text-slate-400 font-medium">
                              {wpt.address}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`font-mono font-black uppercase text-[8px] px-1.5 py-0.5 rounded ${
                              isCompleted
                                ? "bg-emerald-100 text-emerald-800"
                                : isArrived
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {wpt.status}
                          </span>
                          {wpt.actualTime && (
                            <span className="block text-[8px] font-mono text-slate-400 mt-1">
                              {new Date(wpt.actualTime).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Live ELD Telemetry Simulation Screen */}
            <div className="bg-[#111317] border border-slate-800 rounded-3xl p-6 text-white space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                    <Activity className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold font-mono uppercase tracking-wider">
                      Samsara Cab Telemetry Terminal
                    </h3>
                    <p className="text-3xs text-slate-400 font-mono">
                      Live streaming cab diagnostics &amp; speed limit bounds
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-slate-400 block uppercase">
                      Satellite Poller
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {isAutoPolling ? `PING IN ${secondsLeft}S` : "MUTED"}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setIsAutoPolling(!isAutoPolling);
                      if (!isAutoPolling) setSecondsLeft(12);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-3xs font-mono font-bold uppercase transition-all cursor-pointer ${
                      isAutoPolling
                        ? "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                        : "bg-indigo-600 text-white hover:bg-indigo-500"
                    }`}
                  >
                    {isAutoPolling ? "Pause Polling" : "Resume Polling"}
                  </button>
                </div>
              </div>

              {/* Grid telemetry parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
                <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-mono block uppercase">
                    GPS LATITUDE
                  </span>
                  <span className="font-mono font-bold text-xs text-white block mt-1">
                    {simulatedLat.toFixed(5)}
                  </span>
                </div>
                <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-mono block uppercase">
                    GPS LONGITUDE
                  </span>
                  <span className="font-mono font-bold text-xs text-white block mt-1">
                    {simulatedLng.toFixed(5)}
                  </span>
                </div>
                <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-mono block uppercase">
                    SPEED VELOCITY
                  </span>
                  <span className="font-mono font-extrabold text-xs text-emerald-400 block mt-1">
                    {simulatedSpeed > 0
                      ? `${simulatedSpeed} MPH`
                      : "0 MPH (STOPPED)"}
                  </span>
                </div>
                <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-mono block uppercase">
                    HOS DRIVER STATUS
                  </span>
                  <span className="font-mono font-bold text-xs text-indigo-300 block mt-1 uppercase">
                    {searchedShipment.activeHOSStatus?.replace("_", " ") ||
                      "driving"}
                  </span>
                </div>
              </div>

              {/* Scrolling Sync Log list */}
              <div className="space-y-1.5">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest flex items-center space-x-1.5">
                  <RefreshCw
                    className={`h-3 w-3 ${isAutoPolling ? "animate-spin" : ""}`}
                  />
                  <span>Telemetry Feed Buffer Logs</span>
                </div>

                <div className="bg-black p-4 rounded-2xl border border-slate-800/80 font-mono text-[10px] text-slate-300 space-y-1.5 h-36 overflow-y-auto animate-fade-in">
                  {pollingLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={idx === 0 ? "text-emerald-400 font-bold" : ""}
                    >
                      {idx === 0 && (
                        <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 animate-ping" />
                      )}
                      {log}
                    </div>
                  ))}
                  {pollingLogs.length === 0 && (
                    <div className="text-slate-500">
                      Awaiting starting telemetry heartbeat signal...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* General FAQs Desk */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <HelpCircle className="h-4.5 w-4.5 text-indigo-500" />
                  <span>Logistics FAQ Desk</span>
                </h3>
                <p className="text-3xs text-slate-400">
                  Essential details regarding border clearance schedules &amp;
                  tracking latency
                </p>
              </div>

              <div className="space-y-2.5">
                {faqData.map((faq, idx) => {
                  const isOpen = activeFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-slate-150 rounded-xl overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => setActiveFaq(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between p-3.5 text-left bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <span className="text-xs font-bold text-slate-800">
                          {faq.q}
                        </span>
                        <span className="text-xs font-mono font-bold text-indigo-600">
                          {isOpen ? "−" : "+"}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="p-3.5 bg-white border-t border-slate-150 text-xs text-slate-600 leading-relaxed">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Manifest Summary & Alerts Subscription */}
          <div className="lg:col-span-4 space-y-6">
            {/* Instant Alerts Subscription form */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Instant Milestones Alerts
                  </h3>
                  <p className="text-3xs text-slate-400 leading-normal">
                    Subscribe to get instant Email/SMS alerts when milestones
                    transition.
                  </p>
                </div>
              </div>

              {subSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-3xs text-emerald-800 font-bold leading-normal">
                  {subMessage}
                </div>
              )}

              <form onSubmit={handleAlertSubscribe} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-3xs font-mono font-bold text-slate-400 uppercase">
                    Corporate Email
                  </label>
                  <input
                    type="email"
                    value={emailSub}
                    onChange={(e) => setEmailSub(e.target.value)}
                    placeholder="logistics@customer.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-3xs font-mono font-bold text-slate-400 uppercase">
                    Mobile Number (For SMS)
                  </label>
                  <input
                    type="tel"
                    value={phoneSub}
                    onChange={(e) => setPhoneSub(e.target.value)}
                    placeholder="+1 (555) 491-0391"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Save Alerts Subscription
                </button>
              </form>
            </div>

            {/* Gemini Dynamic Advisories */}
            <div className="bg-white rounded-3xl border border-[#D1E0FF] bg-gradient-to-b from-indigo-50/20 to-white shadow-sm p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/10">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    On-Demand AI Advisory
                  </h3>
                  <p className="text-3xs text-slate-400">
                    Compile a customer advisory email instantly using
                    server-side Gemini intelligence.
                  </p>
                </div>
              </div>

              <button
                onClick={handleGenerateAiReport}
                disabled={aiLoading}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
              >
                {aiLoading ? (
                  <>
                    <span className="animate-spin h-3.5 w-3.5 border-2 border-slate-400 border-t-white rounded-full" />
                    <span>Compiling Report...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Compile AI Advisory</span>
                  </>
                )}
              </button>

              {aiError && (
                <div className="p-3.5 bg-rose-50 border border-rose-150 rounded-2xl flex items-start space-x-2.5">
                  <AlertTriangle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-3xs font-black text-rose-800 uppercase font-mono">
                      Service Warning
                    </div>
                    <p className="text-3xs text-rose-700 mt-0.5 leading-normal">
                      {aiError}
                    </p>
                  </div>
                </div>
              )}

              {aiReport && (
                <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl animate-fade-in">
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="bg-slate-100/75 p-2.5 border-b border-slate-200 text-3xs space-y-1">
                      <div>
                        <span className="text-slate-400 font-mono font-bold uppercase">
                          To:
                        </span>{" "}
                        <span className="text-slate-700 font-semibold">
                          {searchedShipment.customerEmail ||
                            "logistics@customer.com"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-mono font-bold uppercase">
                          Subject:
                        </span>{" "}
                        <span className="text-indigo-900 font-bold">
                          {aiReport.subject}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 text-[11px] font-sans text-slate-700 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap bg-white select-text font-mono">
                      {aiReport.emailBody}
                    </div>
                  </div>

                  {aiReport.keyHighlights &&
                    aiReport.keyHighlights.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-slate-400 block font-mono uppercase tracking-wider">
                          Key Cargo Bulletins
                        </span>
                        <ul className="text-3xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed font-semibold">
                          {aiReport.keyHighlights.map((hl, idx) => (
                            <li key={idx} className="text-slate-700">
                              {hl}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-2.5 text-indigo-700 text-3xs leading-relaxed flex items-start space-x-2">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-indigo-500 mt-0.5" />
                    <span>
                      The template above represents live telemetry parsed via
                      Samsara GPS and Border Connect. Feel free to copy.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Manifest summary details */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest">
                Active Manifest Details
              </h3>

              <div className="grid grid-cols-2 gap-4 text-3xs font-mono">
                <div>
                  <span className="text-slate-400 block font-mono">
                    B.O.L. NUMBER
                  </span>
                  <span className="font-bold text-slate-800 block mt-0.5">
                    {searchedShipment.bolNumber || "BOL-381029"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-mono">
                    P.O. NUMBER
                  </span>
                  <span className="font-bold text-slate-800 block mt-0.5">
                    {searchedShipment.poNumber || "PO-294012"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-mono">
                    CARGO WEIGHT
                  </span>
                  <span className="font-bold text-slate-800 block mt-0.5">
                    {searchedShipment.weightLbs
                      ? `${searchedShipment.weightLbs.toLocaleString()} lbs`
                      : "7,400 lbs"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-mono">
                    PALLET COUNT
                  </span>
                  <span className="font-bold text-slate-800 block mt-0.5">
                    {searchedShipment.palletCount || 4} Pallets
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-mono">
                    LOAD TYPE
                  </span>
                  <span className="font-bold text-indigo-600 block mt-0.5">
                    {searchedShipment.loadType || "FTL"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-mono">
                    BORDER CLEARANCE
                  </span>
                  <span className="font-bold text-emerald-600 block mt-0.5">
                    {searchedShipment.borderConnectStatus?.toUpperCase() ||
                      "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Load Not Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No load matching query &ldquo;{searchQuery}&rdquo; was found. Please
            check your tracking number or B.O.L. reference.
          </p>
        </div>
      )}
    </div>
  );
}

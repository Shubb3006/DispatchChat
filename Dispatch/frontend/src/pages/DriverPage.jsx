import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useShipmentStore } from "../stores/useShipmentStore";
import { useMessageStore } from "../stores/useMessageStore";
import { useDocumentStore } from "../stores/useDocumentStore";
import { useHOSStore } from "../stores/useHOSStore";
import { useSafetyStore } from "../stores/useSafetyStore";
import { useAuthStore } from "../stores/useAuthStore";
import DriverApp from "../components/DriverApp";
import { Truck, LogOut } from "lucide-react";

export default function DriverPage() {
  const navigate = useNavigate();

  const shipments = useShipmentStore((state) => state.shipments);
  const fetchShipments = useShipmentStore((state) => state.fetchShipments);
  const updateShipment = useShipmentStore((state) => state.updateShipment);
  const updateShipmentStatus = useShipmentStore(
    (state) => state.updateShipmentStatus
  );

  const messages = useMessageStore((state) => state.messages);
  const fetchMessages = useMessageStore((state) => state.fetchMessages);
  const sendMessage = useMessageStore((state) => state.sendMessage);
  const markAsRead = useMessageStore((state) => state.markAsRead);

  const documents = useDocumentStore((state) => state.documents);
  const fetchDocuments = useDocumentStore((state) => state.fetchDocuments);
  const addDocument = useDocumentStore((state) => state.addDocument);
  const updateDocument = useDocumentStore((state) => state.updateDocument);

  const hosLog = useHOSStore((state) => state.hosLog);
  const fetchHOSLog = useHOSStore((state) => state.fetchHOSLog);
  const updateHOSLog = useHOSStore((state) => state.updateHOSLog);

  const addSafetyIncident = useSafetyStore((state) => state.addSafetyIncident);

  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    fetchShipments();
    fetchMessages();
    fetchDocuments();
    fetchHOSLog();
  }, [fetchShipments, fetchMessages, fetchDocuments, fetchHOSLog]);

  const handleAddDocument = async (newDoc) => {
    await addDocument(newDoc);
    if (newDoc.status === "approved") {
      const ship = shipments.find((s) => s.id === newDoc.shipmentId);
      if (ship && !ship.documentIds.includes(newDoc.id)) {
        const updatedShip = {
          ...ship,
          documentIds: [...ship.documentIds, newDoc.id],
        };
        await updateShipment(updatedShip);
      }
    }
  };

  const handleUpdateDocument = async (updatedDoc) => {
    await updateDocument(updatedDoc);
  };

  // const handleSendMessage = async (
  //   content,
  //   recipientId,
  //   shipmentId,
  //   attachment
  // ) => {
  //   const newMessage = {
  //     id: "MSG" + (messages.length + 101),
  //     senderRole: "driver",
  //     senderName: currentUser?.name || "Marcus Vance",
  //     recipientId: "DISP_OFFICE",
  //     recipientName: "Chief Dispatcher Keith",
  //     content,
  //     timestamp: new Date().toISOString(),
  //     read: false,
  //     shipmentId,
  //     attachment,
  //   };
  //   await sendMessage(newMessage);
  // };

  const handleSendMessage = async (
    text,
    recipientId,
    driverId,
    shipmentId,
    attachments = []
  ) => {
    await sendMessage({
      recipient_id: recipientId,
      driver_id: driverId,
      shipment_id: shipmentId,
      text,
      attachments,
    });
  };

  const handleUpdateHOSLog = async (updatedLog) => {
    console.log(updatedLog);
    await updateHOSLog(updatedLog);
  };

  const handleUpdateShipmentStatus = async (
    shipmentId,
    status,
    waypoints,
    borderConnectStatus
  ) => {
    await updateShipmentStatus(
      shipmentId,
      status,
      waypoints,
      borderConnectStatus
    );
  };

  const handleMarkMessagesAsRead = async (shipmentId, role) => {
    await markAsRead(shipmentId, role);
  };

  const handleAddSafetyIncident = async (incident) => {
    await addSafetyIncident(incident);
  };

  const handleUpdateShipment = async (updated) => {
    await updateShipment(updated);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans relative flex items-center justify-center p-4">
      {/* Ambient background grids */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none z-0" />

      {/* Outer UI Grid containing Phone on Center, and info panel on Left/Right for Desktop */}
      <div className="z-10 flex flex-col lg:flex-row items-center justify-center gap-8 max-w-6xl w-full h-full max-h-[95vh] relative">
        {/* Side Info Panel - Desktop only */}
        <div className="hidden lg:flex flex-col justify-between w-64 h-[750px] py-4 text-slate-300">
          <div className="space-y-4">
            <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl shadow-inner">
              <Truck className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white font-sans">
                OZACK MOBILE
              </h1>
              <p className="text-xs text-slate-400 font-medium tracking-wide uppercase font-mono mt-1">
                Driver App Companion
              </p>
            </div>
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <div className="text-xs">
                <span className="text-base-content block uppercase tracking-wider font-mono text-[10px]">
                  Driver Profile
                </span>
                <span className="font-bold text-slate-200 text-sm">
                  {currentUser?.name}
                </span>
              </div>
              <div className="text-xs">
                <span className="text-base-content block uppercase tracking-wider font-mono text-[10px]">
                  Duty Status
                </span>
                <span className="font-mono bg-emerald-950 text-emerald-400 border border-emerald-900 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  ELD SYNCED
                </span>
              </div>
              <div className="text-xs">
                <span className="text-base-content block uppercase tracking-wider font-mono text-[10px]">
                  Active Vehicle
                </span>
                <span className="font-bold text-slate-300 font-mono">
                  TRK-102 / TRL-504
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-semibold shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 group border-solid"
          >
            <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            <span>Sign Out Session</span>
          </button>
        </div>

        {/* Smartphone device shell mockup */}
        <div className="relative shrink-0 w-[385px] h-[780px] sm:w-[410px] sm:h-[830px] bg-slate-900 rounded-[50px] border-[12px] border-slate-800 shadow-2xl flex flex-col overflow-hidden ring-1 ring-slate-700/30">
          {/* Speaker & Notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-36 h-6 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center">
            <div className="w-12 h-1 bg-slate-950 rounded-full mb-1" />
          </div>

          {/* Simulated Phone Screen Contents */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC] text-base-content rounded-[38px] relative">
            {/* Phone Status Bar */}
            <div className="h-9 bg-slate-900 flex items-end justify-between px-7 text-3xs text-slate-400 select-none shrink-0 pb-1.5 z-40">
              <span className="font-bold font-mono">09:41</span>
              <div className="flex items-center gap-1.5">
                <span className="text-base-content text-[8px] font-mono">
                  SAMSARA
                </span>
                <div className="flex items-center gap-0.5">
                  <span className="w-[2px] h-1 bg-emerald-500 rounded-xs" />
                  <span className="w-[2px] h-1.5 bg-emerald-500 rounded-xs" />
                  <span className="w-[2px] h-2 bg-emerald-500 rounded-xs" />
                  <span className="w-[2px] h-2.5 bg-emerald-500 rounded-xs" />
                </div>
                <span className="font-mono text-emerald-500">5G</span>
                <div className="w-4 h-2 border border-slate-500 rounded-xs p-0.5 flex items-center">
                  <div className="w-full h-full bg-slate-400 rounded-2xs" />
                </div>
              </div>
            </div>

            {/* Real Driver App rendered directly */}
            <div className="flex-1 overflow-y-auto bg-[#F1F3F5]">
              <DriverApp
                currentUser={currentUser}
                shipments={shipments}
                messages={messages}
                documents={documents}
                hosLog={hosLog}
                onAddDocument={handleAddDocument}
                onUpdateDocument={handleUpdateDocument}
                onSendMessage={handleSendMessage}
                onUpdateHOSLog={handleUpdateHOSLog}
                onUpdateShipmentStatus={handleUpdateShipmentStatus}
                onMarkMessagesAsRead={handleMarkMessagesAsRead}
                onAddSafetyIncident={handleAddSafetyIncident}
                onUpdateShipment={handleUpdateShipment}
                isMobileMode={true}
              />
            </div>

            {/* Smartphone Home Indicator bar */}
            <div className="h-5 bg-slate-900 flex items-center justify-center shrink-0 z-40 pb-1">
              <div className="w-24 h-1 bg-slate-600 rounded-full" />
            </div>
          </div>
        </div>

        {/* Mobile-only Logout panel */}
        <div className="lg:hidden flex items-center justify-between w-full max-w-[385px] mt-4 z-10">
          <div className="text-2xs text-slate-400">
            Logged in as{" "}
            <span className="font-bold text-white">{currentUser?.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-rose-400 text-3xs font-bold font-mono uppercase tracking-wider"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

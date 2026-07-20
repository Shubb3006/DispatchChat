import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useShipmentStore } from "../stores/useShipmentStore";
import { useTripStore } from "../stores/useTripStore";
import { useMessageStore } from "../stores/useMessageStore";
import { useAuthStore } from "../stores/useAuthStore";
import { useDriverStore } from "../stores/useDriverstore";
import { useAssetStore } from "../stores/useAssetStore";
import { useCustomerStore } from "../stores/useCustomerStore";
import DispatcherDashboard from "../components/DispatcherDashboard";

export default function DispatcherPage() {
  const location = useLocation();
  const currentRole = location.pathname.replace("/", "") || "dispatcher";

  const shipments = useShipmentStore((state) => state.shipments);
  const fetchShipments = useShipmentStore((state) => state.fetchShipments);
  const addShipment = useShipmentStore((state) => state.addShipment);
  const updateShipment = useShipmentStore((state) => state.updateShipment);

  const trips = useTripStore((state) => state.trips);
  const fetchTrips = useTripStore((state) => state.fetchTrips);
  const addTrip = useTripStore((state) => state.addTrip);
  const updateTrip = useTripStore((state) => state.updateTrip);
  const removeTrip = useTripStore((state) => state.removeTrip);

  const messages = useMessageStore((state) => state.messages);
  const fetchMessages = useMessageStore((state) => state.fetchMessages);
  const sendMessage = useMessageStore((state) => state.sendMessage);
  const markAsRead = useMessageStore((state) => state.markAsRead);

  const fetchDrivers = useDriverStore((state) => state.fetchDrivers);
  const fetchTrucks = useAssetStore((state) => state.fetchTrucks);
  const fetchTrailors = useAssetStore((state) => state.fetchTrailors);
  const fetchCustomers = useCustomerStore((state) => state.fetchCustomers);

  const currentUser = useAuthStore((state) => state.currentUser);
  const isLoading = useShipmentStore((state) => state.isLoading);

  // Decentralized state fetching on mount in this page module
  useEffect(() => {
    fetchShipments();
    fetchTrips();
    fetchMessages();
    fetchDrivers();
    fetchTrucks();
    fetchTrailors();
    fetchCustomers();
  }, [
    fetchShipments,
    fetchTrips,
    fetchMessages,
    fetchDrivers,
    fetchTrucks,
    fetchTrailors,
    fetchCustomers,
  ]);

  const handleAddTrip = async (newTrip) => {
    await addTrip(newTrip);
  };

  const handleUpdateTrip = async (updated) => {
    await updateTrip(updated);
  };

  const handleRemoveTrip = async (tripId) => {
    await removeTrip(tripId);
  };

  // const handleAddShipment = async (newShipment) => {
  //   await addShipment(newShipment);
  // };

  const handleUpdateShipment = async (updated) => {
    await updateShipment(updated);
  };

  const handleSendMessage = async (
    content,
    recipientId,
    shipmentId,
    attachment
  ) => {
    const isDispatcher =
      currentRole === "dispatcher" ||
      currentRole === "data_entry" ||
      currentRole === "customs";
    const newMessage = {
      id: "MSG" + (messages.length + 101),
      senderRole: currentRole,
      senderName: isDispatcher
        ? "Chief Dispatcher Keith"
        : currentUser?.name || "User",
      recipientId: isDispatcher ? recipientId : "DISP_OFFICE",
      recipientName: isDispatcher ? "Marcus Vance" : "Chief Dispatcher Keith",
      content,
      timestamp: new Date().toISOString(),
      read: false,
      shipmentId,
      attachment,
    };
    await sendMessage(newMessage);
  };

  const handleMarkMessagesAsRead = async (shipmentId, role) => {
    await markAsRead(shipmentId, role);
  };

  if (isLoading && shipments.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6"
        id="dispatcher-loading-screen"
      >
        <div className="relative flex items-center justify-center mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          <div className="absolute h-8 w-8 bg-blue-500/10 rounded-full animate-ping"></div>
        </div>
        <h3 className="text-lg font-semibold tracking-wide text-slate-200">
          Synchronizing Logistics Portal
        </h3>
        <p className="text-slate-400 text-sm mt-2 animate-pulse">
          Fetching active loads, manifests and assets...
        </p>
      </div>
    );
  }

  return (
    <DispatcherDashboard
      shipments={shipments}
      trips={trips}
      onAddTrip={handleAddTrip}
      onUpdateTrip={handleUpdateTrip}
      onRemoveTrip={handleRemoveTrip}
      messages={messages}
      onUpdateShipment={handleUpdateShipment}
      onSendMessage={handleSendMessage}
      onMarkMessagesAsRead={handleMarkMessagesAsRead}
      currentUser={currentUser}
    />
  );
}

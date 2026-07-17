import { useLocation } from "react-router-dom";
import { useShipmentStore } from "../store/useShipmentStore";
import { useTripStore } from "../store/useTripStore";
import { useMessageStore } from "../store/useMessageStore";
import { useAuthStore } from "../store/useAuthStore";
import DispatcherDashboard from "../components/DispatcherDashboard";

export default function DispatcherPage() {
  const location = useLocation();
  const currentRole = location.pathname.replace("/", "") || "dispatcher";

  const shipments = useShipmentStore((state) => state.shipments);
  const addShipment = useShipmentStore((state) => state.addShipment);
  const updateShipment = useShipmentStore((state) => state.updateShipment);

  const trips = useTripStore((state) => state.trips);
  const addTrip = useTripStore((state) => state.addTrip);
  const updateTrip = useTripStore((state) => state.updateTrip);
  const removeTrip = useTripStore((state) => state.removeTrip);

  const messages = useMessageStore((state) => state.messages);
  const sendMessage = useMessageStore((state) => state.sendMessage);
  const markAsRead = useMessageStore((state) => state.markAsRead);

  const currentUser = useAuthStore((state) => state.currentUser);

  const handleAddTrip = async (newTrip) => {
    await addTrip(newTrip);
  };

  const handleUpdateTrip = async (updated) => {
    await updateTrip(updated);
  };

  const handleRemoveTrip = async (tripId) => {
    await removeTrip(tripId);
  };

  const handleAddShipment = async (newShipment) => {
    await addShipment(newShipment);
  };

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

  return (
    <DispatcherDashboard
      shipments={shipments}
      trips={trips}
      onAddTrip={handleAddTrip}
      onUpdateTrip={handleUpdateTrip}
      onRemoveTrip={handleRemoveTrip}
      messages={messages}
      onAddShipment={handleAddShipment}
      onUpdateShipment={handleUpdateShipment}
      onSendMessage={handleSendMessage}
      onMarkMessagesAsRead={handleMarkMessagesAsRead}
      currentUser={currentUser}
    />
  );
}

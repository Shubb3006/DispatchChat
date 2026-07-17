import { useShipmentStore } from "../store/useShipmentStore";
import { useMessageStore } from "../store/useMessageStore";
import { useHOSStore } from "../store/useHOSStore";
import { useSafetyStore } from "../store/useSafetyStore";
import { useAuthStore } from "../store/useAuthStore";
import DriverManagerHub from "../components/DriverManagerHub";

export default function DriverManagerPage() {
  const shipments = useShipmentStore((state) => state.shipments);
  const messages = useMessageStore((state) => state.messages);
  const sendMessageStore = useMessageStore((state) => state.sendMessage);
  const markAsRead = useMessageStore((state) => state.markAsRead);
  const hosLogs = useHOSStore((state) => state.hosLogs);
  const safetyScores = useSafetyStore((state) => state.safetyScores);
  const currentUser = useAuthStore((state) => state.currentUser);

  // Since this is the Driver Manager module page, the active role is "driver_manager"
  const currentRole = "driver_manager";

  const handleSendMessage = async (
    content,
    recipientId,
    shipmentId,
    attachment
  ) => {
    const newMessage = {
      id: "MSG" + (messages.length + 101),
      senderRole: currentRole,
      senderName: currentUser?.name || "Driver Manager Office",
      recipientId: recipientId || "DRV001",
      recipientName: "Marcus Vance",
      content,
      timestamp: new Date().toISOString(),
      read: false,
      shipmentId,
      attachment,
    };
    await sendMessageStore(newMessage);
  };

  const handleMarkMessagesAsRead = async (shipmentId, role) => {
    await markAsRead(shipmentId, role);
  };

  return (
    <DriverManagerHub
      shipments={shipments}
      messages={messages}
      hosLogs={hosLogs}
      safetyScores={safetyScores}
      onSendMessage={handleSendMessage}
      onMarkMessagesAsRead={handleMarkMessagesAsRead}
      currentRole={currentRole}
      currentUser={currentUser}
    />
  );
}

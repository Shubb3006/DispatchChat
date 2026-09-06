import { useLocation } from "react-router-dom";
import { useEffect, useCallback } from "react";
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
  const updateShipment = useShipmentStore((state) => state.updateShipment);
  const fetchPendingBOLs = useShipmentStore((state) => state.fetchPendingBOLs);
  const pendingBOLs = useShipmentStore((state) => state.pendingBOLs);
  const approveBOL = useShipmentStore((state) => state.approveBOL);

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

  // Fetch all data once on mount — Zustand actions are stable references so
  // there is no need to list them as dependencies (they never change identity).
  useEffect(() => {
    fetchShipments();
    fetchTrips();
    fetchMessages();
    fetchDrivers();
    fetchTrucks();
    fetchTrailors();
    fetchCustomers();
    fetchPendingBOLs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // useCallback prevents new function references on every render, which would
  // force DispatcherDashboard to re-render even when nothing relevant changed.
  const handleApprove = useCallback(async (loadId, documentId) => {
    const res = await approveBOL(loadId, documentId);
    if (res.success) {
      alert("BOL Approved! Load status successfully updated to PICKED_UP.");
      fetchPendingBOLs();
    } else {
      alert(`Error approving BOL: ${res.error}`);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Returns the saved trip so the caller can use the server-allocated
  // trip_number when stamping the consolidated loads.
  const handleAddTrip = useCallback(async (newTrip) => {
    return await addTrip(newTrip);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdateTrip = useCallback(async (updated) => {
    await updateTrip(updated);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRemoveTrip = useCallback(async (tripId) => {
    await removeTrip(tripId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdateShipment = useCallback(async (updated) => {
    await updateShipment(updated);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendMessage = useCallback(async (
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
  }, [currentRole, currentUser]); // these are stable/primitive values

  const handleMarkMessagesAsRead = useCallback(async (shipmentId, role) => {
    await markAsRead(shipmentId, role);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <DispatcherDashboard
        shipments={shipments}
        onAddTrip={handleAddTrip}
        onUpdateTrip={handleUpdateTrip}
        onRemoveTrip={handleRemoveTrip}
        messages={messages}
        onUpdateShipment={handleUpdateShipment}
        onSendMessage={handleSendMessage}
        onMarkMessagesAsRead={handleMarkMessagesAsRead}
        currentUser={currentUser}
        pendingBOLs={pendingBOLs}
        handleApprove={handleApprove}
      />

      {/* SECTION: Unapproved BOL Verification Queue */}

      {/* SECTION: Master Active Loads Board */}
      {/* <div className="bg-white p-5 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Active Loads Pipeline
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-100 text-xs text-gray-600 uppercase">
                <th className="p-3">Load #</th>
                <th className="p-3">Customer Email</th>
                <th className="p-3">Route</th>
                <th className="p-3">Current Status</th>
                <th className="p-3">Advance Status</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((load) => (
                <tr key={load.id} className="border-b hover:bg-gray-50 text-sm">
                  <td className="p-3 font-medium">{load.load_number}</td>
                  <td className="p-3 text-gray-600">{load.customer_email}</td>
                  <td className="p-3 text-gray-600">
                    {load.shipper_address} to {load.consignee_address}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        load.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : load.status === "PICKED_UP"
                          ? "bg-blue-100 text-blue-800"
                          : load.status === "DELIVERED"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {load.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <select
                      value={load.status}
                      onChange={(e) =>
                        updateLoadStatus(load.id, e.target.value)
                      }
                      className="border border-gray-300 rounded p-1.5 text-xs bg-white"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="PICKED_UP">PICKED UP</option>
                      <option value="DISPATCHED">DISPATCHED</option>
                      <option value="IN_TRANSIT">IN TRANSIT</option>
                      <option value="REACHED_WAREHOUSE">
                        REACHED WAREHOUSE
                      </option>
                      <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                      <option value="DELIVERED">DELIVERED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div> */}
    </>
  );
}

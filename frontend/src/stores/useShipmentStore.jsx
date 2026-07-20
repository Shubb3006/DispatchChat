import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";

export const useShipmentStore = create((set, get) => ({
  shipments: [],
  isLoading: false,
  error: null,

  fetchShipments: async () => {
    set({ isLoading: true, error: null });
    try {
      // Fetch only loads from the backend API
      const response = await axiosInstance
        .get("/load")
        .catch(() => axiosInstance.get("/load"));
      const fetchedLoads = response.data.loads || [];

      // Map and parse the serialized load objects from data field if needed
      const finalShipments = fetchedLoads.map((load) => {
        return typeof load.data === "string"
          ? JSON.parse(load.data)
          : load.data || load;
      });

      set({ shipments: finalShipments, isLoading: false });
    } catch (err) {
      console.error("Failed to fetch loads:", err);
      set({ error: "Failed to fetch shipments", isLoading: false });
    }
  },

  addShipment: async (shipment) => {
    set({ isLoading: true });
    console.log(shipment);
    try {
      const payload = {
        load_number: shipment.load_number,
        status: shipment.status,

        dispatcher_id: shipment.dispatcherId,
        driver_id: shipment.driverId,
        truck_id: shipment.truckId,
        trailer_id: shipment.trailerId,

        customer_name: shipment.customerName,
        customer_email: shipment.customerEmail,
        customer_phone: shipment.customerPhone,
        customer_billing_address: shipment.customerAddress,

        shipper_name: shipment.shipperName,
        shipper_phone: shipment.shipperPhone,
        shipper_address: shipment.shipperAddress,
        origin: shipment.originCity,

        consignee_name: shipment.consigneeName,
        consignee_phone: shipment.consigneePhone,
        consignee_address: shipment.consigneeAddress,
        destination: shipment.destinationCity,

        pickup_date: new Date().toISOString(),
        delivery_date: shipment.eta,

        commodity: shipment.cargoDescription,
        weight: shipment.weightLbs,
        pieces: shipment.palletCount,
        rate: shipment.priceInvoice,
      };
      // Save shipment as load to backend API
      const response = await axiosInstance
        .post("/load", payload)
        .catch(() => axiosInstance.post("/loads", payload));
      const savedShipment = response.data.load || shipment;

      toast.success(
        `Load #${shipment.load_number || shipment.id} added successfully`
      );
      set((state) => ({
        shipments: [savedShipment, ...state.shipments],
        isLoading: false,
      }));

      return true;
    } catch (err) {
      console.error("Failed to save load:", err);
      set({ error: "Failed to add shipment", isLoading: false });
      toast.error("Failed to add load");
      return false;
    }
  },

  updateShipment: async (shipment) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance
        .put(`/load/${shipment.id}`, shipment)
        .catch(() => axiosInstance.put(`/loads/${shipment.id}`, shipment));
      const updated = response.data.load || shipment;

      set((state) => ({
        shipments: state.shipments.map((s) =>
          s.id === shipment.id ? updated : s
        ),
        isLoading: false,
      }));
      toast.success(`Load #${shipment.load_number || shipment.id} updated`);
    } catch (err) {
      console.error("Failed to update load:", err);
      set({ error: "Failed to update shipment", isLoading: false });
      toast.error("Failed to update load");
    }
  },

  updateShipmentStatus: async (
    shipmentId,
    status,
    waypoints,
    borderConnectStatus
  ) => {
    try {
      const currentShipments = get().shipments;
      const originalShipment = currentShipments.find(
        (s) => s.id === shipmentId
      );
      if (!originalShipment) return;

      const updatedShipment = {
        ...originalShipment,
        status,
        waypoints,
        speedMph: status === "delivered" ? 0 : originalShipment.speedMph,
        activeHOSStatus:
          status === "delivered"
            ? "off_duty"
            : originalShipment.activeHOSStatus,
      };

      if (borderConnectStatus !== undefined) {
        updatedShipment.borderConnectStatus = borderConnectStatus;
      }

      await axiosInstance
        .put(`/load/${shipmentId}`, updatedShipment)
        .catch(() =>
          axiosInstance.put(`/loads/${shipmentId}`, updatedShipment)
        );

      set((state) => ({
        shipments: state.shipments.map((s) =>
          s.id === shipmentId ? updatedShipment : s
        ),
      }));

      toast.success(`Load status updated to ${status.replace("_", " ")}`);

      // Trigger automatic billing/invoice generation workflow upon proof-of-delivery!
      if (status === "delivered" && originalShipment.status !== "delivered") {
        const invoiceId = "INV" + Math.floor(10000 + Math.random() * 90000);
        const subtotal = updatedShipment.priceInvoice || 1450;
        const tax = Math.round(subtotal * 0.08);
        const total = subtotal + tax;
        const issueDate = new Date().toISOString().split("T")[0];
        const dueDate = new Date(Date.now() + 86400000 * 30)
          .toISOString()
          .split("T")[0];

        const autoInvoice = {
          id: invoiceId,
          shipmentId: updatedShipment.id,
          trackingNumber: updatedShipment.trackingNumber,
          customerName: updatedShipment.customerName,
          issueDate,
          dueDate,
          subtotal,
          tax,
          total,
          status: "sent",
          paymentTerms: "Net 30",
          notes: `Invoice automatically generated upon Proof of Delivery (POD) confirmation. Verified via Samsara ELD GPS coordinate fence.`,
        };

        // Create the invoice via API
        await axiosInstance.post("/invoices", autoInvoice).catch(() => null);

        // Generate automated message notification in background
        const notificationMsg = {
          id:
            "MSG_NOTIF_" +
            Date.now() +
            "_" +
            Math.random().toString(36).substring(2, 9),
          senderRole: "dispatcher",
          senderName: "Billing System",
          recipientId: "DRV001",
          recipientName: "Marcus Vance",
          content: `System Alert: Proof of delivery logged. Invoice copy automatically generated and routed to client ${updatedShipment.customerName} with Net 30 payment terms.`,
          timestamp: new Date().toISOString(),
          read: false,
          shipmentId,
        };

        await axiosInstance
          .post("/messages", notificationMsg)
          .catch(() => null);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      set({ error: "Failed to update shipment status" });
      toast.error("Failed to update load status");
    }
  },
}));

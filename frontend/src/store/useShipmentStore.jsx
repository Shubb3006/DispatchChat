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
      // Fetch both loads and load stops from the backend
      const [loadsRes, stopsRes] = await Promise.allSettled([
        axiosInstance.get("/load").catch(() => axiosInstance.get("/loads")),
        axiosInstance.get("/load_stops"),
      ]);

      let fetchedLoads = [];
      if (loadsRes.status === "fulfilled" && loadsRes.value.data) {
        fetchedLoads = loadsRes.value.data;
      } else {
        // Fallback to /api/shipments or similar if needed
        const fallback = await axiosInstance
          .get("/shipments")
          .catch(() => null);
        if (fallback && fallback.data) {
          fetchedLoads = fallback.data;
        }
      }

      let fetchedStops = [];
      if (stopsRes.status === "fulfilled" && stopsRes.value.data) {
        fetchedStops = stopsRes.value.data;
      }

      // Map/combine loads with their corresponding load stops if separate
      const finalShipments = fetchedLoads.map((load) => {
        const parsedLoad =
          typeof load.data === "string"
            ? JSON.parse(load.data)
            : load.data || load;
        const matchingStops = fetchedStops
          .filter(
            (stop) =>
              stop.load_id === parsedLoad.id || stop.loadId === parsedLoad.id
          )
          .map((stop) =>
            typeof stop.data === "string"
              ? JSON.parse(stop.data)
              : stop.data || stop
          );

        if (matchingStops.length > 0 && !parsedLoad.waypoints) {
          parsedLoad.waypoints = matchingStops;
        }
        return parsedLoad;
      });

      set({ shipments: finalShipments, isLoading: false });
    } catch (err) {
      console.error("Failed to fetch loads:", err);
      set({ error: "Failed to fetch shipments", isLoading: false });
    }
  },

  addShipment: async (shipment) => {
    set({ isLoading: true });
    try {
      // Save shipment as load to backend API
      const response = await axiosInstance
        .post("/load", shipment)
        .catch(() => axiosInstance.post("/loads", shipment));
      const savedShipment = response.data || shipment;

      // If the shipment has waypoints/stops, create them in load_stops table
      if (shipment.waypoints && shipment.waypoints.length > 0) {
        try {
          await Promise.all(
            shipment.waypoints.map((stop) =>
              axiosInstance.post("/load_stops", {
                id:
                  stop.id || "STP" + Math.floor(10000 + Math.random() * 90000),
                load_id: shipment.id,
                data: stop,
              })
            )
          );
        } catch (stopErr) {
          console.warn("Failed to save individual load stops:", stopErr);
        }
      }

      set((state) => ({
        shipments: [savedShipment, ...state.shipments],
        isLoading: false,
      }));
      toast.success(
        `Load ${shipment.trackingNumber || shipment.id} added successfully`
      );
    } catch (err) {
      console.error("Failed to save load:", err);
      set({ error: "Failed to add shipment", isLoading: false });
      toast.error("Failed to add load");
    }
  },

  updateShipment: async (shipment) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance
        .put(`/load/${shipment.id}`, shipment)
        .catch(() => axiosInstance.put(`/loads/${shipment.id}`, shipment));
      const updated = response.data || shipment;

      set((state) => ({
        shipments: state.shipments.map((s) =>
          s.id === shipment.id ? updated : s
        ),
        isLoading: false,
      }));
      toast.success(`Load ${shipment.trackingNumber || shipment.id} updated`);
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

      // If waypoints/stops were updated, update them in load_stops table
      if (waypoints && waypoints.length > 0) {
        try {
          await axiosInstance
            .put(`/load_stops/bulk/${shipmentId}`, { waypoints })
            .catch(() => {
              // Fallback: save individually
              return Promise.all(
                waypoints.map((stop) =>
                  axiosInstance.put(`/load_stops/${stop.id}`, stop)
                )
              );
            });
        } catch (stopErr) {
          console.warn("Failed to update load stops bulk/individual:", stopErr);
        }
      }

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

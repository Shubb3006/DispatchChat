import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";
import { useShipmentStore } from "./useShipmentStore";

export const useTripStore = create((set, get) => ({
  trips: [],
  isLoading: false,
  error: null,

  fetchTrips: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/trips");
      const tripsData = response.data.trips || [];
      const parsedTrips = tripsData.map((item) =>
        typeof item.data === "string"
          ? JSON.parse(item.data)
          : item.data || item
      );
      set({ trips: parsedTrips, isLoading: false });
    } catch (err) {
      console.warn("Failed to fetch trips from /trips:", err.message);
      // Fallback to shipments as trips if /trips does not exist
      try {
        const fallback = await axiosInstance.get("/loads");
        if (fallback && fallback.data) {
          const parsed = fallback.data.map((item) =>
            typeof item.data === "string"
              ? JSON.parse(item.data)
              : item.data || item
          );
          set({ trips: parsed, isLoading: false });
          return;
        }
      } catch (fbErr) {
        // no-op
      }
      set({ error: "Failed to fetch trips", isLoading: false });
    }
  },

  addTrip: async (trip) => {
    // trip_number is deliberately NOT sent: the server allocates it from a
    // sequence so concurrent dispatchers can't land on the same number.
    const payLoad = {
      driver_id: trip.driverId,
      driver_name: trip.driverName,
      status: trip.status,
      totalWeightLbs: trip.totalWeightLbs,
      totalPallets: trip.totalPallets,
      shipmentIds: trip.shipmentIds,
    };
    set({ isLoading: true });
    try {
      const response = await axiosInstance.post("/trips", payLoad);
      const savedTrip = response.data.trip || trip;
      set((state) => ({
        trips: [savedTrip, ...state.trips],
        isLoading: false,
      }));

      // The trip is routed at creation. Report what actually came back rather
      // than a blanket success, so a routing failure isn't mistaken for miles.
      if (savedTrip.route_error) {
        toast.success(`Trip #${savedTrip.trip_number} created`);
        toast.error(`Route unavailable: ${savedTrip.route_error}`, { duration: 8000 });
      } else if (savedTrip.total_miles) {
        toast.success(
          `Trip #${savedTrip.trip_number} created — ${savedTrip.total_miles} mi routed`
        );
      } else {
        toast.success(`Trip #${savedTrip.trip_number} created`);
      }
      return savedTrip;
    } catch (err) {
      console.error("Failed to add trip:", err);
      const msg = err?.response?.data?.message || "Failed to add trip";
      set({ error: msg, isLoading: false });
      toast.error(msg);
      return null;
    }
  },

  // Trip sheet for printing. Reuses the route stored at consolidation so a
  // reprint always matches the original; refresh=true deliberately re-routes.
  fetchTripSheet: async (tripId, { refresh = false } = {}) => {
    try {
      const res = await axiosInstance.get(
        `/trips/${tripId}/route${refresh ? "?refresh=true" : ""}`
      );
      return res.data;
    } catch (err) {
      console.error("Failed to load trip sheet:", err);
      toast.error(err?.response?.data?.message || "Failed to load trip sheet");
      return null;
    }
  },

  updateTrip: async (trip) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.put(`/trips/${trip.id}`, trip);
      const updated = response.data.trip || trip;
      set((state) => ({
        trips: state.trips.map((t) => (t.id === trip.id ? updated : t)),
        isLoading: false,
      }));

      // useShipmentStore.getState().setShipments((shipments) =>
      //   shipments.map((shipment) =>
      //     updatedTrip.shipment_ids.includes(shipment.id)
      //       ? { ...shipment, status: updatedTrip.status }
      //       : shipment
      //   )
      // );
      toast.success(`Trip updated`);
    } catch (err) {
      console.error("Failed to update trip:", err);
      set({ error: "Failed to update trip", isLoading: false });
      toast.error("Failed to update trip");
    }
  },

  removeTrip: async (tripId) => {
    set({ isLoading: true });
    try {
      await axiosInstance.delete(`/trips/${tripId}`);
      set((state) => ({
        trips: state.trips.filter((t) => t.id !== tripId),
        isLoading: false,
      }));
      toast.success("Trip removed");
      await useShipmentStore.getState().fetchShipments();
    } catch (err) {
      console.error("Failed to delete trip:", err);
      set({ error: "Failed to delete trip", isLoading: false });
      toast.error("Failed to remove trip");
    }
  },
}));

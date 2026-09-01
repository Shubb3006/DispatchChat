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
    console.log("Ss");
    const payLoad = {
      trip_number: trip.tripNumber,
      driver_id: trip.driverId,
      driver_name: trip.driverName,
      status: trip.status,
      totalWeightLbs: trip.totalWeightLbs,
      totalPallets: trip.totalPallets,
      shipmentIds: trip.shipmentIds,
    };
    console.log(payLoad)
    set({ isLoading: true });
    try {
      const response = await axiosInstance.post("/trips", payLoad);
      const savedTrip = response.data.trip || trip;
      set((state) => ({
        trips: [savedTrip, ...state.trips],
        isLoading: false,
      }));
      toast.success(`Trip added successfully`);
      // await useShipmentStore.getState().fetchShipments();
    } catch (err) {
      console.error("Failed to add trip:", err);
      set({ error: "Failed to add trip", isLoading: false });
      toast.error("Failed to add trip");
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

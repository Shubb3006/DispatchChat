import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";


const FALLBACK_LOCATIONS = [
  {
    id: "LOC001",
    companyName: "AeroParts Toronto HQ",
    address: "400 Britannia Rd E, Mississauga, ON L4Z 1X9",
    lat: 43.626,
    lng: -79.673,
  },
  {
    id: "LOC002",
    companyName: "Bendix Distribution Center",
    address: "2230 Meadowvale Blvd, Mississauga, ON L5N 6H1",
    lat: 43.601,
    lng: -79.749,
  },
  {
    id: "LOC003",
    companyName: "Sarnia-Port Huron Border Crossing",
    address: "Blue Water Bridge, Sarnia, ON N7T 7H2",
    lat: 42.997,
    lng: -82.422,
  },
  {
    id: "LOC004",
    companyName: "Midwest Aero Chicago Assembly",
    address: "1000 Assembly Dr, Chicago, IL 60601",
    lat: 41.878,
    lng: -87.629,
  },
];

export const useLocationStore = create((set, get) => ({
  locations: FALLBACK_LOCATIONS,
  isLoading: false,
  error: null,

  fetchLocations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/locations");
      const data = response.data || [];
      const parsedData = data.map((item) =>
        typeof item.data === "string"
          ? JSON.parse(item.data)
          : item.data || item
      );
      if (parsedData.length > 0) {
        set({ locations: parsedData, isLoading: false });
      } else {
        set({ locations: FALLBACK_LOCATIONS, isLoading: false });
      }
    } catch (err) {
      console.warn("Failed to fetch locations, using fallback:", err.message);
      set({ locations: FALLBACK_LOCATIONS, isLoading: false });
    }
  },

  addLocation: async (location) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.post("/locations", location);
      const saved = response.data || location;
      set((state) => ({
        locations: [saved, ...state.locations],
        isLoading: false,
      }));
      toast.success(`Location ${location.companyName} added successfully`);
    } catch (err) {
      console.error("Failed to add location:", err);
      set({ error: "Failed to add location", isLoading: false });
      toast.error("Failed to add location");
    }
  },

  updateLocation: async (location) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.put(
        `/locations/${location.id}`,
        location
      );
      const updated = response.data || location;
      set((state) => ({
        locations: state.locations.map((l) =>
          l.id === location.id ? updated : l
        ),
        isLoading: false,
      }));
      toast.success(`Location ${location.companyName} updated`);
    } catch (err) {
      console.error("Failed to update location:", err);
      set({ error: "Failed to update location", isLoading: false });
      toast.error("Failed to update location");
    }
  },

  deleteLocation: async (id) => {
    set({ isLoading: true });
    try {
      await axiosInstance.delete(`/locations/${id}`);
      set((state) => ({
        locations: state.locations.filter((l) => l.id !== id),
        isLoading: false,
      }));
      toast.success("Location removed");
    } catch (err) {
      console.error("Failed to delete location:", err);
      set({ error: "Failed to delete location", isLoading: false });
      toast.error("Failed to remove location");
    }
  },
}));

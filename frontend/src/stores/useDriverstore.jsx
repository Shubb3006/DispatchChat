import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/axios";

export const useDriverStore = create((set, get) => ({
  drivers: [],
  isLoading: false,
  error: null,

  fetchDrivers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/drivers");
      const data = response.data.drivers || [];
      const parsedData = data.map((item) =>
        typeof item.data === "string"
          ? JSON.parse(item.data)
          : item.data || item
      );
      set({ drivers: parsedData, isLoading: false });
    } catch (err) {
      console.warn("Failed to fetch drivers, using fallback:", err.message);
      set({ isLoading: false });
    }
  },

  addDriver: async (driver) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.post("/drivers", driver);
      const saved = response.data || driver;
      set((state) => ({
        drivers: [saved, ...state.drivers],
        isLoading: false,
      }));
      toast.success(`Driver ${driver.name} created successfully`);
    } catch (err) {
      console.error("Failed to add driver:", err);
      set({ error: "Failed to add driver", isLoading: false });
      toast.error("Failed to create driver");
    }
  },

  updateDriver: async (driver) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.put(`/drivers/${driver.id}`, driver);
      const updated = response.data || driver;
      set((state) => ({
        drivers: state.drivers.map((d) => (d.id === driver.id ? updated : d)),
        isLoading: false,
      }));
      toast.success(`Driver ${driver.name} updated`);
    } catch (err) {
      console.error("Failed to update driver:", err);
      set({ error: "Failed to update driver", isLoading: false });
      toast.error("Failed to update driver");
    }
  },

  deleteDriver: async (id) => {
    set({ isLoading: true });
    try {
      await axiosInstance.delete(`/drivers/${id}`);
      set((state) => ({
        drivers: state.drivers.filter((d) => d.id !== id),
        isLoading: false,
      }));
      toast.success("Driver deleted");
    } catch (err) {
      console.error("Failed to delete driver:", err);
      set({ error: "Failed to delete driver", isLoading: false });
      toast.error("Failed to delete driver");
    }
  },
}));

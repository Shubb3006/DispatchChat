import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/axios";

const FALLBACK_DRIVERS = [
  {
    id: "DRV001",
    name: "Marcus Vance",
    truck: "TRK-102",
    trailer: "TRL-504",
    score: 96,
    status: "active",
  },
  {
    id: "DRV002",
    name: "Sarah Jenkins",
    truck: "TRK-215",
    trailer: "TRL-309",
    score: 92,
    status: "active",
  },
  {
    id: "DRV003",
    name: "Rajesh Patel",
    truck: "TRK-145",
    trailer: "TRL-802",
    score: 88,
    status: "active",
  },
  {
    id: "DRV004",
    name: "Alex Rodriguez",
    truck: "TRK-302",
    trailer: "TRL-220",
    score: 79,
    status: "active",
  },
  {
    id: "DRV005",
    name: "Yuri Gromyko",
    truck: "TRK-188",
    trailer: "TRL-415",
    score: 95,
    status: "active",
  },
];

export const useDriverStore = create((set, get) => ({
  drivers: FALLBACK_DRIVERS,
  isLoading: false,
  error: null,

  fetchDrivers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/drivers");
      const data = response.data || [];
      const parsedData = data.map((item) =>
        typeof item.data === "string"
          ? JSON.parse(item.data)
          : item.data || item
      );
      if (parsedData.length > 0) {
        set({ drivers: parsedData, isLoading: false });
      } else {
        set({ drivers: FALLBACK_DRIVERS, isLoading: false });
      }
    } catch (err) {
      console.warn("Failed to fetch drivers, using fallback:", err.message);
      set({ drivers: FALLBACK_DRIVERS, isLoading: false });
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

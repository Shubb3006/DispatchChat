import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/axios";
import nishanFleetData from "../data/nishanFleetData.json";

const FALLBACK_DRIVERS = (nishanFleetData.drivers || []).map((d) => ({
  id: d.driver_code,
  driver_code: d.driver_code,
  name: d.name,
  first_name: d.first_name,
  last_name: d.last_name,
  email: d.email,
  phone_number: d.phone_number,
  license_number: d.license_number,
  license_state: d.license_state,
  license_expiry: d.license_expiry,
  citizenship: d.citizenship,
  fast_id: d.fast_id,
  travel_doc_number: d.travel_doc_number,
  terminal: d.terminal,
  status: d.status.toLowerCase(),
  current_duty_status: d.current_duty_status,
}));

export const useDriverStore = create((set, get) => ({
  drivers: FALLBACK_DRIVERS,
  isLoading: false,
  error: null,

  fetchDrivers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/drivers");
      const data = response.data.drivers || response.data || [];
      const parsedData = Array.isArray(data)
        ? data.map((raw) => {
            const item = typeof raw.data === "string" ? JSON.parse(raw.data) : (raw.data || raw);
            const fullName = item.name || item.full_name || [item.first_name, item.last_name].filter(Boolean).join(" ") || item.username || item.driver_code || "Driver";
            return {
              ...item,
              id: item.id || item.driver_code,
              driver_code: item.driver_code || item.id,
              name: fullName,
              full_name: fullName,
              phone_number: item.phone_number || item.phone || "",
              email: item.email || "",
              status: (item.status || "available").toLowerCase(),
              current_duty_status: item.current_duty_status || "OFF",
              assigned_truck_number: item.assigned_truck_number || "TRK-Unassigned",
              assigned_trailer_number: item.assigned_trailer_number || "TRL-Unassigned",
            };
          })
        : [];
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

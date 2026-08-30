import { create } from "zustand";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";

export const useEtaRadarStore = create((set, get) => ({
  summary: {
    totalTrackedShipments: 0,
    onTimeCount: 0,
    delayedCount: 0,
    onTimeFleetPct: null,
    activeCorridorsMonitored: 0,
    severeWeatherAlertsCount: 0,
    borderCrossingsMonitored: 0,
    averageBorderWaitMinutes: null,
    liveSamsaraConnectedTractors: 0,
  },
  trackedShipments: [],
  borderPorts: [],
  weatherCorridors: [],
  selectedShipment: null,
  isLoading: false,
  isRecalculating: false,
  lastUpdated: null,

  fetchRadarData: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/eta-radar/overview");
      if (res.data?.success) {
        set({
          summary: res.data.summary || get().summary,
          trackedShipments: res.data.trackedShipments || [],
          borderPorts: res.data.borderPorts || [],
          weatherCorridors: res.data.weatherCorridors || [],
          lastUpdated: res.data.timestamp || new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn("fetchRadarData fallback:", err.message);
    } finally {
      set({ isLoading: false });
    }
  },

  recalculateRadar: async () => {
    set({ isRecalculating: true });
    try {
      const res = await axiosInstance.post("/eta-radar/recalculate");
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        set({
          summary: d.summary || get().summary,
          trackedShipments: d.trackedShipments || [],
          borderPorts: d.borderPorts || [],
          weatherCorridors: d.weatherCorridors || [],
          lastUpdated: d.timestamp || new Date().toISOString(),
        });
        toast.success("🛰️ Predictive ETA & Weather Radar Recalculated!", { duration: 4000 });
      }
    } catch (err) {
      toast.error("Failed to recalculate radar");
    } finally {
      set({ isRecalculating: false });
    }
  },

  setSelectedShipment: (shipment) => {
    set({ selectedShipment: shipment });
  },
}));

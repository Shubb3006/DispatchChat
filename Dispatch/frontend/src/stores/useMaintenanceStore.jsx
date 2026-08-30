import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL } from "@/lib/apiBase";

const API_BASE = `${API_BASE_URL}/v1/maintenance`;

export const useMaintenanceStore = create((set, get) => ({
  summary: {
    totalTractorsMonitored: 330,
    activeEngineFaultsCount: 3,
    criticalFaultsCount: 1,
    warningFaultsCount: 1,
    overduePmServicesCount: 1,
    activeWorkOrdersCount: 1,
    fleetHealthIndexPct: 88,
  },
  activeFaultCodes: [],
  fleetPmSchedule: [],
  workOrders: [],
  isLoading: false,
  isCreatingWorkOrder: false,

  fetchMaintenanceData: async () => {
    set({ isLoading: true });
    try {
      const res = await axios.get(`${API_BASE}/overview`, { withCredentials: true });
      if (res.data?.success && res.data.data) {
        set({
          summary: res.data.data.summary,
          activeFaultCodes: res.data.data.activeFaultCodes || [],
          fleetPmSchedule: res.data.data.fleetPmSchedule || [],
          workOrders: res.data.data.workOrders || [],
        });
      }
    } catch (err) {
      console.warn("Using fallback local maintenance data:", err.message);
      // Fallback state if server unreachable
    } finally {
      set({ isLoading: false });
    }
  },

  createWorkOrder: async (orderData) => {
    set({ isCreatingWorkOrder: true });
    try {
      const res = await axios.post(`${API_BASE}/work-orders`, orderData, { withCredentials: true });
      if (res.data?.success) {
        toast.success(`Work Order #${res.data.workOrder.id} created for Tractor #${orderData.truckNumber}!`);
        await get().fetchMaintenanceData();
        return res.data.workOrder;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create work order");
    } finally {
      set({ isCreatingWorkOrder: false });
    }
  },

  updateWorkOrderStatus: async (workOrderId, status) => {
    try {
      const res = await axios.patch(`${API_BASE}/work-orders/${workOrderId}`, { status }, { withCredentials: true });
      if (res.data?.success) {
        toast.success(`Work Order #${workOrderId} updated to ${status}`);
        await get().fetchMaintenanceData();
      }
    } catch (err) {
      toast.error("Failed to update work order");
    }
  },

  clearFaultCode: async (faultId, notes) => {
    try {
      const res = await axios.post(`${API_BASE}/clear-fault`, { faultId, notes }, { withCredentials: true });
      if (res.data?.success) {
        toast.success(`Fault ${faultId} cleared & marked resolved!`);
        await get().fetchMaintenanceData();
      }
    } catch (err) {
      toast.error("Failed to clear fault code");
    }
  },
}));

import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL } from "@/lib/apiBase";

const API_BASE = `${API_BASE_URL}/settlements`;

export const useSettlementStore = create((set, get) => ({
  settlements: [],
  selectedSettlement: null,
  stats: {},
  filters: {
    driver_id: "ALL",
    status: "ALL",
    search: "",
  },
  pagination: {
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 1,
  },
  isLoading: false,
  error: null,

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 },
    }));
    get().fetchSettlements();
  },

  fetchSettlements: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filters, pagination } = get();
      const params = new URLSearchParams();
      params.append("page", pagination.page);
      params.append("limit", pagination.limit);

      if (filters.driver_id && filters.driver_id !== "ALL") params.append("driver_id", filters.driver_id);
      if (filters.status && filters.status !== "ALL") params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);

      const res = await axios.get(`${API_BASE}?${params.toString()}`, { withCredentials: true });
      if (res.data?.success) {
        set({
          settlements: res.data.settlements || [],
          pagination: res.data.pagination || pagination,
        });
      } else {
        throw new Error(res.data?.message || "Unexpected response from settlements API");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      set({ error: msg });
      toast.error(`Failed to load settlements: ${msg}`);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSettlementStats: async () => {
    try {
      const res = await axios.get(`${API_BASE}/stats`, { withCredentials: true });
      if (res.data?.success && res.data.stats) {
        set({ stats: res.data.stats });
      }
    } catch (err) {
      console.warn("Failed to fetch settlement stats:", err.message);
    }
  },

  generateSettlement: async (settlementPayload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post(API_BASE, settlementPayload, { withCredentials: true });
      if (res.data?.success && res.data.settlement) {
        set((state) => ({
          settlements: [res.data.settlement, ...state.settlements],
        }));
        toast.success(`Settlement ${res.data.settlement.settlement_number} created!`);
        get().fetchSettlementStats();
        return res.data.settlement;
      }
      throw new Error(res.data?.message || "Settlement was not created by the server");
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      set({ error: msg });
      toast.error(`Failed to generate settlement: ${msg}`);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  updateSettlementStatus: async (id, newStatus) => {
    try {
      await axios.put(`${API_BASE}/${id}/status`, { status: newStatus }, { withCredentials: true });
      set((state) => ({
        settlements: state.settlements.map((s) =>
          s.id === id ? { ...s, status: newStatus.toUpperCase() } : s
        ),
      }));
      toast.success(`Settlement marked as ${newStatus.toUpperCase()}`);
      get().fetchSettlementStats();
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      set({ error: msg });
      toast.error(`Failed to update settlement status: ${msg}`);
    }
  },
}));

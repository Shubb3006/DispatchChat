import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE = "http://localhost:5555/api/audit-logs";

export const useAuditStore = create((set, get) => ({
  auditLogs: [],
  selectedEntityLogs: [],
  stats: {
    totalToday: 0,
    activeUsers: [],
    topActions: [],
    entityBreakdown: [],
    recentCritical: [],
  },
  filters: {
    entity_type: "ALL",
    action: "ALL",
    username: "ALL",
    search: "",
    startDate: "",
    endDate: "",
  },
  pagination: {
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 1,
  },
  isLoading: false,
  isEntityLoading: false,

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 },
    }));
    get().fetchAuditLogs();
  },

  setPage: (page) => {
    set((state) => ({
      pagination: { ...state.pagination, page },
    }));
    get().fetchAuditLogs();
  },

  fetchAuditLogs: async () => {
    set({ isLoading: true });
    try {
      const { filters, pagination } = get();
      const params = new URLSearchParams();
      params.append("page", pagination.page);
      params.append("limit", pagination.limit);

      if (filters.entity_type && filters.entity_type !== "ALL") params.append("entity_type", filters.entity_type);
      if (filters.action && filters.action !== "ALL") params.append("action", filters.action);
      if (filters.username && filters.username !== "ALL") params.append("username", filters.username);
      if (filters.search) params.append("search", filters.search);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const res = await axios.get(`${API_BASE}?${params.toString()}`, {
        withCredentials: true,
      });

      if (res.data?.success) {
        set({
          auditLogs: res.data.logs || [],
          pagination: res.data.pagination || pagination,
        });
      }
    } catch (err) {
      console.warn("Failed to fetch audit logs:", err.message);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAuditStats: async () => {
    try {
      const res = await axios.get(`${API_BASE}/stats`, {
        withCredentials: true,
      });
      if (res.data?.success) {
        set({ stats: res.data.stats });
      }
    } catch (err) {
      console.warn("Failed to fetch audit stats:", err.message);
    }
  },

  fetchEntityAuditLogs: async (entityType, entityId) => {
    if (!entityId) return [];
    set({ isEntityLoading: true });
    try {
      const res = await axios.get(`${API_BASE}/entity/${entityType}/${entityId}`, {
        withCredentials: true,
      });
      if (res.data?.success) {
        set({ selectedEntityLogs: res.data.logs || [] });
        return res.data.logs || [];
      }
      return [];
    } catch (err) {
      console.warn("Failed to fetch entity audit trail:", err.message);
      return [];
    } finally {
      set({ isEntityLoading: false });
    }
  },

  recordClientAction: async ({
    action,
    entity_type,
    entity_id,
    entity_identifier,
    change_summary,
    details = {},
    username = null,
    user_role = null,
  }) => {
    try {
      const res = await axios.post(
        API_BASE,
        {
          action,
          entity_type,
          entity_id,
          entity_identifier,
          change_summary,
          details,
          username,
          user_role,
        },
        { withCredentials: true }
      );
      if (res.data?.success) {
        // Refresh logs in background
        get().fetchAuditLogs();
        get().fetchAuditStats();
      }
    } catch (err) {
      console.warn("Failed to log client action:", err.message);
    }
  },
}));

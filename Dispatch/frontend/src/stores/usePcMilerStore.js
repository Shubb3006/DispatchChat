import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL } from "@/lib/apiBase";

const API_BASE = `${API_BASE_URL}/pcmiler`;

/* Every value rendered by the PC*MILER screens comes from the routing API.
   There is deliberately no seeded/default route here: showing a plausible
   looking lane before anything has been calculated is exactly the invented
   data this store used to ship. A failed call clears the route and keeps the
   server's own message so the UI can name the stop that could not be resolved. */

const toRouteError = (err) => {
  const data = err?.response?.data;
  if (data && data.success === false) {
    return {
      code: data.code || "REQUEST_FAILED",
      message: data.message || err.message,
      address: data.address || null,
    };
  }
  return { code: "REQUEST_FAILED", message: err?.message || "Request failed", address: null };
};

export const usePcMilerStore = create((set, get) => ({
  currentRoute: null,
  comparisonData: null,
  jurisdictionsList: [],
  isLoading: false,
  error: null,

  calculateRoute: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post(`${API_BASE}/calculate-route`, params, { withCredentials: true });
      if (res.data?.success && res.data.route) {
        set({ currentRoute: res.data.route, error: null });
        return res.data.route;
      }
      const error = {
        code: res.data?.code || "REQUEST_FAILED",
        message: res.data?.message || "The routing service returned no route.",
        address: res.data?.address || null,
      };
      set({ currentRoute: null, error });
      toast.error(error.message);
      return null;
    } catch (err) {
      const error = toRouteError(err);
      set({ currentRoute: null, error });
      toast.error(error.message);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  compareTolls: async (params) => {
    set({ isLoading: true });
    try {
      const res = await axios.post(`${API_BASE}/compare-tolls`, params, { withCredentials: true });
      if (res.data?.success && res.data.comparison) {
        set({ comparisonData: res.data.comparison });
        return res.data.comparison;
      }
      set({ comparisonData: null });
      return null;
    } catch (err) {
      console.warn("Failed to compare routes:", err.message);
      set({ comparisonData: null });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchJurisdictionMatrix: async () => {
    try {
      const res = await axios.get(`${API_BASE}/jurisdictions`, { withCredentials: true });
      if (res.data?.success && res.data.jurisdictions) {
        set({ jurisdictionsList: res.data.jurisdictions });
      }
    } catch (err) {
      console.warn("Failed to fetch jurisdictions:", err.message);
    }
  },

  clearRouteError: () => set({ error: null }),
}));

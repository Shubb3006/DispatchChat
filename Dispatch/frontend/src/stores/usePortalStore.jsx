import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/axios";

// Customer/Broker portal state. Kept separate from useAuthStore on purpose:
// the portal is its own surface (own login, own routes) and portal users must
// never inherit staff-app state or navigation.
export const usePortalStore = create((set, get) => ({
  portalUser: null,
  isCheckingAuth: true,
  isLoggingIn: false,
  isLoading: false,

  rateRequests: [],
  loads: [],
  loadsTotal: 0,

  isSubmittingRate: false,
  isUploadingTender: false,
  isUploadingCustoms: false,

  // --- Session -------------------------------------------------------------

  checkPortalAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const res = await axiosInstance.get("/auth/check");
      const user = res.data;
      if (user && user.role === "customer" && user.customer_id) {
        set({ portalUser: user, isCheckingAuth: false });
        return true;
      }
      set({ portalUser: null, isCheckingAuth: false });
      return false;
    } catch (e) {
      set({ portalUser: null, isCheckingAuth: false });
      return false;
    }
  },

  portalLogin: async (username, password) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/customer-login", { username, password });
      if (res.data?.success) {
        set({ portalUser: res.data.user });
        toast.success(`Welcome, ${res.data.user.company_name || res.data.user.username}`);
        return true;
      }
      return false;
    } catch (error) {
      toast.error(error.response?.data?.message || "Sign in failed");
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  portalLogout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch (e) {
      // Session cookie is cleared server-side; local state resets regardless.
    }
    set({ portalUser: null, rateRequests: [], loads: [], loadsTotal: 0 });
  },

  // --- Rate requests ---------------------------------------------------------

  fetchRateRequests: async () => {
    try {
      const res = await axiosInstance.get("/rates");
      if (res.data?.success) set({ rateRequests: res.data.rate_requests });
    } catch (error) {
      console.warn("fetchRateRequests failed:", error.message);
    }
  },

  createRateRequest: async ({ origin, destination, freight_details }) => {
    set({ isSubmittingRate: true });
    try {
      const res = await axiosInstance.post("/rates/request", {
        origin,
        destination,
        freight_details,
      });
      if (res.data?.success) {
        set((state) => ({ rateRequests: [res.data.rate_request, ...state.rateRequests] }));
        toast.success("Rate request submitted — our dispatch team has been notified.");
        return true;
      }
      return false;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not submit rate request");
      return false;
    } finally {
      set({ isSubmittingRate: false });
    }
  },

  respondToRate: async (id, decision) => {
    try {
      const res = await axiosInstance.patch(`/rates/${id}/respond`, { decision });
      if (res.data?.success) {
        set((state) => ({
          rateRequests: state.rateRequests.map((r) => (r.id === id ? res.data.rate_request : r)),
        }));
        toast.success(decision === "ACCEPT" ? "Quote accepted — you can now upload your load tender." : "Quote rejected.");
        return true;
      }
      return false;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update the quote");
      return false;
    }
  },

  // --- Loads -----------------------------------------------------------------

  fetchPortalLoads: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/loads/customer-loads");
      if (res.data?.success) {
        set({ loads: res.data.loads, loadsTotal: res.data.totalCount });
      }
    } catch (error) {
      console.warn("fetchPortalLoads failed:", error.message);
    } finally {
      set({ isLoading: false });
    }
  },

  uploadTender: async (file, rateRequestId = null) => {
    set({ isUploadingTender: true });
    try {
      const formData = new FormData();
      formData.append("tender", file);
      if (rateRequestId) formData.append("rate_request_id", rateRequestId);

      const res = await axiosInstance.post("/loads/tender-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000, // Gemini parse + retries can take a while
      });

      if (res.data?.success) {
        if (res.data.extraction_source === "gemini-ai") {
          toast.success(`Load #${res.data.load_number} created from your tender.`, { duration: 6000 });
        } else {
          toast.error(
            `⚠️ Load #${res.data.load_number} was created with FALLBACK data — the AI could not read your PDF. Our team will verify the details.`,
            { duration: 10000 }
          );
        }
        await Promise.all([get().fetchPortalLoads(), get().fetchRateRequests()]);
        return res.data;
      }
      return null;
    } catch (error) {
      toast.error(error.response?.data?.message || "Tender upload failed");
      return null;
    } finally {
      set({ isUploadingTender: false });
    }
  },

  uploadCustomsDoc: async (loadId, file) => {
    set({ isUploadingCustoms: true });
    try {
      const formData = new FormData();
      formData.append("document", file);
      const res = await axiosInstance.post(`/loads/${loadId}/customs-upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success) {
        toast.success("Customs paperwork uploaded.");
        return res.data.document;
      }
      return null;
    } catch (error) {
      toast.error(error.response?.data?.message || "Customs upload failed");
      return null;
    } finally {
      set({ isUploadingCustoms: false });
    }
  },
}));

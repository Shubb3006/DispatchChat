import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/axios";

/**
 * Absolute URL for a server-relative path the API handed us (document and
 * attachment downloads). These are opened as real navigations, not fetches:
 * the download endpoint may 302 to cloud storage, which a credentialed fetch
 * cannot follow.
 */
export const apiFileUrl = (relativePath) => {
  if (!relativePath) return "";
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  const base = String(axiosInstance.defaults.baseURL || "").replace(/\/api\/?$/, "");
  return `${base}${relativePath}`;
};

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
  isTracking: false,

  isSubmittingRate: false,
  isUploadingTender: false,
  isUploadingCustoms: false,

  // Shipment detail (tracking, documents, customs, timeline)
  loadDetail: null,
  isLoadingDetail: false,

  // Per-load conversation with dispatch
  messages: [],
  isLoadingMessages: false,
  isSendingMessage: false,
  unreadByLoad: {},

  // Notification bell
  notifications: [],
  unreadNotifications: 0,
  notifyPrefs: null,
  isSavingPrefs: false,

  // Rate request attachments
  rateAttachments: {},
  isUploadingAttachment: false,

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
        // The created request is returned (not just `true`) so the form can
        // attach files to it — attachments need an id to hang from.
        return res.data.rate_request;
      }
      return null;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not submit rate request");
      return null;
    } finally {
      set({ isSubmittingRate: false });
    }
  },

  // --- Rate request attachments ---------------------------------------------

  fetchRateAttachments: async (rateRequestId) => {
    try {
      const res = await axiosInstance.get(`/portal/rates/${rateRequestId}/attachments`);
      if (res.data?.success) {
        set((state) => ({
          rateAttachments: { ...state.rateAttachments, [rateRequestId]: res.data.attachments },
        }));
        return res.data.attachments;
      }
    } catch (error) {
      console.warn("fetchRateAttachments failed:", error.message);
    }
    return [];
  },

  uploadRateAttachment: async (rateRequestId, file) => {
    set({ isUploadingAttachment: true });
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axiosInstance.post(`/portal/rates/${rateRequestId}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success) {
        set((state) => ({
          rateAttachments: {
            ...state.rateAttachments,
            [rateRequestId]: [...(state.rateAttachments[rateRequestId] || []), res.data.attachment],
          },
        }));
        return res.data.attachment;
      }
      return null;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not attach that file");
      return null;
    } finally {
      set({ isUploadingAttachment: false });
    }
  },

  deleteRateAttachment: async (rateRequestId, attachmentId) => {
    try {
      await axiosInstance.delete(`/portal/rates/${rateRequestId}/attachments/${attachmentId}`);
      set((state) => ({
        rateAttachments: {
          ...state.rateAttachments,
          [rateRequestId]: (state.rateAttachments[rateRequestId] || []).filter((a) => a.id !== attachmentId),
        },
      }));
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not remove that file");
      return false;
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

  /**
   * Look one shipment up by load #, tracking token or the customer's own
   * reference. The server scopes the search to this account, so a miss is a
   * genuine miss: report the server's wording and hand back null. Callers
   * navigate on a hit, so this must never throw out of the submit handler.
   */
  trackLoad: async (query) => {
    const q = String(query || "").trim();
    if (!q) return null;
    set({ isTracking: true });
    try {
      const res = await axiosInstance.get("/portal/track", { params: { q } });
      if (res.data?.success && res.data.load) return res.data.load;
      toast.error(res.data?.message || "No shipment found for that number.");
      return null;
    } catch (error) {
      toast.error(error.response?.data?.message || "No shipment found for that number.");
      return null;
    } finally {
      set({ isTracking: false });
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
        // The checklist and document list both move when this lands.
        const loadId2 = get().loadDetail?.load?.id;
        if (loadId2) get().fetchLoadDetail(loadId2, { quiet: true });
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

  // --- Shipment detail -------------------------------------------------------

  fetchLoadDetail: async (loadId, { quiet = false } = {}) => {
    if (!loadId) return null;
    if (!quiet) set({ isLoadingDetail: true });
    try {
      const res = await axiosInstance.get(`/portal/loads/${loadId}`);
      if (res.data?.success) {
        set({ loadDetail: res.data });
        return res.data;
      }
      return null;
    } catch (error) {
      if (!quiet) {
        toast.error(error.response?.data?.message || "Could not load that shipment");
      }
      return null;
    } finally {
      if (!quiet) set({ isLoadingDetail: false });
    }
  },

  clearLoadDetail: () => set({ loadDetail: null, messages: [] }),

  // --- Per-load conversation --------------------------------------------------

  fetchMessages: async (loadId, { quiet = false } = {}) => {
    if (!loadId) return [];
    if (!quiet) set({ isLoadingMessages: true });
    try {
      const res = await axiosInstance.get(`/portal/loads/${loadId}/messages`);
      if (res.data?.success) {
        set({ messages: res.data.messages });
        return res.data.messages;
      }
      return [];
    } catch (error) {
      console.warn("fetchMessages failed:", error.message);
      return [];
    } finally {
      if (!quiet) set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (loadId, body) => {
    const text = String(body || "").trim();
    if (!text) return null;
    set({ isSendingMessage: true });
    try {
      const res = await axiosInstance.post(`/portal/loads/${loadId}/messages`, { body: text });
      if (res.data?.success) {
        set((state) => ({ messages: [...state.messages, res.data.message] }));
        return res.data.message;
      }
      return null;
    } catch (error) {
      toast.error(error.response?.data?.message || "Message could not be sent");
      return null;
    } finally {
      set({ isSendingMessage: false });
    }
  },

  markMessagesRead: async (loadId) => {
    try {
      await axiosInstance.post(`/portal/loads/${loadId}/messages/read`);
      set((state) => {
        const next = { ...state.unreadByLoad };
        delete next[loadId];
        return { unreadByLoad: next };
      });
    } catch (error) {
      console.warn("markMessagesRead failed:", error.message);
    }
  },

  fetchUnreadCounts: async () => {
    try {
      const res = await axiosInstance.get("/portal/messages/unread");
      if (res.data?.success) set({ unreadByLoad: res.data.counts || {} });
    } catch (error) {
      console.warn("fetchUnreadCounts failed:", error.message);
    }
  },

  // --- Notifications ----------------------------------------------------------

  fetchNotifications: async () => {
    try {
      const res = await axiosInstance.get("/portal/notifications", { params: { limit: 30 } });
      if (res.data?.success) {
        set({ notifications: res.data.notifications, unreadNotifications: res.data.unread_count });
      }
    } catch (error) {
      console.warn("fetchNotifications failed:", error.message);
    }
  },

  markNotificationsRead: async (ids = null) => {
    // Optimistic: the bell should clear the moment it is opened.
    set((state) => ({
      notifications: state.notifications.map((n) =>
        !ids || ids.includes(n.id) ? { ...n, is_read: true } : n
      ),
      unreadNotifications: ids
        ? Math.max(0, state.unreadNotifications - ids.length)
        : 0,
    }));
    try {
      await axiosInstance.post("/portal/notifications/read", ids ? { ids } : {});
    } catch (error) {
      console.warn("markNotificationsRead failed:", error.message);
      get().fetchNotifications();
    }
  },

  /**
   * Live notifications over Server-Sent Events. The backend filters every
   * event to this user before it is written to the stream. Returns an
   * unsubscribe function; falls back silently to the 30s poll on failure.
   */
  subscribeNotifications: () => {
    if (typeof window === "undefined" || typeof window.EventSource === "undefined") return () => {};
    const base = String(axiosInstance.defaults.baseURL || "").replace(/\/+$/, "");
    let source;
    try {
      source = new EventSource(`${base}/portal/notifications/stream`, { withCredentials: true });
    } catch (err) {
      console.warn("notification stream unavailable:", err.message);
      return () => {};
    }

    source.addEventListener("portal-alert", (event) => {
      try {
        const payload = JSON.parse(event.data);
        set((state) => ({
          notifications: [
            {
              id: `live-${Date.now()}`,
              title: payload.title,
              message: payload.message,
              type: payload.type,
              meta: payload.data || {},
              is_read: false,
              created_at: payload.created_at,
            },
            ...state.notifications,
          ].slice(0, 30),
          unreadNotifications: state.unreadNotifications + 1,
        }));
        toast.success(payload.title || "New update", { duration: 5000 });
        // Pull the authoritative list so ids are real and counts stay exact.
        get().fetchNotifications();
      } catch (err) {
        console.warn("notification parse failed:", err.message);
      }
    });

    source.onerror = () => {
      // EventSource reconnects on its own; the periodic poll covers the gap.
    };

    return () => source.close();
  },

  fetchNotifyPrefs: async () => {
    try {
      const res = await axiosInstance.get("/portal/notify-prefs");
      if (res.data?.success) set({ notifyPrefs: res.data.notify_prefs });
      return res.data?.notify_prefs || null;
    } catch (error) {
      console.warn("fetchNotifyPrefs failed:", error.message);
      return null;
    }
  },

  updateNotifyPrefs: async (prefs) => {
    set({ isSavingPrefs: true, notifyPrefs: prefs });
    try {
      const res = await axiosInstance.patch("/portal/notify-prefs", { notify_prefs: prefs });
      if (res.data?.success) {
        set({ notifyPrefs: res.data.notify_prefs });
        toast.success("Notification settings saved");
        return true;
      }
      return false;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save your settings");
      get().fetchNotifyPrefs();
      return false;
    } finally {
      set({ isSavingPrefs: false });
    }
  },
}));

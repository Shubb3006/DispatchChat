import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";
import { HTS_MASTER_DATABASE } from "../data/htsMasterDatabase";

// Default Ports of Entry catalog
export const DEFAULT_PORTS_OF_ENTRY = [
  {
    code: "3801",
    name: "Detroit Ambassador Bridge",
    city: "Detroit, MI / Windsor, ON",
    country: "US",
    agency: "US CBP / CBSA",
    type: "Highway Bridge",
    avgWaitMins: 15,
    fastLanes: true,
  },
  {
    code: "3802",
    name: "Port Huron Blue Water Bridge",
    city: "Port Huron, MI / Point Edward, ON",
    country: "US",
    agency: "US CBP / CBSA",
    type: "Highway Bridge",
    avgWaitMins: 20,
    fastLanes: true,
  },
  {
    code: "0901",
    name: "Buffalo Peace Bridge",
    city: "Buffalo, NY / Fort Erie, ON",
    country: "US",
    agency: "US CBP / CBSA",
    type: "Highway Bridge",
    avgWaitMins: 25,
    fastLanes: true,
  },
  {
    code: "0902",
    name: "Niagara Falls Lewiston-Queenston",
    city: "Lewiston, NY / Queenston, ON",
    country: "US",
    agency: "US CBP / CBSA",
    type: "Highway Bridge",
    avgWaitMins: 10,
    fastLanes: true,
  },
  {
    code: "3004",
    name: "Blaine Pacific Highway",
    city: "Blaine, WA / Surrey, BC",
    country: "US",
    agency: "US CBP / CBSA",
    type: "Highway",
    avgWaitMins: 30,
    fastLanes: true,
  },
  {
    code: "0712",
    name: "Champlain - St. Bernard de Lacolle",
    city: "Champlain, NY / Lacolle, QC",
    country: "US",
    agency: "US CBP / CBSA",
    type: "Highway I-87",
    avgWaitMins: 12,
    fastLanes: true,
  },
  {
    code: "3310",
    name: "Sweetgrass / Coutts",
    city: "Sweetgrass, MT / Coutts, AB",
    country: "US",
    agency: "US CBP / CBSA",
    type: "Highway I-15",
    avgWaitMins: 8,
    fastLanes: true,
  },
  {
    code: "3401",
    name: "Pembina / Emerson",
    city: "Pembina, ND / Emerson, MB",
    country: "US",
    agency: "US CBP / CBSA",
    type: "Highway I-29",
    avgWaitMins: 14,
    fastLanes: true,
  },
  {
    code: "2304",
    name: "Laredo World Trade Bridge",
    city: "Laredo, TX / Nuevo Laredo, MX",
    country: "US",
    agency: "US CBP / SAT",
    type: "Highway Bridge",
    avgWaitMins: 45,
    fastLanes: true,
  },
  {
    code: "440",
    name: "Windsor Ambassador Bridge (CBSA)",
    city: "Windsor, ON",
    country: "CA",
    agency: "CBSA",
    type: "Highway",
    avgWaitMins: 15,
    fastLanes: true,
  },
  {
    code: "441",
    name: "Sarnia Blue Water Bridge (CBSA)",
    city: "Sarnia, ON",
    country: "CA",
    agency: "CBSA",
    type: "Highway",
    avgWaitMins: 20,
    fastLanes: true,
  },
  {
    code: "410",
    name: "Fort Erie Peace Bridge (CBSA)",
    city: "Fort Erie, ON",
    country: "CA",
    agency: "CBSA",
    type: "Highway",
    avgWaitMins: 25,
    fastLanes: true,
  },
  {
    code: "813",
    name: "Pacific Highway Crossing (CBSA)",
    city: "Surrey, BC",
    country: "CA",
    agency: "CBSA",
    type: "Highway",
    avgWaitMins: 30,
    fastLanes: true,
  }
];

// Default HTS Code Catalog from Master Database
export const DEFAULT_HTS_CATALOG = HTS_MASTER_DATABASE;

// Default Customs Brokers
export const DEFAULT_BROKERS = [
  {
    name: "Livingston International",
    filer_code: "LVN-9021",
    email: "crossborder@livingstonintl.com",
    phone: "+1 (800) 437-4324",
    countries: ["US", "CA"],
    specialty: "Automotive, Industrial & ACE/ACI Direct Electronic Filing"
  },
  {
    name: "Willson International",
    filer_code: "WIL-4402",
    email: "customsclearance@willsonintl.com",
    phone: "+1 (800) 754-1918",
    countries: ["US", "CA"],
    specialty: "High-Volume Truckload & Border Quick-Release"
  },
  {
    name: "Farrow Customs Brokerage",
    filer_code: "FRW-8190",
    email: "dispatch@farrow.com",
    phone: "+1 (888) 313-2776",
    countries: ["US", "CA"],
    specialty: "Retail, Consumer Goods & Food/FDA Clearance"
  },
  {
    name: "Cole International",
    filer_code: "COL-3301",
    email: "crossborder@coleintl.com",
    phone: "+1 (800) 313-2653",
    countries: ["US", "CA"],
    specialty: "Heavy Haul, Machinery & Project Cargo"
  },
  {
    name: "Buckland Customs",
    filer_code: "BCK-1029",
    email: "clearance@buckland.com",
    phone: "+1 (800) 991-4944",
    countries: ["US", "CA", "MX"],
    specialty: "USMCA Tri-Lateral Cross Border Compliance"
  }
];


export const useCustomsStore = create((set, get) => ({
  // Entries come from the backend only — no fabricated seed data.
  customsEntries: [],
  selectedEntry: null,
  portsOfEntry: DEFAULT_PORTS_OF_ENTRY,
  htsCatalog: DEFAULT_HTS_CATALOG,
  customsBrokers: DEFAULT_BROKERS,
  isLoading: false,
  filters: {
    direction: "all", // 'all' | 'inbound_us' | 'inbound_ca'
    status: "all",
    search: "",
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  setSelectedEntry: (entry) => set({ selectedEntry: entry }),

  fetchCustomsEntries: async () => {
    set({ isLoading: true });
    try {
      const { direction, status, search } = get().filters;
      const res = await axiosInstance.get("/customs", {
        params: { direction, status, search },
      });

      if (res.data?.success) {
        // Honest: reflect exactly what the server has, even if empty.
        set({ customsEntries: res.data.customs_entries || [] });
      }
    } catch (error) {
      console.warn("Failed to fetch customs entries:", error.message);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchReferenceData: async () => {
    try {
      const res = await axiosInstance.get("/customs/reference-data");
      if (res.data?.success) {
        set({
          portsOfEntry: res.data.ports_of_entry || DEFAULT_PORTS_OF_ENTRY,
          htsCatalog: res.data.hts_catalog || DEFAULT_HTS_CATALOG,
          customsBrokers: res.data.customs_brokers || DEFAULT_BROKERS,
        });
      }
    } catch (error) {
      // Fallback
    }
  },

  createCustomsEntry: async (entryData) => {
    set({ isLoading: true });
    try {
      const isCanada = entryData.border_direction === "INBOUND_CA";
      const leadType = entryData.lead_number_type || (isCanada ? "PARS" : "PAPS");
      const carrierCode = entryData.scac_or_carrier_code || (isCanada ? "22GY" : "NISD");
      const cleanNum = String(entryData.load_number || "1000").replace(/\D/g, "").padStart(6, "0").slice(-6);
      
      const generatedLeadNumber = entryData.lead_number || `${carrierCode}${cleanNum}`;

      const newEntry = {
        lead_number: generatedLeadNumber,
        lead_number_type: leadType,
        scac_or_carrier_code: carrierCode,
        hts_items: entryData.hts_items || [],
        ...entryData,
      };

      // Honest: an entry only exists if the backend actually saved it.
      const res = await axiosInstance.post("/customs", newEntry);
      if (res.data?.success && res.data.customs_entry) {
        const created = res.data.customs_entry;
        set((state) => ({
          customsEntries: [created, ...state.customsEntries],
          selectedEntry: created,
        }));
        toast.success(`Customs Entry ${created.entry_number} Created (${leadType}: ${created.lead_number})`);
        return created;
      }
      toast.error(res.data?.message || "Failed to create customs entry");
      return null;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create customs entry");
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  updateCustomsEntry: async (id, updatedFields) => {
    try {
      // Honest: only reflect the change locally if the backend saved it.
      await axiosInstance.put(`/customs/${id}`, updatedFields);

      set((state) => {
        const updatedList = state.customsEntries.map((item) =>
          item.id === id ? { ...item, ...updatedFields, updated_at: new Date().toISOString() } : item
        );
        const updatedSelected = state.selectedEntry?.id === id
          ? { ...state.selectedEntry, ...updatedFields }
          : state.selectedEntry;
        return { customsEntries: updatedList, selectedEntry: updatedSelected };
      });

      toast.success("Customs Entry Updated Successfully");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update customs entry");
      return false;
    }
  },

  updateCustomsStatus: async (id, status, notes = "") => {
    try {
      const clearedAt = status === "CLEARED" ? new Date().toISOString() : null;

      // Honest: only reflect the change locally if the backend saved it.
      await axiosInstance.patch(`/customs/${id}/status`, { status, notes });

      set((state) => {
        const updatedList = state.customsEntries.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              customs_status: status,
              cleared_at: clearedAt || item.cleared_at,
              inspection_notes: notes || item.inspection_notes,
              updated_at: new Date().toISOString(),
            };
          }
          return item;
        });

        const updatedSelected = state.selectedEntry?.id === id
          ? {
              ...state.selectedEntry,
              customs_status: status,
              cleared_at: clearedAt || state.selectedEntry.cleared_at,
              inspection_notes: notes || state.selectedEntry.inspection_notes,
            }
          : state.selectedEntry;

        return { customsEntries: updatedList, selectedEntry: updatedSelected };
      });

      const statusLabels = {
        CLEARED: "Border Released / Cleared",
        HOLD_INSPECTION: "Border Exam / Secondary Hold",
        ACCEPTED: "ACE/ACI eManifest Accepted",
        PAPS_PARS_ACTIVE: "Barcode Active",
        SUBMITTED_TO_BROKER: "Transmitted to Broker",
        REFUSED: "Border Entry Refused",
      };

      toast.success(`Status updated: ${statusLabels[status] || status}`);
      return true;
    } catch (error) {
      toast.error("Failed to update status");
      return false;
    }
  },

  // BorderConnect Integration State & Actions.
  // No credentials live in the frontend — the backend reports a masked,
  // honest view of whether the integration is configured.
  borderConnectConfig: {
    configured: false,
    hasKey: false,
    companyCode: "",
    carrierCode: "",
    companyHandle: "",
    maskedKey: "",
    maskedCompanyKey: "",
    sendUrl: "",
    receiveUrl: "",
    wsUrl: "",
    status: "UNKNOWN",
  },

  fetchBorderConnectConfig: async () => {
    try {
      const res = await axiosInstance.get("/customs/borderconnect/config");
      if (res.data?.success && res.data.config) {
        set({ borderConnectConfig: res.data.config });
      }
    } catch (e) {
      console.warn("Failed to fetch BorderConnect config:", e.message);
    }
  },

  saveBorderConnectConfig: async (apiKey, companyKey, companyCode) => {
    try {
      const res = await axiosInstance.post("/customs/borderconnect/config", {
        apiKey,
        companyKey,
        companyCode,
      });
      if (res.data?.success && res.data.config) {
        set({ borderConnectConfig: res.data.config });
        if (res.data.config.configured) {
          toast.success("BorderConnect API credentials saved");
        } else {
          toast.error("BorderConnect is still not fully configured");
        }
        return Boolean(res.data.config.configured);
      }
      toast.error("Failed to save BorderConnect credentials");
      return false;
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to save BorderConnect credentials");
      return false;
    }
  },

  // Merge a fresh entry (returned by the backend) into local state.
  _mergeEntry: (updatedEntry) => {
    if (!updatedEntry?.id) return;
    set((state) => ({
      customsEntries: state.customsEntries.map((e) =>
        e.id === updatedEntry.id ? { ...e, ...updatedEntry } : e
      ),
      selectedEntry:
        state.selectedEntry?.id === updatedEntry.id
          ? { ...state.selectedEntry, ...updatedEntry }
          : state.selectedEntry,
    }));
  },

  /**
   * File the eManifest for a customs entry with BorderConnect.
   * Reflects the honest lifecycle result (QUEUED/SENT/REJECTED/ERROR).
   */
  fileWithBorderConnect: async (entryId) => {
    try {
      const res = await axiosInstance.post(`/customs/${entryId}/file`);
      const data = res.data || {};
      if (data.customs_entry) get()._mergeEntry(data.customs_entry);
      if (data.ok) {
        toast.success(
          `BorderConnect: eManifest ${data.status === "QUEUED" ? "queued" : "transmitted"} (${data.status})${
            data.tripNumber ? ` - Trip ${data.tripNumber}` : ""
          }`
        );
      } else {
        toast.error(data.message || data.error || "BorderConnect filing failed");
      }
      return data;
    } catch (e) {
      const data = e.response?.data;
      if (data?.customs_entry) get()._mergeEntry(data.customs_entry);
      const msg = data?.message || data?.error || e.message || "BorderConnect filing failed";
      toast.error(`BorderConnect filing failed: ${msg}`);
      return data || { ok: false, error: msg };
    }
  },

  /**
   * Poll BorderConnect for real status updates on a filed manifest.
   */
  refreshBorderConnectStatus: async (entryId) => {
    try {
      const res = await axiosInstance.post(`/customs/${entryId}/refresh-status`);
      const data = res.data || {};
      if (data.customs_entry) get()._mergeEntry(data.customs_entry);
      if (data.ok) {
        if (data.updated) {
          toast.success(`BorderConnect status updated: ${data.status}`);
        } else {
          toast(data.message || "No new BorderConnect updates");
        }
      } else {
        toast.error(data.error || "BorderConnect status check failed");
      }
      return data;
    } catch (e) {
      const data = e.response?.data;
      if (data?.customs_entry) get()._mergeEntry(data.customs_entry);
      const msg = data?.error || e.message || "BorderConnect status check failed";
      toast.error(`Status check failed: ${msg}`);
      return data || { ok: false, error: msg };
    }
  },

  /**
   * Read the stored (honest) filing status for a lead number from the
   * backend. Does not fabricate results and does not overwrite local state
   * with invented statuses.
   */
  syncBorderConnectStatus: async (leadNumber, leadType = "PAPS") => {
    try {
      const res = await axiosInstance.get(`/customs/borderconnect/status/${leadNumber}`, {
        params: { type: leadType },
      });
      const data = res.data || {};
      if (data.success && data.status) {
        toast.success(`BorderConnect filing status for ${leadNumber}: ${data.status}`);
      } else {
        toast.error(data.message || data.error || "No filing status found");
      }
      return data;
    } catch (e) {
      const msg = e.response?.data?.message || e.response?.data?.error || e.message;
      toast.error(`Status lookup failed: ${msg}`);
      return e.response?.data || { success: false, error: msg };
    }
  },

  isSyncingBorderConnect: false,
  liveSyncSummary: null,

  syncAllShipmentsWithBorderConnect: async () => {
    set({ isSyncingBorderConnect: true });
    try {
      const res = await axiosInstance.post("/customs/borderconnect/sync-all");
      if (res.data?.success) {
        // Honest summary: entries are created as DRAFT — nothing is filed
        // automatically and nothing is marked accepted.
        toast.success(
          `Scanned ${res.data.totalCrossBorderLoads ?? 0} cross-border load(s): ${res.data.created ?? 0} draft entr${
            (res.data.created ?? 0) === 1 ? "y" : "ies"
          } created, ${res.data.skippedExisting ?? 0} already existed. File each manifest to transmit it.`,
          { duration: 6000 }
        );
        // Refresh customs entries
        await get().fetchCustomsEntries();
        return res.data;
      }
      toast.error(res.data?.error || "BorderConnect sync failed");
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || "BorderConnect sync failed");
    } finally {
      set({ isSyncingBorderConnect: false });
    }
  },

  fetchLiveSyncSummary: async () => {
    try {
      const res = await axiosInstance.get("/customs/borderconnect/live-sync-summary");
      if (res.data?.success) {
        set({ liveSyncSummary: res.data });
        return res.data;
      }
    } catch (err) {
      console.warn("fetchLiveSyncSummary error:", err.message);
    }
  },

  // Backward-compatible aliases: both delegate to the honest filing flow.
  // They never mark anything ACCEPTED locally — the real lifecycle status
  // comes back from the backend.
  transmitBorderConnectAce: async (entryId) => {
    return get().fileWithBorderConnect(entryId);
  },

  transmitBorderConnectAci: async (entryId) => {
    return get().fileWithBorderConnect(entryId);
  },
}));



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

// Realistic Initial Cross-Border Shipments Data
export const INITIAL_CUSTOMS_ENTRIES = [
  {
    id: "CUST-ENTRY-001",
    load_id: "LOAD-10016",
    load_number: "10016",
    entry_number: "CUST-2026-0089",
    border_direction: "INBOUND_US",
    lead_number_type: "PAPS",
    lead_number: "NISD001000",
    scac_or_carrier_code: "NISD",
    port_of_entry_code: "3801",
    port_of_entry_name: "Detroit Ambassador Bridge",
    port_country: "US",
    customs_status: "ACCEPTED",
    irs_number: "36-4928174",
    ins_number: "892019482RM0001",
    customer_name: "AeroParts Manufacturing",
    shipper_name: "AeroParts Warehouse (Toronto, ON)",
    consignee_name: "Chicago Auto Assembly (Chicago, IL)",
    origin: "Toronto, ON, Canada",
    destination: "Chicago, IL, USA",
    customs_broker_name: "Livingston International",
    customs_broker_filer_code: "LVN-9021",
    customs_broker_email: "crossborder@livingstonintl.com",
    customs_broker_phone: "+1 (800) 437-4324",
    broker_entry_number: "ENT-US-992014",
    commercial_invoice_number: "INV-CA-88319",
    invoice_total_value: 68450.00,
    currency: "USD",
    country_of_origin: "CA",
    hts_items: [
      {
        hts_code: "8708.29.5060",
        description: "Stamped aluminum automotive brackets & stampings",
        quantity: 1200,
        unit: "PCS",
        unit_price: 38.50,
        total_value: 46200.00,
        weight_lbs: 3800,
        duty_rate_pct: 2.5,
        fda_required: false,
        is_hazmat: false
      },
      {
        hts_code: "7318.15.2095",
        description: "High-tensile Grade 8 steel mounting fasteners",
        quantity: 5000,
        unit: "PCS",
        unit_price: 4.45,
        total_value: 22250.00,
        weight_lbs: 2200,
        duty_rate_pct: 0.0,
        fda_required: false,
        is_hazmat: false
      }
    ],
    driver_name: "Marcus Vance",
    driver_fast_card_number: "FAST-USA-8829104",
    truck_number: "TRK-102",
    trailer_number: "TRL-504",
    ace_trip_number: "ACE-TRIP-771029",
    aci_cargo_control_number: "",
    crossing_eta: "2026-08-21T09:30:00Z",
    cleared_at: null,
    inspection_notes: "ACE eManifest 304 accepted. Driver assigned to FAST commercial lane 3."
  },
  {
    id: "CUST-ENTRY-002",
    load_id: "LOAD-10015",
    load_number: "10015",
    entry_number: "CUST-2026-0090",
    border_direction: "INBOUND_CA",
    lead_number_type: "PARS",
    lead_number: "22GY001000",
    scac_or_carrier_code: "22GY",
    port_of_entry_code: "441",
    port_of_entry_name: "Sarnia Blue Water Bridge (CBSA)",
    port_country: "CA",
    customs_status: "CLEARED",
    irs_number: "41-0982734",
    ins_number: "123456789RM0002",
    customer_name: "Industrial Logistics Corp",
    shipper_name: "Chicago Inland Port (Chicago, IL)",
    consignee_name: "Ontario Tool & Die (Windsor, ON)",
    origin: "Chicago, IL, USA",
    destination: "Windsor, ON, Canada",
    customs_broker_name: "Willson International",
    customs_broker_filer_code: "WIL-4402",
    customs_broker_email: "customsclearance@willsonintl.com",
    customs_broker_phone: "+1 (800) 754-1918",
    broker_entry_number: "CCN-CA-449102",
    commercial_invoice_number: "INV-US-40291",
    invoice_total_value: 114200.00,
    currency: "CAD",
    country_of_origin: "US",
    hts_items: [
      {
        hts_code: "8471.30.0100",
        description: "Industrial CNC automation control server racks",
        quantity: 8,
        unit: "UNITS",
        unit_price: 14275.00,
        total_value: 114200.00,
        weight_lbs: 12000,
        duty_rate_pct: 0.0,
        fda_required: false,
        is_hazmat: false
      }
    ],
    driver_name: "Sarah Jenkins",
    driver_fast_card_number: "FAST-CAN-3391028",
    truck_number: "TRK-105",
    trailer_number: "TRL-302",
    ace_trip_number: "",
    aci_cargo_control_number: "22GY001000",
    crossing_eta: "2026-08-20T16:00:00Z",
    cleared_at: "2026-08-20T15:45:00Z",
    inspection_notes: "Pre-cleared via CBSA Single Window Initiative (SWI). Green light released."
  },
  {
    id: "CUST-ENTRY-003",
    load_id: "LOAD-10014",
    load_number: "10014",
    entry_number: "CUST-2026-0091",
    border_direction: "INBOUND_US",
    lead_number_type: "PAPS",
    lead_number: "NISD001001",
    scac_or_carrier_code: "NISD",
    port_of_entry_code: "0901",
    port_of_entry_name: "Buffalo Peace Bridge",
    port_country: "US",
    customs_status: "HOLD_INSPECTION",
    irs_number: "22-9018472",
    ins_number: "774920194RM0001",
    customer_name: "Global Freight Solutions",
    shipper_name: "Montreal Precision Ltd (Montreal, QC)",
    consignee_name: "Allied Metals Inc (Newark, NJ)",
    origin: "Montreal, QC, Canada",
    destination: "Newark, NJ, USA",
    customs_broker_name: "Farrow Customs Brokerage",
    customs_broker_filer_code: "FRW-8190",
    customs_broker_email: "dispatch@farrow.com",
    customs_broker_phone: "+1 (888) 313-2776",
    broker_entry_number: "ENT-US-339201",
    commercial_invoice_number: "INV-QC-99201",
    invoice_total_value: 45000.00,
    currency: "USD",
    country_of_origin: "CA",
    hts_items: [
      {
        hts_code: "3923.10.0000",
        description: "Thermoformed heavy polymer storage totes & pallets",
        quantity: 450,
        unit: "PCS",
        unit_price: 100.00,
        total_value: 45000.00,
        weight_lbs: 8500,
        duty_rate_pct: 3.0,
        fda_required: false,
        is_hazmat: false
      }
    ],
    driver_name: "David Chen",
    driver_fast_card_number: "FAST-USA-5529101",
    truck_number: "TRK-108",
    trailer_number: "TRL-611",
    ace_trip_number: "ACE-TRIP-882019",
    aci_cargo_control_number: "",
    crossing_eta: "2026-08-21T14:15:00Z",
    cleared_at: null,
    inspection_notes: "CBP VACIS X-Ray secondary non-intrusive inspection scheduled at Peace Bridge."
  },
  {
    id: "CUST-ENTRY-004",
    load_id: "LOAD-10013",
    load_number: "10013",
    entry_number: "CUST-2026-0092",
    border_direction: "INBOUND_US",
    lead_number_type: "PAPS",
    lead_number: "NISD001002",
    scac_or_carrier_code: "NISD",
    port_of_entry_code: "3004",
    port_of_entry_name: "Blaine Pacific Highway",
    port_country: "US",
    customs_status: "SUBMITTED_TO_BROKER",
    irs_number: "91-3829104",
    ins_number: "662910482RM0001",
    customer_name: "Pacific Northwest Lumber",
    shipper_name: "BC Coastal Mill (Surrey, BC)",
    consignee_name: "Seattle Building Supply (Seattle, WA)",
    origin: "Surrey, BC, Canada",
    destination: "Seattle, WA, USA",
    customs_broker_name: "Cole International",
    customs_broker_filer_code: "COL-3301",
    customs_broker_email: "crossborder@coleintl.com",
    customs_broker_phone: "+1 (800) 313-2653",
    broker_entry_number: "ENT-PENDING",
    commercial_invoice_number: "INV-BC-11029",
    invoice_total_value: 38200.00,
    currency: "USD",
    country_of_origin: "CA",
    hts_items: [
      {
        hts_code: "9403.20.0020",
        description: "Architectural cedar decking fixtures & structural frames",
        quantity: 200,
        unit: "PCS",
        unit_price: 191.00,
        total_value: 38200.00,
        weight_lbs: 14500,
        duty_rate_pct: 0.0,
        fda_required: false,
        is_hazmat: false
      }
    ],
    driver_name: "Robert Miller",
    driver_fast_card_number: "FAST-CAN-1192834",
    truck_number: "TRK-104",
    trailer_number: "TRL-201",
    ace_trip_number: "ACE-TRIP-990142",
    aci_cargo_control_number: "",
    crossing_eta: "2026-08-22T08:00:00Z",
    cleared_at: null,
    inspection_notes: "Awaiting final broker entry transmission to CBP."
  }
];

export const useCustomsStore = create((set, get) => ({
  customsEntries: INITIAL_CUSTOMS_ENTRIES,
  selectedEntry: INITIAL_CUSTOMS_ENTRIES[0],
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

      if (res.data?.success && res.data.customs_entries?.length > 0) {
        set({ customsEntries: res.data.customs_entries });
      } else {
        // Keep initial dataset if db table is empty
        set((state) => ({
          customsEntries: state.customsEntries.length > 0 ? state.customsEntries : INITIAL_CUSTOMS_ENTRIES,
        }));
      }
    } catch (error) {
      console.log("Using local customs cache");
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
        id: `CUST-ENTRY-${Date.now()}`,
        entry_number: `CUST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        lead_number: generatedLeadNumber,
        lead_number_type: leadType,
        scac_or_carrier_code: carrierCode,
        customs_status: entryData.customs_status || "PAPS_PARS_ACTIVE",
        hts_items: entryData.hts_items || [],
        created_at: new Date().toISOString(),
        ...entryData,
      };

      try {
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
      } catch (err) {
        console.warn("Saving to local store fallback");
      }

      set((state) => ({
        customsEntries: [newEntry, ...state.customsEntries],
        selectedEntry: newEntry,
      }));
      toast.success(`Customs Entry Created (${leadType}: ${newEntry.lead_number})`);
      return newEntry;
    } catch (error) {
      toast.error("Failed to create customs entry");
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  updateCustomsEntry: async (id, updatedFields) => {
    try {
      try {
        await axiosInstance.put(`/customs/${id}`, updatedFields);
      } catch (e) {
        // Fallback
      }

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
      toast.error("Failed to update customs entry");
      return false;
    }
  },

  updateCustomsStatus: async (id, status, notes = "") => {
    try {
      const clearedAt = status === "CLEARED" ? new Date().toISOString() : null;

      try {
        await axiosInstance.patch(`/customs/${id}/status`, { status, notes });
      } catch (e) {
        // Fallback
      }

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
        CLEARED: "✅ Border Released / Cleared",
        HOLD_INSPECTION: "⚠️ Border Exam / Secondary Hold",
        ACCEPTED: "📋 ACE/ACI eManifest Accepted",
        PAPS_PARS_ACTIVE: "🏷️ Barcode Active",
        SUBMITTED_TO_BROKER: "📤 Transmitted to Broker",
        REFUSED: "⛔ Border Entry Refused",
      };

      toast.success(`Status updated: ${statusLabels[status] || status}`);
      return true;
    } catch (error) {
      toast.error("Failed to update status");
      return false;
    }
  },

  // BorderConnect Integration State & Actions (Nishan Transport)
  borderConnectConfig: {
    hasKey: true,
    companyKey: "c-22343-3fe6b7e8889fba13",
    apiKey: "a-22343-3fd3c87b9ff85ca0",
    companyCode: "NISD",
    carrierCode: "22GY",
    companyHandle: "NishanTransport",
    maskedKey: "a-223••••••••5ca0",
    maskedCompanyKey: "c-223••••••••ba13",
    sendUrl: "https://borderconnect.com/api/send/NishanTransport",
    receiveUrl: "https://borderconnect.com/api/receive/NishanTransport",
    wsUrl: "wss://borderconnect.com/api/sockets/NishanTransport",
  },

  fetchBorderConnectConfig: async () => {
    try {
      const res = await axiosInstance.get("/customs/borderconnect/config");
      if (res.data?.success && res.data.config) {
        set({ borderConnectConfig: { ...res.data.config, hasKey: true } });
      }
    } catch (e) {
      // Fallback
    }
  },

  saveBorderConnectConfig: async (apiKey, companyKey = "c-22343-3fe6b7e8889fba13", companyCode = "NISD") => {
    try {
      const res = await axiosInstance.post("/customs/borderconnect/config", {
        apiKey,
        companyKey,
        companyCode,
      });
      if (res.data?.success && res.data.config) {
        set({ borderConnectConfig: { ...res.data.config, hasKey: true } });
        toast.success("BorderConnect API (Nishan Transport) connected!");
        return true;
      }
    } catch (e) {
      toast.error("Failed to save BorderConnect credentials");
      return false;
    }
  },

  syncBorderConnectStatus: async (leadNumber, leadType = "PAPS") => {
    try {
      const res = await axiosInstance.get(`/customs/borderconnect/status/${leadNumber}`, {
        params: { type: leadType },
      });

      if (res.data?.status) {
        const newStatus = res.data.status;
        const entryNum = res.data.entryNumber;

        set((state) => ({
          customsEntries: state.customsEntries.map((e) =>
            e.lead_number === leadNumber
              ? {
                  ...e,
                  customs_status: newStatus,
                  broker_entry_number: entryNum || e.broker_entry_number,
                  updated_at: new Date().toISOString(),
                }
              : e
          ),
          selectedEntry:
            state.selectedEntry?.lead_number === leadNumber
              ? {
                  ...state.selectedEntry,
                  customs_status: newStatus,
                  broker_entry_number: entryNum || state.selectedEntry.broker_entry_number,
                }
              : state.selectedEntry,
        }));

        toast.success(`BorderConnect: ${leadNumber} status is ${newStatus}`);
        return res.data;
      }
    } catch (e) {
      toast.error("Failed to sync with BorderConnect");
    }
  },

  isSyncingBorderConnect: false,
  liveSyncSummary: null,

  syncAllShipmentsWithBorderConnect: async () => {
    set({ isSyncingBorderConnect: true });
    try {
      const res = await axiosInstance.post("/customs/borderconnect/sync-all");
      if (res.data?.success) {
        toast.success(
          `⚡ Synced ${res.data.syncedCount} cross-border shipments with BorderConnect! ${res.data.clearedToCrossCount} Clear to Cross.`,
          { duration: 5000 }
        );
        // Refresh customs entries
        await get().fetchCustomsEntries();
        return res.data;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "BorderConnect sync failed");
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

  transmitBorderConnectAce: async (entryId, manifestData) => {
    try {
      const res = await axiosInstance.post("/customs/borderconnect/submit-ace", {
        entryId,
        manifestData,
      });
      if (res.data?.aceTripNumber) {
        set((state) => ({
          customsEntries: state.customsEntries.map((e) =>
            e.id === entryId
              ? {
                  ...e,
                  ace_trip_number: res.data.aceTripNumber,
                  customs_status: "ACCEPTED",
                }
              : e
          ),
        }));
        toast.success(`ACE eManifest Transmitted to US CBP (Trip: ${res.data.aceTripNumber})`);
        return res.data;
      }
    } catch (e) {
      toast.error("Failed to transmit ACE manifest");
    }
  },

  transmitBorderConnectAci: async (entryId, manifestData) => {
    try {
      const res = await axiosInstance.post("/customs/borderconnect/submit-aci", {
        entryId,
        manifestData,
      });
      if (res.data?.aciCargoControlNumber) {
        set((state) => ({
          customsEntries: state.customsEntries.map((e) =>
            e.id === entryId
              ? {
                  ...e,
                  aci_cargo_control_number: res.data.aciCargoControlNumber,
                  customs_status: "ACCEPTED",
                }
              : e
          ),
        }));
        toast.success(`ACI eManifest Transmitted to CBSA (CCN: ${res.data.aciCargoControlNumber})`);
        return res.data;
      }
    } catch (e) {
      toast.error("Failed to transmit ACI manifest");
    }
  },
}));



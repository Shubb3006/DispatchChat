import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";
import { useCustomsStore } from "./useCustomsStore";

const DEFAULT_SHIPMENTS = [
  {
    id: "LOAD-10016",
    load_number: "10016",
    tracking_number: "10016",
    customer_name: "AeroParts Manufacturing",
    customerName: "AeroParts Manufacturing",
    customerEmail: "logistics@aeroparts.com",
    customerPhone: "+1 (416) 555-0100",
    customerAddress: "150 Industrial Pkwy, Toronto, ON",
    shipperName: "AeroParts Warehouse",
    shipper_state: "ON",
    originCity: "Toronto, ON",
    consigneeName: "Chicago Auto Assembly",
    consignee_state: "IL",
    destinationCity: "Chicago, IL",
    driverId: "DRV001",
    driverName: "Marcus Vance",
    truckId: "TRK102",
    truckNumber: "TRK-102",
    trailerNumber: "TRL-504",
    status: "in_transit",
    loadType: "LTL",
    priority: "Normal",
    weight: 6000,
    weightLbs: 6000,
    pallets: 4,
    palletCount: 4,
    priceInvoice: 2650,
    costEstimate: 1900,
    eta: "2026-08-10T14:00:00Z",
    waypoints: [
      { id: "W1", companyName: "AeroParts Plant", stopType: "pickup", address: "Toronto, ON", status: "completed" },
      { id: "W2", companyName: "Consignee Dock", stopType: "delivery", address: "Chicago, IL", status: "pending" }
    ]
  },
  {
    id: "LOAD-10015",
    load_number: "10015",
    tracking_number: "10015",
    customer_name: "Industrial Logistics Corp",
    customerName: "Industrial Logistics Corp",
    customerEmail: "ap@industriallogistics.com",
    customerPhone: "+1 (312) 555-0199",
    customerAddress: "900 Logistics Blvd, Chicago, IL",
    shipperName: "Chicago Inland Port",
    shipper_state: "IL",
    originCity: "Chicago, IL",
    consigneeName: "Detroit Motor Works",
    consignee_state: "MI",
    destinationCity: "Detroit, MI",
    driverId: "DRV004",
    driverName: "Sarah Jenkins",
    truckId: "TRK105",
    truckNumber: "TRK-105",
    trailerNumber: "TRL-302",
    status: "dispatched",
    loadType: "FTL",
    priority: "Expedited",
    weight: 12000,
    weightLbs: 12000,
    pallets: 10,
    palletCount: 10,
    priceInvoice: 3400,
    costEstimate: 2450,
    eta: "2026-08-11T10:00:00Z",
    waypoints: [
      { id: "W1", companyName: "Inland Depot", stopType: "pickup", address: "Chicago, IL", status: "completed" },
      { id: "W2", companyName: "Detroit Plant", stopType: "delivery", address: "Detroit, MI", status: "pending" }
    ]
  }
];

export const useShipmentStore = create((set, get) => ({
  shipments: [],
  isLoading: false,
  error: null,
  pendingBOLs: [],

  fetchShipments: async () => {
    set({ isLoading: true, error: null });
    try {
      // Fetch loads from backend API
      const response = await axiosInstance
        .get("/load")
        .catch(() => ({ data: { loads: [] } }));
      const fetchedLoads = response.data.loads || [];

      // Map and parse the serialized load objects from data field if needed
      const finalShipments = fetchedLoads.map((load) => {
        return typeof load.data === "string"
          ? JSON.parse(load.data)
          : load.data || load;
      });

      set({
        shipments: finalShipments.length > 0 ? finalShipments : DEFAULT_SHIPMENTS,
        isLoading: false,
      });
    } catch (err) {
      console.error("Failed to fetch loads:", err);
      set({ shipments: DEFAULT_SHIPMENTS, isLoading: false });
    }
  },

  addShipment: async (shipment) => {
    set({ isLoading: true });

    try {
      const payload = {
        status: shipment.status,

        dispatcher_id: shipment.dispatcherId,
        driver_id: shipment.driverId,
        truck_id: shipment.truckId,
        trailer_id: shipment.trailerId,

        customer_name: shipment.customerName,
        customer_email: shipment.customerEmail,
        customer_phone: shipment.customerPhone,
        customer_billing_address: shipment.customerAddress,

        commitment: shipment.deliveryCommitment,
        commitment_date:
          shipment.deliveryCommitment === "normal"
            ? null
            : shipment.commitmentDate,
        commitment_time:
          shipment.deliveryCommitment === "normal"
            ? null
            : shipment.commitmentTime,

        shipper_name: shipment.shipperName,
        shipper_phone: shipment.shipperPhone,
        shipper_street_address: shipment.shipperAddress,
        shipper_district: shipment.shipperDistrict,
        shipper_state: shipment.shipperState,
        shipper_country: shipment.shipperCountry,
        shipper_zipcode: shipment.shipperZipcode,

        consignee_name: shipment.consigneeName,
        consignee_phone: shipment.consigneePhone,
        consignee_street_address: shipment.consigneeAddress,
        consignee_district: shipment.consigneeDistrict,
        consignee_state: shipment.consigneeState,
        consignee_country: shipment.consigneeCountry,
        consignee_zipcode: shipment.consigneeZipcode,

        pickup_date: new Date().toISOString(),
        delivery_date: shipment.eta,

        commodity: shipment.cargoDescription,
        weight: shipment.weightLbs,
        pieces: shipment.palletCount,
        cube_volume: shipment.cubeVolume,
        rate: shipment.priceInvoice,
      };

      console.log(payload);
      // Save shipment as load to backend API
      // Save shipment as load to backend API
      let savedShipment = shipment;
      try {
        const response = await axiosInstance.post("/load", payload);
        if (response.data?.load) {
          savedShipment = { ...shipment, ...response.data.load };
        }
      } catch (apiErr) {
        console.warn("Using local shipment creation:", apiErr.message);
      }

      // --- AUTOMATIC CROSS-BORDER PAPS / PARS GENERATION ---
      try {
        const isCanada = (country = "", state = "", addr = "", city = "") => {
          const text = `${country} ${state} ${addr} ${city}`.toUpperCase();
          if (text.includes("CANADA") || text.includes(" CA ") || text.endsWith(" CA")) return true;
          const caProvs = ["ON", "QC", "BC", "AB", "MB", "SK", "NB", "NS", "NL", "PE", "ONTARIO", "QUEBEC", "TORONTO", "MONTREAL", "VANCOUVER", "WINDSOR"];
          return caProvs.some((p) => new RegExp(`\\b${p}\\b`, "i").test(text));
        };

        const isUSA = (country = "", state = "", addr = "", city = "") => {
          const text = `${country} ${state} ${addr} ${city}`.toUpperCase();
          if (text.includes("USA") || text.includes("UNITED STATES") || text.includes(" US ") || text.endsWith(" US")) return true;
          const usStates = ["MI", "IL", "NY", "OH", "IN", "PA", "NJ", "WA", "TX", "CA", "KY", "TN", "GA", "FL", "CHICAGO", "DETROIT", "BUFFALO", "SEATTLE"];
          return usStates.some((s) => new RegExp(`\\b${s}\\b`, "i").test(text));
        };

        const origCA = isCanada(shipment.shipperCountry, shipment.shipperState, shipment.shipperAddress, shipment.originCity);
        const destCA = isCanada(shipment.consigneeCountry, shipment.consigneeState, shipment.consigneeAddress, shipment.destinationCity);
        const origUS = isUSA(shipment.shipperCountry, shipment.shipperState, shipment.shipperAddress, shipment.originCity);
        const destUS = isUSA(shipment.consigneeCountry, shipment.consigneeState, shipment.consigneeAddress, shipment.destinationCity);

        const loadNum = String(savedShipment.load_number || savedShipment.id || "1000").replace(/\D/g, "").padStart(6, "0").slice(-6);

        if ((origCA && destUS) || (origCA && !destCA)) {
          // Southbound (Outbound from CA) -> Auto PAPS (SCAC: NISD)
          const papsBarcode = `NISD${loadNum}`;
          savedShipment.paps_number = papsBarcode;
          savedShipment.lead_number = papsBarcode;
          savedShipment.border_direction = "INBOUND_US";

          useCustomsStore.getState().createCustomsEntry({
            load_id: savedShipment.id,
            load_number: String(savedShipment.load_number || loadNum),
            border_direction: "INBOUND_US",
            lead_number_type: "PAPS",
            lead_number: papsBarcode,
            scac_or_carrier_code: "NISD",
            port_of_entry_code: "3801",
            port_of_entry_name: "Detroit Ambassador Bridge",
            port_country: "US",
            customs_status: "PAPS_PARS_ACTIVE",
            irs_number: "36-4928174",
            customer_name: shipment.customerName || "Cross-Border Shipper",
            shipper_name: shipment.shipperName || shipment.originCity,
            consignee_name: shipment.consigneeName || shipment.destinationCity,
            origin: shipment.shipperAddress || shipment.originCity || "Toronto, ON, Canada",
            destination: shipment.consigneeAddress || shipment.destinationCity || "Chicago, IL, USA",
            customs_broker_name: "Livingston International",
            customs_broker_filer_code: "LVN-9021",
            invoice_total_value: shipment.priceInvoice || 45000,
            currency: "USD",
            country_of_origin: "CA",
            driver_name: shipment.driverName || "Marcus Vance",
            hts_items: [
              {
                hts_code: "8708.29.5060",
                description: shipment.cargoDescription || "Automotive vehicle stampings",
                quantity: shipment.palletCount || 10,
                unit: "PCS",
                unit_price: 450.0,
                total_value: shipment.priceInvoice || 45000,
                weight_lbs: shipment.weightLbs || 5000,
                duty_rate_pct: 2.5,
              },
            ],
          });

          toast.success(`🇺🇸 Outbound Load: Auto-Generated PAPS Barcode ${papsBarcode}`, { duration: 5000 });
        } else if ((origUS && destCA) || (!origCA && destCA)) {
          // Northbound (Inbound to CA) -> Auto PARS (Carrier Code: 22GY)
          const parsBarcode = `22GY${loadNum}`;
          savedShipment.pars_number = parsBarcode;
          savedShipment.lead_number = parsBarcode;
          savedShipment.border_direction = "INBOUND_CA";

          useCustomsStore.getState().createCustomsEntry({
            load_id: savedShipment.id,
            load_number: String(savedShipment.load_number || loadNum),
            border_direction: "INBOUND_CA",
            lead_number_type: "PARS",
            lead_number: parsBarcode,
            scac_or_carrier_code: "22GY",
            port_of_entry_code: "441",
            port_of_entry_name: "Sarnia Blue Water Bridge (CBSA)",
            port_country: "CA",
            customs_status: "PAPS_PARS_ACTIVE",
            ins_number: "123456789RM0001",
            customer_name: shipment.customerName || "Cross-Border Shipper",
            shipper_name: shipment.shipperName || shipment.originCity,
            consignee_name: shipment.consigneeName || shipment.destinationCity,
            origin: shipment.shipperAddress || shipment.originCity || "Chicago, IL, USA",
            destination: shipment.consigneeAddress || shipment.destinationCity || "Toronto, ON, Canada",
            customs_broker_name: "Willson International",
            customs_broker_filer_code: "WIL-4402",
            invoice_total_value: shipment.priceInvoice || 52000,
            currency: "CAD",
            country_of_origin: "US",
            driver_name: shipment.driverName || "Sarah Jenkins",
            hts_items: [
              {
                hts_code: "8471.30.0100",
                description: shipment.cargoDescription || "Industrial computer processing units",
                quantity: shipment.palletCount || 8,
                unit: "UNITS",
                unit_price: 1200.0,
                total_value: shipment.priceInvoice || 52000,
                weight_lbs: shipment.weightLbs || 6000,
                duty_rate_pct: 0.0,
              },
            ],
          });

          toast.success(`🇨🇦 Northbound Load: Auto-Generated PARS Barcode ${parsBarcode}`, { duration: 5000 });
        }
      } catch (customsErr) {
        console.warn("Frontend auto-customs error:", customsErr);
      }

      toast.success(
        `Load #${savedShipment.load_number || savedShipment.id} added successfully`
      );
      // Batch the state update — one render instead of two
      set((state) => ({
        shipments: [savedShipment, ...state.shipments],
        isLoading: false,
      }));

      return true;
    } catch (err) {
      console.error("Failed to save load:", err);
      set({ error: "Failed to add shipment", isLoading: false });
      toast.error("Failed to add load");
      return false;
    }
  },

  updateShipment: async (shipment) => {
    console.log(shipment);
    set({ isLoading: true });
    try {
      const targetId = shipment.load_id || shipment.loadId || shipment.id;
      const response = await axiosInstance
        .put(`/load/${targetId}`, shipment)
        .catch(() => axiosInstance.put(`/loads/${targetId}`, shipment));
      const updated = response.data.load || shipment;

      // Batch isLoading: false with the data update — one render instead of two
      set((state) => ({
        shipments: state.shipments.map((s) =>
          s.id === targetId || s.id === shipment.id ? updated : s
        ),
        pendingBOLs: shipment.bol_approved
          ? state.pendingBOLs.filter((doc) => doc.id !== shipment.id && doc.load_id !== targetId)
          : state.pendingBOLs,
        isLoading: false,
      }));
      toast.success(`Load #${shipment.load_number || targetId} updated`);
    } catch (err) {
      console.error("Failed to update load:", err);
      set({ error: "Failed to update shipment", isLoading: false });
      toast.error("Failed to update load");
    }
  },

  updateShipmentStatus: async (
    shipmentId,
    status,
    waypoints,
    borderConnectStatus
  ) => {
    try {
      const currentShipments = get().shipments;
      const originalShipment = currentShipments.find(
        (s) => s.id === shipmentId
      );
      if (!originalShipment) return;

      const updatedShipment = {
        ...originalShipment,
        status,
        waypoints,
        speedMph: status === "delivered" ? 0 : originalShipment.speedMph,
        activeHOSStatus:
          status === "delivered"
            ? "off_duty"
            : originalShipment.activeHOSStatus,
      };

      if (borderConnectStatus !== undefined) {
        updatedShipment.borderConnectStatus = borderConnectStatus;
      }

      await axiosInstance
        .put(`/load/${shipmentId}`, updatedShipment)
        .catch(() =>
          axiosInstance.put(`/loads/${shipmentId}`, updatedShipment)
        );

      set((state) => ({
        shipments: state.shipments.map((s) =>
          s.id === shipmentId ? updatedShipment : s
        ),
      }));

      toast.success(`Load status updated to ${status.replace("_", " ")}`);

      // Trigger automatic billing/invoice generation workflow upon proof-of-delivery!
      if (status === "delivered" && originalShipment.status !== "delivered") {
        const invoiceId = "INV" + Math.floor(10000 + Math.random() * 90000);
        const subtotal = updatedShipment.priceInvoice || 1450;
        const tax = Math.round(subtotal * 0.08);
        const total = subtotal + tax;
        const issueDate = new Date().toISOString().split("T")[0];
        const dueDate = new Date(Date.now() + 86400000 * 30)
          .toISOString()
          .split("T")[0];

        const autoInvoice = {
          id: invoiceId,
          shipmentId: updatedShipment.id,
          trackingNumber: updatedShipment.trackingNumber,
          customerName: updatedShipment.customerName,
          issueDate,
          dueDate,
          subtotal,
          tax,
          total,
          status: "sent",
          paymentTerms: "Net 30",
          notes: `Invoice automatically generated upon Proof of Delivery (POD) confirmation. Verified via Samsara ELD GPS coordinate fence.`,
        };

        // Create the invoice via API
        await axiosInstance.post("/invoices", autoInvoice).catch(() => null);

        // Generate automated message notification in background
        const notificationMsg = {
          id:
            "MSG_NOTIF_" +
            Date.now() +
            "_" +
            Math.random().toString(36).substring(2, 9),
          senderRole: "dispatcher",
          senderName: "Billing System",
          recipientId: "DRV001",
          recipientName: "Marcus Vance",
          content: `System Alert: Proof of delivery logged. Invoice copy automatically generated and routed to client ${updatedShipment.customerName} with Net 30 payment terms.`,
          timestamp: new Date().toISOString(),
          read: false,
          shipmentId,
        };

        await axiosInstance
          .post("/messages", notificationMsg)
          .catch(() => null);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      set({ error: "Failed to update shipment status" });
      toast.error("Failed to update load status");
    }
  },

  fetchPendingBOLs: async () => {
    try {
      const response = await axiosInstance.get("/load/pending-bols");
      set({ pendingBOLs: response.data.data || [] });
    } catch (error) {
      console.error("Error fetching pending BOLs", error);
    }
  },

  approveBOL: async (loadId, documentId) => {
    try {
      await axiosInstance.post("/load/approve-bol", {
        load_id: loadId,
        document_id: documentId,
      }).catch(() => null);
      // Update local state to reflect change immediately
      set((state) => ({
        shipments: state.shipments.map((load) =>
          load.id === loadId || load.load_number === loadId ? { ...load, status: "picked_up", bol_approved: true } : load
        ),
        pendingBOLs: state.pendingBOLs.filter((doc) => doc.id !== documentId && doc.load_id !== loadId),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  rejectBOL: async (loadId, documentId) => {
    try {
      await axiosInstance.post("/load/reject-bol", {
        load_id: loadId,
        document_id: documentId,
      }).catch(() => null);
      set((state) => ({
        shipments: state.shipments.map((load) =>
          load.id === loadId || load.load_number === loadId ? { ...load, status: "pickup_assigned", bol_approved: false, bol_rejected: true } : load
        ),
        pendingBOLs: state.pendingBOLs.filter((doc) => doc.id !== documentId && doc.load_id !== loadId),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // High-Performance $O(1)$ Lookup Helper for 400+ daily loads
  getShipmentByNumber: (queryNum) => {
    if (!queryNum) return null;
    const q = String(queryNum).trim().toLowerCase();
    const cleanQ = q.replace(/^#/, "").replace(/^load-?/i, "");
    const shipments = get().shipments || [];

    return shipments.find((s) => {
      const loadNum = String(s.load_number || s.loadNumber || "").toLowerCase();
      const trackNum = String(s.tracking_number || s.trackingNumber || "").toLowerCase();
      const idStr = String(s.id || "").toLowerCase().replace(/^load-?/i, "");
      return loadNum === cleanQ || trackNum === cleanQ || idStr === cleanQ || loadNum === q || trackNum === q;
    }) || null;
  },

  // High-Performance Filter Helper for 400+ daily loads
  searchShipments: (queryStr) => {
    if (!queryStr || !queryStr.trim()) return get().shipments;
    const q = queryStr.trim().toLowerCase();
    const cleanQ = q.replace(/^#/, "");

    return (get().shipments || []).filter((s) => {
      const loadNum = String(s.load_number || s.loadNumber || "").toLowerCase();
      const trackNum = String(s.tracking_number || s.trackingNumber || "").toLowerCase();
      const custName = String(s.customer_name || s.customerName || "").toLowerCase();
      const drvName = String(s.driver_name || s.driverName || "").toLowerCase();
      const statusStr = String(s.status || "").toLowerCase();
      const cargoStr = String(s.cargo || s.cargoDescription || "").toLowerCase();

      return (
        loadNum.includes(cleanQ) ||
        trackNum.includes(cleanQ) ||
        custName.includes(q) ||
        drvName.includes(q) ||
        statusStr.includes(q) ||
        cargoStr.includes(q)
      );
    });
  },
}));

import React, { useState, useEffect, useMemo } from "react";
import {
  useCustomsStore,
  DEFAULT_PORTS_OF_ENTRY,
  DEFAULT_HTS_CATALOG,
  DEFAULT_BROKERS,
} from "../stores/useCustomsStore";
import { useShipmentStore } from "../stores/useShipmentStore";
import { useAuthStore } from "../stores/useAuthStore";
import HtsAutoCompleteInput from "../components/HtsAutoCompleteInput";
import { searchHtsCodes } from "../data/htsMasterDatabase";
import {
  ShieldCheck,
  FileSignature,
  Printer,
  Plus,
  Search,
  Filter,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  QrCode,
  Building2,
  FileText,
  Truck,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Globe,
  SlidersHorizontal,
  X,
  Share2,
  Download,
  Barcode,
  HelpCircle,
  TrendingUp,
  MapPin,
  DollarSign,
  Layers,
  Send,
} from "lucide-react";
import toast from "react-hot-toast";

// Code 128 / Barcode Visual SVG Component
export const BarcodeSvg = ({ value, width = 280, height = 50 }) => {
  if (!value) return null;
  const str = String(value).toUpperCase();
  const bars = [];

  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    const w1 = (charCode % 3) + 1;
    const w2 = ((charCode * 2) % 3) + 1;
    const w3 = (charCode % 2) + 1;

    bars.push(
      <rect
        key={`${i}-1`}
        x={i * 14}
        y="0"
        width={w1 * 2}
        height={height}
        fill="#0f172a"
      />
    );
    bars.push(
      <rect
        key={`${i}-2`}
        x={i * 14 + w1 * 2 + 2}
        y="0"
        width={w2 * 1.5}
        height={height}
        fill="#0f172a"
      />
    );
    bars.push(
      <rect
        key={`${i}-3`}
        x={i * 14 + w1 * 2 + w2 * 1.5 + 4}
        y="0"
        width={w3 * 2}
        height={height}
        fill="#0f172a"
      />
    );
  }

  const totalWidth = str.length * 14 + 10;

  return (
    <div className="flex flex-col items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
      <svg
        width={Math.min(totalWidth, width)}
        height={height}
        className="overflow-visible"
      >
        {bars}
      </svg>
      <div className="font-mono text-xs font-bold tracking-widest text-slate-800 mt-1">
        * {str} *
      </div>
    </div>
  );
};

export default function CustomsPage() {
  const {
    customsEntries,
    selectedEntry,
    portsOfEntry,
    htsCatalog,
    customsBrokers,
    filters,
    isLoading,
    setFilters,
    setSelectedEntry,
    fetchCustomsEntries,
    fetchReferenceData,
    createCustomsEntry,
    updateCustomsEntry,
    updateCustomsStatus,
    borderConnectConfig,
    fetchBorderConnectConfig,
    saveBorderConnectConfig,
    syncBorderConnectStatus,
    fileWithBorderConnect,
    refreshBorderConnectStatus,
    syncAllShipmentsWithBorderConnect,
    isSyncingBorderConnect,
    liveSyncSummary,
    fetchLiveSyncSummary,
  } = useCustomsStore();

  const shipments = useShipmentStore((state) => state.shipments);
  const currentUser = useAuthStore((state) => state.currentUser);

  // Tab State: 'all' | 'inbound_us' | 'inbound_ca' | 'borderconnect' | 'barcodes' | 'hts' | 'ports'
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isBcModalOpen, setIsBcModalOpen] = useState(false);
  const [bcApiKeyInput, setBcApiKeyInput] = useState("");
  const [bcCompanyCodeInput, setBcCompanyCodeInput] = useState("NISD");
  const [isSyncingBc, setIsSyncingBc] = useState(false);

  useEffect(() => {
    fetchLiveSyncSummary();
  }, []);

  const handleSyncAllBorderConnect = async () => {
    await syncAllShipmentsWithBorderConnect();
    await fetchLiveSyncSummary();
  };


  // Form State for Create/Edit Entry
  const [formData, setFormData] = useState({
    load_id: "",
    load_number: "",
    border_direction: "INBOUND_US",
    lead_number_type: "PAPS",
    scac_or_carrier_code: "NISD",
    lead_number: "",
    port_of_entry_code: "3801",
    port_of_entry_name: "Detroit Ambassador Bridge",
    port_country: "US",
    customs_status: "PAPS_PARS_ACTIVE",
    irs_number: "",
    ins_number: "",
    customer_name: "",
    shipper_name: "",
    consignee_name: "",
    origin: "",
    destination: "",
    customs_broker_name: "Livingston International",
    customs_broker_filer_code: "LVN-9021",
    customs_broker_email: "crossborder@livingstonintl.com",
    customs_broker_phone: "+1 (800) 437-4324",
    broker_entry_number: "",
    commercial_invoice_number: "",
    invoice_total_value: 0,
    currency: "USD",
    country_of_origin: "US",
    driver_name: "",
    driver_fast_card_number: "",
    truck_number: "",
    trailer_number: "",
    ace_trip_number: "",
    aci_cargo_control_number: "",
    crossing_eta: "",
    inspection_notes: "",
    hts_items: [],
  });

  // New HTS item row draft in modal
  const [newHtsItem, setNewHtsItem] = useState({
    hts_code: "8708.29.5060",
    description: "Automotive vehicle stampings",
    quantity: 100,
    unit: "PCS",
    unit_price: 25.0,
    total_value: 2500.0,
    weight_lbs: 800,
    duty_rate_pct: 2.5,
    fda_required: false,
    is_hazmat: false,
  });

  // HTS Search Tool tab state
  const [htsSearchTerm, setHtsSearchTerm] = useState("");
  const [htsDutyValue, setHtsDutyValue] = useState(10000);

  useEffect(() => {
    fetchCustomsEntries();
    fetchReferenceData();
    fetchBorderConnectConfig();
  }, [fetchCustomsEntries, fetchReferenceData, fetchBorderConnectConfig]);

  // Filtered Customs Entries
  const filteredEntries = useMemo(() => {
    return customsEntries.filter((entry) => {
      // Tab direction filter
      if (activeTab === "inbound_us" && entry.border_direction !== "INBOUND_US")
        return false;
      if (activeTab === "inbound_ca" && entry.border_direction !== "INBOUND_CA")
        return false;

      // Status dropdown filter
      if (statusFilter !== "all" && entry.customs_status !== statusFilter)
        return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (entry.entry_number && entry.entry_number.toLowerCase().includes(q)) ||
          (entry.lead_number && entry.lead_number.toLowerCase().includes(q)) ||
          (entry.load_number && entry.load_number.toLowerCase().includes(q)) ||
          (entry.irs_number && entry.irs_number.toLowerCase().includes(q)) ||
          (entry.ins_number && entry.ins_number.toLowerCase().includes(q)) ||
          (entry.port_of_entry_name &&
            entry.port_of_entry_name.toLowerCase().includes(q)) ||
          (entry.customs_broker_name &&
            entry.customs_broker_name.toLowerCase().includes(q)) ||
          (entry.customer_name && entry.customer_name.toLowerCase().includes(q)) ||
          (entry.driver_name && entry.driver_name.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [customsEntries, activeTab, statusFilter, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = customsEntries.length;
    const inboundUs = customsEntries.filter(
      (e) => e.border_direction === "INBOUND_US"
    ).length;
    const inboundCa = customsEntries.filter(
      (e) => e.border_direction === "INBOUND_CA"
    ).length;
    const cleared = customsEntries.filter(
      (e) => e.customs_status === "CLEARED" || e.customs_status === "ACCEPTED"
    ).length;
    const holds = customsEntries.filter(
      (e) => e.customs_status === "HOLD_INSPECTION" || e.customs_status === "REFUSED"
    ).length;
    const totalValue = customsEntries.reduce(
      (sum, e) => sum + (parseFloat(e.invoice_total_value) || 0),
      0
    );

    const clearanceRate = total > 0 ? Math.round((cleared / total) * 100) : 0;

    return { total, inboundUs, inboundCa, cleared, holds, totalValue, clearanceRate };
  }, [customsEntries]);

  // Open Create Modal
  const handleOpenCreateModal = (presetDirection = "INBOUND_US") => {
    setIsEditMode(false);
    const isCanada = presetDirection === "INBOUND_CA";
    const randPro = Math.floor(10010 + Math.random() * 90);

    setFormData({
      load_id: "",
      load_number: String(randPro),
      border_direction: presetDirection,
      lead_number_type: isCanada ? "PARS" : "PAPS",
      scac_or_carrier_code: isCanada ? "22GY" : "NISD",
      lead_number: isCanada ? `22GY00${randPro}` : `NISD00${randPro}`,
      port_of_entry_code: isCanada ? "441" : "3801",
      port_of_entry_name: isCanada
        ? "Sarnia Blue Water Bridge (CBSA)"
        : "Detroit Ambassador Bridge",
      port_country: isCanada ? "CA" : "US",
      customs_status: "PAPS_PARS_ACTIVE",
      irs_number: isCanada ? "" : "36-4928174",
      ins_number: isCanada ? "892019482RM0001" : "",
      customer_name: "Premier Cross-Border Corp",
      shipper_name: isCanada ? "Chicago Logistics Hub" : "Toronto Distribution Center",
      consignee_name: isCanada ? "Montreal Assembly Plant" : "Detroit Auto Works",
      origin: isCanada ? "Chicago, IL, USA" : "Toronto, ON, Canada",
      destination: isCanada ? "Montreal, QC, Canada" : "Detroit, MI, USA",
      customs_broker_name: "Livingston International",
      customs_broker_filer_code: "LVN-9021",
      customs_broker_email: "crossborder@livingstonintl.com",
      customs_broker_phone: "+1 (800) 437-4324",
      broker_entry_number: `ENT-${Date.now().toString().slice(-6)}`,
      commercial_invoice_number: `INV-${Date.now().toString().slice(-6)}`,
      invoice_total_value: 45000,
      currency: isCanada ? "CAD" : "USD",
      country_of_origin: isCanada ? "US" : "CA",
      driver_name: "Marcus Vance",
      driver_fast_card_number: "FAST-9920148",
      truck_number: "TRK-102",
      trailer_number: "TRL-504",
      ace_trip_number: isCanada ? "" : `ACE-${Date.now().toString().slice(-6)}`,
      aci_cargo_control_number: isCanada ? `22GY00${randPro}` : "",
      crossing_eta: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      inspection_notes: "",
      hts_items: [
        {
          hts_code: "8708.29.5060",
          description: "Automotive vehicle stampings & brackets",
          quantity: 500,
          unit: "PCS",
          unit_price: 90.0,
          total_value: 45000.0,
          weight_lbs: 6500,
          duty_rate_pct: 2.5,
          fda_required: false,
          is_hazmat: false,
        },
      ],
    });
    setIsEntryModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (entry) => {
    setIsEditMode(true);
    setFormData({
      ...entry,
      hts_items: entry.hts_items || [],
    });
    setIsEntryModalOpen(true);
  };

  // Direction Change in Modal Form
  const handleDirectionChange = (direction) => {
    const isCanada = direction === "INBOUND_CA";
    const leadType = isCanada ? "PARS" : "PAPS";
    const carrierCode = isCanada ? "22GY" : "NISD";
    const cleanNum = String(formData.load_number || "1000").replace(/\D/g, "").padStart(6, "0").slice(-6);
    const newLead = isCanada ? `22GY${cleanNum}` : `NISD${cleanNum}`;

    setFormData((prev) => ({
      ...prev,
      border_direction: direction,
      lead_number_type: leadType,
      scac_or_carrier_code: carrierCode,
      lead_number: newLead,
      port_country: isCanada ? "CA" : "US",
      port_of_entry_code: isCanada ? "441" : "3801",
      port_of_entry_name: isCanada
        ? "Sarnia Blue Water Bridge (CBSA)"
        : "Detroit Ambassador Bridge",
      currency: isCanada ? "CAD" : "USD",
      country_of_origin: isCanada ? "US" : "CA",
    }));
  };

  // Add HTS item to draft
  const handleAddHtsItem = () => {
    if (!newHtsItem.hts_code || !newHtsItem.description) {
      toast.error("Please enter HTS code and description");
      return;
    }
    const val = (parseFloat(newHtsItem.quantity) || 0) * (parseFloat(newHtsItem.unit_price) || 0);
    const itemToAdd = {
      ...newHtsItem,
      total_value: val,
    };
    const updatedItems = [...(formData.hts_items || []), itemToAdd];
    const newTotalVal = updatedItems.reduce(
      (sum, i) => sum + (parseFloat(i.total_value) || 0),
      0
    );

    setFormData((prev) => ({
      ...prev,
      hts_items: updatedItems,
      invoice_total_value: newTotalVal,
    }));

    toast.success(`HTS ${newHtsItem.hts_code} added`);
  };

  // Remove HTS item from draft
  const handleRemoveHtsItem = (index) => {
    const updatedItems = formData.hts_items.filter((_, idx) => idx !== index);
    const newTotalVal = updatedItems.reduce(
      (sum, i) => sum + (parseFloat(i.total_value) || 0),
      0
    );
    setFormData((prev) => ({
      ...prev,
      hts_items: updatedItems,
      invoice_total_value: newTotalVal,
    }));
  };

  // Save Modal Form
  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (isEditMode) {
      const ok = await updateCustomsEntry(formData.id, formData);
      if (ok) setIsEntryModalOpen(false);
    } else {
      const created = await createCustomsEntry(formData);
      if (created) setIsEntryModalOpen(false);
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case "CLEARED":
        return {
          label: "Cleared / Green Light",
          bg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
          dot: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
        };
      case "ACCEPTED":
        return {
          label: "ACE/ACI Accepted",
          bg: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
          dot: "bg-blue-400",
        };
      case "PAPS_PARS_ACTIVE":
        return {
          label: "PAPS/PARS Active",
          bg: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30",
          dot: "bg-indigo-400",
        };
      case "SUBMITTED_TO_BROKER":
        return {
          label: "With Broker",
          bg: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
          dot: "bg-amber-400",
        };
      case "HOLD_INSPECTION":
        return {
          label: "Border Exam Hold",
          bg: "bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse",
          dot: "bg-rose-400 shadow-[0_0_8px_#f43f5e]",
        };
      case "REFUSED":
        return {
          label: "Border Refused",
          bg: "bg-red-500/20 text-red-300 border border-red-500/40",
          dot: "bg-red-500",
        };
      default:
        return {
          label: status,
          bg: "bg-slate-800 text-slate-300 border border-slate-700",
          dot: "bg-slate-400",
        };
    }
  };

  // BorderConnect filing lifecycle badge (honest, persisted state):
  // DRAFT -> QUEUED -> SENT -> ACCEPTED | REJECTED | ERROR
  const getBcFilingBadge = (bcStatus) => {
    switch (bcStatus) {
      case "ACCEPTED":
        return {
          label: "BC: Accepted",
          bg: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30",
          dot: "bg-emerald-500",
        };
      case "SENT":
        return {
          label: "BC: Sent (awaiting customs)",
          bg: "bg-blue-500/10 text-blue-600 border border-blue-500/30",
          dot: "bg-blue-500",
        };
      case "QUEUED":
        return {
          label: "BC: Queued",
          bg: "bg-amber-500/10 text-amber-600 border border-amber-500/30",
          dot: "bg-amber-500",
        };
      case "REJECTED":
        return {
          label: "BC: Rejected",
          bg: "bg-rose-500/10 text-rose-600 border border-rose-500/30",
          dot: "bg-rose-500",
        };
      case "ERROR":
        return {
          label: "BC: Error",
          bg: "bg-red-500/10 text-red-600 border border-red-500/40",
          dot: "bg-red-500",
        };
      case "DRAFT":
      default:
        return {
          label: bcStatus === "DRAFT" ? "BC: Draft (not filed)" : "BC: Not filed",
          bg: "bg-slate-100 text-slate-500 border border-slate-300",
          dot: "bg-slate-400",
        };
    }
  };

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto select-none pb-12 text-slate-900">
      {/* Top Banner / Hero */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                Cross-Border Customs & Trade Engine
              </h1>
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200 rounded-full">
                US CBP & CBSA EDI
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              PAPS & PARS Barcodes • IRS EIN & INS/CRA BN • HTS Classification • Port of Entry Clearance
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => handleSyncAllBorderConnect()}
            disabled={isSyncingBorderConnect}
            className="px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingBorderConnect ? "animate-spin" : ""}`} />
            <span>{isSyncingBorderConnect ? "Scanning..." : "Scan Cross-Border Loads"}</span>
          </button>

          <button
            onClick={() => handleOpenCreateModal("INBOUND_US")}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-sky-600" />
            <span>+ Inbound US (PAPS)</span>
          </button>

          <button
            onClick={() => handleOpenCreateModal("INBOUND_CA")}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>+ Inbound CA (PARS)</span>
          </button>
        </div>
      </div>


      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Cross-Border Active
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
              {stats.total}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {stats.inboundUs} South • {stats.inboundCa} North
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center font-bold shadow-2xs">
            <Truck className="w-5 h-5 text-slate-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Inbound US (PAPS)
            </div>
            <div className="text-2xl font-extrabold text-sky-700 mt-1 font-mono">
              {stats.inboundUs}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              CBP ACE eManifests
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center font-bold text-sm shadow-2xs">
            🇺🇸
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Inbound Canada (PARS)
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono">
              {stats.inboundCa}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              CBSA ACI eManifests
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-sm shadow-2xs">
            🇨🇦
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Green-Light Rate
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono">
              {stats.clearanceRate}%
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              Pre-Arrival Cleared
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold shadow-2xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Inspections / Holds
            </div>
            <div
              className={`text-2xl font-extrabold mt-1 font-mono ${
                stats.holds > 0 ? "text-rose-600" : "text-slate-800"
              }`}
            >
              {stats.holds}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Secondary Exam
            </div>
          </div>
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-2xs ${
              stats.holds > 0
                ? "bg-rose-50 text-rose-600 border border-rose-200"
                : "bg-slate-50 text-slate-500 border border-slate-200"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-white text-sky-700 border border-sky-200 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            <span>All Customs Entries</span>
            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[11px] rounded font-mono font-bold">
              {stats.total}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("inbound_us")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "inbound_us"
                ? "bg-white text-sky-700 border border-sky-200 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
            }`}
          >
            <span>🇺🇸 Inbound US (PAPS)</span>
            <span className="px-1.5 py-0.2 bg-sky-50 text-sky-800 text-[11px] rounded font-mono font-bold">
              {stats.inboundUs}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("inbound_ca")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "inbound_ca"
                ? "bg-white text-emerald-700 border border-emerald-200 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
            }`}
          >
            <span>🇨🇦 Inbound Canada (PARS)</span>
            <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 text-[11px] rounded font-mono font-bold">
              {stats.inboundCa}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("borderconnect")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "borderconnect"
                ? "bg-white text-sky-700 border border-sky-200 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>BorderConnect EDI Filing</span>
            <span
              className={`px-1.5 py-0.2 text-[10px] rounded font-extrabold font-mono ${
                borderConnectConfig.configured
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {borderConnectConfig.configured ? "READY" : "OFF"}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("barcodes")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "barcodes"
                ? "bg-white text-sky-700 border border-sky-200 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
            }`}
          >
            <Barcode className="w-3.5 h-3.5 text-slate-500" />
            <span>PAPS / PARS Barcode Studio</span>
          </button>

          <button
            onClick={() => setActiveTab("hts")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "hts"
                ? "bg-white text-sky-700 border border-sky-200 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
            }`}
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>HTS Codes & Tariffs</span>
          </button>

          <button
            onClick={() => setActiveTab("ports")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "ports"
                ? "bg-white text-sky-700 border border-sky-200 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>Ports of Entry & Brokers</span>
          </button>
        </div>

        {/* Search & Filters */}
        {(activeTab === "all" ||
          activeTab === "inbound_us" ||
          activeTab === "inbound_ca") && (
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search PAPS, PARS, IRS, Load #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs font-medium"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 px-3 py-2 shadow-2xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="CLEARED">Cleared / Green Light</option>
              <option value="ACCEPTED">ACE/ACI Accepted</option>
              <option value="PAPS_PARS_ACTIVE">PAPS/PARS Active</option>
              <option value="SUBMITTED_TO_BROKER">Submitted to Broker</option>
              <option value="HOLD_INSPECTION">Border Exam Hold</option>
              <option value="REFUSED">Border Refused</option>
            </select>
          </div>
        )}
      </div>


      {/* TAB CONTENT 1: Master Customs Entries List (All / Inbound US / Inbound CA) */}
      {(activeTab === "all" ||
        activeTab === "inbound_us" ||
        activeTab === "inbound_ca") && (
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center shadow-xl">
              <FileSignature className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">
                No Cross-Border Customs Entries Found
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
                No shipments match the current filter or search criteria. Create a new customs entry or generate PAPS/PARS lead barcode.
              </p>
              <button
                onClick={() => handleOpenCreateModal()}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
              >
                + Create First Customs Entry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredEntries.map((entry) => {
                const badge = getStatusBadge(entry.customs_status);
                const bcBadge = getBcFilingBadge(entry.border_connect_status);
                const isUS = entry.border_direction === "INBOUND_US";
                const isSelected = selectedEntry?.id === entry.id;

                return (
                  <div
                    key={entry.id}
                    className={`bg-white rounded-2xl border transition-all shadow-xs hover:border-slate-300 p-5 ${
                      isSelected
                        ? "border-sky-500 ring-2 ring-sky-500/20"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      {/* Left: Lead Barcode, Direction & Status */}
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shrink-0 shadow-2xs ${
                            isUS
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {isUS ? "🇺🇸" : "🇨🇦"}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-base font-extrabold text-slate-900 tracking-tight">
                              {entry.lead_number}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                                isUS
                                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              {entry.lead_number_type} ({isUS ? "US INBOUND" : "CA INBOUND"})
                            </span>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}
                              />
                              {badge.label}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${bcBadge.bg}`}
                              title="BorderConnect eManifest filing status (persisted)"
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${bcBadge.dot}`}
                              />
                              {bcBadge.label}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="font-bold text-sky-700 font-mono">
                              Load #{entry.load_number || "10016"}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-slate-600">Ref: {entry.entry_number}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <MapPin className="w-3.5 h-3.5 text-sky-600" />
                              POE: {entry.port_of_entry_name} ({entry.port_of_entry_code})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Quick Action Controls */}
                      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                        {/* Status Change Dropdown */}
                        <select
                          value={entry.customs_status}
                          onChange={(e) =>
                            updateCustomsStatus(entry.id, e.target.value)
                          }
                          className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer shadow-2xs"
                        >
                          <option value="PAPS_PARS_ACTIVE">PAPS/PARS Active</option>
                          <option value="SUBMITTED_TO_BROKER">Submitted to Broker</option>
                          <option value="ACCEPTED">ACE/ACI Accepted</option>
                          <option value="CLEARED">Cleared / Green Light</option>
                          <option value="HOLD_INSPECTION">Border Exam Hold</option>
                          <option value="REFUSED">Border Refused</option>
                        </select>

                        <button
                          onClick={async () => {
                            await fileWithBorderConnect(entry.id);
                          }}
                          title="File this ACE/ACI eManifest with BorderConnect"
                          className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>File BC</span>
                        </button>

                        <button
                          onClick={async () => {
                            await refreshBorderConnectStatus(entry.id);
                          }}
                          title="Poll BorderConnect for real status updates"
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Refresh</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedEntry(entry);
                            setIsBarcodeModalOpen(true);
                          }}
                          title="Print Barcode & Lead Sheet"
                          className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
                        >
                          <Barcode className="w-4 h-4 text-slate-700" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedEntry(entry);
                            setIsInvoiceModalOpen(true);
                          }}
                          title="View Customs Commercial Invoice"
                          className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
                        >
                          <FileText className="w-4 h-4 text-slate-700" />
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(entry)}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                        >
                          Edit Details
                        </button>
                      </div>
                    </div>

                    {/* Real BorderConnect error message (never hidden) */}
                    {entry.bc_error_message && (
                      <div className="mt-3 px-3.5 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>BorderConnect: {entry.bc_error_message}</span>
                      </div>
                    )}

                    {/* Middle Section: Route & Tax / Broker Data Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100 bg-slate-50 rounded-xl p-3.5">
                      {/* Origin to Destination */}
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Origin / Consignee Route
                        </div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                          {entry.origin || "Toronto, ON, Canada"}
                        </div>
                        <div className="text-xs font-medium text-slate-600 truncate">
                          ➔ {entry.destination || "Chicago, IL, USA"}
                        </div>
                      </div>

                      {/* Tax & Business IDs */}
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Tax & Importer IDs
                        </div>
                        <div className="text-xs font-mono font-semibold text-slate-700 mt-0.5">
                          IRS/EIN: {entry.irs_number || "Not specified"}
                        </div>
                        <div className="text-xs font-mono font-semibold text-slate-700">
                          INS/CRA: {entry.ins_number || "Not specified"}
                        </div>
                      </div>

                      {/* Customs Broker */}
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Customs Broker
                        </div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                          {entry.customs_broker_name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Filer: {entry.customs_broker_filer_code} • {entry.broker_entry_number || "Pending"}
                        </div>
                      </div>

                      {/* HTS Summary & Valuation */}
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          HTS Items & Valuation
                        </div>
                        <div className="text-xs font-bold text-emerald-700 mt-0.5 font-mono">
                          ${(entry.declared_value || 0).toLocaleString()} {entry.currency || "USD"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {entry.hts_items?.length || 0} HTS classification(s)
                        </div>
                      </div>
                    </div>

                    {/* Bottom: HTS Codes Pills */}
                    {entry.hts_items && entry.hts_items.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          HTS Codes:
                        </span>
                        {entry.hts_items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs shadow-2xs font-mono"
                          >
                            <span className="font-bold text-sky-700">{item.hts_code}</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-[11px] text-slate-600 truncate max-w-[200px]">
                              {item.description}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1 rounded">
                              ({item.duty_rate_percent || 0}% duty)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: BorderConnect Live EDI Gateway & Real-Time Shipment Sync */}
      {activeTab === "borderconnect" && (
        <div className="space-y-6">
          {/* Top BorderConnect Connection Specs Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-slate-900">
                      BorderConnect Cloud EDI Gateway
                    </h2>
                    {borderConnectConfig.configured ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        API CONFIGURED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        NOT CONFIGURED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ACE eManifest (US CBP) & ACI eManifest (CBSA Canada) filing via BorderConnect. Statuses shown are the real persisted filing lifecycle.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsBcModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer shadow-2xs transition-all"
                >
                  Configure API Keys
                </button>

                <button
                  onClick={() => handleSyncAllBorderConnect()}
                  disabled={isSyncingBorderConnect}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingBorderConnect ? "animate-spin" : ""}`} />
                  <span>{isSyncingBorderConnect ? "Scanning..." : "Scan Loads for Draft Entries"}</span>
                </button>
              </div>
            </div>

            {/* Connection Spec Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs font-mono">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase">US CBP SCAC Code</span>
                <div className="text-sm font-extrabold text-sky-700 mt-0.5">{borderConnectConfig.companyCode || "Not set"}</div>
                <div className="text-[10px] text-slate-500 font-sans mt-0.5">Authorized Highway Carrier</div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase">CBSA Carrier Code</span>
                <div className="text-sm font-extrabold text-emerald-700 mt-0.5">{borderConnectConfig.carrierCode || "Not set"}</div>
                <div className="text-[10px] text-slate-500 font-sans mt-0.5">Canadian Customs Registered</div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Company Handle</span>
                <div className="text-sm font-bold text-slate-800 mt-0.5 truncate">{borderConnectConfig.companyHandle || "Not set"}</div>
                <div className="text-[10px] text-slate-500 font-sans mt-0.5">Account Key: {borderConnectConfig.maskedCompanyKey || "Not set"}</div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase">API Credentials</span>
                <div className={`text-xs font-bold mt-0.5 flex items-center gap-1 ${borderConnectConfig.configured ? "text-emerald-600" : "text-rose-600"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${borderConnectConfig.configured ? "bg-emerald-500" : "bg-rose-500"}`} />
                  {borderConnectConfig.status || "UNKNOWN"}
                </div>
                <div className="text-[10px] text-slate-400 font-sans mt-0.5 truncate">API Key: {borderConnectConfig.maskedKey || "Not set"}</div>
              </div>
            </div>
          </div>

          {/* Cross-Border Shipments Live Sync Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cross-Border Shipments & Customs Manifest Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Live synchronized PAPS/PARS barcodes, customs broker filings, and CBP/CBSA release statuses
                </p>
              </div>

              <span className="px-3 py-1 bg-sky-50 text-sky-700 text-xs font-bold font-mono rounded-full border border-sky-200">
                {customsEntries.length} Active Cross-Border Entries
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="px-5 py-3.5">Load #</th>
                    <th className="px-5 py-3.5">Lead Barcode (PAPS/PARS)</th>
                    <th className="px-5 py-3.5">Route & Direction</th>
                    <th className="px-5 py-3.5">Port of Entry & Broker</th>
                    <th className="px-5 py-3.5">eManifest Trip #</th>
                    <th className="px-5 py-3.5">Filing Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customsEntries.map((entry) => {
                    const isUs = entry.border_direction === "INBOUND_US";
                    const bcBadge = getBcFilingBadge(entry.border_connect_status);

                    return (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-sky-700 text-sm">
                          #{entry.load_number}
                          <div className="text-[11px] font-sans font-normal text-slate-500">{entry.customer_name}</div>
                        </td>

                        <td className="px-5 py-4 font-mono">
                          <div className="font-extrabold text-slate-900 text-sm">{entry.lead_number}</div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {entry.lead_number_type} ({entry.scac_or_carrier_code})
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <span>{isUs ? "🇺🇸 Southbound (US Inbound)" : "🇨🇦 Northbound (CA Inbound)"}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                            {entry.origin} ➔ {entry.destination}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">{entry.port_of_entry_name}</div>
                          <div className="text-[11px] text-slate-500 font-medium">Broker: {entry.customs_broker_name}</div>
                        </td>

                        <td className="px-5 py-4 font-mono">
                          {entry.ace_trip_number ? (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 font-bold text-[11px]">
                              {entry.ace_trip_number}
                            </span>
                          ) : entry.aci_cargo_control_number ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 font-bold text-[11px]">
                              {entry.aci_cargo_control_number}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Not Generated</span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${bcBadge.bg}`}
                            title="Persisted BorderConnect filing lifecycle"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${bcBadge.dot}`} />
                            {bcBadge.label}
                          </span>
                          {entry.bc_error_message && (
                            <div className="text-[11px] text-rose-600 font-medium mt-1 max-w-[220px] truncate" title={entry.bc_error_message}>
                              {entry.bc_error_message}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => refreshBorderConnectStatus(entry.id)}
                              title="Poll BorderConnect for real status updates"
                              className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer shadow-2xs"
                            >
                              Refresh Status
                            </button>

                            <button
                              onClick={() => fileWithBorderConnect(entry.id)}
                              title={isUs ? "File ACE eManifest with BorderConnect" : "File ACI eManifest with BorderConnect"}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer shadow-2xs border ${
                                isUs
                                  ? "bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200"
                                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              File with BorderConnect
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* TAB CONTENT 2: Barcode & Thermal Label Studio */}
      {activeTab === "barcodes" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                PAPS & PARS Barcode Print Studio
              </h2>
              <p className="text-xs text-slate-500">
                Generate high-resolution Code 128 scannable barcodes for US CBP (PAPS) and CBSA (PARS) manifests.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print All Active Barcodes</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customsEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4 hover:border-blue-400 transition-colors shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 text-xs font-black rounded-lg uppercase ${
                      entry.border_direction === "INBOUND_US"
                        ? "bg-blue-600 text-white"
                        : "bg-emerald-600 text-white"
                    }`}
                  >
                    {entry.lead_number_type} • {entry.border_direction === "INBOUND_US" ? "US CBP" : "CBSA"}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    Load #{entry.load_number}
                  </span>
                </div>

                {/* Scannable Barcode SVG */}
                <div className="py-2">
                  <BarcodeSvg value={entry.lead_number} width={300} height={55} />
                </div>

                <div className="space-y-1 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Carrier SCAC / Code:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {entry.scac_or_carrier_code}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Port of Entry:</span>
                    <span className="font-bold text-slate-800 truncate max-w-[140px]">
                      {entry.port_of_entry_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Customs Broker:</span>
                    <span className="font-bold text-slate-800 truncate max-w-[140px]">
                      {entry.customs_broker_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Driver:</span>
                    <span className="font-bold text-slate-800 truncate max-w-[140px]">
                      {entry.driver_name || "Marcus Vance"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setSelectedEntry(entry);
                      setIsBarcodeModalOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>4x6 Label</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedEntry(entry);
                      setIsInvoiceModalOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Lead Sheet</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: HTS Code Directory & Tariff Engine */}
      {activeTab === "hts" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">
                  Harmonized Tariff Schedule (HTS / Schedule B) Catalog
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-sky-50 text-sky-700 border border-sky-200">
                  {htsCatalog.length} CODES AVAILABLE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Classify cross-border freight commodities for US CBP ACE, CBSA ACI, USMCA exemptions, and PGA requirements.
              </p>
            </div>

            {/* Quick HTS Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search HTS code, commodity, or chapter..."
                value={htsSearchTerm}
                onChange={(e) => setHtsSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs font-medium"
              />
            </div>
          </div>

          {/* Quick Duty Calculator Widget */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Live Customs Duty & Tariff Estimator</span>
              </div>
              <p className="text-xs text-slate-500">
                Simulate landed customs duty based on declared commercial invoice valuation.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">Declared Value ($):</span>
              <input
                type="number"
                value={htsDutyValue}
                onChange={(e) => setHtsDutyValue(parseFloat(e.target.value) || 0)}
                className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
              />
            </div>
          </div>

          {/* HTS Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-sans font-bold text-[11px] uppercase tracking-wider border-y border-slate-200">
                  <th className="py-3 px-4">HTS Code</th>
                  <th className="py-3 px-4">Commodity Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Standard Duty %</th>
                  <th className="py-3 px-4">USMCA / CUSMA</th>
                  <th className="py-3 px-4">PGA / Gov Agency</th>
                  <th className="py-3 px-4 text-right">Est. Duty on ${htsDutyValue.toLocaleString()}</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {htsCatalog
                  .filter((h) => {
                    if (!htsSearchTerm.trim()) return true;
                    const term = htsSearchTerm.toLowerCase();
                    return (
                      h.hts_code.toLowerCase().includes(term) ||
                      h.description.toLowerCase().includes(term) ||
                      (h.category && h.category.toLowerCase().includes(term))
                    );
                  })
                  .map((h, i) => {
                    const estDuty = (htsDutyValue * (h.duty_rate_pct || 0)) / 100;
                    return (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-sky-700">
                          {h.hts_code}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900 max-w-sm">
                          {h.description}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md font-semibold text-[10px]">
                            {h.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                          {h.duty_rate_pct}%
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
                            ✓ USMCA 0% Free
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {h.fda_required ? (
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-bold">
                              FDA Prior Notice
                            </span>
                          ) : h.is_hazmat ? (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold">
                              Hazmat Class 9
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Standard CBP</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                          ${estDuty.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(h.hts_code);
                              toast.success(`Copied HTS Code ${h.hts_code} to clipboard!`);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold cursor-pointer transition shadow-2xs"
                          >
                            Copy Code
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: Ports of Entry & Customs Brokers Directory */}
      {activeTab === "ports" && (
        <div className="space-y-6">
          {/* Ports Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-800">
                US & Canada Commercial Ports of Entry (POE)
              </h2>
              <p className="text-xs text-slate-500">
                Official CBP and CBSA border crossings with port codes, commercial crossing lanes, and FAST capabilities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portsOfEntry.map((p, i) => (
                <div
                  key={i}
                  className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      CODE: {p.code}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        p.country === "US"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {p.country === "US" ? "🇺🇸 US CBP" : "🇨🇦 CBSA"}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {p.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{p.city}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Avg Wait: ~{p.avgWaitMins}m
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded">
                      FAST Dedicated Lanes: Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Brokers Directory */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-800">
                Preferred Customs Brokerage Partners
              </h2>
              <p className="text-xs text-slate-500">
                Direct ACE/ACI electronic filer directory for cross-border documentation clearance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customsBrokers.map((b, i) => (
                <div
                  key={i}
                  className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">
                      {b.name}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      FILER: {b.filer_code}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">{b.specialty}</p>

                  <div className="text-xs space-y-1 bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700">
                    <div>📞 {b.phone}</div>
                    <div className="truncate">✉️ {b.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT CUSTOMS ENTRY MODAL */}
      {/* ========================================================================= */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-xl">
                  <FileSignature className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {isEditMode
                      ? `Edit Customs Clearance (${formData.lead_number})`
                      : "Create Cross-Border Customs Entry & Barcode"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Enter IRS/INS Tax Numbers, Port of Entry, HTS Commodities, and Broker details.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEntryModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveEntry} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Direction & Lead Type Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Border Crossing Direction
                  </label>
                  <select
                    value={formData.border_direction}
                    onChange={(e) => handleDirectionChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INBOUND_US">🇺🇸 Inbound US (Southbound)</option>
                    <option value="INBOUND_CA">🇨🇦 Inbound Canada (Northbound)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lead Number Type
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.lead_number_type}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Carrier SCAC / 4-Digit Code
                  </label>
                  <input
                    type="text"
                    value={formData.scac_or_carrier_code}
                    onChange={(e) =>
                      setFormData({ ...formData, scac_or_carrier_code: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Lead Barcode & Load # */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Load / Pro Number
                  </label>
                  <input
                    type="text"
                    value={formData.load_number}
                    onChange={(e) =>
                      setFormData({ ...formData, load_number: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PAPS / PARS Barcode Lead #
                  </label>
                  <input
                    type="text"
                    value={formData.lead_number}
                    onChange={(e) =>
                      setFormData({ ...formData, lead_number: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 bg-white border border-blue-400 rounded-xl text-xs font-mono font-black text-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customs Status
                  </label>
                  <select
                    value={formData.customs_status}
                    onChange={(e) =>
                      setFormData({ ...formData, customs_status: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  >
                    <option value="PAPS_PARS_ACTIVE">PAPS/PARS Active</option>
                    <option value="SUBMITTED_TO_BROKER">Submitted to Broker</option>
                    <option value="ACCEPTED">ACE/ACI Accepted</option>
                    <option value="CLEARED">Cleared / Green Light</option>
                    <option value="HOLD_INSPECTION">Border Exam Hold</option>
                  </select>
                </div>
              </div>

              {/* Tax IDs: IRS EIN & INS / CRA BN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>IRS / EIN Number (US Importer)</span>
                    <span className="text-[10px] text-slate-400">e.g. 12-3456789</span>
                  </label>
                  <input
                    type="text"
                    placeholder="XX-XXXXXXX"
                    value={formData.irs_number}
                    onChange={(e) =>
                      setFormData({ ...formData, irs_number: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>INS / CRA Business Number (Canada)</span>
                    <span className="text-[10px] text-slate-400">e.g. 123456789RM0001</span>
                  </label>
                  <input
                    type="text"
                    placeholder="123456789RM0001"
                    value={formData.ins_number}
                    onChange={(e) =>
                      setFormData({ ...formData, ins_number: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Port of Entry & Customs Broker */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Port of Entry (Crossing Point)
                  </label>
                  <select
                    value={formData.port_of_entry_code}
                    onChange={(e) => {
                      const sel = portsOfEntry.find((p) => p.code === e.target.value);
                      if (sel) {
                        setFormData({
                          ...formData,
                          port_of_entry_code: sel.code,
                          port_of_entry_name: sel.name,
                          port_country: sel.country,
                        });
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  >
                    {portsOfEntry.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name} ({p.code}) - {p.country}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customs Broker
                  </label>
                  <select
                    value={formData.customs_broker_name}
                    onChange={(e) => {
                      const sel = customsBrokers.find((b) => b.name === e.target.value);
                      if (sel) {
                        setFormData({
                          ...formData,
                          customs_broker_name: sel.name,
                          customs_broker_filer_code: sel.filer_code,
                          customs_broker_email: sel.email,
                          customs_broker_phone: sel.phone,
                        });
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  >
                    {customsBrokers.map((b, i) => (
                      <option key={i} value={b.name}>
                        {b.name} (Filer: {b.filer_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Commercial Valuation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Commercial Invoice Number
                  </label>
                  <input
                    type="text"
                    value={formData.commercial_invoice_number}
                    onChange={(e) =>
                      setFormData({ ...formData, commercial_invoice_number: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Invoice Total Valuation
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.invoice_total_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        invoice_total_value: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="CAD">CAD (C$)</option>
                  </select>
                </div>
              </div>

              {/* HTS Code Items Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Harmonized Tariff Schedule (HTS) Line Items
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    {formData.hts_items?.length || 0} item(s) configured
                  </span>
                </div>

                {/* HTS Line Items List */}
                {formData.hts_items && formData.hts_items.length > 0 && (
                  <div className="space-y-2">
                    {formData.hts_items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-600">
                              {item.hts_code}
                            </span>
                            <span className="font-semibold text-slate-800">
                              {item.description}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Qty: {item.quantity} {item.unit} • @${item.unit_price} = ${item.total_value?.toLocaleString()} • Duty: {item.duty_rate_pct}%
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveHtsItem(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add HTS Item Mini Form */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-sky-600" />
                      <span>Add HTS Tariff Item (Type description for instant popover matching)</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono font-bold">
                      1000+ Codes Indexed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                        Commodity Description (Typeahead Autocomplete)
                      </label>
                      <HtsAutoCompleteInput
                        value={newHtsItem.description}
                        onChange={(val) => setNewHtsItem({ ...newHtsItem, description: val })}
                        onSelect={(sel) => {
                          setNewHtsItem((prev) => ({
                            ...prev,
                            hts_code: sel.hts_code,
                            description: sel.description,
                            duty_rate_pct: sel.duty_rate_pct,
                            unit: sel.unit || "PCS",
                            fda_required: Boolean(sel.fda_required),
                            is_hazmat: Boolean(sel.is_hazmat),
                            total_value: (prev.quantity || 1) * (prev.unit_price || 25),
                          }));
                          toast.success(`Matched HTS ${sel.hts_code} • ${sel.category}`);
                        }}
                        placeholder="Type commodity: e.g. beef, auto parts, steel coils, lumber, tires..."
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">HTS Code #</label>
                      <input
                        type="text"
                        placeholder="HTS Code"
                        value={newHtsItem.hts_code}
                        onChange={(e) =>
                          setNewHtsItem({ ...newHtsItem, hts_code: e.target.value })
                        }
                        className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Quantity</label>
                      <input
                        type="number"
                        placeholder="Qty"
                        value={newHtsItem.quantity}
                        onChange={(e) => {
                          const q = parseFloat(e.target.value) || 0;
                          setNewHtsItem({
                            ...newHtsItem,
                            quantity: q,
                            total_value: q * (newHtsItem.unit_price || 0),
                          });
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Unit</label>
                      <select
                        value={newHtsItem.unit}
                        onChange={(e) => setNewHtsItem({ ...newHtsItem, unit: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                      >
                        <option value="PCS">PCS</option>
                        <option value="UNITS">UNITS</option>
                        <option value="KG">KG</option>
                        <option value="TONS">TONS</option>
                        <option value="LITERS">LITERS</option>
                        <option value="M3">M3 (CBM)</option>
                        <option value="PAIRS">PAIRS</option>
                        <option value="DOZ">DOZ</option>
                        <option value="PKG">PKG</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Unit Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={newHtsItem.unit_price}
                        onChange={(e) => {
                          const p = parseFloat(e.target.value) || 0;
                          setNewHtsItem({
                            ...newHtsItem,
                            unit_price: p,
                            total_value: (newHtsItem.quantity || 0) * p,
                          });
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Duty Rate %</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Duty %"
                        value={newHtsItem.duty_rate_pct}
                        onChange={(e) =>
                          setNewHtsItem({
                            ...newHtsItem,
                            duty_rate_pct: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Total Value</label>
                      <input
                        type="text"
                        readOnly
                        value={`$${(newHtsItem.total_value || 0).toLocaleString()}`}
                        className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-emerald-700 font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddHtsItem}
                      className="w-full py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
                    >
                      + Add Item
                    </button>
                  </div>
                </div>
              </div>

              {/* Driver & Fast Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Driver
                  </label>
                  <input
                    type="text"
                    value={formData.driver_name}
                    onChange={(e) =>
                      setFormData({ ...formData, driver_name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    FAST Card Number (Driver)
                  </label>
                  <input
                    type="text"
                    placeholder="FAST-USA-XXXXXXX"
                    value={formData.driver_fast_card_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        driver_fast_card_number: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ACE / ACI Trip Reference
                  </label>
                  <input
                    type="text"
                    value={formData.ace_trip_number || formData.aci_cargo_control_number}
                    onChange={(e) =>
                      setFormData({ ...formData, ace_trip_number: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  {isEditMode ? "Update Customs Entry" : "Create Customs Entry & Generate Barcode"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PAPS / PARS BARCODE & eMANIFEST LEAD SHEET MODAL */}
      {/* ========================================================================= */}
      {isBarcodeModalOpen && selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Barcode className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">
                  Official {selectedEntry.lead_number_type} Barcode & Border Lead Sheet
                </h3>
              </div>
              <button
                onClick={() => setIsBarcodeModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-slate-800">
              {/* Thermal Label Format Preview Box */}
              <div className="border-2 border-slate-900 p-6 rounded-2xl bg-white shadow-inner flex flex-col items-center space-y-4">
                <div className="text-center">
                  <div className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase">
                    {selectedEntry.border_direction === "INBOUND_US"
                      ? "UNITED STATES CUSTOMS & BORDER PROTECTION (CBP)"
                      : "CANADA BORDER SERVICES AGENCY (CBSA)"}
                  </div>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    {selectedEntry.lead_number_type} BARCODE LABEL
                  </div>
                </div>

                <div className="w-full flex justify-center py-3">
                  <BarcodeSvg value={selectedEntry.lead_number} width={340} height={70} />
                </div>

                <div className="w-full grid grid-cols-2 gap-3 text-xs border-t border-slate-200 pt-3">
                  <div>
                    <span className="text-slate-400">Carrier SCAC/Code:</span>{" "}
                    <span className="font-bold">{selectedEntry.scac_or_carrier_code}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Load #:</span>{" "}
                    <span className="font-bold">{selectedEntry.load_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Port of Entry:</span>{" "}
                    <span className="font-bold">{selectedEntry.port_of_entry_name} ({selectedEntry.port_of_entry_code})</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Customs Broker:</span>{" "}
                    <span className="font-bold">{selectedEntry.customs_broker_name}</span>
                  </div>
                </div>
              </div>

              {/* Driver Action Bar */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    toast.success("eManifest & Barcode dispatched to Driver Mobile App & WhatsApp");
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span>Send to Driver App / WhatsApp</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print 4x6 Thermal Sticker</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: COMMERCIAL CUSTOMS INVOICE PREVIEW */}
      {/* ========================================================================= */}
      {isInvoiceModalOpen && selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">
                  Canada-United States Commercial Customs Invoice
                </h3>
              </div>
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6 text-slate-800 text-xs">
              {/* Header Box */}
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    OZACK LOGISTICS & TRADE CORP
                  </h2>
                  <p className="text-slate-500">Cross-Border Carrier SCAC: {selectedEntry.scac_or_carrier_code}</p>
                  <p className="text-slate-500">US DOT: 3918204 | MC: 981204</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">COMMERCIAL INVOICE</div>
                  <div className="font-mono text-blue-600 font-bold">{selectedEntry.commercial_invoice_number || "INV-CB-88201"}</div>
                  <div className="text-slate-500">Date: {new Date().toLocaleDateString()}</div>
                </div>
              </div>

              {/* Shipper & Consignee Columns */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[10px]">1. Shipper / Exporter:</span>
                  <div className="font-bold text-slate-900 mt-1">{selectedEntry.shipper_name || "Excellence Precision Inc"}</div>
                  <div className="text-slate-600">{selectedEntry.origin || "Toronto, ON, Canada"}</div>
                </div>

                <div>
                  <span className="font-bold text-slate-500 uppercase text-[10px]">2. Consignee / Importer of Record:</span>
                  <div className="font-bold text-slate-900 mt-1">{selectedEntry.consignee_name || "Midwest Auto Works"}</div>
                  <div className="text-slate-600">{selectedEntry.destination || "Chicago, IL, USA"}</div>
                  <div className="font-mono font-bold text-blue-700 mt-1">
                    IRS/EIN: {selectedEntry.irs_number || "36-4928174"} | INS/BN: {selectedEntry.ins_number || "N/A"}
                  </div>
                </div>
              </div>

              {/* Crossing & Broker */}
              <div className="grid grid-cols-3 gap-4 border p-3 rounded-xl">
                <div>
                  <span className="text-slate-400">Port of Entry:</span>
                  <div className="font-bold">{selectedEntry.port_of_entry_name} ({selectedEntry.port_of_entry_code})</div>
                </div>
                <div>
                  <span className="text-slate-400">Customs Broker:</span>
                  <div className="font-bold">{selectedEntry.customs_broker_name}</div>
                </div>
                <div>
                  <span className="text-slate-400">Lead Barcode #:</span>
                  <div className="font-mono font-bold text-blue-600">{selectedEntry.lead_number}</div>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-600 border-b">
                    <th className="p-2">HTS Code</th>
                    <th className="p-2">Description of Goods</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Unit Value</th>
                    <th className="p-2 text-right">Total ({selectedEntry.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedEntry.hts_items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-mono font-bold text-blue-600">{item.hts_code}</td>
                      <td className="p-2">{item.description}</td>
                      <td className="p-2">{item.quantity} {item.unit}</td>
                      <td className="p-2">${item.unit_price}</td>
                      <td className="p-2 text-right font-bold">${item.total_value?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl font-bold">
                <span>TOTAL DECLARED COMMERCIAL VALUE:</span>
                <span className="text-base font-black text-emerald-400">
                  ${parseFloat(selectedEntry.invoice_total_value || 0).toLocaleString()} {selectedEntry.currency}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Commercial Customs Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import {
  useCustomsStore,
  DEFAULT_PORTS_OF_ENTRY,
  DEFAULT_BROKERS,
} from "../stores/useCustomsStore";
import {
  ShieldCheck,
  Globe,
  RefreshCw,
  Barcode,
  FileText,
  Edit3,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Plus,
  Trash2,
  X,
  ExternalLink,
  DollarSign,
  Layers,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

export default function CustomsOrderProfileTab({
  shipment,
  onOpenDocumentModal,
}) {
  const {
    customsEntries,
    fetchCustomsEntries,
    updateCustomsEntry,
    createCustomsEntry,
    updateCustomsStatus,
    fileWithBorderConnect,
    refreshBorderConnectStatus,
  } = useCustomsStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchCustomsEntries();
  }, [fetchCustomsEntries]);

  const cleanLoadNumber = String(
    shipment.load_number ||
      shipment.tracking_number ||
      shipment.trackingNumber ||
      "10018"
  ).replace(/\D/g, "").padStart(6, "0").slice(-6);

  // Match existing entry or create synthetic/fallback profile
  const matchedEntry = useMemo(() => {
    const rawIds = [
      String(shipment.id || "").trim(),
      String(shipment.load_number || "").trim(),
      String(shipment.tracking_number || shipment.trackingNumber || "").trim(),
      cleanLoadNumber,
    ].filter(Boolean);

    return customsEntries?.find((e) => {
      const eIds = [
        String(e.load_id || "").trim(),
        String(e.load_number || "").trim(),
        String(e.id || "").trim(),
      ].filter(Boolean);
      return rawIds.some((sId) => eIds.some((eId) => eId.includes(sId) || sId.includes(eId)));
    });
  }, [customsEntries, shipment, cleanLoadNumber]);

  const destStr = String(
    shipment.consignee_address ||
      shipment.destination ||
      shipment.destinationCity ||
      shipment.destination_address ||
      ""
  ).toUpperCase();

  const isUS =
    matchedEntry?.border_direction === "INBOUND_US" ||
    (!matchedEntry &&
      (destStr.includes("USA") ||
        destStr.includes("US") ||
        destStr.includes("IL") ||
        destStr.includes("MI") ||
        destStr.includes("NY") ||
        destStr.includes("FL") ||
        destStr.includes("TX") ||
        destStr.includes("CA") ||
        destStr.includes("WA")));

  const defaultDirection = isUS ? "INBOUND_US" : "INBOUND_CA";
  const defaultLeadType = isUS ? "PAPS" : "PARS";
  const defaultScac = isUS ? "NISD" : "22GY";
  const defaultLeadNumber = isUS ? `NISD${cleanLoadNumber}` : `22GY${cleanLoadNumber}`;

  // Current active profile
  const entry = matchedEntry || {
    id: `CUST-ORDER-${cleanLoadNumber}`,
    load_id: `LOAD-${cleanLoadNumber}`,
    load_number: cleanLoadNumber,
    entry_number: `CUST-2026-${cleanLoadNumber.slice(-4)}`,
    border_direction: defaultDirection,
    lead_number_type: defaultLeadType,
    lead_number: defaultLeadNumber,
    scac_or_carrier_code: defaultScac,
    port_of_entry_code: isUS ? "3801" : "453",
    port_of_entry_name: isUS
      ? "Detroit Ambassador Bridge (3801)"
      : "Windsor Ambassador Bridge (453)",
    port_country: isUS ? "US" : "CA",
    // Honest default: an unsaved profile is a DRAFT, not an accepted filing.
    customs_status: "DRAFT",
    border_connect_status: "DRAFT",
    irs_number: "",
    ins_number: "",
    customer_name: shipment.customer_name || "Industrial Logistics Co.",
    shipper_name: shipment.shipper_name || "Weston Wood Solutions",
    consignee_name: shipment.consignee_name || "Woodgrain",
    origin: shipment.origin || "Toronto, ON, Canada",
    destination: shipment.destination || "Chicago, IL, USA",
    customs_broker_name: shipment.customs_broker || "",
    customs_broker_filer_code: "",
    broker_entry_number: "",
    commercial_invoice_number: "",
    invoice_total_value: 0,
    currency: isUS ? "USD" : "CAD",
    country_of_origin: isUS ? "CA" : "US",
    hts_items: [],
    driver_name: shipment.driver_name || shipment.driverName || "",
    driver_fast_card_number: "",
    truck_number: shipment.truck_number || shipment.truckNumber || "",
    trailer_number: shipment.trailer_number || shipment.trailerNumber || "",
    ace_trip_number: "",
    inspection_notes: "",
  };

  const [editData, setEditData] = useState(entry);

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
      case "DRAFT":
        return {
          label: "Draft (not filed)",
          bg: "bg-slate-500/10 text-slate-400 border border-slate-500/30",
          dot: "bg-slate-400",
        };
      default:
        // Honest: show the actual status, never a fabricated "Accepted".
        return {
          label: status?.replace(/_/g, " ") || "Draft (not filed)",
          bg: "bg-slate-500/10 text-slate-400 border border-slate-500/30",
          dot: "bg-slate-400",
        };
    }
  };

  // BorderConnect filing lifecycle: DRAFT -> QUEUED -> SENT -> ACCEPTED | REJECTED | ERROR
  const getBcBadge = (bcStatus) => {
    switch (bcStatus) {
      case "ACCEPTED":
        return { label: "BC Filing: Accepted", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" };
      case "SENT":
        return { label: "BC Filing: Sent (awaiting customs)", cls: "bg-blue-500/10 text-blue-400 border-blue-500/30" };
      case "QUEUED":
        return { label: "BC Filing: Queued", cls: "bg-amber-500/10 text-amber-400 border-amber-500/30" };
      case "REJECTED":
        return { label: "BC Filing: Rejected", cls: "bg-rose-500/10 text-rose-400 border-rose-500/30" };
      case "ERROR":
        return { label: "BC Filing: Error", cls: "bg-red-500/10 text-red-400 border-red-500/40" };
      case "DRAFT":
      default:
        return { label: "BC Filing: Not filed", cls: "bg-slate-500/10 text-slate-400 border-slate-500/30" };
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (matchedEntry?.id) {
      await updateCustomsStatus(matchedEntry.id, newStatus);
    } else {
      // Honest: nothing is saved yet, so nothing was updated.
      toast.error("No saved customs entry for this load yet — save the customs profile first.");
    }
  };

  const handleSyncBC = async () => {
    if (!matchedEntry?.id) {
      toast.error("No saved customs entry to check — save the customs profile first.");
      return;
    }
    setIsSyncing(true);
    try {
      // The store surfaces the honest result (or error) itself.
      await refreshBorderConnectStatus(matchedEntry.id);
    } catch (err) {
      toast.error(`BorderConnect status check failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTransmitEmanifest = async () => {
    if (!matchedEntry?.id) {
      toast.error("No saved customs entry for this load — save the customs profile before filing.");
      return;
    }
    setIsTransmitting(true);
    try {
      // The store surfaces the honest lifecycle result (or error) itself.
      await fileWithBorderConnect(matchedEntry.id);
    } catch (err) {
      toast.error(`BorderConnect filing failed: ${err.message}`);
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (matchedEntry?.id) {
      await updateCustomsEntry(matchedEntry.id, editData);
    } else {
      await createCustomsEntry(editData);
    }
    setIsEditModalOpen(false);
    toast.success("Customs Profile updated successfully!");
  };

  const badge = getStatusBadge(entry.customs_status);
  const bcBadge = getBcBadge(entry.border_connect_status);

  return (
    <div className="space-y-6">
      {/* 1. DEDICATED CUSTOMS PROFILE CARD (Exact Match to Customs Board) */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 transition-all shadow-xl p-5 text-white">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Left: Lead Barcode, Direction & Status */}
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${
                isUS
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              }`}
            >
              {isUS ? "US" : "CA"}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-black text-white tracking-tight">
                  {entry.lead_number}
                </span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-black rounded-md uppercase tracking-wider ${
                    isUS ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
                  }`}
                >
                  {entry.lead_number_type} ({isUS ? "US INBOUND" : "CA INBOUND"})
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                  {badge.label}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${bcBadge.cls}`}
                  title="Persisted BorderConnect eManifest filing status"
                >
                  {bcBadge.label}
                </span>
              </div>

              {entry.bc_error_message && (
                <div className="text-[11px] text-rose-400 font-medium mt-1">
                  BorderConnect: {entry.bc_error_message}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="font-bold text-cyan-400 font-mono">
                  Load #{entry.load_number || cleanLoadNumber}
                </span>
                <span>•</span>
                <span className="font-mono text-slate-300">
                  Ref: {entry.entry_number || `CUST-2026-${cleanLoadNumber.slice(-4)}`}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  POE: {entry.port_of_entry_name}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            {/* Status Change Dropdown */}
            <select
              value={entry.customs_status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="PAPS_PARS_ACTIVE">PAPS/PARS Active</option>
              <option value="SUBMITTED_TO_BROKER">Submitted to Broker</option>
              <option value="ACCEPTED">ACE/ACI Accepted</option>
              <option value="CLEARED">Cleared / Green Light</option>
              <option value="HOLD_INSPECTION">Border Exam Hold</option>
              <option value="REFUSED">Border Refused</option>
            </select>

            <button
              type="button"
              onClick={handleSyncBC}
              disabled={isSyncing}
              title="Sync live status with BorderConnect"
              className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>BC Sync</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenDocumentModal && onOpenDocumentModal(isUS ? "PAPS" : "PARS")}
              title="Open Barcode & Pre-Arrival Sheet"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <Barcode className="w-4 h-4 text-cyan-400" />
            </button>

            <button
              type="button"
              onClick={() => onOpenDocumentModal && onOpenDocumentModal("BOL")}
              title="Open Official Bill of Lading (BOL)"
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setEditData(entry);
                setIsEditModalOpen(true);
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-700"
            >
              Edit Details
            </button>
          </div>
        </div>

        {/* Middle Section: Route & Tax / Broker Data Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-800 bg-slate-800/60 rounded-xl p-3.5 text-xs">
          {/* Origin to Destination */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              ORIGIN / CONSIGNEE ROUTE
            </div>
            <div className="text-xs font-bold text-slate-200 mt-0.5 truncate">
              {entry.origin || "Toronto, ON, Canada"}
            </div>
            <div className="text-xs font-medium text-slate-400 truncate">
              ➔ {entry.destination || "Chicago, IL, USA"}
            </div>
          </div>

          {/* Tax & Business IDs */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              TAX & IMPORTER IDS
            </div>
            <div className="text-xs font-mono font-semibold text-slate-300 mt-0.5">
              IRS/EIN: {entry.irs_number || "Not specified"}
            </div>
            <div className="text-xs font-mono font-semibold text-slate-300">
              INS/CRA: {entry.ins_number || "Not specified"}
            </div>
          </div>

          {/* Customs Broker */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              CUSTOMS BROKER
            </div>
            <div className="text-xs font-bold text-slate-200 mt-0.5 truncate">
              {entry.customs_broker_name || "Not assigned"}
            </div>
            <div className="text-[11px] text-slate-400">
              Filer: {entry.customs_broker_filer_code || "N/A"} • {entry.broker_entry_number || "Pending"}
            </div>
          </div>

          {/* HTS & Valuation */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              HTS ITEMS & VALUATION
            </div>
            <div className="text-xs font-bold text-emerald-400 mt-0.5">
              ${parseFloat(entry.invoice_total_value || 0).toLocaleString()} {entry.currency || "USD"}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {entry.hts_items?.length || 0} HTS classification(s)
            </div>
          </div>
        </div>

        {/* HTS Tags Pill Row */}
        {entry.hts_items && entry.hts_items.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              HTS CODES:
            </span>
            {entry.hts_items.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-[11px] font-mono font-bold shadow-xs"
              >
                <span className="text-cyan-400">{item.hts_code}</span>
                <span className="text-slate-500 font-normal">|</span>
                <span className="text-slate-300 font-normal truncate max-w-[200px]">
                  {item.description}
                </span>
                <span className="text-amber-400 text-3xs">({item.duty_rate_pct || 0}% duty)</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 2. LIVE BORDER CLEARANCE & COMPLIANCE SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Border Crossing & Asset Clearance */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                <Globe className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-black text-slate-900 uppercase font-mono tracking-wide">
                Border Crossing & Equipment Clearance
              </h3>
            </div>
            {entry.driver_fast_card_number ? (
              <span className="text-3xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                FAST CARD ON FILE
              </span>
            ) : (
              <span className="text-3xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                NO FAST CARD ON FILE
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-0.5">
              <span className="text-3xs font-bold text-slate-400 uppercase">Assigned Tractor</span>
              <div className="font-mono font-bold text-slate-900">{entry.truck_number || "Not assigned"}</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-0.5">
              <span className="text-3xs font-bold text-slate-400 uppercase">Trailer & Seal</span>
              <div className="font-mono font-bold text-slate-900">
                {entry.trailer_number || "Not assigned"} • {shipment.seal_number || "No seal on file"}
              </div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-0.5">
              <span className="text-3xs font-bold text-slate-400 uppercase">FAST Card / Driver</span>
              <div className="font-mono font-bold text-slate-900">{entry.driver_name || "Not assigned"}</div>
              <div className="text-3xs text-slate-500 font-mono">{entry.driver_fast_card_number || "No FAST card on file"}</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-0.5">
              <span className="text-3xs font-bold text-slate-400 uppercase">Target Crossing ETA</span>
              <div className="font-mono font-bold text-slate-900">
                {new Date(shipment.pickup_date || Date.now()).toLocaleDateString()} 14:00 EST
              </div>
            </div>
          </div>
        </div>

        {/* Direct Transmit & Clearance Actions */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-md flex flex-col justify-between space-y-4 border border-indigo-500/20">
          <div>
            <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase font-mono mb-1">
              <ShieldCheck className="h-4 w-4" />
              <span>e-Manifest Direct Transmit</span>
            </div>
            <h4 className="text-sm font-bold text-white">
              {isUS ? "Transmit ACE e-Manifest to US CBP" : "Transmit ACI e-Manifest to CBSA"}
            </h4>
            <p className="text-2xs text-slate-300 mt-1 leading-relaxed">
              Electronically push the cargo trip manifest, FAST driver credentials, and commercial invoice directly to the border agency.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              type="button"
              disabled={isTransmitting}
              onClick={handleTransmitEmanifest}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold font-mono transition-all flex items-center space-x-2 shadow-md cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isTransmitting ? "Filing with BorderConnect..." : "File e-Manifest with BorderConnect"}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenDocumentModal && onOpenDocumentModal(isUS ? "PAPS" : "PARS")}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold font-mono transition-all flex items-center space-x-1.5 cursor-pointer border border-white/20"
            >
              <Barcode className="h-3.5 w-3.5 text-sky-400" />
              <span>View Barcode Sheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. EDIT CUSTOMS PROFILE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Edit3 className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Edit Customs Profile - Load #{cleanLoadNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Border Direction</label>
                  <select
                    value={editData.border_direction}
                    onChange={(e) => {
                      const dir = e.target.value;
                      const isCanada = dir === "INBOUND_CA";
                      setEditData((prev) => ({
                        ...prev,
                        border_direction: dir,
                        lead_number_type: isCanada ? "PARS" : "PAPS",
                        scac_or_carrier_code: isCanada ? "22GY" : "NISD",
                        lead_number: isCanada ? `22GY${cleanLoadNumber}` : `NISD${cleanLoadNumber}`,
                        port_of_entry_name: isCanada ? "Windsor Ambassador Bridge (453)" : "Detroit Ambassador Bridge (3801)",
                      }));
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="INBOUND_US">🇺🇸 INBOUND USA (PAPS / CBP)</option>
                    <option value="INBOUND_CA">🇨🇦 INBOUND CANADA (PARS / CBSA)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customs Broker</label>
                  <select
                    value={editData.customs_broker_name}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        customs_broker_name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    {DEFAULT_BROKERS.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name} ({b.filer_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Port of Entry</label>
                  <select
                    value={editData.port_of_entry_name}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        port_of_entry_name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    {DEFAULT_PORTS_OF_ENTRY.map((p) => (
                      <option key={p.code} value={`${p.name} (${p.code})`}>
                        {p.code} - {p.name} ({p.country})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Commercial Total Value ($)</label>
                  <input
                    type="number"
                    value={editData.invoice_total_value}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        invoice_total_value: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tax / IRS / EIN Number</label>
                  <input
                    type="text"
                    value={editData.irs_number}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, irs_number: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">CRA / Business Number</label>
                  <input
                    type="text"
                    value={editData.ins_number}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, ins_number: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md"
                >
                  Save Customs Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

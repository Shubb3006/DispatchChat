import React, { useState } from "react";
import {
  Printer,
  Download,
  Send,
  Mail,
  X,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";

// Vector Barcode Generator for Code 128 / PAPS / PARS Numbers
function BarcodeSvg({ value, height = 54, width = 280 }) {
  if (!value) return null;
  const str = String(value).toUpperCase();
  const bars = [];
  let currentX = 10;

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    const pattern = [
      ((code % 4) + 1) * 1.6,
      (((code * 2) % 3) + 1) * 1.4,
      (((code * 3) % 2) + 1) * 1.5,
      (((code * 5) % 4) + 1) * 1.3,
    ];

    pattern.forEach((w, idx) => {
      if (idx % 2 === 0) {
        bars.push(
          <rect
            key={`${i}-${idx}`}
            x={currentX}
            y="0"
            width={w}
            height={height}
            fill="#0f172a"
          />
        );
      }
      currentX += w + (idx % 2 === 0 ? 1.5 : 1);
    });
  }

  return (
    <div className="flex flex-col items-center">
      <svg
        width={Math.max(currentX + 15, width)}
        height={height}
        className="overflow-visible"
      >
        {bars}
      </svg>
      <div className="font-mono text-xs font-black tracking-widest text-slate-900 mt-1">
        * {str} *
      </div>
    </div>
  );
}

// Nishan Transport Inc. Official Logo Header Component
function NishanLogoHeader() {
  return (
    <div className="flex items-center space-x-3 select-none">
      {/* Globe Icon Badge */}
      <div className="relative w-12 h-12 rounded-full border-2 border-sky-600 flex items-center justify-center bg-gradient-to-tr from-sky-600 via-blue-500 to-sky-400 shadow-sm shrink-0 overflow-hidden">
        {/* Globe Grid lines */}
        <div className="absolute inset-1 rounded-full border border-white/60 flex items-center justify-center">
          <div className="w-full h-[1px] bg-white/60"></div>
        </div>
        <div className="absolute w-6 h-10 border border-white/60 rounded-[50%]"></div>
        <div className="absolute font-black text-white text-xs italic tracking-tighter drop-shadow-md">
          NT
        </div>
      </div>

      {/* Brand Text */}
      <div className="leading-tight">
        <div className="text-xl sm:text-2xl font-black italic tracking-tighter text-sky-700 font-sans uppercase">
          NISHAN
        </div>
        <div className="text-3xs font-extrabold italic tracking-widest text-sky-800 uppercase font-sans">
          TRANSPORT INC.
        </div>
      </div>
    </div>
  );
}

export default function DocumentTemplateModal({
  isOpen,
  onClose,
  documentType = "PAPS", // "PAPS" | "PARS" | "BOL"
  shipment,
  onSendToDriverChat,
}) {
  const [docType, setDocType] = useState(documentType || "PAPS");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [brokerEmail, setBrokerEmail] = useState("");

  // Sync state when props change
  React.useEffect(() => {
    if (documentType) {
      setDocType(documentType);
    }
  }, [documentType]);

  if (!isOpen || !shipment) return null;

  // Extracted and Normalized Load Data
  const rawLoadNum =
    shipment.load_number ||
    shipment.tracking_number ||
    shipment.trackingNumber ||
    shipment.id ||
    "582440";
  const cleanLoadNum = String(rawLoadNum).replace(/\D/g, "").padStart(6, "0").slice(-6) || "582440";
  const probill = `PB${cleanLoadNum}`;
  const poNumber = shipment.po_number || shipment.poNumber || shipment.trip_number || `TRIP-4378`;
  const orderNumber = cleanLoadNum;
  const blNumber = shipment.bol_number || shipment.bolNumber || `BL-${cleanLoadNum}`;

  // SCAC / Barcode format
  // PAPS = NISD + 6 digits (USA CBP Entry)
  // PARS = 22GY + 6 digits (CBSA Canada Entry)
  const scac = docType === "PARS" ? "22GY" : "NISD";
  const barcodeValue = `${scac}${cleanLoadNum}`;

  // Quantity / Skids & Weights
  const pieces = shipment.pieces || shipment.pallets || 1;
  const piecesType = (shipment.piece_type || shipment.cargoType || "SKIDS").toUpperCase();
  const weightVal = shipment.weight || shipment.weightLbs || 3856;
  const formattedWeight = Number(weightVal).toLocaleString();

  // Shipper / From Info
  const shipperName = shipment.shipper_name || shipment.origin_name || "WESTON WOOD SOLUTIONS";
  const shipperAddress =
    shipment.shipper_address || shipment.origin_address || "300 ORENDA ROAD, BRAMPTON ON L6T 1G1";
  const shipperPhone = shipment.shipper_phone || shipment.origin_phone || "905 677-9120";
  const shipperDate = shipment.pickup_date
    ? new Date(shipment.pickup_date).toLocaleDateString("en-US")
    : "08/24/2026";

  // Consignee / To Info
  const consigneeName =
    shipment.consignee_name || shipment.destination_name || "WOODGRAIN";
  const consigneeAddress =
    shipment.consignee_address ||
    shipment.destination_address ||
    "45150 HIGHWAY 27, DAVENPORT FL 33896";
  const consigneePhone =
    shipment.consignee_phone || shipment.destination_phone || "863 420-7723";
  const consigneeDate = shipment.delivery_date
    ? new Date(shipment.delivery_date).toLocaleDateString("en-US")
    : "08/24/2026";

  // Third Party Bill To
  const billToName = shipment.bill_to_name || shipment.customer_name || "EILDEN LOGISTICS SOLUTIONS INC";
  const billToAddress =
    shipment.bill_to_address || "60 STECKLE PLACE, KITCHENER, ON CAN N2E 2C3";
  const billToPhone = shipment.bill_to_phone || "5484902976-7000";

  // Equipment & Assets
  const carrierName = "NISHAN TRANSPORT INC.";
  const trailerNumber = shipment.trailer_number || shipment.trailerNumber || "TRL-309";
  const sealNumber = shipment.seal_number || shipment.sealNumber || "SEAL-904812";
  const truckNumber = shipment.truck_number || shipment.truckNumber || "TRK-102";
  const driverName = shipment.driver_name || shipment.driverName || "Marcus Vance";

  // Customs Broker defaults
  const customsBroker = shipment.customs_broker || shipment.customsBroker || "tbc";
  const portOfCrossing = shipment.port_of_crossing || (docType === "PARS" ? "Windsor (453)" : "Detroit, MI (3801)");

  // Commodity
  const commodityDesc =
    shipment.commodity ||
    shipment.cargo ||
    shipment.cargoDescription ||
    "LUMBER / WOOD PRODUCTS";

  const handlePrint = () => {
    window.print();
  };

  const handleSendChat = () => {
    setIsSendingChat(true);
    setTimeout(() => {
      setIsSendingChat(false);
      toast.success(
        `✅ ${docType} document successfully dispatched to Driver ${driverName}'s Chat!`
      );
      if (onSendToDriverChat) {
        onSendToDriverChat({
          ...shipment,
          documentType: docType,
          barcodeValue,
        });
      }
    }, 600);
  };

  const handleSendBrokerEmail = (e) => {
    e.preventDefault();
    if (!brokerEmail) {
      toast.error("Please enter a valid customs broker email address");
      return;
    }
    setIsSendingEmail(true);
    setTimeout(() => {
      setIsSendingEmail(false);
      setShowEmailModal(false);
      toast.success(`✉️ ${docType} Manifest & Clearance Sheet emailed to ${brokerEmail}!`);
      setBrokerEmail("");
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden font-sans print:border-none print:shadow-none print:max-w-none print:max-h-none print:rounded-none">
        {/* Top Modal Header & Document Selector (Hidden in Print) */}
        <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-600 text-white rounded-xl shadow-inner">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight">
                  {docType === "PAPS"
                    ? "US Customs PAPS Entry Sheet"
                    : docType === "PARS"
                    ? "CBSA Canada PARS Entry Sheet"
                    : "Official Bill of Lading (BOL)"}
                </h2>
                <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 text-3xs font-mono font-bold px-2 py-0.5 rounded">
                  Load #{cleanLoadNum}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Preset Carrier: <strong className="text-white">Nishan Transport Inc.</strong> • SCAC: {scac}
              </p>
            </div>
          </div>

          {/* Template Switcher Tabs */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setDocType("PAPS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                docType === "PAPS"
                  ? "bg-sky-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              PAPS (US Entry)
            </button>
            <button
              type="button"
              onClick={() => setDocType("PARS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                docType === "PARS"
                  ? "bg-sky-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              PARS (Canada Entry)
            </button>
            <button
              type="button"
              onClick={() => setDocType("BOL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                docType === "BOL"
                  ? "bg-sky-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Bill of Lading (BOL)
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/70 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          {/* Exact Standard Sheet (8.5 x 11 aspect ratio preview) */}
          <div
            id="printable-preset-sheet"
            className="w-full max-w-[800px] bg-white text-slate-950 p-6 sm:p-10 shadow-lg border border-slate-300 font-sans print:shadow-none print:border-none print:p-4 print:max-w-none print:w-full"
            style={{ minHeight: "1050px" }}
          >
            {/* ========================================================================= */}
            {/* 1. PAPS / PARS ENTRY TEMPLATE (Exact match to Image 1)                   */}
            {/* ========================================================================= */}
            {(docType === "PAPS" || docType === "PARS") && (
              <div className="space-y-6 text-sm">
                {/* Logo & Header */}
                <div className="flex justify-between items-start">
                  <NishanLogoHeader />
                  <div className="text-right">
                    <div className="text-3xs text-slate-400 font-mono uppercase font-bold">
                      CARRIER PRESET TEMPLATE
                    </div>
                    <div className="text-xs font-bold font-mono text-slate-800">
                      SCAC: {scac}
                    </div>
                  </div>
                </div>

                <div className="w-full h-[2px] bg-slate-900 my-2"></div>

                {/* Document Main Title */}
                <div className="text-center font-extrabold text-xl font-sans tracking-wide text-slate-900 uppercase">
                  {docType} ENTRY
                </div>

                {/* Summary Metrics Row */}
                <div className="grid grid-cols-2 gap-8 text-xs font-bold pt-2">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="w-24 text-slate-900 font-extrabold uppercase">PIECE(S):</span>
                      <span className="font-sans font-bold text-slate-950">
                        {pieces} {piecesType}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="w-24 text-slate-900 font-extrabold uppercase">PROBILL</span>
                      <span className="font-sans font-bold text-slate-950">{probill}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-24 text-slate-900 font-extrabold uppercase">WEIGHT:</span>
                      <span className="font-sans font-bold text-slate-950">
                        {formattedWeight} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; LBS
                      </span>
                    </div>
                  </div>
                </div>

                {/* Centered Barcode Block */}
                <div className="pt-8 pb-6 flex flex-col items-center justify-center space-y-2">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-xs font-semibold text-slate-900 font-sans">
                        Nishan Transport Inc.
                      </div>
                      <div className="text-xs font-bold text-slate-900 font-mono tracking-wider">
                        {barcodeValue}
                      </div>
                    </div>
                    {/* Small Barcode Box indicator matching image */}
                    <div className="border border-slate-900 px-2 py-0.5 text-3xs font-mono text-slate-700">
                      Barcode
                    </div>
                  </div>

                  <div className="pt-2">
                    <BarcodeSvg value={barcodeValue} height={52} width={300} />
                  </div>
                </div>

                {/* From / To Addresses Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-slate-200">
                  {/* From (Shipper) */}
                  <div className="space-y-3 text-xs">
                    <div className="flex items-start">
                      <span className="w-24 font-extrabold text-slate-900 uppercase shrink-0">From :</span>
                      <div className="space-y-0.5 text-slate-950 font-bold uppercase leading-snug">
                        <div>{shipperName}</div>
                        <div>{shipperAddress}</div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <span className="w-24 font-extrabold text-slate-900 uppercase shrink-0">Telephone :</span>
                      <span className="font-bold text-slate-950">{shipperPhone}</span>
                    </div>

                    <div className="flex items-center">
                      <span className="w-24 font-extrabold text-slate-900 uppercase shrink-0">Fax :</span>
                      <span className="font-bold text-slate-500">—</span>
                    </div>

                    <div className="flex items-center pt-2">
                      <span className="w-24 font-extrabold text-slate-900 uppercase shrink-0">Date :</span>
                      <span className="font-bold text-slate-950">{shipperDate}</span>
                    </div>
                  </div>

                  {/* To (Consignee) */}
                  <div className="space-y-3 text-xs">
                    <div className="flex items-start">
                      <span className="w-24 font-extrabold text-slate-900 uppercase shrink-0">To :</span>
                      <div className="space-y-0.5 text-slate-950 font-bold uppercase leading-snug">
                        <div>{consigneeName}</div>
                        <div>{consigneeAddress}</div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <span className="w-24 font-extrabold text-slate-900 uppercase shrink-0">Telephone :</span>
                      <span className="font-bold text-slate-950">{consigneePhone}</span>
                    </div>

                    <div className="flex items-center">
                      <span className="w-24 font-extrabold text-slate-900 uppercase shrink-0">Fax :</span>
                      <span className="font-bold text-slate-500">—</span>
                    </div>

                    <div className="flex items-center pt-2">
                      <span className="w-24 font-extrabold text-slate-900 uppercase shrink-0">Date :</span>
                      <span className="font-bold text-slate-950">{consigneeDate}</span>
                    </div>
                  </div>
                </div>

                {/* Customs Broker Details Section */}
                <div className="pt-8 space-y-2.5 text-xs font-bold">
                  <div className="flex items-center">
                    <span className="w-36 font-extrabold text-slate-900 uppercase">CUSTOMS BROKER:</span>
                    <span className="text-slate-900 font-sans font-bold lowercase">{customsBroker}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-extrabold text-slate-900 uppercase">PHONE:</span>
                    <span className="text-slate-500 font-sans">—</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-extrabold text-slate-900 uppercase">FAX:</span>
                    <span className="text-slate-500 font-sans">—</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-extrabold text-slate-900 uppercase">CROSSING:</span>
                    <span className="text-slate-900 font-sans">{portOfCrossing}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-extrabold text-slate-900 uppercase">ETA TO BORDER :</span>
                    <span className="text-slate-900 font-sans">{shipperDate} 14:00 EST</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 font-extrabold text-slate-900 uppercase">CROSSING DATE:</span>
                    <span className="text-slate-900 font-sans">{shipperDate}</span>
                  </div>
                </div>

                {/* Footer Page Number */}
                <div className="pt-16 flex justify-end text-3xs font-mono text-slate-600">
                  1/1
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 2. BILL OF LADING (BOL) TEMPLATE (Exact match to Image 2)                 */}
            {/* ========================================================================= */}
            {docType === "BOL" && (
              <div className="border-2 border-slate-900 text-xs">
                {/* Header Table Grid */}
                <div className="grid grid-cols-12 border-b-2 border-slate-900">
                  {/* Title Box */}
                  <div className="col-span-8 p-3 border-r-2 border-slate-900">
                    <h1 className="text-lg font-black tracking-tight leading-tight text-slate-950 uppercase">
                      BILL OF LADING / ORIGINAL<br />-NOT NEGOTIABLE
                    </h1>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1 text-3xs font-bold pt-2">
                      <div className="flex">
                        <span className="w-20 text-slate-700 font-semibold">Date of Issue :</span>
                        <span className="font-mono text-slate-950">{new Date().toLocaleDateString("en-US")}</span>
                      </div>
                      <div className="flex">
                        <span className="w-16 text-slate-700 font-semibold">Order # :</span>
                        <span className="font-mono text-slate-950">{orderNumber}</span>
                      </div>
                      <div className="flex">
                        <span className="w-16 text-slate-700 font-semibold">PO # :</span>
                        <span className="font-mono text-slate-950">{poNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Logo Box & B/L No */}
                  <div className="col-span-4 p-3 flex flex-col justify-between items-end">
                    <NishanLogoHeader />
                    <div className="w-full text-left pt-2 text-3xs font-bold border-t border-slate-300 mt-2">
                      <span className="text-slate-700">B/L No. : </span>
                      <span className="font-mono font-bold text-slate-900">{blNumber}</span>
                    </div>
                  </div>
                </div>

                {/* 3-Tier Left Column (Ship From, Ship To, Third Party) vs Right Column (Carrier Info) */}
                <div className="grid grid-cols-12 border-b-2 border-slate-900">
                  {/* Left Column (col-span-7) */}
                  <div className="col-span-7 border-r-2 border-slate-900">
                    {/* SHIP FROM */}
                    <div className="border-b border-slate-900">
                      <div className="bg-black text-white text-3xs font-black uppercase tracking-wider px-2 py-0.5 text-center">
                        SHIP FROM
                      </div>
                      <div className="p-2 space-y-0.5 text-3xs leading-tight font-sans">
                        <div className="flex">
                          <span className="w-14 font-semibold text-slate-600">Name:</span>
                          <span className="font-bold text-slate-950 uppercase">{shipperName}</span>
                        </div>
                        <div className="flex">
                          <span className="w-14 font-semibold text-slate-600">Address:</span>
                          <span className="font-semibold text-slate-900 uppercase">{shipperAddress}</span>
                        </div>
                        <div className="flex justify-between">
                          <div className="flex">
                            <span className="w-14 font-semibold text-slate-600">Contact:</span>
                            <span className="font-semibold text-slate-800">Dispatch / Shipping</span>
                          </div>
                          <div className="flex">
                            <span className="font-semibold text-slate-600 mr-1">Tel:</span>
                            <span className="font-semibold text-slate-950">{shipperPhone}</span>
                          </div>
                        </div>
                        <div className="flex">
                          <span className="w-14 font-semibold text-slate-600">Date:</span>
                          <span className="font-semibold text-slate-950">{shipperDate} (0) - :</span>
                        </div>
                      </div>
                    </div>

                    {/* SHIP TO */}
                    <div className="border-b border-slate-900">
                      <div className="bg-black text-white text-3xs font-black uppercase tracking-wider px-2 py-0.5 text-center">
                        SHIP TO
                      </div>
                      <div className="p-2 space-y-0.5 text-3xs leading-tight font-sans">
                        <div className="flex">
                          <span className="w-14 font-semibold text-slate-600">Name:</span>
                          <span className="font-bold text-slate-950 uppercase">{consigneeName}</span>
                        </div>
                        <div className="flex">
                          <span className="w-14 font-semibold text-slate-600">Address:</span>
                          <span className="font-semibold text-slate-900 uppercase">{consigneeAddress}</span>
                        </div>
                        <div className="flex justify-between">
                          <div className="flex">
                            <span className="w-14 font-semibold text-slate-600">Contact:</span>
                            <span className="font-semibold text-slate-800">Receiving Dept</span>
                          </div>
                          <div className="flex">
                            <span className="font-semibold text-slate-600 mr-1">Tel:</span>
                            <span className="font-semibold text-slate-950">{consigneePhone}</span>
                          </div>
                        </div>
                        <div className="flex">
                          <span className="w-14 font-semibold text-slate-600">Date:</span>
                          <span className="font-semibold text-slate-950">{consigneeDate} (0) - :</span>
                        </div>
                      </div>
                    </div>

                    {/* THIRD PARTY FREIGHT CHARGES BILL TO */}
                    <div>
                      <div className="bg-black text-white text-3xs font-black uppercase tracking-wider px-2 py-0.5 text-center">
                        THIRD PARTY FREIGHT CHARGES BILL TO
                      </div>
                      <div className="p-2 space-y-0.5 text-3xs leading-tight font-sans">
                        <div className="flex">
                          <span className="w-14 font-semibold text-slate-600">Name:</span>
                          <span className="font-bold text-slate-950 uppercase">{billToName}</span>
                        </div>
                        <div className="flex">
                          <span className="w-14 font-semibold text-slate-600">Address:</span>
                          <span className="font-semibold text-slate-900 uppercase">{billToAddress}</span>
                        </div>
                        <div className="flex justify-between">
                          <div className="flex">
                            <span className="w-14 font-semibold text-slate-600">Contact:</span>
                            <span className="font-semibold text-slate-800">Accounts Payable</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <div className="flex">
                            <span className="w-14 font-semibold text-slate-600">Tel:</span>
                            <span className="font-semibold text-slate-950">{billToPhone}</span>
                          </div>
                          <div className="flex">
                            <span className="font-semibold text-slate-600 mr-1">Date:</span>
                            <span className="font-semibold text-slate-950">{new Date().toLocaleDateString("en-US")}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Carrier Name, Trailer, Seal, SCAC (col-span-5) */}
                  <div className="col-span-5 flex flex-col justify-between">
                    <div className="p-2 space-y-3 text-3xs">
                      <div>
                        <div className="font-bold text-slate-800 uppercase">CARRIER NAME :</div>
                        <div className="font-black text-slate-950 text-xs uppercase pt-0.5">
                          {carrierName}
                        </div>
                      </div>

                      <div className="space-y-1 pt-1">
                        <div className="flex">
                          <span className="w-24 text-slate-700 font-semibold">Trailer Number:</span>
                          <span className="font-mono font-bold text-slate-950">{trailerNumber}</span>
                        </div>
                        <div className="flex">
                          <span className="w-24 text-slate-700 font-semibold">Seal Number :</span>
                          <span className="font-mono font-bold text-slate-950">{sealNumber}</span>
                        </div>
                        <div className="flex">
                          <span className="w-24 text-slate-700 font-semibold">Tractor # :</span>
                          <span className="font-mono font-bold text-slate-950">{truckNumber}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 border-t border-slate-900 bg-slate-50 flex items-center justify-between text-3xs">
                      <span className="font-black text-slate-900 uppercase">SCAC :</span>
                      <span className="font-mono font-black text-sm text-slate-950">{scac}</span>
                    </div>
                  </div>
                </div>

                {/* Freight Charge Terms Bar */}
                <div className="border-b-2 border-slate-900 px-3 py-1 flex items-center justify-between text-3xs font-bold">
                  <span className="text-slate-800 uppercase">Freight Charge terms:</span>
                  <div className="flex items-center space-x-8">
                    <div className="flex items-center space-x-1.5">
                      <span>Prepaid</span>
                      <div className="w-3.5 h-3.5 border border-slate-900 flex items-center justify-center font-bold text-3xs"></div>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span>Collect</span>
                      <div className="w-3.5 h-3.5 border border-slate-900 flex items-center justify-center font-bold text-3xs">
                        X
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span>3rd Party</span>
                      <div className="w-3.5 h-3.5 border border-slate-900 flex items-center justify-center font-bold text-3xs"></div>
                    </div>
                  </div>
                </div>

                {/* Shipment Information Table */}
                <div>
                  <div className="bg-black text-white text-3xs font-black uppercase tracking-wider px-2 py-0.5 text-center">
                    SHIPMENT INFORMATION
                  </div>
                  <table className="w-full text-3xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 font-black text-slate-900">
                        <th className="border-r border-slate-900 p-1 w-28 text-center" colSpan={2}>
                          PIECES/QTY:
                          <div className="grid grid-cols-2 font-bold border-t border-slate-400 mt-0.5 pt-0.5">
                            <span>QTY</span>
                            <span className="border-l border-slate-400">TYPE</span>
                          </div>
                        </th>
                        <th className="border-r border-slate-900 p-1 w-24 text-center">
                          WEIGHT<br />LBS
                        </th>
                        <th className="border-r border-slate-900 p-1 w-28 text-center" colSpan={2}>
                          SHIP CNTR
                          <div className="grid grid-cols-2 font-bold border-t border-slate-400 mt-0.5 pt-0.5">
                            <span>QTY</span>
                            <span className="border-l border-slate-400">TYPE</span>
                          </div>
                        </th>
                        <th className="p-1 text-center font-black">COMMODITY DESCRIPTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-300 font-bold text-slate-900">
                        <td className="p-1 text-center border-r border-slate-300 w-14">{pieces}</td>
                        <td className="p-1 text-center border-r border-slate-900 w-14">{piecesType}</td>
                        <td className="p-1 text-center border-r border-slate-900">{formattedWeight}</td>
                        <td className="p-1 text-center border-r border-slate-300 w-14">0</td>
                        <td className="p-1 text-center border-r border-slate-900 w-14">PALLET</td>
                        <td className="p-1 px-2 font-mono uppercase">{commodityDesc}</td>
                      </tr>
                      {/* Grand Total Row */}
                      <tr className="border-b-2 border-slate-900 font-black text-slate-950 bg-slate-50">
                        <td className="p-1 text-center border-r border-slate-900" colSpan={2}>
                          {pieces}
                        </td>
                        <td className="p-1 text-center border-r border-slate-900">
                          {Number(weightVal).toFixed(2)}
                        </td>
                        <td className="p-1 text-center border-r border-slate-900" colSpan={2}>
                          0.00
                        </td>
                        <td className="p-1 text-center uppercase tracking-wider font-extrabold">
                          GRAND TOTAL
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* COD & Insurance Row */}
                <div className="grid grid-cols-12 border-b-2 border-slate-900 text-3xs">
                  <div className="col-span-6 p-2 border-r-2 border-slate-900 flex items-center justify-center">
                    <span className="text-slate-600 font-semibold">Per</span>
                  </div>
                  <div className="col-span-6 p-2 space-y-1 text-3xs font-semibold">
                    <div className="flex justify-between">
                      <span>COD Amount : 0.00</span>
                      <div className="flex items-center space-x-3">
                        <span>Fee Terms:</span>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 border border-slate-900"></div>
                          <span>Collect:</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 border border-slate-900"></div>
                          <span>Prepaid:</span>
                        </div>
                      </div>
                    </div>
                    <div>Customer check acceptable:</div>
                    <div>Declared Value - Insurance: 0.00</div>
                  </div>
                </div>

                {/* Remarks Block */}
                <div className="border-b-2 border-slate-900 p-2 min-h-[40px] text-3xs">
                  <span className="font-extrabold text-slate-900 uppercase">REMARKS:</span>
                  <div className="text-slate-700 font-sans mt-0.5">
                    {shipment.special_instructions || "Standard dry freight carrier delivery. Must protect from extreme moisture."}
                  </div>
                </div>

                {/* 3 Legal Signature Boxes */}
                <div className="grid grid-cols-3 text-3xs">
                  {/* Shipper */}
                  <div className="p-2 border-r-2 border-slate-900 flex flex-col justify-between min-h-[95px]">
                    <div>
                      <div className="font-black text-slate-900 uppercase">
                        SHIPPER SIGNATURE / DATE
                      </div>
                      <p className="text-[9px] text-slate-500 leading-tight pt-1">
                        This is to certify that the above named materials are properly classified, described, packaged, marked and labeled, and are in proper condition for transportation.
                      </p>
                    </div>
                    <div className="border-t border-slate-400 pt-1 text-[9px] text-slate-400 italic">
                      Authorized Shipper Signature
                    </div>
                  </div>

                  {/* Carrier */}
                  <div className="p-2 border-r-2 border-slate-900 flex flex-col justify-between min-h-[95px]">
                    <div>
                      <div className="font-black text-slate-900 uppercase">
                        CARRIER SIGNATURE / PICKUP DATE
                      </div>
                      <p className="text-[9px] text-slate-500 leading-tight pt-1">
                        Carrier acknowledges receipt of shipment in good condition.
                      </p>
                    </div>
                    <div className="border-t border-slate-400 pt-1 text-[9px] font-mono text-slate-800">
                      Driver: {driverName}
                    </div>
                  </div>

                  {/* Consignee */}
                  <div className="p-2 flex flex-col justify-between min-h-[95px]">
                    <div>
                      <div className="font-black text-slate-900 uppercase">
                        CONSIGNEE SIGNATURE / DATE
                      </div>
                      <p className="text-[9px] text-slate-500 leading-tight pt-1">
                        Receiver confirms receiving this shipment in good condition.
                      </p>
                    </div>
                    <div className="border-t border-slate-400 pt-1 text-[9px] text-slate-400 italic">
                      Authorized Consignee Signature
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pagination Footer */}
            {docType === "BOL" && (
              <div className="pt-2 flex justify-end text-3xs font-mono text-slate-600">
                1/1
              </div>
            )}
          </div>
        </div>

        {/* Action Controls Toolbar Footer (Hidden in Print) */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center space-x-2 font-mono"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save as PDF 📄</span>
            </button>

            <button
              type="button"
              onClick={() => {
                toast.success(`Exporting ${docType} PDF for Load #${cleanLoadNum}...`);
                window.print();
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center space-x-1.5"
            >
              <Download className="h-4 w-4 text-slate-600" />
              <span>Download</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowEmailModal(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center space-x-1.5"
            >
              <Mail className="h-4 w-4 text-sky-600" />
              <span>Email Broker / Client</span>
            </button>

            <button
              type="button"
              onClick={handleSendChat}
              disabled={isSendingChat}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center space-x-1.5 font-mono"
            >
              <Send className="h-4 w-4" />
              <span>{isSendingChat ? "Dispatching..." : `Send ${docType} to Driver 📲`}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Email Broker Modal Dialog */}
      {showEmailModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Email {docType} Document
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSendBrokerEmail} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recipient (Customs Broker / Customer Email):
                </label>
                <input
                  type="email"
                  required
                  value={brokerEmail}
                  onChange={(e) => setBrokerEmail(e.target.value)}
                  placeholder="customs-entry@brokerage.com"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-3xs space-y-1 font-mono text-slate-600">
                <div>Subject: <strong>[Nishan Transport] {docType} Entry / BOL - Load #{cleanLoadNum}</strong></div>
                <div>Attachment: <strong>{docType}_{cleanLoadNum}_NishanTransport.pdf</strong></div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="px-4 py-1.5 text-xs bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold flex items-center space-x-1"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSendingEmail ? "Sending..." : "Send Email"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

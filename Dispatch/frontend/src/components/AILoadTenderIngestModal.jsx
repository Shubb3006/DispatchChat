import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  X,
  RefreshCw,
  Building,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  Globe,
  Code,
  UploadCloud,
  Cpu,
  ShieldCheck,
  Activity,
  Zap,
} from "lucide-react";
import { axiosInstance } from "@/lib/axios";
import { useShipmentStore } from "../stores/useShipmentStore";
import toast from "react-hot-toast";

const SAMPLE_BROKER_EMAIL = `Subject: Load Confirmation - TRIP-4378 (Weston Wood Solutions -> Woodgrain)
From: dispatch@westonwood.com

Hello Nishan Transport Dispatch Team,

Please find attached the Load Confirmation & Rate Agreement for the following shipment:

- Broker/Customer: Weston Wood Solutions
- Billing: 60 Steckle Place, Kitchener, ON N2E 2C3
- Contact: Shipping Dept (Tel: 905 677-9120)
- Agreed All-In Rate: $2,850.00 USD
- Reference / PO #: TRIP-4378

SHIPPER (PICKUP):
Weston Wood Solutions
300 Orenda Road, Brampton ON L6T 1G1
Date: 08/24/2026 (Window: 08:00 - 14:00 EST)
Commodity: Lumber / Wood Millwork Products
Pieces: 1 Skids / Pallet (Weight: 3,856 LBS)

CONSIGNEE (DELIVERY):
Woodgrain Distribution Center
45150 Highway 27, Davenport FL 33896
Date: 08/26/2026 (09:00 EST)
Tel: 863 420-7723

Customs Broker: Livingston International (Cross-border US Inbound via Detroit Ambassador Bridge 3801).
Special Instructions: Driver must have clean 53ft dry van. Check in with dock lead upon arrival.

Please confirm receipt and send back your carrier load number.`;

export default function AILoadTenderIngestModal({
  isOpen,
  onClose,
  onLoadCreated,
}) {
  const { fetchShipments } = useShipmentStore();
  const [activeTab, setActiveTab] = useState("automation"); // "automation" | "manual" | "webhook"
  const [emailText, setEmailText] = useState(SAMPLE_BROKER_EMAIL);
  const [emailSubject, setEmailSubject] = useState("Load Confirmation - TRIP-4378");
  const [senderEmail, setSenderEmail] = useState("dispatch@westonwood.com");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [suggestedLoadNum, setSuggestedLoadNum] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Automation Worker State
  const [workerStatus, setWorkerStatus] = useState(null);
  const [isTriggeringWorker, setIsTriggeringWorker] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const fileInputRef = useRef(null);

  const fetchWorkerStatus = async () => {
    try {
      const res = await axiosInstance.get("/loads/automation/status");
      if (res.data?.success) {
        setWorkerStatus(res.data);
      }
    } catch (err) {
      console.warn("Could not fetch automation status:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWorkerStatus();
      const interval = setInterval(fetchWorkerStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTriggerIntakeNow = async () => {
    setIsTriggeringWorker(true);
    toast.loading("Scanning Gmail inbox for new load confirmations...", { id: "sync-toast" });
    try {
      const res = await axiosInstance.post("/loads/automation/trigger");
      toast.dismiss("sync-toast");
      if (res.data?.success) {
        toast.success(`Scan completed! Ingested ${res.data.processed || 0} new load(s).`);
        fetchShipments();
        fetchWorkerStatus();
      } else {
        toast.error(res.data?.reason || res.data?.message || "Sync completed with no new loads");
      }
    } catch (err) {
      toast.dismiss("sync-toast");
      toast.error("Failed to run intake cycle");
    } finally {
      setIsTriggeringWorker(false);
    }
  };

  const handlePdfUpload = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      toast.error("Please upload a valid PDF document");
      return;
    }

    setIsUploadingPdf(true);
    toast.loading(`Processing "${file.name}" with Gemini AI multimodal extractor...`, { id: "pdf-toast" });

    try {
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("subject", `Load Confirmation - ${file.name}`);
      formData.append("sender", senderEmail);

      const res = await axiosInstance.post("/loads/automation/upload-pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.dismiss("pdf-toast");
      if (res.data?.success) {
        setBookingResult(res.data);
        if (res.data.extraction_source === "gemini-ai") {
          toast.success(`🎉 Gemini AI extracted your PDF! Load #${res.data.load_number} created & assigned to ${res.data.assigned_team}.`);
        } else {
          toast.error(
            `⚠️ Gemini AI was NOT used — load #${res.data.load_number} contains SAMPLE fallback data, not your PDF. ${res.data.fallback_reason || "Add GEMINI_API_KEY on the backend server (Render)."}`,
            { duration: 10000 }
          );
        }
        fetchShipments();
        if (onLoadCreated) onLoadCreated(res.data.load);
      }
    } catch (err) {
      toast.dismiss("pdf-toast");
      toast.error(err.response?.data?.message || "Failed to process PDF tender");
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleAnalyzeEmail = async () => {
    if (!emailText.trim()) {
      toast.error("Please paste an email or rate confirmation text");
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await axiosInstance.post("/loads/parse-tender", {
        emailText,
        emailSubject,
        senderEmail,
      });

      if (res.data?.success && res.data?.tender) {
        setExtractedData(res.data.tender);
        setSuggestedLoadNum(res.data.suggestedLoadNumber || "582440");
        toast.success(`✨ Gemini AI successfully parsed the Load Confirmation!`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to parse tender with Gemini. Check server connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmAndCreateLoad = async () => {
    if (!extractedData) return;

    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/loads/inbound-tender", {
        tender: extractedData,
        load_number: suggestedLoadNum,
        emailSubject,
        senderEmail,
      });

      if (res.data?.success) {
        setBookingResult(res.data);
        toast.success(
          `🎉 Load #${res.data.load_number} entered & assigned to ${res.data.assigned_team}!`
        );
        fetchShipments();
        if (onLoadCreated) onLoadCreated(res.data.load);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create load in database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const webhookUrl = `${window.location.origin.replace("5173", "5500").replace("5174", "5500")}/api/v1/loads/inbound-tender`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedWebhook(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden font-sans">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-xl shadow-md text-white">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <span>AI Automated Load Confirmation Intake</span>
                <span className="text-3xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded font-mono font-bold">
                  100% Native Background Worker
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Gmail Watcher ➔ Gemini AI ➔ Supabase 'Entered' ➔ Team Routing (A-E) ➔ Customer & Customs Emails
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 bg-slate-100 border-b border-slate-200 flex space-x-4 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("automation")}
            className={`py-3 text-xs font-bold font-mono uppercase border-b-2 transition-all flex items-center space-x-1.5 whitespace-nowrap ${activeTab === "automation"
                ? "border-sky-600 text-sky-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
          >
            <Cpu className="h-4 w-4" />
            <span>⚡ Automated Gmail Worker</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`py-3 text-xs font-bold font-mono uppercase border-b-2 transition-all flex items-center space-x-1.5 whitespace-nowrap ${activeTab === "manual"
                ? "border-sky-600 text-sky-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Interactive AI Parser</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("webhook")}
            className={`py-3 text-xs font-bold font-mono uppercase border-b-2 transition-all flex items-center space-x-1.5 whitespace-nowrap ${activeTab === "webhook"
                ? "border-sky-600 text-sky-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
          >
            <Code className="h-4 w-4" />
            <span>API & Webhook Endpoints</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50 space-y-5">
          {/* TAB 1: AUTOMATED BACKGROUND WORKER */}
          {activeTab === "automation" && (
            <div className="space-y-6">
              {/* Telemetry Status Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-sky-50 text-sky-600 rounded-xl border border-sky-200">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 uppercase font-mono">
                        Autonomous Intake Engine Status
                      </h3>
                      <p className="text-2xs text-slate-500">
                        Runs continuously in the background every 2 minutes.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-3xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      BACKGROUND WORKER ACTIVE
                    </span>
                    <button
                      type="button"
                      disabled={isTriggeringWorker}
                      onClick={handleTriggerIntakeNow}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 transition-all font-mono"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isTriggeringWorker ? "animate-spin" : ""}`} />
                      <span>{isTriggeringWorker ? "Scanning..." : "Scan Gmail Now"}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-3xs text-slate-400 uppercase block">Gmail Mailbox</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {workerStatus?.gmailAccount || "dispatch@nishantransport.com"}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-3xs text-slate-400 uppercase block">Search Query</span>
                    <span className="font-bold text-sky-700 truncate block">
                      subject:"Load Confirmation"
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-3xs text-slate-400 uppercase block">Total Processed</span>
                    <span className="font-black text-emerald-600 text-sm block">
                      {workerStatus?.totalProcessed || 0} Loads
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-3xs text-slate-400 uppercase block">Cron Interval</span>
                    <span className="font-bold text-slate-700 block">
                      {workerStatus?.cronSchedule || "*/2 * * * *"} (2m)
                    </span>
                  </div>
                </div>
              </div>

              {/* Gemini configuration warning */}
              {workerStatus && workerStatus.geminiConfigured === false && (
                <div className="bg-red-50 border border-red-300 text-red-700 rounded-xl px-4 py-3 text-xs font-mono font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    GEMINI_API_KEY is missing on the backend server — PDF uploads will produce SAMPLE data, not real extraction.
                    Add the key in Render Dashboard → Environment, then redeploy.
                  </span>
                </div>
              )}

              {/* Drag-and-Drop Rate Confirmation Upload */}
              <div className="bg-white rounded-2xl border-2 border-dashed border-sky-300 hover:border-sky-500 transition-all p-6 text-center shadow-sm">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => handlePdfUpload(e.target.files?.[0])}
                />
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="p-4 bg-sky-50 text-sky-600 rounded-full">
                    <UploadCloud className={`h-8 w-8 ${isUploadingPdf ? "animate-bounce" : ""}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Drag & Drop PDF Load Confirmation / Rate Confirmation
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Gemini AI will extract all 12 fields, insert into Supabase as <span className="font-bold text-emerald-600">'Entered'</span>, assign Team A-E, and dispatch customer emails.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isUploadingPdf}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 font-mono"
                  >
                    <FileText className="h-4 w-4" />
                    <span>{isUploadingPdf ? "Processing with Gemini AI..." : "Select PDF Document"}</span>
                  </button>
                </div>
              </div>

              {/* Success Booking Result Display */}
              {bookingResult && (
                <div className="bg-white rounded-2xl border border-emerald-300 shadow-md p-6 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                      <div>
                        <h3 className="text-sm font-black uppercase font-mono text-emerald-900">
                          LOAD #{bookingResult.load_number} ENTERED & DISPATCHED!
                        </h3>
                        <p className="text-xs text-emerald-800">
                          Assigned to: <strong className="font-bold text-emerald-900">{bookingResult.assigned_team}</strong> ({bookingResult.team_description})
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-600 text-white text-3xs font-mono font-bold rounded-full uppercase">
                      Status: Entered
                    </span>
                  </div>

                  {/* Route & Cargo Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-3xs text-slate-400 font-bold uppercase block">Customer & Rate</span>
                      <div className="font-bold text-slate-900">{bookingResult.tender?.customer_name}</div>
                      <div className="text-xs font-bold text-emerald-600 mt-1">
                        ${Number(bookingResult.tender?.rate).toLocaleString()} {bookingResult.tender?.currency}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-3xs text-slate-400 font-bold uppercase block">Origin ➔ Destination</span>
                      <div className="font-bold text-slate-900 truncate">{bookingResult.tender?.origin}</div>
                      <div className="text-3xs text-slate-500">➔ {bookingResult.tender?.destination}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-3xs text-slate-400 font-bold uppercase block">Customs & Lead #</span>
                      <div className="font-bold text-slate-900">
                        {bookingResult.customs_entry ? `${bookingResult.customs_entry.lead_number_type}: ${bookingResult.customs_entry.lead_number}` : "Domestic CA"}
                      </div>
                      <div className="text-3xs text-indigo-600 font-bold">
                        Broker: {bookingResult.tender?.customs_broker || "N/A"}
                      </div>
                    </div>
                  </div>

                  {/* Customer Email & Customs Email Feedback */}
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono space-y-2 border border-slate-800">
                    <div className="flex items-center justify-between text-2xs text-sky-400">
                      <span>✉️ Automated Emails Dispatched:</span>
                      <span className="text-emerald-400 font-bold">Sent to: {bookingResult.tender?.customer_email}</span>
                    </div>
                    <div className="text-2xs text-slate-300">
                      • <strong>Step 7 Customer Confirmation:</strong> Subject: <em>Load Entered — NISHAN-{bookingResult.load_number}</em><br />
                      {bookingResult.is_cross_border && (
                        <span>• <strong>Step 8 Customs Documents Request:</strong> Subject: <em>Customs Documents Required — Load NISHAN-{bookingResult.load_number}</em></span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Live Activity Logs */}
              {workerStatus?.recentLogs && workerStatus.recentLogs.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
                  <span className="text-3xs font-mono font-bold text-slate-400 uppercase block">
                    Live Worker Activity Feed:
                  </span>
                  <div className="bg-slate-950 text-slate-200 p-3 rounded-xl font-mono text-2xs max-h-36 overflow-y-auto space-y-1">
                    {workerStatus.recentLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <span className="text-slate-500 shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span
                          className={
                            log.type === "success"
                              ? "text-emerald-400"
                              : log.type === "error"
                                ? "text-rose-400"
                                : log.type === "warning"
                                  ? "text-amber-400"
                                  : "text-slate-300"
                          }
                        >
                          {log.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INTERACTIVE AI PARSER */}
          {activeTab === "manual" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase font-mono">
                    <Mail className="h-4 w-4 text-sky-600" />
                    <span>Paste Incoming Load Confirmation Email</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmailText(SAMPLE_BROKER_EMAIL)}
                    className="text-3xs font-mono text-sky-600 hover:text-sky-800 font-bold hover:underline"
                  >
                    Reset to Sample Tender
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                      Sender Email (Customer):
                    </label>
                    <input
                      type="email"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                      Email Subject:
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                    Email Body / Rate Confirmation Text:
                  </label>
                  <textarea
                    rows={6}
                    value={emailText}
                    onChange={(e) => setEmailText(e.target.value)}
                    placeholder="Paste incoming rate confirmation text or load tender email here..."
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:bg-white bg-slate-50 leading-relaxed resize-y"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={isAnalyzing}
                    onClick={handleAnalyzeEmail}
                    className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-all cursor-pointer font-mono"
                  >
                    <Sparkles className={`h-4 w-4 ${isAnalyzing ? "animate-spin" : ""}`} />
                    <span>{isAnalyzing ? "Extracting with Gemini AI..." : "Extract with Gemini AI 🤖"}</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Extracted Structured JSON & Review */}
              {extractedData && (
                <div className="bg-white rounded-2xl border border-sky-200 shadow-md p-5 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <h3 className="text-xs font-black uppercase text-slate-900 font-mono">
                        2. Gemini AI Structured Extraction & Verification
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-3xs text-slate-500 font-bold uppercase font-mono">
                        Assigned Load #:
                      </span>
                      <input
                        type="text"
                        value={suggestedLoadNum}
                        onChange={(e) => setSuggestedLoadNum(e.target.value)}
                        className="w-24 px-2 py-1 bg-sky-50 border border-sky-300 text-sky-800 font-mono font-bold text-xs rounded-lg text-center"
                      />
                    </div>
                  </div>

                  {/* 3 Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-3xs font-bold text-slate-400 uppercase font-mono">
                        Customer & Billing
                      </span>
                      <div className="font-bold text-slate-900">{extractedData.customer_name}</div>
                      <div className="text-3xs text-slate-500">{extractedData.customer_email}</div>
                      <div className="text-xs font-bold text-emerald-600 pt-1">
                        Rate: ${Number(extractedData.rate).toLocaleString()} {extractedData.currency}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-3xs font-bold text-slate-400 uppercase font-mono">
                        Pickup (Shipper)
                      </span>
                      <div className="font-bold text-slate-900">{extractedData.shipper_name}</div>
                      <div className="text-3xs text-slate-600">{extractedData.shipper_street_address || extractedData.shipper_address}</div>
                      <div className="text-3xs font-mono text-sky-700 font-bold pt-1">
                        Date: {extractedData.pickup_date} ({extractedData.pickup_time})
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-3xs font-bold text-slate-400 uppercase font-mono">
                        Delivery (Consignee)
                      </span>
                      <div className="font-bold text-slate-900">{extractedData.consignee_name}</div>
                      <div className="text-3xs text-slate-600">{extractedData.consignee_street_address || extractedData.consignee_address}</div>
                      <div className="text-3xs font-mono text-sky-700 font-bold pt-1">
                        Date: {extractedData.delivery_date} ({extractedData.delivery_time})
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setExtractedData(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleConfirmAndCreateLoad}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-all cursor-pointer font-mono"
                    >
                      <Check className="h-4 w-4" />
                      <span>{isSubmitting ? "Booking Load..." : "Confirm & Enter Load in Supabase 🚀"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WEBHOOK API */}
          {activeTab === "webhook" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 text-xs">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase font-mono">
                  Direct Ingestion Webhook / API
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  You can also POST directly to this endpoint from external scripts, Make.com, or email relays:
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-3xs font-bold text-slate-400 uppercase font-mono">
                  Webhook Target Endpoint (POST):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="flex-1 px-3 py-2 bg-slate-900 text-sky-400 font-mono text-xs rounded-xl border border-slate-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(webhookUrl)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center space-x-1 transition-colors"
                  >
                    {copiedWebhook ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedWebhook ? "Copied" : "Copy URL"}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-3xs font-bold text-slate-400 uppercase font-mono">
                  Sample JSON Payload:
                </label>
                <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-2xs overflow-x-auto border border-slate-800 leading-relaxed">
                  {`{
  "emailSubject": "Load Confirmation - TRIP-4378",
  "senderEmail": "dispatch@westonwood.com",
  "emailText": "Please accept load tender for Weston Wood Solutions to Woodgrain Davenport FL for $2,850 USD..."
}`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
//sjdwd

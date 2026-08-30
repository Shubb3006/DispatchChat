import React, { useState, useRef } from "react";
import {
  Truck,
  MapPin,
  Package,
  Calendar,
  Weight,
  Copy,
  Check,
  ShieldCheck,
  Camera,
  FileText,
  Loader2,
  Navigation,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const parseLoadCardText = (text) => {
  if (!text) return null;
  const loadNumMatch = text.match(/#([0-9a-zA-Z_-]+)/) || text.match(/\$([0-9a-zA-Z_-]+)/) || text.match(/LOAD DETAILS\s*\(([^)]+)\)/i);
  const pickupNumMatch = text.match(/PICKUP #:\s*(.*?)(?=\n|🏢|🗺️|$)/i) || text.match(/Pickup #:\s*(.*?)(?=\n|$)/i);
  const shipperMatch = text.match(/SHIPPER:\s*(.*?)(?=\n|🗺️|🏢|$)/i);
  const shipperAddrMatch = text.match(/SHIPPER ADDR:\s*(.*?)(?=\n|🏢|📦|$)/i);
  const consigneeMatch = text.match(/CONSIGNEE:\s*(.*?)(?=\n|🗺️|🏢|$)/i);
  const consigneeAddrMatch = text.match(/CONSIGNEE ADDR:\s*(.*?)(?=\n|📦|📊|$)/i);
  const piecesMatch = text.match(/Pieces\/Skids:\s*(.*?)(?=\n|$)/i);
  const weightMatch = text.match(/Weight:\s*(.*?)(?=\n|$)/i);
  const commitmentMatch = text.match(/Commitment:\s*(.*?)(?=\n|$)/i) || text.match(/Commodity:\s*(.*?)(?=\n|$)/i);
  const pickupDateMatch = text.match(/Pickup Date:\s*(.*?)(?=\n|$)/i);
  const deliveryDateMatch = text.match(/Delivery Date:\s*(.*?)(?=\n|$)/i);
  const statusMatch = text.match(/STATUS:\s*(.*?)(?=\n|$)/i);

  const isDelivery = text.includes("DELIVERY MANIFEST") || text.includes("($");

  return {
    loadNumber: loadNumMatch ? loadNumMatch[1] : "LOAD",
    pickupNumber: pickupNumMatch ? pickupNumMatch[1].trim() : "N/A",
    shipper: shipperMatch ? shipperMatch[1].trim() : "N/A",
    shipperAddr: shipperAddrMatch ? shipperAddrMatch[1].trim() : "N/A",
    consignee: consigneeMatch ? consigneeMatch[1].trim() : "N/A",
    consigneeAddr: consigneeAddrMatch ? consigneeAddrMatch[1].trim() : "N/A",
    pieces: piecesMatch ? piecesMatch[1].trim() : "N/A",
    weight: weightMatch ? weightMatch[1].trim() : "N/A",
    commitment: commitmentMatch ? commitmentMatch[1].trim() : "Normal Delivery",
    date: isDelivery && deliveryDateMatch ? deliveryDateMatch[1].trim() : pickupDateMatch ? pickupDateMatch[1].trim() : "N/A",
    status: statusMatch ? statusMatch[1].trim() : "ASSIGNED",
    isDelivery,
  };
};

const LoadCard = ({ text, rawMessage }) => {
  const [copied, setCopied] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Document upload state
  const [isUploading, setIsUploading] = useState(false);
  const [skidPhotoUrl, setSkidPhotoUrl] = useState(null);
  const [bolDocUrl, setBolDocUrl] = useState(null);
  const [podDocUrl, setPodDocUrl] = useState(null);

  const fileInputRef = useRef(null);
  const [uploadDocType, setUploadDocType] = useState("skid_picture");

  const loadData = parseLoadCardText(text);

  if (!loadData) {
    return <div className="text-sm">{text}</div>;
  }

  const { loadNumber, pickupNumber, shipper, shipperAddr, consignee, consigneeAddr, pieces, weight, commitment, date, status: initialStatus, isDelivery } = loadData;
  const activeStatus = currentStatus || initialStatus;

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Load details copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleStatusUpdate = async (newStatus) => {
    setIsUpdatingStatus(true);
    try {
      await axiosInstance.post("/load/update-status", {
        loadNumber,
        status: newStatus,
        groupId: rawMessage?.groupId,
        receiverId: rawMessage?.receiverId,
      });

      setCurrentStatus(newStatus.toUpperCase().replace(/_/g, " "));
      toast.success(`Status updated: ${newStatus.toUpperCase().replace(/_/g, " ")}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update load status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const triggerFileUpload = (type) => {
    setUploadDocType(type);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error("File size must be under 15MB");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      setIsUploading(true);
      try {
        if (uploadDocType === "bol") {
          const formData = new FormData();
          formData.append("load_id", loadNumber);
          formData.append("bol_image", file);
          if (rawMessage?.groupId && String(rawMessage.groupId) !== "undefined" && String(rawMessage.groupId) !== "null") {
            formData.append("groupId", rawMessage.groupId);
          }
          if (rawMessage?.receiverId && String(rawMessage.receiverId) !== "undefined" && String(rawMessage.receiverId) !== "null") {
            formData.append("receiverId", rawMessage.receiverId);
          }

          const res = await axiosInstance.post("/load/upload-bol", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          setBolDocUrl(res.data.document?.imageUrl || base64Image);
          setCurrentStatus("BOL PENDING APPROVAL");
          toast.success("📄 BOL uploaded and sent to Supabase!");
        } else {
          const res = await axiosInstance.post("/load/upload-document", {
            loadNumber,
            documentType: uploadDocType,
            image: base64Image,
            groupId: rawMessage?.groupId,
            receiverId: rawMessage?.receiverId,
          });

          if (uploadDocType === "skid_picture") {
            setSkidPhotoUrl(res.data.imageUrl);
            toast.success("📸 Skid Picture saved to Supabase & Fleet Vault!");
          } else if (uploadDocType === "pod") {
            setPodDocUrl(res.data.imageUrl);
            setCurrentStatus("DELIVERED");
            toast.success("📄 POD Document saved to Supabase & Load Delivered!");
          }
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to upload document");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
  };

  const getStatusColor = (st) => {
    const upper = (st || "").toUpperCase();
    if (upper.includes("DELIVERED")) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (upper.includes("TRANSIT")) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    if (upper.includes("SITE") || upper.includes("ARRIVED")) return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    return "bg-sky-500/20 text-sky-400 border-sky-500/30";
  };

  return (
    <div className="w-full max-w-md bg-slate-900 text-slate-100 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 my-1 font-sans">
      {/* Hidden File Input for Skid Photo, BOL & POD Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,application/pdf"
        className="hidden"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`size-9 rounded-2xl border flex items-center justify-center shadow-md ${
            isDelivery ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-amber-500/20 border-amber-500/30 text-amber-400"
          }`}>
            <Truck className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base text-white tracking-wide">
                {isDelivery ? `DELIVERY $${loadNumber}` : `LOAD #${loadNumber}`}
              </span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getStatusColor(activeStatus)}`}>
                {activeStatus}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                PU #: {pickupNumber}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                {isDelivery ? "Delivery Manifest" : "Pickup Manifest"}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="btn btn-ghost btn-circle btn-xs text-slate-400 hover:text-white hover:bg-slate-800/60"
          title="Copy Details"
        >
          {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
        </button>
      </div>

      {/* Route Timeline (Shipper -> Consignee) */}
      <div className="p-4 space-y-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-amber-500 before:to-emerald-500">

          {/* Shipper Block (Origin) */}
          <div className="relative">
            <div className="absolute -left-6 top-0.5 size-3.5 rounded-full bg-amber-500 ring-4 ring-slate-900 flex items-center justify-center">
              <span className="size-1.5 rounded-full bg-slate-950"></span>
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
              <span>Shipper (Pickup)</span>
            </div>
            <div className="font-bold text-sm text-slate-100 mt-0.5">{shipper}</div>
            <div className="text-xs text-slate-400 flex items-start gap-1 mt-0.5">
              <MapPin className="size-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span>{shipperAddr}</span>
            </div>
          </div>

          {/* Consignee Block (Destination) */}
          <div className="relative pt-1">
            <div className="absolute -left-6 top-1.5 size-3.5 rounded-full bg-emerald-500 ring-4 ring-slate-900 flex items-center justify-center">
              <span className="size-1.5 rounded-full bg-slate-950"></span>
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
              <span>Consignee (Delivery)</span>
            </div>
            <div className="font-bold text-sm text-slate-100 mt-0.5">{consignee}</div>
            <div className="text-xs text-slate-400 flex items-start gap-1 mt-0.5">
              <MapPin className="size-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span>{consigneeAddr}</span>
            </div>
          </div>

        </div>

        {/* Cargo Grid (2x2) */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Package className="size-3 text-amber-400" /> Skids / Pieces
            </span>
            <div className="font-black text-sm text-slate-200 mt-0.5">{pieces}</div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Weight className="size-3 text-sky-400" /> Weight
            </span>
            <div className="font-black text-sm text-slate-200 mt-0.5">{weight}</div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <ShieldCheck className="size-3 text-purple-400" /> Commitment
            </span>
            <div className="font-black text-xs text-slate-200 mt-0.5 truncate">{commitment}</div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Calendar className="size-3 text-emerald-400" /> {isDelivery ? "Delivery Date" : "Pickup Date"}
            </span>
            <div className="font-bold text-[11px] text-slate-200 mt-0.5 truncate">{date}</div>
          </div>
        </div>

        {/* Document Status Badges */}
        {(skidPhotoUrl || bolDocUrl || podDocUrl) && (
          <div className="space-y-1.5 pt-1">
            {skidPhotoUrl && (
              <div className="flex items-center justify-between text-xs bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl text-emerald-400">
                <span className="flex items-center gap-1.5 font-bold">
                  <Camera className="size-3.5" /> Skid Photo Saved to Supabase
                </span>
                <a href={skidPhotoUrl} target="_blank" rel="noreferrer" className="underline text-[10px] uppercase font-bold">View</a>
              </div>
            )}
            {bolDocUrl && (
              <div className="flex items-center justify-between text-xs bg-sky-500/10 border border-sky-500/20 p-2 rounded-xl text-sky-400">
                <span className="flex items-center gap-1.5 font-bold">
                  <FileText className="size-3.5" /> BOL Document Saved to Supabase
                </span>
                <a href={bolDocUrl} target="_blank" rel="noreferrer" className="underline text-[10px] uppercase font-bold">View</a>
              </div>
            )}
            {podDocUrl && (
              <div className="flex items-center justify-between text-xs bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl text-emerald-400">
                <span className="flex items-center gap-1.5 font-bold">
                  <FileText className="size-3.5" /> POD Document Saved to Supabase
                </span>
                <a href={podDocUrl} target="_blank" rel="noreferrer" className="underline text-[10px] uppercase font-bold">View</a>
              </div>
            )}
          </div>
        )}

        {/* Driver Interactive Workflow Actions */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          {isDelivery ? (
            <>
              {/* Delivery Action 1: Mark Arrived at Consignee Site */}
              <button
                onClick={() => handleStatusUpdate("at_consignee_site")}
                disabled={isUpdatingStatus}
                className={`w-full py-2.5 px-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  activeStatus.includes("CONSIGNEE") || activeStatus.includes("DELIVERED")
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-95"
                }`}
              >
                {isUpdatingStatus ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Navigation className="size-4" />
                )}
                {activeStatus.includes("CONSIGNEE") || activeStatus.includes("DELIVERED") ? "📍 AT CONSIGNEE SITE ✓" : "📍 MARK AT CONSIGNEE SITE"}
              </button>

              {/* Delivery Action 2: Send POD Document */}
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => triggerFileUpload("pod")}
                  disabled={isUploading}
                  className={`py-2.5 px-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all ${
                    podDocUrl
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 active:scale-95"
                  }`}
                >
                  {isUploading && uploadDocType === "pod" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <FileText className="size-3.5" />
                  )}
                  {podDocUrl ? "POD Uploaded ✓" : "📄 Send POD"}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Pickup Action 1: Mark Arrived At Shipper Site */}
              <button
                onClick={() => handleStatusUpdate("at_site")}
                disabled={isUpdatingStatus}
                className={`w-full py-2.5 px-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  activeStatus.includes("SITE") || activeStatus.includes("TRANSIT")
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20 active:scale-95"
                }`}
              >
                {isUpdatingStatus ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Navigation className="size-4" />
                )}
                {activeStatus.includes("SITE") || activeStatus.includes("TRANSIT") ? "📍 AT SHIPPER SITE ✓" : "📍 MARK AT SHIPPER SITE"}
              </button>

              {/* Pickup Action 2: Document Upload Buttons (Skid Photo & BOL) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => triggerFileUpload("skid_picture")}
                  disabled={isUploading}
                  className={`py-2 px-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all ${
                    skidPhotoUrl
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 active:scale-95"
                  }`}
                >
                  {isUploading && uploadDocType === "skid_picture" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Camera className="size-3.5 text-amber-400" />
                  )}
                  {skidPhotoUrl ? "Skid Photo ✓" : "Skid Photo"}
                </button>

                <button
                  onClick={() => triggerFileUpload("bol")}
                  disabled={isUploading}
                  className={`py-2 px-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all ${
                    bolDocUrl
                      ? "bg-sky-500/20 text-sky-400 border-sky-500/30"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 active:scale-95"
                  }`}
                >
                  {isUploading && uploadDocType === "bol" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <FileText className="size-3.5 text-sky-400" />
                  )}
                  {bolDocUrl ? "Send BOL ✓" : "Send BOL"}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default LoadCard;

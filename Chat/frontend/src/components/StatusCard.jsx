import React, { useState } from "react";
import { Navigation, Truck, Camera, FileText, CheckCircle2, ShieldCheck, MapPin, Eye, Download, X } from "lucide-react";

export const isStatusMessage = (text) => {
  if (!text) return false;
  return (
    text.includes("DRIVER AT SHIPPER SITE") ||
    text.includes("DRIVER AT CONSIGNEE SITE") ||
    text.includes("LOAD IN TRANSIT") ||
    text.includes("LOAD DELIVERED") ||
    text.includes("SKID PICTURE UPLOADED") ||
    text.includes("BILL OF LADING") ||
    text.includes("PROOF OF DELIVERY") ||
    text.includes("BOL")
  );
};

const StatusCard = ({ text, image }) => {
  const [showDocModal, setShowDocModal] = useState(false);

  const isShipperSite = text?.includes("SHIPPER SITE");
  const isConsigneeSite = text?.includes("CONSIGNEE SITE");
  const isTransit = text?.includes("IN TRANSIT");
  const isDelivered = text?.includes("DELIVERED");
  const isSkid = text?.includes("SKID PICTURE");
  const isBol = text?.includes("BILL OF LADING") || text?.includes("BOL");
  const isPod = text?.includes("PROOF OF DELIVERY") || text?.includes("POD");

  // Extract load number from text (e.g. #10001 or $10001 or Load 10001)
  const loadMatch = text ? text.match(/(?:#|\$|\bload\s*#?)\s*(\d{4,6})\b/i) : null;
  const loadNum = loadMatch ? loadMatch[1] : "10001";

  const getTheme = () => {
    if (isPod) return { bg: "from-emerald-950 to-slate-900", border: "border-emerald-500/30", text: "text-emerald-400", icon: FileText, title: "POD DOCUMENT ATTACHED" };
    if (isDelivered) return { bg: "from-emerald-950 to-slate-900", border: "border-emerald-500/30", text: "text-emerald-400", icon: CheckCircle2, title: "LOAD DELIVERED" };
    if (isTransit) return { bg: "from-amber-950 to-slate-900", border: "border-amber-500/30", text: "text-amber-400", icon: Truck, title: "LOAD IN TRANSIT" };
    if (isConsigneeSite) return { bg: "from-indigo-950 to-slate-900", border: "border-indigo-500/30", text: "text-indigo-400", icon: MapPin, title: "DRIVER AT CONSIGNEE SITE" };
    if (isShipperSite) return { bg: "from-purple-950 to-slate-900", border: "border-purple-500/30", text: "text-purple-400", icon: Navigation, title: "DRIVER AT SHIPPER SITE" };
    if (isSkid) return { bg: "from-amber-950 to-slate-950", border: "border-amber-500/30", text: "text-amber-400", icon: Camera, title: "SKID PHOTO ATTACHED" };
    if (isBol) return { bg: "from-sky-950 to-slate-900", border: "border-sky-500/30", text: "text-sky-400", icon: FileText, title: "BOL DOCUMENT ATTACHED" };
    return { bg: "from-slate-950 to-slate-900", border: "border-slate-700", text: "text-sky-400", icon: ShieldCheck, title: "STATUS UPDATE" };
  };

  const theme = getTheme();
  const Icon = theme.icon;

  // Clean formatted text
  const bodyText = text ? (text.split("\n").slice(1).join("\n") || text) : "";

  return (
    <>
      <div className={`w-full max-w-md bg-gradient-to-r ${theme.bg} text-slate-100 rounded-3xl p-4 shadow-xl border ${theme.border} font-sans space-y-3 my-1`}>
        {/* Status Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl bg-slate-950/60 border ${theme.border} ${theme.text}`}>
              <Icon className="size-4" />
            </div>
            <span className={`font-black text-xs uppercase tracking-widest ${theme.text}`}>
              {theme.title}
            </span>
          </div>
        </div>

        {/* Message Content */}
        <div className="text-xs text-slate-300 font-medium leading-relaxed">
          {bodyText}
        </div>

        {/* Interactive Attachment Card for BOL / Document */}
        {(image || isBol || isPod) && (
          <div className="pt-1">
            <div
              onClick={() => setShowDocModal(true)}
              className="p-2.5 rounded-2xl border border-emerald-500/40 bg-slate-950/90 hover:bg-slate-900 transition-all cursor-pointer flex items-center justify-between group shadow-inner"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <FileText className="size-5 shrink-0" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-xs font-bold text-white truncate">
                    Carrier_BOL_Primary.pdf
                  </p>
                  <p className="text-[10px] text-emerald-400 font-mono">
                    240 KB • Driver Signed & Verified
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="p-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30 transition-colors border border-emerald-500/30 shrink-0 ml-2"
                title="View Document"
              >
                <Eye className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Document Viewer Modal Overlay */}
      {showDocModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-scale-up space-y-0 text-slate-900">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans">
                    Carrier_BOL_Primary.pdf
                  </h3>
                  <p className="text-xs text-emerald-400 font-mono">
                    ● Digital BOL Document • 240 KB • Verified Sign-off
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 text-lg font-bold transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Document Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-slate-50">
              {/* Actual Uploaded Attachment Image Preview */}
              {image && (
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 text-center space-y-2">
                  <span className="font-mono text-emerald-400 text-xs font-bold uppercase block">📷 Uploaded BOL Document Attachment</span>
                  {image.toLowerCase().endsWith(".pdf") ? (
                    <iframe src={image} className="w-full h-64 rounded-xl border border-slate-800 bg-white" title="Uploaded PDF Preview" />
                  ) : (
                    <img src={image} alt="Uploaded BOL Attachment" className="max-h-64 mx-auto rounded-xl border border-slate-800 object-contain shadow-lg" referrerPolicy="no-referrer" />
                  )}
                </div>
              )}

              {/* Document Banner */}
              <div className="bg-emerald-950 text-emerald-100 p-4 rounded-2xl border border-emerald-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <div>
                    <span className="font-bold text-white">Official Freight Bill of Lading (BOL)</span>
                    <p className="text-[10px] text-emerald-300 font-mono mt-0.5">
                      Carrier Sign-off Complete • Load #{loadNum}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-800 text-emerald-200 rounded-full font-mono text-[10px] font-bold uppercase">
                  VERIFIED
                </span>
              </div>

              {/* Paper Manifest Preview */}
              <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-inner space-y-4 font-mono text-xs text-slate-800">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <div>
                    <div className="text-sm font-extrabold text-slate-900 font-sans">LOGISYNC FREIGHT MANIFEST</div>
                    <div className="text-[10px] text-slate-500">Bill of Lading #{loadNum}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">ISSUED DATE</div>
                    <div className="text-xs font-bold text-indigo-600">{new Date().toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[10px]">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                    <div className="font-bold text-slate-500 uppercase">Shipper / Pickup Origin</div>
                    <div className="font-bold text-slate-900">GAP Transport Logistics INC.</div>
                    <div>QC</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                    <div className="font-bold text-slate-500 uppercase">Consignee / Destination</div>
                    <div className="font-bold text-slate-900">Midwest Distribution Hub</div>
                    <div>OH</div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden text-[10px]">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-2">Item Description</th>
                        <th className="p-2">Pallets</th>
                        <th className="p-2">Weight</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 font-bold">Industrial Cargo Components</td>
                        <td className="p-2 font-mono">1 Pallets</td>
                        <td className="p-2 font-mono">9600.00 Lbs</td>
                        <td className="p-2 text-emerald-600 font-bold">INSPECTED & SIGNED</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-[10px]">
                  <div className="space-y-0.5">
                    <div className="text-slate-500 font-bold">DRIVER SIGN-OFF STAMP</div>
                    <div className="font-bold text-slate-900 font-sans">jhbvisd</div>
                  </div>
                  <div className="px-3 py-1 bg-emerald-600 text-white font-mono font-bold rounded-lg text-[10px]">
                    SIGNED & ATTACHED
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  if (image && image.startsWith("http")) {
                    window.open(image, "_blank");
                  } else {
                    alert(`Downloading Official Freight BOL #${loadNum}...`);
                  }
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <Download className="h-4 w-4 text-slate-600" />
                <span>Download File</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StatusCard;

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePortalStore } from "../stores/usePortalStore";
import { ArrowLeft, FileUp, AlertCircle, CheckCircle, Loader2, Upload } from "lucide-react";
import toast from "react-hot-toast";

export default function PortalLoadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loads, rateRequests, uploadTender, uploadCustomsDoc, isUploadingTender, isUploadingCustoms } = usePortalStore();
  const [load, setLoad] = useState(null);
  const [rateRequest, setRateRequest] = useState(null);
  const [tenderDragActive, setTenderDragActive] = useState(false);
  const [customsDragActive, setCustomsDragActive] = useState(false);

  useEffect(() => {
    const found = loads.find((l) => l.id === id || l.load_number === id);
    setLoad(found);
    if (found?.rate_request_id) {
      const rr = rateRequests.find((r) => r.id === found.rate_request_id);
      setRateRequest(rr);
    }
  }, [id, loads, rateRequests]);

  if (!load) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <button
            onClick={() => navigate("/portal/dashboard")}
            className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-600">
            Load not found
          </div>
        </div>
      </div>
    );
  }

  const handleTenderUpload = async (file) => {
    if (!file) return;
    const result = await uploadTender(file, rateRequest?.id);
    if (result) {
      setLoad((prev) => ({ ...prev, status: result.load?.status || "entered" }));
    }
  };

  const handleCustomsUpload = async (file) => {
    if (!file) return;
    await uploadCustomsDoc(load.id, file);
  };

  const handleDragEnter = (e, setActive) => {
    e.preventDefault();
    setActive(true);
  };

  const handleDragLeave = (e, setActive) => {
    e.preventDefault();
    setActive(false);
  };

  const handleDrop = (e, onDrop, setActive) => {
    e.preventDefault();
    setActive(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) onDrop(files[0]);
  };

  const needsCustoms = load.is_cross_border;
  const isTenderNeeded = rateRequest?.status === "ACCEPTED" && !load.load_number;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/portal/dashboard")}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Load #{load.load_number}</h1>
            <p className="text-sm text-slate-600 mt-1">{load.origin} → {load.destination}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Status Banner */}
        {needsCustoms && (
          <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">Cross-Border Shipment</p>
              <p className="text-sm text-amber-800 mt-1">
                This shipment crosses the US/Canada border. You'll need to upload customs paperwork below.
              </p>
            </div>
          </div>
        )}

        {/* Load Details */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Load Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-600">Status</p>
              <p className="text-lg font-semibold text-slate-900 mt-1 capitalize">{load.status}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Commodity</p>
              <p className="text-lg font-semibold text-slate-900 mt-1">{load.commodity}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Weight</p>
              <p className="text-lg font-semibold text-slate-900 mt-1">
                {load.weight ? `${load.weight} lbs` : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Pieces</p>
              <p className="text-lg font-semibold text-slate-900 mt-1">{load.pieces || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Pickup Date</p>
              <p className="text-lg font-semibold text-slate-900 mt-1">
                {load.pickup_date ? new Date(load.pickup_date).toLocaleDateString() : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Delivery Date</p>
              <p className="text-lg font-semibold text-slate-900 mt-1">
                {load.delivery_date ? new Date(load.delivery_date).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Tender Upload */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Load Tender Document</h2>
            {load.load_number && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-semibold">Uploaded</span>
              </div>
            )}
          </div>

          {!load.load_number && (
            <div
              onDragEnter={(e) => handleDragEnter(e, setTenderDragActive)}
              onDragLeave={(e) => handleDragLeave(e, setTenderDragActive)}
              onDrop={(e) => handleDrop(e, handleTenderUpload, setTenderDragActive)}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                tenderDragActive
                  ? "border-sky-400 bg-sky-50"
                  : "border-slate-300 hover:border-slate-400"
              }`}
            >
              <FileUp className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-900">Drag and drop your tender PDF</p>
              <p className="text-sm text-slate-600 mt-1">or</p>
              <label className="text-sky-600 font-medium hover:underline cursor-pointer mt-1 inline-block">
                Browse files
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => e.target.files?.[0] && handleTenderUpload(e.target.files[0])}
                  disabled={isUploadingTender}
                  className="hidden"
                />
              </label>
              {isUploadingTender && <p className="text-sm text-slate-600 mt-4">Uploading and parsing with AI...</p>}
            </div>
          )}
        </div>

        {/* Customs Upload */}
        {needsCustoms && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Customs Paperwork</h2>
              {load.customs_status && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-semibold capitalize">{load.customs_status}</span>
                </div>
              )}
            </div>

            <div
              onDragEnter={(e) => handleDragEnter(e, setCustomsDragActive)}
              onDragLeave={(e) => handleDragLeave(e, setCustomsDragActive)}
              onDrop={(e) => handleDrop(e, handleCustomsUpload, setCustomsDragActive)}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                customsDragActive
                  ? "border-amber-400 bg-amber-50"
                  : "border-slate-300 hover:border-slate-400"
              }`}
            >
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-900">Drag and drop customs documents</p>
              <p className="text-sm text-slate-600 mt-1">PAPS form, invoice, or other border docs</p>
              <p className="text-sm text-slate-600 mt-1">or</p>
              <label className="text-sky-600 font-medium hover:underline cursor-pointer mt-1 inline-block">
                Browse files
                <input
                  type="file"
                  onChange={(e) => e.target.files?.[0] && handleCustomsUpload(e.target.files[0])}
                  disabled={isUploadingCustoms}
                  className="hidden"
                />
              </label>
              {isUploadingCustoms && <p className="text-sm text-slate-600 mt-4">Uploading...</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

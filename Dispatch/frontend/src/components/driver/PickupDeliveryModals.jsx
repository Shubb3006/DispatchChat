import React from "react";
import {
  Upload,
  CheckCircle,
  X,
  AlertTriangle,
  FileText,
  Camera,
  Image,
  Sparkles,
  User,
} from "lucide-react";

export default function PickupDeliveryModals({
  isPickupModalOpen,
  setIsPickupModalOpen,
  myShipment,
  pickupError,
  pickupLoadId,
  setPickupLoadId,
  pickupCustomLoadNumber,
  setPickupCustomLoadNumber,
  shipments,
  pickupBolFile,
  setPickupBolFile,
  handleBolChange,
  pickupSkidFile,
  setPickupSkidFile,
  handleSkidPicChange,
  handleLoadDemoPickup,
  handleSubmitPickup,
  isDeliveryModalOpen,
  setIsDeliveryModalOpen,
  deliveryError,
  deliveryLoadId,
  setDeliveryLoadId,
  deliveryCustomLoadNumber,
  setDeliveryCustomLoadNumber,
  deliveryPodFile,
  setDeliveryPodFile,
  handlePodChange,
  consigneeSignee,
  setConsigneeSignee,
  handleLoadDemoDelivery,
  handleSubmitDelivery,
}) {
  return (
    <>
      {/* -------------------- PICKUP MANIFEST UPLOAD POPUP -------------------- */}
      {isPickupModalOpen && (
        <div
          id="driver-pickup-popup"
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50"
        >
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 border border-slate-200 shadow-2xl relative overflow-hidden text-slate-800 space-y-5 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-sans">
                    Log Picked Up Load &amp; Documents
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase">
                    Shipment ID: {myShipment?.trackingNumber || "LS-90281-CAN"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPickupModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Error banner */}
            {pickupError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-2xs flex items-start space-x-2 font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{pickupError}</span>
              </div>
            )}

            {/* Form Fields / Drop zones */}
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200/60 text-2xs text-slate-600 leading-normal space-y-1">
                <p>
                  <strong>Shipper Check-In:</strong>{" "}
                  {myShipment?.shipperName || "AeroParts Hub"}.
                </p>
                <p className="font-mono text-3xs text-slate-400">
                  {myShipment?.shipperAddress || "Detroit, MI"}
                </p>
              </div>

              {/* Load Selector */}
              <div className="space-y-1.5 p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100/50">
                <label className="text-3xs font-bold font-mono text-indigo-700 uppercase tracking-wider block">
                  Verify / Specify Load Number{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={pickupLoadId}
                  onChange={(e) => setPickupLoadId(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 h-9 cursor-pointer shadow-xs"
                >
                  {shipments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.trackingNumber} — {s.originCity} to {s.destinationCity}{" "}
                      ({s.cargoDescription})
                    </option>
                  ))}
                  <option value="custom">
                    -- Enter custom load number manually --
                  </option>
                </select>

                {pickupLoadId === "custom" && (
                  <input
                    type="text"
                    placeholder="Type Custom Load / Tracking Number"
                    value={pickupCustomLoadNumber}
                    onChange={(e) => setPickupCustomLoadNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 h-9 mt-2 shadow-xs"
                  />
                )}
              </div>

              {/* 1. BOL File Upload */}
              <div className="space-y-1.5">
                <label className="text-3xs font-bold font-mono text-slate-500 uppercase tracking-wider block">
                  1. Bill of Lading (BOL) Document{" "}
                  <span className="text-rose-500">*</span>
                </label>

                {pickupBolFile ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-bold text-slate-800 truncate">
                          {pickupBolFile.name}
                        </span>
                        <span className="block text-3xs font-mono text-slate-400">
                          {pickupBolFile.size}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPickupBolFile(null)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-5 text-center transition-colors relative bg-slate-50/30">
                    <input
                      type="file"
                      id="pickup-bol-input"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleBolChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <FileText className="h-8 w-8 text-slate-400 mx-auto mb-1.5" />
                    <span className="block text-xs font-bold text-slate-700">
                      Drag &amp; drop BOL or click
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      Supports PDF, PNG, JPG (Max 5MB)
                    </span>
                  </div>
                )}
              </div>

              {/* 2. Skid Picture Upload */}
              <div className="space-y-1.5">
                <label className="text-3xs font-bold font-mono text-slate-500 uppercase tracking-wider block">
                  2. Pallet / Skid Loading Picture{" "}
                  <span className="text-rose-500">*</span>
                </label>

                {pickupSkidFile ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center space-x-2.5 truncate">
                      {pickupSkidFile.dataUrl?.startsWith("data:") ? (
                        <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                          <img
                            src={pickupSkidFile.dataUrl}
                            alt="Skid Preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                          <Image className="h-4 w-4" />
                        </div>
                      )}
                      <div className="truncate">
                        <span className="block text-xs font-bold text-slate-800 truncate">
                          {pickupSkidFile.name}
                        </span>
                        <span className="block text-3xs font-mono text-slate-400">
                          {pickupSkidFile.size}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPickupSkidFile(null)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-5 text-center transition-colors relative bg-slate-50/30">
                    <input
                      type="file"
                      id="pickup-skid-input"
                      accept="image/*"
                      onChange={handleSkidPicChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Camera className="h-8 w-8 text-slate-400 mx-auto mb-1.5" />
                    <span className="block text-xs font-bold text-slate-700">
                      Take or upload Skid Photo
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      Required for cargo condition verification
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                type="button"
                onClick={handleLoadDemoPickup}
                className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>⚡ Auto-fill Demo Files</span>
              </button>

              <div className="flex space-x-2 sm:ml-auto w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsPickupModalOpen(false)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitPickup}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Confirm &amp; Log Pick Up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- DELIVERY POD UPLOAD POPUP -------------------- */}
      {isDeliveryModalOpen && (
        <div
          id="driver-delivery-popup"
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50"
        >
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 border border-slate-200 shadow-2xl relative overflow-hidden text-slate-800 space-y-5 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-sans">
                    Complete Delivery &amp; Upload POD
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase">
                    Shipment ID: {myShipment?.trackingNumber || "LS-90281-CAN"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeliveryModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Error banner */}
            {deliveryError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-2xs flex items-start space-x-2 font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{deliveryError}</span>
              </div>
            )}

            {/* Form Fields / Drop zones */}
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200/60 text-2xs text-slate-600 leading-normal space-y-1">
                <p>
                  <strong>Consignee Delivery:</strong>{" "}
                  {myShipment?.consigneeName || "Midwest Assembly"}.
                </p>
                <p className="font-mono text-3xs text-slate-400">
                  {myShipment?.consigneeAddress || "Chicago, IL"}
                </p>
              </div>

              {/* Load Selector */}
              <div className="space-y-1.5 p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-100/50">
                <label className="text-3xs font-bold font-mono text-emerald-700 uppercase tracking-wider block">
                  Verify / Specify Load Number{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={deliveryLoadId}
                  onChange={(e) => setDeliveryLoadId(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 h-9 cursor-pointer shadow-xs"
                >
                  {shipments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.trackingNumber} — {s.originCity} to {s.destinationCity}{" "}
                      ({s.cargoDescription})
                    </option>
                  ))}
                  <option value="custom">
                    -- Enter custom load number manually --
                  </option>
                </select>

                {deliveryLoadId === "custom" && (
                  <input
                    type="text"
                    placeholder="Type Custom Load / Tracking Number"
                    value={deliveryCustomLoadNumber}
                    onChange={(e) =>
                      setDeliveryCustomLoadNumber(e.target.value)
                    }
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 h-9 mt-2 shadow-xs"
                  />
                )}
              </div>

              {/* POD File Upload */}
              <div className="space-y-1.5">
                <label className="text-3xs font-bold font-mono text-slate-500 uppercase tracking-wider block">
                  Proof of Delivery (POD) Signed Document{" "}
                  <span className="text-rose-500">*</span>
                </label>

                {deliveryPodFile ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-bold text-slate-800 truncate">
                          {deliveryPodFile.name}
                        </span>
                        <span className="block text-3xs font-mono text-slate-400">
                          {deliveryPodFile.size}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeliveryPodFile(null)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-5 text-center transition-colors relative bg-slate-50/30">
                    <input
                      type="file"
                      id="delivery-pod-input"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handlePodChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <FileText className="h-8 w-8 text-slate-400 mx-auto mb-1.5" />
                    <span className="block text-xs font-bold text-slate-700">
                      Drag &amp; drop signed POD or click
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      Supports scanned sheets or signed paper photos
                    </span>
                  </div>
                )}
              </div>

              {/* Signee / Receiver Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="consignee-signee-input"
                  className="text-3xs font-bold font-mono text-slate-500 uppercase tracking-wider block"
                >
                  Name of Receiver / Signee{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    id="consignee-signee-input"
                    value={consigneeSignee}
                    onChange={(e) => setConsigneeSignee(e.target.value)}
                    placeholder="e.g. Sgt. John Doe (Dock Supervisor)"
                    className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 transition-all h-9"
                  />
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                type="button"
                onClick={handleLoadDemoDelivery}
                className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>⚡ Auto-fill Demo POD</span>
              </button>

              <div className="flex space-x-2 sm:ml-auto w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsDeliveryModalOpen(false)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitDelivery}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Confirm &amp; Log Delivery
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState } from "react";
import {
  Sparkles,
  Check,
  CheckCircle2,
  Clock,
  Shield,
  MapPin,
  FileText,
  Printer,
  QrCode,
} from "lucide-react";
import DocumentTemplateModal from "../DocumentTemplateModal";

export default function ActiveLoadCard({
  myShipment,
  hasScannedWeight,
  currentWeight,
  maxWeightCapacity,
  capacityUtilizedPercent,
  scannedWeights,
  isStopWithinRange,
  getStopDistanceText,
  handleCompleteStop,
  setPendingPickupWaypointId,
  setIsPickupModalOpen,
  setPendingDeliveryWaypointId,
  setIsDeliveryModalOpen,
  driverNotes,
  setDriverNotes,
  notesSaved,
  handleSaveNotes,
}) {
  const [driverDocType, setDriverDocType] = useState(null);
  if (!myShipment) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center text-slate-500 text-xs">
        No active shipments assigned. Contact Keith in dispatch to receive LTL
        manifest coordinates.
      </div>
    );
  }

  const completedWaypoints = myShipment?.waypoints?.filter(
    (w) => w.status === "completed"
  ).length;
  const progressPercent = Math.round(
    (completedWaypoints / Math.max(myShipment?.waypoints?.length, 1)) * 100
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-3xs font-bold font-mono bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full uppercase">
              Active Trip
            </span>
            {myShipment?.priority && (
              <span
                className={`text-3xs font-bold font-mono px-2.5 py-0.5 rounded-full uppercase border ${
                  myShipment.priority === "urgent"
                    ? "bg-rose-50 border-rose-200 text-rose-800"
                    : myShipment.priority === "high"
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "bg-slate-100 border-slate-200 text-slate-700"
                }`}
              >
                {myShipment.priority} Priority
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-slate-900 mt-1.5">
            Waypoints & Delivery Tasks
          </h3>
        </div>
        <div className="text-right">
          <span className="text-3xs font-mono text-slate-500 uppercase block">
            Tracking ID
          </span>
          <span className="text-xs font-bold font-mono text-slate-900">
            {myShipment.load_number}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* DISPATCH ASSIGNMENT MANIFEST CARD */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-5 border border-indigo-500/30 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/30">
                <Sparkles className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest font-mono text-indigo-300">
                  New Load Assigned
                </h4>
                <p className="text-[9px] text-slate-400 font-mono">
                  BROADCAST VIA SAMSARA DISPATCH NETWORK
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-600 text-white shadow-sm border border-indigo-400/30 animate-pulse">
                DISPATCHED
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Origin and Destination */}
            <div className="space-y-3.5">
              <div className="relative pl-6">
                <div className="absolute left-1.5 top-2.5 bottom-1.5 w-0.5 border-l border-dashed border-slate-500/40" />

                <div className="relative space-y-1">
                  <span className="absolute -left-6 top-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-white border-2 border-slate-900 shadow-sm">
                    <span className="h-1 w-1 bg-white rounded-full" />
                  </span>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                    Shipper (Pickup Location)
                  </span>
                  <span className="text-xs font-extrabold text-white block">
                    {myShipment.shipperName ||
                      myShipment?.waypoints?.find(
                        (w) => w.stopType === "pickup"
                      )?.companyName ||
                      "Samsara Verified Shipper"}
                  </span>
                  <span className="text-2xs text-slate-300 block font-medium truncate">
                    {myShipment?.shipperAddress ||
                      myShipment?.waypoints?.find(
                        (w) => w.stopType === "pickup"
                      )?.address ||
                      myShipment.customer_billing_address}
                  </span>
                </div>

                <div className="relative space-y-1 mt-4">
                  <span className="absolute -left-6 top-0.5 h-3.5 w-3.5 rounded-full bg-indigo-500 flex items-center justify-center text-white border-2 border-slate-900 shadow-sm">
                    <span className="h-1 w-1 bg-white rounded-full" />
                  </span>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                    Consignee (Delivery Destination)
                  </span>
                  <span className="text-xs font-extrabold text-white block">
                    {myShipment.consignee_name ||
                      myShipment?.waypoints?.find(
                        (w) => w.stopType === "delivery"
                      )?.companyName ||
                      "Samsara Verified Consignee"}
                  </span>
                  <span className="text-2xs text-slate-300 block font-medium truncate">
                    {myShipment.consignee_address ||
                      myShipment?.waypoints?.find(
                        (w) => w.stopType === "delivery"
                      )?.address ||
                      myShipment.destination}
                  </span>
                </div>
              </div>
            </div>

            {/* Spec Payload Specs */}
            <div className="bg-slate-950/50 rounded-xl p-3.5 border border-slate-800/80 grid grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">
                  Skid/Pallet Count
                </span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-sm font-black text-white">
                    {myShipment.pieces}
                  </span>
                  <span className="text-3xs text-slate-400 font-mono uppercase">
                    Pallets
                  </span>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">
                  Manifest Weight
                </span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-sm font-black text-indigo-300">
                    {myShipment.weight.toLocaleString()}
                  </span>
                  <span className="text-3xs text-slate-400 font-mono uppercase">
                    Lbs
                  </span>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">
                  PO Number
                </span>
                <span className="text-2xs font-mono font-bold text-white block truncate">
                  {myShipment.poNumber || "N/A"}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">
                  BOL / Pickup Number
                </span>
                <span className="text-2xs font-mono font-bold text-amber-300 block truncate">
                  {myShipment.bolNumber || "N/A"}
                </span>
              </div>

              <div className="col-span-2 border-t border-slate-800/60 pt-2 flex items-center justify-between text-3xs font-mono">
                <span className="text-slate-400">LOAD MODE:</span>
                <span className="font-extrabold text-white uppercase bg-indigo-900 px-1.5 py-0.2 rounded">
                  {myShipment.loadType || "FTL"}
                </span>
              </div>
            </div>

            {/* Driver Quick Preset Documents Buttons */}
            <div className="mt-3 pt-3 border-t border-indigo-500/20 flex flex-wrap items-center gap-2">
              <span className="text-3xs font-mono font-bold text-slate-400 uppercase">Documents:</span>
              <button
                type="button"
                onClick={() => setDriverDocType("PAPS")}
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-3xs font-bold font-mono transition-all flex items-center gap-1 shadow-sm"
              >
                <span>🇺🇸 PAPS Sheet</span>
              </button>
              <button
                type="button"
                onClick={() => setDriverDocType("PARS")}
                className="px-2.5 py-1 bg-sky-700 hover:bg-sky-600 text-white rounded-lg text-3xs font-bold font-mono transition-all flex items-center gap-1 shadow-sm"
              >
                <span>🇨🇦 PARS Sheet</span>
              </button>
              <button
                type="button"
                onClick={() => setDriverDocType("BOL")}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-3xs font-bold font-mono transition-all flex items-center gap-1 border border-slate-700 shadow-sm"
              >
                <FileText className="h-3 w-3 text-sky-400" />
                <span>Official BOL</span>
              </button>
            </div>
          </div>
        </div>

        {/* Trip Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-bold text-slate-700">
              Trip Progress
            </span>
            <span className="text-xs font-mono font-bold text-indigo-600">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-3xs text-slate-500 mt-1.5 text-right font-mono uppercase">
            {completedWaypoints} / {myShipment?.waypoints?.length} Waypoints
            Completed
          </div>
        </div>

        {/* Cargo & Weight Capacity */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-3xs font-mono font-bold text-slate-500 uppercase">
              Trip Cargo Details
            </span>
            {hasScannedWeight ? (
              <span className="flex items-center space-x-1 text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span>OCR VERIFIED</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-[9px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                <Clock className="h-3 w-3 text-slate-400" />
                <span>MANIFEST WEIGHT</span>
              </span>
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-slate-900">
              {myShipment.cargoDescription}
            </p>
          </div>

          {/* Weight Capacity Progress Indicator */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200">
            <div className="flex justify-between items-center text-xs font-mono text-slate-600">
              <span className="text-2xs uppercase font-bold text-slate-500">
                Weight Load Capacity
              </span>
              <span className="font-bold text-slate-800">
                {currentWeight.toLocaleString()} /{" "}
                {maxWeightCapacity.toLocaleString()} lbs
              </span>
            </div>

            <div className="relative w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className={`h-3 rounded-full transition-all duration-700 ease-out ${
                  capacityUtilizedPercent > 95
                    ? "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                    : capacityUtilizedPercent > 80
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${capacityUtilizedPercent}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-slate-500">
                Capacity Utilized:{" "}
                <span className="font-bold text-slate-700">
                  {capacityUtilizedPercent}%
                </span>
              </span>
              <span className="text-slate-400 font-bold">
                Max Cargo: 45K lbs
              </span>
            </div>

            {hasScannedWeight && scannedWeights.length > 0 && (
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-lg p-2 mt-2 space-y-1">
                <div className="flex items-center space-x-1.5 text-[10px] text-emerald-800 font-medium">
                  <Sparkles className="h-3 w-3 text-emerald-500 animate-pulse" />
                  <span>AI-OCR Weight Extraction Match Success</span>
                </div>
                <p className="text-[9px] text-slate-600 font-mono leading-normal">
                  Extracted{" "}
                  <strong className="text-emerald-700 font-bold">
                    {currentWeight.toLocaleString()} lbs
                  </strong>{" "}
                  from scanned{" "}
                  <strong className="text-slate-700 font-bold truncate max-w-[150px] inline-block align-bottom">
                    {scannedWeights[0].fileName}
                  </strong>
                  . Weight is verified within legal dry-van highway freight
                  tolerances.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Vertical Stops Timeline */}
        <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-5 my-4">
          {myShipment?.waypoints?.map((wpt, idx) => {
            const isCompleted = wpt.status === "completed";
            const isArrived = wpt.status === "arrived";
            return (
              <div key={wpt.id} className="relative">
                <div
                  className={`absolute -left-[31px] top-1 h-5 w-5 rounded-full border-2 bg-white flex items-center justify-center ${
                    isCompleted
                      ? "border-emerald-500 text-emerald-500"
                      : isArrived
                      ? "border-amber-500 text-amber-500 animate-pulse"
                      : "border-slate-300 text-slate-400"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  )}
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <span className="text-3xs font-mono uppercase font-bold text-slate-500">
                      Stop #{idx + 1} ({wpt.stopType.replace("_", " ")})
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">
                      {wpt.companyName}
                    </h4>
                    <p className="text-2xs text-slate-500">{wpt.address}</p>

                    {wpt.weight && (
                      <span className="inline-block mt-1 text-3xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        LTL: {wpt.pieces} Pcs / {wpt.weight} lbs
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-2xs font-mono text-slate-500 mr-2">
                      {wpt.actualTime
                        ? `Completed ${new Date(
                            wpt.actualTime
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : `Sched: ${new Date(
                            wpt.scheduledTime
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`}
                    </span>

                    {!isCompleted && (
                      <div className="flex flex-col items-end space-y-1">
                        {(() => {
                          const isGeofencedStop =
                            wpt.stopType === "pickup" ||
                            wpt.stopType === "delivery";
                          const inRange =
                            !isGeofencedStop || isStopWithinRange(wpt);
                          const distanceText = getStopDistanceText(wpt);
                          return (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isGeofencedStop && !inRange) return;
                                  if (wpt.stopType === "pickup") {
                                    setPendingPickupWaypointId(wpt.id);
                                    setIsPickupModalOpen(true);
                                  } else if (wpt.stopType === "delivery") {
                                    setPendingDeliveryWaypointId(wpt.id);
                                    setIsDeliveryModalOpen(true);
                                  } else {
                                    handleCompleteStop(wpt.id);
                                  }
                                }}
                                disabled={isGeofencedStop && !inRange}
                                className={`px-3 py-1.5 text-2xs font-bold rounded-lg flex items-center space-x-1 transition-all ${
                                  inRange
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm"
                                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-80"
                                }`}
                              >
                                {isGeofencedStop && !inRange && (
                                  <Shield className="h-3.5 w-3.5 text-rose-500 mr-0.5 inline-block shrink-0" />
                                )}
                                <span>
                                  {wpt.stopType === "pickup"
                                    ? "Sign Pick Up"
                                    : wpt.stopType === "border_crossing"
                                    ? "Logged Crossing"
                                    : "Sign Delivery / POD"}
                                </span>
                              </button>

                              {isGeofencedStop && (
                                <span
                                  className={`text-[10px] font-mono font-bold uppercase tracking-tight ${
                                    inRange
                                      ? "text-emerald-600"
                                      : "text-rose-500"
                                  }`}
                                >
                                  {inRange
                                    ? `In Range (${distanceText})`
                                    : `Too Far (${distanceText})`}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Driver Shipment Notes Section */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="driver-notes-textarea"
              className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Driver Shipment Notes (Dispatch Review)
            </label>
            {notesSaved && (
              <span className="text-3xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 animate-pulse">
                ✓ Note Saved to Shipment
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <textarea
              id="driver-notes-textarea"
              value={driverNotes}
              onChange={(e) => setDriverNotes(e.target.value)}
              placeholder="Add any loading dock delays, gate codes, route detours, or shipment condition details for dispatch review..."
              className="flex-1 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none min-h-[70px] resize-y transition-all"
            />
            <button
              type="button"
              onClick={handleSaveNotes}
              className="px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs rounded-xl transition-colors flex flex-col items-center justify-center gap-1 shrink-0 cursor-pointer min-w-[90px]"
            >
              <Check className="h-4 w-4" />
              <span>Save Note</span>
            </button>
          </div>
        </div>
      </div>

      {/* Driver Preset Document Template Modal */}
      {driverDocType && (
        <DocumentTemplateModal
          isOpen={Boolean(driverDocType)}
          onClose={() => setDriverDocType(null)}
          documentType={driverDocType}
          shipment={myShipment}
        />
      )}
    </div>
  );
}

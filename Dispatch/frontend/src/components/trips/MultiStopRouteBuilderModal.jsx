import React, { useState, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  ArrowDown,
  ArrowUp,
  MapPin,
  Truck,
  Clock,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Send,
  Building2,
  FileSignature,
  DollarSign,
  GripVertical,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

export default function MultiStopRouteBuilderModal({
  isOpen,
  onClose,
  onDispatchTrip,
}) {
  const [tripName, setTripName] = useState("Cross-Border Multi-Drop Corridor");
  const [selectedDriver, setSelectedDriver] = useState({
    id: "DRV001",
    name: "Marcus Vance",
    truck: "TRK-104",
    trailer: "53ft Dry Van",
    remainingDriveHours: 9.5, // 9h 30m remaining on 11h HOS clock
  });

  const [stops, setStops] = useState([
    {
      id: "STOP-1",
      stopType: "PICKUP",
      locationName: "AeroParts Toronto Manufacturing",
      address: "150 Industrial Pkwy, Toronto, ON",
      appointmentTime: "08:00 AM",
      pallets: 6,
      weightLbs: 8500,
      instructions: "Check in at Gate 3. Trailer must be clean & swept.",
      distanceFromPrev: 0,
      driveMinsFromPrev: 0,
    },
    {
      id: "STOP-2",
      stopType: "PICKUP",
      locationName: "Brampton Cross-Dock Hub",
      address: "420 Logistics Way, Brampton, ON",
      appointmentTime: "10:30 AM",
      pallets: 8,
      weightLbs: 11000,
      instructions: "Bay 12. Cross-border PAPS seal barcode must be affixed.",
      distanceFromPrev: 28,
      driveMinsFromPrev: 35,
    },
    {
      id: "STOP-3",
      stopType: "BORDER",
      locationName: "Detroit Ambassador Bridge (CBP Port of Entry 3801)",
      address: "Windsor, ON ➔ Detroit, MI",
      appointmentTime: "03:00 PM",
      pallets: 0,
      weightLbs: 0,
      instructions: "Present ACE E-Manifest Lead Sheet barcode to CBP primary lane.",
      distanceFromPrev: 215,
      driveMinsFromPrev: 195,
    },
    {
      id: "STOP-4",
      stopType: "DELIVERY",
      locationName: "Detroit Assembly Plant #4",
      address: "1800 East Grand Blvd, Detroit, MI",
      appointmentTime: "05:30 PM",
      pallets: 6,
      weightLbs: 8500,
      instructions: "Dock 18. Consignee signature required on paper & electronic POD.",
      distanceFromPrev: 12,
      driveMinsFromPrev: 20,
    },
    {
      id: "STOP-5",
      stopType: "DELIVERY",
      locationName: "Chicago Inland Freight Terminal",
      address: "900 Logistics Blvd, Chicago, IL",
      appointmentTime: "10:30 PM",
      pallets: 8,
      weightLbs: 11000,
      instructions: "Final drop. Unload remaining 8 pallets. Collect signed Bill of Lading.",
      distanceFromPrev: 285,
      driveMinsFromPrev: 270,
    },
  ]);

  // Route Calculations
  const routeTotals = useMemo(() => {
    const totalMiles = stops.reduce((sum, s) => sum + (Number(s.distanceFromPrev) || 0), 0);
    const totalDriveMins = stops.reduce((sum, s) => sum + (Number(s.driveMinsFromPrev) || 0), 0);
    const totalDriveHours = (totalDriveMins / 60).toFixed(1);

    const totalPallets = stops
      .filter((s) => s.stopType === "PICKUP")
      .reduce((sum, s) => sum + (Number(s.pallets) || 0), 0);

    const totalWeight = stops
      .filter((s) => s.stopType === "PICKUP")
      .reduce((sum, s) => sum + (Number(s.weightLbs) || 0), 0);

    const pickupCount = stops.filter((s) => s.stopType === "PICKUP").length;
    const deliveryCount = stops.filter((s) => s.stopType === "DELIVERY").length;
    const extraStopsCount = Math.max(0, pickupCount + deliveryCount - 2);
    const extraStopPay = extraStopsCount * 50;

    // HOS Feasibility Check
    const isHosCompliant = Number(totalDriveHours) <= selectedDriver.remainingDriveHours;

    return {
      totalMiles,
      totalDriveMins,
      totalDriveHours,
      totalPallets,
      totalWeight,
      pickupCount,
      deliveryCount,
      extraStopsCount,
      extraStopPay,
      isHosCompliant,
    };
  }, [stops, selectedDriver]);

  if (!isOpen) return null;

  const handleMoveStop = (idx, direction) => {
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === stops.length - 1) return;

    const newStops = [...stops];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const temp = newStops[idx];
    newStops[idx] = newStops[targetIdx];
    newStops[targetIdx] = temp;
    setStops(newStops);
  };

  const handleRemoveStop = (id) => {
    if (stops.length <= 2) {
      toast.error("A trip must have at least 2 stops.");
      return;
    }
    setStops(stops.filter((s) => s.id !== id));
  };

  const handleAddCustomStop = () => {
    const newStop = {
      id: `STOP-${Date.now().toString().slice(-4)}`,
      stopType: "DELIVERY",
      locationName: "New Customer Facility",
      address: "350 Industrial Way, IL",
      appointmentTime: "11:00 PM",
      pallets: 2,
      weightLbs: 3000,
      instructions: "Standard dock delivery.",
      distanceFromPrev: 45,
      driveMinsFromPrev: 50,
    };
    setStops([...stops, newStop]);
    toast.success("Added new delivery waypoint to route!");
  };

  const handleDispatch = () => {
    if (onDispatchTrip) {
      onDispatchTrip({
        tripName,
        driver: selectedDriver,
        stops,
        totals: routeTotals,
      });
    }
    toast.success(`Multi-stop trip dispatched to driver ${selectedDriver.name}!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-base-100 border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-base-content animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-base-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-base-content">
                Multi-Stop Sequential Route & Trip Builder
              </h2>
              <p className="text-[10px] text-base-content font-mono">
                Multi-pick, customs crossing, and multi-drop sequential routing with live HOS drive-time compliance.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-base-content hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-base-100 text-xs">
          {/* Trip Info & Driver Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-base-200 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Trip Name / Manifest Title</label>
              <input
                type="text"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                className="w-full px-3 py-1.5 bg-base-100 border border-slate-200 rounded-xl text-xs font-bold text-base-content focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Assigned Driver & HOS Drive Clock</label>
              <div className="flex items-center justify-between bg-base-100 border border-slate-200 rounded-xl p-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                    {selectedDriver.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-base-content">{selectedDriver.name}</div>
                    <span className="text-[10px] text-slate-400 font-mono">{selectedDriver.truck} • {selectedDriver.trailer}</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {selectedDriver.remainingDriveHours}h Drive Time Left
                </span>
              </div>
            </div>
          </div>

          {/* Sequential Waypoints Timeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-base-content uppercase font-mono tracking-wider text-xs">
                Sequential Waypoints & Dock Stops ({stops.length} Stops)
              </span>

              <button
                type="button"
                onClick={handleAddCustomStop}
                className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Waypoint</span>
              </button>
            </div>

            {/* Stops List */}
            <div className="space-y-2.5">
              {stops.map((stop, idx) => {
                const isPickup = stop.stopType === "PICKUP";
                const isBorder = stop.stopType === "BORDER";
                const isDelivery = stop.stopType === "DELIVERY";

                return (
                  <div
                    key={stop.id}
                    className="bg-base-100 border border-slate-200 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Stop Number Badge */}
                        <div className="w-6 h-6 rounded-lg bg-slate-900 text-white font-mono font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </div>

                        {/* Stop Type Pill */}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase font-mono ${isPickup
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : isBorder
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                        >
                          {stop.stopType}
                        </span>

                        <div className="font-extrabold text-base-content text-xs">
                          {stop.locationName}
                        </div>
                      </div>

                      {/* Reorder Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveStop(idx, "up")}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-base-content disabled:opacity-30 transition cursor-pointer"
                          title="Move Stop Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === stops.length - 1}
                          onClick={() => handleMoveStop(idx, "down")}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-base-content disabled:opacity-30 transition cursor-pointer"
                          title="Move Stop Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveStop(stop.id)}
                          className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-700 transition cursor-pointer"
                          title="Remove Stop"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Address & Appointment */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 bg-base-200 p-2 rounded-xl">
                      <div className="font-medium truncate sm:col-span-2">
                        <MapPin className="w-3 h-3 text-slate-400 inline mr-1" />
                        {stop.address}
                      </div>
                      <div className="font-mono font-bold text-slate-800 text-right">
                        <Clock className="w-3 h-3 text-slate-400 inline mr-1" />
                        Appt: {stop.appointmentTime}
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="text-[10px] text-base-content font-mono truncate">
                      <strong>Notes:</strong> {stop.instructions}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Route Feasibility & Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 text-white p-4 rounded-2xl shadow-md font-mono">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total Route Distance</div>
              <div className="text-xl font-black text-white mt-0.5">{routeTotals.totalMiles} mi</div>
              <div className="text-[10px] text-slate-400 font-medium">Est. {routeTotals.totalDriveHours}h Drive Time</div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Extra Stop Pay Added</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">+${routeTotals.extraStopPay} CAD</div>
              <div className="text-[10px] text-slate-400 font-medium">{routeTotals.extraStopsCount} extra stops ($50/ea)</div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">HOS Compliance Status</div>
              <div className="mt-1">
                {routeTotals.isHosCompliant ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>HOS COMPLIANT ({routeTotals.totalDriveHours}h &lt; {selectedDriver.remainingDriveHours}h)</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-fit">
                    <AlertTriangle className="w-3 h-3" />
                    <span>EXCEEDS 11H DRIVE CLOCK</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDispatch}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>Dispatch Multi-Stop Trip</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

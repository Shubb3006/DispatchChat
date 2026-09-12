import React, { useState, useEffect } from "react";
import {
  X,
  Truck,
  User,
  Package,
  MapPin,
  Weight,
  Boxes,
  Calendar,
  GitBranch,
  Printer,
  Route,
  ShieldAlert,
} from "lucide-react";
import TripLegsSection from "./TripLegsSection";
import LoadJourneyTimeline from "./LoadJourneyTimeline";
import TripSheetPrintModal from "./pcmiler/TripSheetPrintModal";
import { useTripStore } from "../stores/useTripStore";

const statusStyles = {
  trip_assigned: "bg-slate-100 text-slate-700",
  in_transit: "bg-blue-100 text-blue-700",
  at_destination_hub: "bg-amber-100 text-amber-700",
  out_for_delivery: "bg-orange-100 text-orange-700",
  delivered: "bg-emerald-100 text-emerald-700",
};

const statusLabels = {
  trip_assigned: "Trip Assigned",
  in_transit: "In Transit",
  at_destination_hub: "At Destination Hub",
  out_for_delivery: "Out For Delivery",
  delivered: "Delivered",
};

export default function TripDetailsModal({
  isOpen,
  onClose,
  trip,
  onUpdateShipment,
  onRemoveTrip,
  setSelectedTrip,
}) {
  // Which of the trip's loads the Relay Legs section is managing.
  const [legsLoadId, setLegsLoadId] = useState(null);
  const [updatingLoadId, setUpdatingLoadId] = useState(null)
  const [tripSheet, setTripSheet] = useState(null);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const fetchTripSheet = useTripStore((s) => s.fetchTripSheet);

  useEffect(() => {
    setLegsLoadId(trip?.shipments?.[0]?.id || null);
  }, [trip?.id]);

  // Pulls the route stored when the trip was consolidated. `refresh` re-routes,
  // for when the stops changed or the original routing failed.
  const openTripSheet = async (refresh = false) => {
    setIsLoadingSheet(true);
    const data = await fetchTripSheet(trip.id, { refresh });
    setIsLoadingSheet(false);
    if (data) setTripSheet(data);
  };

  const { removingTrip } = useTripStore();
  if (!isOpen || !trip) return null;

  const legsLoad =
    (trip.shipments || []).find((l) => l.id === legsLoadId) || trip.shipments?.[0] || null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center p-6">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* HEADER */}

        <div className="border-b bg-base-100 px-8 py-6 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-base-content">
                Trip #{trip.trip_number}
              </h1>
              {trip.shipments?.[0]?.status && (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[trip.shipments[0].status]
                  }`}>
                  {statusLabels[trip.shipments[0].status]}
                </span>
              )}
            </div>

            <p className="text-base-content mt-1">Consolidated Load Manifest</p>

            {/* Routed mileage captured when this trip was consolidated */}
            {trip.total_miles ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  <Route size={13} />
                  {Number(trip.total_miles).toFixed(1)} mi
                  {trip.drive_hours ? ` • ~${Number(trip.drive_hours).toFixed(1)}h` : ""}
                </span>
                {trip.is_truck_profile === false && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                    <ShieldAlert size={12} /> Car profile — not truck-legal
                  </span>
                )}
              </div>
            ) : trip.route_error ? (
              <div className="mt-2 flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 max-w-xl">
                <ShieldAlert size={13} className="mt-0.5 shrink-0 text-amber-600" />
                <span className="text-[11px] font-semibold text-amber-900">
                  Not routed: {trip.route_error}
                </span>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openTripSheet(false)}
              disabled={isLoadingSheet}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
            >
              <Printer size={15} className="text-sky-400" />
              <span>{isLoadingSheet ? "Loading..." : "Print Trip Sheet"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* BODY */}

        <div className="flex-1 overflow-y-auto p-8">
          {/* SUMMARY */}

          <div className="grid grid-cols-5 gap-5 mb-8">
            <div className="border rounded-xl p-4 bg-base-200">
              <User className="text-indigo-600 mb-2" />

              <p className="text-xs uppercase text-slate-400">Driver</p>

              <p className="font-semibold mt-1">{trip.driver_name || "-"}</p>
            </div>

            <div className="border rounded-xl p-4 bg-base-200">
              <Truck className="text-indigo-600 mb-2" />

              <p className="text-xs uppercase text-slate-400">Truck</p>

              <p className="font-semibold mt-1">{trip.truck_number || "-"}</p>
            </div>

            <div className="border rounded-xl p-4 bg-base-200">
              <Package className="text-indigo-600 mb-2" />

              <p className="text-xs uppercase text-slate-400">Loads</p>

              <p className="font-semibold mt-1">{trip.shipments.length}</p>
            </div>

            <div className="border rounded-xl p-4 bg-base-200">
              <Weight className="text-indigo-600 mb-2" />

              <p className="text-xs uppercase text-slate-400">Weight</p>

              <p className="font-semibold mt-1">
                {trip.total_weight_lbs?.toLocaleString()} lbs
              </p>
            </div>

            <div className="border rounded-xl p-4 bg-base-200">
              <Boxes className="text-indigo-600 mb-2" />

              <p className="text-xs uppercase text-slate-400">Pallets</p>

              <p className="font-semibold mt-1">{trip.total_pallets}</p>
            </div>
          </div>

          {/* LOADS */}

          <div className="border rounded-xl overflow-hidden">
            <div className="bg-base-200 border-b px-5 py-3">
              <h3 className="font-semibold text-slate-700">
                Loads in this Trip
              </h3>
            </div>

            <div className="overflow-auto max-h-[500px]">
              <table className="w-full">
                <thead className="sticky top-0 bg-base-100 border-b">
                  <tr className="text-xs uppercase text-base-content">
                    <th className="text-left p-4">Load</th>

                    <th className="text-left">Customer</th>

                    <th className="text-left">Route</th>

                    <th className="text-center">Weight</th>

                    <th className="text-center">Pallets</th>

                    <th className="text-center">Pickup</th>

                    <th className="text-center">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {trip.shipments.map((load) => (
                    <tr key={load.id} className="border-b hover:bg-base-200">
                      <td className="p-4">
                        <div className="font-semibold">{load.load_number}</div>

                        <div className="text-xs text-slate-400">
                          {load.commodity}
                        </div>
                      </td>

                      <td>
                        <div className="font-medium">{load.customer_name}</div>
                      </td>

                      <td>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin size={15} className="text-green-600" />

                          <span>{load.origin}</span>

                          <span className="text-slate-300">→</span>

                          <MapPin size={15} className="text-red-600" />

                          <span>{load.destination}</span>
                        </div>
                      </td>

                      <td className="text-center">
                        {load.weight?.toLocaleString()} lbs
                      </td>

                      <td className="text-center">{load.pieces}</td>

                      <td className="text-center text-sm">
                        <div className="flex justify-center items-center gap-1">
                          <Calendar size={14} />

                          {load.pickup_date?.slice(0, 10)}
                        </div>
                      </td>

                      <td className="text-center">
                        {/* <select
                          value={load.status}
                          onChange={async (e) => {
                            const status = e.target.value;

                            await onUpdateShipment({
                              ...load,
                              status,
                            });
                            console.log(trip);
                            setSelectedTrip((prev) => ({
                              ...prev,
                              shipments: prev?.shipments?.map((s) =>
                                s.id === load.id ? { ...s, status } : s
                              ),
                            }));
                          }}
                          className={`rounded-lg px-3 py-2 text-sm font-semibold border-none outline-none cursor-pointer ${statusStyles[load.status]
                            }`}
                        >
                          <option value="trip_assigned">Trip Assigned</option>

                          <option value="in_transit">In Transit</option>

                          <option value="at_destination_hub">
                            At Destination Hub
                          </option>

                          <option value="out_for_delivery">
                            Out for Delivery
                          </option>
                          <option value="delivered">Delivered</option>
                        </select> */}
                        <div className="flex items-center justify-center gap-2">
                          <select
                            value={load.status}
                            disabled={updatingLoadId === load.id}
                            onChange={async (e) => {
                              const status = e.target.value;

                              try {
                                setUpdatingLoadId(load.id);

                                await onUpdateShipment({
                                  ...load,
                                  status,
                                });

                                setSelectedTrip((prev) => ({
                                  ...prev,
                                  shipments: prev?.shipments?.map((s) =>
                                    s.id === load.id ? { ...s, status } : s
                                  ),
                                }));
                              } catch (error) {
                                console.error("Failed to update shipment status:", error);
                              } finally {
                                setUpdatingLoadId(null);
                              }
                            }}
                            className={`rounded-lg px-3 py-2 text-sm font-semibold border-none outline-none
      ${updatingLoadId === load.id
                                ? "opacity-60 cursor-not-allowed"
                                : "cursor-pointer"
                              }
      ${statusStyles[load.status]}
    `}
                          >
                            <option value="trip_assigned">Trip Assigned</option>
                            <option value="in_transit">In Transit</option>
                            <option value="at_destination_hub">
                              At Destination Hub
                            </option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                          </select>

                          {/* {updatingLoadId === load.id && (
                            <span className="h-4 w-4 rounded-full border-2 border-base-content/20 border-t-primary animate-spin" />
                          )} */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RELAY LEGS — split a load in this trip between drivers */}
          {(trip.shipments || []).length > 0 && (
            <div className="mt-8 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                  <GitBranch size={18} className="text-indigo-600" />
                  Relay Legs
                </h3>
                {(trip.shipments || []).length > 1 && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-base-content uppercase">
                      Load
                    </label>
                    <select
                      value={legsLoadId || ""}
                      onChange={(e) => setLegsLoadId(e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-base-100"
                    >
                      {(trip.shipments || []).map((l) => (
                        <option key={l.id} value={l.id}>
                          #{l.load_number} — {l.origin} → {l.destination}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {legsLoad ? (
                <TripLegsSection key={legsLoad.id} loadId={legsLoad.id} />
              ) : (
                <p className="text-sm text-base-content">
                  Select a load to manage its relay legs.
                </p>
              )}
            </div>
          )}

          {/* LOAD JOURNEY TIMELINE */}
          {legsLoad && (
            <div className="mt-8">
              <LoadJourneyTimeline loadId={legsLoad.id} />
            </div>
          )}
        </div>

        {/* FOOTER */}

        <div className="border-t bg-base-200 px-8 py-5 flex justify-between">
          <button
            disabled={removingTrip}
            onClick={async () => {
              if (window.confirm(`Disassemble Trip #${trip.trip_number}?`)) {
                onClose();
                await onRemoveTrip(trip.id);

              }
            }}
            className={`px-5 py-2 rounded-lg text-white font-medium transition shadow-sm ${removingTrip
              ? "bg-gray-400 cursor-not-allowed opacity-60"
              : "bg-red-600 hover:bg-red-700 cursor-pointer"
              }`}
          >
            {removingTrip ? "Disassembling..." : "Disassemble Trip"}
          </button>

          <button
            onClick={onClose}
            className="cursor-pointer px-5 py-2 rounded-lg border hover:bg-base-100"
          >
            Close
          </button>
        </div>
      </div>

      {/* Printable trip sheet, rendered from the route stored on the trip */}
      {tripSheet && tripSheet.route && (
        <TripSheetPrintModal
          isOpen={true}
          onClose={() => setTripSheet(null)}
          route={tripSheet.route}
          tripLabel={tripSheet.trip?.tripLabel || `TRIP-${trip.trip_number}`}
          loads={tripSheet.loads || []}
        />
      )}

      {/* No stored route: say why and offer to route it, rather than printing
          a sheet with blank mileage. */}
      {tripSheet && !tripSheet.route && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center p-6">
          <div className="bg-base-100 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={22} />
              <div>
                <h3 className="font-bold text-base-content">Trip has no route</h3>
                <p className="text-sm text-slate-600 mt-1">
                  {tripSheet.routeError ||
                    "This trip was never routed, so there is no mileage to print."}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setTripSheet(null)}
                className="px-4 py-2 rounded-lg border text-sm hover:bg-base-200"
              >
                Close
              </button>
              <button
                onClick={() => openTripSheet(true)}
                disabled={isLoadingSheet}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold disabled:opacity-50"
              >
                {isLoadingSheet ? "Routing..." : "Route now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

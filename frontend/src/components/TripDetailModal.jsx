import React from "react";
import {
  X,
  Truck,
  User,
  Package,
  MapPin,
  Weight,
  Boxes,
  Calendar,
} from "lucide-react";

const statusStyles = {
  assigned: "bg-slate-100 text-slate-700",
  dispatched: "bg-blue-100 text-blue-700",
  in_transit: "bg-amber-100 text-amber-700",
  delivered: "bg-emerald-100 text-emerald-700",
};

export default function TripDetailsModal({
  isOpen,
  onClose,
  trip,
  onUpdateShipment,
  onRemoveTrip,
  setSelectedTrip,
}) {
  if (!isOpen || !trip) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* HEADER */}

        <div className="border-b bg-white px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Trip #{trip.trip_number}
            </h1>

            <p className="text-slate-500 mt-1">Consolidated Load Manifest</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <X size={22} />
          </button>
        </div>

        {/* BODY */}

        <div className="flex-1 overflow-y-auto p-8">
          {/* SUMMARY */}

          <div className="grid grid-cols-5 gap-5 mb-8">
            <div className="border rounded-xl p-4 bg-slate-50">
              <User className="text-indigo-600 mb-2" />

              <p className="text-xs uppercase text-slate-400">Driver</p>

              <p className="font-semibold mt-1">{trip.driver_name || "-"}</p>
            </div>

            <div className="border rounded-xl p-4 bg-slate-50">
              <Truck className="text-indigo-600 mb-2" />

              <p className="text-xs uppercase text-slate-400">Truck</p>

              <p className="font-semibold mt-1">{trip.truck_number || "-"}</p>
            </div>

            <div className="border rounded-xl p-4 bg-slate-50">
              <Package className="text-indigo-600 mb-2" />

              <p className="text-xs uppercase text-slate-400">Loads</p>

              <p className="font-semibold mt-1">{trip.shipments.length}</p>
            </div>

            <div className="border rounded-xl p-4 bg-slate-50">
              <Weight className="text-indigo-600 mb-2" />

              <p className="text-xs uppercase text-slate-400">Weight</p>

              <p className="font-semibold mt-1">
                {trip.total_weight_lbs?.toLocaleString()} lbs
              </p>
            </div>

            <div className="border rounded-xl p-4 bg-slate-50">
              <Boxes className="text-indigo-600 mb-2" />

              <p className="text-xs uppercase text-slate-400">Pallets</p>

              <p className="font-semibold mt-1">{trip.total_pallets}</p>
            </div>
          </div>

          {/* LOADS */}

          <div className="border rounded-xl overflow-hidden">
            <div className="bg-slate-50 border-b px-5 py-3">
              <h3 className="font-semibold text-slate-700">
                Loads in this Trip
              </h3>
            </div>

            <div className="overflow-auto max-h-[500px]">
              <table className="w-full">
                <thead className="sticky top-0 bg-white border-b">
                  <tr className="text-xs uppercase text-slate-500">
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
                    <tr key={load.id} className="border-b hover:bg-slate-50">
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
                        <select
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
                          className={`rounded-lg px-3 py-2 text-sm font-semibold border-none outline-none cursor-pointer ${
                            statusStyles[load.status]
                          }`}
                        >
                          <option value="assigned">Assigned</option>

                          <option value="dispatched">Dispatched</option>

                          <option value="in_transit">In Transit</option>

                          <option value="delivered">Delivered</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FOOTER */}

        <div className="border-t bg-slate-50 px-8 py-5 flex justify-between">
          <button
            onClick={async () => {
              if (window.confirm(`Disassemble Trip #${trip.trip_number}?`)) {
                await onRemoveTrip(trip.id);
                onClose();
              }
            }}
            className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
          >
            Disassemble Trip
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border hover:bg-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

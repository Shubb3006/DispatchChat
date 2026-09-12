import React from "react";

const TripCard = (trip, tripLoads) => {
  return (
    <div
      key={trip.id}
      className={`rounded-xl border transition-all p-3.5 space-y-3 cursor-pointer ${isExpanded
        ? "bg-base-200 border-indigo-400 ring-1 ring-indigo-400 shadow-xs"
        : "bg-base-100 border-slate-200 hover:border-slate-300 hover:bg-base-200/50"
        }`}
      // onClick={() =>
      //   setShowSelectedTripDetailsId(
      //     isExpanded ? null : trip.id
      //   )
      // }
      onClick={async () => {
        const response = await axiosInstance.get(`/trips/${trip.id}`);

        setSelectedTrip(response.data.trip);
        setIsTripModalOpen(true);
      }}
    // onClick={() => {
    //   const tripWithLoads = {
    //     ...trip,
    //     shipments: shipments.filter((s) =>
    //       trip.shipment_ids.includes(s.id)
    //     ),
    //   };

    //   setSelectedTrip(tripWithLoads);
    //   setIsTripModalOpen(true);
    // }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-bold text-base-content">
            Trip #{trip.trip_number}
          </span>
          <span className="text-3xs font-mono bg-indigo-50 text-indigo-700 px-1 py-0.2 rounded border border-indigo-100 uppercase font-bold">
            {trip?.shipment_ids?.length} loads
          </span>
        </div>

        {/* Editable Trip Status dropdown */}
        <div onClick={(e) => e.stopPropagation()}>
          {/* <select
                                  value={trip.status}
                                  onChange={(e) => {
                                    const newStatus = e.target.value;
                                    if (onUpdateTrip) {
                                      onUpdateTrip({
                                        ...trip,
                                        status: newStatus,
                                      });
                                    }
                                    tripLoads.forEach((s) => {
                                      onUpdateShipment({
                                        ...s,
                                        status:
                                          newStatus === "in_transit"
                                            ? "in_transit"
                                            : newStatus === "completed"
                                            ? "completed"
                                            : newStatus === "dispatched"
                                            ? "dispatched"
                                            : "pending",
                                      });
                                    });
                                  }}
                                  className={`text-2xs font-bold px-1.5 py-0.5 rounded cursor-pointer border border-transparent focus:outline-none focus:ring-1 focus:ring-indigo-400 capitalize ${
                                    trip.status === "completed"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : trip.status === "in_transit"
                                      ? "bg-amber-100 text-amber-800"
                                      : trip.status === "dispatched"
                                      ? "bg-blue-100 text-blue-800 font-semibold"
                                      : "bg-slate-100 text-slate-800"
                                  }`}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="dispatched">Dispatched</option>
                                  <option value="in_transit">In Transit</option>
                                  <option value="completed">Completed</option>
                                </select> */}
          <span
            className={`text-2xs font-bold px-2 py-1 rounded capitalize ${trip.status === "completed"
              ? "bg-emerald-100 text-emerald-800"
              : trip.status === "in_transit"
                ? "bg-amber-100 text-amber-800"
                : trip.status === "dispatched"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-slate-100 text-slate-800"
              }`}
          >
            {trip.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Driver & truck brief */}
      <div className="grid grid-cols-2 gap-2 text-3xs text-base-content font-mono">
        <div>
          <span className="text-slate-400 uppercase font-bold text-[9px]">
            Driver:
          </span>
          <div className="text-slate-700 font-bold text-2xs font-sans mt-0.5 truncate">
            {trip.driver_name}
          </div>
        </div>
        <div>
          <span className="text-slate-400 uppercase font-bold text-[9px]">
            Assets:
          </span>
          <div className="text-slate-700 font-semibold mt-0.5">
            {trip.truckNumber} / {trip.trailerNumber}
          </div>
        </div>
      </div>

      {/* Brief weight metrics */}
      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-3xs font-mono text-base-content">
        <div>
          <span className="text-slate-400 uppercase font-bold text-[9px]">
            Weight:
          </span>
          <div className="text-slate-700 font-bold text-2xs mt-0.5">
            {trip?.total_weight_lbs || 0.0} lbs
          </div>
        </div>
        <div>
          <span className="text-slate-400 uppercase font-bold text-[9px]">
            Space:
          </span>
          <div className="text-slate-700 font-bold text-2xs mt-0.5">
            {trip?.total_pallets || 0} Pallets
          </div>
        </div>
      </div>

      {/* Nested Shipment/Loads list when expanded */}
      {isExpanded && (
        <div
          className="border-t border-slate-200 pt-3 mt-3 space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-3xs font-bold text-slate-400 uppercase font-mono block">
            Consolidated Loads Manifest
          </span>

          <div className="space-y-1.5">
            {tripLoads.map((load) => (
              <div
                key={load.id}
                className="bg-base-100 border border-slate-100 rounded-lg p-2 flex items-center justify-between text-xs hover:border-slate-300 cursor-pointer"
                onClick={() => {
                  setSelectedShipment(load);
                  setIsDetailModalOpen(true);
                }}
              >
                <div>
                  <div className="flex items-center space-x-1.5 font-bold">
                    <span className="text-slate-800">
                      Load #{load.trackingNumber}
                    </span>
                    <span
                      className={`text-4xs font-mono uppercase px-1 py-0.2 rounded font-bold ${load.loadType === "FTL"
                        ? "bg-indigo-50 text-indigo-700"
                        : "bg-amber-50 text-amber-700"
                        }`}
                    >
                      {load.loadType || "LTL"}
                    </span>
                  </div>
                  <div className="text-3xs text-slate-400 font-medium mt-0.5 truncate max-w-[150px]">
                    {load.originCity} → {load.destinationCity}
                  </div>
                </div>

                <div className="text-right text-3xs font-mono font-medium text-slate-600">
                  <div>{load.weightLbs.toLocaleString()} lbs</div>
                  <div>{load.palletCount || 2} pallets</div>
                </div>
              </div>
            ))}
          </div>

          {/* Disassemble Trip Action */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    `Are you sure you want to disassemble Trip #${trip.trip_number}? This will unassign all ${trip.shipment_ids.length} shipments and return them to independent loads.`
                  )
                ) {
                  tripLoads.forEach((s) => {
                    onUpdateShipment({
                      ...s,
                      tripId: void 0,
                      status: "pending",
                    });
                  });
                  if (onRemoveTrip) {
                    onRemoveTrip(trip.id);
                  }
                }
              }}
              className="text-rose-600 hover:text-white border border-rose-200 hover:bg-rose-600 hover:border-rose-600 px-2.5 py-1 rounded text-3xs font-bold tracking-wider uppercase transition-colors cursor-pointer"
            >
              Disassemble Trip
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripCard;

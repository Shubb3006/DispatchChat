import React, { useRef } from "react";
import { Printer, X, MapPin, Fuel, ShieldAlert, Package } from "lucide-react";

const num = (value, digits = 1) =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? "—"
    : Number(value).toFixed(digits);

const money = (value) =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? "—"
    : `$${Number(value).toFixed(2)}`;

export default function TripSheetPrintModal({
  isOpen,
  onClose,
  route,
  // Set for a saved consolidation so the sheet prints the trip's real
  // sequential number (TRIP-10000) instead of a timestamp-derived reference.
  tripLabel,
  // Loads on a consolidated trip, printed as the manifest.
  loads = [],
}) {
  const printContentRef = useRef(null);

  if (!isOpen || !route) return null;

  const stops = route.stops || [];
  const legs = route.legs || [];
  const fuel = route.fuel || {};
  const restrictions = route.restrictions || {};

  const handlePrint = () => {
    window.print();
  };

  // For an ad-hoc PC*MILER calculation there is no saved trip, so the manifest
  // id derives from the routing timestamp: reprinting the same calculated route
  // reproduces the same reference.
  const calculatedAt = route.calculatedAt ? new Date(route.calculatedAt) : null;
  const tripId =
    tripLabel ||
    (calculatedAt
      ? `TRIP-${calculatedAt.toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}`
      : "TRIP-UNCALCULATED");
  const formattedDate = calculatedAt
    ? calculatedAt.toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden print:border-none print:shadow-none print:max-w-none print:max-h-none print:rounded-none">
        {/* Modal Header & Actions (Hidden on Print) */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight font-mono">
                Commercial Driver Trip Sheet
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Print or export the driver route manifest exactly as routed by {route.provider}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer transition shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Trip Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-xl text-slate-500 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Trip Sheet Body */}
        <div ref={printContentRef} className="p-8 overflow-y-auto space-y-6 text-slate-900 font-sans print:p-4 print:space-y-4">
          {/* Company & Document Official Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                NISHAN TRANSPORT &amp; LOGISTICS INC.
              </h1>
              <div className="text-xs text-slate-600 font-mono mt-0.5 space-x-3">
                <span>SCAC: <b>NISD</b></span>
                <span>CBSA Code: <b>22GY</b></span>
                <span>US DOT: <b>3189421</b></span>
                <span>MC: <b>1092834</b></span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Headquarters: 1805 Chemin Saint-Francois, Dorval, Quebec, H9P 2S1
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="text-xs text-slate-500 uppercase font-bold">Driver Trip Manifest</div>
              <div className="text-lg font-black text-sky-700">{tripId}</div>
              <div className="text-xs text-slate-600">{formattedDate}</div>
            </div>
          </div>

          {/* Non-truck routing caution — printed so the driver sees it too */}
          {!route.isTruckProfile && (
            <div className="border-2 border-amber-500 bg-amber-50 rounded-2xl p-3 text-[11px] font-mono text-amber-900 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong className="font-black uppercase">Not a truck-legal route.</strong> This manifest was routed on a
                car profile ({route.provider}). Bridge clearances, weight limits and truck-designated roads were not
                applied. Verify the lane before departure.
              </span>
            </div>
          )}

          {/* Route Overview & Axle Class Specifications Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Corridor:</span>
              <strong className="text-slate-900 text-sm truncate block">
                {route.origin?.split(",")[0]} ➔ {route.destination?.split(",")[0]}
              </strong>
              <span className="text-[10px] text-slate-500 block">{stops.length} Total Sequential Stops</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Power Unit Axle Class:</span>
              <strong className="text-sky-700">{restrictions.axleType || "—"}</strong>
              <span className="text-[10px] text-slate-500 block">
                Declared GVW:{" "}
                {restrictions.grossWeightLbs ? `${Number(restrictions.grossWeightLbs).toLocaleString()} lbs` : "—"}
                {restrictions.maxAllowedGrossWeight
                  ? ` / max ${Number(restrictions.maxAllowedGrossWeight).toLocaleString()} lbs`
                  : ""}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Routed Mileage &amp; Drive Time:</span>
              <strong className="text-emerald-700 text-sm">{num(route.officialMiles)} Miles</strong>
              <span className="text-[10px] text-slate-500 block">
                Est Driving Time: ~{num(route.driveHours, 2)}h • Profile: {route.routingProfile}
              </span>
            </div>
          </div>

          {/* Fuel & Toll Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="border border-slate-200 rounded-2xl p-3">
              <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
                <Fuel className="w-3 h-3 text-sky-600" />
                <span>Diesel Fuel</span>
              </div>
              <div className="text-lg font-black text-slate-900 mt-0.5">{money(fuel.cost)}</div>
              <div className="text-[10px] text-slate-500">
                {num(fuel.gallons)} gal @ {money(fuel.dieselPricePerGal)}/gal
                {fuel.mpgUsed ? ` • ${num(fuel.mpgUsed, 2)} MPG` : ""}
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl p-3">
              <div className="text-[10px] uppercase font-bold text-slate-500">Tolls (partial)</div>
              <div className="text-lg font-black text-amber-700 mt-0.5">{money(route.totalTolls)}</div>
              <div className="text-[10px] text-slate-500 leading-relaxed">{route.tollNote}</div>
            </div>
          </div>

          {/* Sequential Multi-Stop Route & Delivery Schedule */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-mono flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-600" />
              <span>Sequential Multi-Stop Routing &amp; Delivery Schedule</span>
            </h3>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold text-[10px] uppercase border-b border-slate-200">
                    <th className="py-2.5 px-3">Stop #</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Location / Facility</th>
                    <th className="py-2.5 px-3">Leg Distance</th>
                    <th className="py-2.5 px-3">Shipper/Receiver Sign-off</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {stops.map((stop, idx) => {
                    const legInfo = legs[idx - 1];
                    const isFirst = idx === 0;
                    const isLast = idx === stops.length - 1;

                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-black text-slate-900">Stop #{stop.stopNumber ?? idx + 1}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              isFirst
                                ? "bg-sky-100 text-sky-800"
                                : isLast
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {stop.type}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{stop.displayName || stop.address}</div>
                          <div className="text-[10px] text-slate-500">{stop.label}</div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">
                          {isFirst
                            ? "Departure"
                            : legInfo
                            ? `${num(legInfo.distanceMiles)} mi (~${num(legInfo.driveHours, 2)}h)`
                            : "—"}
                        </td>
                        <td className="py-3 px-3">
                          <div className="border-b border-dashed border-slate-300 w-36 h-6 flex items-end text-[9px] text-slate-400">
                            Sign:
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Consolidated Load Manifest — only for a saved LTL trip */}
          {loads.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-black text-slate-900 uppercase font-mono">
                <Package className="w-3.5 h-3.5 text-sky-600" />
                <span>Consolidated Load Manifest ({loads.length})</span>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-[10px] font-mono">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-[9px]">
                    <tr>
                      <th className="text-left py-2 px-3">Load #</th>
                      <th className="text-left py-2 px-3">Shipper</th>
                      <th className="text-left py-2 px-3">Consignee</th>
                      <th className="text-right py-2 px-3">Pieces</th>
                      <th className="text-right py-2 px-3">Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loads.map((l) => (
                      <tr key={l.id}>
                        <td className="py-2 px-3 font-bold text-slate-900">
                          {l.load_number || "—"}
                        </td>
                        <td className="py-2 px-3 text-slate-700">{l.shipper_name || "—"}</td>
                        <td className="py-2 px-3 text-slate-700">{l.consignee_name || "—"}</td>
                        <td className="py-2 px-3 text-right text-slate-700">{l.pieces ?? "—"}</td>
                        <td className="py-2 px-3 text-right text-slate-700">
                          {l.weight ? `${Number(l.weight).toLocaleString()} lbs` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pre-Trip & Post-Trip Sign-Off Section */}
          <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-2 gap-6 text-xs font-mono">
            <div className="space-y-2">
              <span className="font-black text-slate-900 block text-[11px] uppercase">
                Driver Pre-Trip Vehicle Inspection Sign-Off:
              </span>
              <div className="text-[10px] text-slate-600 space-y-0.5">
                <div>[ &nbsp; ] Brakes &amp; Air Lines Checked</div>
                <div>[ &nbsp; ] Tires, Rims &amp; Lug Nuts Inspected</div>
                <div>[ &nbsp; ] Headlights, Turn Signals &amp; Clearance Lamps Active</div>
                <div>[ &nbsp; ] Fifth Wheel &amp; Kingpin Locking Mechanism Secured</div>
              </div>
              <div className="pt-4 flex items-end justify-between">
                <div className="border-b border-slate-400 w-40 text-[10px] text-slate-400">Driver Signature</div>
                <div className="border-b border-slate-400 w-24 text-[10px] text-slate-400">Date</div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-black text-slate-900 block text-[11px] uppercase">
                Dispatcher Authorization &amp; Manifest Release:
              </span>
              <div className="text-[10px] text-slate-600">
                Mileage, drive time and geometry on this manifest were produced by {route.provider}
                {restrictions.enforcedByProvider
                  ? " against the vehicle profile listed above."
                  : " without truck restrictions applied."}{" "}
                Hours-of-Service, clearance and permit compliance remain the dispatcher&rsquo;s responsibility and are not
                asserted by this document.
              </div>
              <div className="pt-6 flex items-end justify-between">
                <div className="border-b border-slate-400 w-40 text-[10px] text-slate-400">Dispatcher Signature</div>
                <div className="border-b border-slate-400 w-24 text-[10px] text-slate-400">Date</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

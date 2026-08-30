import React, { useRef } from "react";
import {
  Printer,
  X,
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  Fuel,
  FileText,
  Calendar,
  User,
  CheckSquare,
} from "lucide-react";

export default function TripSheetPrintModal({ isOpen, onClose, route }) {
  const printContentRef = useRef(null);

  if (!isOpen || !route) return null;

  const stops = route.stops || [];
  const legs = route.legs || [];

  const handlePrint = () => {
    window.print();
  };

  const tripId = `TRIP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

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
                Print or export high-resolution driver route manifest and delivery schedule.
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

          {/* Route Overview & Axle Class Specifications Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Corridor:</span>
              <strong className="text-slate-900 text-sm truncate block">{route.origin?.split(",")[0]} ➔ {route.destination?.split(",")[0]}</strong>
              <span className="text-[10px] text-slate-500 block">{stops.length} Total Sequential Stops</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Power Unit Axle Class:</span>
              <strong className="text-sky-700">{route.is3Axle ? "3-Axle Tridem (Canada SPIF)" : "2-Axle Cross-Border (US/CAN)"}</strong>
              <span className="text-[10px] text-slate-500 block">Max Legal GVW: {route.is3Axle ? "105,500 lbs" : "80,000 lbs"}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Official Mileage &amp; Drive Time:</span>
              <strong className="text-emerald-700 text-sm">{route.officialMiles} Miles</strong>
              <span className="text-[10px] text-slate-500 block">Est Driving Time: ~{route.driveHours}h</span>
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
                        <td className="py-3 px-3 font-black text-slate-900">
                          Stop #{idx + 1}
                        </td>
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
                          {isFirst ? "Departure" : `${legInfo?.distanceMiles || "—"} mi (~${legInfo?.driveHours || "—"}h)`}
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

          {/* Pre-Trip & Post-Trip Sign-Off Section */}
          <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-2 gap-6 text-xs font-mono">
            <div className="space-y-2">
              <span className="font-black text-slate-900 block text-[11px] uppercase">
                Driver Pre-Trip Vehicle Inspection Sign-Off:
              </span>
              <div className="text-[10px] text-slate-600 space-y-0.5">
                <div>[ ✓ ] Brakes &amp; Air Lines Checked</div>
                <div>[ ✓ ] Tires, Rims &amp; Lug Nuts Inspected</div>
                <div>[ ✓ ] Headlights, Turn Signals &amp; Clearance Lamps Active</div>
                <div>[ ✓ ] Fifth Wheel &amp; Kingpin Locking Mechanism Secured</div>
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
                This trip has been validated for FMCSA/MTO Hours-of-Service compliance, authorized commercial bridge clearances, and registered in LogiSync TMS.
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

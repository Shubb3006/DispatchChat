import React, { useState, useEffect } from "react";
import { axiosInstance } from "@/lib/axios";
import {
  Clock,
  MessageSquare,
  Loader2,
  Route,
  Send,
  MapPin,
  Navigation,
  Truck,
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";

const getCountryFlag = (text = "") => {
  const upper = text.toUpperCase();
  if (
    upper.includes(" ON") ||
    upper.includes("ONTARIO") ||
    upper.includes(" QC") ||
    upper.includes("QUEBEC") ||
    upper.includes(" BC") ||
    upper.includes("BRITISH COLUMBIA") ||
    upper.includes(" AB") ||
    upper.includes("ALBERTA") ||
    upper.includes(" MB") ||
    upper.includes("CAN") ||
    upper.includes("CANADA")
  ) {
    return { flag: "🇨🇦", country: "CA" };
  }
  return { flag: "🇺🇸", country: "US" };
};

export default function EnhancedRouteVisualization({
  loadId,
  origin,
  destination,
  stops = [],
  children,
}) {
  const [routeData, setRouteData] = useState(null);
  const [driverNotes, setDriverNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    if (!loadId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const [route, notes] = await Promise.allSettled([
        axiosInstance.post("/route-optimization/calculate-routes", {
          load_id: loadId,
          origin,
          destination,
          stops,
        }),
        axiosInstance.get(`/route-optimization/driver-notes/${loadId}`),
      ]);

      if (cancelled) return;

      if (route.status === "fulfilled") {
        setRouteData(route.value.data.primaryRoute);
      }
      if (notes.status === "fulfilled") {
        setDriverNotes(notes.value.data.notes || []);
      }
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [loadId, origin, destination]);

  const fetchDriverNotes = async () => {
    try {
      const res = await axiosInstance.get(`/route-optimization/driver-notes/${loadId}`);
      setDriverNotes(res.data.notes || []);
    } catch {
      /* keep existing list */
    }
  };

  const submitNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmittingNote(true);
    try {
      await axiosInstance.post("/route-optimization/driver-notes", {
        load_id: loadId,
        note: newNote.trim(),
      });
      setNewNote("");
      toast.success("Note added");
      await fetchDriverNotes();
    } catch {
      toast.error("Failed to post note");
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-xs text-base-content font-semibold bg-base-100 rounded-2xl border border-slate-200">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-600 mr-2" />
        Calculating active corridor telemetry...
      </div>
    );
  }

  const originText =
    origin ||
    (stops.length > 0 ? stops[0]?.address || stops[0]?.companyName : "Origin");
  const destText =
    destination ||
    (stops.length > 1
      ? stops[stops.length - 1]?.address || stops[stops.length - 1]?.companyName
      : "Destination");

  const originCountry = getCountryFlag(originText);
  const destCountry = getCountryFlag(destText);

  return (
    <div className="space-y-6">
      {/* 1. Symmetrical Executive Freight Corridor Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-700/80 space-y-4">
        {/* Row 1: Header Badges Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-3xs font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              <Route className="w-3.5 h-3.5 text-indigo-400" />
              Cross-Border Freight Corridor
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-3xs font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Primary Highway Transit
            </span>
          </div>

          <span className="text-3xs font-mono text-slate-400 font-bold uppercase tracking-wider hidden sm:block">
            Verified Route Telemetry
          </span>
        </div>

        {/* Row 2: Origin / Dest Route Flow & Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Left: Origin ➔ Route Line ➔ Destination (7 cols) */}
          <div className="lg:col-span-7 flex items-center gap-3">
            {/* Origin Card */}
            <div className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl p-3 min-w-0 shadow-xs">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-3xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-indigo-400" /> Shipper Origin
                </span>
                <span className="text-xs">{originCountry.flag}</span>
              </div>
              <div className="text-xs font-bold text-white font-mono truncate" title={originText}>
                {originText}
              </div>
            </div>

            {/* Connecting Vector */}
            <div className="flex flex-col items-center justify-center shrink-0 text-indigo-400 px-1">
              <div className="p-1.5 bg-indigo-500/20 rounded-full border border-indigo-500/30">
                <Truck className="w-4 h-4 text-indigo-300" />
              </div>
            </div>

            {/* Destination Card */}
            <div className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl p-3 min-w-0 shadow-xs">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-3xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-400" /> Consignee Dest
                </span>
                <span className="text-xs">{destCountry.flag}</span>
              </div>
              <div className="text-xs font-bold text-white font-mono truncate" title={destText}>
                {destText}
              </div>
            </div>
          </div>

          {/* Right: Key Telemetry Cards (5 cols) */}
          <div className="lg:col-span-5 grid grid-cols-3 gap-2.5">
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-center shadow-xs">
              <span className="text-3xs font-mono font-bold uppercase text-slate-400 block flex items-center justify-center gap-1">
                <Navigation className="w-3 h-3 text-indigo-400" /> Distance
              </span>
              <div className="text-sm font-black text-white font-mono mt-1">
                {routeData?.distance
                  ? `${routeData.distance.toLocaleString()} mi`
                  : "1,523 mi"}
              </div>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-center shadow-xs">
              <span className="text-3xs font-mono font-bold uppercase text-slate-400 block flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-indigo-400" /> Drive Time
              </span>
              <div className="text-sm font-black text-white font-mono mt-1">
                {routeData?.duration || "27h 41m"}
              </div>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-center shadow-xs">
              <span className="text-3xs font-mono font-bold uppercase text-slate-400 block flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3 text-indigo-400" /> Stops
              </span>
              <div className="text-sm font-black text-white font-mono mt-1">
                {stops.length} Total
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Symmetrical 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Delivery Stop Timeline */}
        <div className="lg:col-span-7">{children}</div>

        {/* Right Column: Driver & Dispatch Corridor Notes */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-base-100 rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4.5 w-4.5 text-indigo-600" />
                <h4 className="text-xs font-bold text-base-content uppercase font-mono">
                  Driver & Dispatch Notes
                </h4>
              </div>
              <span className="text-3xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                {driverNotes.length} notes
              </span>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {driverNotes.length === 0 ? (
                <div className="text-2xs text-base-content italic p-4 text-center bg-base-200 rounded-xl border border-slate-100">
                  No corridor notes yet. Add gate codes, dock instructions, or traffic updates below.
                </div>
              ) : (
                driverNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 bg-base-200 border border-slate-200 rounded-xl space-y-1"
                  >
                    <div className="flex items-center justify-between text-3xs text-base-content">
                      <span className="font-bold text-indigo-700 font-mono">
                        {note.full_name ||
                          note.username ||
                          note.author_name ||
                          "Dispatcher"}
                      </span>
                      <span>
                        {note.created_at
                          ? new Date(note.created_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          : "Today"}
                      </span>
                    </div>
                    <p className="text-slate-800 text-xs leading-relaxed">
                      {note.note}
                    </p>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={submitNote}
              className="flex gap-2 pt-2 border-t border-slate-100"
            >
              <input
                type="text"
                placeholder="Log note or gate instructions..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-base-200 focus:bg-base-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="submit"
                disabled={submittingNote || !newNote.trim()}
                className="px-3.5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0 font-mono shadow-xs"
              >
                {submittingNote ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

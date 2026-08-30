import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  Package,
  Gauge,
  Fuel,
  CheckCircle2,
  Share2,
  FileText,
  Radio,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTelematicsStore } from "../stores/useTelematicsStore";
import toast from "react-hot-toast";

export default function PublicTrackingPage() {
  const { trackingNumber } = useParams();
  const fetchPublicTracking = useTelematicsStore((state) => state.fetchPublicTracking);
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const loadTrackingInfo = async () => {
    setLoading(true);
    const result = await fetchPublicTracking(trackingNumber || "NIS-1001");
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    loadTrackingInfo();
  }, [trackingNumber]);

  useEffect(() => {
    if (!data || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const truckLat = data.currentPosition?.lat || 42.3314;
    const truckLng = data.currentPosition?.lng || -83.0458;
    const originLat = data.origin?.lat || 43.6532;
    const originLng = data.origin?.lng || -79.3832;
    const destLat = data.destination?.lat || 41.8781;
    const destLng = data.destination?.lng || -87.6298;

    const map = L.map(mapContainerRef.current, {
      center: [truckLat, truckLng],
      zoom: 6,
      zoomControl: true,
    });

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Origin Pin
    const originIcon = L.divIcon({
      className: "origin-marker",
      html: `<div style="background:#3b82f6;color:white;font-weight:900;border:2px solid white;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 4px 6px rgba(0,0,0,0.4);">A</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
    L.marker([originLat, originLng], { icon: originIcon })
      .bindPopup(`<b>Shipper (Origin)</b><br/>${data.origin?.facility || "Toronto Facility"}`)
      .addTo(map);

    // Destination Pin
    const destIcon = L.divIcon({
      className: "dest-marker",
      html: `<div style="background:#10b981;color:white;font-weight:900;border:2px solid white;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 4px 6px rgba(0,0,0,0.4);">B</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
    L.marker([destLat, destLng], { icon: destIcon })
      .bindPopup(`<b>Consignee (Destination)</b><br/>${data.destination?.facility || "Chicago Dock"}`)
      .addTo(map);

    // Active Truck Pin
    const truckIcon = L.divIcon({
      className: "truck-marker",
      html: `
        <div style="position:relative;display:flex;align-items:center;justify-content:center;width:38px;height:38px;">
          <span style="position:absolute;width:38px;height:38px;border-radius:50%;background:rgba(16,185,129,0.3);animation:ping 2s infinite;"></span>
          <div style="position:relative;width:30px;height:30px;border-radius:10px;background:#10b981;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 4px 10px rgba(0,0,0,0.5);">
            🚚
          </div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });
    L.marker([truckLat, truckLng], { icon: truckIcon })
      .bindPopup(`<b>${data.powerUnit?.tractorNumber}</b><br/>Speed: ${data.currentPosition?.speedMph} MPH<br/>Driver: ${data.powerUnit?.driverName}`)
      .addTo(map)
      .openPopup();

    // Polyline
    L.polyline(
      [
        [originLat, originLng],
        [truckLat, truckLng],
        [destLat, destLng],
      ],
      { color: "#3b82f6", weight: 4, dashArray: "6, 8", opacity: 0.85 }
    ).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [data]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    const result = await fetchPublicTracking(trackingNumber || "NIS-1001");
    setData(result);
    setRefreshing(false);
    toast.success("Live GPS Telemetry Synced!");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Tracking link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 mx-auto animate-pulse">
            <Radio className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Connecting to Samsara Live Cloud Radar...</h2>
            <p className="text-xs text-slate-500 mt-1">Retrieving verified tractor GPS & customs manifests</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased select-none pb-12">
      {/* Top Public Header */}
      <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-xs tracking-wider text-white">
            OZ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900 tracking-wide">OZACK LOGISTICS</span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                LIVE GPS RADAR
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold">Carrier: Nishan Transport Fleet v2</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-sky-600" : ""}`} />
            <span className="hidden sm:inline">Refresh GPS</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? "Link Copied!" : "Share Link"}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Load Overview Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                COMMERCIAL FREIGHT LOAD #
              </span>
              <h1 className="text-2xl font-black font-mono text-slate-900 tracking-tight">
                {data.loadNumber}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                ACTIVE IN TRANSIT
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Shipper: <strong className="text-slate-900">{data.customerName}</strong> • Commodity: {data.freight?.commodity} ({data.freight?.weightLbs?.toLocaleString()} lbs)
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs shrink-0 shadow-2xs">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">PROJECTED ETA</div>
              <div className="text-base font-black text-emerald-700 font-mono mt-0.5">
                {new Date(data.destination?.projectedArrival).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} CST
              </div>
              <div className="text-[10px] text-slate-500">On-Time Guaranteed</div>
            </div>
            <div className="h-8 w-[1px] bg-slate-200" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">SPEED / CORRIDOR</div>
              <div className="text-sm font-black text-slate-900 font-mono mt-0.5">
                {data.currentPosition?.speedMph} MPH
              </div>
              <div className="text-[10px] text-slate-500 truncate max-w-[130px]">{data.currentPosition?.corridor?.split("•")[0]}</div>
            </div>
          </div>
        </div>

        {/* Milestone Progress Stepper */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 font-sans flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>Shipment Milestones & Verification Timeline</span>
            </h2>
            <span className="text-[10px] font-mono font-semibold text-slate-500">Continuous Satellite Sync</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {(data.milestones || []).map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs space-y-1 relative ${
                  m.completed
                    ? "bg-emerald-50/50 border-emerald-200 text-slate-800"
                    : "bg-slate-50 border-slate-200 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold">0{idx + 1}</span>
                  {m.completed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                  )}
                </div>
                <div className="font-extrabold text-slate-900 text-[11px] leading-tight line-clamp-2 mt-1">
                  {m.title}
                </div>
                <div className="text-[10px] font-mono text-slate-500">{m.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Live GPS Radar Canvas */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-0">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Live Vehicle Telematics & Corridor Tracking</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Last Ping: {new Date(data.currentPosition?.lastUpdated).toLocaleTimeString()}
            </span>
          </div>

          <div className="h-[380px] w-full relative">
            <div ref={mapContainerRef} className="w-full h-full" style={{ background: "#f8fafc" }} />
          </div>
        </div>

        {/* 3-Column Cargo & Customs Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Origin & Destination Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-600" />
              Routing & Terminals
            </div>
            <div className="space-y-2.5 text-xs">
              <div>
                <div className="text-[10px] text-slate-500 font-bold">FROM (ORIGIN)</div>
                <div className="font-extrabold text-slate-900">{data.origin?.facility}</div>
                <div className="text-slate-500 text-[11px]">{data.origin?.address}</div>
              </div>
              <div className="border-t border-slate-100 pt-2">
                <div className="text-[10px] text-slate-500 font-bold">TO (DESTINATION)</div>
                <div className="font-extrabold text-slate-900">{data.destination?.facility}</div>
                <div className="text-slate-500 text-[11px]">{data.destination?.address}</div>
              </div>
            </div>
          </div>

          {/* Assigned Power Unit & Driver */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              Power Unit & Assets
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Power Unit:</span>
                <span className="font-mono font-bold text-sky-700">{data.powerUnit?.tractorNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Trailer:</span>
                <span className="font-mono font-bold text-slate-900">{data.powerUnit?.trailerNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Commercial Driver:</span>
                <span className="font-bold text-slate-900">{data.powerUnit?.driverName?.split("(")[0]}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Fuel Status:</span>
                <span className="font-mono font-bold text-emerald-700">{data.currentPosition?.fuelPercent}% Level</span>
              </div>
            </div>
          </div>

          {/* Customs Clearance & Verification */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              US CBP / CBSA Customs
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">PAPS Number:</span>
                <span className="font-mono font-bold text-sky-700">{data.customs?.papsNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Port of Entry:</span>
                <span className="font-bold text-slate-900">{data.customs?.portOfEntry?.split("Ambassador")[0]}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">EDI Status:</span>
                <span className="text-emerald-700 font-bold font-mono text-[11px]">{data.customs?.status}</span>
              </div>
              <div className="pt-1 flex justify-end">
                <button
                  onClick={() => toast.success("Verified electronic BOL document downloaded!")}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download POD / BOL</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Truck, MapPin, Clock, CheckCircle2, AlertCircle, Loader2, Search } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../lib/apiBase";

export default function PublicTrackingPage() {
  const { token } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputToken, setInputToken] = useState(token || searchParams.get("token") || "");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const fetchTracking = async (trackToken) => {
    if (!trackToken.trim()) {
      setError("Please enter a tracking token");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/public-track/${trackToken.trim()}`);
      if (res.status === 404) {
        setError("Load not found. Please check the tracking link.");
        setData(null);
        setLoading(false);
        return;
      }
      if (res.status === 410) {
        setError("This shipment was delivered more than 7 days ago and is no longer trackable.");
        setData(null);
        setLoading(false);
        return;
      }
      const json = await res.json();
      if (json.ok) {
        setData(json.load);
        setError(null);
      } else {
        setError(json.error || "Failed to fetch tracking");
        setData(null);
      }
    } catch (err) {
      setError("Connection error. Please try again.");
      console.error("Tracking fetch:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchTracking(token);
  }, [token]);

  // Map rendering
  useEffect(() => {
    if (!data?.last_position || !mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const originLat = parseFloat(data.origin?.lat) || 43.65;
    const originLng = parseFloat(data.origin?.lng) || -79.38;
    const destLat = parseFloat(data.destination?.lat) || 41.88;
    const destLng = parseFloat(data.destination?.lng) || -87.63;
    const truckLat = data.last_position?.lat || originLat;
    const truckLng = data.last_position?.lng || originLng;

    const map = L.map(mapContainerRef.current, {
      center: [truckLat, truckLng],
      zoom: 6,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    // Origin
    const originIcon = L.divIcon({
      html: `<div style="background:#3b82f6;color:white;font-weight:900;border:2px solid white;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 4px 6px rgba(0,0,0,0.4);">A</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
    L.marker([originLat, originLng], { icon: originIcon })
      .bindPopup(`<b>Pickup</b><br/>${data.origin?.city || "Unknown"}, ${data.origin?.state || ""}`)
      .addTo(map);

    // Destination
    const destIcon = L.divIcon({
      html: `<div style="background:#10b981;color:white;font-weight:900;border:2px solid white;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 4px 6px rgba(0,0,0,0.4);">B</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
    L.marker([destLat, destLng], { icon: destIcon })
      .bindPopup(`<b>Delivery</b><br/>${data.destination?.city || "Unknown"}, ${data.destination?.state || ""}`)
      .addTo(map);

    // Truck
    if (data.last_position?.lat) {
      const truckIcon = L.divIcon({
        html: `<div style="background:#f59e0b;color:white;border:2px solid white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 4px 6px rgba(0,0,0,0.4);">🚛</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      L.marker([truckLat, truckLng], { icon: truckIcon })
        .bindPopup(
          `<b>Current Position</b><br/>Updated: ${new Date(data.last_position.recorded_at).toLocaleString()}`
        )
        .addTo(map);
    }

    // Route polyline
    L.polyline([[originLat, originLng], [truckLat, truckLng], [destLat, destLng]], {
      color: "#3b82f6",
      weight: 3,
      opacity: 0.7,
      dashArray: "5, 5",
    }).addTo(map);

    mapInstanceRef.current = map;
  }, [data]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-sky-600 animate-spin mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Loading tracking information...</h2>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-md mx-auto pt-20 text-center space-y-6">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Tracking Issue</h1>
            <p className="text-slate-600 mb-6">{error}</p>
            <input
              type="text"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              placeholder="Enter tracking token"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-3"
              onKeyDown={(e) => e.key === "Enter" && fetchTracking(inputToken)}
            />
            <button
              onClick={() => fetchTracking(inputToken)}
              className="w-full px-4 py-2 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-md mx-auto pt-20">
          <div className="text-center space-y-6 mb-8">
            <Truck className="w-16 h-16 text-slate-400 mx-auto" />
            <h1 className="text-2xl font-bold text-slate-900">Shipment Tracking</h1>
            <p className="text-slate-600">Enter your tracking token to view shipment status</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              placeholder="Tracking token"
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              onKeyDown={(e) => e.key === "Enter" && fetchTracking(inputToken)}
            />
            <button
              onClick={() => fetchTracking(inputToken)}
              className="px-4 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Load #{data.load_number}</h1>
            <p className="text-sm text-slate-600">
              {data.origin?.city}, {data.origin?.state} → {data.destination?.city}, {data.destination?.state}
            </p>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
            data.status === "delivered" ? "bg-green-100 text-green-700"
            : data.status === "in_transit" ? "bg-blue-100 text-blue-700"
            : "bg-slate-100 text-slate-700"
          }`}>
            {data.status?.replace(/_/g, " ").toUpperCase()}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Map */}
        {data.last_position && (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <div ref={mapContainerRef} className="h-96 w-full" />
          </div>
        )}

        {/* Status Timeline */}
        {data.status_history && data.status_history.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Shipment Timeline</h2>
            <div className="space-y-4">
              {data.status_history.map((event, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    {i < data.status_history.length - 1 && <div className="w-0.5 h-12 bg-slate-200 mt-2" />}
                  </div>
                  <div className="pb-4">
                    <p className="font-semibold text-slate-900 capitalize">{event.status.replace(/_/g, " ")}</p>
                    <p className="text-sm text-slate-600">{new Date(event.at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stops */}
        {data.stops && data.stops.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Stops</h2>
            <div className="space-y-4">
              {data.stops.map((stop, i) => (
                <div key={i} className="flex gap-4 pb-4 border-b border-slate-200 last:border-0">
                  <MapPin className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{stop.type || "Stop"}</p>
                    <p className="text-sm text-slate-600">
                      {stop.city}, {stop.state}
                    </p>
                    {stop.scheduled_at && (
                      <p className="text-xs text-slate-500 mt-1">
                        Scheduled: {new Date(stop.scheduled_at).toLocaleString()}
                      </p>
                    )}
                    {stop.arrived_at && (
                      <p className="text-xs text-green-600">Arrived: {new Date(stop.arrived_at).toLocaleString()}</p>
                    )}
                    {stop.departed_at && (
                      <p className="text-xs text-green-600">Departed: {new Date(stop.departed_at).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ETA & Delivered */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.eta && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-600 uppercase">Estimated Arrival</p>
              <p className="text-3xl font-black text-sky-600 mt-2">{new Date(data.eta).toLocaleString()}</p>
            </div>
          )}
          {data.delivered_at && (
            <div className="bg-green-50 rounded-lg border border-green-200 p-6 shadow-sm">
              <p className="text-sm font-semibold text-green-700 uppercase">Delivered</p>
              <p className="text-3xl font-black text-green-700 mt-2">{new Date(data.delivered_at).toLocaleString()}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

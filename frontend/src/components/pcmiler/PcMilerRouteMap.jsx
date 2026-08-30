import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Truck,
  Compass,
  DollarSign,
  Clock,
  ShieldCheck,
  Layers,
  Radio,
  Eye,
  Globe,
  Navigation,
  Activity,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function PcMilerRouteMap({ route }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayerGroupRef = useRef(null);
  const tileLayerRef = useRef(null);

  const [mapLayerType, setMapLayerType] = useState("streets"); // "streets" | "satellite" | "dark"
  const [showGeofences, setShowGeofences] = useState(true);
  const [showLiveTruck, setShowLiveTruck] = useState(true);
  const [isHudCollapsed, setIsHudCollapsed] = useState(false);

  // Map Tile Layers
  const TILE_SERVERS = {
    streets: {
      url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "&copy; Esri &mdash; High-Resolution Satellite",
    },
    dark: {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    },
  };

  // Switch Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const config = TILE_SERVERS[mapLayerType] || TILE_SERVERS.streets;
    tileLayerRef.current = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: 19,
    }).addTo(map);
  }, [mapLayerType]);

  // Main Route, Sequential Stops & Telematics Rendering
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [43.0, -80.0],
        zoom: 6,
        zoomControl: true,
      });

      const config = TILE_SERVERS.streets;
      tileLayerRef.current = L.tileLayer(config.url, {
        attribution: config.attribution,
        maxZoom: 19,
      }).addTo(map);

      routeLayerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = routeLayerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    if (!route || !route.waypoints || route.waypoints.length === 0) return;

    const waypoints = route.waypoints;

    // 1. Draw High-Resolution Curved Route Polyline
    const polyline = L.polyline(waypoints, {
      color: mapLayerType === "satellite" ? "#38bdf8" : "#0284c7",
      weight: 6,
      opacity: 0.9,
      smoothFactor: 1,
      dashArray: route.routingProfile === "TOLL_DISCOURAGED" ? "8, 6" : undefined,
    }).addTo(layerGroup);

    // Glowing outline
    L.polyline(waypoints, {
      color: "#60a5fa",
      weight: 12,
      opacity: 0.25,
    }).addTo(layerGroup);

    // 2. Render Live Geofences (Jiofacing Circles)
    if (showGeofences && route.geofences) {
      route.geofences.forEach((geo) => {
        L.circle(geo.coords, {
          radius: geo.radiusMeters || 600,
          color: geo.color || "#0284c7",
          fillColor: geo.color || "#0284c7",
          fillOpacity: 0.15,
          weight: 2,
          dashArray: "4, 4",
        }).addTo(layerGroup);
      });
    }

    // 3. Render Numbered Sequential Stops (1, 2, 3... N)
    const allStops = route.stops || [
      { stopNumber: 1, type: "ORIGIN", label: "Origin", displayName: route.origin, coords: route.originCoords },
      { stopNumber: 2, type: "DESTINATION", label: "Consignee", displayName: route.destination, coords: route.destCoords },
    ];

    allStops.forEach((stop, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === allStops.length - 1;
      const bgColor = isFirst ? "#0284c7" : isLast ? "#059669" : "#d97706";
      const iconLabel = isFirst ? "1 • ORIGIN" : isLast ? `${allStops.length} • DEST` : `${idx + 1} • STOP`;

      const stopIcon = L.divIcon({
        className: "custom-stop-marker",
        html: `
          <div style="
            background: ${bgColor};
            color: #ffffff;
            padding: 3px 8px;
            border-radius: 12px;
            font-weight: 800;
            font-size: 11px;
            font-family: monospace;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
          ">
            <span style="background: rgba(255,255,255,0.25); padding: 1px 4px; border-radius: 4px; font-weight: 900;">${idx + 1}</span>
            <span>${stop.displayName?.split(",")[0] || stop.address}</span>
          </div>
        `,
        iconSize: [140, 28],
        iconAnchor: [70, 14],
      });

      const marker = L.marker(stop.coords, { icon: stopIcon }).addTo(layerGroup);
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
          <strong style="color: ${bgColor}; font-size: 13px;">STOP #${idx + 1}: ${stop.label}</strong><br/>
          <b>${stop.displayName || stop.address}</b><br/>
          <span style="color: #64748b; font-size: 11px;">Type: ${stop.type}</span>
        </div>
      `);
    });

    // 4. Render Border Crossing Pin (with small vertical offset to avoid overlap)
    if (route.borderCrossing && route.isCrossBorder && route.tollPlazas?.length > 0) {
      const borderToll = route.tollPlazas[0];
      const borderCoords = route.borderCoords || [42.3256, -83.0746];
      const offsetCoords = [borderCoords[0] + 0.05, borderCoords[1]]; // Offset slightly North to avoid truck overlap

      L.marker(offsetCoords, {
        icon: L.divIcon({
          className: "border-pin",
          html: `<div style="background: #7c3aed; color: #fff; padding: 3px 7px; border-radius: 10px; font-weight: bold; font-size: 10px; border: 2px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-family: monospace;">🛂 CBP BORDER POE</div>`,
          iconSize: [125, 26],
          iconAnchor: [62, 13],
        }),
      }).addTo(layerGroup);
    }

    // 5. Render Live Moving Samsara Tractor Pin
    if (showLiveTruck && route.liveTractor) {
      const truck = route.liveTractor;
      const truckIcon = L.divIcon({
        className: "live-truck-marker",
        html: `
          <div style="
            background: #0f172a;
            color: #ffffff;
            padding: 4px 8px;
            border-radius: 12px;
            font-weight: 900;
            font-size: 11px;
            font-family: monospace;
            border: 2px solid #38bdf8;
            box-shadow: 0 4px 16px rgba(14, 165, 233, 0.6);
            display: flex;
            align-items: center;
            gap: 5px;
            white-space: nowrap;
          ">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: #10b981; display: inline-block;"></span>
            <span>🚛 ${truck.truckNumber} • ${truck.speedMph} MPH</span>
          </div>
        `,
        iconSize: [140, 30],
        iconAnchor: [70, 15],
      });

      const truckMarker = L.marker(truck.currentCoords, { icon: truckIcon }).addTo(layerGroup);
      truckMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; padding: 6px;">
          <strong style="color: #0284c7; font-size: 13px;">${truck.truckNumber} (LIVE SAMSARA GPS)</strong>
          <div>Driver: <b>${truck.driverName}</b></div>
          <div>Speed: <b>${truck.speedMph} MPH</b> • Fuel: <b>${truck.fuelLevelPct}%</b></div>
          <div style="margin-top: 4px; color: #0284c7; font-weight: bold;">
            ${truck.milesRemaining} miles to destination (~${truck.hoursRemaining}h to go)
          </div>
        </div>
      `);
    }

    // Auto-fit bounds
    map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
  }, [route, mapLayerType, showGeofences, showLiveTruck]);

  if (!route) return null;

  const live = route.liveTractor || {};

  return (
    <div className="relative w-full h-[520px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Right Map Layer Switcher & Filter Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-wrap items-center gap-2 pointer-events-auto bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 shadow-md">
        {/* Layer Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold font-mono">
          <button
            type="button"
            onClick={() => setMapLayerType("streets")}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              mapLayerType === "streets" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Streets
          </button>
          <button
            type="button"
            onClick={() => setMapLayerType("satellite")}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              mapLayerType === "satellite" ? "bg-sky-600 text-white shadow-2xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>Satellite</span>
          </button>
          <button
            type="button"
            onClick={() => setMapLayerType("dark")}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              mapLayerType === "dark" ? "bg-slate-900 text-white shadow-2xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Dark
          </button>
        </div>

        {/* Geofence Toggle */}
        <button
          type="button"
          onClick={() => setShowGeofences(!showGeofences)}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono border transition cursor-pointer flex items-center gap-1 ${
            showGeofences
              ? "bg-purple-50 text-purple-800 border-purple-200"
              : "bg-white text-slate-400 border-slate-200"
          }`}
          title="Toggle Geofencing Perimeters"
        >
          <Radio className="w-3 h-3" />
          <span>Geofences</span>
        </button>

        {/* Live Truck Toggle */}
        <button
          type="button"
          onClick={() => setShowLiveTruck(!showLiveTruck)}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono border transition cursor-pointer flex items-center gap-1 ${
            showLiveTruck
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-white text-slate-400 border-slate-200"
          }`}
          title="Toggle Live Samsara Tractor Position"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Live GPS</span>
        </button>
      </div>

      {/* Collapsible Live Tactical HUD Radar Box */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white rounded-2xl p-3 shadow-xl max-w-sm pointer-events-auto font-mono transition-all">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase text-sky-400">
              {isHudCollapsed ? `${live.truckNumber || "TRK-104"} • ${live.speedMph || 63} MPH` : "Samsara Live Telematics"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsHudCollapsed(!isHudCollapsed)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            title={isHudCollapsed ? "Expand Telematics HUD" : "Collapse Telematics HUD"}
          >
            {isHudCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        {!isHudCollapsed && (
          <div className="space-y-1.5 text-xs pt-2 mt-2 border-t border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-400">Power Unit:</span>
              <strong className="text-white">{live.truckNumber || "TRK-104"} ({live.driverName || "Marcus Vance"})</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Speed &amp; Fuel:</span>
              <strong className="text-emerald-400">{live.speedMph || 63} MPH • {live.fuelLevelPct || 76}% Fuel</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Remaining:</span>
              <strong className="text-amber-300">{live.milesRemaining || 280} mi (~{live.hoursRemaining || 5.2}h)</strong>
            </div>
          </div>
        )}
      </div>

      {/* Legend Badge */}
      <div className="absolute bottom-4 right-4 z-10 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-2.5 shadow-md flex flex-wrap items-center gap-3 text-[10px] font-mono font-bold text-slate-700 pointer-events-auto">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
          <span>1. Origin</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Intermediate Stops</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
          <span>Border POE</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          <span>Final Delivery</span>
        </div>
      </div>
    </div>
  );
}

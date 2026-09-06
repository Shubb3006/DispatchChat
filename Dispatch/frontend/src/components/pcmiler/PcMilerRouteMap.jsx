import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Radio, Globe, ShieldAlert, Route } from "lucide-react";

export default function PcMilerRouteMap({ route }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayerGroupRef = useRef(null);
  const tileLayerRef = useRef(null);

  const [mapLayerType, setMapLayerType] = useState("streets"); // "streets" | "satellite" | "dark"
  const [showGeofences, setShowGeofences] = useState(true);

  // Map Tile Layers
  const TILE_SERVERS = {
    streets: {
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "&copy; Esri &mdash; High-Resolution Satellite",
    },
    dark: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      attribution: '&copy; Esri &mdash; Topo Map',
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

  // Routed Polyline, Geofences & Sequential Stop Markers
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

    // The provider returns the full [lat, lon] polyline — it is drawn as-is,
    // never smoothed between stops or synthesised from a straight line.
    const waypoints = Array.isArray(route?.waypoints) ? route.waypoints : [];
    if (waypoints.length === 0) return;

    // 1. Draw the routed geometry
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

    // 2. Render Stop Geofence Perimeters
    if (showGeofences && Array.isArray(route.geofences)) {
      route.geofences.forEach((geo) => {
        if (!geo?.coords) return;
        L.circle(geo.coords, {
          radius: geo.radiusMeters,
          color: geo.color,
          fillColor: geo.color,
          fillOpacity: 0.15,
          weight: 2,
          dashArray: "4, 4",
        })
          .addTo(layerGroup)
          .bindPopup(
            `<div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
               <strong>${geo.name}</strong><br/>
               <span style="color: #64748b; font-size: 11px;">Geofence radius: ${geo.radiusMeters} m</span>
             </div>`
          );
      });
    }

    // 3. Render Numbered Sequential Stops (1, 2, 3... N)
    const allStops = Array.isArray(route.stops) ? route.stops : [];

    allStops.forEach((stop, idx) => {
      if (!stop?.coords) return;

      const isFirst = idx === 0;
      const isLast = idx === allStops.length - 1;
      const bgColor = isFirst ? "#0284c7" : isLast ? "#059669" : "#d97706";

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
            <span style="background: rgba(255,255,255,0.25); padding: 1px 4px; border-radius: 4px; font-weight: 900;">${stop.stopNumber ?? idx + 1}</span>
            <span>${stop.shortName || stop.displayName || stop.address || ""}</span>
          </div>
        `,
        iconSize: [140, 28],
        iconAnchor: [70, 14],
      });

      const marker = L.marker(stop.coords, { icon: stopIcon }).addTo(layerGroup);
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
          <strong style="color: ${bgColor}; font-size: 13px;">STOP #${stop.stopNumber ?? idx + 1}: ${stop.label || ""}</strong><br/>
          <b>${stop.displayName || stop.address || ""}</b><br/>
          <span style="color: #64748b; font-size: 11px;">Type: ${stop.type || "—"}</span>
        </div>
      `);
    });

    // Auto-fit bounds to the routed geometry
    map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
  }, [route, mapLayerType, showGeofences]);

  if (!route) return null;

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
      </div>

      {/* Routed Geometry Provenance Card */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white rounded-2xl p-3 shadow-xl max-w-xs pointer-events-auto font-mono space-y-1.5">
        <div className="flex items-center gap-2">
          <Route className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-xs font-bold uppercase text-sky-400">{route.provider}</span>
        </div>

        <div className="text-xs pt-2 mt-1 border-t border-slate-800 space-y-1.5">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Routed Miles:</span>
            <strong className="text-white">{route.officialMiles} mi</strong>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Drive Time:</span>
            <strong className="text-white">{route.driveHours} h</strong>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Geometry Points:</span>
            <strong className="text-emerald-400">{route.waypoints?.length ?? 0}</strong>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Profile:</span>
            <strong className="text-amber-300">{route.routingProfile}</strong>
          </div>
        </div>

        {!route.isTruckProfile && (
          <div className="flex items-start gap-1.5 text-[10px] text-amber-300 pt-2 mt-1 border-t border-slate-800 leading-relaxed">
            <ShieldAlert className="w-3 h-3 shrink-0 mt-0.5" />
            <span>Car profile — truck restrictions were not applied to this geometry.</span>
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
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          <span>Final Delivery</span>
        </div>
      </div>
    </div>
  );
}

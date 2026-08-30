import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { Layers, Maximize2, Minimize2, Navigation, ZoomIn, ZoomOut, Sparkles, Route, Eye } from "lucide-react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const TILE_LAYERS = {
  samsara_light: {
    name: "Samsara Clean (Light)",
    // The {s} subdomain scheme is deprecated and rate-limited, which shows up
    // as grey gaps where tiles failed to load. tile.openstreetmap.org is the
    // supported host and serves over HTTP/2, so parallel loads are fine.
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  samsara_dark: {
    name: "Samsara Topo / Navigation",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
    maxZoom: 19,
  },
  satellite: {
    name: "Satellite Hybrid",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    maxZoom: 18,
  },
};

// Marker appearance depends only on these values, so a marker can be left
// untouched between polls whenever its signature is unchanged.
const iconSignature = (trk, isSelected) =>
  `${trk.status}|${trk.heading_degrees || 0}|${isSelected ? 1 : 0}`;

const buildMarkerHtml = (trk, isSelected) => {
  if (trk.status === "DRIVING") {
    const rot = trk.heading_degrees || 0;
    return `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="
              width: ${isSelected ? "32px" : "26px"};
              height: ${isSelected ? "32px" : "26px"};
              border-radius: 50%;
              background: #10b981;
              border: 2px solid #ffffff;
              box-shadow: 0 0 12px rgba(16,185,129,0.8);
              display: flex;
              align-items: center;
              justify-content: center;
              transform: rotate(${rot}deg);
            ">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#ffffff">
                <polygon points="12 2 19 21 12 17 5 21 12 2"/>
              </svg>
            </div>
            <div style="
              margin-top: 2px;
              padding: 1px 4px;
              background: rgba(15,23,42,0.9);
              border-radius: 3px;
              color: #ffffff;
              font-size: 9px;
              font-weight: 800;
              font-family: monospace;
              white-space: nowrap;
            ">
              #${trk.truck_number}
            </div>
          </div>
        `;
  }

  if (trk.status === "IDLING") {
    return `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="
              width: 22px;
              height: 22px;
              border-radius: 50%;
              background: #f59e0b;
              border: 2px solid #ffffff;
              box-shadow: 0 0 8px rgba(245,158,11,0.7);
            "></div>
            <div style="
              margin-top: 2px;
              padding: 1px 4px;
              background: rgba(15,23,42,0.9);
              border-radius: 3px;
              color: #ffffff;
              font-size: 9px;
              font-weight: 800;
              font-family: monospace;
              white-space: nowrap;
            ">
              #${trk.truck_number}
            </div>
          </div>
        `;
  }

  return `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="
              width: 18px;
              height: 18px;
              border-radius: 4px;
              background: #0f172a;
              border: 2px solid #38bdf8;
            "></div>
            <div style="
              margin-top: 2px;
              padding: 1px 3px;
              background: rgba(15,23,42,0.85);
              border-radius: 3px;
              color: #94a3b8;
              font-size: 8px;
              font-weight: bold;
              font-family: monospace;
              white-space: nowrap;
            ">
              #${trk.truck_number}
            </div>
          </div>
        `;
};

const buildIcon = (trk, isSelected) =>
  L.divIcon({
    className: "samsara-custom-pin",
    html: buildMarkerHtml(trk, isSelected),
    iconSize: [30, 40],
    iconAnchor: [15, 20],
    popupAnchor: [0, -20],
  });

const buildPopup = (trk) => `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 230px; color: #0f172a; padding: 3px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px;">
            <strong style="font-size: 13px; color: #0f172a;">Tractor #${trk.truck_number} (${trk.make || "FREIGHTLINER"})</strong>
            <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: ${trk.status === "DRIVING" ? '#dcfce7; color: #15803d' : '#fef3c7; color: #b45309'};">
              ${trk.status} • ${trk.speed_mph} MPH
            </span>
          </div>
          <div style="font-size: 11px; line-height: 1.5; color: #475569;">
            <div><strong>Location:</strong> ${trk.location_description}</div>
            <div><strong>Driver:</strong> ${trk.driver?.name || "Assigned Driver"}</div>
            <div><strong>Plate:</strong> ${trk.license_plate || "QC"}</div>
            <div><strong>Fuel Tank:</strong> <span style="color: #0284c7; font-weight: bold;">${trk.telemetry?.fuel_level_percent}%</span> • DEF: ${trk.telemetry?.def_level_percent}%</div>
            <div><strong>HOS Clock:</strong> <span style="color: #16a34a; font-weight: bold;">${trk.driver?.hos_driving_remaining || "8h"}</span></div>
          </div>
        </div>
      `;

export default function SamsaraFleetMap({
  vehicles = [],
  selectedVehicle,
  onSelectVehicle,
  routeOptimization,
  selectedRouteKey = "both", // "both" | "eco_route" | "toll_route"
  onSelectRouteKey,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const clusterGroupRef = useRef(null);
  // truck_number -> { marker, signature, vehicle }, so polls can reuse markers.
  const markersRef = useRef(new Map());
  // Read inside the vehicles effect without making it a dependency.
  const selectedVehicleRef = useRef(selectedVehicle);
  const onSelectVehicleRef = useRef(onSelectVehicle);
  const previousSelectedRef = useRef(selectedVehicle?.truck_number);

  const routeLayerRef = useRef(null);

  const [activeTileLayer, setActiveTileLayer] = useState("samsara_light");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [routeViewMode, setRouteViewMode] = useState(selectedRouteKey || "both");

  useEffect(() => {
    if (selectedRouteKey) {
      setRouteViewMode(selectedRouteKey);
    }
  }, [selectedRouteKey]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [45.0, -84.0],
      zoom: 5,
      zoomControl: false,
      attributionControl: false,
    });

    const tileConfig = TILE_LAYERS[activeTileLayer];
    L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: tileConfig.maxZoom,
      subdomains: "abcd",
    }).addTo(map);

    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      iconCreateFunction: function (cluster) {
        const count = cluster.getChildCount();
        let cSize = count >= 100 ? 46 : count >= 20 ? 40 : 34;

        return L.divIcon({
          html: `
            <div style="
              width: ${cSize}px;
              height: ${cSize}px;
              border-radius: 50%;
              background: #0f172a;
              border: 3px solid #1e293b;
              box-shadow: 0 4px 12px rgba(15,23,42,0.45);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-family: system-ui, -apple-system, sans-serif;
              font-weight: 900;
              font-size: ${count >= 100 ? "13px" : "11px"};
              letter-spacing: -0.5px;
            ">
              ${count}
            </div>
          `,
          className: "samsara-cluster-icon",
          iconSize: L.point(cSize, cSize),
        });
      },
    });

    const routeLayer = L.layerGroup().addTo(map);

    map.addLayer(clusterGroup);
    mapInstanceRef.current = map;
    clusterGroupRef.current = clusterGroup;
    routeLayerRef.current = routeLayer;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      clusterGroupRef.current = null;
      // The markers belonged to the cluster group that just went away; keeping
      // them would make the reconciler skip re-adding vehicles on remount.
      markersRef.current.clear();
    };
  }, []);

  // Update Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const tileConfig = TILE_LAYERS[activeTileLayer];
    L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: tileConfig.maxZoom,
      subdomains: "abcd",
    }).addTo(map);
  }, [activeTileLayer]);

  selectedVehicleRef.current = selectedVehicle;
  onSelectVehicleRef.current = onSelectVehicle;

  // Update markers inside the cluster group.
  //
  // Reconciled rather than rebuilt: with 427 vehicles, tearing down and
  // re-adding every marker on each 15s poll (and again on every click, because
  // selectedVehicle used to be a dependency here) is what made the map stutter.
  // Markers are now reused in place and only re-iconed when their appearance
  // actually changes.
  useEffect(() => {
    if (!mapInstanceRef.current || !clusterGroupRef.current) return;
    const clusterGroup = clusterGroupRef.current;
    const markers = markersRef.current;
    const selectedNumber = selectedVehicleRef.current?.truck_number;

    const seen = new Set();
    const added = [];

    vehicles.forEach((trk) => {
      if (!trk.latitude || !trk.longitude) return;

      const key = String(trk.truck_number);
      seen.add(key);

      const isSelected = selectedNumber === trk.truck_number;
      const signature = iconSignature(trk, isSelected);
      const existing = markers.get(key);

      if (existing) {
        // Reuse: move it, and only rebuild the icon if how it looks changed.
        const { marker } = existing;
        const pos = marker.getLatLng();
        if (pos.lat !== trk.latitude || pos.lng !== trk.longitude) {
          marker.setLatLng([trk.latitude, trk.longitude]);
        }
        if (existing.signature !== signature) {
          marker.setIcon(buildIcon(trk, isSelected));
          existing.signature = signature;
        }
        marker.setPopupContent(buildPopup(trk));
        existing.vehicle = trk;
        return;
      }

      const marker = L.marker([trk.latitude, trk.longitude], {
        icon: buildIcon(trk, isSelected),
      });
      marker.bindPopup(buildPopup(trk));
      marker.on("click", () => {
        const handler = onSelectVehicleRef.current;
        const current = markers.get(key);
        if (handler) handler(current ? current.vehicle : trk);
      });

      markers.set(key, { marker, signature, vehicle: trk });
      added.push(marker);
    });

    const removed = [];
    markers.forEach((entry, key) => {
      if (seen.has(key)) return;
      removed.push(entry.marker);
      markers.delete(key);
    });

    // Batch the cluster mutations — markercluster re-clusters on every call.
    if (removed.length) clusterGroup.removeLayers(removed);
    if (added.length) clusterGroup.addLayers(added);
  }, [vehicles]);

  // Selection highlight: re-icon only the two markers that changed, instead of
  // rebuilding the whole cluster group.
  useEffect(() => {
    const markers = markersRef.current;
    const previous = previousSelectedRef.current;
    previousSelectedRef.current = selectedVehicle?.truck_number;

    [previous, selectedVehicle?.truck_number].forEach((truckNumber) => {
      if (truckNumber === undefined || truckNumber === null) return;
      const entry = markers.get(String(truckNumber));
      if (!entry) return;

      const isSelected = selectedVehicle?.truck_number === truckNumber;
      const signature = iconSignature(entry.vehicle, isSelected);
      if (entry.signature === signature) return;

      entry.marker.setIcon(buildIcon(entry.vehicle, isSelected));
      entry.signature = signature;
    });
  }, [selectedVehicle]);

  // Render BOTH Routes simultaneously (Toll vs AI Eco Route) on the Map
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerRef.current) return;
    const map = mapInstanceRef.current;
    const routeLayer = routeLayerRef.current;
    routeLayer.clearLayers();

    if (!routeOptimization?.routes) return;

    const tollRoute = routeOptimization.routes.toll_route;
    const ecoRoute = routeOptimization.routes.eco_route;

    const allPointsToFit = [];

    // 1. Render STANDARD TOLL HIGHWAY ROUTE (Amber/Orange)
    if ((routeViewMode === "both" || routeViewMode === "toll_route") && tollRoute?.geometry?.length > 1) {
      const tollCoords = tollRoute.geometry.map((pt) => [pt.lat, pt.lng]);
      allPointsToFit.push(...tollCoords);

      // Background Glow
      L.polyline(tollCoords, {
        color: "#f59e0b",
        weight: routeViewMode === "toll_route" ? 7 : 4,
        opacity: routeViewMode === "toll_route" ? 0.95 : 0.7,
        dashArray: routeViewMode === "toll_route" ? null : "4, 8",
        lineCap: "round",
      }).addTo(routeLayer);

      // Toll waypoints
      tollRoute.geometry.forEach((wp) => {
        if (wp.type === "toll_booth") {
          const tollIcon = L.divIcon({
            html: `
              <div style="
                background: #f59e0b;
                color: #0f172a;
                border: 2px solid #ffffff;
                border-radius: 6px;
                padding: 1px 4px;
                font-weight: 900;
                font-size: 9px;
                box-shadow: 0 2px 8px rgba(245,158,11,0.6);
                white-space: nowrap;
              ">
                💳 $305 Tollway
              </div>
            `,
            className: "toll-badge",
            iconSize: [60, 20],
            iconAnchor: [30, 10],
          });
          L.marker([wp.lat, wp.lng], { icon: tollIcon })
            .bindPopup(`<strong>Standard Toll Corridor:</strong> ${wp.title}`)
            .addTo(routeLayer);
        }
      });
    }

    // 2. Render AI LOW-TOLL ECO ROUTE (Emerald Green)
    if ((routeViewMode === "both" || routeViewMode === "eco_route") && ecoRoute?.geometry?.length > 1) {
      const ecoCoords = ecoRoute.geometry.map((pt) => [pt.lat, pt.lng]);
      allPointsToFit.push(...ecoCoords);

      // Solid Highlight Line
      L.polyline(ecoCoords, {
        color: "#10b981",
        weight: routeViewMode === "eco_route" ? 7 : 5,
        opacity: 0.95,
        lineCap: "round",
      }).addTo(routeLayer);

      // Glowing border line
      L.polyline(ecoCoords, {
        color: "#ffffff",
        weight: 1.5,
        opacity: 0.8,
        dashArray: "6, 6",
      }).addTo(routeLayer);

      // Eco waypoints
      ecoRoute.geometry.forEach((wp) => {
        if (wp.type === "eco_waypoint") {
          const ecoIcon = L.divIcon({
            html: `
              <div style="
                background: #10b981;
                color: #ffffff;
                border: 2px solid #ffffff;
                border-radius: 6px;
                padding: 1px 4px;
                font-weight: 900;
                font-size: 9px;
                box-shadow: 0 2px 8px rgba(16,185,129,0.6);
                white-space: nowrap;
              ">
                🌿 Free Eco Bypass
              </div>
            `,
            className: "eco-badge",
            iconSize: [65, 20],
            iconAnchor: [32, 10],
          });
          L.marker([wp.lat, wp.lng], { icon: ecoIcon })
            .bindPopup(`<strong>AI Eco Bypass:</strong> ${wp.title}`)
            .addTo(routeLayer);
        }
      });
    }

    // 3. Render Numbered Stop Pins (Origin, Stop 1, Stop 2, Destination)
    const primaryGeometry = ecoRoute?.geometry || tollRoute?.geometry || [];
    primaryGeometry.forEach((wp, idx) => {
      if (wp.type === "origin" || wp.type === "stop" || wp.type === "destination" || wp.title?.includes("Tractor")) {
        const isStartTruck = wp.title?.includes("Tractor");
        const pinColor = isStartTruck ? "#0284c7" : wp.type === "destination" ? "#dc2626" : "#8b5cf6";
        const label = isStartTruck ? "🚛" : wp.type === "origin" ? "P" : wp.type === "destination" ? "D" : `${wp.stopNumber || idx}`;

        const wpIcon = L.divIcon({
          html: `
            <div style="
              width: 30px;
              height: 30px;
              border-radius: 50%;
              background: ${pinColor};
              border: 3px solid #ffffff;
              box-shadow: 0 4px 14px rgba(0,0,0,0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-weight: 900;
              font-size: 11px;
            ">
              ${label}
            </div>
          `,
          className: "samsara-stop-pin",
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        L.marker([wp.lat, wp.lng], { icon: wpIcon })
          .bindPopup(`<strong>${wp.title}</strong>`)
          .addTo(routeLayer);
      }
    });

    // Fit map bounds smoothly
    if (allPointsToFit.length > 0) {
      map.fitBounds(L.latLngBounds(allPointsToFit), { padding: [60, 60] });
    }
  }, [routeOptimization, routeViewMode]);

  // Center on selected vehicle
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedVehicle) return;
    if (selectedVehicle.latitude && selectedVehicle.longitude) {
      mapInstanceRef.current.flyTo([selectedVehicle.latitude, selectedVehicle.longitude], 12, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [selectedVehicle]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 ${isFullscreen ? "fixed inset-4 z-50 h-[calc(100vh-2rem)]" : "h-[540px] sm:h-[600px]"}`}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Samsara Top Bar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-md border border-slate-200 px-3.5 py-2 rounded-xl shadow-md">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
        <span className="text-xs font-black text-slate-900 tracking-wide">
          Samsara Fleet Radar
        </span>
        <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-mono font-bold">
          {vehicles.length} Live Trucks
        </span>
      </div>

      {/* Interactive Dual-Route View Switcher (when Route Optimization is active) */}
      {routeOptimization?.routes && (
        <div className="absolute top-14 left-3 z-10 bg-white/95 backdrop-blur-md border border-indigo-200 p-2.5 rounded-2xl shadow-lg space-y-1.5 max-w-xs sm:max-w-sm">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 px-1">
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            <span>Interactive Route Comparison</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
            <button
              onClick={() => {
                setRouteViewMode("both");
                if (onSelectRouteKey) onSelectRouteKey("both");
              }}
              className={`py-1.5 px-2 rounded-lg cursor-pointer transition text-center ${
                routeViewMode === "both"
                  ? "bg-indigo-600 text-white shadow-xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Show Both
            </button>

            <button
              onClick={() => {
                setRouteViewMode("eco_route");
                if (onSelectRouteKey) onSelectRouteKey("eco_route");
              }}
              className={`py-1.5 px-2 rounded-lg cursor-pointer transition text-center flex items-center justify-center gap-1 ${
                routeViewMode === "eco_route"
                  ? "bg-emerald-600 text-white shadow-xs font-extrabold"
                  : "text-emerald-700 hover:bg-slate-100"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>AI Eco (${routeOptimization.routes?.eco_route?.total_trip_cost_usd})</span>
            </button>

            <button
              onClick={() => {
                setRouteViewMode("toll_route");
                if (onSelectRouteKey) onSelectRouteKey("toll_route");
              }}
              className={`py-1.5 px-2 rounded-lg cursor-pointer transition text-center flex items-center justify-center gap-1 ${
                routeViewMode === "toll_route"
                  ? "bg-amber-600 text-white shadow-xs font-extrabold"
                  : "text-amber-700 hover:bg-slate-100"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Tolls (${routeOptimization.routes?.toll_route?.total_trip_cost_usd})</span>
            </button>
          </div>
        </div>
      )}

      {/* Map Floating Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-slate-200 p-1.5 rounded-xl shadow-md">
        <button
          onClick={() => setActiveTileLayer((prev) => (prev === "samsara_light" ? "samsara_dark" : prev === "samsara_dark" ? "satellite" : "samsara_light"))}
          className="px-2 py-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition text-xs font-bold flex items-center gap-1.5"
        >
          <Layers className="w-3.5 h-3.5 text-sky-600" />
          <span className="text-[11px]">
            {activeTileLayer === "samsara_light" ? "Light Map" : activeTileLayer === "samsara_dark" ? "Dark Radar" : "Satellite"}
          </span>
        </button>

        <div className="h-4 w-[1px] bg-slate-200" />

        <button
          onClick={() => mapInstanceRef.current?.flyTo([45.0, -84.0], 5)}
          title="Reset to View"
          className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition"
        >
          <Navigation className="w-4 h-4 text-emerald-600" />
        </button>

        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom Floating Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md border border-slate-200 px-3.5 py-2 rounded-xl shadow-md flex items-center gap-3.5 text-xs text-slate-800 flex-wrap">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
          <span>Moving ({vehicles.filter((v) => v.status === "DRIVING").length})</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Idling ({vehicles.filter((v) => v.status === "IDLING").length})</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold">
          <span className="w-2.5 h-2.5 rounded bg-slate-300 border border-slate-400" />
          <span>Parked ({vehicles.filter((v) => v.status === "PARKED").length})</span>
        </div>
        {routeOptimization && (
          <>
            <div className="h-3.5 w-[1px] bg-slate-200" />
            <div className="flex items-center gap-1.5 font-bold text-emerald-700">
              <span className="w-4 h-1 rounded bg-emerald-500" />
              <span>AI Eco ($55 Tolls)</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-amber-700">
              <span className="w-4 h-1 rounded bg-amber-500" />
              <span>Toll Highway ($305 Tolls)</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

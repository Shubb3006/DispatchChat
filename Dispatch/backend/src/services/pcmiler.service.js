import axios from "axios";

/* ══════════════════════════════════════════════════════════════════════════
   Commercial truck routing — OpenRouteService `driving-hgv`

   Every distance, drive time, and road geometry returned here comes from a
   live routing call. Nothing is scaled, interpolated, or seeded.

   What is REAL:
     • Geocoding            — ORS Pelias (US/CA restricted), Nominatim fallback
     • Route geometry       — ORS driving-hgv with real vehicle restrictions
     • Distance / drive time— per route and per leg, straight from the provider
     • Route alternatives   — three SEPARATE routing calls (recommended /
                              shortest / avoid-tollways), never one route × a constant
     • Fuel burn            — real route miles ÷ caller's MPG × caller's diesel price
     • Border bridge tolls  — published commercial rates, flagged as a static table

   What is NOT available and is therefore reported as unknown rather than invented:
     • Highway toll amounts (407 ETR, Ohio/Indiana turnpikes, Skyway). ORS can
       ROUTE AROUND tollways but does not price them. `tollsAreComplete: false`
       says so; the UI must not present the toll figure as a full total.
     • Live tractor telemetry. Belongs to Samsara, not a routing provider.

   Configure ORS_API_KEY to get truck routing. Without it this degrades to the
   free OSRM demo server, which is a CAR profile with no truck restrictions —
   that case is labelled `isTruckProfile: false` and carries a warning so the UI
   can never imply truck-legal routing it didn't actually compute.
   ══════════════════════════════════════════════════════════════════════════ */

const ORS_KEY = process.env.ORS_API_KEY || process.env.OPENROUTESERVICE_API_KEY || "";

// ORS has announced it is moving api.openrouteservice.org -> api.heigit.org.
// The new host does not serve the v2 directions path yet (404 as of this
// writing), so the old host stays the default; set ORS_BASE_URL to switch
// hosts without a code change once the migration completes.
const ORS_BASE = process.env.ORS_BASE_URL || "https://api.openrouteservice.org";

const MI_PER_M = 0.000621371;
const LB_PER_TONNE = 2204.62;

/* Published commercial truck tolls at the major US/Canada crossings.
   Static reference data, not a live feed — surfaced with `source` so the UI
   can label it. Rates are per crossing for a loaded tractor-trailer. */
const BORDER_CROSSINGS = [
  { name: "Detroit Ambassador Bridge (CBP POE 3801)",   coords: [42.3256, -83.0746], state: "MI", toll2Axle: 42.5, toll3Axle: 58.0 },
  { name: "Port Huron Blue Water Bridge (CBP POE 3802)", coords: [42.9989, -82.4239], state: "MI", toll2Axle: 40.0, toll3Axle: 55.0 },
  { name: "Buffalo Peace Bridge (CBP POE 0901)",         coords: [42.9069, -78.9056], state: "NY", toll2Axle: 40.0, toll3Axle: 55.0 },
  { name: "Queenston-Lewiston Bridge (CBP POE 0902)",    coords: [43.1539, -79.0469], state: "NY", toll2Axle: 40.0, toll3Axle: 55.0 },
  { name: "Thousand Islands Bridge (CBP POE 0708)",      coords: [44.3486, -75.9839], state: "NY", toll2Axle: 36.0, toll3Axle: 48.0 },
  { name: "Champlain / Lacolle Border (CBP POE 0712)",   coords: [45.0094, -73.3519], state: "NY", toll2Axle: 0.0,  toll3Axle: 0.0 },
  { name: "Pacific Highway / Blaine (CBP POE 3004)",     coords: [49.0022, -122.7578], state: "WA", toll2Axle: 0.0, toll3Axle: 0.0 },
  { name: "Coutts / Sweet Grass Border (CBP POE 3310)",  coords: [49.0,    -111.96],   state: "MT", toll2Axle: 0.0, toll3Axle: 0.0 },
];

const GEOCODE_CACHE = new Map();

const haversineMiles = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const round = (n, p = 1) => parseFloat(Number(n).toFixed(p));

/* ───────────────────────── Geocoding ─────────────────────────
   Resolves to a real coordinate or throws. It must never fall back to a
   default city: a silently substituted origin produces a confident,
   completely wrong route, which is worse than a visible failure. */

export const geocodeAddress = async (query) => {
  if (!query || typeof query !== "string" || !query.trim()) {
    throw new Error("Address is required");
  }
  const clean = query.trim();
  const cacheKey = clean.toLowerCase();
  if (GEOCODE_CACHE.has(cacheKey)) return GEOCODE_CACHE.get(cacheKey);

  let result = null;

  /* Nominatim is queried FIRST because it is measurably better at the
     city-level lookups this system does. ORS Pelias returns a municipality
     polygon centroid, which for lakeshore towns lands in open water —
     "Leamington, ON" resolves 3.5 km offshore in Lake Erie, where the router
     then fails with "could not find routable point". Measured displacement
     after snapping to the road network:
         Leamington ON   Nominatim 3 m    vs  Pelias 3542 m
         Davenport  FL   Nominatim 2 m    vs  Pelias  133 m
         Fullerton  CA   Nominatim 23 m   vs  Pelias   38 m
         Brampton   ON   Nominatim 4 m    vs  Pelias    1 m  */
  try {
    const res = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: { q: clean, format: "json", limit: 1, addressdetails: 1, countrycodes: "us,ca" },
      headers: { "User-Agent": "NishanTransportTMS/1.0 (dispatch@nishantransport.com)" },
      timeout: 15000,
    });
    const item = res.data?.[0];
    if (item) {
      result = {
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        displayName: item.display_name,
        country: item.address?.country_code?.toUpperCase() === "CA" ? "CA" : "US",
        state: item.address?.state || item.address?.province || "",
        source: "NOMINATIM",
      };
    }
  } catch (err) {
    console.warn(`Nominatim geocode failed for "${clean}":`, err.message);
  }

  // Fallback: ORS Pelias, same country restriction.
  if (!result && ORS_KEY) {
    try {
      const res = await axios.get(`${ORS_BASE}/geocode/search`, {
        params: { api_key: ORS_KEY, text: clean, "boundary.country": "US,CA", size: 1 },
        timeout: 15000,
      });
      const f = res.data?.features?.[0];
      if (f) {
        const [lon, lat] = f.geometry.coordinates;
        result = {
          lat,
          lon,
          displayName: f.properties.label || clean,
          country: f.properties.country_a === "CAN" ? "CA" : "US",
          state: f.properties.region || "",
          source: "ORS_PELIAS",
        };
      }
    } catch (err) {
      console.warn(`ORS geocode failed for "${clean}":`, err.message);
    }
  }

  if (!result) {
    const e = new Error(`Could not resolve address to a location in the US or Canada: "${clean}"`);
    e.code = "GEOCODE_FAILED";
    e.address = clean;
    throw e;
  }

  GEOCODE_CACHE.set(cacheKey, result);
  return result;
};

/* ───────────────── Road-network snapping ─────────────────
   A geocoder returns where a PLACE is, which is not necessarily where a TRUCK
   can be: municipality centroids land in lakes, parks and fields, and the
   router then refuses the stop ("could not find routable point within 350
   metres"). Snapping moves each stop to the nearest point on the actual
   heavy-goods road network before routing.

   One batched call covers every stop on the trip, so this costs a single
   request against the Snap quota no matter how many stops there are. */
const SNAP_RADIUS_M = 5000;

const snapStopsToRoadNetwork = async (stops, warnings) => {
  if (!ORS_KEY || !stops.length) return stops;

  try {
    const res = await axios.post(
      `${ORS_BASE}/v2/snap/driving-hgv`,
      { locations: stops.map((s) => [s.lon, s.lat]), radius: SNAP_RADIUS_M },
      { headers: { Authorization: ORS_KEY, "Content-Type": "application/json" }, timeout: 20000 }
    );

    const snapped = res.data?.locations || [];
    return stops.map((stop, i) => {
      const hit = snapped[i];
      if (!hit?.location) {
        warnings.push(
          `${stop.shortName || stop.address}: no truck-accessible road within ${SNAP_RADIUS_M / 1000} km of the geocoded point.`
        );
        return stop;
      }
      const [lon, lat] = hit.location;
      const movedM = Math.round(hit.snapped_distance || 0);
      // A large shift means the geocode was poor; the stop is still routable,
      // but the dispatcher should know the point moved materially.
      if (movedM > 2000) {
        warnings.push(
          `${stop.shortName || stop.address}: geocoded point was ${(movedM / 1000).toFixed(1)} km from the nearest truck road and was snapped to it.`
        );
      }
      return { ...stop, lat, lon, coords: [lat, lon], snappedMeters: movedM };
    });
  } catch (err) {
    // Snapping is an accuracy improvement, not a requirement — if it fails the
    // original geocoded points are still routed.
    console.warn("Road snapping unavailable:", err.response?.data?.error?.message || err.message);
    return stops;
  }
};

/* ───────────────── Vehicle restrictions ─────────────────
   ORS expects metric. These are the dimensions the route is actually
   computed against, and they are echoed back so the UI can state them. */

const buildVehicleSpec = (is3Axle, grossWeightLbs) => {
  const weightLbs = Number(grossWeightLbs) || (is3Axle ? 105500 : 80000);
  const axles = is3Axle ? 6 : 5;
  return {
    weightLbs,
    axles,
    maxLegalWeightLbs: is3Axle ? 105500 : 80000,
    // metres / tonnes for the provider
    restrictions: {
      height: 4.15,                                   // 13'7" — standard NA dry van
      width: 2.6,                                     // 8'6"
      length: is3Axle ? 25.0 : 22.86,                 // tridem vs standard 75'
      weight: round(weightLbs / LB_PER_TONNE, 2),
      axleload: round(weightLbs / axles / LB_PER_TONNE, 2),
      hazmat: false,
    },
  };
};

/* ───────────────── Routing providers ─────────────────
   Each returns the same normalized shape: { miles, driveHours, geometry, legs } */

const PROFILE_OPTIONS = {
  PRACTICAL: { preference: "recommended", avoidTollways: false },
  SHORTEST: { preference: "shortest", avoidTollways: false },
  TOLL_DISCOURAGED: { preference: "recommended", avoidTollways: true },
};

const routeViaORS = async (stops, profile, vehicle) => {
  const opts = PROFILE_OPTIONS[profile] || PROFILE_OPTIONS.PRACTICAL;

  const body = {
    coordinates: stops.map((s) => [s.lon, s.lat]),
    preference: opts.preference,
    units: "mi",
    instructions: true,
    options: {
      vehicle_type: "hgv",
      profile_params: { restrictions: vehicle.restrictions },
      ...(opts.avoidTollways ? { avoid_features: ["tollways"] } : {}),
    },
  };

  const res = await axios.post(`${ORS_BASE}/v2/directions/driving-hgv/geojson`, body, {
    headers: { Authorization: ORS_KEY, "Content-Type": "application/json" },
    timeout: 20000,
  });

  const feature = res.data?.features?.[0];
  if (!feature) throw new Error("Routing provider returned no route");

  const summary = feature.properties.summary || {};
  const segments = feature.properties.segments || [];

  return {
    provider: "OPENROUTESERVICE_HGV",
    isTruckProfile: true,
    miles: round(summary.distance || 0),
    driveHours: round((summary.duration || 0) / 3600, 2),
    geometry: feature.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
    legs: segments.map((seg, i) => ({
      legNumber: i + 1,
      distanceMiles: round(seg.distance || 0),
      driveHours: round((seg.duration || 0) / 3600, 2),
      steps: (seg.steps || []).map((st) => ({
        instruction: st.instruction,
        roadName: st.name && st.name !== "-" ? st.name : null,
        distanceMiles: round(st.distance || 0, 2),
        driveMins: Math.round((st.duration || 0) / 60),
      })),
    })),
  };
};

// ORS caps a single request at ~6000 km of approximated route distance.
const ORS_TOO_LONG = /must not be greater than|exceed the server configuration limits/i;

/* A legitimate transcontinental consolidation can exceed that cap, so the trip
   is routed one leg at a time and the real results are summed. Every distance
   here is still a genuine routed distance — the request is split, not estimated. */
const routeViaORSChunked = async (stops, profile, vehicle) => {
  const chunks = [];
  for (let i = 0; i < stops.length - 1; i++) {
    // Sequential on purpose: the free tier allows 40 requests/minute and a
    // parallel burst on a long trip trips the rate limiter.
    chunks.push(await routeViaORS([stops[i], stops[i + 1]], profile, vehicle));
  }

  return {
    provider: "OPENROUTESERVICE_HGV",
    isTruckProfile: true,
    wasChunked: true,
    miles: round(chunks.reduce((a, c) => a + c.miles, 0)),
    driveHours: round(chunks.reduce((a, c) => a + c.driveHours, 0), 2),
    geometry: chunks.flatMap((c) => c.geometry),
    legs: chunks.map((c, i) => ({ ...c.legs[0], legNumber: i + 1 })),
  };
};

/* Free fallback: OSRM demo server. CAR profile — no truck restrictions.
   Only `PRACTICAL` and `SHORTEST` are meaningful here; the demo server
   rejects `exclude=toll`, so a toll-free variant genuinely cannot be
   produced and the caller is told so rather than handed a scaled number. */
const routeViaOSRM = async (stops, profile) => {
  if (profile === "TOLL_DISCOURAGED") {
    const e = new Error("Toll-free routing requires ORS_API_KEY — the free OSRM server cannot exclude tolls");
    e.code = "PROFILE_UNAVAILABLE";
    throw e;
  }

  const coords = stops.map((s) => `${s.lon},${s.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true&alternatives=${profile === "SHORTEST" ? "3" : "false"}`;
  const res = await axios.get(url, { timeout: 20000 });

  const routes = res.data?.routes || [];
  if (!routes.length) throw new Error("Routing provider returned no route");

  // "Shortest" = the genuinely shortest alternative OSRM offered, not a discount.
  const route = profile === "SHORTEST"
    ? routes.reduce((a, b) => (b.distance < a.distance ? b : a))
    : routes[0];

  return {
    provider: "OSRM_CAR_DEMO",
    isTruckProfile: false,
    miles: round(route.distance * MI_PER_M),
    driveHours: round(route.duration / 3600, 2),
    geometry: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
    legs: (route.legs || []).map((leg, i) => ({
      legNumber: i + 1,
      distanceMiles: round(leg.distance * MI_PER_M),
      driveHours: round(leg.duration / 3600, 2),
      steps: (leg.steps || [])
        .filter((s) => s.distance > 500)
        .map((st) => ({
          instruction: st.maneuver?.type ? `${st.maneuver.type} ${st.name || ""}`.trim() : st.name,
          roadName: st.name || (st.ref ? `Hwy ${st.ref}` : null),
          distanceMiles: round(st.distance * MI_PER_M, 2),
          driveMins: Math.round(st.duration / 60),
        })),
    })),
  };
};

const fetchRoute = async (stops, profile, vehicle, warnings) => {
  if (ORS_KEY) {
    try {
      return await routeViaORS(stops, profile, vehicle);
    } catch (err) {
      const detail = err.response?.data?.error?.message || err.message;

      // Trip longer than the provider's per-request cap: route it leg by leg
      // and sum the real results rather than giving up on a valid long haul.
      if (ORS_TOO_LONG.test(detail) && stops.length > 2) {
        try {
          const chunked = await routeViaORSChunked(stops, profile, vehicle);
          warnings.push(
            `${profile} route exceeded the provider's single-request distance limit, so it was routed leg by leg and summed.`
          );
          return chunked;
        } catch (chunkErr) {
          const d2 = chunkErr.response?.data?.error?.message || chunkErr.message;
          warnings.push(`No ${profile} truck route found: ${d2}`);
          return null;
        }
      }

      if (err.response?.status === 404 || /route/i.test(detail)) {
        warnings.push(`No ${profile} truck route found: ${detail}`);
        return null;
      }
      warnings.push(`Truck routing unavailable (${detail}) — fell back to car-profile estimate.`);
    }
  } else {
    warnings.push("ORS_API_KEY is not configured — using the free OSRM car profile. Distances ignore truck restrictions (bridge heights, weight limits, truck-legal roads).");
  }

  try {
    return await routeViaOSRM(stops, profile);
  } catch (err) {
    warnings.push(`${profile} route unavailable: ${err.message}`);
    return null;
  }
};

/* ───────────────── Border crossing ───────────────── */

/* Pick the crossing the route ACTUALLY passes, by measuring each candidate
   against the routed polyline. Choosing on origin→destination alone picks the
   wrong bridge whenever an intermediate stop moves the lane — a Toronto→
   Windsor→Chicago run crosses at Detroit, not Port Huron. */
const findBorderCrossing = (stops, geometry) => {
  const hasUS = stops.some((s) => s.country === "US");
  const hasCA = stops.some((s) => s.country === "CA");
  if (!hasUS || !hasCA) return null;

  // Sample the polyline; full resolution is thousands of points and adds nothing.
  const path = [];
  if (geometry?.length) {
    const step = Math.max(1, Math.floor(geometry.length / 400));
    for (let i = 0; i < geometry.length; i += step) path.push(geometry[i]);
    path.push(geometry[geometry.length - 1]);
  } else {
    stops.forEach((s) => path.push(s.coords));
  }

  let best = null;
  let bestDistance = Infinity;

  for (const poe of BORDER_CROSSINGS) {
    let nearest = Infinity;
    for (const [lat, lon] of path) {
      const d = haversineMiles(lat, lon, poe.coords[0], poe.coords[1]);
      if (d < nearest) nearest = d;
    }
    if (nearest < bestDistance) {
      bestDistance = nearest;
      best = poe;
    }
  }

  // If the closest official crossing is nowhere near the route, say nothing
  // rather than naming a bridge the truck never sees.
  return bestDistance <= 25 ? best : null;
};

/* ───────────────── Main entry ───────────────── */

export const calculatePcMilerRoute = async ({
  origin,
  destination,
  stops = [],
  routingProfile = "PRACTICAL",
  axleConfiguration = "2_AXLE_CROSS_BORDER",
  grossWeightLbs = 45000,
  dieselPricePerGal = 3.85,
  avgMpg = 6.5,
} = {}) => {
  if (!origin || !destination) {
    const e = new Error("Both an origin and a destination are required");
    e.code = "MISSING_STOPS";
    throw e;
  }

  const warnings = [];
  const is3Axle = axleConfiguration === "3_AXLE_CANADA_LOCAL";
  const vehicle = buildVehicleSpec(is3Axle, grossWeightLbs);

  // 1. Geocode every stop in sequence. Any failure aborts with the offending address.
  const rawStops = [
    { address: origin, type: "ORIGIN", label: "Origin / Departure Hub" },
    ...(stops || [])
      .map((s) => (typeof s === "string" ? { address: s } : s))
      .filter((s) => s?.address?.trim())
      .map((s, i) => ({
        address: s.address.trim(),
        type: s.type || "INTERMEDIATE_STOP",
        label: `Stop ${i + 1} (${s.type === "PICKUP" ? "Pickup" : s.type === "DELIVERY" ? "Drop" : "LTL Stop"})`,
      })),
    { address: destination, type: "DESTINATION", label: "Final Consignee Dock" },
  ];

  const geocoded = [];
  for (const [i, stop] of rawStops.entries()) {
    const geo = await geocodeAddress(stop.address);
    geocoded.push({
      ...stop,
      stopNumber: i + 1,
      lat: geo.lat,
      lon: geo.lon,
      coords: [geo.lat, geo.lon],
      displayName: geo.displayName,
      shortName: geo.displayName.split(",")[0],
      country: geo.country,
      state: geo.state,
      geocodeSource: geo.source,
    });
  }

  // 2. Move every stop onto the truck road network before routing, so a stop
  //    that geocoded into a lake or a field doesn't fail the whole trip.
  const routableStops = await snapStopsToRoadNetwork(geocoded, warnings);

  // 3. Route all three profiles — three independent provider calls.
  const [practical, shortest, tollFree] = await Promise.all([
    fetchRoute(routableStops, "PRACTICAL", vehicle, warnings),
    fetchRoute(routableStops, "SHORTEST", vehicle, warnings),
    fetchRoute(routableStops, "TOLL_DISCOURAGED", vehicle, warnings),
  ]);

  const byProfile = { PRACTICAL: practical, SHORTEST: shortest, TOLL_DISCOURAGED: tollFree };
  const selected = byProfile[routingProfile] || practical;

  if (!selected) {
    const e = new Error(
      `No route could be computed between "${origin}" and "${destination}". ${warnings.join(" ")}`
    );
    e.code = "NO_ROUTE";
    throw e;
  }

  // 3. Border crossing + published bridge toll (the only toll figure we can stand behind).
  const crossing = findBorderCrossing(routableStops, selected.geometry);
  const bridgeToll = crossing ? (is3Axle ? crossing.toll3Axle : crossing.toll2Axle) : 0;
  const appliesToll = routingProfile !== "TOLL_DISCOURAGED";

  const tollPlazas = crossing
    ? [{
        name: crossing.name,
        cost: appliesToll ? bridgeToll : 0,
        state: crossing.state,
        axleCategory: is3Axle ? "3-Axle Tridem / Class 6+" : "2-Axle Tractor / Class 5",
        source: "published_border_rate",
      }]
    : [];

  // 4. Fuel — real arithmetic on the real routed distance and the caller's own inputs.
  const effectiveMpg = is3Axle ? avgMpg * 0.92 : avgMpg;
  const fuelGallons = round(selected.miles / effectiveMpg);
  const fuelCost = round(fuelGallons * dieselPricePerGal, 2);

  // 5. Per-leg detail, joined to the stop names.
  const legs = selected.legs.map((leg, i) => ({
    ...leg,
    from: routableStops[i]?.shortName,
    to: routableStops[i + 1]?.shortName,
    fromLabel: routableStops[i]?.label,
    toLabel: routableStops[i + 1]?.label,
    fuelGallons: round(leg.distanceMiles / effectiveMpg),
  }));

  const roadPlan = [];
  let stepNo = 1;
  legs.forEach((leg) => {
    roadPlan.push({
      step: stepNo++,
      instruction: `[LEG ${leg.legNumber}] Depart ${leg.from} toward ${leg.to}.`,
      highway: `Leg ${leg.legNumber}`,
      distanceMiles: leg.distanceMiles,
      driveMins: Math.round(leg.driveHours * 60),
      isLegHeader: true,
    });
    leg.steps.forEach((st) => {
      roadPlan.push({
        step: stepNo++,
        instruction: st.instruction,
        highway: st.roadName || "Local road",
        distanceMiles: st.distanceMiles,
        driveMins: st.driveMins,
      });
    });
  });

  const summarize = (r) =>
    r ? { miles: r.miles, driveHours: r.driveHours, available: true } : { available: false };

  return {
    provider: selected.provider,
    isTruckProfile: selected.isTruckProfile,
    warnings: [...new Set(warnings)],

    origin: routableStops[0].displayName,
    destination: routableStops[routableStops.length - 1].displayName,
    stops: routableStops,
    intermediateStopsCount: Math.max(0, routableStops.length - 2),

    routingProfile,
    axleConfiguration,
    is3Axle,

    officialMiles: selected.miles,
    driveHours: selected.driveHours,
    waypoints: selected.geometry,
    legs,
    roadPlan,

    fuel: { gallons: fuelGallons, cost: fuelCost, mpgUsed: round(effectiveMpg, 2), dieselPricePerGal },

    totalTolls: appliesToll ? bridgeToll : 0,
    tollPlazas,
    // ORS routes around tollways but never prices them, so any highway toll
    // (407 ETR, Ohio/Indiana turnpikes, Skyway) is absent from this figure.
    tollsAreComplete: false,
    tollNote: crossing
      ? "Border bridge toll only — published rate. Highway tolls en route are not included."
      : "No border crossing on this lane. Highway tolls are not priced by the routing provider.",

    borderCrossing: crossing?.name || null,
    isCrossBorder: Boolean(crossing),

    restrictions: {
      routedAgainst: vehicle.restrictions,
      grossWeightLbs: vehicle.weightLbs,
      maxAllowedGrossWeight: vehicle.maxLegalWeightLbs,
      axleType: is3Axle
        ? "3-Axle Tractor / Tridem (Canada Domestic SPIF)"
        : "2-Axle Tractor (Cross-Border US/CAN)",
      isWeightCompliant: vehicle.weightLbs <= vehicle.maxLegalWeightLbs,
      enforcedByProvider: selected.isTruckProfile,
    },

    geofences: routableStops.map((s, i) => ({
      id: `GEO-STOP-${s.stopNumber}`,
      name: `${s.label}: ${s.shortName}`,
      type: s.type,
      coords: s.coords,
      radiusMeters: i === 0 ? 650 : i === routableStops.length - 1 ? 750 : 500,
      color: i === 0 ? "#0284c7" : i === routableStops.length - 1 ? "#059669" : "#d97706",
    })),

    // Three real routes, side by side. An unavailable variant says so.
    routeComparison: {
      practical: summarize(practical),
      shortest: summarize(shortest),
      tollFree: summarize(tollFree),
      milesSavedByShortest:
        practical && shortest ? round(practical.miles - shortest.miles) : null,
      extraMilesToAvoidTolls:
        practical && tollFree ? round(tollFree.miles - practical.miles) : null,
      // The provider treats the international toll bridges as tollways, so on a
      // cross-border lane "avoid tolls" routes around the crossing itself and the
      // detour explodes. The number is real, but it is not a usable dispatch
      // option — say so instead of letting it read as a viable alternative.
      tollFreeIsImpractical:
        practical && tollFree ? tollFree.miles > practical.miles * 1.25 : null,
      tollFreeNote:
        practical && tollFree && tollFree.miles > practical.miles * 1.25
          ? crossing
            ? "Avoiding tollways also avoids the international toll bridge, forcing a long detour. Not a practical option on this lane."
            : "Avoiding tollways forces a substantial detour on this lane."
          : null,
    },

    // Routing providers don't report tractor telemetry — Samsara owns that.
    liveTractor: null,

    calculatedAt: new Date().toISOString(),
  };
};

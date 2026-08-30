import axios from "axios";
import pool from "../config/db.js";
import { getVehicleLocations } from "./samsara.service.js";

/**
 * Predictive ETA & Weather Radar — LIVE data feeds only.
 *
 * Sources:
 *  - US-bound border waits:  US CBP Border Wait Times JSON feed (bwt.cbp.gov/api/bwtnew)
 *  - Canada-bound waits:     CBSA publishes no verified machine-readable feed -> reported as unavailable
 *  - US corridor weather:    NOAA National Weather Service alerts API (api.weather.gov, no key,
 *                            requires a User-Agent header)
 *  - Supplemental conditions: OpenWeather current conditions (only when OPENWEATHER_API_KEY is set)
 *  - Canadian corridor alerts: no verified machine-readable Environment Canada point-alert feed
 *                            configured -> reported as unavailable (never fabricated)
 *
 * Every external feed is cached in-memory with a 5-10 minute TTL and every panel
 * degrades to { available: false, reason } when its feed is down.
 */

// ------------------------------------------------------------------
// Config (all overridable via env)
// ------------------------------------------------------------------
const CBP_BWT_URL = process.env.CBP_BWT_URL || "https://bwt.cbp.gov/api/bwtnew";
const NWS_API_BASE = process.env.NWS_API_BASE || "https://api.weather.gov";
const NWS_USER_AGENT =
  process.env.NWS_USER_AGENT || "OzackTMS/1.0 (nick_city@nishantransport.com)";
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "";
const OPENWEATHER_BASE_URL =
  process.env.OPENWEATHER_BASE_URL || "https://api.openweathermap.org/data/2.5/weather";
const FEED_TIMEOUT_MS = Number(process.env.ETA_RADAR_FEED_TIMEOUT_MS) || 12000;
const DEFAULT_HIGHWAY_SPEED_MPH = Number(process.env.DEFAULT_HIGHWAY_SPEED_MPH) || 55;

// Feed cache TTL: default 7 minutes, clamped to the 5-10 minute band.
const rawTtl = Number(process.env.ETA_RADAR_CACHE_TTL_MS);
const CACHE_TTL_MS = Math.min(
  10 * 60 * 1000,
  Math.max(5 * 60 * 1000, Number.isFinite(rawTtl) && rawTtl > 0 ? rawTtl : 7 * 60 * 1000)
);
const FAILURE_TTL_MS = 60 * 1000; // brief negative-cache so a dead feed isn't hammered

// ------------------------------------------------------------------
// Tiny in-memory TTL cache
// ------------------------------------------------------------------
const feedCache = new Map();

const cacheGet = (key) => {
  const hit = feedCache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  if (hit) feedCache.delete(key);
  return null;
};

const cacheSet = (key, value, ttlMs = CACHE_TTL_MS) => {
  feedCache.set(key, { value, expiresAt: Date.now() + ttlMs });
};

// ------------------------------------------------------------------
// Small helpers
// ------------------------------------------------------------------
const toIntOrNull = (v) => {
  if (v === null || v === undefined) return null;
  const n = parseInt(String(v).replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};

const toNumOrNull = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const parseDateMs = (v) => {
  if (!v) return null;
  const ms = new Date(v).getTime();
  return Number.isFinite(ms) ? ms : null;
};

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

const titleCase = (s) =>
  String(s || "")
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

// ==================================================================
// A) BORDER WAIT TIMES
// ==================================================================

/**
 * Crossings this carrier cares about (Ontario/NY/MI lanes + the ones the
 * radar already monitored). Static metadata only — wait numbers are live.
 */
const MONITORED_CROSSINGS = [
  {
    key: "ambassador",
    label: "Detroit Ambassador Bridge",
    portMatch: "detroit",
    crossingMatch: "ambassador",
    jurisdiction: "US CBP / CBSA (Detroit, MI / Windsor, ON)",
    highwayCorridor: "I-75 / Highway 401",
  },
  {
    key: "bluewater",
    label: "Port Huron Blue Water Bridge",
    portMatch: "port huron",
    crossingMatch: null,
    jurisdiction: "US CBP / CBSA (Port Huron, MI / Point Edward, ON)",
    highwayCorridor: "I-94 / I-69 / Highway 402",
  },
  {
    key: "peace",
    label: "Buffalo Peace Bridge",
    portMatch: "buffalo",
    crossingMatch: "peace",
    jurisdiction: "US CBP / CBSA (Buffalo, NY / Fort Erie, ON)",
    highwayCorridor: "I-190 / Queen Elizabeth Way (QEW)",
  },
  {
    key: "queenston",
    label: "Queenston-Lewiston Bridge",
    portMatch: "buffalo",
    crossingMatch: "lewiston",
    jurisdiction: "US CBP / CBSA (Lewiston, NY / Queenston, ON)",
    highwayCorridor: "I-190 / Highway 405",
  },
  {
    key: "rainbow",
    label: "Niagara Falls Rainbow Bridge",
    portMatch: "buffalo",
    crossingMatch: "rainbow",
    jurisdiction: "US CBP / CBSA (Niagara Falls, NY / Niagara Falls, ON)",
    highwayCorridor: "I-190 / Highway 420",
  },
  {
    key: "thousand_islands",
    label: "Thousand Islands Bridge",
    portMatch: "alexandria bay",
    crossingMatch: null,
    jurisdiction: "US CBP / CBSA (Alexandria Bay, NY / Lansdowne, ON)",
    highwayCorridor: "I-81 / Highway 401",
  },
  {
    key: "cornwall",
    label: "Cornwall (Massena) Seaway International Bridge",
    portMatch: "massena",
    crossingMatch: null,
    jurisdiction: "US CBP / CBSA (Massena, NY / Cornwall, ON)",
    highwayCorridor: "NY-37 / Highway 401",
  },
  {
    key: "champlain",
    label: "Champlain - St. Bernard de Lacolle",
    portMatch: "champlain",
    crossingMatch: null,
    jurisdiction: "US CBP / CBSA (Champlain, NY / Lacolle, QC)",
    highwayCorridor: "Interstate 87 / Autoroute 15",
  },
  {
    key: "blaine",
    label: "Blaine Pacific Highway",
    portMatch: "blaine",
    crossingMatch: "pacific",
    jurisdiction: "US CBP / CBSA (Blaine, WA / Surrey, BC)",
    highwayCorridor: "Interstate 5 / Highway 99",
  },
  {
    key: "pembina",
    label: "Pembina / Emerson",
    portMatch: "pembina",
    crossingMatch: null,
    jurisdiction: "US CBP / CBSA (Pembina, ND / Emerson, MB)",
    highwayCorridor: "Interstate 29 / Highway 75",
  },
];

const deriveDelayStatus = (waitMinutes, operationalStatus) => {
  const op = String(operationalStatus || "").toLowerCase();
  if (op.includes("closed")) return "CLOSED";
  if (waitMinutes === null) return "UNKNOWN";
  if (waitMinutes <= 20) return "NORMAL";
  if (waitMinutes <= 45) return "MODERATE";
  return "SEVERE";
};

const mapCbpEntryToPort = (target, entry, fetchedAt) => {
  const cv = entry.commercial_vehicle_lanes || {};
  const std = cv.standard_lanes || {};
  const fast = cv.FAST_lanes || cv.fast_lanes || {};
  const waitMinutes = toIntOrNull(std.delay_minutes);

  return {
    crossingKey: target.key,
    portCode: String(entry.port_number || ""),
    portName: target.label,
    cbpPortName: String(entry.port_name || ""),
    cbpCrossingName: String(entry.crossing_name || ""),
    jurisdiction: target.jurisdiction,
    highwayCorridor: target.highwayCorridor,
    direction: "US_BOUND",
    portStatus: entry.port_status || null,
    hours: entry.hours || null,
    currentWaitMinutes: waitMinutes,
    delayStatus: deriveDelayStatus(waitMinutes, std.operational_status),
    operationalStatus: std.operational_status || null,
    commercialLanesOpen: toIntOrNull(std.lanes_open),
    maxCommercialLanes: toIntOrNull(cv.maximum_lanes),
    fastLanesOpen: toIntOrNull(fast.lanes_open),
    fastLaneWaitMinutes: toIntOrNull(fast.delay_minutes),
    updateTime: std.update_time || null,
    constructionNotice: entry.construction_notice || null,
    source: "US CBP Border Wait Times (bwt.cbp.gov)",
    fetched_at: fetchedAt,
    lastUpdated: fetchedAt,
  };
};

/**
 * US-bound (into the USA) commercial waits from the official CBP feed.
 */
export const getUsBoundBorderWaits = async () => {
  const cached = cacheGet("cbp_bwt");
  if (cached) return cached;

  const source = "US CBP Border Wait Times (bwt.cbp.gov)";
  try {
    const res = await axios.get(CBP_BWT_URL, {
      timeout: FEED_TIMEOUT_MS,
      headers: { Accept: "application/json" },
    });
    const rows = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.ports)
      ? res.data.ports
      : null;
    if (!rows) throw new Error("Unexpected CBP BWT payload shape");

    const canadianBorder = rows.filter((r) =>
      String(r.border || "").toLowerCase().includes("canadian")
    );

    const fetchedAt = new Date().toISOString();
    const ports = [];
    for (const target of MONITORED_CROSSINGS) {
      const portRows = canadianBorder.filter((r) =>
        String(r.port_name || "").toLowerCase().includes(target.portMatch)
      );
      let entry = null;
      if (target.crossingMatch) {
        entry = portRows.find((r) =>
          String(r.crossing_name || "").toLowerCase().includes(target.crossingMatch)
        );
      }
      if (!entry) entry = portRows[0] || null;
      if (entry) ports.push(mapCbpEntryToPort(target, entry, fetchedAt));
    }

    if (ports.length === 0) throw new Error("No monitored crossings found in CBP feed");

    const result = { available: true, source, fetched_at: fetchedAt, ports };
    cacheSet("cbp_bwt", result);
    return result;
  } catch (err) {
    console.warn("CBP border wait feed error:", err.message);
    const failure = {
      available: false,
      reason: `CBP border wait feed unavailable: ${err.message}`,
      source,
      fetched_at: new Date().toISOString(),
      ports: [],
    };
    cacheSet("cbp_bwt", failure, FAILURE_TTL_MS);
    return failure;
  }
};

/**
 * Canada-bound (into Canada) waits. CBSA only publishes an HTML page
 * (cbsa-asfc.gc.ca/bwt-taf) — no verified public machine-readable feed —
 * so this direction is honestly reported as unavailable rather than estimated.
 */
export const getCanadaBoundBorderWaits = () => ({
  available: false,
  reason:
    "CBSA publishes border wait times only as an HTML page (cbsa-asfc.gc.ca/bwt-taf); no verified public machine-readable feed exists, so Canada-bound waits are not shown rather than estimated.",
  source: "CBSA Border Wait Times (no machine-readable feed)",
  fetched_at: new Date().toISOString(),
  ports: [],
});

/**
 * Combined border wait payload for the /border-wait-times endpoint.
 */
export const getBorderWaitTimesLive = async () => {
  const usBound = await getUsBoundBorderWaits();
  const canadaBound = getCanadaBoundBorderWaits();
  return { usBound, canadaBound };
};

// ==================================================================
// B) CORRIDOR WEATHER (NWS alerts + optional OpenWeather conditions)
// ==================================================================

const CORRIDOR_DEFINITIONS = [
  {
    id: "CORR-I75",
    corridorName: "I-75 Southbound Freight Corridor",
    routeSpan: "Detroit, MI -> Cincinnati, OH -> Atlanta, GA -> Davenport, FL",
    mileage: 1180,
    waypoints: [
      { name: "Detroit, MI", lat: 42.3314, lon: -83.0458, country: "US" },
      { name: "Cincinnati, OH", lat: 39.1031, lon: -84.512, country: "US" },
      { name: "Atlanta, GA", lat: 33.749, lon: -84.388, country: "US" },
      { name: "Davenport, FL", lat: 28.1614, lon: -81.6023, country: "US" },
    ],
  },
  {
    id: "CORR-ON401",
    corridorName: "Highway 401 / 402 Golden Horseshoe Corridor",
    routeSpan: "Windsor, ON -> London, ON -> Toronto, ON -> Montreal, QC",
    mileage: 550,
    waypoints: [
      { name: "Windsor, ON", lat: 42.3149, lon: -83.0364, country: "CA" },
      { name: "London, ON", lat: 42.9849, lon: -81.2453, country: "CA" },
      { name: "Toronto, ON", lat: 43.6532, lon: -79.3832, country: "CA" },
      { name: "Montreal, QC", lat: 45.5019, lon: -73.5674, country: "CA" },
    ],
  },
  {
    id: "CORR-I90",
    corridorName: "I-90 / I-87 Empire Corridor",
    routeSpan: "Buffalo, NY -> Syracuse, NY -> Albany, NY -> Newark, NJ",
    mileage: 410,
    waypoints: [
      { name: "Buffalo, NY", lat: 42.8864, lon: -78.8784, country: "US" },
      { name: "Syracuse, NY", lat: 43.0481, lon: -76.1474, country: "US" },
      { name: "Albany, NY", lat: 42.6526, lon: -73.7562, country: "US" },
      { name: "Newark, NJ", lat: 40.7357, lon: -74.1724, country: "US" },
    ],
  },
  {
    id: "CORR-I80",
    corridorName: "I-80 / I-94 Midwest Cross-Country",
    routeSpan: "Toledo, OH -> Chicago, IL -> Des Moines, IA",
    mileage: 490,
    waypoints: [
      { name: "Toledo, OH", lat: 41.6528, lon: -83.5379, country: "US" },
      { name: "Chicago, IL", lat: 41.8781, lon: -87.6298, country: "US" },
      { name: "Des Moines, IA", lat: 41.5868, lon: -93.625, country: "US" },
    ],
  },
  {
    id: "CORR-I5",
    corridorName: "I-5 Pacific Northwest Corridor",
    routeSpan: "Blaine, WA -> Seattle, WA -> Portland, OR",
    mileage: 890,
    waypoints: [
      { name: "Blaine, WA", lat: 48.9937, lon: -122.7381, country: "US" },
      { name: "Seattle, WA", lat: 47.6062, lon: -122.3321, country: "US" },
      { name: "Portland, OR", lat: 45.5152, lon: -122.6784, country: "US" },
    ],
  },
];

const mapNwsSeverity = (props) => {
  const event = String(props.event || "");
  if (/warning/i.test(event)) return "WARNING";
  if (/watch/i.test(event)) return "WATCH";
  const sev = String(props.severity || "");
  if (sev === "Extreme" || sev === "Severe") return "WARNING";
  return "ADVISORY";
};

/**
 * Active NWS alerts for one point (cached per rounded coordinate).
 * Returns { ok, alerts } or { ok: false, error }.
 */
const fetchNwsAlertsForPoint = async (lat, lon) => {
  const key = `nws_${lat.toFixed(2)}_${lon.toFixed(2)}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  try {
    const res = await axios.get(`${NWS_API_BASE}/alerts/active`, {
      params: { point: `${lat.toFixed(4)},${lon.toFixed(4)}` },
      headers: { "User-Agent": NWS_USER_AGENT, Accept: "application/geo+json" },
      timeout: FEED_TIMEOUT_MS,
    });
    const features = Array.isArray(res.data?.features) ? res.data.features : [];
    const alerts = features.map((f) => {
      const p = f.properties || {};
      return {
        id: p.id || f.id || null,
        severity: mapNwsSeverity(p),
        nwsSeverity: p.severity || null,
        title: p.event || "Weather Alert",
        description: p.headline || String(p.description || "").slice(0, 280),
        areas: p.areaDesc || null,
        onset: p.onset || p.effective || null,
        ends: p.ends || p.expires || null,
        source: "NWS",
      };
    });
    const value = { ok: true, alerts };
    cacheSet(key, value);
    return value;
  } catch (err) {
    const value = { ok: false, error: err.message, alerts: [] };
    cacheSet(key, value, FAILURE_TTL_MS);
    return value;
  }
};

/**
 * Optional supplemental current conditions from OpenWeather (only if key set).
 */
const fetchCurrentConditions = async (lat, lon) => {
  if (!OPENWEATHER_API_KEY) {
    return {
      available: false,
      reason: "OPENWEATHER_API_KEY not configured",
      source: "OpenWeather",
    };
  }
  const key = `ow_${lat.toFixed(2)}_${lon.toFixed(2)}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  try {
    const res = await axios.get(OPENWEATHER_BASE_URL, {
      params: { lat, lon, appid: OPENWEATHER_API_KEY, units: "imperial" },
      timeout: FEED_TIMEOUT_MS,
    });
    const d = res.data || {};
    const value = {
      available: true,
      source: "OpenWeather",
      fetched_at: new Date().toISOString(),
      condition: titleCase(d.weather?.[0]?.description || d.weather?.[0]?.main || ""),
      tempF: toNumOrNull(d.main?.temp) !== null ? Math.round(d.main.temp) : null,
      humidityPct: toNumOrNull(d.main?.humidity),
      windMph: toNumOrNull(d.wind?.speed) !== null ? Math.round(d.wind.speed) : null,
      windGustMph: toNumOrNull(d.wind?.gust) !== null ? Math.round(d.wind.gust) : null,
      visibilityMiles:
        toNumOrNull(d.visibility) !== null
          ? Math.round((d.visibility / 1609.34) * 10) / 10
          : null,
    };
    cacheSet(key, value);
    return value;
  } catch (err) {
    console.warn("OpenWeather conditions error:", err.message);
    const value = {
      available: false,
      reason: `OpenWeather request failed: ${err.message}`,
      source: "OpenWeather",
      fetched_at: new Date().toISOString(),
    };
    cacheSet(key, value, FAILURE_TTL_MS);
    return value;
  }
};

const SEVERITY_ORDER = { WARNING: 0, WATCH: 1, ADVISORY: 2 };

/**
 * Model a speed penalty from LIVE alert/condition data (documented model,
 * never a fabricated observation).
 */
const modelSpeedDegradationPct = (alerts, conditions) => {
  let pct = 0;
  for (const a of alerts) {
    const rank = a.severity === "WARNING" ? 10 : a.severity === "WATCH" ? 6 : 4;
    pct = Math.max(pct, rank);
  }
  if (alerts.some((a) => /blizzard|ice storm|hurricane|tornado|winter storm/i.test(a.title))) {
    pct = Math.max(pct, 20);
  }
  if (conditions?.available) {
    if ((conditions.windGustMph || 0) >= 40) pct += 5;
    if (conditions.visibilityMiles !== null && conditions.visibilityMiles < 3) pct += 5;
  }
  return Math.min(25, pct);
};

const buildLiveWeatherCorridor = async (def) => {
  const usPoints = def.waypoints.filter((w) => w.country === "US");
  const caPoints = def.waypoints.filter((w) => w.country === "CA");

  // --- NWS active alerts (US points only) ---
  let alerts = [];
  let alertsFeed;
  if (usPoints.length === 0) {
    alertsFeed = {
      available: false,
      reason:
        "Corridor is inside Canada; NWS covers US territory only and no verified machine-readable Environment Canada point-alert feed is configured.",
      source: "NOAA NWS (api.weather.gov)",
      fetched_at: new Date().toISOString(),
    };
  } else {
    const results = await Promise.all(
      usPoints.map((w) => fetchNwsAlertsForPoint(w.lat, w.lon))
    );
    const succeeded = results.filter((r) => r.ok).length;
    const seen = new Set();
    for (const r of results) {
      for (const a of r.alerts) {
        const dedupeKey = a.id || `${a.title}|${a.areas}`;
        if (!seen.has(dedupeKey)) {
          seen.add(dedupeKey);
          alerts.push(a);
        }
      }
    }
    alerts.sort(
      (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
    );
    alertsFeed = {
      available: succeeded > 0,
      source: "NOAA NWS (api.weather.gov)",
      fetched_at: new Date().toISOString(),
      pointsQueried: usPoints.length,
      pointsFailed: usPoints.length - succeeded,
      ...(succeeded === 0
        ? { reason: `NWS alert feed unreachable: ${results[0]?.error || "unknown error"}` }
        : {}),
    };
  }

  // --- Supplemental current conditions at corridor midpoint (optional) ---
  const mid = def.waypoints[Math.floor(def.waypoints.length / 2)];
  const conditions = await fetchCurrentConditions(mid.lat, mid.lon);

  const speedDegradationPct = modelSpeedDegradationPct(alerts, conditions);

  const weatherCondition = conditions.available
    ? conditions.condition || "Conditions reported"
    : alertsFeed.available
    ? alerts.length > 0
      ? `${alerts.length} active NWS alert${alerts.length > 1 ? "s" : ""}`
      : "No active NWS alerts"
    : "Live weather feed unavailable";

  const advisory =
    alerts.length > 0
      ? `${alerts.length} active advisory${alerts.length > 1 ? "ies" : ""} along corridor — top: ${alerts[0].title}. Review alerts before dispatch.`
      : alertsFeed.available
      ? "No active National Weather Service advisories along this corridor."
      : alertsFeed.reason || "Live advisory feed unavailable for this corridor.";

  const gust = conditions.available ? conditions.windGustMph : null;
  const windRiskLevel =
    gust === null ? "UNKNOWN" : gust >= 45 ? "CRITICAL_GALE" : gust >= 30 ? "MODERATE" : "LOW";

  return {
    id: def.id,
    corridorName: def.corridorName,
    routeSpan: def.routeSpan,
    mileage: def.mileage,
    waypoints: def.waypoints.map((w) => ({ name: w.name, country: w.country })),
    weatherCondition,
    // Ambient temperature comes from OpenWeather when configured; no feed
    // provides road-surface temperature, so it is honestly null.
    surfaceTempF: null,
    ambientTempF: conditions.available ? conditions.tempF : null,
    windSpeedMph: conditions.available ? conditions.windMph : null,
    windGustMph: gust,
    windRiskLevel,
    visibilityMiles: conditions.available ? conditions.visibilityMiles : null,
    precipitationPct: null, // not provided by any configured live feed
    humidityPct: conditions.available ? conditions.humidityPct : null,
    roadCondition: null, // no live road-surface feed configured
    severeAlerts: alerts,
    speedDegradationPct,
    speedDegradationBasis: "MODELED_FROM_LIVE_ALERTS_AND_CONDITIONS",
    advisory,
    alertsFeed,
    conditionsFeed: conditions,
    ...(caPoints.length > 0 && usPoints.length > 0
      ? {
          canadianSegment: {
            available: false,
            reason:
              "Canadian segment alerts unavailable: no verified machine-readable Environment Canada point-alert feed configured.",
          },
        }
      : {}),
    fetched_at: new Date().toISOString(),
  };
};

export const getWeatherCorridorsLive = async () => {
  const cached = cacheGet("weather_corridors");
  if (cached) return cached;
  const corridors = await Promise.all(CORRIDOR_DEFINITIONS.map(buildLiveWeatherCorridor));
  cacheSet("weather_corridors", corridors);
  return corridors;
};

// ==================================================================
// Corridor / border-port matching for a shipment lane
// ==================================================================

const getMatchingCorridor = (corridors, origin = "", destination = "") => {
  const text = `${origin} ${destination}`.toUpperCase();
  const byId = (id) => corridors.find((c) => c.id === id) || null;
  if (
    text.includes("FL") ||
    text.includes("FLORIDA") ||
    text.includes("DAVENPORT") ||
    text.includes("ATLANTA") ||
    text.includes("GA") ||
    text.includes("CINCINNATI")
  ) {
    return byId("CORR-I75");
  }
  if (
    text.includes("NY") ||
    text.includes("NEW YORK") ||
    text.includes("NEWARK") ||
    text.includes("NJ") ||
    text.includes("BUFFALO") ||
    text.includes("ALBANY")
  ) {
    return byId("CORR-I90");
  }
  if (
    text.includes("CHICAGO") ||
    text.includes("IL") ||
    text.includes("INDIANA") ||
    text.includes("OHIO")
  ) {
    return byId("CORR-I80");
  }
  if (
    text.includes("WA") ||
    text.includes("SEATTLE") ||
    text.includes("BC") ||
    text.includes("PORTLAND")
  ) {
    return byId("CORR-I5");
  }
  return byId("CORR-ON401");
};

const getMatchingBorderPort = (ports, origin = "", destination = "") => {
  if (!Array.isArray(ports) || ports.length === 0) return null;
  const text = `${origin} ${destination}`.toUpperCase();
  const byKey = (key) => ports.find((p) => p.crossingKey === key) || null;
  if (text.includes("CORNWALL") || text.includes("MASSENA")) return byKey("cornwall");
  if (text.includes("KINGSTON") || text.includes("THOUSAND")) return byKey("thousand_islands");
  if (text.includes("NIAGARA")) return byKey("rainbow");
  if (text.includes("NY") || text.includes("NJ") || text.includes("BUFFALO"))
    return byKey("peace");
  if (text.includes("WA") || text.includes("BC") || text.includes("VANCOUVER"))
    return byKey("blaine");
  if (text.includes("QC") || text.includes("MONTREAL") || text.includes("CHAMPLAIN"))
    return byKey("champlain");
  if (text.includes("MB") || text.includes("WINNIPEG")) return byKey("pembina");
  if (text.includes("SARNIA") || text.includes("PORT HURON")) return byKey("bluewater");
  return byKey("ambassador") || ports[0] || null;
};

// ==================================================================
// Dynamic ETA calculation (live inputs, honest fallbacks)
// ==================================================================

const extractLiveSpeedMph = (v) => {
  if (!v) return null;
  const mph = toNumOrNull(v.speed_mph);
  if (mph !== null) return mph;
  const kmh = toNumOrNull(v.speed);
  if (kmh !== null) return kmh * 0.621371;
  return null;
};

/**
 * Predictive dynamic ETA for one shipment.
 * - Speed: live Samsara GPS when the truck is matched, otherwise a labeled
 *   assumed fleet-average speed (DEFAULT_HIGHWAY_SPEED_MPH).
 * - Progress: interpolated from pickup/delivery schedule (labeled), never a
 *   random simulation.
 * - Border wait: live CBP commercial-lane wait when the feed is up.
 * - Weather penalty: modeled from live NWS alerts / conditions.
 */
export const calculateDynamicShipmentEta = (
  shipment,
  liveSamsaraVehicle = null,
  corridors = [],
  borderPorts = []
) => {
  const nowMs = Date.now();
  const matchedCorridor = getMatchingCorridor(corridors, shipment.origin, shipment.destination);
  const matchedPort = getMatchingBorderPort(borderPorts, shipment.origin, shipment.destination);

  // --- Live telematics ---
  const liveSpeedMph = extractLiveSpeedMph(liveSamsaraVehicle);
  const speedSource = liveSpeedMph !== null ? "SAMSARA_LIVE" : "ASSUMED_AVERAGE";
  const currentSpeedMph = liveSpeedMph !== null ? liveSpeedMph : DEFAULT_HIGHWAY_SPEED_MPH;
  const liveLocation =
    liveSamsaraVehicle?.location?.formatted_address ||
    (liveSamsaraVehicle?.location?.latitude != null &&
    liveSamsaraVehicle?.location?.longitude != null
      ? `${Number(liveSamsaraVehicle.location.latitude).toFixed(3)}, ${Number(
          liveSamsaraVehicle.location.longitude
        ).toFixed(3)}`
      : null);
  const liveDriver = String(
    shipment.driver_name || liveSamsaraVehicle?.driver?.name || ""
  );
  const liveTractor = String(
    shipment.truck_number || liveSamsaraVehicle?.truck_number || ""
  );

  // --- Route progress: schedule interpolation (honest, labeled) ---
  const pickupMs = parseDateMs(shipment.pickup_date);
  const deliveryMs = parseDateMs(shipment.delivery_date);
  let progressPct = 0;
  let progressBasis = "UNKNOWN";
  if (pickupMs && deliveryMs && deliveryMs > pickupMs) {
    progressPct = clamp((nowMs - pickupMs) / (deliveryMs - pickupMs), 0, 0.98);
    progressBasis = "SCHEDULE_INTERPOLATION";
  }

  // --- Weather penalty from live corridor model ---
  const degradationPct = matchedCorridor?.speedDegradationPct || 0;
  const weatherSlowdownFactor = (100 - degradationPct) / 100;
  const effectiveSpeedMph = Math.max(35, Math.round(currentSpeedMph * weatherSlowdownFactor));

  // --- Border wait (live CBP, only when the feed is up) ---
  const borderWaitAvailable =
    matchedPort !== null && matchedPort.currentWaitMinutes !== null;
  const borderCrossed = progressBasis === "SCHEDULE_INTERPOLATION" && progressPct > 0.4;
  const borderDelayMins = borderWaitAvailable && !borderCrossed ? matchedPort.currentWaitMinutes : 0;

  // --- Mileage / ETA model ---
  const totalMiles = toNumOrNull(
    shipment.total_miles ?? shipment.miles ?? shipment.loaded_miles
  );
  let remainingMiles = null;
  let completedMiles = null;
  let rawDriveMinutes = null;
  let hosRestBreakMins = 0;
  let totalRemainingMinutes = null;
  let dynamicEtaMs = null;
  let etaBasis = "INSUFFICIENT_DATA";

  if (totalMiles !== null && totalMiles > 0) {
    remainingMiles = Math.max(0, Math.round(totalMiles * (1 - progressPct)));
    completedMiles = Math.round(totalMiles - remainingMiles);
    const rawDriveHours = remainingMiles / effectiveSpeedMph;
    rawDriveMinutes = Math.round(rawDriveHours * 60);
    hosRestBreakMins = rawDriveHours > 4.5 ? 30 : 0;
    totalRemainingMinutes = rawDriveMinutes + hosRestBreakMins + borderDelayMins;
    dynamicEtaMs = nowMs + totalRemainingMinutes * 60 * 1000;
    etaBasis = "MILEAGE_SPEED_MODEL";
  } else if (deliveryMs) {
    totalRemainingMinutes = Math.max(0, Math.round((deliveryMs - nowMs) / 60000));
    dynamicEtaMs = Math.max(nowMs, deliveryMs);
    etaBasis = "SCHEDULED_DELIVERY_ONLY";
  }

  const scheduledDelivery = deliveryMs ? new Date(deliveryMs).toISOString() : null;
  const diffMinutes =
    dynamicEtaMs !== null && deliveryMs
      ? Math.round((dynamicEtaMs - deliveryMs) / 60000)
      : null;

  // --- Status & confidence ---
  let onTimeStatus = "ON_TIME";
  let statusBadge = "ON SCHEDULE";
  if (diffMinutes === null) {
    onTimeStatus = "UNKNOWN";
    statusBadge = "INSUFFICIENT DATA";
  } else if (diffMinutes > 60) {
    onTimeStatus = "CRITICAL_DELAY";
    statusBadge = "CRITICAL DELAY RISK";
  } else if (diffMinutes > 15) {
    onTimeStatus = "POTENTIAL_DELAY";
    statusBadge = "POTENTIAL DELAY";
  }

  let confidencePct = 90;
  if (speedSource === "ASSUMED_AVERAGE") confidencePct -= 10;
  if (progressBasis !== "SCHEDULE_INTERPOLATION") confidencePct -= 15;
  if (!borderWaitAvailable) confidencePct -= 5;
  if (!matchedCorridor?.alertsFeed?.available) confidencePct -= 5;
  if (etaBasis === "SCHEDULED_DELIVERY_ONLY") confidencePct -= 10;
  if (etaBasis === "INSUFFICIENT_DATA") confidencePct = 30;
  confidencePct = clamp(confidencePct, 20, 98);

  const isApproachingGeofence = remainingMiles !== null && remainingMiles <= 30;

  // --- Milestones ---
  const departed = pickupMs !== null && nowMs >= pickupMs;
  const milestones = [
    {
      name: `Departed Origin: ${shipment.shipper_name || shipment.origin || "Origin"}`,
      status: departed ? "COMPLETED" : "PENDING",
      time: pickupMs ? new Date(pickupMs).toISOString() : null,
      location: shipment.origin || "",
    },
    {
      name: `Cross-Border Clearance: ${matchedPort ? matchedPort.portName : "Border feed unavailable"}`,
      status: borderCrossed ? "COMPLETED" : "PENDING",
      waitRecorded: borderWaitAvailable ? `${matchedPort.currentWaitMinutes} mins` : null,
      location: matchedPort ? matchedPort.jurisdiction : "",
    },
    {
      name: `Corridor Transit: ${matchedCorridor ? matchedCorridor.corridorName : "Corridor feed unavailable"}`,
      status: departed ? "ACTIVE" : "PENDING",
      weather: matchedCorridor
        ? `${matchedCorridor.weatherCondition}${
            matchedCorridor.ambientTempF !== null ? ` (${matchedCorridor.ambientTempF}°F)` : ""
          }`
        : null,
      speed: `${effectiveSpeedMph} MPH${speedSource === "ASSUMED_AVERAGE" ? " (assumed avg)" : ""}`,
      location: liveLocation || shipment.origin || "",
    },
    {
      name: `Final Delivery Geofence: ${shipment.consignee_name || shipment.destination || "Destination"}`,
      status: "PENDING",
      eta: dynamicEtaMs ? new Date(dynamicEtaMs).toISOString() : null,
      distanceRemaining: remainingMiles !== null ? `${remainingMiles} miles` : null,
      location: shipment.destination || "",
    },
  ];

  return {
    shipmentId: shipment.id,
    loadNumber: String(shipment.load_number || shipment.id || ""),
    customerName: String(shipment.customer_name || ""),
    origin: String(shipment.origin || ""),
    destination: String(shipment.destination || ""),
    driverName: liveDriver,
    truckNumber: liveTractor,
    liveSpeedMph: Math.round(currentSpeedMph),
    speedSource,
    effectiveSpeedMph,
    liveLocation,
    totalMiles,
    completedMiles,
    remainingMiles,
    progressPct: Math.round(progressPct * 100),
    progressBasis,
    corridor: matchedCorridor,
    borderPort: matchedPort,
    borderWaitAvailable,
    borderWaitMinutes: borderWaitAvailable ? matchedPort.currentWaitMinutes : null,
    weatherPenaltyMinutes:
      rawDriveMinutes !== null ? Math.round(rawDriveMinutes * (1 - weatherSlowdownFactor)) : null,
    hosRestBreakMinutes: hosRestBreakMins,
    totalRemainingMinutes,
    dynamicEta: dynamicEtaMs ? new Date(dynamicEtaMs).toISOString() : null,
    etaBasis,
    scheduledDelivery,
    diffMinutes,
    onTimeStatus,
    statusBadge,
    confidencePct,
    isApproachingGeofence,
    geofenceAlert: isApproachingGeofence
      ? `Truck ${liveTractor || "(unassigned)"} is ${remainingMiles} miles out from destination geofence`
      : null,
    milestones,
    calculatedAt: new Date().toISOString(),
  };
};

// ==================================================================
// Radar overview
// ==================================================================

export const getPredictiveRadarOverview = async () => {
  // Fetch each feed independently — one failed feed never sinks the endpoint.
  const [usBoundBorder, weatherCorridors] = await Promise.all([
    getUsBoundBorderWaits().catch((e) => {
      console.warn("Border feed in radar overview:", e.message);
      return {
        available: false,
        reason: e.message,
        source: "US CBP Border Wait Times (bwt.cbp.gov)",
        fetched_at: new Date().toISOString(),
        ports: [],
      };
    }),
    getWeatherCorridorsLive().catch((e) => {
      console.warn("Weather corridors in radar overview:", e.message);
      return [];
    }),
  ]);
  const canadaBoundBorder = getCanadaBoundBorderWaits();

  // Live Samsara vehicles (already cached inside samsara.service)
  let liveVehicles = [];
  let samsaraAvailable = false;
  try {
    const samsaraData = await getVehicleLocations();
    liveVehicles = samsaraData?.vehicles || [];
    samsaraAvailable = liveVehicles.length > 0;
  } catch (e) {
    console.warn("Samsara live fetch in radar:", e.message);
  }

  // Active loads from database — no fabricated fallback loads.
  let activeLoads = [];
  let loadsAvailable = true;
  try {
    const loadsRes = await pool.query(
      `SELECT l.*, t.truck_number AS truck_number
         FROM loads l
         LEFT JOIN trucks t ON t.id = l.truck_id
        ORDER BY l.created_at DESC
        LIMIT 50;`
    );
    activeLoads = loadsRes.rows || [];
  } catch (e) {
    console.warn("Loads query in radar:", e.message);
    loadsAvailable = false;
  }

  const matchLiveVehicle = (load) => {
    const truckNo = String(load.truck_number || "").trim().toLowerCase();
    if (!truckNo) return null;
    return (
      liveVehicles.find((v) => {
        const candidates = [v.truck_number, v.name, v.vehicle_name]
          .map((x) => String(x || "").trim().toLowerCase())
          .filter(Boolean);
        return candidates.some(
          (c) => c === truckNo || c.endsWith(truckNo) || truckNo.endsWith(c)
        );
      }) || null
    );
  };

  const trackedShipments = activeLoads.map((load) =>
    calculateDynamicShipmentEta(load, matchLiveVehicle(load), weatherCorridors, usBoundBorder.ports)
  );

  const severeAlertsCount = weatherCorridors.reduce(
    (acc, c) => acc + (c.severeAlerts?.length || 0),
    0
  );

  const portsWithWaits = usBoundBorder.ports.filter((p) => p.currentWaitMinutes !== null);
  const avgBorderWaitMins =
    portsWithWaits.length > 0
      ? Math.round(
          portsWithWaits.reduce((acc, p) => acc + p.currentWaitMinutes, 0) /
            portsWithWaits.length
        )
      : null;

  const onTimeShipments = trackedShipments.filter((s) => s.onTimeStatus === "ON_TIME").length;
  const delayedShipments = trackedShipments.filter(
    (s) => s.onTimeStatus === "POTENTIAL_DELAY" || s.onTimeStatus === "CRITICAL_DELAY"
  ).length;

  return {
    success: true,
    timestamp: new Date().toISOString(),
    summary: {
      totalTrackedShipments: trackedShipments.length,
      onTimeCount: onTimeShipments,
      delayedCount: delayedShipments,
      onTimeFleetPct:
        trackedShipments.length > 0
          ? Math.round((onTimeShipments / trackedShipments.length) * 100)
          : null,
      activeCorridorsMonitored: weatherCorridors.length,
      severeWeatherAlertsCount: severeAlertsCount,
      borderCrossingsMonitored: usBoundBorder.ports.length,
      averageBorderWaitMinutes: avgBorderWaitMins,
      liveSamsaraConnectedTractors: liveVehicles.length,
    },
    trackedShipments,
    borderPorts: usBoundBorder.ports,
    weatherCorridors,
    feeds: {
      usBorderWaits: {
        available: usBoundBorder.available,
        source: usBoundBorder.source,
        fetched_at: usBoundBorder.fetched_at,
        ...(usBoundBorder.reason ? { reason: usBoundBorder.reason } : {}),
      },
      canadaBorderWaits: {
        available: canadaBoundBorder.available,
        source: canadaBoundBorder.source,
        reason: canadaBoundBorder.reason,
      },
      weatherAlerts: {
        source: "NOAA NWS (api.weather.gov)",
        available: weatherCorridors.some((c) => c.alertsFeed?.available),
      },
      supplementalConditions: {
        source: "OpenWeather",
        available: weatherCorridors.some((c) => c.conditionsFeed?.available),
        ...(OPENWEATHER_API_KEY ? {} : { reason: "OPENWEATHER_API_KEY not configured" }),
      },
      telematics: { source: "Samsara", available: samsaraAvailable },
      loadsDatabase: { available: loadsAvailable },
    },
  };
};

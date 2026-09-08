/**
 * Real Corridor Weather from Open-Meteo (free, no API key)
 * API: https://api.open-meteo.com/v1/forecast
 * In-memory cache: 10 minutes per corridor
 */

import { geocodeLocation } from "./geocoding.service.js";
import pool from "../config/db.js";

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const weatherCache = new Map();

/**
 * Weather codes mapping (WMO Weather interpretation)
 * https://open-meteo.com/en/docs
 */
const WMO_CODES = {
  0: { description: "Clear Sky", risk: "LOW" },
  1: { description: "Mainly Clear", risk: "LOW" },
  2: { description: "Partly Cloudy", risk: "LOW" },
  3: { description: "Overcast", risk: "LOW" },
  45: { description: "Foggy", risk: "MODERATE" },
  48: { description: "Depositing Rime Fog", risk: "MODERATE" },
  51: { description: "Light Drizzle", risk: "LOW" },
  53: { description: "Moderate Drizzle", risk: "LOW" },
  55: { description: "Dense Drizzle", risk: "MODERATE" },
  61: { description: "Slight Rain", risk: "MODERATE" },
  63: { description: "Moderate Rain", risk: "MODERATE" },
  65: { description: "Heavy Rain", risk: "CRITICAL_HYDROPLANE" },
  71: { description: "Slight Snow", risk: "CRITICAL_TRACTION" },
  73: { description: "Moderate Snow", risk: "CRITICAL_TRACTION" },
  75: { description: "Heavy Snow", risk: "CRITICAL_TRACTION" },
  77: { description: "Snow Grains", risk: "CRITICAL_TRACTION" },
  80: { description: "Slight Rain Showers", risk: "MODERATE" },
  81: { description: "Moderate Rain Showers", risk: "MODERATE" },
  82: { description: "Violent Rain Showers", risk: "CRITICAL_HYDROPLANE" },
  85: { description: "Slight Snow Showers", risk: "CRITICAL_TRACTION" },
  86: { description: "Heavy Snow Showers", risk: "CRITICAL_TRACTION" },
  95: { description: "Thunderstorm", risk: "CRITICAL_GALE" },
  96: { description: "Thunderstorm with Hail", risk: "CRITICAL_GALE" },
  99: { description: "Thunderstorm with Hail", risk: "CRITICAL_GALE" },
};

/**
 * Get road surface risk based on weather code + temperature
 */
function getRoadSurfaceRisk(weatherCode, tempF, precipPercent, windGustMph) {
  const weatherInfo = WMO_CODES[weatherCode] || { description: "Unknown", risk: "LOW" };
  let risk = weatherInfo.risk;

  // Freezing rain / black ice: precipitation + freezing temp
  if (tempF <= 32 && (weatherCode === 51 || weatherCode === 53 || weatherCode === 61 || weatherCode === 63)) {
    risk = "CRITICAL_ICE";
  }

  // High wind overlay
  if (windGustMph >= 50) {
    if (risk === "LOW") risk = "MODERATE";
    else if (risk === "MODERATE") risk = "CRITICAL_GALE";
  }

  return risk;
}

/**
 * Derive road condition string
 */
function getRoadCondition(weatherCode, tempF, precipPercent, windGustMph) {
  const risk = getRoadSurfaceRisk(weatherCode, tempF, precipPercent, windGustMph);

  if (risk === "CRITICAL_ICE") return "ICY / BLACK ICE RISK";
  if (risk === "CRITICAL_HYDROPLANE") return "PUDDLING / HYDROPLANE RISK";
  if (risk === "CRITICAL_TRACTION") return "SNOW / POOR TRACTION";
  if (risk === "CRITICAL_GALE") return "HIGH WIND / GALE CONDITIONS";
  if (risk === "MODERATE") return "WET / REDUCED TRACTION";
  return "OPTIMAL / DRY";
}

/**
 * Fetch weather for a single location (lat/lng)
 */
async function fetchWeatherForLocation(latitude, longitude, cacheKey) {
  // Check cache first
  if (weatherCache.has(cacheKey)) {
    const cached = weatherCache.get(cacheKey);
    if (Date.now() < cached.expiresAt) {
      return cached.data;
    }
  }

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.append("latitude", latitude);
    url.searchParams.append("longitude", longitude);
    url.searchParams.append("current", "temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation,weather_code,visibility");
    url.searchParams.append("temperature_unit", "fahrenheit");
    url.searchParams.append("wind_speed_unit", "mph");
    url.searchParams.append("timezone", "auto");

    const res = await fetch(url.toString(), { timeout: 8000 });
    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP ${res.status}`);
    }

    const data = await res.json();
    const current = data.current || {};

    const weather = {
      latitude,
      longitude,
      temperature_2m: current.temperature_2m || 65,
      wind_speed_10m: current.wind_speed_10m || 0,
      wind_gusts_10m: current.wind_gusts_10m || 0,
      precipitation: current.precipitation || 0,
      weather_code: current.weather_code || 0,
      visibility: current.visibility || 10,
      timestamp: new Date().toISOString(),
    };

    // Cache for 10 minutes
    weatherCache.set(cacheKey, {
      data: weather,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return weather;
  } catch (error) {
    console.warn(`[WEATHER] Fetch failed for ${latitude},${longitude}: ${error.message}`);
    // Return a neutral fallback
    return {
      latitude,
      longitude,
      temperature_2m: 65,
      wind_speed_10m: 10,
      wind_gusts_10m: 15,
      precipitation: 0,
      weather_code: 0,
      visibility: 10,
      timestamp: new Date().toISOString(),
      unavailable: true,
    };
  }
}

/**
 * Get corridor weather by looking up load_stops for that corridor route
 * Returns weather data matching the corridor's lat/lng span
 */
async function getCorridorWeatherBridge(corridorId, minLat, maxLat, minLng, maxLng) {
  // Use midpoint of corridor
  const midLat = (minLat + maxLat) / 2;
  const midLng = (minLng + maxLng) / 2;
  const cacheKey = `corridor_${corridorId}_${midLat.toFixed(2)}_${midLng.toFixed(2)}`;

  return fetchWeatherForLocation(midLat, midLng, cacheKey);
}

/**
 * Build real weather corridors by querying active loads and their routes
 */
export async function getRealWeatherCorridors() {
  try {
    // Fetch active loads with their stops to infer corridor routes
    const result = await pool.query(
      `SELECT DISTINCT
         l.id, l.origin, l.destination, l.total_miles,
         ls.address as stop_address, ls.city as stop_city, ls.state as stop_state
       FROM loads l
       LEFT JOIN load_stops ls ON l.id = ls.load_id
       WHERE l.status IN ('ACTIVE', 'IN_TRANSIT', 'PENDING')
       ORDER BY l.created_at DESC
       LIMIT 50;`
    );

    const loads = result.rows || [];

    // Build corridor weather data from loads
    const corridors = [];

    // If no loads, use preset corridors with current weather
    if (loads.length === 0) {
      const presetCorridors = [
        { id: "CORR-I75", origin: "Detroit, MI", destination: "Atlanta, GA", lat: 37.5, lng: -84.3 },
        { id: "CORR-ON401", origin: "Windsor, ON", destination: "Montreal, QC", lat: 45.5, lng: -73.5 },
        { id: "CORR-I90", origin: "Buffalo, NY", destination: "Newark, NJ", lat: 42.5, lng: -74.0 },
        { id: "CORR-I80", origin: "Detroit, MI", destination: "Des Moines, IA", lat: 41.5, lng: -93.0 },
        { id: "CORR-I5", origin: "Blaine, WA", destination: "Sacramento, CA", lat: 39.5, lng: -120.0 },
      ];

      for (const preset of presetCorridors) {
        const weather = await fetchWeatherForLocation(preset.lat, preset.lng, preset.id);

        const tempF = Math.round(weather.temperature_2m);
        const surfaceTempF = Math.max(freezePoint(tempF), tempF - 3);
        const windSpeedMph = Math.round(weather.wind_speed_10m);
        const windGustMph = Math.round(weather.wind_gusts_10m);
        const precipPct = Math.round(weather.precipitation * 10);
        const visibilityMiles = Math.round(weather.visibility / 1609.34) || 10;
        const weatherCode = weather.weather_code || 0;
        const weatherInfo = WMO_CODES[weatherCode] || { description: "Clear" };

        const roadSurfaceRisk = getRoadSurfaceRisk(weatherCode, surfaceTempF, precipPct, windGustMph);
        const roadCondition = getRoadCondition(weatherCode, surfaceTempF, precipPct, windGustMph);

        // Speed degradation based on conditions
        let speedDegradation = 0;
        if (roadSurfaceRisk === "CRITICAL_TRACTION" || roadSurfaceRisk === "CRITICAL_ICE") speedDegradation = 15;
        else if (roadSurfaceRisk === "CRITICAL_HYDROPLANE") speedDegradation = 12;
        else if (roadSurfaceRisk === "CRITICAL_GALE") speedDegradation = 10;
        else if (roadSurfaceRisk === "MODERATE") speedDegradation = 5;

        // Build severe alerts
        const severeAlerts = [];
        if (windGustMph >= 40) {
          severeAlerts.push({
            severity: "WARNING",
            title: `High Wind Advisory (${windGustMph} MPH Gusts)`,
            description: `Strong crosswinds reported. High-profile vehicles should exercise caution.`,
          });
        }
        if (roadSurfaceRisk === "CRITICAL_ICE") {
          severeAlerts.push({
            severity: "WARNING",
            title: "Black Ice / Icing Advisory",
            description: "Freezing precipitation with temps below 32F. Reduced visibility and traction risk.",
          });
        }
        if (roadSurfaceRisk === "CRITICAL_HYDROPLANE") {
          severeAlerts.push({
            severity: "WARNING",
            title: "Heavy Rainfall & Hydroplane Alert",
            description: "Active precipitation with standing water. Slow down on bridges and merges.",
          });
        }

        corridors.push({
          id: preset.id,
          corridorName: `${preset.origin} ➔ ${preset.destination}`,
          routeSpan: `${preset.origin} ➔ ${preset.destination}`,
          mileage: 1200,
          weatherCondition: weatherInfo.description,
          surfaceTempF,
          ambientTempF: tempF,
          windSpeedMph,
          windGustMph,
          windRiskLevel: windGustMph >= 40 ? "CRITICAL_GALE" : windGustMph >= 25 ? "MODERATE" : "LOW",
          visibilityMiles,
          precipitationPct: precipPct,
          roadCondition,
          severeAlerts,
          speedDegradationPct: speedDegradation,
          advisory: `${weatherInfo.description}. Check road conditions before departure.`,
        });
      }

      return corridors;
    }

    // Build corridors from actual loads
    for (const load of loads.slice(0, 5)) {
      const originGeo = await geocodeLocation(load.origin || "Montreal");
      const destGeo = await geocodeLocation(load.destination || "Davenport");

      const weather = await fetchWeatherForLocation(
        (originGeo.lat + destGeo.lat) / 2,
        (originGeo.lng + destGeo.lng) / 2,
        `load_${load.id}`
      );

      const tempF = Math.round(weather.temperature_2m);
      const surfaceTempF = Math.max(freezePoint(tempF), tempF - 3);
      const windSpeedMph = Math.round(weather.wind_speed_10m);
      const windGustMph = Math.round(weather.wind_gusts_10m);
      const precipPct = Math.round(weather.precipitation * 10);
      const visibilityMiles = Math.round(weather.visibility / 1609.34) || 10;
      const weatherCode = weather.weather_code || 0;
      const weatherInfo = WMO_CODES[weatherCode] || { description: "Clear" };

      const roadSurfaceRisk = getRoadSurfaceRisk(weatherCode, surfaceTempF, precipPct, windGustMph);
      const roadCondition = getRoadCondition(weatherCode, surfaceTempF, precipPct, windGustMph);

      let speedDegradation = 0;
      if (roadSurfaceRisk === "CRITICAL_TRACTION" || roadSurfaceRisk === "CRITICAL_ICE") speedDegradation = 15;
      else if (roadSurfaceRisk === "CRITICAL_HYDROPLANE") speedDegradation = 12;
      else if (roadSurfaceRisk === "CRITICAL_GALE") speedDegradation = 10;
      else if (roadSurfaceRisk === "MODERATE") speedDegradation = 5;

      const severeAlerts = [];
      if (windGustMph >= 40) {
        severeAlerts.push({
          severity: "WARNING",
          title: `High Wind Advisory (${windGustMph} MPH Gusts)`,
          description: "Strong crosswinds. Reduce speed, especially for empty trailers.",
        });
      }
      if (roadSurfaceRisk === "CRITICAL_ICE") {
        severeAlerts.push({
          severity: "WARNING",
          title: "Black Ice / Icing Advisory",
          description: "Freezing precipitation detected. Use extra caution on bridge decks.",
        });
      }
      if (roadSurfaceRisk === "CRITICAL_HYDROPLANE") {
        severeAlerts.push({
          severity: "WARNING",
          title: "Heavy Rainfall & Hydroplane Alert",
          description: "Active precipitation with reduced visibility. Maintain increased following distance.",
        });
      }

      corridors.push({
        id: `CORR-LOAD-${load.id.slice(-6)}`,
        corridorName: `Active Route: ${load.origin} to ${load.destination}`,
        routeSpan: `${load.origin} ➔ ${load.destination}`,
        mileage: load.total_miles || 1200,
        weatherCondition: weatherInfo.description,
        surfaceTempF,
        ambientTempF: tempF,
        windSpeedMph,
        windGustMph,
        windRiskLevel: windGustMph >= 40 ? "CRITICAL_GALE" : windGustMph >= 25 ? "MODERATE" : "LOW",
        visibilityMiles,
        precipitationPct: precipPct,
        roadCondition,
        severeAlerts,
        speedDegradationPct: speedDegradation,
        advisory: `${weatherInfo.description}. ${
          weather.unavailable ? "Real-time data unavailable; check NOAA." : "Road conditions good."
        }`,
      });
    }

    return corridors;
  } catch (error) {
    console.error("[WEATHER] getRealWeatherCorridors error:", error);
    throw error;
  }
}

/**
 * Ensure temperature is at least freezing point
 */
function freezePoint(tempF) {
  return Math.max(32, tempF);
}

import {
  getPredictiveRadarOverview,
  BORDER_CROSSING_PORTS,
  HIGHWAY_WEATHER_CORRIDORS,
} from "../services/predictiveEtaWeather.service.js";
import { fetchRealBorderWaitTimes } from "../services/borderWait.service.js";
import { getRealWeatherCorridors } from "../services/corridorWeather.service.js";

// GET /api/v1/eta-radar/overview
export const getRadarOverview = async (req, res) => {
  try {
    const data = await getPredictiveRadarOverview();
    res.json(data);
  } catch (error) {
    console.error("getRadarOverview error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/eta-radar/border-wait-times
export const getBorderWaitTimes = async (req, res) => {
  try {
    // Fetch REAL border wait times from CBP API
    let ports = [];
    try {
      ports = await fetchRealBorderWaitTimes();
    } catch (e) {
      console.warn("Real border wait failed, using fallback:", e.message);
      ports = BORDER_CROSSING_PORTS;
    }

    const avg = ports.length > 0
      ? Math.round(
          ports.reduce((acc, p) => acc + p.currentWaitMinutes, 0) / ports.length
        )
      : 0;

    res.json({
      success: true,
      portsCount: ports.length,
      averageWaitMinutes: avg,
      ports,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("getBorderWaitTimes error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/eta-radar/weather-corridors
export const getWeatherCorridors = async (req, res) => {
  try {
    // Fetch REAL weather corridors from Open-Meteo
    let corridors = [];
    try {
      corridors = await getRealWeatherCorridors();
    } catch (e) {
      console.warn("Real weather failed, using fallback:", e.message);
      corridors = HIGHWAY_WEATHER_CORRIDORS;
    }

    const totalAlerts = corridors.reduce(
      (acc, c) => acc + (c.severeAlerts?.length || 0),
      0
    );
    res.json({
      success: true,
      corridorsCount: corridors.length,
      totalSevereAlerts: totalAlerts,
      corridors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("getWeatherCorridors error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/eta-radar/simulate-recalculation
export const recalculateRadar = async (req, res) => {
  try {
    const data = await getPredictiveRadarOverview();
    res.json({
      success: true,
      message: "Predictive ETA & Weather Radar recalculated with real CBP + Open-Meteo data",
      data,
    });
  } catch (error) {
    console.error("recalculateRadar error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

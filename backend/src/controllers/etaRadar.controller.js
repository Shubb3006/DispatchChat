import {
  getPredictiveRadarOverview,
  BORDER_CROSSING_PORTS,
  HIGHWAY_WEATHER_CORRIDORS,
} from "../services/predictiveEtaWeather.service.js";

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
export const getBorderWaitTimes = (req, res) => {
  try {
    const avg = Math.round(
      BORDER_CROSSING_PORTS.reduce((acc, p) => acc + p.currentWaitMinutes, 0) /
        BORDER_CROSSING_PORTS.length
    );
    res.json({
      success: true,
      portsCount: BORDER_CROSSING_PORTS.length,
      averageWaitMinutes: avg,
      ports: BORDER_CROSSING_PORTS,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("getBorderWaitTimes error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/eta-radar/weather-corridors
export const getWeatherCorridors = (req, res) => {
  try {
    const totalAlerts = HIGHWAY_WEATHER_CORRIDORS.reduce(
      (acc, c) => acc + (c.severeAlerts?.length || 0),
      0
    );
    res.json({
      success: true,
      corridorsCount: HIGHWAY_WEATHER_CORRIDORS.length,
      totalSevereAlerts: totalAlerts,
      corridors: HIGHWAY_WEATHER_CORRIDORS,
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
      message: "Predictive ETA & Weather Radar recalculated across active fleet",
      data,
    });
  } catch (error) {
    console.error("recalculateRadar error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

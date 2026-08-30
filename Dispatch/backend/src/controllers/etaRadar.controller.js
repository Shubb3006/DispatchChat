import {
  getPredictiveRadarOverview,
  getBorderWaitTimesLive,
  getWeatherCorridorsLive,
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
export const getBorderWaitTimes = async (req, res) => {
  try {
    const { usBound, canadaBound } = await getBorderWaitTimesLive();

    const portsWithWaits = usBound.ports.filter((p) => p.currentWaitMinutes !== null);
    const avg =
      portsWithWaits.length > 0
        ? Math.round(
            portsWithWaits.reduce((acc, p) => acc + p.currentWaitMinutes, 0) /
              portsWithWaits.length
          )
        : null;

    res.json({
      success: true,
      available: usBound.available,
      ...(usBound.reason ? { reason: usBound.reason } : {}),
      source: usBound.source,
      fetched_at: usBound.fetched_at,
      portsCount: usBound.ports.length,
      averageWaitMinutes: avg,
      ports: usBound.ports,
      canadaBound,
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
    const corridors = await getWeatherCorridorsLive();
    const totalAlerts = corridors.reduce(
      (acc, c) => acc + (c.severeAlerts?.length || 0),
      0
    );
    res.json({
      success: true,
      corridorsCount: corridors.length,
      totalSevereAlerts: totalAlerts,
      alertsSource: "NOAA NWS (api.weather.gov)",
      corridors,
      fetched_at: corridors[0]?.fetched_at || new Date().toISOString(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("getWeatherCorridors error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/eta-radar/recalculate
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

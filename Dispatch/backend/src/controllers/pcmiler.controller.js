import { calculatePcMilerRoute } from "../services/pcmiler.service.js";

// POST Calculate PC*MILER Commercial Route
export const calculateRoute = async (req, res) => {
  try {
    const routeResult = await calculatePcMilerRoute(req.body);
    res.json({
      success: true,
      route: routeResult,
    });
  } catch (error) {
    console.error("Error calculating PC*MILER route:", error);
    res.status(500).json({ success: false, message: "Error calculating route", error: error.message });
  }
};

// POST Compare Toll vs Toll-Free Route Economics
export const compareTolls = async (req, res) => {
  try {
    const [practical, tollFree, shortest] = await Promise.all([
      calculatePcMilerRoute({ ...req.body, routingProfile: "PRACTICAL" }),
      calculatePcMilerRoute({ ...req.body, routingProfile: "TOLL_DISCOURAGED" }),
      calculatePcMilerRoute({ ...req.body, routingProfile: "SHORTEST" }),
    ]);

    res.json({
      success: true,
      comparison: {
        practical,
        tollFree,
        shortest,
        economics: practical.economicsComparison,
      },
    });
  } catch (error) {
    console.error("Error comparing tolls:", error);
    res.status(500).json({ success: false, message: "Error comparing tolls", error: error.message });
  }
};

// GET IFTA & Jurisdiction Matrix
export const getJurisdictionMatrix = async (req, res) => {
  try {
    const rates = [
      { code: "ON", name: "Ontario", taxRatePerLitre: 0.143, currency: "CAD" },
      { code: "QC", name: "Quebec", taxRatePerLitre: 0.192, currency: "CAD" },
      { code: "MI", name: "Michigan", taxRatePerGallon: 0.440, currency: "USD" },
      { code: "OH", name: "Ohio", taxRatePerGallon: 0.385, currency: "USD" },
      { code: "IN", name: "Indiana", taxRatePerGallon: 0.540, currency: "USD" },
      { code: "IL", name: "Illinois", taxRatePerGallon: 0.670, currency: "USD" },
      { code: "NY", name: "New York", taxRatePerGallon: 0.485, currency: "USD" },
      { code: "PA", name: "Pennsylvania", taxRatePerGallon: 0.785, currency: "USD" },
    ];

    res.json({
      success: true,
      jurisdictions: rates,
      quarter: "Q3 2026",
      officialSource: "IFTA Inc. / International Fuel Tax Association",
    });
  } catch (error) {
    console.error("Error getting jurisdiction matrix:", error);
    res.status(500).json({ success: false, message: "Error getting matrix", error: error.message });
  }
};

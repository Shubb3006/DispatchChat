import { calculatePcMilerRoute } from "../services/pcmiler.service.js";

// A bad address or an unroutable lane is the caller's problem to fix, not a
// server fault — map those to 4xx so the UI can name the offending stop.
const CLIENT_ERRORS = {
  GEOCODE_FAILED: 422,
  MISSING_STOPS: 400,
  NO_ROUTE: 422,
  PROFILE_UNAVAILABLE: 422,
};

const sendRouteError = (res, error, context) => {
  const status = CLIENT_ERRORS[error.code];
  if (status) {
    return res.status(status).json({
      success: false,
      code: error.code,
      message: error.message,
      address: error.address,
    });
  }
  console.error(`${context}:`, error);
  return res.status(500).json({ success: false, message: context, error: error.message });
};

// POST Calculate commercial truck route.
// The result already carries all three routed variants in `routeComparison`,
// so a single call is enough to render the comparison cards.
export const calculateRoute = async (req, res) => {
  try {
    const route = await calculatePcMilerRoute(req.body);
    res.json({ success: true, route });
  } catch (error) {
    sendRouteError(res, error, "Error calculating route");
  }
};

// POST Compare the routed profiles side by side.
// Kept for API compatibility. It no longer routes three times over: one call
// geocodes once and returns every variant, which also keeps the provider's
// free-tier request budget intact.
export const compareTolls = async (req, res) => {
  try {
    const route = await calculatePcMilerRoute({ ...req.body, routingProfile: "PRACTICAL" });
    res.json({
      success: true,
      comparison: {
        ...route.routeComparison,
        provider: route.provider,
        isTruckProfile: route.isTruckProfile,
        tollsAreComplete: route.tollsAreComplete,
        tollNote: route.tollNote,
        warnings: route.warnings,
      },
    });
  } catch (error) {
    sendRouteError(res, error, "Error comparing routes");
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

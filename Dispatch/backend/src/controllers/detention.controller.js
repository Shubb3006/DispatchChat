import { detentionService } from "../services/detention.service.js";

/**
 * GET /detention/events
 * Real database query: active + completed detention events, joined to loads/trucks/drivers.
 * Empty table returns empty arrays honestly (no fixtures).
 *
 * Response shape:
 * {
 *   success: true,
 *   activeEvents: [
 *     {
 *       id, loadNumber, truckNumber, driverName, customerName, facilityName, facilityType,
 *       geofenceArrival, freeTimeHours, dwellHours, billableHours, hourlyRate,
 *       detentionAmountDue, status, warningLevel, gpsCoordinates, driverNote
 *     }
 *   ],
 *   claims: [
 *     {
 *       id, loadNumber, invoiceNumber, customerName, facilityName, date, type,
 *       totalDwellHours, freeTimeHours, billableHours, rate, totalClaimAmount,
 *       status, gpsProofAttached
 *     }
 *   ]
 * }
 */
export const getActiveDetentionEvents = async (req, res) => {
  try {
    const events = await detentionService.getActiveDwellEvents();
    const claims = await detentionService.getCompletedClaims();
    res.json({ success: true, activeEvents: events, claims });
  } catch (err) {
    console.error("getActiveDetentionEvents error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch detention data" });
  }
};

/**
 * POST /detention/generate-invoice
 * Create an invoice row and link it to detention_events. Body can be:
 *   { loadNumber, customerName, facilityName, dwellHours, hourlyRate, freeTimeHours, ... }
 *
 * Response shape:
 * {
 *   success: true,
 *   claim: {
 *     id, loadNumber, invoiceNumber, customerName, facilityName, date, type,
 *     totalDwellHours, freeTimeHours, billableHours, rate, totalClaimAmount,
 *     status, gpsProofAttached, generatedAt
 *   },
 *   message: string
 * }
 */
export const createDetentionInvoice = async (req, res) => {
  try {
    const {
      loadNumber,
      customerName,
      facilityName,
      dwellHours = 0,
      hourlyRate = 75.0,
      freeTimeHours = 2.0,
      detentionEventId = null,
    } = req.body;

    const billableHours = Math.max(0, Number((dwellHours - freeTimeHours).toFixed(1)));
    const result = await detentionService.generateInvoice({
      loadNumber,
      customerName,
      facilityName,
      billableHours,
      rate: hourlyRate,
      freeTimeHours,
      dwellHours,
      detentionEventId,
    });

    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.error || "Failed to generate invoice" });
    }

    res.json({
      success: true,
      claim: result.claim,
      message: result.message,
    });
  } catch (err) {
    console.error("createDetentionInvoice error:", err.message);
    res.status(500).json({ success: false, message: "Failed to generate detention invoice" });
  }
};

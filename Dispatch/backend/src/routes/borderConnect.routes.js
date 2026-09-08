import express from "express";
import {
  getRealBorderWaitTimes,
  validateCustomsEntry,
  checkCustomsHold,
  healthCheck,
  pollManifestAcknowledgment,
} from "../services/borderConnect.service.js";
import {
  bulkTransmitDraftManifests,
  pollAllManifestAcknowledgments,
  getEnrichedCustomsEntries,
  autoTransmitOnLoadStatusChange,
} from "../services/borderConnectSync.service.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * GET /api/border-connect/wait-times
 * Fetch real-time border wait times
 */
router.get("/wait-times", protectedRoute, async (req, res) => {
  try {
    const waitTimes = await getRealBorderWaitTimes();

    if (!waitTimes) {
      return res.status(503).json({
        success: false,
        error: "BorderConnect API unavailable",
      });
    }

    return res.json({
      success: true,
      data: waitTimes,
    });
  } catch (err) {
    console.error("[BorderConnect] Wait times error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/border-connect/customs/validate
 * Validate customs entry before dispatch
 * Body: { customsEntryId }
 */
router.post("/customs/validate", protectedRoute, async (req, res) => {
  try {
    const { customsEntryId } = req.body;

    if (!customsEntryId) {
      return res.status(400).json({
        success: false,
        message: "customsEntryId is required",
      });
    }

    const validation = await validateCustomsEntry(customsEntryId);

    return res.json({
      success: validation.isValid,
      data: validation,
    });
  } catch (err) {
    console.error("[BorderConnect] Validation error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/border-connect/customs/check-hold
 * Check customs hold status
 * Body: { loadNumber, truckNumber }
 */
router.post("/customs/check-hold", protectedRoute, async (req, res) => {
  try {
    const { loadNumber, truckNumber } = req.body;

    if (!loadNumber || !truckNumber) {
      return res.status(400).json({
        success: false,
        message: "loadNumber and truckNumber are required",
      });
    }

    const hold = await checkCustomsHold(loadNumber, truckNumber);

    return res.json({
      success: !hold.hasHold,
      data: hold,
    });
  } catch (err) {
    console.error("[BorderConnect] Hold check error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/border-connect/manifest/:manifestId/poll
 * Poll manifest acknowledgment from CBP
 * Body: { cbpReferenceId }
 */
router.post("/manifest/:manifestId/poll", protectedRoute, async (req, res) => {
  try {
    const { manifestId } = req.params;
    const { cbpReferenceId } = req.body;

    if (!cbpReferenceId) {
      return res.status(400).json({
        success: false,
        message: "cbpReferenceId is required",
      });
    }

    const status = await pollManifestAcknowledgment(manifestId, cbpReferenceId);

    return res.json({
      success: true,
      data: status,
    });
  } catch (err) {
    console.error("[BorderConnect] Poll error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/border-connect/health
 * Check BorderConnect API health
 */
router.get("/health", async (req, res) => {
  try {
    const health = await healthCheck();

    return res.json({
      success: health.connected,
      data: health,
    });
  } catch (err) {
    console.error("[BorderConnect] Health check error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/border-connect/sync
 * Manual sync: transmit all DRAFT manifests + poll acknowledgments
 * (Wires to "Sync BorderConnect" button)
 */
router.post("/sync", protectedRoute, async (req, res) => {
  try {
    console.log(`🔄 [BorderConnect] Manual sync initiated`);

    const [transmitResult, pollResult] = await Promise.all([
      bulkTransmitDraftManifests(),
      pollAllManifestAcknowledgments(),
    ]);

    return res.json({
      success: true,
      data: {
        transmission: transmitResult,
        polling: pollResult,
        message: `Transmitted ${transmitResult.successCount} manifests, polled ${pollResult.totalPolled} statuses`,
      },
    });
  } catch (err) {
    console.error("[BorderConnect] Sync error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/border-connect/customs/entries
 * Get enriched customs entries with wait times & manifest status
 * Query: ?status=DRAFT&borderDirection=INBOUND_US&limit=50
 */
router.get("/customs/entries", protectedRoute, async (req, res) => {
  try {
    const { status = "all", borderDirection = "all", limit = 50 } = req.query;

    const entries = await getEnrichedCustomsEntries({
      status,
      borderDirection,
      limit: Math.min(parseInt(limit, 10), 500),
    });

    return res.json({
      success: true,
      data: entries,
      count: entries.length,
    });
  } catch (err) {
    console.error("[BorderConnect] Enriched entries error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/border-connect/load/:loadId/auto-transmit
 * Auto-transmit manifest when load status changes
 * Body: { newStatus }
 */
router.post("/load/:loadId/auto-transmit", protectedRoute, async (req, res) => {
  try {
    const { loadId } = req.params;
    const { newStatus } = req.body;

    if (!newStatus) {
      return res.status(400).json({
        success: false,
        message: "newStatus is required",
      });
    }

    const result = await autoTransmitOnLoadStatusChange(loadId, newStatus);

    return res.json({
      success: !!result,
      data: result,
      message: result ? "Manifest transmitted" : "No manifest to transmit",
    });
  } catch (err) {
    console.error("[BorderConnect] Auto-transmit error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

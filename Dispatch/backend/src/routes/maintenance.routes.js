import express from "express";
import {
  getMaintenanceRadarOverview,
  createWorkOrder,
  updateWorkOrderStatus,
  clearEngineFaultCode,
} from "../services/fleetMaintenance.service.js";

const router = express.Router();

// GET /api/v1/maintenance/overview
router.get("/overview", async (req, res) => {
  try {
    const data = await getMaintenanceRadarOverview();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// POST /api/v1/maintenance/work-orders
router.post("/work-orders", (req, res) => {
  try {
    const result = createWorkOrder(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/v1/maintenance/work-orders/:id
router.patch("/work-orders/:id", (req, res) => {
  try {
    const { status } = req.body;
    const result = updateWorkOrderStatus(req.params.id, status);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/maintenance/clear-fault
router.post("/clear-fault", (req, res) => {
  try {
    const { faultId, notes } = req.body;
    const result = clearEngineFaultCode(faultId, notes);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

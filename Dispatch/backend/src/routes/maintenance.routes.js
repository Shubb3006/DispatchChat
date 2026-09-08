import express from "express";
import {
  getMaintenanceRadarOverview,
  createWorkOrder,
  updateWorkOrderStatus,
  clearEngineFaultCode,
  getMaintenanceKpiSummary,
} from "../services/fleetMaintenance.service.js";

const router = express.Router();

// GET /api/v1/maintenance/overview
// Returns maintenance radar with real DB work orders + live Samsara faults
router.get("/overview", async (req, res) => {
  try {
    const data = await getMaintenanceRadarOverview();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/maintenance/kpi-summary
// Returns computed KPI summary from real DB data (counts only, no fabricated numbers)
router.get("/kpi-summary", async (req, res) => {
  try {
    const summary = await getMaintenanceKpiSummary();
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/maintenance/work-orders
// Create a new work order persisted to PostgreSQL
router.post("/work-orders", async (req, res) => {
  try {
    const result = await createWorkOrder(req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/v1/maintenance/work-orders/:id
// Update work order status in database
router.patch("/work-orders/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const result = await updateWorkOrderStatus(req.params.id, status);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/maintenance/clear-fault
// Mark an engine fault as manually cleared by mechanic
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

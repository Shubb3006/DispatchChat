import express from "express";
import {
  getSafetyIncidents,
  getSafetyIncidentById,
  createSafetyIncident,
  updateSafetyIncidentStatus,
  deleteSafetyIncident
} from "../controllers/safety_incident.contoller.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", protectedRoute, getSafetyIncidents);
router.get("/:id", protectedRoute, getSafetyIncidentById);
router.post("/", protectedRoute, createSafetyIncident);
router.put("/:id/status", protectedRoute, updateSafetyIncidentStatus);
router.delete("/:id", protectedRoute, deleteSafetyIncident);

export default router;

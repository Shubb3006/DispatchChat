import { Router } from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import {
  calculateRoutes,
  getHistoricalRouteData,
  getDriverNotes,
  addDriverNote,
} from "../controllers/routeOptimization.controller.js";

const router = Router();

router.post("/calculate-routes", protectedRoute, calculateRoutes);
router.get("/historical/:load_id", protectedRoute, getHistoricalRouteData);
router.get("/driver-notes/:load_id", protectedRoute, getDriverNotes);
router.post("/driver-notes", protectedRoute, addDriverNote);

export default router;

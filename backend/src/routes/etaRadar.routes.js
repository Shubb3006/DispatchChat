import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import {
  getRadarOverview,
  getBorderWaitTimes,
  getWeatherCorridors,
  recalculateRadar,
} from "../controllers/etaRadar.controller.js";

const router = express.Router();

router.get("/overview", protectedRoute, getRadarOverview);
router.get("/border-wait-times", protectedRoute, getBorderWaitTimes);
router.get("/weather-corridors", protectedRoute, getWeatherCorridors);
router.post("/recalculate", protectedRoute, recalculateRadar);

export default router;

import express from "express";
import {
  getRadarOverview,
  getBorderWaitTimes,
  getWeatherCorridors,
  recalculateRadar,
} from "../controllers/etaRadar.controller.js";

const router = express.Router();

router.get("/overview", getRadarOverview);
router.get("/border-wait-times", getBorderWaitTimes);
router.get("/weather-corridors", getWeatherCorridors);
router.post("/recalculate", recalculateRadar);

export default router;

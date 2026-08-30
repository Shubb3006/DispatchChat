import express from "express";
import {
  calculateRoute,
  compareTolls,
  getJurisdictionMatrix,
} from "../controllers/pcmiler.controller.js";

const router = express.Router();

router.post("/calculate-route", calculateRoute);
router.post("/compare-tolls", compareTolls);
router.get("/jurisdictions", getJurisdictionMatrix);

export default router;

import { Router } from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import {
  recordLoadMovement,
  getLoadJourney,
  getLoadsAtFreightForce,
  updateLoadStatus
} from "../controllers/loadJourney.controller.js";

const router = Router();

router.post("/record", protectedRoute, recordLoadMovement);
router.get("/:load_id", protectedRoute, getLoadJourney);
router.get("/freight-force/all", protectedRoute, getLoadsAtFreightForce);
router.put("/status/update", protectedRoute, updateLoadStatus);

export default router;

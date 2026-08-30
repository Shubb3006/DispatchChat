import express from "express";
import { protectedRoute, authorize } from "../middlewares/auth.middleware.js";
import {
  listRateRequests,
  getRateRequest,
  createRateRequest,
  quoteRateRequest,
  respondToRateRequest,
  dispatcherNotificationStream,
  myNotifications,
} from "../controllers/portal.controller.js";

const router = express.Router();

// Public rate request endpoint (customer portal)
router.post("/", protectedRoute, createRateRequest);

// Dispatcher rate request management (requires auth)
router.get("/", protectedRoute, authorize("dispatcher", "admin", "super_admin"), listRateRequests);
router.get("/:id", protectedRoute, getRateRequest);
router.patch("/:id/quote", protectedRoute, authorize("dispatcher", "admin", "super_admin"), quoteRateRequest);

// Customer accepts/rejects quotes
router.post("/:id/respond", protectedRoute, respondToRateRequest);

// Real-time dispatcher alerts (SSE stream)
router.get("/notifications/stream", protectedRoute, authorize("dispatcher", "admin", "super_admin"), dispatcherNotificationStream);

// Customer portal: list my notifications
router.get("/notifications/my", protectedRoute, myNotifications);

export default router;

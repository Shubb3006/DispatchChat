import { Router } from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { requireCustomer } from "../middlewares/customer.middleware.js";
import {
  createRateRequest,
  listRateRequests,
  quoteRateRequest,
  respondToRateRequest,
  dispatcherNotificationStream,
  myNotifications,
} from "../controllers/portal.controller.js";

const router = Router();

// Customer portal: submit a rate request (strictly scoped to own tenant)
router.post("/request", protectedRoute, requireCustomer, createRateRequest);

// Both sides list rate requests (customers see only their own)
router.get("/", protectedRoute, listRateRequests);

// Dispatcher real-time alerts (SSE) + polling fallback
router.get(
  "/notifications/stream",
  protectedRoute,
  authorize("dispatcher", "admin", "super_admin"),
  dispatcherNotificationStream
);
router.get("/notifications", protectedRoute, myNotifications);

// Dispatcher quotes a price
router.patch(
  "/:id/quote",
  protectedRoute,
  authorize("dispatcher", "admin", "super_admin"),
  quoteRateRequest
);

// Customer accepts or rejects the quote
router.patch("/:id/respond", protectedRoute, requireCustomer, respondToRateRequest);

export default router;

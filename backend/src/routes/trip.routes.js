import express from "express";

import {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
//   updateTripStatus,
  deleteTrip,
  getLoadLegs,
  replaceLoadLegs,
  updateLoadLeg,
  deleteLoadLeg,
} from "../controllers/trip.controller.js";
import { getMySettlements } from "../controllers/settlement.controller.js";

import { protectedRoute } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post(
  "/",
  protectedRoute,
  authorize("super_admin", "admin", "dispatcher"),
  createTrip
);

router.get(
  "/",
  protectedRoute,
  getAllTrips
);

router.get(
  "/:id",
  protectedRoute,
  getTripById
);

router.put(
  "/:id",
  protectedRoute,
  authorize("super_admin", "admin", "dispatcher"),
  updateTrip
);

// router.patch(
//   "/:id/status",
//   protectedRoute,
//   authorize("super_admin", "admin", "dispatcher"),
//   updateTripStatus
// );

router.delete(
  "/:id",
  protectedRoute,
  authorize("super_admin", "admin"),
  deleteTrip
);

// ---------------------------------------------------------------------------
// Relay legs (split loads) + driver pay transparency.
// This sub-router is mounted at /api from server.js (single line:
// app.use("/api", tripRoutes.legsRouter)) because the required paths
// (/api/load/:loadId/legs, /api/legs/:id, /api/settlement/me) live outside the
// /api/trips prefix this file's default router is mounted on.
// ---------------------------------------------------------------------------

export const legsRouter = express.Router();

legsRouter.get(
  "/load/:loadId/legs",
  protectedRoute,
  authorize("super_admin", "admin", "dispatcher", "driver"),
  getLoadLegs
);

legsRouter.post(
  "/load/:loadId/legs",
  protectedRoute,
  authorize("super_admin", "admin", "dispatcher"),
  replaceLoadLegs
);

legsRouter.patch(
  "/legs/:id",
  protectedRoute,
  authorize("super_admin", "admin", "dispatcher"),
  updateLoadLeg
);

legsRouter.delete(
  "/legs/:id",
  protectedRoute,
  authorize("super_admin", "admin", "dispatcher"),
  deleteLoadLeg
);

// FROZEN CONTRACT consumed by the driver app: GET /api/settlement/me
legsRouter.get(
  "/settlement/me",
  protectedRoute,
  authorize("driver"),
  getMySettlements
);

// Expose the legs router on the default export so server.js can mount it with
// one line without adding a new import.
router.legsRouter = legsRouter;

export default router;

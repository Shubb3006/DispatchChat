import express from "express";

import {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
//   updateTripStatus,
  deleteTrip,
  getTripRoute,
} from "../controllers/trip.controller.js";

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

// Printable trip sheet with the stored optimized route.
// ?refresh=true re-routes instead of reusing the stored result.
router.get(
  "/:id/route",
  protectedRoute,
  getTripRoute
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

export default router;
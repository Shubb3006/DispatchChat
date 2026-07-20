import express from "express";

import {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
//   updateTripStatus,
  deleteTrip,
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
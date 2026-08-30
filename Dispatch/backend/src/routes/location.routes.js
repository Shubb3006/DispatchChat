import express from "express";

import {
    createLocation,
    getAllLocations,
    getLocationById,
    updateLocation,
    deleteLocation
} from "../controllers/location.controller.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post(
    "/",
    protectedRoute,
    authorize("admin","super_admin", "dispatcher"),
    createLocation
);

router.get(
    "/",
    protectedRoute,
    authorize("admin","super_admin", "dispatcher", "driver"),
    getAllLocations
);

router.get(
    "/:id",
    protectedRoute,
    authorize("admin","super_admin", "dispatcher", "driver"),
    getLocationById
);

router.put(
    "/:id",
    protectedRoute,
    authorize("admin", "dispatcher","super_admin"),
    updateLocation
);

router.delete(
    "/:id",
    protectedRoute,
    authorize("admin","super_admin"),
    deleteLocation
);

export default router;
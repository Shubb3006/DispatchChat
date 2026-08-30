import express from "express";

import {
    createDriver,
    getDrivers,
    getDriver,
    updateDriver,
    deleteDriver,
    // updateMyCoords
} from "../controllers/driver.controllers.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";


const router = express.Router();

router.post(
    "/",
    protectedRoute,
    authorize("admin", "dispatcher", "super_admin"),
    createDriver
);

// Driver app position sync — any authenticated user with a linked driver
// profile; registered before /:id so "me" is never captured as an id.
// router.patch(
//     "/me/coords",
//     protectedRoute,
//     updateMyCoords
// );

router.get(
    "/",
    protectedRoute,
    getDrivers
);

router.get(
    "/:id",
    protectedRoute,
    getDriver
);

router.put(
    "/:id",
    protectedRoute,
    authorize("admin", "dispatcher", "super_admin"),
    updateDriver
);

router.delete(
    "/:id",
    protectedRoute,
    authorize("admin", "super_admin"),
    deleteDriver
);

export default router;
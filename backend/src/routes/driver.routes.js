import express from "express";

import {
    createDriver,
    getDrivers,
    getDriver,
    updateDriver,
    deleteDriver
} from "../controllers/driver.controllers.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";


const router = express.Router();

router.post(
    "/",
    protectedRoute,
    authorize("admin", "disatcher","super_admin"),
    createDriver
);

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
    authorize("admin", "dispatcher","super_admin"),
    updateDriver
);

router.delete(
    "/:id",
    protectedRoute,
    authorize("admin","super_admin"),
    deleteDriver
);

export default router;
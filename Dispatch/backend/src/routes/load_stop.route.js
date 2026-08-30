import express from "express";

import {
    createLoadStop,
    getAllLoadStops,
    getLoadStopById,
    getStopsByLoad,
    updateLoadStop,
    deleteLoadStop
} from "../controllers/load_stop.controller.js"
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post(
    "/",
    protectedRoute,
    authorize("admin","super_admin", "dispatcher"),
    createLoadStop
);

router.get(
    "/",
    protectedRoute,
    authorize("admin", "dispatcher","super_admin", "driver"),
    getAllLoadStops
);

router.get(
    "/load/:loadId",
    protectedRoute,
    authorize("admin", "dispatcher", "driver","super_admin"),
    getStopsByLoad
);

router.get(
    "/:id",
    protectedRoute,
    authorize("admin", "dispatcher", "driver","super_admin"),
    getLoadStopById
);

router.put(
    "/:id",
    protectedRoute,
    authorize("admin", "dispatcher","super_admin"),
    updateLoadStop
);

router.delete(
    "/:id",
    protectedRoute,
    authorize("admin","super_admin"),
    deleteLoadStop
);

export default router;
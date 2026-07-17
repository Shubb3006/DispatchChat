import express from "express";

import { protectedRoute } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import{
    createTruck,
    getAllTrucks,
    getTruckById,
    updateTruck,
    deleteTruck
} from "../controllers/trucks.controller.js";

const router = express.Router();

router.post(
    "/",
    protectedRoute,
    authorize("admin", "dispatcher","super_admin"),
    createTruck
);

router.get(
    "/",
    protectedRoute,
    authorize("admin", "dispatcher", "driver","super_admin"),
    getAllTrucks
);

router.get(
    "/:id",
    protectedRoute,
    authorize("admin", "dispatcher", "driver","super_admin"),
    getTruckById
);

router.put(
    "/:id",
    protectedRoute,
    authorize("admin", "dispatcher","super_admin"),
    updateTruck
);

router.delete(
    "/:id",
    protectedRoute,
    authorize("admin","super_admin"),
    deleteTruck
);

export default router;
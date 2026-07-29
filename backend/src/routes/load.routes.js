import { Router } from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { createLoad, getAllLoads,getLoadById,updateLoad ,updateLoadStatus,deleteLoad} from "../controllers/load.controller.js";


const router=Router();

router.post(
    "/",
    protectedRoute,
    authorize("admin", "super_admin","dispatcher"),
    createLoad
);

router.get(
    "/",
    protectedRoute,
    getAllLoads
);

router.get(
    "/:id",
    protectedRoute,
    getLoadById
);

router.put(
    "/:id",
    protectedRoute,
    authorize("admin","super_admin", "dispatcher"),
    updateLoad
);

router.put(
    "/:id/status",
    protectedRoute,
    updateLoadStatus
);

router.delete(
    "/:id",
    protectedRoute,
    authorize("admin","super_admin"),
    deleteLoad
);

export default router;
import { Router } from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { createLoad, getAllLoads,updateLoad ,updateLoadStatus,deleteLoad, approveBOL, uploadBOL, getPendingBOLs} from "../controllers/load.controller.js";
import {upload} from '../config/multer.js'; // <

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

// router.get(
//     "/:id",
//     protectedRoute,
//     getLoadById
// );

router.put(
    "/:id",
    protectedRoute,
    // authorize("admin","super_admin", "dispatcher"),
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

router.get("/pending-bols",protectedRoute,getPendingBOLs)
router.post('/upload-bol',protectedRoute, upload.single('bol_image'), uploadBOL);
router.post('/approve-bol',protectedRoute, approveBOL);

export default router;
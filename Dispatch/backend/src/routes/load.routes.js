import { Router } from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import {
  createLoad,
  getAllLoads,
  updateLoad,
  updateLoadStatus,
  deleteLoad,
  approveBOL,
  rejectBOL,
  uploadBOL,
  getPendingBOLs,
  parseInboundTender,
  ingestInboundTenderWebhook,
  getAutomationStatus,
  triggerAutomationCycle,
  uploadAndProcessPdfTender,
  aiMatchDrivers,
  autoAssignDriver,
} from "../controllers/load.controller.js";
import { upload } from '../config/multer.js';

const router = Router();

// AI Smart Driver-Load Matcher & Dispatch Optimizer
router.post("/ai-match-drivers", protectedRoute, aiMatchDrivers);
router.post("/auto-assign", protectedRoute, autoAssignDriver);

// Automated Inbound Load Tender Ingestion & Background Worker (100% Native replacing Make.com)
// NOTE: /inbound-tender stays public by design — it is the external email/webhook ingestion endpoint.
router.post("/inbound-tender", ingestInboundTenderWebhook);
router.post("/parse-tender", protectedRoute, parseInboundTender);
router.get("/automation/status", protectedRoute, getAutomationStatus);
router.post("/automation/trigger", protectedRoute, triggerAutomationCycle);
router.post("/automation/upload-pdf", protectedRoute, upload.single("pdf"), uploadAndProcessPdfTender);



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

router.get("/pending-bols",protectedRoute,getPendingBOLs);
router.post('/upload-bol',protectedRoute, upload.single('bol_image'), uploadBOL);
router.post('/approve-bol',protectedRoute, approveBOL);
router.post('/reject-bol',protectedRoute, rejectBOL);

export default router;
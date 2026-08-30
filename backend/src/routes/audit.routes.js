import { Router } from "express";
import {
  getAuditLogs,
  getEntityAuditLogs,
  getAuditStats,
  createAuditLog
} from "../controllers/audit.controller.js";

const router = Router();

// Routes
router.get("/", getAuditLogs);
router.get("/stats", getAuditStats);
router.get("/entity/:entityType/:entityId", getEntityAuditLogs);
router.post("/", createAuditLog);

export default router;

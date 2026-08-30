import express from "express";
import {
  getCustomsEntries,
  getCustomsEntryById,
  createCustomsEntry,
  updateCustomsEntry,
  updateCustomsStatus,
  getCustomsReferenceData,
  getBorderConnectConfig,
  saveBorderConnectConfig,
  checkBorderConnectStatus,
  submitBorderConnectAce,
  submitBorderConnectAci,
  syncAllBorderConnectShipments,
  getBorderConnectSyncSummary,
  fileBorderConnectManifest,
  refreshBorderConnectStatus,
  getBorderConnectFilingState,
} from "../controllers/customs.controller.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = express.Router();

const customsAccess = authorize("admin", "super_admin", "dispatcher");

// Reference catalogs (Ports of Entry, HTS Codes, Brokers)
router.get("/reference-data", protectedRoute, customsAccess, getCustomsReferenceData);

// BorderConnect Integration Endpoints (honest filing lifecycle)
router.get("/borderconnect/config", protectedRoute, customsAccess, getBorderConnectConfig);
router.post("/borderconnect/config", protectedRoute, customsAccess, saveBorderConnectConfig);
router.get("/borderconnect/status/:barcode", protectedRoute, customsAccess, checkBorderConnectStatus);
router.post("/borderconnect/submit-ace", protectedRoute, customsAccess, submitBorderConnectAce);
router.post("/borderconnect/submit-aci", protectedRoute, customsAccess, submitBorderConnectAci);
router.post("/borderconnect/sync-all", protectedRoute, customsAccess, syncAllBorderConnectShipments);
router.get("/borderconnect/live-sync-summary", protectedRoute, customsAccess, getBorderConnectSyncSummary);

// Customs Entries CRUD
router.get("/", protectedRoute, customsAccess, getCustomsEntries);
router.get("/:id", protectedRoute, customsAccess, getCustomsEntryById);
router.post("/", protectedRoute, customsAccess, createCustomsEntry);
router.put("/:id", protectedRoute, customsAccess, updateCustomsEntry);
router.patch("/:id/status", protectedRoute, customsAccess, updateCustomsStatus);

// Honest BorderConnect filing lifecycle per entry
router.post("/:id/file", protectedRoute, customsAccess, fileBorderConnectManifest);
router.post("/:id/refresh-status", protectedRoute, customsAccess, refreshBorderConnectStatus);
router.get("/:id/filing", protectedRoute, customsAccess, getBorderConnectFilingState);

export default router;

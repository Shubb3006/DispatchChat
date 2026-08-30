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
} from "../controllers/customs.controller.js";

const router = express.Router();

// Reference catalogs (Ports of Entry, HTS Codes, Brokers)
router.get("/reference-data", getCustomsReferenceData);

// BorderConnect Live Integration Endpoints
router.get("/borderconnect/config", getBorderConnectConfig);
router.post("/borderconnect/config", saveBorderConnectConfig);
router.get("/borderconnect/status/:barcode", checkBorderConnectStatus);
router.post("/borderconnect/submit-ace", submitBorderConnectAce);
router.post("/borderconnect/submit-aci", submitBorderConnectAci);
router.post("/borderconnect/sync-all", syncAllBorderConnectShipments);
router.get("/borderconnect/live-sync-summary", getBorderConnectSyncSummary);


// Customs Entries CRUD
router.get("/", getCustomsEntries);
router.get("/:id", getCustomsEntryById);
router.post("/", createCustomsEntry);
router.put("/:id", updateCustomsEntry);
router.patch("/:id/status", updateCustomsStatus);

export default router;

import express from "express";
import {
  generateManifest,
  getManifest,
  transmitManifest,
  downloadBol,
  downloadAceManifest,
} from "../controllers/emanifest.controller.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * POST /api/emanifests/generate
 * Generate ACE manifest + BOL for a load
 * Body: { loadId }
 */
router.post("/generate", protectedRoute, generateManifest);

/**
 * GET /api/emanifests/load/:loadId
 * Retrieve manifest for a load
 */
router.get("/load/:loadId", protectedRoute, getManifest);

/**
 * POST /api/emanifests/:manifestId/transmit
 * Transmit manifest to CBP
 */
router.post("/:manifestId/transmit", protectedRoute, transmitManifest);

/**
 * GET /api/emanifests/:manifestId/bol
 * Download BOL as HTML (for printing)
 */
router.get("/:manifestId/bol", protectedRoute, downloadBol);

/**
 * GET /api/emanifests/:manifestId/ace
 * Download ACE manifest as XML
 */
router.get("/:manifestId/ace", protectedRoute, downloadAceManifest);

export default router;

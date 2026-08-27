import express from "express";
import {
  handleSupabaseLoadWebhook,
  updateLoadStatus,
  uploadLoadDocument,
  uploadBOL,
} from "../controllers/load.controller.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Public endpoint for Supabase Webhook
router.post("/webhook", handleSupabaseLoadWebhook);

// Protected endpoints for Driver Status Update & Skid/BOL Document Upload
router.post("/update-status", protectedRoute, updateLoadStatus);
router.post("/upload-document", protectedRoute, uploadLoadDocument);
router.post("/upload-bol", protectedRoute, upload.single("bol_image"), uploadBOL);

export default router;


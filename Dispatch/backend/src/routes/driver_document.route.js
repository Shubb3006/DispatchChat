import express from "express";
import {
  getDriverDocuments,
  getDriverDocumentById,
  createDriverDocument,
  updateDriverDocument,
  bulkUpdateDriverDocumentsStatus,
  deleteDriverDocument
} from "../controllers/driver_document.controller.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", protectedRoute, getDriverDocuments);
router.get("/:id", protectedRoute, getDriverDocumentById);
router.post("/", protectedRoute, createDriverDocument);
router.put("/bulk-status", protectedRoute, bulkUpdateDriverDocumentsStatus);
router.put("/:id", protectedRoute, updateDriverDocument);
router.delete("/:id", protectedRoute, deleteDriverDocument);

export default router;

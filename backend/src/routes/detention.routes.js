import express from "express";
import { protectedRoute, authorize } from "../middlewares/auth.middleware.js";
import {
  listDetentionEvents,
  getDetentionEvent,
  updateDetentionEvent,
  generateDetentionInvoice,
} from "../controllers/detention.controller.js";

const router = express.Router();

// All detention routes require admin/dispatcher/super_admin
router.use(protectedRoute);
router.use(authorize("admin", "dispatcher", "super_admin"));

router.get("/", listDetentionEvents);
router.get("/:id", getDetentionEvent);
router.patch("/:id", updateDetentionEvent);
router.post("/:id/generate-invoice", generateDetentionInvoice);

export default router;

import express from "express";
import { protectedRoute, authorize } from "../middlewares/auth.middleware.js";
import {
  listDetentionEvents,
  getActiveDetentionEvents,
  getDetentionEvent,
  updateDetentionEvent,
  generateDetentionInvoice,
} from "../controllers/detention.controller.js";

const router = express.Router();

// All detention routes require an authenticated dispatch-side user.
// Reads and writes: admin / super_admin / dispatcher only.
router.use(protectedRoute);
router.use(authorize("admin", "super_admin", "dispatcher"));

// Legacy alias consumed by DetentionPage.jsx — must be declared before "/:id"
router.get("/events", getActiveDetentionEvents);

router.get("/", listDetentionEvents);
router.get("/:id", getDetentionEvent);
router.patch("/:id", updateDetentionEvent);
router.post("/:id/generate-invoice", generateDetentionInvoice);

export default router;

import express from "express";
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoiceStatus,
  updateInvoice,
  deleteInvoice
} from "../controllers/invoice.controller.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", protectedRoute, getInvoices);
router.get("/:id", protectedRoute, getInvoiceById);
router.post("/", protectedRoute, createInvoice);
router.put("/:id/status", protectedRoute, updateInvoiceStatus);
router.put("/:id", protectedRoute, updateInvoice);
router.delete("/:id", protectedRoute, deleteInvoice);

export default router;

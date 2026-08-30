import express from "express";
import {
  getActiveDetentionEvents,
  createDetentionInvoice,
} from "../controllers/detention.controller.js";

const router = express.Router();

router.get("/events", getActiveDetentionEvents);
router.post("/generate-invoice", createDetentionInvoice);

export default router;

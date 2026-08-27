import express from "express";
import {
  getSettlements,
  getSettlementById,
  generateSettlement,
  updateSettlementStatus,
  getSettlementStats,
} from "../controllers/settlement.controller.js";

const router = express.Router();

router.get("/stats", getSettlementStats);
router.get("/", getSettlements);
router.get("/:id", getSettlementById);
router.post("/generate", generateSettlement);
router.post("/", generateSettlement);
router.put("/:id/status", updateSettlementStatus);

export default router;

import express from "express";
import {
  getSettlements,
  getSettlementById,
  generateSettlement,
  updateSettlementStatus,
  getSettlementStats,
  getMySettlements,
} from "../controllers/settlement.controller.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/stats", getSettlementStats);
// Driver pay transparency (also served at /api/settlement/me — frozen contract).
// Must be registered before "/:id" so "me" is not treated as a settlement id.
router.get("/me", protectedRoute, authorize("driver"), getMySettlements);
router.get("/", getSettlements);
router.get("/:id", getSettlementById);
router.post("/generate", generateSettlement);
router.post("/", generateSettlement);
router.put("/:id/status", updateSettlementStatus);

export default router;

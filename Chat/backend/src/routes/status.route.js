import express from "express";
import { addStatus, getStatuses } from "../controllers/status.contoller.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/", protectedRoute, addStatus);
router.get("/", protectedRoute, getStatuses);

export default router;

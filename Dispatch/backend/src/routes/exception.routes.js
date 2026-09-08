import express from "express";
import {
  checkLoadExceptions,
  getExceptions,
  resolveExceptionHandler,
  checkDispatchEligibility,
} from "../controllers/exception.controller.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * POST /api/exceptions/check
 * Run exception detection on a load and persist results
 * Body: { loadId, load: {...} }
 */
router.post("/check", protectedRoute, checkLoadExceptions);

/**
 * GET /api/exceptions/load/:loadId
 * Retrieve all exceptions for a load (default: open status only)
 * Query: ?status=open|resolved|all
 */
router.get("/load/:loadId", protectedRoute, getExceptions);

/**
 * POST /api/exceptions/:exceptionId/resolve
 * Mark an exception as resolved
 * Body: { resolvedBy?: userId }
 */
router.post("/:exceptionId/resolve", protectedRoute, resolveExceptionHandler);

/**
 * GET /api/exceptions/load/:loadId/can-dispatch
 * Check if load can be dispatched (no critical exceptions blocking)
 */
router.get("/load/:loadId/can-dispatch", protectedRoute, checkDispatchEligibility);

export default router;

import express from "express";
import {
  generateQuote,
  getQuote,
  listQuotes,
  acceptQuoteHandler,
} from "../controllers/quote.controller.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * POST /api/quotes/generate
 * Generate a quote from tender data (autonomous Quote Agent)
 * Body: { tenderData: {...}, targetMarginPercent?: 20, brokerCommissionPercent?: 10 }
 */
router.post("/generate", protectedRoute, generateQuote);

/**
 * GET /api/quotes/:quoteId
 * Retrieve a specific quote
 */
router.get("/:quoteId", protectedRoute, getQuote);

/**
 * GET /api/quotes?customerEmail=...&limit=10
 * List quotes for a customer
 */
router.get("/", protectedRoute, listQuotes);

/**
 * POST /api/quotes/:quoteId/accept
 * Customer accepts a quote
 */
router.post("/:quoteId/accept", protectedRoute, acceptQuoteHandler);

export default router;

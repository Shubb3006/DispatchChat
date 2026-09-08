import express from "express";
import {
  getPnl,
  getCustomerReport,
  getArAging,
  getUtilization,
  getForecast,
  sendArReminder,
} from "../controllers/reporting.controller.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * GET /pnl?days=30
 * Gross revenue (invoices or loads), estimated operating cost (settlements + fuel),
 * net, RPM/CPM (where miles exist), lane yield (top 10 by revenue).
 */
router.get("/pnl", protectedRoute, getPnl);

/**
 * GET /customers?days=30
 * Revenue by customer (from loads/invoices), load counts, on-time % where available,
 * top 10 by revenue.
 */
router.get("/customers", protectedRoute, getCustomerReport);

/**
 * GET /ar
 * Accounts receivable aging: buckets 0-30/31-60/61-90/90+ (by due date),
 * per-invoice rows (invoice #, customer, balance, due date, bucket), total outstanding, DSO.
 */
router.get("/ar", protectedRoute, getArAging);

/**
 * GET /utilization
 * Fleet counts (trucks/drivers by status), load statuses (in transit, delivered in period),
 * loaded miles, active driver leaderboard (loads, miles, revenue, period 30d).
 */
router.get("/utilization", protectedRoute, getUtilization);

/**
 * GET /forecast
 * Monthly history for the last 6 months from real loads/invoices (volume + revenue),
 * contiguous series suitable for frontend projection charts.
 */
router.get("/forecast", protectedRoute, getForecast);

/**
 * POST /ar/remind
 * Body: { invoiceId or invoice_number, to, subject, message }
 * Sends reminder via emailNotifier.service.js; response includes simulated flag
 * so the UI can tell the user honestly whether a real email went out.
 */
router.post("/ar/remind", protectedRoute, sendArReminder);

export default router;

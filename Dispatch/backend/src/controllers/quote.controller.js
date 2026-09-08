import {
  calculateQuote,
  persistQuote,
  getQuoteById,
  getQuotesByCustomer,
  acceptQuote,
  ensureQuotesTable,
} from "../services/quoteAgent.service.js";

/**
 * POST /api/quotes/generate
 * Generate a quote from tender data
 */
export async function generateQuote(req, res) {
  try {
    await ensureQuotesTable();

    const { tenderData, targetMarginPercent = 20, brokerCommissionPercent = 10 } = req.body;

    if (!tenderData) {
      return res.status(400).json({ success: false, message: "tenderData is required" });
    }

    // Calculate quote using real P&L data
    const quote = await calculateQuote({
      tenderData,
      targetMarginPercent,
      brokerCommissionPercent,
    });

    // Persist to database
    const persistedQuote = await persistQuote(quote);

    return res.json({
      success: true,
      quote: persistedQuote,
      message: `Quote $${persistedQuote.quote_rate} generated for ${tenderData.customer_name}`,
    });
  } catch (err) {
    console.error("[Quote Controller] Generate error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/quotes/:quoteId
 * Retrieve a specific quote
 */
export async function getQuote(req, res) {
  try {
    const { quoteId } = req.params;

    if (!quoteId) {
      return res.status(400).json({ success: false, message: "quoteId is required" });
    }

    const quote = await getQuoteById(quoteId);

    if (!quote) {
      return res.status(404).json({ success: false, message: "Quote not found" });
    }

    return res.json({ success: true, quote });
  } catch (err) {
    console.error("[Quote Controller] Get error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/quotes?customerEmail=...
 * List quotes for a customer
 */
export async function listQuotes(req, res) {
  try {
    const { customerEmail, limit = 10 } = req.query;

    if (!customerEmail) {
      return res.status(400).json({ success: false, message: "customerEmail query param is required" });
    }

    const quotes = await getQuotesByCustomer(customerEmail, parseInt(limit, 10));

    return res.json({
      success: true,
      count: quotes.length,
      quotes,
    });
  } catch (err) {
    console.error("[Quote Controller] List error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/quotes/:quoteId/accept
 * Customer accepts a quote (transition to accepted status)
 */
export async function acceptQuoteHandler(req, res) {
  try {
    const { quoteId } = req.params;

    if (!quoteId) {
      return res.status(400).json({ success: false, message: "quoteId is required" });
    }

    const acceptedQuote = await acceptQuote(quoteId);

    if (!acceptedQuote) {
      return res.status(404).json({ success: false, message: "Quote not found" });
    }

    return res.json({
      success: true,
      quote: acceptedQuote,
      message: `Quote ${quoteId} accepted. Load confirmation email will be sent.`,
    });
  } catch (err) {
    console.error("[Quote Controller] Accept error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

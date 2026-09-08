import {
  detectLoadExceptions,
  persistExceptions,
  getLoadExceptions,
  resolveException,
  canDispatchLoad,
  ensureExceptionsTable,
} from "../services/exceptionHandler.service.js";

/**
 * POST /api/exceptions/check
 * Run exception detection on a load
 */
export async function checkLoadExceptions(req, res) {
  try {
    await ensureExceptionsTable();

    const { loadId, load } = req.body;

    if (!loadId) {
      return res.status(400).json({ success: false, message: "loadId is required" });
    }

    // Run all exception checks
    const exceptions = await detectLoadExceptions({ loadId, load });

    // Persist to database
    const count = await persistExceptions(loadId, exceptions);

    return res.json({
      success: true,
      loadId,
      exceptionCount: exceptions.length,
      criticalCount: exceptions.filter((e) => e.severity === "critical").length,
      warningCount: exceptions.filter((e) => e.severity === "warning").length,
      exceptions,
      persisted: count,
    });
  } catch (err) {
    console.error("[Exception Controller] Check error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/exceptions/load/:loadId
 * Get all exceptions for a load
 */
export async function getExceptions(req, res) {
  try {
    const { loadId } = req.params;
    const { status = "open" } = req.query;

    if (!loadId) {
      return res.status(400).json({ success: false, message: "loadId is required" });
    }

    const exceptions = await getLoadExceptions(loadId, status);

    return res.json({
      success: true,
      loadId,
      status,
      count: exceptions.length,
      exceptions,
    });
  } catch (err) {
    console.error("[Exception Controller] Get error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/exceptions/:exceptionId/resolve
 * Mark exception as resolved
 */
export async function resolveExceptionHandler(req, res) {
  try {
    const { exceptionId } = req.params;
    const { resolvedBy } = req.body;

    if (!exceptionId) {
      return res.status(400).json({ success: false, message: "exceptionId is required" });
    }

    const resolved = await resolveException(exceptionId, resolvedBy);

    if (!resolved) {
      return res.status(404).json({ success: false, message: "Exception not found" });
    }

    return res.json({
      success: true,
      exception: resolved,
      message: `Exception ${exceptionId} resolved.`,
    });
  } catch (err) {
    console.error("[Exception Controller] Resolve error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/exceptions/load/:loadId/can-dispatch
 * Check if load can be dispatched (no critical exceptions)
 */
export async function checkDispatchEligibility(req, res) {
  try {
    const { loadId } = req.params;

    if (!loadId) {
      return res.status(400).json({ success: false, message: "loadId is required" });
    }

    const { allowed, reason, exceptions } = await canDispatchLoad(loadId);

    return res.json({
      success: true,
      loadId,
      canDispatch: allowed,
      reason,
      blockedByCount: exceptions.filter((e) => e.severity === "critical").length,
      exceptions,
    });
  } catch (err) {
    console.error("[Exception Controller] Dispatch check error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

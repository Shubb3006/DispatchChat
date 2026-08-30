import { detentionService } from "../services/detention.service.js";
import { notify } from "../services/notification.service.js";

// GET /api/detention (list with pagination)
export async function listDetentionEvents(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = parseInt(req.query.offset, 10) || 0;
    const status = req.query.status || null;

    const events = await detentionService.listDetentionEvents(limit, offset, status);
    const total = await detentionService.getDetentionCount(status);

    res.json({ success: true, data: events, total, limit, offset });
  } catch (err) {
    console.error("listDetentionEvents:", err);
    res.status(500).json({ success: false, message: "Failed to list detention events" });
  }
}

// GET /api/detention/:id
export async function getDetentionEvent(req, res) {
  try {
    const event = await detentionService.getDetentionEvent(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Detention event not found" });
    res.json({ success: true, data: event });
  } catch (err) {
    console.error("getDetentionEvent:", err);
    res.status(500).json({ success: false, message: "Failed to fetch detention event" });
  }
}

// PATCH /api/detention/:id (update status)
export async function updateDetentionEvent(req, res) {
  try {
    const { status } = req.body;
    if (!status || !["active", "closed", "claimed", "invoiced", "written_off"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const event = await detentionService.updateDetentionStatus(req.params.id, status);
    res.json({ success: true, data: event });
  } catch (err) {
    console.error("updateDetentionEvent:", err);
    res.status(500).json({ success: false, message: "Failed to update detention event" });
  }
}

// POST /api/detention/:id/generate-invoice
export async function generateDetentionInvoice(req, res) {
  try {
    const detentionId = req.params.id;
    const { customerId } = req.body;

    if (!customerId) return res.status(400).json({ success: false, message: "customerId required" });

    const event = await detentionService.getDetentionEvent(detentionId);
    if (!event) return res.status(404).json({ success: false, message: "Detention event not found" });

    if (event.amount <= 0) {
      return res.status(400).json({ success: false, message: "Cannot invoice zero detention" });
    }

    const invoice = await detentionService.generateInvoice(detentionId, customerId);

    // Notify dispatch
    await notify({
      userId: req.user.id,
      type: "detention_billed",
      title: `Detention Charge: Load #${event.load_number}`,
      body: `$${event.amount.toFixed(2)} billable detention at ${event.location_name}`,
      meta: { detentionId, loadId: event.load_id, invoiceId: invoice.id },
      channels: ["inapp", "email"],
    });

    res.json({ success: true, data: invoice });
  } catch (err) {
    console.error("generateDetentionInvoice:", err);
    res.status(500).json({ success: false, message: "Failed to generate invoice" });
  }
}

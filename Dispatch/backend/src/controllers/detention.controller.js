import { detentionService } from "../services/detention.service.js";

export const getActiveDetentionEvents = (req, res) => {
  try {
    const events = detentionService.getActiveDwellEvents();
    const claims = detentionService.getCompletedClaims();
    res.json({ success: true, activeEvents: events, claims });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch detention data" });
  }
};

export const createDetentionInvoice = (req, res) => {
  try {
    const result = detentionService.generateDetentionInvoice(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to generate detention invoice" });
  }
};

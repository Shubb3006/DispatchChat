import pool from "../config/db.js";
import { notify } from "../services/notification.service.js";

export async function listRateRequests(req, res) {
  try {
    res.json({ success: true, rate_requests: [], total: 0, limit: 50, offset: 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to list rate requests" });
  }
}

export async function getRateRequest(req, res) {
  try {
    res.status(404).json({ success: false, message: "Not found" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch rate request" });
  }
}

export async function createRateRequest(req, res) {
  try {
    const { origin, destination, freight_details } = req.body;
    if (!origin || !destination) {
      return res.status(400).json({ success: false, message: "origin and destination required" });
    }
    res.status(201).json({ success: true, rate_request: { id: "stub", origin, destination, status: "PENDING" } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create rate request" });
  }
}

export async function quoteRateRequest(req, res) {
  try {
    const { quoted_price } = req.body;
    if (!quoted_price) {
      return res.status(400).json({ success: false, message: "quoted_price required" });
    }
    res.json({ success: true, rate_request: { id: "stub", status: "QUOTED", quoted_price } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to quote rate" });
  }
}

export async function respondToRateRequest(req, res) {
  try {
    const { response } = req.body;
    if (!["ACCEPT", "REJECT"].includes(response)) {
      return res.status(400).json({ success: false, message: "Invalid response" });
    }
    res.json({ success: true, rate_request: { id: "stub", status: response } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to respond to rate" });
  }
}

export async function dispatcherNotificationStream(req, res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.write(`event: connected\ndata: {}\n\n`);
  setTimeout(() => res.end(), 5000);
}

export async function myNotifications(req, res) {
  try {
    res.json({ success: true, notifications: [] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
}

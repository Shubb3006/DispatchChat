import express from "express";
import {
  getTelematicsConfig,
  saveTelematicsConfig,
  getFleetLocations,
  getSingleVehicle,
  optimizeRoutePlan,
  transmitRouteDispatch,
  simulateHosTrip,
  calculateIfta,
  getGeofenceAlerts,
  getPublicTracking,
} from "../controllers/telematics.controller.js";

const router = express.Router();

// Configuration
router.get("/config", getTelematicsConfig);
router.post("/config", saveTelematicsConfig);

// Fleet GPS Telemetry
router.get("/fleet", getFleetLocations);
router.get("/vehicle/:truckNumber", getSingleVehicle);

// AI Route & Toll Optimization
router.post("/optimize-ltl-route", optimizeRoutePlan);

// Transmit Route to Driver's Samsara In-Cab Tablet
router.post("/dispatch-to-driver", transmitRouteDispatch);

// HOS Feasibility Simulator
router.post("/simulate-hos", simulateHosTrip);

// IFTA State & Province Mileage Slicer
router.post("/ifta-slice", calculateIfta);

// Geofence & Milestone Alerts
router.get("/geofence-alerts", getGeofenceAlerts);

// Public Magic Tracking (No Login Required)
router.get("/public-track/:trackingNumber", getPublicTracking);

export default router;

import {
  getVehicleLocations,
  getVehicleDetails,
  getSamsaraConfig,
  setSamsaraApiKey,
} from "../services/samsara.service.js";
import {
  optimizeLtlRoute,
  transmitRouteToDriver,
} from "../services/aiRouteOptimizer.service.js";
import { hosSimulatorService } from "../services/hosSimulator.service.js";
import { iftaService } from "../services/ifta.service.js";
import { geofenceService } from "../services/geofence.service.js";

// GET Samsara connection config
export const getTelematicsConfig = (req, res) => {
  res.json({ success: true, config: getSamsaraConfig() });
};

// POST Save Samsara API Key
export const saveTelematicsConfig = (req, res) => {
  const { apiKey } = req.body;
  if (apiKey) setSamsaraApiKey(apiKey);
  res.json({
    success: true,
    message: "Samsara API token updated successfully",
    config: getSamsaraConfig(),
  });
};

// GET Live Fleet GPS & Telemetry
export const getFleetLocations = async (req, res) => {
  try {
    const data = await getVehicleLocations();
    res.json(data);
  } catch (error) {
    console.error("Telematics Controller Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch fleet telematics" });
  }
};

// GET Single Vehicle Telemetry
export const getSingleVehicle = async (req, res) => {
  try {
    const { truckNumber } = req.params;
    const data = await getVehicleDetails(truckNumber);
    if (!data.success) {
      return res.status(404).json(data);
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST Optimize LTL Route & Calculate Tolls / Fuel Savings
export const optimizeRoutePlan = async (req, res) => {
  try {
    const {
      origin,
      destination,
      stops,
      cargoWeightLbs,
      palletCount,
      trailerType,
      dieselPricePerGallon,
      assignedTruckNumber,
      assignedDriverName,
    } = req.body;

    const result = await optimizeLtlRoute({
      origin,
      destination,
      stops: stops || [],
      cargoWeightLbs: cargoWeightLbs || 32000,
      palletCount: palletCount || 16,
      trailerType: trailerType || "Dry Van 53ft",
      dieselPricePerGallon: dieselPricePerGallon || 3.85,
      assignedTruckNumber,
      assignedDriverName,
    });

    res.json(result);
  } catch (error) {
    console.error("Route Optimization Error:", error);
    res.status(500).json({ success: false, message: "Failed to optimize route" });
  }
};

// POST Transmit Route directly to Driver's Samsara In-Cab ELD Tablet & Phone
export const transmitRouteDispatch = async (req, res) => {
  try {
    const {
      driverName,
      driverPhone,
      truckNumber,
      routeType,
      totalMiles,
      estimatedHours,
      turnByTurnSteps,
      customsBarcode,
    } = req.body;

    const result = await transmitRouteToDriver({
      driverName,
      driverPhone,
      truckNumber,
      routeType,
      totalMiles,
      estimatedHours,
      turnByTurnSteps,
      customsBarcode,
    });

    res.json(result);
  } catch (error) {
    console.error("Transmit Route Error:", error);
    res.status(500).json({ success: false, message: "Failed to transmit route to driver" });
  }
};

// POST Simulate HOS Trip Feasibility
export const simulateHosTrip = async (req, res) => {
  try {
    const {
      totalDistanceMiles,
      estimatedDurationHours,
      assignedDriver,
      currentDriveRemainingHours,
      currentShiftRemainingHours,
      country,
    } = req.body;

    const simulation = hosSimulatorService.simulateTripFeasibility({
      totalDistanceMiles,
      estimatedDurationHours,
      assignedDriver,
      currentDriveRemainingHours,
      currentShiftRemainingHours,
      country,
    });

    res.json(simulation);
  } catch (error) {
    console.error("HOS Simulator Error:", error);
    res.status(500).json({ success: false, message: "Failed to simulate HOS feasibility" });
  }
};

// POST Calculate IFTA State/Province Mileage Breakdown
export const calculateIfta = async (req, res) => {
  try {
    const {
      totalDistanceMiles,
      fleetAvgMpg,
      purchasedFuelGallons,
      originState,
      destinationState,
      intermediateStates,
    } = req.body;

    const breakdown = iftaService.calculateIftaBreakdown({
      totalDistanceMiles,
      fleetAvgMpg,
      purchasedFuelGallons,
      originState,
      destinationState,
      intermediateStates,
    });

    res.json(breakdown);
  } catch (error) {
    console.error("IFTA Calculation Error:", error);
    res.status(500).json({ success: false, message: "Failed to calculate IFTA breakdown" });
  }
};

// GET Geofence Alerts
export const getGeofenceAlerts = async (req, res) => {
  try {
    const alerts = await geofenceService.getRecentGeofenceAlerts();
    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get geofence alerts" });
  }
};

// GET Public Tracking Data (No Login Required)
export const getPublicTracking = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    // Live tracking payload with current tractor GPS telemetry
    const fleetData = await getVehicleLocations();
    const liveVehicle = fleetData?.vehicles?.[0] || {
      name: "Tractor TRK-104 (Nishan Fleet)",
      lat: 44.2312,
      lng: -76.486,
      speedMph: 63,
      fuelLevelPercent: 82,
      status: "DRIVING",
      heading: "Westbound ON-401"
    };

    const trackingPayload = {
      success: true,
      loadNumber: trackingNumber || "NIS-1001",
      customerName: "AeroParts Global Aerospace Inc.",
      status: "IN_TRANSIT",
      origin: {
        facility: "AeroParts Toronto Production Plant",
        address: "150 Industrial Pkwy, Sector 4, Toronto, ON",
        lat: 43.6532,
        lng: -79.3832,
        departedAt: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString()
      },
      destination: {
        facility: "Midwest Air Cargo Distribution Center",
        address: "740 Logistics Way, Dock 12, Chicago, IL",
        lat: 41.8781,
        lng: -87.6298,
        projectedArrival: new Date(Date.now() + 4.5 * 3600 * 1000).toISOString()
      },
      currentPosition: {
        lat: liveVehicle.lat || 44.2312,
        lng: liveVehicle.lng || -76.486,
        corridor: "Highway 401 Westbound • Mile Marker 614",
        speedMph: liveVehicle.speedMph || 62,
        fuelPercent: liveVehicle.fuelLevelPercent || 84,
        lastUpdated: new Date().toISOString()
      },
      powerUnit: {
        tractorNumber: liveVehicle.name || "TRK-104 (Freightliner Cascadia)",
        trailerNumber: "TRL-5301 (53ft High-Cube Air-Ride)",
        driverName: "Marcus Vance (Lead Commercial Driver)",
        carrier: "Nishan Transport / Ozack Logistics"
      },
      customs: {
        papsNumber: "NISD001000",
        portOfEntry: "Windsor-Detroit Ambassador Bridge",
        status: "ACE eManifest Pre-Arrival Cleared"
      },
      freight: {
        commodity: "Aerospace Precision Turbine Spares",
        weightLbs: 34200,
        pallets: 18,
        temperature: "Ambient (Dry Van)"
      },
      milestones: [
        { title: "Electronic Rate Con Dispatched", time: "06:00 EST", completed: true },
        { title: "Driver Arrived at Shipper Dock (Toronto)", time: "07:15 EST", completed: true },
        { title: "Loaded & BOL Signed Electronically", time: "08:30 EST", completed: true },
        { title: "Departed Origin & En Route to US Border", time: "09:00 EST", completed: true },
        { title: "US CBP ACE Customs Pre-Arrival Green-Light", time: "11:20 EST", completed: true },
        { title: "Port of Entry Crossing & Clearance", time: "Est. 13:45 EST", completed: false },
        { title: "Consignee Dock Delivery (Chicago, IL)", time: "Est. 16:30 CST", completed: false }
      ]
    };

    res.json(trackingPayload);
  } catch (error) {
    console.error("Public Tracking Error:", error);
    res.status(500).json({ success: false, message: "Tracking record not found" });
  }
};

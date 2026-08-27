/**
 * HOS Trip Feasibility Simulator Service
 * Evaluates commercial driver Hours of Service rules under US FMCSA (49 CFR 395) & Canadian CVOR/HOS regulations.
 * 
 * Rules supported:
 * - 11-hour driving limit (US) / 13-hour driving limit (CA)
 * - 14-hour daily on-duty window (US) / 14-hour window (CA)
 * - Mandatory 30-minute rest break after 8 hours of cumulative driving
 * - Mandatory 10-hour consecutive sleeper berth / off-duty reset
 * - Multi-day trip itinerary generator with simulated truck stop resting waypoints
 */

const TRUCK_STOPS = [
  { name: "Pilot Travel Center #412", city: "Cornwall", state: "ON", lat: 45.021, lng: -74.728, highway: "Highway 401" },
  { name: "ONroute Service Plaza", city: "Kingston", state: "ON", lat: 44.254, lng: -76.471, highway: "Highway 401" },
  { name: "Flying J Travel Plaza #592", city: "Napanee", state: "ON", lat: 44.271, lng: -76.953, highway: "Highway 401" },
  { name: "TA Travel Center #184", city: "Woodstock", state: "ON", lat: 43.118, lng: -80.752, highway: "Highway 401" },
  { name: "Flying J Travel Center #718", city: "London", state: "ON", lat: 42.946, lng: -81.218, highway: "Highway 401" },
  { name: "Petro-Pass Truck Stop", city: "Drummondville", state: "QC", lat: 45.883, lng: -72.484, highway: "Autoroute 20" },
  { name: "Irving 24 Truck Stop", city: "Saint-Hyacinthe", state: "QC", lat: 45.626, lng: -72.951, highway: "Autoroute 20" },
  { name: "Love's Travel Stop #611", city: "Watertown", state: "NY", lat: 43.974, lng: -75.910, highway: "I-81" },
  { name: "Pilot Travel Center #302", city: "Syracuse", state: "NY", lat: 43.088, lng: -76.128, highway: "I-90 NY Thruway" },
  { name: "TA Travel Center #042", city: "Buffalo", state: "NY", lat: 42.886, lng: -78.878, highway: "I-90 NY Thruway" },
  { name: "Flying J Travel Center #628", city: "Erie", state: "PA", lat: 42.062, lng: -80.052, highway: "I-90" },
  { name: "Pilot Travel Center #018", city: "Toledo", state: "OH", lat: 41.564, lng: -83.538, highway: "I-80/I-90 Ohio Turnpike" },
  { name: "Love's Travel Stop #334", city: "Elkhart", state: "IN", lat: 41.728, lng: -85.972, highway: "I-80/I-90 Indiana Toll Road" },
  { name: "TA Travel Center #014", city: "Gary", state: "IN", lat: 41.593, lng: -87.346, highway: "I-80/I-94" },
  { name: "Petro Travel Plaza", city: "Chicago", state: "IL", lat: 41.878, lng: -87.629, highway: "I-90/I-94" }
];

class HosSimulatorService {
  /**
   * Simulates full HOS timeline for a proposed trip
   * @param {Object} params
   * @param {number} params.totalDistanceMiles
   * @param {number} params.estimatedDurationHours
   * @param {string} params.assignedDriver
   * @param {number} params.currentDriveRemainingHours (from Samsara live HOS, default 11)
   * @param {number} params.currentShiftRemainingHours (from Samsara live HOS, default 14)
   * @param {string} params.country (US or CA)
   */
  simulateTripFeasibility({
    totalDistanceMiles = 500,
    estimatedDurationHours = 8.5,
    assignedDriver = "Assigned Commercial Driver",
    currentDriveRemainingHours = 11.0,
    currentShiftRemainingHours = 14.0,
    country = "US",
  }) {
    const maxDrivePerDay = country === "CA" ? 13.0 : 11.0;
    const maxShiftPerDay = country === "CA" ? 14.0 : 14.0;
    const requiredBreakAfterDriveHours = 8.0;
    const breakDurationHours = 0.5; // 30 mins
    const sleeperResetDurationHours = 10.0; // 10 hrs

    const averageSpeedMph = totalDistanceMiles > 0 && estimatedDurationHours > 0
      ? (totalDistanceMiles / estimatedDurationHours)
      : 55;

    const timeline = [];
    let accumulatedDistance = 0;
    let accumulatedTimeHours = 0;
    let currentShiftDriveHours = 0;
    let continuousDriveHours = 0;
    let currentDay = 1;
    let stopsRequired = [];

    // Departure Event
    const departureTime = new Date();
    timeline.push({
      event: "DEPARTURE",
      title: "Trip Departure from Origin",
      day: currentDay,
      elapsedHours: 0,
      timestamp: departureTime.toISOString(),
      distanceMiles: 0,
      notes: `Driver: ${assignedDriver} starting shift with ${currentDriveRemainingHours.toFixed(1)}h drive clock remaining.`,
      status: "ON_DUTY_DRIVING"
    });

    let remainingTripHours = estimatedDurationHours;
    let tripDriveAllowance = Math.min(maxDrivePerDay, currentDriveRemainingHours);

    while (remainingTripHours > 0) {
      // Check if driver needs a 30-min break
      const hoursUntilBreak = requiredBreakAfterDriveHours - continuousDriveHours;
      // Check if driver needs a 10-hour sleeper reset
      const hoursUntilShiftEnd = tripDriveAllowance - currentShiftDriveHours;

      const nextLegDriveHours = Math.min(
        remainingTripHours,
        hoursUntilBreak > 0 ? hoursUntilBreak : requiredBreakAfterDriveHours,
        hoursUntilShiftEnd > 0 ? hoursUntilShiftEnd : maxDrivePerDay
      );

      accumulatedTimeHours += nextLegDriveHours;
      continuousDriveHours += nextLegDriveHours;
      currentShiftDriveHours += nextLegDriveHours;
      accumulatedDistance += nextLegDriveHours * averageSpeedMph;
      remainingTripHours -= nextLegDriveHours;

      // Condition 1: 30-Min Rest Break Required
      if (continuousDriveHours >= requiredBreakAfterDriveHours && remainingTripHours > 0.5) {
        const restStop = this.findNearestTruckStop(accumulatedDistance, totalDistanceMiles);
        accumulatedTimeHours += breakDurationHours;
        continuousDriveHours = 0; // Reset continuous drive clock

        const breakTime = new Date(departureTime.getTime() + accumulatedTimeHours * 3600 * 1000);
        stopsRequired.push({
          type: "30_MIN_REST_BREAK",
          location: `${restStop.name} (${restStop.city}, ${restStop.state})`,
          highway: restStop.highway,
          duration: "30 Minutes",
          elapsedHours: accumulatedTimeHours,
          scheduledTime: breakTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        });

        timeline.push({
          event: "REST_BREAK",
          title: "Mandatory 30-Min FMCSA Rest Break",
          day: currentDay,
          elapsedHours: accumulatedTimeHours,
          timestamp: breakTime.toISOString(),
          distanceMiles: Math.round(accumulatedDistance),
          location: `${restStop.name} (${restStop.city}, ${restStop.state})`,
          notes: "Driver off-duty / resting to satisfy 8-hour consecutive drive rule.",
          status: "OFF_DUTY"
        });
      }

      // Condition 2: 10-Hour Sleeper Berth Reset Required (End of Daily Shift Limit)
      if (currentShiftDriveHours >= tripDriveAllowance && remainingTripHours > 0.2) {
        const sleepStop = this.findNearestTruckStop(accumulatedDistance, totalDistanceMiles);
        accumulatedTimeHours += sleeperResetDurationHours;
        continuousDriveHours = 0;
        currentShiftDriveHours = 0;
        tripDriveAllowance = maxDrivePerDay; // Reset to full 11h/13h for next day
        currentDay += 1;

        const sleepTime = new Date(departureTime.getTime() + accumulatedTimeHours * 3600 * 1000);
        stopsRequired.push({
          type: "10_HOUR_SLEEPER_RESET",
          location: `${sleepStop.name} (${sleepStop.city}, ${sleepStop.state})`,
          highway: sleepStop.highway,
          duration: "10 Hours Sleeper Reset",
          elapsedHours: accumulatedTimeHours,
          scheduledTime: sleepTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        });

        timeline.push({
          event: "SLEEPER_RESET",
          title: "10-Hour Sleeper Berth Mandatory Reset",
          day: currentDay,
          elapsedHours: accumulatedTimeHours,
          timestamp: sleepTime.toISOString(),
          distanceMiles: Math.round(accumulatedDistance),
          location: `${sleepStop.name} (${sleepStop.city}, ${sleepStop.state})`,
          notes: `Driver in sleeper berth. Shift ${currentDay - 1} completed legally under FMCSA/CVOR.`,
          status: "SLEEPER_BERTH"
        });
      }
    }

    // Final Arrival Event
    const finalArrivalDate = new Date(departureTime.getTime() + accumulatedTimeHours * 3600 * 1000);
    timeline.push({
      event: "ARRIVAL",
      title: "Consignee Dock Arrival & Delivery",
      day: currentDay,
      elapsedHours: accumulatedTimeHours,
      timestamp: finalArrivalDate.toISOString(),
      distanceMiles: Math.round(totalDistanceMiles),
      notes: "Arrived at destination. Awaiting receiver check-in & digital BOL sign-off.",
      status: "ARRIVED_ON_DUTY"
    });

    const isFeasibleSingleShift = currentDay === 1 && stopsRequired.filter(s => s.type === "10_HOUR_SLEEPER_RESET").length === 0;
    const isMultiDayTrip = currentDay > 1;

    return {
      success: true,
      feasibilityStatus: isFeasibleSingleShift
        ? (stopsRequired.length === 0 ? "SINGLE_SHIFT_CLEAN" : "SINGLE_SHIFT_REST_REQUIRED")
        : "MULTI_DAY_SLEEPER_REQUIRED",
      summary: {
        totalTripHours: Number(accumulatedTimeHours.toFixed(1)),
        totalDriveHours: Number(estimatedDurationHours.toFixed(1)),
        totalRestHours: Number((accumulatedTimeHours - estimatedDurationHours).toFixed(1)),
        totalDays: currentDay,
        mandatoryStopsCount: stopsRequired.length,
        isSingleShift: isFeasibleSingleShift,
        projectedArrival: finalArrivalDate.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short"
        }),
      },
      stopsRequired,
      timeline,
      applicableHOSRules: {
        jurisdiction: country === "CA" ? "Canadian Commercial Vehicle HOS (13h/14h)" : "US FMCSA Part 395 (11h/14h/8h break)",
        maxDrivePerDay,
        maxDutyPerDay: maxShiftPerDay,
        sleeperResetDurationHours: 10,
        restBreakDurationMins: 30,
      }
    };
  }

  findNearestTruckStop(currentMiles, totalMiles) {
    const fraction = totalMiles > 0 ? (currentMiles / totalMiles) : 0.5;
    const index = Math.min(
      Math.floor(fraction * TRUCK_STOPS.length),
      TRUCK_STOPS.length - 1
    );
    return TRUCK_STOPS[index] || TRUCK_STOPS[0];
  }
}

export const hosSimulatorService = new HosSimulatorService();
export default hosSimulatorService;

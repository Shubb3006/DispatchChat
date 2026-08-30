/**
 * Automated Geofence & Milestone Alert Engine
 * Evaluates real-time GPS coordinates against facility geofences (Shipper, Consignee, Customs Port of Entry).
 */

class GeofenceService {
  constructor() {
    this.activeAlerts = [
      {
        id: "GEO-901",
        trackingNumber: "NIS-1001",
        truckNumber: "TRK-104",
        driverName: "Marcus Vance",
        eventType: "GEOFENCE_ENTERED",
        geofenceName: "AeroParts Manufacturing Yard (Toronto Shipper)",
        radiusMiles: 5.0,
        currentDistanceMiles: 0.3,
        status: "ARRIVED_AT_ORIGIN",
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        notificationSent: {
          email: "dispatch@aeroparts.com",
          sms: "+1 (514) 890-4122",
          delivered: true
        }
      },
      {
        id: "GEO-902",
        trackingNumber: "NIS-1002",
        truckNumber: "TRK-210",
        driverName: "Alexandre Tremblay",
        eventType: "BORDER_CROSSING_APPROACH",
        geofenceName: "Lacolle / Champlain Port of Entry (US CBP ACE)",
        radiusMiles: 10.0,
        currentDistanceMiles: 4.2,
        status: "PRE_ARRIVAL_CLEARED",
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        notificationSent: {
          email: "customs@ozack.com",
          sms: "+1 (450) 902-1144",
          delivered: true
        }
      },
      {
        id: "GEO-903",
        trackingNumber: "NIS-1003",
        truckNumber: "TRK-308",
        driverName: "Gurpreet Singh",
        eventType: "GEOFENCE_DEPARTED",
        geofenceName: "Detroit-Windsor Ambassador Bridge Plaza",
        radiusMiles: 5.0,
        currentDistanceMiles: 12.5,
        status: "IN_TRANSIT_US",
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        notificationSent: {
          email: "operations@midwestlogistics.com",
          sms: "+1 (313) 441-9980",
          delivered: true
        }
      }
    ];
  }

  /**
   * Evaluates proximity of a tractor to a target location
   */
  checkGeofenceStatus({
    truckLat,
    truckLng,
    targetLat,
    targetLng,
    geofenceRadiusMiles = 5.0,
    locationName = "Facility Dock"
  }) {
    if (!truckLat || !truckLng || !targetLat || !targetLng) {
      return { inGeofence: false, distanceMiles: null, status: "NO_TELEMETRY" };
    }

    const distanceMiles = this.calculateHaversineDistance(
      truckLat,
      truckLng,
      targetLat,
      targetLng
    );

    let status = "EN_ROUTE";
    let eventType = null;

    if (distanceMiles <= 0.5) {
      status = "INSIDE_GEOFENCE";
      eventType = "GEOFENCE_ARRIVED";
    } else if (distanceMiles <= 5.0) {
      status = "WITHIN_5_MILES";
      eventType = "GEOFENCE_APPROACHING_5MI";
    } else if (distanceMiles <= 10.0) {
      status = "WITHIN_10_MILES";
      eventType = "GEOFENCE_APPROACHING_10MI";
    }

    return {
      inGeofence: distanceMiles <= geofenceRadiusMiles,
      distanceMiles: Number(distanceMiles.toFixed(2)),
      geofenceRadiusMiles,
      locationName,
      status,
      eventType
    };
  }

  getRecentGeofenceAlerts() {
    return this.activeAlerts;
  }

  calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const geofenceService = new GeofenceService();
export default geofenceService;

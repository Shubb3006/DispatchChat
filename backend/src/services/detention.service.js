/**
 * Detention Time & Accessorial Revenue Service
 * Automatically tracks facility geofence dwell times against free-time thresholds (default 2 hours).
 * Calculates billable detention rates ($75/hr), layover, TONU ($150 flat fee), and generates invoices.
 */

class DetentionService {
  constructor() {
    this.activeDwellEvents = [
      {
        id: "DET-101",
        loadNumber: "NIS-1001",
        truckNumber: "TRK-104",
        driverName: "Marcus Vance",
        customerName: "AeroParts Global Aerospace",
        facilityName: "AeroParts Toronto Production Plant",
        facilityType: "SHIPPER_ORIGIN",
        geofenceArrival: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(),
        freeTimeHours: 2.0,
        dwellHours: 3.5,
        billableHours: 1.5,
        hourlyRate: 75.0,
        detentionAmountDue: 112.50,
        status: "BILLABLE_ACTIVE",
        warningLevel: "RED_OVERDUE",
        gpsCoordinates: { lat: 43.6532, lng: -79.3832 },
        driverNote: "Dock door 4 blocked by local distributor truck. Loading delayed."
      },
      {
        id: "DET-102",
        loadNumber: "NIS-1004",
        truckNumber: "TRK-210",
        driverName: "Alexandre Tremblay",
        customerName: "Metro Fresh Foods Cold-Chain",
        facilityName: "Metro Cold Storage Logistics Hub (Montreal)",
        facilityType: "CONSIGNEE_DOCK",
        geofenceArrival: new Date(Date.now() - 1.75 * 3600 * 1000).toISOString(),
        freeTimeHours: 2.0,
        dwellHours: 1.75,
        billableHours: 0.0,
        hourlyRate: 75.0,
        detentionAmountDue: 0.0,
        status: "WARNING_APPROACHING_LIMIT",
        warningLevel: "YELLOW_WARNING",
        gpsCoordinates: { lat: 45.4956, lng: -73.7428 },
        driverNote: "Unloading pallet rows 1-8. Awaiting receiver inspection stamp."
      },
      {
        id: "DET-103",
        loadNumber: "NIS-1008",
        truckNumber: "TRK-308",
        driverName: "Gurpreet Singh",
        customerName: "Midwest Steel Coil Distribution",
        facilityName: "Detroit Industrial Steel Processing",
        facilityType: "RECEIVER_DOCK",
        geofenceArrival: new Date(Date.now() - 0.75 * 3600 * 1000).toISOString(),
        freeTimeHours: 2.0,
        dwellHours: 0.75,
        billableHours: 0.0,
        hourlyRate: 75.0,
        detentionAmountDue: 0.0,
        status: "WITHIN_FREE_TIME",
        warningLevel: "GREEN_NORMAL",
        gpsCoordinates: { lat: 42.3314, lng: -83.0458 },
        driverNote: "Backed into dock door 2. Unloading started."
      }
    ];

    this.completedClaims = [
      {
        id: "CLAIM-801",
        loadNumber: "NIS-0988",
        invoiceNumber: "INV-DET-801",
        customerName: "C.H. Robinson Brokerage",
        facilityName: "Walmart Distribution Center (Bentonville, AR)",
        date: "2026-02-18",
        type: "Detention Dwell",
        totalDwellHours: 4.5,
        freeTimeHours: 2.0,
        billableHours: 2.5,
        rate: 75.0,
        totalClaimAmount: 187.50,
        status: "APPROVED_PAID",
        gpsProofAttached: true
      },
      {
        id: "CLAIM-802",
        loadNumber: "NIS-0974",
        invoiceNumber: "INV-DET-802",
        customerName: "TQL Freight",
        facilityName: "Automotive Stamping Yard (Cleveland, OH)",
        date: "2026-02-15",
        type: "Detention Dwell",
        totalDwellHours: 5.0,
        freeTimeHours: 2.0,
        billableHours: 3.0,
        rate: 75.0,
        totalClaimAmount: 225.00,
        status: "PENDING_BROKER_REVIEW",
        gpsProofAttached: true
      },
      {
        id: "CLAIM-803",
        loadNumber: "NIS-0960",
        invoiceNumber: "INV-TONU-803",
        customerName: "Echo Global Logistics",
        facilityName: "Chicago Packaging Corp",
        date: "2026-02-12",
        type: "TONU (Truck Ordered Not Used)",
        totalDwellHours: 0,
        freeTimeHours: 0,
        billableHours: 0,
        rate: 0,
        totalClaimAmount: 150.00,
        status: "APPROVED_PAID",
        gpsProofAttached: true
      }
    ];
  }

  getActiveDwellEvents() {
    return this.activeDwellEvents;
  }

  getCompletedClaims() {
    return this.completedClaims;
  }

  generateDetentionInvoice({ loadNumber, dwellHours, hourlyRate = 75.0, freeTimeHours = 2.0, customerName, facilityName }) {
    const billableHours = Math.max(0, Number((dwellHours - freeTimeHours).toFixed(1)));
    const totalAmount = Number((billableHours * hourlyRate).toFixed(2));
    const invoiceId = `INV-DET-${Date.now().toString().slice(-4)}`;

    const newClaim = {
      id: `CLAIM-${Date.now().toString().slice(-4)}`,
      loadNumber,
      invoiceNumber: invoiceId,
      customerName: customerName || "Freight Customer / Broker",
      facilityName: facilityName || "Shipper / Receiver Facility",
      date: new Date().toISOString().split("T")[0],
      totalDwellHours: dwellHours,
      freeTimeHours,
      billableHours,
      rate: hourlyRate,
      totalClaimAmount: totalAmount,
      status: "PENDING_BROKER_REVIEW",
      gpsProofAttached: true,
      generatedAt: new Date().toISOString()
    };

    this.completedClaims.unshift(newClaim);
    return {
      success: true,
      claim: newClaim,
      message: `Detention Accessorial Invoice ${invoiceId} generated for $${totalAmount} CAD.`
    };
  }
}

export const detentionService = new DetentionService();
export default detentionService;

export type Role = 
  | 'dispatcher' 
  | 'driver' 
  | 'safety' 
  | 'invoicing' 
  | 'customer' 
  | 'reporting' 
  | 'hr'
  | 'data_entry'
  | 'customs'
  | 'driver_manager';

export type UserRole = 
  | 'super_admin' 
  | 'admin' 
  | 'dispatcher' 
  | 'driver_manager' 
  | 'customs' 
  | 'safety' 
  | 'data_entry' 
  | 'invoicing'
  | 'driver'
  | 'customer';

export interface AppUser {
  id: string;
  name: string;
  first_name:string
  username: string;
  password?: string;
  role: UserRole;
  allowedModules: Role[];
  createdAt: string;
}

export type LoadStatus = 'pending' | 'dispatched' | 'in_transit' | 'delayed' | 'arrived' | 'delivered';

export type BorderConnectStatus = 'none' | 'draft' | 'submitted' | 'accepted' | 'rejected' | 'at_border' | 'released';

export interface Waypoint {
  id: string;
  address: string;
  lat: number;
  lng: number;
  stopType: 'pickup' | 'delivery' | 'border_crossing';
  companyName: string;
  sequence: number;
  status: 'pending' | 'arrived' | 'completed';
  scheduledTime: string;
  actualTime?: string;
  weight?: number; // LTL
  pieces?: number; // LTL
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  customerName: string;
  customerEmail: string;
  dispatcherName?: string;
  broker?: string;
  poNumber?: string;
  bolNumber?: string;
  status: LoadStatus;
  driverId: string;
  driverName: string;
  truckNumber: string;
  trailerNumber: string;
  originCity: string;
  destinationCity: string;
  waypoints: Waypoint[];
  borderConnectManifestId?: string;
  borderConnectStatus: BorderConnectStatus;
  samsaraGatewayId?: string;
  speedMph?: number;
  fuelLevelPercent?: number;
  engineTempF?: number;
  activeHOSStatus?: 'off_duty' | 'on_duty' | 'driving' | 'sleeper';
  eta: string;
  cargoDescription: string;
  weightLbs: number;
  palletCount: number;
  totalDistanceMiles: number;
  costEstimate: number;
  priceInvoice: number;
  documentIds: string[];
  loadType?: 'LTL' | 'FTL';
  tripId?: string;
  deliveryCommitment?: 'normal' | 'guaranteed' | 'appointment' | 'guaranteed_appointment';
  commitmentDate?: string;
  commitmentTime?: string;
  shipperName?: string;
  shipperAddress?: string;
  shipperPhone?: string;
  consigneeName?: string;
  consigneeAddress?: string;
  consigneePhone?: string;
  customerPhone?: string;
  customerAddress?: string;
  driverNotes?: string;
  priority?: 'standard' | 'high' | 'urgent';
}

export interface Trip {
  id: string;
  tripNumber: string;
  driverId: string;
  driverName: string;
  truckNumber: string;
  trailerNumber: string;
  status: 'pending' | 'dispatched' | 'in_transit' | 'completed';
  shipmentIds: string[];
  totalWeightLbs: number;
  totalPallets: number;
  createdAt: string;
}

export interface Message {
  id: string;
  senderRole: Role;
  senderName: string;
  recipientId: string;
  recipientName: string;
  content: string;
  timestamp: string;
  read: boolean;
  shipmentId?: string;
  attachment?: {
    type: 'photo' | 'document';
    url: string;
    name: string;
    size?: string;
  };
}

export interface SafetyIncident {
  id: string;
  driverId: string;
  driverName: string;
  truckNumber: string;
  timestamp: string;
  type: 'speeding' | 'hard_braking' | 'hos_violation' | 'unauthorized_stop' | 'harsh_turn' | 'emergency_sos';
  severity: 'low' | 'medium' | 'high';
  description: string;
  location: string;
  status: 'pending_review' | 'under_investigation' | 'resolved';
}

export interface DriverSafetyScore {
  driverId: string;
  driverName: string;
  score: number; // 0-100
  totalMiles: number;
  totalViolations: number;
  hosCompliancePercent: number;
}

export interface LogisticsDocument {
  id: string;
  shipmentId: string;
  trackingNumber: string;
  type: 'bol' | 'pod' | 'scale_ticket' | 'customs_receipt' | 'fuel_receipt' | 'skid_picture';
  fileName: string;
  fileSize: string;
  uploadedBy: string;
  uploadDate: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'matched_to_invoice';
  skidPictures?: string[];
  extractedData?: {
    shipperName?: string;
    consigneeName?: string;
    items?: string;
    weightLbs?: number;
    bolNumber?: string;
    purchaseOrder?: string;
    carrierName?: string;
    signatureFound?: boolean;
    confidence?: number;
    rawText?: string;
  };
}

export interface Invoice {
  id: string;
  shipmentId: string;
  trackingNumber: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  paymentTerms: string; // e.g. "Net 30"
  notes?: string;
}

export interface SamsaraHOSLog {
  driverId: string;
  driverName: string;
  currentStatus: 'OFF' | 'ON' | 'SB' | 'D';
  statusStartedAt: string;
  drivingSecondsRemaining: number; // Max 11 hours = 39600s
  dutySecondsRemaining: number; // Max 14 hours = 50400s
  cycleSecondsRemaining: number; // Max 70 hours = 252000s
  breakSecondsRemaining: number; // Max 8 hours before 30 min break
}

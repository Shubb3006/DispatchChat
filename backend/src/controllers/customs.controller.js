import pool from "../config/db.js";
import { recordAuditLog } from "../services/auditLogger.service.js";

// Standard US and Canadian Ports of Entry Reference List
export const PORTS_OF_ENTRY = [
  {
    code: "3801",
    name: "Detroit Ambassador Bridge",
    city: "Detroit, MI / Windsor, ON",
    country: "US",
    agency: "US CBP / CBSA",
    type: "Highway / Bridge",
    avgWaitMins: 15,
    fastLanes: true,
  },
  {
    code: "3802",
    name: "Port Huron Blue Water Bridge",
    city: "Port Huron, MI / Point Edward, ON",
    country: "US",
    agency: "US CBP / CBSA",
    type: "Highway / Bridge",
    avgWaitMins: 20,
    fastLanes: true,
  },
  {
    code: "0901",
    name: "Buffalo Peace Bridge",
    city: "Buffalo, NY / Fort Erie, ON",
    country: "US",
    agency: "US CBP / CBSA",
    type: "Highway / Bridge",
    avgWaitMins: 25,
    fastLanes: true,
  },
  {
    code: "0902",
    name: "Niagara Falls Lewiston-Queenston",
    city: "Lewiston, NY / Queenston, ON",
    country: "US",
    agency: "US CBP / CBSA",
    type: "Highway / Bridge",
    avgWaitMins: 10,
    fastLanes: true,
  },
  {
    code: "3004",
    name: "Blaine Pacific Highway",
    city: "Blaine, WA / Surrey, BC",
    country: "US",
    agency: "US CBP / CBSA",
    type: "Highway",
    avgWaitMins: 30,
    fastLanes: true,
  },
  {
    code: "0712",
    name: "Champlain - St. Bernard de Lacolle",
    city: "Champlain, NY / Lacolle, QC",
    country: "US",
    agency: "US CBP / CBSA",
    type: "Highway Interstate 87",
    avgWaitMins: 12,
    fastLanes: true,
  },
  {
    code: "3310",
    name: "Sweetgrass / Coutts",
    city: "Sweetgrass, MT / Coutts, AB",
    country: "US",
    agency: "US CBP / CBSA",
    type: "Highway Interstate 15",
    avgWaitMins: 8,
    fastLanes: true,
  },
  {
    code: "3401",
    name: "Pembina / Emerson",
    city: "Pembina, ND / Emerson, MB",
    country: "US",
    agency: "US CBP / CBSA",
    type: "Highway Interstate 29",
    avgWaitMins: 14,
    fastLanes: true,
  },
  {
    code: "2304",
    name: "Laredo World Trade Bridge",
    city: "Laredo, TX / Nuevo Laredo, MX",
    country: "US",
    agency: "US CBP / SAT",
    type: "Highway / Bridge",
    avgWaitMins: 45,
    fastLanes: true,
  },
  {
    code: "440",
    name: "Windsor Ambassador Bridge (CBSA)",
    city: "Windsor, ON",
    country: "CA",
    agency: "CBSA",
    type: "Highway",
    avgWaitMins: 15,
    fastLanes: true,
  },
  {
    code: "441",
    name: "Sarnia Blue Water Bridge (CBSA)",
    city: "Sarnia, ON",
    country: "CA",
    agency: "CBSA",
    type: "Highway",
    avgWaitMins: 20,
    fastLanes: true,
  },
  {
    code: "410",
    name: "Fort Erie Peace Bridge (CBSA)",
    city: "Fort Erie, ON",
    country: "CA",
    agency: "CBSA",
    type: "Highway",
    avgWaitMins: 25,
    fastLanes: true,
  },
  {
    code: "813",
    name: "Pacific Highway Crossing (CBSA)",
    city: "Surrey, BC",
    country: "CA",
    agency: "CBSA",
    type: "Highway",
    avgWaitMins: 30,
    fastLanes: true,
  }
];

// Comprehensive HTS (Harmonized Tariff Schedule) Reference Catalog
export const HTS_CATALOG = [
  // --- CHAPTER 87: Vehicles & Automotive Parts ---
  {
    hts_code: "8708.29.5060",
    description: "Stampings & body parts of motor vehicles (aluminum/steel body panels)",
    duty_rate_pct: 2.5,
    unit: "PCS",
    usmca_eligible: true,
    category: "Automotive (Ch. 87)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "8708.29.5080",
    description: "Other parts and accessories of bodies for motor vehicles",
    duty_rate_pct: 2.5,
    unit: "PCS",
    usmca_eligible: true,
    category: "Automotive (Ch. 87)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "8708.30.5030",
    description: "Mounted brake linings and disc brake pads for commercial trucks & autos",
    duty_rate_pct: 2.5,
    unit: "PCS",
    usmca_eligible: true,
    category: "Automotive (Ch. 87)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "8708.40.1110",
    description: "Gear boxes (transmissions) for commercial motor vehicles and trucks",
    duty_rate_pct: 2.5,
    unit: "UNITS",
    usmca_eligible: true,
    category: "Automotive (Ch. 87)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "8708.50.8100",
    description: "Drive-axles with differential, whether or not provided with other transmission components",
    duty_rate_pct: 2.5,
    unit: "PCS",
    usmca_eligible: true,
    category: "Automotive (Ch. 87)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "8708.70.4530",
    description: "Road wheels, parts and accessories for motor vehicles (alloy & steel wheels)",
    duty_rate_pct: 2.5,
    unit: "PCS",
    usmca_eligible: true,
    category: "Automotive (Ch. 87)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "8708.80.1600",
    description: "Suspension systems and parts thereof (including shock absorbers)",
    duty_rate_pct: 2.5,
    unit: "PCS",
    usmca_eligible: true,
    category: "Automotive (Ch. 87)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "8708.91.5000",
    description: "Radiators and parts thereof for tractors and motor vehicles",
    duty_rate_pct: 2.5,
    unit: "PCS",
    usmca_eligible: true,
    category: "Automotive (Ch. 87)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "8708.92.5000",
    description: "Mufflers and exhaust pipes for internal combustion engines",
    duty_rate_pct: 2.5,
    unit: "PCS",
    usmca_eligible: true,
    category: "Automotive (Ch. 87)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "8708.95.2000",
    description: "Safety airbags with inflator system and parts thereof",
    duty_rate_pct: 2.5,
    unit: "PCS",
    usmca_eligible: true,
    category: "Automotive (Ch. 87)",
    fda_required: false,
    is_hazmat: true
  },
  {
    hts_code: "8716.39.0090",
    description: "Trailers and semi-trailers for the transport of goods (Dry vans, flatbeds, reefers)",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    category: "Automotive & Trailers (Ch. 87)",
    fda_required: false,
    is_hazmat: false
  },

  // --- CHAPTER 84: Machinery, Engines & Mechanical Appliances ---
  {
    hts_code: "8471.30.0100",
    description: "Portable automatic data processing machines, laptops, tablets & micro-servers",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    category: "Machinery & Computers (Ch. 84)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "8471.50.0150",
    description: "Server processing units and industrial automation rack computers",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    category: "Machinery & Computers (Ch. 84)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "8413.30.9030",
    description: "Fuel, lubricating or cooling medium pumps for internal combustion engines",
    duty_rate_pct: 2.5,
    unit: "PCS",
    usmca_eligible: true,
    category: "Machinery & Pumps (Ch. 84)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "8414.80.1685",
    description: "Air and gas compressors, stationary and mobile industrial compressors",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    category: "Machinery & Equipment (Ch. 84)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "8481.80.9050",
    description: "Taps, cocks, valves and similar appliances for pipes, boiler shells & tanks",
    duty_rate_pct: 2.0,
    unit: "PCS",
    usmca_eligible: true,
    category: "Machinery & Valves (Ch. 84)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "8482.10.5028",
    description: "Ball bearings, radial ball bearings and mounted industrial precision bearings",
    duty_rate_pct: 9.0,
    unit: "PCS",
    usmca_eligible: true,
    category: "Machinery & Bearings (Ch. 84)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "8483.40.5010",
    description: "Gears and gearing, ball or roller screws; gear boxes and speed changers",
    duty_rate_pct: 2.5,
    unit: "PCS",
    usmca_eligible: true,
    category: "Machinery & Power Trans (Ch. 84)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "8428.39.0000",
    description: "Continuous-action elevators and conveyors for goods or materials (Warehouse logistics systems)",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    category: "Machinery & Conveyors (Ch. 84)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "8457.10.0050",
    description: "Machining centers for working metal, multi-axis CNC milling centers",
    duty_rate_pct: 4.2,
    unit: "UNITS",
    usmca_eligible: true,
    category: "Machinery & CNC (Ch. 84)",
    fda_required: false,
    is_hazmat: false
  },

  // --- CHAPTER 85: Electrical & Electronic Equipment ---
  {
    hts_code: "8501.32.2000",
    description: "Electric motors and generators (DC motors of an output exceeding 750 W but not exceeding 75 kW)",
    duty_rate_pct: 2.8,
    unit: "UNITS",
    usmca_eligible: true,
    category: "Electrical Equipment (Ch. 85)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "8504.40.9580",
    description: "Static converters; power supplies for automatic data processing machines & inverters",
    duty_rate_pct: 0.0,
    unit: "PCS",
    usmca_eligible: true,
    category: "Electrical Equipment (Ch. 85)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "8507.60.0000",
    description: "Lithium-ion batteries and battery modules for EV & industrial energy storage",
    duty_rate_pct: 3.4,
    unit: "UNITS",
    usmca_eligible: true,
    category: "Electrical & Batteries (Ch. 85)",
    fda_required: false,
    is_hazmat: true
  },
  {
    hts_code: "8517.62.0050",
    description: "Machines for the reception, conversion and transmission or regeneration of voice, images or other data (Network switches & routers)",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    category: "Electronics & Telecom (Ch. 85)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "8534.00.0020",
    description: "Printed circuits (Multilayer PCB electronic boards)",
    duty_rate_pct: 0.0,
    unit: "PCS",
    usmca_eligible: true,
    category: "Electronics & PCBs (Ch. 85)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "8544.30.0000",
    description: "Ignition wiring sets and other wiring sets of a kind used in vehicles, aircraft or ships (Automotive wiring harnesses)",
    duty_rate_pct: 5.0,
    unit: "KG",
    usmca_eligible: true,
    category: "Electrical & Wiring (Ch. 85)",
    fda_required: false,
    is_hazmat: false
  },

  // --- CHAPTER 73 & 76: Iron, Steel & Aluminum Fasteners and Structural Metal ---
  {
    hts_code: "7318.15.2095",
    description: "Screws and bolts of iron or steel, with hex heads, Grade 5 and Grade 8 industrial fasteners",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    category: "Metals & Fasteners (Ch. 73)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "7318.16.0085",
    description: "Nuts of iron or steel, hex nuts and lock nuts",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    category: "Metals & Fasteners (Ch. 73)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "7326.90.8688",
    description: "Other articles of iron or steel, forged or stamped, industrial fabricated fittings",
    duty_rate_pct: 2.9,
    unit: "KG",
    usmca_eligible: true,
    category: "Metals & Fabrication (Ch. 73)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "7606.12.3090",
    description: "Aluminum plates, sheets and strip, of a thickness exceeding 0.2 mm (Aluminum alloy sheets)",
    duty_rate_pct: 3.0,
    unit: "KG",
    usmca_eligible: true,
    category: "Aluminum (Ch. 76)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "7604.29.1000",
    description: "Aluminum alloy bars, rods and profiles, structural architectural extrusions",
    duty_rate_pct: 5.0,
    unit: "KG",
    usmca_eligible: true,
    category: "Aluminum (Ch. 76)",
    fda_required: false,
    is_hazmat: false
  },

  // --- CHAPTER 39: Plastics, Polymers & Resins ---
  {
    hts_code: "3923.10.0000",
    description: "Boxes, cases, crates and similar articles for the conveyance or packing of goods, of plastics",
    duty_rate_pct: 3.0,
    unit: "KG",
    usmca_eligible: true,
    category: "Plastics & Packaging (Ch. 39)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "3923.90.0080",
    description: "Plastic packaging pallets, heavy-duty reusable bulk containers and dunnage",
    duty_rate_pct: 3.0,
    unit: "PCS",
    usmca_eligible: true,
    category: "Plastics & Logistics (Ch. 39)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "3901.10.5000",
    description: "Polyethylene having a specific gravity of less than 0.94 (Polymer resin pellets)",
    duty_rate_pct: 6.5,
    unit: "KG",
    usmca_eligible: true,
    category: "Plastics & Raw Materials (Ch. 39)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "3926.90.9990",
    description: "Other articles of plastics, custom injection-molded automotive and industrial parts",
    duty_rate_pct: 5.3,
    unit: "KG",
    usmca_eligible: true,
    category: "Plastics & Custom Mold (Ch. 39)",
    fda_required: false,
    is_hazmat: false
  },

  // --- CHAPTER 48: Paper, Paperboard & Corrugated Packaging ---
  {
    hts_code: "4819.10.0040",
    description: "Cartons, boxes and cases, of corrugated paper or paperboard (Shipping packaging boxes)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    category: "Paper & Packaging (Ch. 48)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "4819.20.0040",
    description: "Folding cartons, boxes and cases, of non-corrugated paper or paperboard",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    category: "Paper & Packaging (Ch. 48)",
    fda_required: false,
    is_hazmat: false
  },

  // --- CHAPTER 94: Furniture, Fixtures & Prefabricated Buildings ---
  {
    hts_code: "9403.20.0020",
    description: "Metal furniture of a kind used in offices, storage racks, commercial shelving & lockers",
    duty_rate_pct: 0.0,
    unit: "PCS",
    usmca_eligible: true,
    category: "Furniture & Store Fixtures (Ch. 94)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "9403.60.8081",
    description: "Other wooden furniture of a kind used in the bedroom, dining, living room",
    duty_rate_pct: 0.0,
    unit: "PCS",
    usmca_eligible: true,
    category: "Furniture (Ch. 94)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "9401.30.8031",
    description: "Swivel seats with variable height adjustment, office task chairs",
    duty_rate_pct: 0.0,
    unit: "PCS",
    usmca_eligible: true,
    category: "Furniture (Ch. 94)",
    fda_required: false,
    is_hazmat: false
  },

  // --- CHAPTER 88: Aerospace & Aircraft Components ---
  {
    hts_code: "8807.30.0030",
    description: "Parts of aerospace airplanes or helicopters (structural titanium/aluminum airframe fittings)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    category: "Aerospace (Ch. 88)",
    fda_required: false,
    is_hazmat: false
  },
  {
    hts_code: "8807.30.0090",
    description: "Hydraulic actuators and flight control mechanism assemblies for commercial aircraft",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    category: "Aerospace (Ch. 88)",
    fda_required: false,
    is_hazmat: false
  },

  // --- CHAPTER 30: Pharmaceuticals & Medical Products ---
  {
    hts_code: "3004.90.9203",
    description: "Medicaments consisting of mixed or unmixed products for therapeutic uses (FDA Prior Notice Required)",
    duty_rate_pct: 0.0,
    unit: "PKG",
    usmca_eligible: true,
    category: "Pharmaceuticals (Ch. 30)",
    fda_required: true,
    is_hazmat: false
  },
  {
    hts_code: "9018.90.8000",
    description: "Instruments and appliances used in medical, surgical, dental or veterinary sciences",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    category: "Medical Devices (Ch. 90)",
    fda_required: true,
    is_hazmat: false
  },

  // --- CHAPTER 22, 08, 04: Food & Beverages (FDA Prior Notice) ---
  {
    hts_code: "2202.99.9000",
    description: "Waters, flavored mineral waters, and non-alcoholic beverages (FDA Prior Notice Required)",
    duty_rate_pct: 0.2,
    unit: "LITERS",
    usmca_eligible: true,
    category: "Food & Beverage (Ch. 22)",
    fda_required: true,
    is_hazmat: false
  },
  {
    hts_code: "0808.10.0000",
    description: "Fresh apples and commercial produce (USDA / CFIA phytosanitary inspection required)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    category: "Agriculture & Produce (Ch. 08)",
    fda_required: true,
    is_hazmat: false
  },
  {
    hts_code: "0406.90.9500",
    description: "Cheese and curd, processed dairy products (FDA / USDA Veterinary inspection required)",
    duty_rate_pct: 8.5,
    unit: "KG",
    usmca_eligible: true,
    category: "Dairy & Food (Ch. 04)",
    fda_required: true,
    is_hazmat: false
  },

  // --- CHAPTER 27 & 28/34: Chemicals, Lubricants & Hazmat ---
  {
    hts_code: "2710.19.3080",
    description: "Lubricating oils, heavy mineral transmission oils and greases (Hazmat UN Class 3/9)",
    duty_rate_pct: 5.8,
    unit: "LITERS",
    usmca_eligible: true,
    category: "Petroleum & Lubricants (Ch. 27)",
    fda_required: false,
    is_hazmat: true
  },
  {
    hts_code: "3402.90.5050",
    description: "Organic surface-active agents and industrial cleaning preparations (Hazmat Corrosive/Flammable)",
    duty_rate_pct: 3.7,
    unit: "KG",
    usmca_eligible: true,
    category: "Chemicals & Cleaners (Ch. 34)",
    fda_required: false,
    is_hazmat: true
  }
];

// Customs Brokers Directory
export const CUSTOMS_BROKERS = [
  {
    name: "Livingston International",
    filer_code: "LVN-9021",
    email: "crossborder@livingstonintl.com",
    phone: "+1 (800) 437-4324",
    countries: ["US", "CA"],
    specialty: "Automotive, Industrial & ACE/ACI Direct Electronic Filing"
  },
  {
    name: "Willson International",
    filer_code: "WIL-4402",
    email: "customsclearance@willsonintl.com",
    phone: "+1 (800) 754-1918",
    countries: ["US", "CA"],
    specialty: "High-Volume Truckload & Border Quick-Release"
  },
  {
    name: "Farrow Customs Brokerage",
    filer_code: "FRW-8190",
    email: "dispatch@farrow.com",
    phone: "+1 (888) 313-2776",
    countries: ["US", "CA"],
    specialty: "Retail, Consumer Goods & Food/FDA Clearance"
  },
  {
    name: "Cole International",
    filer_code: "COL-3301",
    email: "crossborder@coleintl.com",
    phone: "+1 (800) 313-2653",
    countries: ["US", "CA"],
    specialty: "Heavy Haul, Machinery & Project Cargo"
  },
  {
    name: "Buckland Customs",
    filer_code: "BCK-1029",
    email: "clearance@buckland.com",
    phone: "+1 (800) 991-4944",
    countries: ["US", "CA", "MX"],
    specialty: "USMCA Tri-Lateral Cross Border Compliance"
  }
];

// Ensure customs_entries table exists helper
const ensureCustomsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customs_entries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          load_id UUID REFERENCES loads(id) ON DELETE SET NULL,
          entry_number VARCHAR(100) UNIQUE NOT NULL,
          border_direction VARCHAR(50) NOT NULL DEFAULT 'INBOUND_US',
          lead_number_type VARCHAR(20) NOT NULL DEFAULT 'PAPS',
          lead_number VARCHAR(100) NOT NULL,
          scac_or_carrier_code VARCHAR(20) NOT NULL DEFAULT 'NISD',
          port_of_entry_code VARCHAR(50) NOT NULL,
          port_of_entry_name VARCHAR(255) NOT NULL,
          port_country VARCHAR(10) NOT NULL DEFAULT 'US',
          customs_status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
          irs_number VARCHAR(50),
          ins_number VARCHAR(50),
          customs_broker_name VARCHAR(255),
          customs_broker_filer_code VARCHAR(50),
          customs_broker_email VARCHAR(255),
          customs_broker_phone VARCHAR(50),
          broker_entry_number VARCHAR(100),
          commercial_invoice_number VARCHAR(100),
          invoice_total_value DECIMAL(12,2) DEFAULT 0.00,
          currency VARCHAR(10) DEFAULT 'USD',
          country_of_origin VARCHAR(10) DEFAULT 'US',
          hts_items JSONB DEFAULT '[]'::jsonb,
          driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
          driver_name VARCHAR(255),
          driver_fast_card_number VARCHAR(100),
          truck_number VARCHAR(100),
          trailer_number VARCHAR(100),
          ace_trip_number VARCHAR(100),
          aci_cargo_control_number VARCHAR(100),
          crossing_eta TIMESTAMP,
          cleared_at TIMESTAMP,
          inspection_notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // BorderConnect filing lifecycle columns (mirrors migration 110).
    await ensureFilingColumns();
  } catch (err) {
    console.warn("Customs entries table check:", err.message);
  }
};

// GET all customs entries
export const getCustomsEntries = async (req, res) => {
  await ensureCustomsTable();
  try {
    const { direction, status, search } = req.query;

    let query = `
      SELECT 
        ce.*,
        l.load_number,
        l.customer_name,
        l.shipper_name,
        l.consignee_name,
        l.origin,
        l.destination,
        l.pickup_date,
        l.delivery_date,
        l.weight AS load_weight,
        l.pieces AS load_pieces,
        l.rate AS load_rate,
        d.driver_code AS driver_number,
        d.phone_number AS driver_phone
      FROM customs_entries ce
      LEFT JOIN loads l ON ce.load_id = l.id
      LEFT JOIN drivers d ON ce.driver_id = d.id
      WHERE 1=1
    `;

    const params = [];

    if (direction && direction !== "all") {
      params.push(direction.toUpperCase());
      query += ` AND ce.border_direction = $${params.length}`;
    }

    if (status && status !== "all") {
      params.push(status.toUpperCase());
      query += ` AND ce.customs_status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      const sIdx = params.length;
      query += ` AND (
        ce.entry_number ILIKE $${sIdx} OR
        ce.lead_number ILIKE $${sIdx} OR
        ce.irs_number ILIKE $${sIdx} OR
        ce.ins_number ILIKE $${sIdx} OR
        ce.customs_broker_name ILIKE $${sIdx} OR
        ce.port_of_entry_name ILIKE $${sIdx} OR
        l.load_number ILIKE $${sIdx} OR
        l.customer_name ILIKE $${sIdx}
      )`;
    }

    query += ` ORDER BY ce.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      customs_entries: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error("Error fetching customs entries:", error);
    // If table doesn't exist yet, return gracefully with empty array
    res.status(200).json({
      success: true,
      customs_entries: [],
      total: 0,
      note: "Database table migrating or empty"
    });
  }
};

// GET single customs entry by ID
export const getCustomsEntryById = async (req, res) => {
  await ensureCustomsTable();
  try {
    const { id } = req.params;
    const result = await pool.query(
      `
      SELECT 
        ce.*,
        l.load_number,
        l.customer_name,
        l.customer_email,
        l.shipper_name,
        l.consignee_name,
        l.origin,
        l.destination,
        d.driver_code AS driver_number,
        d.phone_number AS driver_phone
      FROM customs_entries ce
      LEFT JOIN loads l ON ce.load_id = l.id
      LEFT JOIN drivers d ON ce.driver_id = d.id
      WHERE ce.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Customs entry not found" });
    }

    res.json({ success: true, customs_entry: result.rows[0] });
  } catch (error) {
    console.error("Error fetching customs entry by ID:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Helper: Auto-generate official PAPS (US SCAC + Load/Pro) or PARS (CBSA Carrier Code + CCN)
export const generateLeadBarcode = (type, carrierCode = "NISD", loadNumber = "001000") => {
  const cleanLoad = String(loadNumber).replace(/\D/g, "").padStart(6, "0") || "001000";
  if (type === "PARS") {
    const cCode = carrierCode && /^[0-9A-Za-z]{4}$/.test(carrierCode) ? carrierCode.toUpperCase() : "22GY";
    return `${cCode}${cleanLoad.slice(-6)}`;
  } else {
    const scac = carrierCode && /^[A-Za-z]{2,4}$/.test(carrierCode) ? carrierCode.toUpperCase() : "NISD";
    return `${scac}${cleanLoad.slice(-6)}`;
  }
};

// CREATE new customs entry
export const createCustomsEntry = async (req, res) => {
  await ensureCustomsTable();
  try {
    const {
      load_id,
      border_direction = "INBOUND_US",
      lead_number_type = border_direction === "INBOUND_CA" ? "PARS" : "PAPS",
      scac_or_carrier_code = border_direction === "INBOUND_CA" ? "22GY" : "NISD",
      lead_number,
      port_of_entry_code = "3801",
      port_of_entry_name = "Detroit Ambassador Bridge",
      port_country = border_direction === "INBOUND_CA" ? "CA" : "US",
      customs_status = "PAPS_PARS_ACTIVE",
      irs_number = "",
      ins_number = "",
      customs_broker_name = "Livingston International",
      customs_broker_filer_code = "LVN-9021",
      customs_broker_email = "crossborder@livingstonintl.com",
      customs_broker_phone = "+1 (800) 437-4324",
      broker_entry_number = "",
      commercial_invoice_number = `INV-CB-${Date.now().toString().slice(-6)}`,
      invoice_total_value = 0.00,
      currency = "USD",
      country_of_origin = "US",
      hts_items = [],
      driver_id = null,
      driver_name = "",
      driver_fast_card_number = "",
      truck_number = "",
      trailer_number = "",
      ace_trip_number = "",
      aci_cargo_control_number = "",
      crossing_eta = null,
      inspection_notes = ""
    } = req.body;

    const entry_number = `CUST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalLeadNumber = lead_number || generateLeadBarcode(lead_number_type, scac_or_carrier_code, "100" + Math.floor(Math.random() * 99));

    const result = await pool.query(
      `
      INSERT INTO customs_entries (
        load_id,
        entry_number,
        border_direction,
        lead_number_type,
        lead_number,
        scac_or_carrier_code,
        port_of_entry_code,
        port_of_entry_name,
        port_country,
        customs_status,
        irs_number,
        ins_number,
        customs_broker_name,
        customs_broker_filer_code,
        customs_broker_email,
        customs_broker_phone,
        broker_entry_number,
        commercial_invoice_number,
        invoice_total_value,
        currency,
        country_of_origin,
        hts_items,
        driver_id,
        driver_name,
        driver_fast_card_number,
        truck_number,
        trailer_number,
        ace_trip_number,
        aci_cargo_control_number,
        crossing_eta,
        inspection_notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31
      )
      RETURNING *;
      `,
      [
        load_id || null,
        entry_number,
        border_direction,
        lead_number_type,
        finalLeadNumber,
        scac_or_carrier_code,
        port_of_entry_code,
        port_of_entry_name,
        port_country,
        customs_status,
        irs_number,
        ins_number,
        customs_broker_name,
        customs_broker_filer_code,
        customs_broker_email,
        customs_broker_phone,
        broker_entry_number,
        commercial_invoice_number,
        invoice_total_value,
        currency,
        country_of_origin,
        JSON.stringify(hts_items),
        driver_id || null,
        driver_name,
        driver_fast_card_number,
        truck_number,
        trailer_number,
        ace_trip_number,
        aci_cargo_control_number,
        crossing_eta,
        inspection_notes
      ]
    );

    const createdEntry = result.rows[0];

    // Record Audit Log for Customs Entry Creation
    await recordAuditLog({
      req,
      action: "CUSTOMS_CREATED",
      entityType: "CUSTOMS",
      entityId: createdEntry.id,
      entityIdentifier: `${createdEntry.lead_number_type}: ${createdEntry.lead_number}`,
      changeSummary: `Created ${createdEntry.lead_number_type} customs clearance record (${createdEntry.lead_number}) at ${createdEntry.port_of_entry_name}`,
      details: {
        entry_number: createdEntry.entry_number,
        direction: createdEntry.border_direction,
        status: createdEntry.customs_status,
        broker: createdEntry.customs_broker_name,
        port: createdEntry.port_of_entry_name
      }
    });

    res.status(201).json({
      success: true,
      customs_entry: createdEntry,
      message: "Customs clearance entry created successfully"
    });
  } catch (error) {
    console.error("Error creating customs entry:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// UPDATE customs entry
export const updateCustomsEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      border_direction,
      lead_number_type,
      lead_number,
      scac_or_carrier_code,
      port_of_entry_code,
      port_of_entry_name,
      port_country,
      customs_status,
      irs_number,
      ins_number,
      customs_broker_name,
      customs_broker_filer_code,
      customs_broker_email,
      customs_broker_phone,
      broker_entry_number,
      commercial_invoice_number,
      invoice_total_value,
      currency,
      country_of_origin,
      hts_items,
      driver_id,
      driver_name,
      driver_fast_card_number,
      truck_number,
      trailer_number,
      ace_trip_number,
      aci_cargo_control_number,
      crossing_eta,
      cleared_at,
      inspection_notes
    } = req.body;

    const result = await pool.query(
      `
      UPDATE customs_entries
      SET
        border_direction = COALESCE($1, border_direction),
        lead_number_type = COALESCE($2, lead_number_type),
        lead_number = COALESCE($3, lead_number),
        scac_or_carrier_code = COALESCE($4, scac_or_carrier_code),
        port_of_entry_code = COALESCE($5, port_of_entry_code),
        port_of_entry_name = COALESCE($6, port_of_entry_name),
        port_country = COALESCE($7, port_country),
        customs_status = COALESCE($8, customs_status),
        irs_number = COALESCE($9, irs_number),
        ins_number = COALESCE($10, ins_number),
        customs_broker_name = COALESCE($11, customs_broker_name),
        customs_broker_filer_code = COALESCE($12, customs_broker_filer_code),
        customs_broker_email = COALESCE($13, customs_broker_email),
        customs_broker_phone = COALESCE($14, customs_broker_phone),
        broker_entry_number = COALESCE($15, broker_entry_number),
        commercial_invoice_number = COALESCE($16, commercial_invoice_number),
        invoice_total_value = COALESCE($17, invoice_total_value),
        currency = COALESCE($18, currency),
        country_of_origin = COALESCE($19, country_of_origin),
        hts_items = CASE WHEN $20::jsonb IS NOT NULL THEN $20::jsonb ELSE hts_items END,
        driver_id = COALESCE($21, driver_id),
        driver_name = COALESCE($22, driver_name),
        driver_fast_card_number = COALESCE($23, driver_fast_card_number),
        truck_number = COALESCE($24, truck_number),
        trailer_number = COALESCE($25, trailer_number),
        ace_trip_number = COALESCE($26, ace_trip_number),
        aci_cargo_control_number = COALESCE($27, aci_cargo_control_number),
        crossing_eta = COALESCE($28, crossing_eta),
        cleared_at = COALESCE($29, cleared_at),
        inspection_notes = COALESCE($30, inspection_notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $31
      RETURNING *;
      `,
      [
        border_direction || null,
        lead_number_type || null,
        lead_number || null,
        scac_or_carrier_code || null,
        port_of_entry_code || null,
        port_of_entry_name || null,
        port_country || null,
        customs_status || null,
        irs_number || null,
        ins_number || null,
        customs_broker_name || null,
        customs_broker_filer_code || null,
        customs_broker_email || null,
        customs_broker_phone || null,
        broker_entry_number || null,
        commercial_invoice_number || null,
        invoice_total_value || null,
        currency || null,
        country_of_origin || null,
        hts_items ? JSON.stringify(hts_items) : null,
        driver_id || null,
        driver_name || null,
        driver_fast_card_number || null,
        truck_number || null,
        trailer_number || null,
        ace_trip_number || null,
        aci_cargo_control_number || null,
        crossing_eta || null,
        cleared_at || null,
        inspection_notes || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Customs entry not found" });
    }

    const updatedEntry = result.rows[0];

    // Record Audit Log for Customs Update
    await recordAuditLog({
      req,
      action: customs_status ? "STATUS_CHANGED" : "CUSTOMS_UPDATED",
      entityType: "CUSTOMS",
      entityId: updatedEntry.id,
      entityIdentifier: `${updatedEntry.lead_number_type}: ${updatedEntry.lead_number}`,
      changeSummary: customs_status
        ? `Updated ${updatedEntry.lead_number_type} status to ${customs_status}`
        : `Updated ${updatedEntry.lead_number_type} customs manifest details (${updatedEntry.lead_number})`,
      details: {
        status: updatedEntry.customs_status,
        broker: updatedEntry.customs_broker_name,
        invoice_value: updatedEntry.invoice_total_value
      }
    });

    res.json({
      success: true,
      customs_entry: updatedEntry,
      message: "Customs entry updated successfully"
    });
  } catch (error) {
    console.error("Error updating customs entry:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// UPDATE Customs Status (e.g. Transmitted, Cleared, Hold, Accepted)
export const updateCustomsStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const clearedAt = status === "CLEARED" ? new Date() : null;

    const result = await pool.query(
      `
      UPDATE customs_entries
      SET 
        customs_status = $1,
        cleared_at = COALESCE($2, cleared_at),
        inspection_notes = CASE WHEN $3 IS NOT NULL THEN $3 ELSE inspection_notes END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *;
      `,
      [status, clearedAt, notes || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Customs entry not found" });
    }

    const updated = result.rows[0];

    // Record Audit Log for Customs Status Update
    await recordAuditLog({
      req,
      action: "CUSTOMS_STATUS_CHANGED",
      entityType: "CUSTOMS",
      entityId: updated.id,
      entityIdentifier: `${updated.lead_number_type}: ${updated.lead_number}`,
      changeSummary: `Customs status transitioned to ${status} for ${updated.lead_number}`,
      details: {
        new_status: status,
        cleared_at: clearedAt,
        notes: notes
      }
    });

    res.json({
      success: true,
      customs_entry: updated,
      message: `Customs status updated to ${status}`
    });
  } catch (error) {
    console.error("Error updating customs status:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET Reference Catalogs (Ports of Entry, HTS Codes, Brokers)
export const getCustomsReferenceData = (req, res) => {
  res.json({
    success: true,
    ports_of_entry: PORTS_OF_ENTRY,
    hts_catalog: HTS_CATALOG,
    customs_brokers: CUSTOMS_BROKERS
  });
};

// ==========================================
// BORDERCONNECT API INTEGRATION HANDLERS
// ==========================================

import {
  checkPapsParsStatus,
  transmitAceManifest,
  transmitAciManifest,
  getBorderConnectCredentials,
  setBorderConnectCredentials,
  syncAllCrossBorderShipments,
  sendManifest,
  refreshManifestStatus,
  ensureFilingColumns,
} from "../services/borderconnect.service.js";

// GET BorderConnect Connection Info
export const getBorderConnectConfig = (req, res) => {
  const info = getBorderConnectCredentials();
  res.json({ success: true, config: info });
};

// POST Save BorderConnect API Key
export const saveBorderConnectConfig = (req, res) => {
  const { apiKey, companyKey, companyCode } = req.body;
  setBorderConnectCredentials(apiKey, companyKey, companyCode);
  res.json({
    success: true,
    message: "BorderConnect API credentials updated successfully",
    config: getBorderConnectCredentials(),
  });
};

// GET Stored PAPS / PARS Filing Status (honest — from our database)
export const checkBorderConnectStatus = async (req, res) => {
  try {
    const { barcode } = req.params;
    const { type = "PAPS" } = req.query;

    // Returns the stored, honest filing state. No fabricated statuses and no
    // blind DB overwrites — real updates come from /:id/refresh-status.
    const result = await checkPapsParsStatus(barcode, type);
    res.status(result.success ? 200 : result.error === "entry_not_found" ? 404 : 400).json(result);
  } catch (error) {
    console.error("BorderConnect status check error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST Submit ACE eManifest via BorderConnect (honest lifecycle)
export const submitBorderConnectAce = async (req, res) => {
  try {
    const { entryId, manifestData } = req.body || {};
    const result = await transmitAceManifest({ entryId, ...(manifestData || {}) });
    res.status(result.ok ? 200 : result.error === "entry_id_required" ? 400 : 502).json(result);
  } catch (error) {
    console.error("BorderConnect ACE submission error:", error);
    res.status(500).json({ ok: false, success: false, message: error.message });
  }
};

// POST Submit ACI eManifest via BorderConnect (honest lifecycle)
export const submitBorderConnectAci = async (req, res) => {
  try {
    const { entryId, manifestData } = req.body || {};
    const result = await transmitAciManifest({ entryId, ...(manifestData || {}) });
    res.status(result.ok ? 200 : result.error === "entry_id_required" ? 400 : 502).json(result);
  } catch (error) {
    console.error("BorderConnect ACI submission error:", error);
    res.status(500).json({ ok: false, success: false, message: error.message });
  }
};

/**
 * POST /api/customs/:id/file
 * File the eManifest (ACE or ACI, based on the entry's direction) with
 * BorderConnect. Persists request, response, and honest lifecycle status.
 */
export const fileBorderConnectManifest = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await sendManifest(id);

    if (result.ok) {
      await recordAuditLog({
        req,
        action: "CUSTOMS_EMANIFEST_FILED",
        entityType: "CUSTOMS",
        entityId: id,
        entityIdentifier: result.tripNumber || id,
        changeSummary: `eManifest (${result.manifestType}) filed via BorderConnect — status ${result.status}`,
        details: { status: result.status, tripNumber: result.tripNumber },
      }).catch(() => {});
      return res.json(result);
    }

    const httpStatus =
      result.error === "customs_entry_not_found"
        ? 404
        : result.error === "borderconnect_not_configured" || result.error === "missing_required_fields"
        ? 400
        : 502;
    res.status(httpStatus).json(result);
  } catch (error) {
    console.error("fileBorderConnectManifest error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

/**
 * POST /api/customs/:id/refresh-status
 * Poll BorderConnect's receive endpoint for real customs responses and
 * persist any update that pertains to this manifest.
 */
export const refreshBorderConnectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await refreshManifestStatus(id);
    if (result.ok) return res.json(result);
    const httpStatus =
      result.error === "customs_entry_not_found"
        ? 404
        : result.error === "borderconnect_not_configured"
        ? 400
        : 502;
    res.status(httpStatus).json(result);
  } catch (error) {
    console.error("refreshBorderConnectStatus error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

/**
 * GET /api/customs/:id/filing
 * Expose the stored, honest filing state for one customs entry.
 */
export const getBorderConnectFilingState = async (req, res) => {
  try {
    await ensureFilingColumns();
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, lead_number, lead_number_type, border_direction,
              customs_status, border_connect_status, bc_request_payload,
              bc_response_payload, bc_error_message, filed_at,
              last_status_check_at, ace_trip_number, aci_cargo_control_number
       FROM customs_entries WHERE id = $1;`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: "customs_entry_not_found" });
    }
    res.json({ ok: true, filing: result.rows[0] });
  } catch (error) {
    console.error("getBorderConnectFilingState error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

/**
 * POST /api/customs/borderconnect/sync-all
 * 1-Click Sync of all Cross-Border Shipments with BorderConnect
 */
export const syncAllBorderConnectShipments = async (req, res) => {
  try {
    const result = await syncAllCrossBorderShipments();
    res.json(result);
  } catch (error) {
    console.error("syncAllBorderConnectShipments error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/customs/borderconnect/live-sync-summary
 * Get real-time BorderConnect connection details and cross-border sync status
 */
export const getBorderConnectSyncSummary = async (req, res) => {
  try {
    await ensureCustomsTable();
    const config = getBorderConnectCredentials();
    let entries = [];
    try {
      const resDb = await pool.query(
        `SELECT * FROM customs_entries ORDER BY created_at DESC LIMIT 50;`
      );
      entries = resDb.rows || [];
    } catch (e) {
      console.warn("getBorderConnectSyncSummary query failed:", e.message);
    }

    const byFilingStatus = entries.reduce((acc, e) => {
      const s = e.border_connect_status || "DRAFT";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      config,
      totalEntries: entries.length,
      // Honest counts based on the persisted BorderConnect filing lifecycle.
      byFilingStatus,
      acceptedCount: entries.filter((e) => e.border_connect_status === "ACCEPTED").length,
      pendingCount: entries.filter((e) =>
        ["DRAFT", "QUEUED", "SENT"].includes(e.border_connect_status || "DRAFT")
      ).length,
      rejectedCount: entries.filter((e) =>
        ["REJECTED", "ERROR"].includes(e.border_connect_status)
      ).length,
      entries,
    });
  } catch (error) {
    console.error("getBorderConnectSyncSummary error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};



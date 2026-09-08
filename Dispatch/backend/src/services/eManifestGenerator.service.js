import pool from "../config/db.js";
import {
  transmitAceManifestToCbp as borderConnectTransmit,
  getRealBorderWaitTimes,
  pollManifestAcknowledgment,
  validateCustomsEntry,
  checkCustomsHold,
} from "./borderConnect.service.js";

/**
 * E-Manifest Generator — Autonomous ACE/ACI manifest + BOL generation
 *
 * Triggers on load dispatch to generate:
 * 1. ACE (Automated Commercial Environment) e-manifest for US CBP
 * 2. ACI (Advance Commercial Information) for CBSA Canada
 * 3. BOL (Bill of Lading) for driver/shipper/consignee
 *
 * Flow: Load dispatched → Query all data → Generate manifest XML → Store as document
 * Transmission: Local draft → BorderConnect API → CBP real-time → acknowledgment tracking
 */

/**
 * Ensure emanifests table exists
 */
export async function ensureEManifestsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS emanifests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
        customs_entry_id UUID REFERENCES customs_entries(id) ON DELETE SET NULL,
        manifest_type VARCHAR(50) NOT NULL DEFAULT 'ACE',
        manifest_number VARCHAR(100) UNIQUE,
        bol_number VARCHAR(100) UNIQUE,
        document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
        manifest_xml TEXT,
        bol_html TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        transmitted_at TIMESTAMP WITH TIME ZONE,
        received_at TIMESTAMP WITH TIME ZONE,
        acknowledged_at TIMESTAMP WITH TIME ZONE,
        errors TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_emanifests_load_id ON emanifests(load_id);
      CREATE INDEX IF NOT EXISTS idx_emanifests_number ON emanifests(manifest_number);
      CREATE INDEX IF NOT EXISTS idx_emanifests_status ON emanifests(status);
    `);
  } catch (err) {
    if (!err.message.includes("already exists")) {
      console.warn("[E-Manifest] Table ensure error:", err.message);
    }
  }
}

/**
 * Generate ACE manifest XML for US CBP entry
 */
export function generateAceManifest({
  loadNumber,
  manifestNumber,
  shipperName,
  shipperAddress,
  shipperCity,
  shipperState,
  shipperZip,
  consigneeName,
  consigneeAddress,
  consigneeCity,
  consigneeState,
  consigneeZip,
  commodity,
  weight,
  pieces,
  invoiceNumber,
  invoiceAmount,
  invoiceCurrency = "USD",
  portOfEntry = "3801", // Detroit
  scac = "NISD",
  truckNumber,
  driverName,
  driverLicense,
}) {
  const timestamp = new Date().toISOString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ACEManifest>
  <Header>
    <ManifestNumber>${manifestNumber}</ManifestNumber>
    <PortOfEntry>${portOfEntry}</PortOfEntry>
    <CarrierCode>${scac}</CarrierCode>
    <Timestamp>${timestamp}</Timestamp>
    <TruckNumber>${truckNumber}</TruckNumber>
    <DriverName>${driverName}</DriverName>
    <DriverLicense>${driverLicense || "N/A"}</DriverLicense>
  </Header>

  <Shipment>
    <LoadNumber>${loadNumber}</LoadNumber>
    <InvoiceNumber>${invoiceNumber}</InvoiceNumber>
    <InvoiceAmount>${invoiceAmount}</InvoiceAmount>
    <Currency>${invoiceCurrency}</Currency>

    <Shipper>
      <Name>${shipperName}</Name>
      <Address>${shipperAddress}</Address>
      <City>${shipperCity}</City>
      <State>${shipperState}</State>
      <ZipCode>${shipperZip}</ZipCode>
      <Country>CA</Country>
    </Shipper>

    <Consignee>
      <Name>${consigneeName}</Name>
      <Address>${consigneeAddress}</Address>
      <City>${consigneeCity}</City>
      <State>${consigneeState}</State>
      <ZipCode>${consigneeZip}</ZipCode>
      <Country>US</Country>
    </Consignee>

    <Commodity>
      <Description>${commodity}</Description>
      <Weight>${weight}</Weight>
      <WeightUnit>LBS</WeightUnit>
      <Pieces>${pieces}</Pieces>
      <HsCode>N/A</HsCode>
    </Commodity>
  </Shipment>

  <Status>
    <Code>001</Code>
    <Description>Manifest Created</Description>
    <Timestamp>${timestamp}</Timestamp>
  </Status>
</ACEManifest>`;

  return xml;
}

/**
 * Generate BOL (Bill of Lading) HTML for driver/shipper/consignee
 */
export function generateBol({
  loadNumber,
  bolNumber,
  shipperName,
  shipperAddress,
  shipperPhone,
  consigneeName,
  consigneeAddress,
  consigneePhone,
  pickupDate,
  deliveryDate,
  commodity,
  weight,
  pieces,
  rate,
  currency = "USD",
  specialInstructions = "",
  truckNumber,
  driverName,
  driverPhone,
}) {
  const timestamp = new Date().toLocaleDateString();

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BOL #${bolNumber}</title>
  <style>
    body { font-family: 'Courier New', monospace; background: white; margin: 0; padding: 20px; color: #000; }
    .container { max-width: 800px; margin: 0 auto; border: 2px solid #000; padding: 20px; }
    .header { text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .bol-number { font-size: 14px; margin: 5px 0; }
    .section { margin: 20px 0; }
    .section-title { font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 10px 0; }
    .field-label { font-weight: bold; font-size: 12px; }
    .field-value { font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #000; padding: 8px; text-align: left; }
    th { background: #f0f0f0; font-weight: bold; }
    .signature-area { margin-top: 30px; border-top: 1px solid #000; padding-top: 20px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; text-align: center; }
    .signature-line { border-top: 1px solid #000; height: 60px; }
    .footer { text-align: center; font-size: 11px; margin-top: 20px; border-top: 1px solid #000; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      BILL OF LADING
      <div class="bol-number">BOL #${bolNumber} | Load #${loadNumber}</div>
    </div>

    <div class="section">
      <div class="section-title">SHIPPER (Bill To)</div>
      <div class="row">
        <div>
          <div class="field-label">Company Name</div>
          <div class="field-value">${shipperName}</div>
        </div>
        <div>
          <div class="field-label">Phone</div>
          <div class="field-value">${shipperPhone}</div>
        </div>
      </div>
      <div class="field-label">Address</div>
      <div class="field-value">${shipperAddress}</div>
    </div>

    <div class="section">
      <div class="section-title">CONSIGNEE (Ship To)</div>
      <div class="row">
        <div>
          <div class="field-label">Company Name</div>
          <div class="field-value">${consigneeName}</div>
        </div>
        <div>
          <div class="field-label">Phone</div>
          <div class="field-value">${consigneePhone}</div>
        </div>
      </div>
      <div class="field-label">Address</div>
      <div class="field-value">${consigneeAddress}</div>
    </div>

    <div class="section">
      <div class="section-title">FREIGHT DETAILS</div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Weight</th>
            <th>Pieces</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${commodity}</td>
            <td>${weight.toLocaleString()} LBS</td>
            <td>${pieces}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">SHIPPING DETAILS</div>
      <div class="row">
        <div>
          <div class="field-label">Pickup Date</div>
          <div class="field-value">${pickupDate}</div>
        </div>
        <div>
          <div class="field-label">Delivery Date</div>
          <div class="field-value">${deliveryDate}</div>
        </div>
      </div>
      <div class="row">
        <div>
          <div class="field-label">Truck Number</div>
          <div class="field-value">${truckNumber}</div>
        </div>
        <div>
          <div class="field-label">Driver</div>
          <div class="field-value">${driverName} | ${driverPhone}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">CHARGES</div>
      <div class="row">
        <div>
          <div class="field-label">Freight Charge</div>
          <div class="field-value" style="font-weight: bold; font-size: 16px;">${currency} ${rate.toLocaleString()}</div>
        </div>
      </div>
    </div>

    ${specialInstructions ? `
    <div class="section">
      <div class="section-title">SPECIAL INSTRUCTIONS</div>
      <div class="field-value">${specialInstructions}</div>
    </div>
    ` : ""}

    <div class="signature-area">
      <div>
        <div class="field-label">Shipper Signature</div>
        <div class="signature-line"></div>
        <div style="margin-top: 5px;">${timestamp}</div>
      </div>
      <div>
        <div class="field-label">Driver Signature</div>
        <div class="signature-line"></div>
        <div style="margin-top: 5px;">Date: ___________</div>
      </div>
      <div>
        <div class="field-label">Consignee Signature</div>
        <div class="signature-line"></div>
        <div style="margin-top: 5px;">Date: ___________</div>
      </div>
    </div>

    <div class="footer">
      Generated by NISHAN TRANSPORT INC. • Automated E-Manifest System<br>
      SCAC: NISD | DOT: 3891024 | This is an automatically generated document.
    </div>
  </div>
</body>
</html>`;

  return html;
}

/**
 * Generate manifest for a load (both ACE + BOL)
 */
export async function generateEManifest(loadId) {
  try {
    await ensureEManifestsTable();

    // Fetch load + customs + driver data
    const loadResult = await pool.query(
      `SELECT * FROM loads WHERE id = $1`,
      [loadId]
    );

    if (loadResult.rows.length === 0) {
      throw new Error(`Load ${loadId} not found`);
    }

    const load = loadResult.rows[0];

    // Fetch customs entry
    const customsResult = await pool.query(
      `SELECT * FROM customs_entries WHERE load_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [loadId]
    );

    const customsEntry = customsResult.rows[0];

    // Generate unique manifest/BOL numbers
    const manifestNumber = `ACE-${load.load_number}-${Date.now().toString().slice(-6)}`;
    const bolNumber = `BOL-${load.load_number}-${Date.now().toString().slice(-6)}`;

    // Generate ACE manifest
    const aceXml = generateAceManifest({
      loadNumber: load.load_number,
      manifestNumber,
      shipperName: load.shipper_name,
      shipperAddress: load.shipper_street_address,
      shipperCity: load.shipper_city,
      shipperState: load.shipper_state,
      shipperZip: load.shipper_zipcode,
      consigneeName: load.consignee_name,
      consigneeAddress: load.consignee_street_address,
      consigneeCity: load.consignee_city,
      consigneeState: load.consignee_state,
      consigneeZip: load.consignee_zipcode,
      commodity: load.commodity,
      weight: load.weight,
      pieces: load.pieces,
      invoiceNumber: load.customer_reference || `INV-${load.load_number}`,
      invoiceAmount: load.rate,
      invoiceCurrency: load.currency || "USD",
      portOfEntry: customsEntry?.port_of_entry_code || "3801",
      truckNumber: load.truck_id || "TBD",
      driverName: load.driver_id || "TBD",
    });

    // Generate BOL
    const bolHtml = generateBol({
      loadNumber: load.load_number,
      bolNumber,
      shipperName: load.shipper_name,
      shipperAddress: load.shipper_street_address,
      shipperPhone: load.shipper_phone,
      consigneeName: load.consignee_name,
      consigneeAddress: load.consignee_street_address,
      consigneePhone: load.consignee_phone,
      pickupDate: load.pickup_date?.toLocaleDateString() || "TBD",
      deliveryDate: load.delivery_date?.toLocaleDateString() || "TBD",
      commodity: load.commodity,
      weight: load.weight,
      pieces: load.pieces,
      rate: load.rate,
      currency: load.currency || "USD",
      specialInstructions: load.special_instructions,
      truckNumber: load.truck_id || "TBD",
      driverName: load.driver_id || "TBD",
      driverPhone: load.shipper_phone || "TBD",
    });

    // Persist manifest record
    const manifestResult = await pool.query(
      `INSERT INTO emanifests (
        load_id, customs_entry_id, manifest_number, bol_number,
        manifest_xml, bol_html, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'draft')
      RETURNING *`,
      [loadId, customsEntry?.id || null, manifestNumber, bolNumber, aceXml, bolHtml]
    );

    const manifest = manifestResult.rows[0];
    console.log(`📋 [E-Manifest] Generated ${manifestNumber} + ${bolNumber} for load ${load.load_number}`);

    return {
      id: manifest.id,
      loadId,
      manifestNumber,
      bolNumber,
      manifestType: "ACE",
      status: "draft",
      aceXml,
      bolHtml,
      createdAt: manifest.created_at,
    };
  } catch (err) {
    console.error("[E-Manifest] Generation error:", err.message);
    throw err;
  }
}

/**
 * Transmit manifest to CBP via BorderConnect real-time API
 */
export async function transmitManifestToCbp(manifestId) {
  try {
    // Fetch manifest from database
    const manifestResult = await pool.query(
      `SELECT em.*, l.truck_id, l.driver_id, l.load_number, ce.port_of_entry_code
       FROM emanifests em
       LEFT JOIN loads l ON em.load_id = l.id
       LEFT JOIN customs_entries ce ON em.customs_entry_id = ce.id
       WHERE em.id = $1`,
      [manifestId]
    );

    if (manifestResult.rows.length === 0) {
      throw new Error(`Manifest ${manifestId} not found`);
    }

    const manifest = manifestResult.rows[0];

    console.log(`🌐 [E-Manifest] Transmitting ${manifest.manifest_number} to CBP via BorderConnect...`);

    // Transmit via BorderConnect API
    const transmissionResult = await borderConnectTransmit({
      manifestId: manifest.id,
      manifestXml: manifest.manifest_xml,
      portOfEntry: manifest.port_of_entry_code || "3801",
      carrierScac: "NISD",
      truckNumber: manifest.truck_id || "TBD",
      driverLicense: manifest.driver_id || "TBD",
    });

    console.log(`✅ [E-Manifest] CBP Reference: ${transmissionResult.cbpReferenceId}`);

    // Fetch updated manifest with new transmission status
    const updatedResult = await pool.query(
      `SELECT * FROM emanifests WHERE id = $1`,
      [manifestId]
    );

    return updatedResult.rows[0];
  } catch (err) {
    console.error("[E-Manifest] Transmission error:", err.message);
    throw err;
  }
}

/**
 * Get manifest for a load
 */
export async function getEManifest(loadId) {
  try {
    const result = await pool.query(
      `SELECT * FROM emanifests WHERE load_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [loadId]
    );

    return result.rows[0] || null;
  } catch (err) {
    console.error("[E-Manifest] Fetch error:", err.message);
    return null;
  }
}

import nodemailer from "nodemailer";

/**
 * Creates nodemailer transport based on environment config
 */
function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT, 10) || 465;
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || "").trim();
  const pass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "").trim();

  // Only attempt live SMTP connection if password is configured
  if (user && pass && pass.length >= 8) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 2500,
      greetingTimeout: 2000,
      socketTimeout: 3000,
    });
  }

  return null;
}

/**
 * Sends an email with graceful fallback if SMTP is offline/unconfigured
 */
export async function sendEmail({ to, subject, html, text }) {
  const from = process.env.EMAIL_FROM || "Nishan Transport Dispatch <dispatch@nishantransport.com>";
  const transporter = getTransporter();

  if (!to) {
    console.warn("⚠️ No recipient specified for email:", subject);
    return { success: false, reason: "No recipient specified" };
  }

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      console.log(`✉️ Email dispatched to ${to} (Message ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId, to, subject };
    } catch (err) {
      console.error(`❌ Failed to dispatch email to ${to}:`, err.message);
      return { success: false, error: err.message, to, subject, simulated: true };
    }
  } else {
    console.log(`📫 [Simulated Email Delivery] To: ${to} | Subject: ${subject}`);
    return { success: true, simulated: true, to, subject };
  }
}

/**
 * Generates Step 7: Customer Confirmation Email
 * Subject: Load Entered — NISHAN-[Load Number]
 */
export function buildCustomerConfirmationEmail({
  loadNumber,
  tenderData,
  trackingUrl,
}) {
  const subject = `Load Entered — NISHAN-${loadNumber}`;
  const customerName = tenderData.customer_name || "Valued Customer";
  const origin = tenderData.origin || tenderData.shipper_address || "Origin";
  const destination = tenderData.destination || tenderData.consignee_address || "Destination";
  const pickupDate = tenderData.pickup_date || "Scheduled";
  const deliveryDate = tenderData.delivery_date || "Scheduled";
  const poRef = tenderData.po_number || "N/A";
  const commodity = tenderData.commodity || "General Freight Cargo";
  const weight = tenderData.weight ? Number(tenderData.weight).toLocaleString() : "TBD";
  const rate = tenderData.rate ? `$${Number(tenderData.rate).toLocaleString()} ${tenderData.currency || "USD"}` : "Agreed Rate";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; color: #ffffff; padding: 24px; text-align: left; }
    .logo { font-size: 20px; font-weight: 900; color: #38bdf8; letter-spacing: -0.5px; }
    .status-badge { display: inline-block; background: #10b981; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-top: 10px; font-family: monospace; }
    .content { padding: 24px; line-height: 1.6; font-size: 14px; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #f8fafc; padding: 18px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 20px 0; }
    .grid-col strong { display: block; font-size: 10px; text-transform: uppercase; color: #64748b; margin-bottom: 2px; }
    .btn { display: inline-block; background: #0284c7; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 13px; text-align: center; margin-top: 10px; }
    .footer { padding: 18px 24px; background: #f8fafc; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">NISHAN TRANSPORT INC.</div>
      <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Automated Load Confirmation Intake</div>
      <div class="status-badge">STATUS: ENTERED • LOAD NISHAN-${loadNumber}</div>
    </div>

    <div class="content">
      <p>Hello <strong>${customerName}</strong>,</p>
      
      <p>Thank you for booking with Nishan Transport Inc. Your load confirmation has been successfully received, verified by our AI intake system, and entered into our operational dispatch system.</p>

      <div class="summary-grid">
        <div class="grid-col">
          <strong>Customer PO / Ref</strong>
          ${poRef}
        </div>
        <div class="grid-col">
          <strong>Agreed Rate</strong>
          ${rate}
        </div>
        <div class="grid-col">
          <strong>Shipper (Pickup)</strong>
          ${origin}<br />
          <span style="color: #0284c7; font-weight: bold;">${pickupDate}</span>
        </div>
        <div class="grid-col">
          <strong>Consignee (Delivery)</strong>
          ${destination}<br />
          <span style="color: #0284c7; font-weight: bold;">${deliveryDate}</span>
        </div>
        <div class="grid-col">
          <strong>Commodity & Weight</strong>
          ${commodity} (${weight} lbs)
        </div>
        <div class="grid-col">
          <strong>Equipment / Status</strong>
          53ft Dry Van • <strong>Entered</strong>
        </div>
      </div>

      <p>Our operational dispatch team is actively scheduling carrier assets. You can track this load's live milestone status, driver assignment, and documentation below:</p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${trackingUrl}" class="btn">View Live Tracking & Load Details ➔</a>
      </div>
    </div>

    <div class="footer">
      Nishan Transport Inc. • 24/7 Dedicated Logistics & Cross-Border Dispatch<br />
      Carrier SCAC: <strong>NISD</strong> • CBSA Code: <strong>22GY</strong> • US DOT: 3891024
    </div>
  </div>
</body>
</html>
`;

  return {
    to: tenderData.customer_email,
    subject,
    html,
    text: `Load Entered — NISHAN-${loadNumber}. Customer Ref: ${poRef}. Origin: ${origin} on ${pickupDate}. Destination: ${destination} on ${deliveryDate}. Rate: ${rate}. Commodity: ${commodity}. Tracking: ${trackingUrl}`,
  };
}

/**
 * Generates Step 8: Customs Document Request Email
 * Subject: Customs Documents Required — Load NISHAN-[Load Number]
 */
export function buildCustomsDocumentRequestEmail({
  loadNumber,
  tenderData,
  borderDirection = "INBOUND_US",
  leadNumber = "",
}) {
  const subject = `Customs Documents Required — Load NISHAN-${loadNumber}`;
  const customerName = tenderData.customer_name || "Customer Shipping Team";
  const origin = tenderData.origin || tenderData.shipper_address || "Canada";
  const destination = tenderData.destination || tenderData.consignee_address || "USA";
  const customsBroker = tenderData.customs_broker || "Livingston International";
  const isUsInbound = borderDirection === "INBOUND_US";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #fecdd3; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #881337; color: #ffffff; padding: 24px; text-align: left; }
    .logo { font-size: 20px; font-weight: 900; color: #fecdd3; letter-spacing: -0.5px; }
    .alert-badge { display: inline-block; background: #e11d48; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-top: 10px; font-family: monospace; }
    .content { padding: 24px; line-height: 1.6; font-size: 14px; }
    .docs-list { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 18px; margin: 18px 0; }
    .docs-list li { margin-bottom: 8px; font-size: 13px; color: #9f1239; }
    .footer { padding: 18px 24px; background: #f8fafc; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">NISHAN TRANSPORT INC. • CUSTOMS COMPLIANCE</div>
      <div style="font-size: 13px; color: #fecdd3; margin-top: 4px;">Cross-Border Manifest Clearance Dept</div>
      <div class="alert-badge">ACTION REQUIRED • LOAD NISHAN-${loadNumber}</div>
    </div>

    <div class="content">
      <p>Hello <strong>${customerName}</strong>,</p>
      
      <p>Load <strong>NISHAN-${loadNumber}</strong> is scheduled for cross-border transit (<strong>${origin} ➔ ${destination}</strong>).</p>

      <p>To ensure timely ${isUsInbound ? "US CBP PAPS / ACE Manifest" : "CBSA PARS / ACI Manifest"} filing and avoid border delays, please reply to this email with the following required customs paperwork:</p>

      <div class="docs-list">
        <ul style="margin: 0; padding-left: 20px;">
          <li><strong>Commercial Invoice (CI)</strong> with line-item currency valuation and Harmonized Tariff codes (HTS).</li>
          <li><strong>Packing List (PL)</strong> with piece counts, weight, and pallet specifications.</li>
          <li><strong>Certificate of Origin / USMCA Certification</strong> (if applicable).</li>
          <li><strong>Customs Broker Contact / Filer Code</strong> (Currently assigned: <em>${customsBroker}</em>).</li>
        </ul>
      </div>

      <p>Our carrier lead barcode for this shipment is: <strong style="font-family: monospace; color: #881337; font-size: 15px;">${leadNumber || `NISD${loadNumber}`}</strong></p>

      <p>Please transmit these documents as soon as possible so our compliance team can set up entry clearance prior to driver arrival at the pickup facility.</p>
    </div>

    <div class="footer">
      Nishan Transport Inc. • 24/7 Customs & Cross-Border Compliance Division<br />
      Carrier SCAC: <strong>NISD</strong> • CBSA Carrier Code: <strong>22GY</strong>
    </div>
  </div>
</body>
</html>
`;

  return {
    to: tenderData.customer_email,
    subject,
    html,
    text: `Customs Documents Required — Load NISHAN-${loadNumber}. Origin: ${origin}, Destination: ${destination}. Please provide Commercial Invoice, Packing List, and Broker Info. Lead #: ${leadNumber}`,
  };
}

/**
 * Generates Load Milestone Update Email
 * Subject: Load [Status] — NISHAN-[Load Number]
 */
export function buildLoadMilestoneEmail({
  loadNumber,
  status,
  trackingUrl,
  customerName = "Valued Customer",
  driverName = null,
  truckNumber = null,
  estimatedDelivery = null,
}) {
  const statusTitles = {
    picked_up: "Load Picked Up",
    in_transit: "Load in Transit",
    delivered: "Load Delivered",
    exception: "Load Exception",
  };

  const subject = `Load ${statusTitles[status] || status} — NISHAN-${loadNumber}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; color: #ffffff; padding: 24px; text-align: left; }
    .logo { font-size: 20px; font-weight: 900; color: #38bdf8; letter-spacing: -0.5px; }
    .status-badge { display: inline-block; background: #10b981; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-top: 10px; font-family: monospace; }
    .content { padding: 24px; line-height: 1.6; font-size: 14px; }
    .btn { display: inline-block; background: #0284c7; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 13px; text-align: center; margin-top: 10px; }
    .footer { padding: 18px 24px; background: #f8fafc; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">NISHAN TRANSPORT INC.</div>
      <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Real-Time Load Status Update</div>
      <div class="status-badge">STATUS: ${status.toUpperCase()} • LOAD NISHAN-${loadNumber}</div>
    </div>

    <div class="content">
      <p>Hello <strong>${customerName}</strong>,</p>

      <p>Your load <strong>NISHAN-${loadNumber}</strong> has reached a new milestone: <strong>${statusTitles[status] || status}</strong>.</p>

      ${driverName ? `<p><strong>Driver:</strong> ${driverName}</p>` : ""}
      ${truckNumber ? `<p><strong>Equipment:</strong> ${truckNumber}</p>` : ""}
      ${estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>` : ""}

      <p>Click below to view live tracking details and full shipment status:</p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${trackingUrl}" class="btn">View Live Tracking ➔</a>
      </div>
    </div>

    <div class="footer">
      Nishan Transport Inc. • 24/7 Dedicated Logistics & Cross-Border Dispatch<br />
      Carrier SCAC: <strong>NISD</strong> • CBSA Code: <strong>22GY</strong> • US DOT: 3891024
    </div>
  </div>
</body>
</html>
`;

  return {
    to: customerName ? undefined : trackingUrl, // Placeholder — real to: address comes from load record
    subject,
    html,
    text: `${subject}. Click here to view: ${trackingUrl}`,
  };
}

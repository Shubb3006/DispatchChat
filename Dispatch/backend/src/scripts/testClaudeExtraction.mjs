/**
 * Smoke test for the Claude load-tender extractor.
 *   node src/scripts/testClaudeExtraction.mjs
 * Requires ANTHROPIC_API_KEY in Dispatch/backend/.env (plus ANTHROPIC_WORKSPACE_ID
 * if the key is org-scoped rather than workspace-scoped).
 */
import dotenv from "dotenv";
dotenv.config();
const { extractWithClaude, isClaudeConfigured, CLAUDE_MODEL } = await import("../services/claudeLoadTender.js");

console.log("configured:", isClaudeConfigured(), "| model:", CLAUDE_MODEL);

const sample = `
RATE CONFIRMATION - Weston Wood Solutions
Load / Order #: 582440       PO: PO-99214
Total Carrier Pay: $2,850.00 USD

PICKUP: Brampton Millwork Depot
300 Orenda Road, Brampton, ON L6T 1G1, Canada
Phone: 905-677-9120
Date: 08/24/2026   Window: 08:00 - 14:00

DELIVERY: Davenport Distribution Center
45150 Highway 27, Davenport, FL 33896, USA
Phone: 863-420-1188
Date: 08/26/2026   Appt: 09:00

Commodity: Lumber / Wood Millwork Products
Pieces: 14 skids     Weight: 38,560 lbs     FTL
Customs Broker: Livingston International
Notes: Driver must check in at Gate 3. No overnight parking on site.
`;

const t0 = Date.now();
const res = await extractWithClaude({
  emailText: sample,
  emailSubject: "Rate Confirmation 582440 Brampton -> Davenport",
  senderEmail: "dispatch@westonwood.com",
});
console.log("elapsed:", ((Date.now() - t0) / 1000).toFixed(1) + "s");

if (!res.ok) { console.log("FAILED:", res.reason); process.exit(1); }
const d = res.data;
console.log(JSON.stringify({
  load_number: d.load_number, rate: d.rate, currency: d.currency, po_number: d.po_number,
  origin: d.origin, shipper_city: d.shipper_city, shipper_country: d.shipper_country,
  shipper_zipcode: d.shipper_zipcode, pickup_date: d.pickup_date, pickup_time: d.pickup_time,
  destination: d.destination, consignee_city: d.consignee_city, consignee_country: d.consignee_country,
  delivery_date: d.delivery_date, commodity: d.commodity, pieces: d.pieces, piece_type: d.piece_type,
  weight: d.weight, load_type: d.load_type, customs_broker: d.customs_broker,
}, null, 1));

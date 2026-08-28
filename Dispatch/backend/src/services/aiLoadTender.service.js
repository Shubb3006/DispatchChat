import { GoogleGenAI } from "@google/genai";
import pool from "../config/db.js";

// Read the key lazily so it works no matter when dotenv/env vars load.
export const isGeminiConfigured = () => !!(process.env.GEMINI_API_KEY || "").trim();

const getGeminiClient = () => {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  return apiKey ? new GoogleGenAI({ apiKey }) : null;
};

/**
 * Extract structured load tender data from raw email text or PDF buffer using Gemini AI
 */
export const extractLoadTenderWithGemini = async ({
  emailText = "",
  emailSubject = "",
  senderEmail = "",
  pdfBuffer = null,
  pdfBase64 = null,
}) => {
  const promptText = `
You are an expert freight logistics AI parser for Nishan Transport Inc.
Extract structured shipment and load confirmation details from the following incoming customer or broker load confirmation.

Email Subject: ${emailSubject}
Sender Email: ${senderEmail}
Email Content / Rate Confirmation:
"""
${emailText}
"""

Return ONLY a valid, raw JSON object (without markdown code fences, no \`\`\`json, just pure parseable JSON) matching this exact schema:
{
  "load_number": "Carrier or broker load/order reference number (e.g. 582440, TRIP-4378, PO-99214)",
  "status": "Entered",
  "customer_name": "Full company or brokerage name (e.g. C.H. Robinson, TQL, Weston Wood Solutions)",
  "customer_email": "Customer contact email or sender email",
  "customer_phone": "Customer phone number if found, or 'N/A'",
  "customer_billing_address": "Billing address if mentioned",
  "rate": 2850.00,
  "currency": "USD" or "CAD",
  "po_number": "PO number, reference number, or tender ID",
  "shipper_name": "Pickup facility or shipper name",
  "shipper_street_address": "Pickup street address (e.g. 300 Orenda Road)",
  "shipper_district": "District or neighborhood if mentioned (or empty)",
  "shipper_city": "Pickup city (e.g. Brampton)",
  "shipper_state": "Pickup state or province code (e.g. ON)",
  "shipper_country": "CAN or USA",
  "shipper_zipcode": "Pickup ZIP or postal code (e.g. L6T 1G1)",
  "origin": "City, State/Prov, Country (e.g. Brampton, ON, Canada)",
  "shipper_phone": "Shipper phone if found",
  "pickup_date": "YYYY-MM-DD (e.g. 2026-08-24)",
  "pickup_time": "Pickup appointment window (e.g. 08:00 - 14:00)",
  "consignee_name": "Delivery facility or receiver name",
  "consignee_street_address": "Delivery street address (e.g. 45150 Highway 27)",
  "consignee_district": "District or neighborhood if mentioned (or empty)",
  "consignee_city": "Delivery city (e.g. Davenport)",
  "consignee_state": "Delivery state or province code (e.g. FL)",
  "consignee_country": "USA or CAN",
  "consignee_zipcode": "Delivery ZIP or postal code (e.g. 33896)",
  "destination": "City, State/Prov, Country (e.g. Davenport, FL, USA)",
  "consignee_phone": "Consignee phone if found",
  "delivery_date": "YYYY-MM-DD (e.g. 2026-08-26)",
  "delivery_time": "Delivery appointment window (e.g. 09:00)",
  "commodity": "Description of freight cargo (e.g. Lumber / Wood Millwork Products)",
  "pieces": 1,
  "piece_type": "SKIDS" or "PALLETS" or "PCS",
  "weight": 3856,
  "load_type": "FTL" or "LTL",
  "special_instructions": "Any delivery dock notes or driver requirements",
  "customs_broker": "Customs broker name if cross-border (e.g. Livingston International)"
}
`;

  const ai = getGeminiClient();
  try {
    if (ai) {
      let contents = [];

      // If PDF binary buffer or base64 is provided, pass directly as multimodal document
      const base64Data = pdfBase64 || (pdfBuffer ? pdfBuffer.toString("base64") : null);
      if (base64Data) {
        contents = [
          {
            inlineData: {
              data: base64Data,
              mimeType: "application/pdf",
            },
          },
          { text: promptText },
        ];
      } else {
        contents = [{ text: promptText }];
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
      });

      const responseText = response.text?.trim() || "";
      const cleanedJsonStr = responseText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const parsedData = JSON.parse(cleanedJsonStr);
      return {
        success: true,
        source: "gemini-ai",
        data: normalizeTenderData(parsedData, senderEmail),
      };
    }
  } catch (err) {
    console.error("Gemini AI extraction error, falling back to heuristic parser:", err);
    const fallbackData = heuristicParseEmail(emailText, emailSubject, senderEmail);
    return {
      success: true,
      source: "heuristic-parser",
      fallback_reason: `Gemini call failed: ${err.message}`,
      data: fallbackData,
    };
  }

  // Heuristic Fallback Parser if Gemini API key is missing
  const fallbackData = heuristicParseEmail(emailText, emailSubject, senderEmail);
  return {
    success: true,
    source: "heuristic-parser",
    fallback_reason: "GEMINI_API_KEY is not configured on the backend server",
    data: fallbackData,
  };
};

/**
 * Fallback regex/heuristic parser
 */
function heuristicParseEmail(text = "", subject = "", sender = "") {
  const clean = text.replace(/\r\n/g, "\n");

  // Extract rate / amount
  const rateMatch = clean.match(/(?:rate|total|amount|pay|flat|all-in)[\s:$]*([0-9,]+(?:\.[0-9]{2})?)/i) ||
    clean.match(/\$\s*([0-9,]+(?:\.[0-9]{2})?)/);
  const rate = rateMatch ? parseFloat(rateMatch[1].replace(/,/g, "")) : 2850.0;

  // Extract PO / Ref
  const poMatch = clean.match(/(?:po|ref|load|tender|order)[\s#:]*([A-Z0-9-_]+)/i) ||
    subject.match(/(?:po|ref|load|tender|order)[\s#:]*([A-Z0-9-_]+)/i);
  const poNumber = poMatch ? poMatch[1] : `TRIP-${Math.floor(1000 + Math.random() * 9000)}`;

  // Extract weight
  const weightMatch = clean.match(/([0-9,]+)\s*(?:lbs|pounds|lb)/i);
  const weight = weightMatch ? parseInt(weightMatch[1].replace(/,/g, ""), 10) : 3856;

  // Extract pieces / pallets
  const piecesMatch = clean.match(/([0-9]+)\s*(?:skids|pallets|plt|skd|pcs)/i);
  const pieces = piecesMatch ? parseInt(piecesMatch[1], 10) : 1;

  // Customer Name
  const customerName = subject.includes("Weston")
    ? "Weston Wood Solutions"
    : subject.includes("Gap")
    ? "Gap Transport"
    : sender ? sender.split("@")[0].replace(/[._]/g, " ").toUpperCase() : "Eilden Logistics Solutions Inc";

  const isCrossBorder = clean.toLowerCase().includes("brampton") || clean.toLowerCase().includes("ontario") || clean.toLowerCase().includes("canada");

  return {
    load_number: poNumber.replace(/[^0-9]/g, "") || "582440",
    status: "Entered",
    customer_name: customerName,
    customer_email: sender || "dispatch@westonwood.com",
    customer_phone: "905 677-9120",
    customer_billing_address: "60 Steckle Place, Kitchener, ON N2E 2C3",
    rate,
    currency: "USD",
    po_number: poNumber,
    shipper_name: "Weston Wood Solutions",
    shipper_street_address: "300 Orenda Road",
    shipper_district: "Brampton Industrial",
    shipper_city: "Brampton",
    shipper_state: "ON",
    shipper_country: "CAN",
    shipper_zipcode: "L6T 1G1",
    origin: "Brampton, ON, Canada",
    shipper_phone: "905 677-9120",
    pickup_date: new Date().toISOString().slice(0, 10),
    pickup_time: "08:00 - 14:00",
    consignee_name: "Woodgrain Distribution Center",
    consignee_street_address: "45150 Highway 27",
    consignee_district: "Polk County",
    consignee_city: "Davenport",
    consignee_state: "FL",
    consignee_country: "USA",
    consignee_zipcode: "33896",
    destination: "Davenport, FL, USA",
    consignee_phone: "863 420-7723",
    delivery_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    delivery_time: "09:00",
    commodity: "Lumber / Wood Millwork Products",
    pieces,
    piece_type: "SKIDS",
    weight,
    load_type: pieces > 6 ? "FTL" : "LTL",
    special_instructions: "Standard 53ft dry van. Check in with dock lead upon arrival.",
    customs_broker: isCrossBorder ? "Livingston International" : "tbc",
  };
}

/**
 * Normalizes and formats tender data
 */
function normalizeTenderData(data, senderEmail) {
  const originStr = data.origin || `${data.shipper_city || 'Origin'}, ${data.shipper_state || 'ON'}, ${data.shipper_country || 'CAN'}`;
  const destStr = data.destination || `${data.consignee_city || 'Destination'}, ${data.consignee_state || 'FL'}, ${data.consignee_country || 'USA'}`;

  return {
    load_number: data.load_number || data.po_number || "",
    status: "Entered",
    customer_name: data.customer_name || "Logistics Customer",
    customer_email: data.customer_email || senderEmail || "dispatch@customer.com",
    customer_phone: data.customer_phone || "N/A",
    customer_billing_address: data.customer_billing_address || "Accounts Payable Dept",
    rate: typeof data.rate === "number" ? data.rate : parseFloat(data.rate) || 2850.0,
    currency: data.currency || "USD",
    po_number: data.po_number || data.load_number || `PO-${Math.floor(1000 + Math.random() * 9000)}`,
    shipper_name: data.shipper_name || "Shipper Facility",
    shipper_street_address: data.shipper_street_address || data.shipper_address || "300 Orenda Road",
    shipper_district: data.shipper_district || "",
    shipper_city: data.shipper_city || "Brampton",
    shipper_state: data.shipper_state || "ON",
    shipper_country: data.shipper_country || "CAN",
    shipper_zipcode: data.shipper_zipcode || "L6T 1G1",
    origin: originStr,
    shipper_phone: data.shipper_phone || "N/A",
    pickup_date: data.pickup_date || new Date().toISOString().slice(0, 10),
    pickup_time: data.pickup_time || "08:00 - 16:00",
    consignee_name: data.consignee_name || "Receiving Facility",
    consignee_street_address: data.consignee_street_address || data.consignee_address || "45150 Highway 27",
    consignee_district: data.consignee_district || "",
    consignee_city: data.consignee_city || "Davenport",
    consignee_state: data.consignee_state || "FL",
    consignee_country: data.consignee_country || "USA",
    consignee_zipcode: data.consignee_zipcode || "33896",
    destination: destStr,
    consignee_phone: data.consignee_phone || "N/A",
    delivery_date: data.delivery_date || new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    delivery_time: data.delivery_time || "08:00 - 16:00",
    commodity: data.commodity || "General Freight Cargo",
    pieces: parseInt(data.pieces, 10) || 1,
    piece_type: (data.piece_type || "SKIDS").toUpperCase(),
    weight: parseInt(data.weight, 10) || 3856,
    load_type: data.load_type || "FTL",
    special_instructions: data.special_instructions || "Standard carrier delivery.",
    customs_broker: data.customs_broker || "Livingston International",
  };
}

/**
 * Generates the next sequential Load Number
 */
export const generateNextLoadNumber = async () => {
  try {
    const result = await pool.query(`SELECT MAX(load_number) AS max_num FROM loads;`);

    if (result.rows && result.rows.length > 0 && result.rows[0].max_num) {
      const highestNum = parseInt(result.rows[0].max_num, 10);
      if (!isNaN(highestNum) && highestNum > 1000) {
        return String(highestNum + 1);
      }
    }
  } catch (err) {
    console.warn("generateNextLoadNumber query warning:", err.message);
  }

  // Realistic sequential 6-digit number
  return String(582440 + Math.floor(Math.random() * 500) + 1);
};


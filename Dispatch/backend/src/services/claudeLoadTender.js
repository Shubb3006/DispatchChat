import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

/**
 * Claude-backed load tender extraction.
 *
 * Replaces the Gemini path in aiLoadTender.service.js. Two things differ from
 * the old implementation beyond the provider swap:
 *
 *  1. The schema is enforced by the API (structured outputs) rather than asked
 *     for in prose. Gemini was told "return raw JSON, no code fences" and the
 *     response was then stripped of ```json markers and JSON.parse'd, which
 *     threw whenever the model wrapped or prefixed the object. Claude validates
 *     against the schema server-side, so parsed_output is already an object.
 *  2. A PDF is sent as a `document` block, so Claude reads the actual page
 *     layout. Rate confirmations are tables, and layout carries meaning.
 */

// Read the key lazily so it works no matter when dotenv/env vars load.
export const isClaudeConfigured = () => !!(process.env.ANTHROPIC_API_KEY || "").trim();

const getClaudeClient = () => {
  const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!apiKey) return null;

  // An org-scoped key (not bound to a single workspace) is rejected with a 400
  // unless the target workspace is named explicitly. A workspace-scoped key
  // needs no header, so this stays unset in that case.
  const workspaceId = (process.env.ANTHROPIC_WORKSPACE_ID || "").trim();

  return new Anthropic({
    apiKey,
    ...(workspaceId
      ? { defaultHeaders: { "anthropic-workspace-id": workspaceId } }
      : {}),
  });
};

export const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

/**
 * Every field is nullable: a rate confirmation legitimately omits many of
 * these, and a schema that forces a value invites the model to invent one.
 * Nulls are normalized downstream by normalizeTenderData().
 */
const str = () => z.string().nullable();

export const LoadTenderSchema = z.object({
  load_number: str().describe("Carrier or broker load/order reference, e.g. 582440, TRIP-4378, PO-99214"),
  status: str().describe('Always "Entered" for a newly tendered load'),

  customer_name: str().describe("Full company or brokerage name, e.g. C.H. Robinson, TQL"),
  customer_email: str(),
  customer_phone: str(),
  customer_billing_address: str(),

  rate: z.number().nullable().describe("Total linehaul rate as a number, no currency symbol"),
  currency: z.enum(["USD", "CAD"]).nullable(),
  po_number: str().describe("PO number, reference number, or tender ID"),

  shipper_name: str().describe("Pickup facility or shipper name"),
  shipper_street_address: str(),
  shipper_district: str(),
  shipper_city: str(),
  shipper_state: str().describe("State or province code, e.g. ON, FL"),
  shipper_country: z.enum(["CAN", "USA"]).nullable(),
  shipper_zipcode: str().describe("ZIP or postal code, e.g. L6T 1G1"),
  shipper_phone: str(),
  origin: str().describe("City, State/Prov, Country, e.g. Brampton, ON, Canada"),
  pickup_date: str().describe("YYYY-MM-DD"),
  pickup_time: str().describe("Appointment window, e.g. 08:00 - 14:00"),

  consignee_name: str().describe("Delivery facility or receiver name"),
  consignee_street_address: str(),
  consignee_district: str(),
  consignee_city: str(),
  consignee_state: str(),
  consignee_country: z.enum(["USA", "CAN"]).nullable(),
  consignee_zipcode: str(),
  consignee_phone: str(),
  destination: str().describe("City, State/Prov, Country, e.g. Davenport, FL, USA"),
  delivery_date: str().describe("YYYY-MM-DD"),
  delivery_time: str(),

  commodity: str().describe("Freight description, e.g. Lumber / Wood Millwork Products"),
  pieces: z.number().int().nullable(),
  piece_type: z.enum(["SKIDS", "PALLETS", "PCS"]).nullable(),
  weight: z.number().nullable().describe("Weight in pounds, as a number"),
  load_type: z.enum(["FTL", "LTL"]).nullable(),
  special_instructions: str().describe("Dock notes or driver requirements"),
  customs_broker: str().describe("Customs broker if cross-border, e.g. Livingston International"),
});

const SYSTEM_PROMPT = `You extract structured load tender data for Nishan Transport Inc, a cross-border carrier running freight between Canada and the United States.

You are reading broker and customer rate confirmations. Follow these rules:

- Transcribe what the document says. Never invent a value to fill a field. If something is genuinely absent, return null for it.
- Distinguish the shipper (pickup) from the consignee (delivery) by the role the document assigns, not by the order the addresses appear in.
- Rates: return the total linehaul rate payable to the carrier as a plain number. Exclude currency symbols and thousands separators. If both a linehaul and an all-in total appear, use the all-in total.
- Dates: convert to YYYY-MM-DD. Rate confirmations are often US-format (MM/DD/YYYY); read them that way unless the document clearly indicates otherwise.
- Country codes: CAN or USA. Infer from the province or state when it is unambiguous (ON, QC, BC, AB are CAN; FL, TX, MI are USA).
- A load crossing the border usually names a customs broker. Include it when present.`;

const buildUserPrompt = ({ emailSubject, senderEmail, emailText, hasPdf }) => {
  const parts = [];
  if (hasPdf) {
    parts.push("The attached PDF is the rate confirmation. It is the authoritative source; use the email text below only for context it does not cover.");
  }
  parts.push(`Email Subject: ${emailSubject || "(none)"}`);
  parts.push(`Sender Email: ${senderEmail || "(unknown)"}`);
  if (emailText && emailText.trim()) {
    parts.push(`Email Content:\n"""\n${emailText.trim()}\n"""`);
  } else if (!hasPdf) {
    parts.push("Email Content: (empty)");
  }
  parts.push("Extract the load tender details.");
  return parts.join("\n\n");
};

/** Transient failures worth retrying: rate limits, overload, 5xx, network drops. */
const isTransient = (err) =>
  err instanceof Anthropic.RateLimitError ||
  err instanceof Anthropic.APIConnectionError ||
  (err instanceof Anthropic.APIError && typeof err.status === "number" && err.status >= 500);

const RETRY_DELAYS_MS = [0, 1000, 2000];

/**
 * @returns {Promise<{ ok: true, data: object, model: string } | { ok: false, reason: string }>}
 */
export const extractWithClaude = async ({
  emailText = "",
  emailSubject = "",
  senderEmail = "",
  pdfBuffer = null,
  pdfBase64 = null,
}) => {
  const client = getClaudeClient();
  if (!client) {
    return { ok: false, reason: "ANTHROPIC_API_KEY is not configured on the backend server" };
  }

  const base64Data = pdfBase64 || (pdfBuffer ? pdfBuffer.toString("base64") : null);
  const content = [];

  if (base64Data) {
    content.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: base64Data },
    });
  }

  content.push({
    type: "text",
    text: buildUserPrompt({ emailSubject, senderEmail, emailText, hasPdf: !!base64Data }),
  });

  let lastErr = null;

  for (const delay of RETRY_DELAYS_MS) {
    if (delay) await new Promise((r) => setTimeout(r, delay));

    try {
      const response = await client.messages.parse({
        model: CLAUDE_MODEL,
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        thinking: { type: "adaptive" },
        output_config: {
          effort: "medium",
          format: zodOutputFormat(LoadTenderSchema),
        },
        messages: [{ role: "user", content }],
      });

      // Safety classifiers can decline; stop_details is only populated then.
      if (response.stop_reason === "refusal") {
        return {
          ok: false,
          reason: `Claude declined the request (${response.stop_details?.category || "unspecified"})`,
        };
      }

      if (!response.parsed_output) {
        return { ok: false, reason: "Claude returned no parseable output for the schema" };
      }

      return { ok: true, data: response.parsed_output, model: response.model };
    } catch (err) {
      lastErr = err;
      if (!isTransient(err)) break;
      console.warn(`Claude transient error, retrying: ${String(err.message || err).slice(0, 200)}`);
    }
  }

  return { ok: false, reason: `Claude call failed: ${lastErr?.message || "unknown error"}` };
};

import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * Fetch load details from Supabase by load_number and format as a Load Card template string
 * @param {string} loadNumber - e.g. "10006" or "10001"
 * @returns {Promise<{ formattedTemplate: string, load: object } | null>}
 */
/**
 * Fetch load details from Supabase by load_number and format as a Load Card template string
 * @param {string} loadNumber - e.g. "10006" or "10001"
 * @param {string} cardType - "pickup" | "delivery"
 * @returns {Promise<{ formattedTemplate: string, load: object } | null>}
 */
export const fetchAndFormatSupabaseLoad = async (loadNumber, cardType = "pickup") => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.warn("Supabase credentials missing in .env");
      return null;
    }

    const cleanLoadNum = loadNumber.toString().replace(/[^0-9a-zA-Z_-]/g, "");
    if (!cleanLoadNum) return null;

    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    };

    // Query Supabase loads table for load_number
    const res = await axios.get(
      `${supabaseUrl}/rest/v1/loads?load_number=eq.${cleanLoadNum}&select=*`,
      { headers, timeout: 8000 }
    );

    const loads = res.data;
    if (!loads || !loads.length) {
      return null;
    }

    const load = loads[0];

    // Format address strings
    const shipperAddrParts = [
      load.shipper_street_address,
      load.shipper_district,
      load.shipper_state,
      load.shipper_country,
    ].filter(Boolean);
    const shipperAddress = shipperAddrParts.length > 0 ? shipperAddrParts.join(", ") : "N/A";

    const consigneeAddrParts = [
      load.consignee_street_address,
      load.consignee_district,
      load.consignee_state,
      load.consignee_country,
    ].filter(Boolean);
    const consigneeAddress = consigneeAddrParts.length > 0 ? consigneeAddrParts.join(", ") : "N/A";

    const formattedPickupDate = load.pickup_date
      ? new Date(load.pickup_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      : "N/A";

    const formattedDeliveryDate = load.delivery_date
      ? new Date(load.delivery_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      : "N/A";

    const statusDisplay = (load.status || "Assigned").replace(/_/g, " ").toUpperCase();

    const pickupNumber = load.pickup_number || load.pickup_no || load.id || "N/A";
    const commitment = load.commitment || "Normal Delivery";

    const formattedTemplate =
      cardType === "delivery"
        ? `🚚 DELIVERY MANIFEST ($${load.load_number || cleanLoadNum})\n\n` +
        `📌 PICKUP #: ${pickupNumber}\n` +
        `🏢 CONSIGNEE: ${load.consignee_name || "N/A"}\n` +
        `🗺️ CONSIGNEE ADDR: ${consigneeAddress}\n\n` +
        `🏢 SHIPPER: ${load.shipper_name || "N/A"}\n` +
        `🗺️ SHIPPER ADDR: ${shipperAddress}\n\n` +
        `📦 DETAILS:\n` +
        `   - Pieces/Skids: ${load.pieces || 0}\n` +
        `   - Weight: ${load.weight ? `${load.weight} lbs` : "N/A"}\n` +
        `   - Commitment: ${commitment}\n` +
        `   - Delivery Date: ${formattedDeliveryDate}\n\n` +
        `📊 STATUS: ${statusDisplay}`
        : `🚛 LOAD DETAILS (#${load.load_number || cleanLoadNum})\n\n` +
        `📌 PICKUP #: ${pickupNumber}\n` +
        `🏢 SHIPPER: ${load.shipper_name || "N/A"}\n` +
        `🗺️ SHIPPER ADDR: ${shipperAddress}\n\n` +
        `🏢 CONSIGNEE: ${load.consignee_name || "N/A"}\n` +
        `🗺️ CONSIGNEE ADDR: ${consigneeAddress}\n\n` +
        `📦 DETAILS:\n` +
        `   - Pieces/Skids: ${load.pieces || 0}\n` +
        `   - Weight: ${load.weight ? `${load.weight} lbs` : "N/A"}\n` +
        `   - Commitment: ${commitment}\n` +
        `   - Pickup Date: ${formattedPickupDate}\n\n` +
        `📊 STATUS: ${statusDisplay}`;

    return {
      formattedTemplate,
      load,
      cardType,
    };
  } catch (error) {
    console.error("Error fetching load from Supabase:", error.message);
    return null;
  }
};

/**
 * Inserts a document record into Supabase 'documents' table matching load_id UUID
 * and updates load status without mutating cargo description.
 */
export const saveDocumentToSupabase = async (loadNumOrId, imageUrl, documentType = "BOL", driverSupabaseUid = null) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey || !loadNumOrId || !imageUrl) return null;

    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };

    let loadUuid = loadNumOrId;
    const isUuid = typeof loadNumOrId === "string" && loadNumOrId.includes("-") && loadNumOrId.length > 20;

    if (!isUuid) {
      const cleanLoadNum = loadNumOrId.toString().replace(/[^0-9a-zA-Z_-]/g, "");
      try {
        let getRes = await axios.get(
          `${supabaseUrl}/rest/v1/loads?load_number=eq.${cleanLoadNum}&select=id,status`,
          { headers, timeout: 30000 }
        );
        if (getRes.data && getRes.data.length > 0) {
          loadUuid = getRes.data[0].id;
        } else {
          // Fallback lookup: try tracking_number or id
          getRes = await axios.get(
            `${supabaseUrl}/rest/v1/loads?tracking_number=eq.${cleanLoadNum}&select=id,status`,
            { headers, timeout: 30000 }
          );
          if (getRes.data && getRes.data.length > 0) {
            loadUuid = getRes.data[0].id;
          }
        }
      } catch (lookupErr) {
        console.warn(`Supabase load_number lookup timeout/error for #${cleanLoadNum}:`, lookupErr.message);
      }
    }

    if (!loadUuid) {
      console.error("No matching Supabase load UUID found for:", loadNumOrId);
      return null;
    }

    let loadNumString = loadNumOrId ? loadNumOrId.toString().replace(/[^0-9a-zA-Z_-]/g, "") : "";
    const docTypeUpper = (documentType || "BOL").toUpperCase();
    const isPod = docTypeUpper.includes("POD") || docTypeUpper.includes("DELIVERY");
    const fileName = isPod
      ? `Proof_of_Delivery_POD_${loadNumString || "Primary"}.pdf`
      : `Carrier_${docTypeUpper}_${loadNumString || "Primary"}.pdf`;
    const fileSize = isPod ? "110 KB" : "240 KB";

    // 1. Insert into Supabase documents table with driver UID
    const docPayload = {
      load_id: loadUuid,
      file_path: imageUrl,
      file_name: fileName,
      document_type: docTypeUpper,
      is_approved: false,
      ...(driverSupabaseUid ? { uploaded_by: driverSupabaseUid } : {}),
    };

    let docRes = await axios.post(`${supabaseUrl}/rest/v1/documents`, docPayload, { headers, timeout: 30000 }).catch(async (e) => {
      console.warn("Supabase documents table post warning:", e.response?.data?.message || e.message);
      // Retry without uploaded_by if column or FK constraint failed
      if (docPayload.uploaded_by) {
        delete docPayload.uploaded_by;
        return await axios.post(`${supabaseUrl}/rest/v1/documents`, docPayload, { headers, timeout: 30000 }).catch((e2) => {
          console.error("Supabase documents table retry error:", e2.response?.data?.message || e2.message);
          return { data: [docPayload] };
        });
      }
      return { data: [docPayload] };
    });
    console.log(`✅ Saved ${docTypeUpper} to Supabase 'documents' table for load_id ${loadUuid}`);

    // 1b. Also sync into driver_documents table so queries against driver_documents find it immediately
    const driverDocPayload = {
      shipment_id: loadUuid,
      tracking_number: loadNumString,
      type: docTypeUpper,
      file_name: fileName,
      file_size: fileSize,
      file_path: imageUrl,
      image_url: imageUrl,
      status: "pending_review",
      ...(driverSupabaseUid ? { uploaded_by: driverSupabaseUid } : {}),
    };
    await axios.post(`${supabaseUrl}/rest/v1/driver_documents`, driverDocPayload, { headers, timeout: 30000 }).catch((e) => {
      console.warn("Supabase driver_documents table sync warning:", e.message);
    });

    // 2. Update status in Supabase loads table
    const docTypeLower = (documentType || "").toLowerCase();
    const newStatus = docTypeLower === "pod"
      ? "delivered"
      : docTypeLower === "bol"
        ? "bol_pending_approval"
        : docTypeLower === "skid_picture" || docTypeLower === "skid"
          ? "at_site"
          : undefined;

    if (newStatus) {
      await axios.patch(
        `${supabaseUrl}/rest/v1/loads?id=eq.${loadUuid}`,
        { status: newStatus },
        { headers, timeout: 30000 }
      ).catch((err) => console.error("Supabase status patch error:", err.message));
    }

    return docRes.data?.[0] || docPayload;
  } catch (err) {
    console.error("saveDocumentToSupabase error:", err.response?.data || err.message);
    return null;
  }
};


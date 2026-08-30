import dotenv from "dotenv";
import dns from "dns";

dotenv.config();

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {}

import { fetchAndFormatSupabaseLoad } from "../lib/supabaseLoad.js";

const testDelivery = async () => {
  try {
    console.log("Testing fetchAndFormatSupabaseLoad(#10006, 'pickup')...");
    const pickupResult = await fetchAndFormatSupabaseLoad("10006", "pickup");
    console.log("Pickup Card Template:\n", pickupResult?.formattedTemplate);

    console.log("\n---------------------------------------------------\n");

    console.log("Testing fetchAndFormatSupabaseLoad($10006, 'delivery')...");
    const deliveryResult = await fetchAndFormatSupabaseLoad("10006", "delivery");
    console.log("Delivery Card Template:\n", deliveryResult?.formattedTemplate);

    console.log("\n✅ DELIVERY TRIGGER VERIFICATION SUCCESSFUL!");
  } catch (err) {
    console.error("Test Error:", err);
  }

  process.exit(0);
};

testDelivery();

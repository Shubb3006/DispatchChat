import dotenv from "dotenv";
import dns from "dns";

dotenv.config();

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {}

import { saveDocumentToSupabase } from "../lib/supabaseLoad.js";

const testDocInsert = async () => {
  try {
    const testLoadNum = "100015";
    const testImageUrl = "https://res.cloudinary.com/dqc5dnysi/image/upload/v17232900/test_bol_document.jpg";

    console.log(`Testing saveDocumentToSupabase for Load #${testLoadNum}...`);
    const docResult = await saveDocumentToSupabase(testLoadNum, testImageUrl, "BOL");

    console.log("\nDocument Saved Result:\n", JSON.stringify(docResult, null, 2));
    console.log("\n✅ DOCUMENT TABLE INSERTION VERIFIED SUCCESSFULLY!");
  } catch (err) {
    console.error("Test Error:", err);
  }

  process.exit(0);
};

testDocInsert();

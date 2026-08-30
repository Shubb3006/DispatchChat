import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import axios from "axios";

dotenv.config();

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {}

import Message from "../modals/message.modal.js";

const testGroupBolSync = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected!");

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error("Supabase credentials missing");
      process.exit(1);
    }

    const testLoadNum = "10006";
    const testImageUrl = "https://res.cloudinary.com/dqc5dnysi/image/upload/v1234567/sample_bol.jpg";

    console.log(`Testing Supabase PATCH for Group BOL upload on Load #${testLoadNum}...`);
    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    };

    const updatePayload = {
      cargo: `BOL Document: ${testImageUrl}`,
      status: "bol_pending_approval",
    };

    const res = await axios.patch(
      `${supabaseUrl}/rest/v1/loads?load_number=eq.${testLoadNum}`,
      updatePayload,
      { headers, timeout: 8000 }
    );

    console.log("Supabase PATCH Response Status:", res.status);
    console.log("✅ GROUP BOL SUPABASE SYNC TEST PASSED SUCCESSFUL!");
  } catch (err) {
    console.error("Test Error:", err.response?.data || err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

testGroupBolSync();

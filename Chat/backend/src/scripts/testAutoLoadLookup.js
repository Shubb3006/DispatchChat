import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

dotenv.config();

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {}

import User from "../modals/auth.modal.js";
import Group from "../modals/group.modal.js";
import Message from "../modals/message.modal.js";
import { fetchAndFormatSupabaseLoad } from "../lib/supabaseLoad.js";

const testLookup = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected cleanly!");

    console.log("Testing fetchAndFormatSupabaseLoad(#10006)...");
    const loadResult = await fetchAndFormatSupabaseLoad("10006");
    if (!loadResult) {
      console.log("Load #10006 not found in Supabase.");
    } else {
      console.log("Supabase Load Found:", loadResult.load.load_number);
    }

    console.log("Testing User model query...");
    const drivers = await User.find({ role: "driver" });
    console.log(`Found ${drivers.length} drivers in MongoDB.`);

    console.log("\n✅ ALL CHECKS PASSED: User import & MongoDB DNS connection verified!");
  } catch (err) {
    console.error("Test Error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

testLookup();

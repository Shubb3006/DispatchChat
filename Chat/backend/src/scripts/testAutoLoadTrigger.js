import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "dns";
import User from "../modals/auth.modal.js";
import Group from "../modals/group.modal.js";
import Message from "../modals/message.modal.js";
import { fetchAndFormatSupabaseLoad } from "../lib/supabaseLoad.js";

try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {}

dotenv.config();

const testTrigger = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for testing auto load trigger...");

    const group = await Group.findOne({});
    const sender = await User.findOne({ role: "dispatch" }) || await User.findOne({});

    if (!group || !sender) {
      console.log("No group or sender found");
      process.exit(1);
    }

    console.log(`Simulating user typing: "Here is the load info (#10006) for dispatch" into group "${group.name}"`);

    const text = "Here is the load info (#10006) for dispatch";
    const loadMatch = text.match(/(?:#|\bload\s*#?)\s*(\d{4,6})\b/i) || text.match(/\(?#(\d{4,6})\)?/i);

    if (loadMatch && loadMatch[1]) {
      const loadNumber = loadMatch[1];
      console.log(`Detected load number: #${loadNumber}`);
      console.log("Fetching live details from Supabase...");

      const loadResult = await fetchAndFormatSupabaseLoad(loadNumber);
      if (loadResult) {
        console.log("\n✅ SUCCESS! Formatted Load Card generated:");
        console.log("----------------------------------------");
        console.log(loadResult.formattedTemplate);
        console.log("----------------------------------------");

        const systemMsg = new Message({
          senderId: sender._id,
          groupId: group._id,
          text: loadResult.formattedTemplate,
          documentType: "load_details",
          isUrgent: true,
          status: "sent",
        });
        await systemMsg.save();
        console.log("Saved automated Load Card message to group in MongoDB with ID:", systemMsg._id);
      } else {
        console.log("Load not found in Supabase.");
      }
    }

    process.exit(0);
  } catch (err) {
    console.error("Test error:", err);
    process.exit(1);
  }
};

testTrigger();

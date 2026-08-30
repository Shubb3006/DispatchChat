import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "dns";
import fs from "fs";
import path from "path";
import axios from "axios";
import User from "../modals/auth.modal.js";

try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {}

dotenv.config();

const args = process.argv.slice(2);

const getArg = (flag) => {
  const index = args.indexOf(flag);
  if (index !== -1 && args[index + 1]) {
    return args[index + 1];
  }
  return null;
};

const mapDrivers = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("❌ MONGODB_URI is missing in .env");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    const isListOnly = args.includes("--list") || args.includes("-l");
    const singleIdentifier = getArg("--identifier") || getArg("-i") || getArg("--driver");
    const singleUid = getArg("--uid") || getArg("-u") || getArg("--supabaseUid");
    const isAutoSync = args.includes("--sync") || args.includes("--auto") || true; // Default auto sync if credentials present

    // Mode 1: List all drivers & their supabaseUid status in MongoDB
    if (isListOnly) {
      const drivers = await User.find({ role: "driver" }).select("username fullName email unitNumber supabaseUid");
      console.log("=== CURRENT DRIVERS IN MONGODB ===");
      drivers.forEach((d) => {
        console.log(
          `• [Unit ${d.unitNumber || "N/A"}] ${d.fullName} (@${d.username}) -> Supabase UID: ${
            d.supabaseUid ? `✅ ${d.supabaseUid}` : "❌ NOT MAPPED"
          }`
        );
      });
      console.log("==================================\n");
      process.exit(0);
    }

    // Mode 2: Single Driver Command Line Mapping
    if (singleIdentifier && singleUid) {
      const isValidId = singleIdentifier.match(/^[0-9a-fA-F]{24}$/);
      const updatedDriver = await User.findOneAndUpdate(
        {
          $or: [
            { email: singleIdentifier.toLowerCase() },
            { username: singleIdentifier },
            { unitNumber: singleIdentifier },
            ...(isValidId ? [{ _id: singleIdentifier }] : []),
          ],
        },
        { supabaseUid: singleUid },
        { new: true }
      );

      if (updatedDriver) {
        console.log(`✅ Successfully mapped driver "${updatedDriver.fullName}" (@${updatedDriver.username}) to Supabase UID: ${singleUid}`);
      } else {
        console.error(`❌ Driver matching identifier "${singleIdentifier}" not found.`);
      }
      process.exit(0);
    }

    // Mode 3: Automatic Sync via Supabase Database REST API
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      console.log(`🔄 Connecting to Supabase at ${supabaseUrl}...`);
      const headers = {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      };

      try {
        // 1. Fetch Supabase drivers & users tables
        const [driversRes, usersRes] = await Promise.all([
          axios.get(`${supabaseUrl}/rest/v1/drivers?select=*`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${supabaseUrl}/rest/v1/users?select=*`, { headers }).catch(() => ({ data: [] })),
        ]);

        const supabaseDrivers = driversRes.data || [];
        const supabaseUsers = usersRes.data || [];

        console.log(`Found ${supabaseDrivers.length} drivers and ${supabaseUsers.length} users in Supabase.`);

        // Find MongoDB drivers
        const mongoDrivers = await User.find({ role: "driver" });
        console.log(`Found ${mongoDrivers.length} drivers in MongoDB.`);

        let mappedCount = 0;

        // Strategy A: Map by matching driver ID/user_id directly or by order/username/fullName
        for (let i = 0; i < mongoDrivers.length; i++) {
          const mDriver = mongoDrivers[i];
          const sDriver = supabaseDrivers[i];
          const sUser = supabaseUsers.find((u) => u.role === "driver" && u.id === sDriver?.user_id) || supabaseUsers[i];

          // Use driver ID from Supabase `drivers` table (which matches `loads.driver_id`) or user ID
          const targetUid = sDriver?.id || sDriver?.user_id || sUser?.id;

          if (targetUid) {
            mDriver.supabaseUid = targetUid;
            await mDriver.save();
            console.log(`  ✅ Mapped MongoDB Driver "${mDriver.fullName}" (@${mDriver.username}) -> Supabase UID: ${targetUid}`);
            mappedCount++;
          }
        }

        console.log(`\n🎉 Successfully synced ${mappedCount} drivers from Supabase to MongoDB!`);
        process.exit(0);
      } catch (err) {
        console.error("⚠️ Failed to auto-sync from Supabase API:", err.message);
      }
    }

    // Mode 4: Read driver-mappings.json file if present
    const mappingFilePath = path.join(process.cwd(), "driver-mappings.json");
    if (fs.existsSync(mappingFilePath)) {
      console.log(`📁 Reading driver mappings from ${mappingFilePath}...`);
      const fileData = JSON.parse(fs.readFileSync(mappingFilePath, "utf-8"));
      const mappings = Array.isArray(fileData) ? fileData : fileData.mappings || [];

      let count = 0;
      for (const item of mappings) {
        const id = item.identifier || item.email || item.username || item.unitNumber;
        const uid = item.supabaseUid || item.uid || item.id;
        if (!id || !uid) continue;

        const isValidId = id.match(/^[0-9a-fA-F]{24}$/);
        const driver = await User.findOneAndUpdate(
          {
            $or: [
              { email: id.toLowerCase() },
              { username: id },
              { unitNumber: id },
              ...(isValidId ? [{ _id: id }] : []),
            ],
          },
          { supabaseUid: uid },
          { new: true }
        );

        if (driver) {
          console.log(`  Mapped ${driver.fullName} (${driver.username}) -> ${uid}`);
          count++;
        }
      }
      console.log(`\n🎉 Bulk mapped ${count} drivers from driver-mappings.json!`);
      process.exit(0);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error running mapDrivers script:", error);
    process.exit(1);
  }
};

mapDrivers();

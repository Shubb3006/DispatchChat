import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "dns";
import Group from "../modals/group.modal.js";
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

const setGroupDriver = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const groupName = getArg("--group") || getArg("-g");
    const driverUid = getArg("--driverUid") || getArg("-d") || getArg("--uid");
    const isList = args.includes("--list") || args.includes("-l");

    if (isList) {
      const groups = await Group.find({});
      console.log("=== FLEET GROUP CHANNELS & DRIVER UIDs ===");
      for (const g of groups) {
        let driverInfo = "❌ NO DRIVER UID SET";
        if (g.driverSupabaseUid) {
          const d = await User.findOne({
            $or: [
              { supabaseUid: g.driverSupabaseUid },
              { username: g.driverSupabaseUid },
              { unitNumber: g.driverSupabaseUid },
            ],
          });
          driverInfo = `✅ ${g.driverSupabaseUid} ${d ? `(${d.fullName})` : ""}`;
        }
        console.log(`• Group: "${g.name}" -> Driver UID: ${driverInfo}`);
      }
      console.log("=========================================\n");
      process.exit(0);
    }

    if (!groupName || !driverUid) {
      console.log("ℹ️ USAGE GUIDE:");
      console.log("1. List groups & assigned driver UIDs:");
      console.log("   node src/scripts/setGroupDriver.js --list\n");
      console.log("2. Assign a Driver UID to a Group:");
      console.log("   node src/scripts/setGroupDriver.js --group \"Route #101\" --driverUid 0bc42344-0e93-4eaf-a5ca-55aef138aeca\n");
      process.exit(0);
    }

    const group = await Group.findOne({
      name: { $regex: new RegExp(groupName.trim(), "i") },
    });

    if (!group) {
      console.error(`❌ Group matching "${groupName}" not found.`);
      process.exit(1);
    }

    group.driverSupabaseUid = driverUid.trim();
    await group.save();

    const mappedDriver = await User.findOne({
      $or: [
        { supabaseUid: driverUid },
        { username: driverUid },
        { unitNumber: driverUid },
      ],
    });

    console.log(`🎉 Successfully assigned Driver UID "${driverUid}" ${mappedDriver ? `(${mappedDriver.fullName})` : ""} to Group "${group.name}"!`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error setting group driver:", err);
    process.exit(1);
  }
};

setGroupDriver();

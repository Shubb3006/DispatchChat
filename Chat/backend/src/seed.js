import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dns from "dns";
import User from "./modals/auth.modal.js";
import Message from "./modals/message.modal.js";
import Group from "./modals/group.modal.js";

try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {}

dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("MONGODB_URI is missing in .env");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for database reset & seeding...");

    // 1. Wipe existing data
    await User.deleteMany({});
    await Message.deleteMany({});
    await Group.deleteMany({});
    console.log("Cleared all previous users, messages, and group channels.");

    // 2. Hash default password
    const defaultPassword = "Nick 2656@";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // 3. Define users for every role
    const usersToCreate = [
      {
        username: "NIS_Nick2656",
        fullName: "Nick (Super User)",
        email: "nick2656@fleet.com",
        password: hashedPassword,
        role: "super_user",
        unitNumber: "SU-01",
        bio: "Fleet Chief Executive",
        profilePic: "https://avatar.iran.liara.run/public/1",
      },
      {
        username: "NIS_SuperUser",
        fullName: "Alex Rivera (Super User)",
        email: "superuser@fleet.com",
        password: hashedPassword,
        role: "super_user",
        unitNumber: "SU-02",
        bio: "Fleet Executive Director",
        profilePic: "https://avatar.iran.liara.run/public/2",
      },
      {
        username: "NIS_Admin",
        fullName: "Sarah Connor (Admin)",
        email: "admin@fleet.com",
        password: hashedPassword,
        role: "admin",
        unitNumber: "ADM-01",
        bio: "Fleet Operations Admin",
        profilePic: "https://avatar.iran.liara.run/public/65",
      },
      {
        username: "NIS_HR",
        fullName: "Helen Vance (HR Manager)",
        email: "hr@fleet.com",
        password: hashedPassword,
        role: "hr",
        unitNumber: "HR-01",
        bio: "Human Resources Lead",
        profilePic: "https://avatar.iran.liara.run/public/75",
      },
      {
        username: "NIS_Dispatch",
        fullName: "David Miller (Chief Dispatch)",
        email: "dispatch@fleet.com",
        password: hashedPassword,
        role: "dispatch",
        unitNumber: "DSP-01",
        bio: "Head Logistics Dispatcher",
        profilePic: "https://avatar.iran.liara.run/public/15",
      },
      {
        username: "NIS_OfficeStaff",
        fullName: "Olivia Smith (Office Staff)",
        email: "officestaff@fleet.com",
        password: hashedPassword,
        role: "office_staff",
        unitNumber: "OFF-01",
        bio: "Fleet Office Operations",
        profilePic: "https://avatar.iran.liara.run/public/80",
      },
      {
        username: "NIS_DriverManager",
        fullName: "Marcus Brody (Driver Manager)",
        email: "drivermanager@fleet.com",
        password: hashedPassword,
        role: "driver_manager",
        unitNumber: "DM-01",
        bio: "Fleet Drivers Coordinator",
        profilePic: "https://avatar.iran.liara.run/public/25",
      },
      {
        username: "NIS_Driver101",
        fullName: "Johnathan Doe (Driver)",
        email: "driver101@fleet.com",
        password: hashedPassword,
        role: "driver",
        unitNumber: "101",
        bio: "Long-Haul Interstate Driver",
        profilePic: "https://avatar.iran.liara.run/public/33",
      },
      {
        username: "NIS_Driver102",
        fullName: "Mike Transport (Driver)",
        email: "driver102@fleet.com",
        password: hashedPassword,
        role: "driver",
        unitNumber: "102",
        bio: "Regional Freight Driver",
        profilePic: "https://avatar.iran.liara.run/public/40",
      },
    ];

    const createdUsers = await User.insertMany(usersToCreate);
    console.log(`Successfully created ${createdUsers.length} fresh role-based users!`);

    // 4. Create default Fleet Group Channel
    const memberIds = createdUsers.map((u) => u._id);
    const mainGroup = new Group({
      name: "Route #101 East Coast Dispatch",
      description: "Live channel for dispatch office & drivers",
      adminId: createdUsers[0]._id,
      members: memberIds,
    });
    await mainGroup.save();
    console.log("Created initial Fleet Group Channel.");

    console.log("\n==========================================");
    console.log("DATABASE RESET COMPLETE - CREATED ACCOUNTS:");
    console.log("Default Password for ALL accounts: Nick 2656@\n");
    createdUsers.forEach((u) => {
      console.log(`• Role: [${u.role.toUpperCase().padEnd(14)}] Username: ${u.username.padEnd(20)} Name: ${u.fullName}`);
    });
    console.log("==========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
};

seedDatabase();

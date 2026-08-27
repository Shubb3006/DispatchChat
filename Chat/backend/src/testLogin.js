import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dns from "dns";
import User from "./modals/auth.modal.js";

try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {}

dotenv.config();

const test = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: "superuser@fleet.com" });
  console.log("FOUND USER:", user?.email, user?.fullName);
  if (user) {
    const match = await bcrypt.compare("Nick 2656@", user.password);
    console.log("PASSWORD MATCH RESULT FOR 'Nick 2656@':", match);
  }
  process.exit(0);
};

test();

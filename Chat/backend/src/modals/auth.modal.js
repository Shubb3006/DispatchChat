import mongoose, { mongo } from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      default: "",
    },

    profilePic: {
      type: String,
    },
    bio: {
      type: String,
      default: "Fleet Member",
    },
    role: {
      type: String,
      enum: [
        "super_user",
        "admin",
        "dispatch",
        "hr",
        "office_staff",
        "driver_manager",
        "driver",
      ],
      default: "driver",
    },
    dutyStatus: {
      type: String,
      enum: ["on_duty", "driving", "break", "off_duty"],
      default: "off_duty",
    },
    unitNumber: {
      type: String,
      default: "",
    },
    supabaseUid: {
      type: String,
      unique: true,
      sparse: true,
    },
    archivedChatIds: {
      type: [String],
      default: [],
    },
    password: {
      type: String,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;

import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../modals/auth.modal.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  const { username, fullName, email, password, role, unitNumber } = req.body;
  try {
    const cleanUsername = username ? username.trim() : "";
    if (!cleanUsername) return res.status(400).json({ message: "Username is required" });
    if (password.length < 6)
      return res.status(400).json({ message: "Password length must be at least 6 characters" });

    const existingUser = await User.findOne({
      username: { $regex: new RegExp(`^${cleanUsername}$`, "i") },
    });
    if (existingUser) return res.status(400).json({ message: "Username already taken" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username: cleanUsername,
      fullName,
      email: email ? email.toLowerCase() : "",
      password: hashedPassword,
      role: role || "driver",
      unitNumber: unitNumber || "",
    });

    await newUser.save();
    const token = generateToken(newUser._id, res);
    return res.status(201).json({
      token,
      _id: newUser._id,
      id: newUser._id,
      username: newUser.username,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      dutyStatus: newUser.dutyStatus,
      unitNumber: newUser.unitNumber,
      profilePic: newUser.profilePic,
      bio: newUser.bio,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const loginIdentifier = (username || email || "").trim();
    const cleanPassword = password ? password.trim() : "";

    if (!loginIdentifier || !cleanPassword) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${loginIdentifier}$`, "i") } },
        { email: loginIdentifier.toLowerCase() },
      ],
    });
    if (!user) return res.status(400).json({ message: "Invalid username or password" });

    const isPasswordCorrect = await bcrypt.compare(cleanPassword, user.password);
    if (!isPasswordCorrect)
      return res.status(400).json({ message: "Invalid username or password" });

    const token = generateToken(user._id, res);

    return res.status(200).json({
      token,
      _id: user._id,
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role || "driver",
      dutyStatus: user.dutyStatus || "off_duty",
      unitNumber: user.unitNumber || "",
      profilePic: user.profilePic,
      bio: user.bio,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie("jwt_token", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged Out Successfully" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const check = async (req, res) => {
  try {
    return res.status(200).json(req.user);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, unitNumber } = req.body;
    const userId = req.user._id;

    const updates = {};
    if (bio !== undefined) updates.bio = bio;
    if (unitNumber !== undefined) updates.unitNumber = unitNumber;

    if (profilePic) {
      const uploadedResponse = await cloudinary.uploader.upload(profilePic);
      updates.profilePic = uploadedResponse.secure_url;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No profile fields to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
    }).select("-password");

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Admin / HR / Super User: Create User Account
export const createUserByAdmin = async (req, res) => {
  try {
    const requesterRole = req.user ? req.user.role : "admin";
    if (!["super_user", "admin", "hr", "dispatch", "driver_manager"].includes(requesterRole)) {
      return res.status(403).json({ message: "Forbidden: Access denied to create user accounts" });
    }

    const { username, fullName, email, password, role, unitNumber } = req.body;

    if (!fullName || !password) {
      return res.status(400).json({ message: "Full Name and Password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // HR and Admin CANNOT create Super Users
    if (role === "super_user" && requesterRole !== "super_user") {
      return res.status(403).json({ message: "Forbidden: Only a Super User can create another Super User" });
    }

    const rawInput = (username || email || "").trim();
    let cleanEmail = "";
    let baseUsername = "";

    if (rawInput.includes("@")) {
      cleanEmail = rawInput.toLowerCase();
      baseUsername = rawInput.split("@")[0];
    } else if (rawInput) {
      baseUsername = rawInput;
      cleanEmail = `${rawInput.toLowerCase()}@fleet.com`;
    } else {
      baseUsername = `user_${Date.now()}`;
    }

    let targetUsername = baseUsername.toLowerCase().replace(/[^a-z0-9_.-]/gi, "");
    if (!targetUsername) targetUsername = `user_${Date.now()}`;

    // Check if email already exists
    if (cleanEmail) {
      const emailMatch = await User.findOne({ email: cleanEmail });
      if (emailMatch) {
        return res.status(400).json({ message: `Account already exists with email '${cleanEmail}'` });
      }
    }

    // Auto-resolve username collision if username exists
    let existingUsernameMatch = await User.findOne({
      username: { $regex: new RegExp(`^${targetUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") },
    });

    if (existingUsernameMatch) {
      let counter = 1;
      let candidate = `${targetUsername}_${counter}`;
      while (await User.findOne({ username: { $regex: new RegExp(`^${candidate}$`, "i") } })) {
        counter++;
        candidate = `${targetUsername}_${counter}`;
      }
      targetUsername = candidate;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username: targetUsername,
      fullName: fullName.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: role || "driver",
      unitNumber: unitNumber || "",
    });

    await newUser.save();

    return res.status(201).json({
      message: `User '${newUser.fullName}' (@${newUser.username}) created successfully`,
      user: {
        _id: newUser._id,
        username: newUser.username,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        unitNumber: newUser.unitNumber,
        dutyStatus: newUser.dutyStatus,
      },
    });
  } catch (error) {
    console.error("createUserByAdmin error:", error);
    return res.status(500).json({ message: error.message || "Failed to create user" });
  }
};

// Management: Fetch All Users list
export const getAllUsersAdmin = async (req, res) => {
  try {
    const requesterRole = req.user.role;
    if (!["super_user", "admin", "dispatch", "hr"].includes(requesterRole)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Admin / HR / Super User: Reset Password for a user
export const resetUserPassword = async (req, res) => {
  try {
    const requesterRole = req.user.role;
    if (!["super_user", "admin", "hr"].includes(requesterRole)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    const { userId, newPassword } = req.body;
    if (!userId || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Valid userId and new password (min 6 chars) required" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ message: "Target user not found" });

    // Non-super users cannot reset password of a Super User
    if (targetUser.role === "super_user" && requesterRole !== "super_user") {
      return res.status(403).json({ message: "Forbidden: Only a Super User can reset another Super User's password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(userId, { password: hashedPassword });
    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Management: Update User Role or Unit Number
export const updateUserRole = async (req, res) => {
  try {
    const requesterRole = req.user.role;
    if (!["super_user", "admin", "hr"].includes(requesterRole)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    const { userId, role, unitNumber } = req.body;

    if (role === "super_user" && requesterRole !== "super_user") {
      return res.status(403).json({ message: "Forbidden: Only a Super User can assign the Super User role" });
    }

    const updates = {};
    if (role) updates.role = role;
    if (unitNumber !== undefined) updates.unitNumber = unitNumber;

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
    }).select("-password");

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Management: Delete User
export const deleteUserByAdmin = async (req, res) => {
  try {
    const requesterRole = req.user.role;
    if (!["super_user", "admin"].includes(requesterRole)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    const { userId } = req.params;
    const userToDelete = await User.findById(userId);

    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    // Admins cannot delete Super Users. Only Super Users can delete other Super Users.
    if (userToDelete.role === "super_user" && requesterRole !== "super_user") {
      return res.status(403).json({ message: "Forbidden: Only a Super User can delete another Super User" });
    }

    // Users cannot delete themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    await User.findByIdAndDelete(userId);
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Management: Update Full Name or Username/Email
export const updateUserDetailsByAdmin = async (req, res) => {
  try {
    const requesterRole = req.user.role;
    if (!["super_user", "admin", "hr"].includes(requesterRole)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    const { userId, fullName, username, email } = req.body;
    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    // Admins/HR cannot update Super User details. Only Super User can.
    if (targetUser.role === "super_user" && requesterRole !== "super_user") {
      return res.status(403).json({ message: "Forbidden: Only a Super User can update another Super User's details" });
    }

    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (username) updates.username = username.trim();
    if (email) updates.email = email.toLowerCase().trim();

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
    }).select("-password");

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Driver/User: Update Duty Status
export const updateDutyStatus = async (req, res) => {
  try {
    const { dutyStatus } = req.body;
    if (!["on_duty", "driving", "break", "off_duty"].includes(dutyStatus)) {
      return res.status(400).json({ message: "Invalid duty status" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { dutyStatus },
      { new: true }
    ).select("-password");

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Admin / System: Map Driver's Supabase UID in MongoDB
export const mapDriverSupabaseUid = async (req, res) => {
  try {
    const requesterRole = req.user.role;
    if (!["super_user", "admin", "dispatch", "hr", "driver_manager"].includes(requesterRole)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    const { identifier, supabaseUid, mappings } = req.body;

    // Handle bulk mappings array: [{ identifier: "driver101@fleet.com", supabaseUid: "..." }]
    if (Array.isArray(mappings)) {
      const results = [];
      for (const item of mappings) {
        if (!item.identifier || !item.supabaseUid) continue;
        const isValidId = item.identifier.match(/^[0-9a-fA-F]{24}$/);
        const driver = await User.findOneAndUpdate(
          {
            $or: [
              { email: item.identifier.toLowerCase() },
              { username: item.identifier },
              { unitNumber: item.identifier },
              ...(isValidId ? [{ _id: item.identifier }] : []),
            ],
          },
          { supabaseUid: item.supabaseUid },
          { new: true }
        ).select("-password");
        if (driver) results.push({ identifier: item.identifier, driver: driver.username, supabaseUid: driver.supabaseUid });
      }
      return res.status(200).json({ message: "Bulk Supabase UID mapping complete", results });
    }

    if (!identifier || !supabaseUid) {
      return res.status(400).json({ message: "identifier (email/username/unitNumber/_id) and supabaseUid are required" });
    }

    const isValidId = identifier.match(/^[0-9a-fA-F]{24}$/);
    const driver = await User.findOneAndUpdate(
      {
        $or: [
          { email: identifier.toLowerCase() },
          { username: identifier },
          { unitNumber: identifier },
          ...(isValidId ? [{ _id: identifier }] : []),
        ],
      },
      { supabaseUid },
      { new: true }
    ).select("-password");

    if (!driver) {
      return res.status(404).json({ message: "Driver not found matching identifier" });
    }

    return res.status(200).json({
      message: "Driver Supabase UID mapped successfully",
      driver,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Driver/User: Archive/Unarchive a conversation
export const toggleArchiveChat = async (req, res) => {
  try {
    const { id: chatId } = req.params; // Can be userId or groupId
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isArchived = user.archivedChatIds.includes(chatId);

    if (isArchived) {
      user.archivedChatIds = user.archivedChatIds.filter((id) => id !== chatId);
    } else {
      user.archivedChatIds.push(chatId);
    }

    await user.save();

    return res.status(200).json({
      message: isArchived ? "Chat unarchived" : "Chat archived",
      archivedChatIds: user.archivedChatIds,
      isArchived: !isArchived,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};



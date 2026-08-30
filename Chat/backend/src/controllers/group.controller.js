import Group from "../modals/group.modal.js";
import Message from "../modals/message.modal.js";
import User from "../modals/auth.modal.js";
import mongoose from "mongoose";
import cloudinary from "../lib/cloudinary.js";
import axios from "axios";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { fetchAndFormatSupabaseLoad, saveDocumentToSupabase } from "../lib/supabaseLoad.js";

// Create a new Fleet Group Channel
export const createGroup = async (req, res) => {
  try {
    const userRole = req.user.role;
    if (!["super_user", "admin", "dispatch", "hr"].includes(userRole)) {
      return res.status(403).json({
        message: "Forbidden: Only Super User, Admin, Dispatcher, or HR can create group channels",
      });
    }

    const { name, description, memberIds, driverSupabaseUid } = req.body;
    const adminId = req.user._id;

    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }

    const uniqueMembers = Array.from(
      new Set([adminId.toString(), ...(memberIds || [])])
    );

    const newGroup = new Group({
      name,
      description: description || "",
      adminId,
      members: uniqueMembers,
      driverSupabaseUid: driverSupabaseUid ? driverSupabaseUid.trim() : "",
    });

    await newGroup.save();
    const populatedGroup = await newGroup.populate(
      "members",
      "fullName email profilePic role dutyStatus unitNumber"
    );

    // --- SYNC LOAD ASSIGNMENTS TO SUPABASE ---
    const loadMatches = name.match(/#?(\d{4,6})\b/g);
    console.log("🔍 Group Creation - Sync Triggers:", { channelName: name, loadMatches, driverSupabaseUid });

    if (loadMatches && driverSupabaseUid) {
      const loadNumbers = [...new Set(loadMatches.map((m) => m.replace("#", "")))];
      const uidVal = driverSupabaseUid.trim();

      // Resolve the actual Supabase UID from MongoDB if an identifier was provided
      const isValidObjectId = mongoose.Types.ObjectId.isValid(uidVal);
      const driver = await User.findOne({
        $or: [
          { supabaseUid: uidVal },
          { unitNumber: uidVal },
          { username: uidVal },
          { email: uidVal.toLowerCase() },
          ...(isValidObjectId ? [{ _id: uidVal }] : []),
        ],
      });

      const targetUid = driver?.supabaseUid || uidVal;

      const supabaseUrl = process.env.SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && serviceKey && targetUid) {
        const headers = {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        };

        for (const loadNum of loadNumbers) {
          // 1. Update Supabase with driver assignment
          axios
            .patch(
              `${supabaseUrl}/rest/v1/loads?load_number=eq.${loadNum}`,
              { driver_id: targetUid },
              { headers }
            )
            .then(() => console.log(`✅ Load #${loadNum} assigned to driver ${targetUid} in Supabase`))
            .catch((err) => console.error(`❌ Supabase update error for Load #${loadNum}:`, err.message));

          // 2. Automatically post a Load Card for each load into the channel
          setTimeout(async () => {
            try {
              const loadResult = await fetchAndFormatSupabaseLoad(loadNum, "pickup");
              if (loadResult) {
                const loadMsg = new Message({
                  senderId: adminId,
                  groupId: newGroup._id,
                  text: loadResult.formattedTemplate,
                  documentType: "load_details",
                  isUrgent: true,
                  status: "sent",
                  readBy: [{ userId: adminId, readAt: new Date() }],
                });
                await loadMsg.save();

                const populatedLoadMsg = await loadMsg.populate(
                  "senderId",
                  "fullName profilePic role unitNumber"
                );

                newGroup.members.forEach((mId) => {
                  const socketId = getReceiverSocketId(mId.toString());
                  if (socketId) io.to(socketId).emit("newGroupMessage", populatedLoadMsg);
                });
              }
            } catch (err) {
              console.error(`❌ Error posting auto-card for Load #${loadNum}:`, err.message);
            }
          }, 500);
        }
      }
    }

    return res.status(201).json(populatedGroup);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get all group channels for the current user
export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const groups = await Group.find({ members: userId })
      .populate("members", "fullName email profilePic role dutyStatus unitNumber")
      .sort({ updatedAt: -1 });

    return res.status(200).json(groups);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get messages for a specific group channel
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    // Auto-mark group messages as read for this user if not already read
    await Message.updateMany(
      { groupId, "readBy.userId": { $ne: userId } },
      {
        $addToSet: { readBy: { userId, readAt: new Date() } },
        $set: { status: "read" },
      }
    );

    const messages = await Message.find({ groupId })
      .populate("senderId", "fullName profilePic role unitNumber")
      .populate("readBy.userId", "fullName profilePic role unitNumber")
      .sort({ createdAt: 1 });

    return res.status(200).json(messages);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Send message to a group channel
export const sendGroupMessage = async (req, res) => {
  try {
    if (req.user.role === "office_staff") {
      return res.status(403).json({ message: "Forbidden: Office staff have read-only access and cannot send messages" });
    }

    const { groupId } = req.params;
    const senderId = req.user._id;
    const { text, image, audio, documentType, isUrgent } = req.body;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group channel not found" });
    }

    let image_url;
    let audio_url;

    if (image) {
      const uploadedResponse = await cloudinary.uploader.upload(image);
      image_url = uploadedResponse.secure_url;
    }

    if (audio) {
      const uploadedAudio = await cloudinary.uploader.upload(audio, {
        resource_type: "auto",
      });
      audio_url = uploadedAudio.secure_url;
    }

    const newMessage = new Message({
      senderId,
      groupId,
      text,
      image: image_url,
      audio: audio_url,
      documentType: documentType || "general",
      isUrgent: isUrgent || false,
      status: "sent",
      readBy: [{ userId: senderId, readAt: new Date() }],
    });

    await newMessage.save();

    // Auto-unarchive group for all members on new message
    await User.updateMany(
      { _id: { $in: group.members } },
      { $pull: { archivedChatIds: groupId.toString() } }
    );

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "fullName profilePic role unitNumber")
      .populate("readBy.userId", "fullName profilePic role unitNumber");

    // Broadcast to all online members of the group
    group.members.forEach((memberId) => {
      if (memberId.toString() !== senderId.toString()) {
        const socketId = getReceiverSocketId(memberId.toString());
        if (socketId) {
          io.to(socketId).emit("newGroupMessage", populatedMessage);
        }
      }
    });

    // --- AUTOMATIC SUPABASE SYNC FOR BOL / IMAGE UPLOADS IN GROUP CHATS ---
    const isBolOrImageUpload = Boolean(
      image_url ||
      documentType === "bol" ||
      (text && (text.toUpperCase().includes("BOL") || text.toLowerCase().includes("picked")))
    );

    if (isBolOrImageUpload) {
      setTimeout(async () => {
        try {
          let loadNumToSync = null;
          const textMatch = text ? (text.match(/(?:#|\$|\bload\s*#?)\s*(\d{4,6})\b/i) || text.match(/\b(\d{4,6})\b/)) : null;
          if (textMatch) {
            loadNumToSync = textMatch[1];
          } else {
            const recentMsg = await Message.findOne({
              groupId,
              documentType: "load_details",
            }).sort({ createdAt: -1 });

            if (recentMsg && recentMsg.text) {
              const recentMatch = recentMsg.text.match(/#(\d{4,6})/) || recentMsg.text.match(/\$(\d{4,6})/);
              if (recentMatch) loadNumToSync = recentMatch[1];
            }
          }

          if (loadNumToSync && image_url) {
            await saveDocumentToSupabase(loadNumToSync, image_url, documentType || "BOL", req.user?.supabaseUid);
            console.log(`✅ Group BOL for Load #${loadNumToSync} saved to Supabase 'documents' table`);
          }
        } catch (err) {
          console.error("Group BOL Supabase Sync Error:", err.message);
        }
      }, 200);
    }

    // --- AUTOMATIC SUPABASE LOAD CARD DISPATCH IF #LOAD_NUMBER OR $LOAD_NUMBER IS MENTIONED ---
    if (text) {
      const deliveryMatch = text.match(/(?:\$|\bdelivery\s*\$?)\s*(\d{4,6})\b/i) || text.match(/\(?\$(\d{4,6})\)?/i);
      const pickupMatch = text.match(/(?:#|\bload\s*#?)\s*(\d{4,6})\b/i) || text.match(/\(?#(\d{4,6})\)?/i);

      const loadMatch = deliveryMatch || pickupMatch;
      const cardType = deliveryMatch ? "delivery" : "pickup";

      if (loadMatch && loadMatch[1]) {
        const loadNumber = loadMatch[1];
        setTimeout(async () => {
          try {
            const loadResult = await fetchAndFormatSupabaseLoad(loadNumber, cardType);
            if (loadResult) {
              const { formattedTemplate, load } = loadResult;

              // 1. Post Load Details Card into the Group Channel
              const groupMsg = new Message({
                senderId,
                groupId,
                text: formattedTemplate,
                documentType: "load_details",
                isUrgent: true,
                status: "sent",
                readBy: [{ userId: senderId, readAt: new Date() }],
              });

              await groupMsg.save();
              const populatedGroupMsg = await Message.findById(groupMsg._id)
                .populate("senderId", "fullName profilePic role unitNumber")
                .populate("readBy.userId", "fullName profilePic role unitNumber");

              group.members.forEach((memberId) => {
                const socketId = getReceiverSocketId(memberId.toString());
                if (socketId) {
                  io.to(socketId).emit("newGroupMessage", populatedGroupMsg);
                }
              });

              // 2. Identify the specific driver for this group / load assignment
              let targetDriver = null;

              // Priority 1: Check if group has a manually assigned driverSupabaseUid / identifier
              if (group.driverSupabaseUid) {
                const uidVal = group.driverSupabaseUid.trim();
                const isValidId = uidVal.match(/^[0-9a-fA-F]{24}$/);
                targetDriver = await User.findOne({
                  $or: [
                    { supabaseUid: uidVal },
                    { unitNumber: uidVal },
                    { username: uidVal },
                    { email: uidVal.toLowerCase() },
                    ...(isValidId ? [{ _id: uidVal }] : []),
                  ],
                });
              }

              // Priority 2: Check if Supabase load has a driver_id mapped to MongoDB
              if (!targetDriver && load.driver_id) {
                const isValidId = load.driver_id.match(/^[0-9a-fA-F]{24}$/);
                targetDriver = await User.findOne({
                  $or: [
                    { supabaseUid: load.driver_id },
                    ...(isValidId ? [{ _id: load.driver_id }] : []),
                  ],
                });
              }

              // Priority 3: Fallback - Find the driver member belonging to this specific group
              if (!targetDriver) {
                targetDriver = await User.findOne({
                  _id: { $in: group.members },
                  role: "driver",
                });
              }

              // 3. Send Direct Load Assignment Message directly to that specific driver only
              if (targetDriver) {
                const driverSocketId = getReceiverSocketId(targetDriver._id.toString());
                const initialStatus = driverSocketId ? "delivered" : "sent";

                const dmMsg = new Message({
                  senderId,
                  receiverId: targetDriver._id,
                  text: `🚛 NEW LOAD ASSIGNED (#${load.load_number || loadNumber})\n\n` + formattedTemplate,
                  documentType: "load_details",
                  isUrgent: true,
                  status: initialStatus,
                });

                await dmMsg.save();
                const populatedDmMsg = await dmMsg.populate(
                  "readBy.userId",
                  "fullName profilePic role unitNumber"
                );

                if (driverSocketId) {
                  io.to(driverSocketId).emit("newMessage", populatedDmMsg);
                }

                console.log(`✅ Automated Load Details sent directly to Driver: ${targetDriver.fullName} (@${targetDriver.username})`);

                // --- SYNC ASSIGNMENT TO SUPABASE (Group context) ---
                const supabaseUrl = process.env.SUPABASE_URL;
                const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                if (targetDriver.supabaseUid && supabaseUrl && serviceKey) {
                   const headers = {
                       apikey: serviceKey,
                       Authorization: `Bearer ${serviceKey}`,
                       "Content-Type": "application/json",
                   };
                   axios.patch(
                       `${supabaseUrl}/rest/v1/loads?load_number=eq.${loadNumber}`,
                       { driver_id: targetDriver.supabaseUid },
                       { headers }
                   ).then(() => console.log(`✅ Group Load #${loadNumber} assigned to driver ${targetDriver.supabaseUid} in Supabase`))
                   .catch((err) => console.error(`❌ Supabase update error for Group Load #${loadNumber}:`, err.message));
                }
              }
            }
          } catch (err) {
            console.error("Auto Load Lookup Error:", err.message);
          }
        }, 300);
      }
    }

    return res.status(201).json(populatedMessage);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};




// Add members to a group channel
export const addMembersToGroup = async (req, res) => {
  try {
    const userRole = req.user.role;
    if (!["super_user", "admin", "dispatch"].includes(userRole)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    const { groupId } = req.params;
    const { memberIds } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const updatedMembers = Array.from(
      new Set([...group.members.map((m) => m.toString()), ...(memberIds || [])])
    );

    group.members = updatedMembers;
    await group.save();

    const populatedGroup = await Group.findById(groupId).populate(
      "members",
      "fullName email profilePic role dutyStatus unitNumber"
    );

    return res.status(200).json(populatedGroup);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Remove member from a group channel
export const removeMemberFromGroup = async (req, res) => {
  try {
    const userRole = req.user.role;
    if (!["super_user", "admin", "dispatch"].includes(userRole)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    const { groupId, userId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    group.members = group.members.filter((m) => m.toString() !== userId);
    await group.save();

    const populatedGroup = await Group.findById(groupId).populate(
      "members",
      "fullName email profilePic role dutyStatus unitNumber"
    );

    return res.status(200).json(populatedGroup);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update group name, description, and driverSupabaseUid
export const updateGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, driverSupabaseUid } = req.body;
    const user = req.user;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Authorization: super_user, admin, dispatch, hr OR group admin
    const isAuthorized =
      ["super_user", "admin", "dispatch", "hr"].includes(user.role) ||
      group.adminId.toString() === user._id.toString();

    if (!isAuthorized) {
      return res.status(403).json({
        message: "Forbidden: You are not authorized to edit this group's details",
      });
    }

    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();
    if (driverSupabaseUid !== undefined) group.driverSupabaseUid = driverSupabaseUid.trim();

    await group.save();

    const populatedGroup = await Group.findById(groupId).populate(
      "members",
      "fullName email profilePic role dutyStatus unitNumber"
    );

    // Broadcast update to all online members of the group
    populatedGroup.members.forEach((member) => {
      const socketId = getReceiverSocketId(member._id.toString());
      if (socketId) {
        io.to(socketId).emit("groupUpdated", populatedGroup);
      }
    });

    return res.status(200).json(populatedGroup);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};


import mongoose from "mongoose";
import User from "../modals/auth.modal.js";
import Message from "../modals/message.modal.js";
import cloudinary from "../lib/cloudinary.js";
import axios from "axios";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { fetchAndFormatSupabaseLoad, saveDocumentToSupabase } from "../lib/supabaseLoad.js";

export const usersList = async (req, res) => {
  try {
    const userId = req.user._id;
    const users = await User.find({ _id: { $ne: userId } }).select("-password");

    // Fetch last message timestamp for each user to enable sorting
    const usersWithTimestamps = await Promise.all(
      users.map(async (user) => {
        const lastMsg = await Message.findOne({
          $or: [
            { senderId: userId, receiverId: user._id },
            { receiverId: userId, senderId: user._id },
          ],
        })
          .sort({ createdAt: -1 })
          .select("createdAt");

        return {
          ...user.toObject(),
          lastMessageAt: lastMsg ? lastMsg.createdAt : 0,
        };
      })
    );

    return res.status(200).json(usersWithTimestamps);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: receiver_id } = req.params;
    const sender_id = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(receiver_id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Auto-mark unread messages from this sender as read
    await Message.updateMany(
      {
        senderId: receiver_id,
        receiverId: sender_id,
        status: { $ne: "read" },
      },
      {
        $set: { status: "read" },
        $addToSet: { readBy: { userId: sender_id, readAt: new Date() } },
      }
    );

    const senderSocketId = getReceiverSocketId(receiver_id);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", {
        readerId: sender_id,
        chatWithId: receiver_id,
      });
    }

    const messages = await Message.find({
      $or: [
        { senderId: sender_id, receiverId: receiver_id },
        { receiverId: sender_id, senderId: receiver_id },
      ],
    }).populate("readBy.userId", "fullName profilePic role unitNumber");

    res.status(200).json(messages);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    if (req.user.role === "office_staff") {
      return res.status(403).json({ message: "Forbidden: Office staff have read-only access and cannot send messages" });
    }

    const { id: receiver_id } = req.params;
    const sender_id = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(receiver_id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const { text, image, audio, documentType, isUrgent, replyTo } = req.body;
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

    const receiverSocketId = getReceiverSocketId(receiver_id);
    const initialStatus = receiverSocketId ? "delivered" : "sent";

    const newMessage = new Message({
      senderId: sender_id,
      receiverId: receiver_id,
      text,
      image: image_url,
      audio: audio_url,
      documentType: documentType || "general",
      isUrgent: isUrgent || false,
      status: initialStatus,
      replyTo: replyTo || null,
    });
    await newMessage.save();

    // Auto-unarchive chat for both sender and receiver on new message
    await User.updateMany(
      { _id: { $in: [sender_id, receiver_id] } },
      { $pull: { archivedChatIds: { $in: [sender_id.toString(), receiver_id.toString()] } } }
    );

    const populatedMessage = await newMessage.populate(
      "readBy.userId",
      "fullName profilePic role unitNumber"
    );

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", populatedMessage);
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
              const systemMsg = new Message({
                senderId: sender_id,
                receiverId: receiver_id,
                text: loadResult.formattedTemplate,
                documentType: "load_details",
                isUrgent: true,
                status: initialStatus,
              });

              await systemMsg.save();
              const populatedSystemMsg = await systemMsg.populate(
                "readBy.userId",
                "fullName profilePic role unitNumber"
              );

              if (receiverSocketId) {
                io.to(receiverSocketId).emit("newMessage", populatedSystemMsg);
              }

              // --- SYNC ASSIGNMENT TO SUPABASE (DM context) ---
              const receiver = await User.findById(receiver_id);
              const targetUid = receiver?.supabaseUid;
              const supabaseUrl = process.env.SUPABASE_URL;
              const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

              if (targetUid && supabaseUrl && serviceKey) {
                const headers = {
                    apikey: serviceKey,
                    Authorization: `Bearer ${serviceKey}`,
                    "Content-Type": "application/json",
                };
                
                // If message is a BOL document upload or contains an image, save to Supabase 'documents' table
                const isBolUpload = Boolean(
                  (text && (text.toUpperCase().includes("BOL") || text.toLowerCase().includes("picked"))) ||
                  documentType === "bol" ||
                  image_url
                );

                if (isBolUpload && image_url) {
                  await saveDocumentToSupabase(loadNumber, image_url, documentType || "BOL", targetUid);
                }

                // Update driver_id assignment in Supabase loads table
                axios.patch(
                    `${supabaseUrl}/rest/v1/loads?load_number=eq.${loadNumber}`,
                    { driver_id: targetUid },
                    { headers }
                ).then(() => console.log(`✅ DM Load #${loadNumber} assigned to driver ${targetUid} in Supabase`))
                .catch((err) => console.error(`❌ Supabase update error for DM Load #${loadNumber}:`, err.message));
              }
            }
          } catch (err) {
            console.error("Auto DM Load Lookup Error:", err.message);
          }
        }, 300);
      }
    }

    return res.status(200).json(populatedMessage);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};


export const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { senderId, groupId } = req.body;

    let query = {};
    if (groupId) {
      query = { groupId, "readBy.userId": { $ne: userId } };
    } else if (senderId) {
      query = { senderId, receiverId: userId, status: { $ne: "read" } };
    } else {
      return res.status(400).json({ message: "senderId or groupId required" });
    }

    await Message.updateMany(query, {
      $set: { status: "read" },
      $push: { readBy: { userId, readAt: new Date() } },
    });

    if (senderId) {
      const senderSocketId = getReceiverSocketId(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesRead", { readerId: userId, senderId });
      }
    }

    return res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const existingIndex = message.reactions.findIndex(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingIndex > -1) {
      if (message.reactions[existingIndex].emoji === emoji) {
        message.reactions.splice(existingIndex, 1);
      } else {
        message.reactions[existingIndex].emoji = emoji;
      }
    } else {
      message.reactions.push({ userId, emoji });
    }

    await message.save();

    const otherUserId =
      message.senderId.toString() === userId.toString()
        ? message.receiverId
        : message.senderId;

    const receiverSocketId = getReceiverSocketId(otherUserId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageReaction", message);
    }

    return res.status(200).json(message);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Forbidden: You can only edit your own messages" });
    }

    message.text = text;
    message.isEdited = true;
    await message.save();

    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", message);
    }

    return res.status(200).json(message);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userRole = req.user.role;

    if (!["super_user", "admin", "dispatch"].includes(userRole)) {
      return res.status(403).json({ message: "Forbidden: Your role does not have permission to delete messages" });
    }

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    await Message.findByIdAndDelete(messageId);

    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", { messageId });
    }

    return res.status(200).json({ messageId, message: "Message deleted successfully" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const togglePinMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    message.isPinned = !message.isPinned;
    await message.save();

    if (message.receiverId) {
      const receiverSocketId = getReceiverSocketId(message.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messagePinned", message);
      }
    }

    return res.status(200).json(message);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const sendBroadcastAnnouncement = async (req, res) => {
  try {
    const senderId = req.user._id;
    const userRole = req.user.role;

    if (!["super_user", "admin"].includes(userRole)) {
      return res.status(403).json({
        message: "Forbidden: Only Admin and Super User can send fleet broadcast announcements",
      });
    }

    const { targetAudience, title, text, image, isUrgent } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Broadcast text is required" });
    }

    let query = { _id: { $ne: senderId } };
    if (targetAudience === "drivers") {
      query.role = "driver";
    } else if (targetAudience === "office") {
      query.role = { $in: ["office_staff", "driver_manager", "dispatch", "hr", "admin", "super_user"] };
    }

    const targetUsers = await User.find(query).select("_id fullName role");
    if (!targetUsers.length) {
      return res.status(400).json({ message: "No target users found for this audience" });
    }

    let imageUrl = "";
    if (image) {
      const uploadRes = await cloudinary.uploader.upload(image);
      imageUrl = uploadRes.secure_url;
    }

    const broadcastHeader = `📢 FLEET BROADCAST ANNOUNCEMENT\nTarget: ${
      targetAudience === "drivers"
        ? "🚛 All Drivers"
        : targetAudience === "office"
        ? "🏢 All Office Staff"
        : "🌐 Entire Fleet"
    }\nTitle: ${title || "Notice"}\n\n${text.trim()}`;

    for (const recipient of targetUsers) {
      const newMsg = new Message({
        senderId,
        receiverId: recipient._id,
        text: broadcastHeader,
        image: imageUrl,
        isUrgent: Boolean(isUrgent),
        status: "sent",
      });
      await newMsg.save();

      const receiverSocketId = getReceiverSocketId(recipient._id);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMsg);
        io.to(receiverSocketId).emit("broadcastAnnouncement", {
          title: title || "Fleet Announcement",
          text: text.trim(),
          senderName: req.user.fullName,
          targetAudience,
          isUrgent: Boolean(isUrgent),
        });
      }
    }

    return res.status(200).json({
      message: `Broadcast successfully sent to ${targetUsers.length} users!`,
      count: targetUsers.length,
    });
  } catch (error) {
    console.error("Broadcast Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


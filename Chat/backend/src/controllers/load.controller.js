import User from "../modals/auth.modal.js";
import Message from "../modals/message.modal.js";
import Group from "../modals/group.modal.js";
import cloudinary from "../lib/cloudinary.js";
import axios from "axios";
import mongoose from "mongoose";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { saveDocumentToSupabase } from "../lib/supabaseLoad.js";

export const handleSupabaseLoadWebhook = async (req, res) => {
  try {
    // Basic security check (Optional: recommend using a secret token in headers)
    const webhookToken = req.headers["x-supabase-webhook-token"];
    if (process.env.SUPABASE_WEBHOOK_SECRET && webhookToken !== process.env.SUPABASE_WEBHOOK_SECRET) {
      return res.status(401).json({ message: "Unauthorized webhook request" });
    }

    // Support both flat JSON payloads and native Supabase DB Webhook payloads (where payload is inside req.body.record)
    const payload = req.body?.record || req.body || {};

    const shipper = payload.shipper || payload.shipper_name;
    const customer = payload.customer || payload.customer_name;
    const address = payload.address || payload.pickup_address || payload.delivery_address;
    const skid_count = payload.skid_count ?? payload.skids ?? payload.skidCount;
    const weight = payload.weight;
    const dimensions = payload.dimensions || payload.dims;
    const pickup_number = payload.pickup_number || payload.pickupNumber || payload.id;

    // Driver Supabase UID mapping lookup
    const driver_supabase_uid =
      payload.driver_supabase_uid ||
      payload.driver_id ||
      payload.driver_uid ||
      payload.supabase_uid;

    if (!driver_supabase_uid) {
      return res.status(400).json({ message: "driver_supabase_uid is required in webhook payload" });
    }

    // 1. Find the driver in MongoDB
    const driver = await User.findOne({ supabaseUid: driver_supabase_uid });
    if (!driver) {
      return res.status(404).json({ message: "Driver not found in chat system" });
    }

    // 2. Find a Dispatcher or Admin to act as the sender
    const sender = await User.findOne({ role: { $in: ["admin", "super_user", "dispatch"] } });
    const senderId = sender ? sender._id : null;

    if (!senderId) {
      return res.status(500).json({ message: "No dispatcher/admin found to send the notification" });
    }

    // 3. Format the Load Template
    const loadTemplate = `🚛 NEW LOAD ASSIGNED\n\n` +
      `📍 PICKUP #: ${pickup_number || "N/A"}\n` +
      `🏢 SHIPPER: ${shipper || "N/A"}\n` +
      `🏢 CUSTOMER: ${customer || "N/A"}\n` +
      `🗺️ ADDRESS: ${address || "N/A"}\n\n` +
      `📦 DETAILS:\n` +
      `   - Skids: ${skid_count || 0}\n` +
      `   - Weight: ${weight || "N/A"}\n` +
      `   - Dimens: ${dimensions || "N/A"}\n\n` +
      `⚠️ Please confirm receipt of this load by replying to this message.`;

    // 4. Save the Message
    const receiverSocketId = getReceiverSocketId(driver._id);
    const initialStatus = receiverSocketId ? "delivered" : "sent";

    const newMessage = new Message({
      senderId: senderId,
      receiverId: driver._id,
      text: loadTemplate,
      isUrgent: true,
      status: initialStatus,
      documentType: "general",
    });

    await newMessage.save();

    const populatedMessage = await newMessage.populate(
      "readBy.userId",
      "fullName profilePic role unitNumber"
    );

    // 5. Emit via Socket.io for real-time update
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", populatedMessage);
    }

    return res.status(200).json({
      message: "Load notification sent successfully",
      driver: driver.fullName,
      messageId: newMessage._id
    });

  } catch (error) {
    console.error("Supabase Webhook Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Driver: Mark Arrived at Site or Status Update
export const updateLoadStatus = async (req, res) => {
  try {
    const { loadNumber, status, groupId, receiverId } = req.body;
    const user = req.user;

    if (!loadNumber || !status) {
      return res.status(400).json({ message: "loadNumber and status are required" });
    }

    const cleanLoadNum = loadNumber.toString().replace(/[^0-9a-zA-Z_-]/g, "");
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceKey) {
      const headers = {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      };
      await axios.patch(
        `${supabaseUrl}/rest/v1/loads?load_number=eq.${cleanLoadNum}`,
        { status: status },
        { headers }
      ).catch((err) => console.error("Supabase status patch error:", err.message));
    }

    const statusTextMap = {
      at_site: `📍 DRIVER AT SHIPPER SITE\nDriver ${user.fullName} has arrived at Shipper Site for Load #${cleanLoadNum}.`,
      at_consignee_site: `📍 DRIVER AT CONSIGNEE SITE\nDriver ${user.fullName} has arrived at Consignee Site for Load #${cleanLoadNum}.`,
      in_transit: `🚛 LOAD IN TRANSIT\nDriver ${user.fullName} has picked up Load #${cleanLoadNum} and is now in transit.`,
      delivered: `✅ LOAD DELIVERED\nDriver ${user.fullName} has completed delivery for Load #${cleanLoadNum}.`,
    };

    const statusText = statusTextMap[status] || `📢 Load #${cleanLoadNum} status updated to ${status.toUpperCase()} by ${user.fullName}.`;

    const newMsg = new Message({
      senderId: user._id,
      groupId: groupId || null,
      receiverId: receiverId || null,
      text: statusText,
      documentType: "general",
      isUrgent: status === "at_site" || status === "at_consignee_site" || status === "in_transit" || status === "delivered",
      status: "sent",
    });

    await newMsg.save();
    const populatedMsg = await newMsg.populate("senderId", "fullName profilePic role unitNumber");

    if (groupId) {
      const group = await Group.findById(groupId);
      if (group) {
        group.members.forEach((mId) => {
          const sId = getReceiverSocketId(mId.toString());
          if (sId) io.to(sId).emit("newGroupMessage", populatedMsg);
        });
      }
    } else if (receiverId) {
      const sId = getReceiverSocketId(receiverId);
      if (sId) io.to(sId).emit("newMessage", populatedMsg);
    }

    return res.status(200).json({ message: "Load status updated successfully", status, loadNumber: cleanLoadNum });
  } catch (error) {
    console.error("Update Load Status Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Helper function to stream buffer or data URI to Cloudinary with extended 120s timeout
const uploadToCloudinary = (input, options = {}) => {
  const uploadOptions = {
    resource_type: "auto",
    timeout: 120000, // 120 seconds timeout for high-res images and slow networks
    ...options,
  };

  return new Promise((resolve, reject) => {
    if (Buffer.isBuffer(input)) {
      const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
      stream.end(input);
    } else if (typeof input === "string" && input.startsWith("data:")) {
      const base64Data = input.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
      stream.end(buffer);
    } else {
      cloudinary.uploader.upload(input, uploadOptions, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    }
  });
};

// Driver: Upload Skid Photo / BOL Document / POD & Save to Supabase
export const uploadLoadDocument = async (req, res) => {
  try {
    const { loadNumber, documentType, image, groupId, receiverId } = req.body;
    const user = req.user;

    if (!loadNumber || !image) {
      return res.status(400).json({ message: "loadNumber and image are required" });
    }

    const cleanLoadNum = loadNumber.toString().replace(/[^0-9a-zA-Z_-]/g, "");

    // Stream upload to Cloudinary with extended 120s timeout
    const uploadRes = await uploadToCloudinary(image);
    const imageUrl = uploadRes.secure_url;

    // Save document into Supabase 'documents' table matching load_id UUID (without mutating cargo description)
    await saveDocumentToSupabase(cleanLoadNum, imageUrl, documentType, user?.supabaseUid);

    const docTitle = documentType === "skid_picture"
      ? "📸 SKID PICTURE UPLOADED"
      : documentType === "pod"
        ? "📄 PROOF OF DELIVERY (POD) ATTACHED"
        : "📄 BILL OF LADING (BOL) ATTACHED";

    const msgText = `${docTitle}\nLoad #${cleanLoadNum} document uploaded by Driver ${user?.fullName || "Driver"}.\nFile saved to Supabase & Fleet Vault.`;

    const validGroupId = (groupId && mongoose.Types.ObjectId.isValid(groupId)) ? groupId : null;
    const validReceiverId = (receiverId && mongoose.Types.ObjectId.isValid(receiverId)) ? receiverId : null;

    const newMsg = new Message({
      senderId: user?._id || null,
      groupId: validGroupId,
      receiverId: validReceiverId,
      text: msgText,
      image: imageUrl,
      documentType: documentType === "pod" ? "pod" : documentType === "bol" ? "bol" : "receipt",
      isUrgent: true,
      status: "sent",
    });

    await newMsg.save();
    const populatedMsg = await newMsg.populate("senderId", "fullName profilePic role unitNumber");

    if (validGroupId) {
      const group = await Group.findById(validGroupId);
      if (group) {
        group.members.forEach((mId) => {
          const sId = getReceiverSocketId(mId.toString());
          if (sId) io.to(sId).emit("newGroupMessage", populatedMsg);
        });
      }
    } else if (validReceiverId) {
      const sId = getReceiverSocketId(validReceiverId);
      if (sId) io.to(sId).emit("newMessage", populatedMsg);
    }

    return res.status(200).json({
      message: "Document uploaded and saved to Supabase!",
      imageUrl,
      documentType,
      loadNumber: cleanLoadNum,
    });
  } catch (error) {
    console.error("Upload Load Document Error:", error);
    const errorMessage =
      error?.message ||
      error?.error?.message ||
      "Cloudinary upload timed out or failed. Please try again.";
    return res.status(500).json({ message: errorMessage, error: error?.error || error });
  }
};

// Driver: Upload BOL image via FormData or JSON (POST /api/load/upload-bol)
export const uploadBOL = async (req, res) => {
  try {
    const loadId = req.body.load_id || req.body.loadId || req.body.loadNumber;
    const { groupId, receiverId } = req.body;
    const user = req.user;

    if (!loadId) {
      return res.status(400).json({ success: false, message: "load_id is required" });
    }

    let imageUrl = "";

    if (req.file) {
      const uploadRes = await uploadToCloudinary(req.file.buffer);
      imageUrl = uploadRes.secure_url;
    } else if (req.body.bol_image && typeof req.body.bol_image === "string") {
      const uploadRes = await uploadToCloudinary(req.body.bol_image);
      imageUrl = uploadRes.secure_url;
    } else {
      return res.status(400).json({ success: false, message: "bol_image file or image data is required" });
    }

    const cleanLoadNum = loadId.toString().replace(/[^0-9a-zA-Z_-]/g, "");

    // Save BOL document into Supabase 'documents' table matching load_id UUID (without mutating cargo description)
    const supabaseDoc = await saveDocumentToSupabase(cleanLoadNum, imageUrl, "BOL", user?.supabaseUid);

    const msgText = `📄 BILL OF LADING (BOL) ATTACHED\nLoad #${cleanLoadNum} BOL uploaded by Driver ${user?.fullName || "Driver"}.\nFile saved to Supabase & Fleet Vault.`;

    const validGroupId = (groupId && mongoose.Types.ObjectId.isValid(groupId)) ? groupId : null;
    const validReceiverId = (receiverId && mongoose.Types.ObjectId.isValid(receiverId)) ? receiverId : null;

    const newMsg = new Message({
      senderId: user?._id || null,
      groupId: validGroupId,
      receiverId: validReceiverId,
      text: msgText,
      image: imageUrl,
      documentType: "bol",
      isUrgent: true,
      status: "sent",
    });

    await newMsg.save();

    if (validGroupId) {
      const group = await Group.findById(validGroupId);
      if (group) {
        group.members.forEach((mId) => {
          const sId = getReceiverSocketId(mId.toString());
          if (sId) io.to(sId).emit("newGroupMessage", newMsg);
        });
      }
    } else if (validReceiverId) {
      const sId = getReceiverSocketId(validReceiverId);
      if (sId) io.to(sId).emit("newMessage", newMsg);
    }

    return res.status(200).json({
      success: true,
      message: "BOL uploaded and saved to Supabase!",
      document: {
        imageUrl,
        loadId: cleanLoadNum,
        status: "bol_pending_approval",
        file_path: imageUrl,
        is_approved: false,
      },
    });
  } catch (error) {
    console.error("uploadBOL Controller Error:", error);
    const errorMessage =
      error?.message ||
      error?.error?.message ||
      "Cloudinary upload timed out or failed. Please check network connection and try again.";
    return res.status(500).json({ success: false, message: errorMessage, error: error?.error || error });
  }
};
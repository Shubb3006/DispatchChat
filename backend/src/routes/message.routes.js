// import express from "express";
// import {
//   getMessages,
//   getMessageById,
//   sendMessage,
//   markMessagesAsRead,
//   deleteMessage
// } from "../controllers/message.controller.js";
// import { protectedRoute } from "../middlewares/auth.middleware.js";

// const router = express.Router();

// router.get("/", protectedRoute, getMessages);
// router.get("/:id", protectedRoute, getMessageById);
// router.post("/", protectedRoute, sendMessage);
// router.put("/read", protectedRoute, markMessagesAsRead);
// router.delete("/:id", protectedRoute, deleteMessage);

// export default router;


import express from "express";
import {
  getMessages,
  getMessageById,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
} from "../controllers/message.controller.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Get all messages (supports query params)
router.get("/", protectedRoute, getMessages);

// Get single message
router.get("/:id", protectedRoute, getMessageById);

// Send message
router.post("/", protectedRoute, sendMessage);

// Mark messages as read
router.put("/read", protectedRoute, markMessagesAsRead);

// Delete message
router.delete("/:id", protectedRoute, deleteMessage);

export default router;

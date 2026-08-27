import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import {
  getMessages,
  sendMessage,
  usersList,
  reactToMessage,
  editMessage,
  deleteMessage,
  markMessagesAsRead,
  togglePinMessage,
  sendBroadcastAnnouncement,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectedRoute, usersList);
router.get("/:id", protectedRoute, getMessages);
router.post("/send-message/:id", protectedRoute, sendMessage);
router.post("/broadcast", protectedRoute, sendBroadcastAnnouncement);
router.put("/mark-read", protectedRoute, markMessagesAsRead);
router.put("/:id/react", protectedRoute, reactToMessage);
router.put("/:id/edit", protectedRoute, editMessage);
router.put("/:id/pin", protectedRoute, togglePinMessage);
router.delete("/:id", protectedRoute, deleteMessage);

export default router;


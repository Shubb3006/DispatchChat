import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import {
  createGroup,
  getUserGroups,
  getGroupMessages,
  sendGroupMessage,
  addMembersToGroup,
  removeMemberFromGroup,
  updateGroupDetails,
} from "../controllers/group.controller.js";

const router = express.Router();

router.post("/", protectedRoute, createGroup);
router.get("/", protectedRoute, getUserGroups);
router.get("/:groupId/messages", protectedRoute, getGroupMessages);
router.post("/:groupId/send-message", protectedRoute, sendGroupMessage);
router.put("/:groupId/members", protectedRoute, addMembersToGroup);
router.delete("/:groupId/members/:userId", protectedRoute, removeMemberFromGroup);
router.put("/:groupId/update", protectedRoute, updateGroupDetails);

export default router;

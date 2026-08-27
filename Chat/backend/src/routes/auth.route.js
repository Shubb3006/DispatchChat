import express from "express";
import {
  login,
  logout,
  signup,
  check,
  updateProfile,
  createUserByAdmin,
  getAllUsersAdmin,
  resetUserPassword,
  updateUserRole,
  updateDutyStatus,
  deleteUserByAdmin,
  updateUserDetailsByAdmin,
  mapDriverSupabaseUid,
  toggleArchiveChat,
} from "../controllers/auth.controller.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/logout", logout);

router.get("/check", protectedRoute, check);
router.put("/update-profile", protectedRoute, updateProfile);

// Admin Management & Duty Status
router.post("/admin/create-user", protectedRoute, createUserByAdmin);
router.get("/admin/users", protectedRoute, getAllUsersAdmin);
router.put("/admin/reset-password", protectedRoute, resetUserPassword);
router.put("/admin/update-role", protectedRoute, updateUserRole);
router.put("/admin/update-user", protectedRoute, updateUserDetailsByAdmin);
router.delete("/admin/delete-user/:userId", protectedRoute, deleteUserByAdmin);
router.put("/duty-status", protectedRoute, updateDutyStatus);
router.post("/admin/map-supabase-uid", protectedRoute, mapDriverSupabaseUid);
router.put("/archive/:id", protectedRoute, toggleArchiveChat);

export default router;



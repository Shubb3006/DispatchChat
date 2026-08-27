import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useAdminStore = create((set) => ({
  users: [],
  isLoadingUsers: false,
  isCreatingUser: false,
  isResettingPassword: false,

  getAllUsers: async () => {
    set({ isLoadingUsers: true });
    try {
      const res = await axiosInstance.get("/auth/admin/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isLoadingUsers: false });
    }
  },

  createUser: async (userData) => {
    set({ isCreatingUser: true });
    try {
      const res = await axiosInstance.post("/auth/admin/create-user", userData);
      toast.success(res.data.message || "User created successfully!");
      set((state) => ({ users: [res.data.user, ...state.users] }));
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create user");
      return false;
    } finally {
      set({ isCreatingUser: false });
    }
  },

  resetPassword: async (userId, newPassword) => {
    set({ isResettingPassword: true });
    try {
      const res = await axiosInstance.put("/auth/admin/reset-password", {
        userId,
        newPassword,
      });
      toast.success(res.data.message || "Password reset successfully!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
      return false;
    } finally {
      set({ isResettingPassword: false });
    }
  },

  updateUserRole: async (userId, role, unitNumber) => {
    try {
      const res = await axiosInstance.put("/auth/admin/update-role", {
        userId,
        role,
        unitNumber,
      });
      toast.success("User role updated successfully");
      set((state) => ({
        users: state.users.map((u) => (u._id === userId ? res.data : u)),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  },

  updateUser: async (userId, updateData) => {
    try {
      const res = await axiosInstance.put("/auth/admin/update-user", {
        userId,
        ...updateData,
      });
      toast.success("User details updated successfully");
      set((state) => ({
        users: state.users.map((u) => (u._id === userId ? res.data : u)),
      }));
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update user");
      return false;
    }
  },

  deleteUser: async (userId) => {
    try {
      await axiosInstance.delete(`/auth/admin/delete-user/${userId}`);
      toast.success("User deleted successfully");
      set((state) => ({
        users: state.users.filter((u) => u._id !== userId),
      }));
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user");
      return false;
    }
  },
}));

import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { getSocketUrl } from "../lib/config";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useChatStore } from "./useChatStore";
import { useCallStore } from "./useCallStore";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: false,
  isSigningUp: false,
  isSigningIn: false,
  isUpdatingProfile: false,

  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Auth check error:", error.message);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      toast.success("Signup successful");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  signin: async (data) => {
    set({ isSigningIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      toast.success("Sign in successful");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.error("Signin error:", error);
      const msg = error.response?.data?.message || error.message || "Sign in failed";
      toast.error(msg);
    } finally {
      set({ isSigningIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      localStorage.removeItem("jwt_token");
      toast.success("Logout successful");
      set({ authUser: null });
      useChatStore.getState().setSelectedUser(null);
      get().disconnectSocket();
    } catch (error) {
      localStorage.removeItem("jwt_token");
      set({ authUser: null });
      toast.error(error.response?.data?.message || "Logged out");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  uploadImage: async (data) => {
    return get().updateProfile(data);
  },

  toggleArchive: async (chatId) => {
    try {
      const res = await axiosInstance.put(`/auth/archive/${chatId}`);
      const { archivedChatIds, isArchived } = res.data;
      set((state) => ({
        authUser: {
          ...state.authUser,
          archivedChatIds,
        },
      }));
      toast.success(isArchived ? "Chat Archived" : "Chat Unarchived");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to toggle archive");
      return false;
    }
  },

  removeArchivedId: (chatId) => {
    set((state) => ({
      authUser: state.authUser
        ? {
            ...state.authUser,
            archivedChatIds: state.authUser.archivedChatIds.filter((id) => id !== chatId),
          }
        : null,
    }));
  },

  connectSocket: () => {
    const { authUser } = get();
    const userId = authUser?._id || authUser?.id;
    if (!authUser || !userId) return;

    // Disconnect existing socket if host changed or reconnecting
    if (get().socket) {
      get().socket.disconnect();
    }

    const socketUrl = getSocketUrl();
    console.log("Connecting Socket.io to:", socketUrl);

    const socket = io(socketUrl, {
      query: {
        userId: userId,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    socket.connect();

    socket.on("connect", () => {
      console.log("Socket connected successfully:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    set({ socket: socket });
    useCallStore.getState().setupSocketListeners();
  },

  disconnectSocket: () => {
    if (get().socket) {
      get().socket.disconnect();
      set({ socket: null });
    }
  },
}));

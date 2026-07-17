import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";


export const useMessageStore = create((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,

  fetchMessages: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/messages");
      const msgList = response.data || [];
      const parsedMessages = msgList.map((item) =>
        typeof item.data === "string"
          ? JSON.parse(item.data)
          : item.data || item
      );
      set({ messages: parsedMessages, isLoading: false });
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      set({ error: "Failed to fetch messages", isLoading: false });
    }
  },

  sendMessage: async (message) => {
    try {
      const response = await axiosInstance.post("/messages", message);
      const savedMsg = response.data || message;
      set((state) => ({ messages: [...state.messages, savedMsg] }));
    } catch (err) {
      console.error("Failed to send message:", err);
      set({ error: "Failed to send message" });
      toast.error("Failed to dispatch message");
    }
  },

  markAsRead: async (shipmentId, role) => {
    try {
      await axiosInstance.put("/messages/read", { shipmentId, role });
      set((state) => ({
        messages: state.messages.map((m) => {
          if (m.shipmentId === shipmentId && !m.read) {
            if (
              (role === "dispatcher" && m.senderRole === "driver") ||
              (role === "driver" && m.senderRole === "dispatcher")
            ) {
              return { ...m, read: true };
            }
          }
          return m;
        }),
      }));
    } catch (err) {
      console.error("Failed to mark messages as read:", err);
      set({ error: "Failed to mark messages as read" });
    }
  },
}));

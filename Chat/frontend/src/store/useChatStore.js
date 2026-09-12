import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import { showLocalNotification } from "../lib/notifications";
import { addToQueue, getQueue, clearQueue, listenToNetwork } from "../lib/offlineQueue";

export const useChatStore = create((set, get) => ({
  users: [],
  messages: [],
  messagesByUser: {},
  usersFetching: false,
  selectedUser: null,
  isMessagesLoading: false,
  isMessageSending: false,

  isTyping: false,
  searchQuery: "",
  searchDate: "",
  replyingToMessage: null,

  unreadCounts: {},
  lastMessageTimestamps: {},

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchDate: (date) => set({ searchDate: date }),
  setReplyingToMessage: (message) => set({ replyingToMessage: message }),

  togglePinMessage: async (messageId) => {
    try {
      const res = await axiosInstance.put(`/messages/${messageId}/pin`);
      const updatedMessage = res.data;
      set({
        messages: get().messages.map((m) =>
          m._id === messageId ? updatedMessage : m
        ),
      });
      toast.success(
        updatedMessage.isPinned ? "Message Pinned" : "Message Unpinned"
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to pin message");
    }
  },

  setSelectedUser: async (user) => {
    set({ selectedUser: user });
    if (user?._id) {
      // Reset unread count for selected user
      set((state) => ({
        unreadCounts: { ...state.unreadCounts, [user._id]: 0 },
      }));

      // Mark messages as read on backend
      try {
        await axiosInstance.put("/messages/mark-read", { senderId: user._id });
      } catch (err) {
        console.error("Failed to mark messages as read:", err);
      }
    }
  },

  getUserList: async () => {
    set({ usersFetching: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ usersFetching: false });
    }
  },

  // getMessages: async (receiverId) => {
  //   set({ isMessagesLoading: true });
  //   try {
  //     const res = await axiosInstance.get(`/messages/${receiverId}`);
  //     set({ messages: res.data });
  //   } catch (error) {
  //     toast.error(error.response?.data?.message || "Failed to fetch messages");
  //   } finally {
  //     set({ isMessagesLoading: false });
  //   }
  // },

  getMessages: async (receiverId) => {
    const cachedMessages = get().messagesByUser[receiverId];

    // If we already have messages cached for this user,
    // show them immediately and don't show skeleton.
    if (cachedMessages) {
      set({
        messages: cachedMessages,
        isMessagesLoading: false,
      });
    } else {
      // First time opening this chat
      set({
        messages: [],
        isMessagesLoading: true,
      });
    }

    try {
      const res = await axiosInstance.get(`/messages/${receiverId}`);

      const fetchedMessages = res.data;

      set((state) => ({
        messagesByUser: {
          ...state.messagesByUser,
          [receiverId]: fetchedMessages,
        },

        // Only update visible messages if this is still
        // the currently selected chat.
        ...(state.selectedUser?._id === receiverId
          ? {
            messages: fetchedMessages,
            isMessagesLoading: false,
          }
          : {}),
      }));
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch messages"
      );

      // Only stop loading for the currently selected chat
      if (get().selectedUser?._id === receiverId) {
        set({ isMessagesLoading: false });
      }
    }
  },

  // sendMessage: async (data) => {
  //   const { messages, selectedUser, users } = get();
  //   const receiverId = selectedUser?._id || selectedUser?.id;
  //   if (!receiverId) return;

  //   set({ isMessageSending: true });
  //   try {
  //     const res = await axiosInstance.post(
  //       `/messages/send-message/${receiverId}`,
  //       data
  //     );

  //     // Move receiver user to top of users list
  //     const targetUser = users.find((u) => u._id === receiverId);
  //     const otherUsers = users.filter((u) => u._id !== receiverId);
  //     const updatedUsers = targetUser ? [targetUser, ...otherUsers] : users;

  //     // set({
  //     //   messages: [...messages, res.data],
  //     //   users: updatedUsers,
  //     //   lastMessageTimestamps: {
  //     //     ...get().lastMessageTimestamps,
  //     //     [receiverId]: Date.now(),
  //     //   },
  //     // });
  //     set((state) => {
  //       const updatedMessages = [...state.messages, res.data];

  //       return {
  //         messages: updatedMessages,

  //         messagesByUser: {
  //           ...state.messagesByUser,
  //           [receiverId]: updatedMessages,
  //         },

  //         users: updatedUsers,

  //         lastMessageTimestamps: {
  //           ...state.lastMessageTimestamps,
  //           [receiverId]: Date.now(),
  //         },
  //       };
  //     });
  //   } catch (error) {
  //     if (error.code === "ERR_NETWORK" || !navigator.onLine) {
  //       addToQueue(data, "direct", receiverId);
  //       toast("You are offline. Message queued!", { icon: "📡" });
  //     } else {
  //       toast.error(error.response?.data?.message || "Failed to send message");
  //     }
  //   } finally {
  //     set({ isMessageSending: false });
  //   }
  // },
  sendMessage: async (data) => {
    const { selectedUser, users } = get();
    const receiverId = selectedUser?._id || selectedUser?.id;

    if (!receiverId) return;

    const senderId = useAuthStore.getState().authUser?._id;

    // Temporary message shown immediately in the UI
    const tempId = `temp-${Date.now()}-${Math.random()}`;

    const optimisticMessage = {
      ...data,
      _id: tempId,
      senderId,
      receiverId,
      createdAt: new Date().toISOString(),
      status: "sending",
      isOptimistic: true,
    };

    // Show message immediately
    set((state) => {
      const updatedMessages = [...state.messages, optimisticMessage];

      return {
        messages: updatedMessages,

        messagesByUser: {
          ...state.messagesByUser,
          [receiverId]: updatedMessages,
        },

        isMessageSending: true,
      };
    });

    try {
      const res = await axiosInstance.post(
        `/messages/send-message/${receiverId}`,
        data
      );

      const realMessage = res.data;

      // Replace temporary message with real database message
      set((state) => {
        const updatedMessages = state.messages.map((message) =>
          message._id === tempId ? realMessage : message
        );

        return {
          messages: updatedMessages,

          messagesByUser: {
            ...state.messagesByUser,
            [receiverId]: updatedMessages,
          },

          lastMessageTimestamps: {
            ...state.lastMessageTimestamps,
            [receiverId]: Date.now(),
          },
        };
      });

      // Move receiver to top
      const targetUser = users.find((u) => u._id === receiverId);
      const otherUsers = users.filter((u) => u._id !== receiverId);

      set({
        users: targetUser ? [targetUser, ...otherUsers] : users,
      });

    } catch (error) {
      console.error("Failed to send message:", error);

      if (error.code === "ERR_NETWORK" || !navigator.onLine) {
        addToQueue(data, "direct", receiverId);

        toast("You are offline. Message queued!", {
          icon: "📡",
        });
      } else {
        toast.error(
          error.response?.data?.message || "Failed to send message"
        );
      }

      // Remove failed optimistic message
      set((state) => {
        const updatedMessages = state.messages.filter(
          (message) => message._id !== tempId
        );

        return {
          messages: updatedMessages,

          messagesByUser: {
            ...state.messagesByUser,
            [receiverId]: updatedMessages,
          },
        };
      });

    } finally {
      set({ isMessageSending: false });
    }
  },
  syncQueue: async () => {
    const queue = getQueue();
    if (queue.length === 0) return;

    toast.loading(`Syncing ${queue.length} messages...`, { id: "sync" });

    for (const item of queue) {
      try {
        if (item.type === "direct") {
          await axiosInstance.post(`/messages/send-message/${item.targetId}`, item.messageData);
        } else {
          // Assume group if not direct
          await axiosInstance.post(`/groups/${item.targetId}/send-message`, item.messageData);
        }
      } catch (e) {
        console.error("Sync failed for a message", e);
      }
    }

    clearQueue();
    toast.success("All messages synced!", { id: "sync" });
    // Refresh lists
    get().getUserList();
  },

  reactToMessage: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.put(`/messages/${messageId}/react`, {
        emoji,
      });
      const updatedMessage = res.data;
      set({
        messages: get().messages.map((m) =>
          m._id === messageId ? updatedMessage : m
        ),
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to react");
    }
  },

  editMessage: async (messageId, text) => {
    try {
      const res = await axiosInstance.put(`/messages/${messageId}/edit`, {
        text,
      });
      const updatedMessage = res.data;
      set({
        messages: get().messages.map((m) =>
          m._id === messageId ? updatedMessage : m
        ),
      });
      toast.success("Message edited");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to edit message");
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      set({
        messages: get().messages.filter((m) => m._id !== messageId),
      });
      toast.success("Message deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  // subscribeToMessages: () => {
  //   const socket = useAuthStore.getState().socket;
  //   if (!socket) return;

  //   socket.off("newMessage");
  //   socket.off("typing");
  //   socket.off("messageReaction");
  //   socket.off("messageEdited");
  //   socket.off("messageDeleted");
  //   socket.off("messagesRead");
  //   socket.off("messagePinned");

  //   socket.on("newMessage", (newMessage) => {
  //     const { selectedUser, users, unreadCounts, lastMessageTimestamps } = get();
  //     const senderId =
  //       typeof newMessage.senderId === "object"
  //         ? newMessage.senderId._id
  //         : newMessage.senderId;

  //     // Auto-unarchive locally
  //     useAuthStore.getState().removeArchivedId(senderId);

  //     const isCurrentChat = selectedUser?._id === senderId;
  //     const newUnreadCount = isCurrentChat ? 0 : (unreadCounts[senderId] || 0) + 1;
  //     const now = Date.now();

  //     // Update users list with latest message timestamp
  //     const updatedUsers = users.map(u =>
  //       u._id === senderId ? { ...u, lastMessageAt: now } : u
  //     );

  //     set({
  //       users: updatedUsers,
  //       unreadCounts: {
  //         ...unreadCounts,
  //         [senderId]: newUnreadCount,
  //       },
  //       lastMessageTimestamps: {
  //         ...lastMessageTimestamps,
  //         [senderId]: now,
  //       },
  //     });

  //     if (isCurrentChat) {
  //       set({ messages: [...get().messages, newMessage] });
  //     } else {
  //       // Show notification if not in current chat
  //       const senderName = typeof newMessage.senderId === "object"
  //         ? newMessage.senderId.fullName
  //         : "New Message";
  //       showLocalNotification(senderName, newMessage.text || "📷 Sent a photo");
  //     }
  //   });

  //   socket.on("typing", ({ senderId, isTyping }) => {
  //     const currentSelectedId = get().selectedUser?._id;
  //     if (senderId === currentSelectedId) {
  //       set({ isTyping });
  //     }
  //   });

  //   socket.on("messageReaction", (updatedMessage) => {
  //     set({
  //       messages: get().messages.map((m) =>
  //         m._id === updatedMessage._id ? updatedMessage : m
  //       ),
  //     });
  //   });

  //   socket.on("messageEdited", (updatedMessage) => {
  //     set({
  //       messages: get().messages.map((m) =>
  //         m._id === updatedMessage._id ? updatedMessage : m
  //       ),
  //     });
  //   });

  //   socket.on("messagesRead", ({ readerId }) => {
  //     set({
  //       messages: get().messages.map((m) => ({
  //         ...m,
  //         status: "read",
  //       })),
  //     });
  //   });

  //   socket.on("messagePinned", (updatedMessage) => {
  //     set({
  //       messages: get().messages.map((m) =>
  //         m._id === updatedMessage._id ? updatedMessage : m
  //       ),
  //     });
  //   });

  //   socket.on("messageDeleted", ({ messageId }) => {
  //     set({
  //       messages: get().messages.filter((m) => m._id !== messageId),
  //     });
  //   });
  // },
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");
    socket.off("typing");
    socket.off("messageReaction");
    socket.off("messageEdited");
    socket.off("messageDeleted");
    socket.off("messagesRead");
    socket.off("messagePinned");

    socket.on("newMessage", (newMessage) => {
      const {
        selectedUser,
        users,
        unreadCounts,
        lastMessageTimestamps,
      } = get();

      const senderId =
        typeof newMessage.senderId === "object"
          ? newMessage.senderId._id
          : newMessage.senderId;

      useAuthStore.getState().removeArchivedId(senderId);

      const isCurrentChat = selectedUser?._id === senderId;
      const newUnreadCount = isCurrentChat
        ? 0
        : (unreadCounts[senderId] || 0) + 1;

      const now = Date.now();

      const updatedUsers = users.map((u) =>
        u._id === senderId
          ? { ...u, lastMessageAt: now }
          : u
      );

      set({
        users: updatedUsers,
        unreadCounts: {
          ...unreadCounts,
          [senderId]: newUnreadCount,
        },
        lastMessageTimestamps: {
          ...lastMessageTimestamps,
          [senderId]: now,
        },
      });

      if (isCurrentChat) {
        set((state) => {
          const updatedMessages = [
            ...state.messages,
            newMessage,
          ];

          return {
            messages: updatedMessages,

            messagesByUser: {
              ...state.messagesByUser,
              [senderId]: updatedMessages,
            },
          };
        });
        // } else {
        //   const senderName =
        //     typeof newMessage.senderId === "object"
        //       ? newMessage.senderId.fullName
        //       : "New Message";

        //   showLocalNotification(
        //     senderName,
        //     newMessage.text || "📷 Sent a photo"
        //   );
        // }
      } else {
        // If this chat already has a cache,
        // add the new message to that cache.
        set((state) => {
          const cachedMessages = state.messagesByUser[senderId];

          if (!cachedMessages) {
            return {};
          }

          return {
            messagesByUser: {
              ...state.messagesByUser,
              [senderId]: [
                ...cachedMessages,
                newMessage,
              ],
            },
          };
        });

        const senderName =
          typeof newMessage.senderId === "object"
            ? newMessage.senderId.fullName
            : "New Message";

        showLocalNotification(
          senderName,
          newMessage.text || "📷 Sent a photo"
        );
      }
    });

    socket.on("typing", ({ senderId, isTyping }) => {
      const currentSelectedId = get().selectedUser?._id;

      if (senderId === currentSelectedId) {
        set({ isTyping });
      }
    });

    socket.on("messageReaction", (updatedMessage) => {
      set((state) => {
        const updatedMessages = state.messages.map((m) =>
          m._id === updatedMessage._id
            ? updatedMessage
            : m
        );

        const selectedUserId = state.selectedUser?._id;

        return {
          messages: updatedMessages,

          ...(selectedUserId
            ? {
              messagesByUser: {
                ...state.messagesByUser,
                [selectedUserId]: updatedMessages,
              },
            }
            : {}),
        };
      });
    });

    socket.on("messageEdited", (updatedMessage) => {
      set((state) => {
        const updatedMessages = state.messages.map((m) =>
          m._id === updatedMessage._id
            ? updatedMessage
            : m
        );

        const selectedUserId = state.selectedUser?._id;

        return {
          messages: updatedMessages,

          ...(selectedUserId
            ? {
              messagesByUser: {
                ...state.messagesByUser,
                [selectedUserId]: updatedMessages,
              },
            }
            : {}),
        };
      });
    });

    socket.on("messagesRead", ({ readerId }) => {
      set((state) => {
        const updatedMessages = state.messages.map((m) => ({
          ...m,
          status: "read",
        }));

        const selectedUserId = state.selectedUser?._id;

        return {
          messages: updatedMessages,

          ...(selectedUserId
            ? {
              messagesByUser: {
                ...state.messagesByUser,
                [selectedUserId]: updatedMessages,
              },
            }
            : {}),
        };
      });
    });

    socket.on("messagePinned", (updatedMessage) => {
      set((state) => {
        const updatedMessages = state.messages.map((m) =>
          m._id === updatedMessage._id
            ? updatedMessage
            : m
        );

        const selectedUserId = state.selectedUser?._id;

        return {
          messages: updatedMessages,

          ...(selectedUserId
            ? {
              messagesByUser: {
                ...state.messagesByUser,
                [selectedUserId]: updatedMessages,
              },
            }
            : {}),
        };
      });
    });

    socket.on("messageDeleted", ({ messageId }) => {
      set((state) => {
        const updatedMessages = state.messages.filter(
          (m) => m._id !== messageId
        );

        const selectedUserId = state.selectedUser?._id;

        return {
          messages: updatedMessages,

          ...(selectedUserId
            ? {
              messagesByUser: {
                ...state.messagesByUser,
                [selectedUserId]: updatedMessages,
              },
            }
            : {}),
        };
      });
    });
  },
  sendBroadcastAnnouncement: async (broadcastData) => {
    try {
      const res = await axiosInstance.post("/messages/broadcast", broadcastData);
      toast.success(res.data.message || "Fleet broadcast sent!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send broadcast");
      return false;
    }
  },

  unsubscribefromMessages: async () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("typing");
    socket.off("messageReaction");
    socket.off("messageEdited");
    socket.off("messageDeleted");
    socket.off("messagesRead");
    socket.off("messagePinned");
  },

  setIsTyping: (state) => {
    set({ isTyping: state });
  },
}));


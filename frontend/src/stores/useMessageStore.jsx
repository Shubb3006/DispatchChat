// import { create } from "zustand";
// import toast from "react-hot-toast";
// import { axiosInstance } from "../../lib/axios";

// export const useMessageStore = create((set, get) => ({
//   messages: [],
//   isLoading: false,
//   error: null,

//   fetchMessages: async (params = {}) => {
//     console.log(params);
//     set({ isLoading: true, error: null });
//     try {
//       const response = await axiosInstance.get("/messages", { params });
//       const rawData = response.data;
//       const msgList = Array.isArray(rawData)
//         ? rawData
//         : rawData?.messages || rawData?.data || [];

//       const parsedMessages = msgList.map((item) => {
//         const raw =
//           typeof item.data === "string"
//             ? JSON.parse(item.data)
//             : item.data || item;
//         return {
//           ...raw,
//           id: raw.id || item.id,
//           senderId:
//             raw.sender_id || raw.senderId || item.sender_id || item.senderId,
//           sender_id:
//             raw.sender_id || raw.senderId || item.sender_id || item.senderId,
//           senderName:
//             raw.sender_name ||
//             raw.senderName ||
//             item.sender_name ||
//             item.senderName,
//           sender_name:
//             raw.sender_name ||
//             raw.senderName ||
//             item.sender_name ||
//             item.senderName,
//           senderRole:
//             raw.sender_role ||
//             raw.senderRole ||
//             item.sender_role ||
//             item.senderRole,
//           sender_role:
//             raw.sender_role ||
//             raw.senderRole ||
//             item.sender_role ||
//             item.senderRole,
//           recipientId:
//             raw.recipient_id ||
//             raw.recipientId ||
//             item.recipient_id ||
//             item.recipientId,
//           recipient_id:
//             raw.recipient_id ||
//             raw.recipientId ||
//             item.recipient_id ||
//             item.recipientId,
//           driverId:
//             raw.driver_id || raw.driverId || item.driver_id || item.driverId,
//           driver_id:
//             raw.driver_id || raw.driverId || item.driver_id || item.driverId,
//           shipmentId:
//             raw.shipment_id ||
//             raw.shipmentId ||
//             item.shipment_id ||
//             item.shipmentId,
//           shipment_id:
//             raw.shipment_id ||
//             raw.shipmentId ||
//             item.shipment_id ||
//             item.shipmentId,
//           groupId: raw.group_id || raw.groupId || item.group_id || item.groupId,
//           group_id:
//             raw.group_id || raw.groupId || item.group_id || item.groupId,
//           text: raw.text ?? item.text ?? raw.content ?? "",
//           read: Boolean(raw.read || raw.is_read || item.read || item.is_read),
//           is_read: Boolean(
//             raw.read || raw.is_read || item.read || item.is_read
//           ),
//           attachments: raw.attachments || item.attachments || null,
//           timestamp:
//             raw.created_at ||
//             raw.timestamp ||
//             item.created_at ||
//             item.timestamp ||
//             new Date().toISOString(),
//           created_at:
//             raw.created_at ||
//             raw.timestamp ||
//             item.created_at ||
//             item.timestamp ||
//             new Date().toISOString(),
//         };
//       });

//       set({ messages: parsedMessages, isLoading: false });
//       return parsedMessages;
//     } catch (err) {
//       console.error("Failed to fetch messages:", err);
//       set({ error: "Failed to fetch messages", isLoading: false });
//       return [];
//     }
//   },

//   sendMessage: async (message) => {
//     try {
//       const response = await axiosInstance.post("/messages", message);
//       const resData = response.data;
//       const raw = resData?.data || resData?.messageObj || resData;

//       const savedMsg = {
//         ...message,
//         ...raw,
//         id: raw?.id || message.id || `msg_${Date.now()}`,
//         senderId:
//           raw?.sender_id ||
//           raw?.senderId ||
//           message.senderId ||
//           message.sender_id,
//         text: raw?.text ?? message.text ?? message.content ?? "",
//         read: Boolean(raw?.read || raw?.is_read || false),
//         is_read: Boolean(raw?.read || raw?.is_read || false),
//         timestamp:
//           raw?.created_at || raw?.timestamp || new Date().toISOString(),
//       };

//       set((state) => ({ messages: [...state.messages, savedMsg] }));
//       return savedMsg;
//     } catch (err) {
//       console.error("Failed to send message:", err);
//       set({ error: "Failed to send message" });
//       toast.error("Failed to dispatch message");
//       throw err;
//     }
//   },

//   markAsRead: async (payload, role) => {
//     try {
//       const requestBody =
//         typeof payload === "object" ? payload : { shipmentId: payload, role };
//       await axiosInstance.put("/messages/read", requestBody);

//       set((state) => ({
//         messages: state.messages.map((m) => {
//           const matchShipment =
//             requestBody.shipmentId &&
//             (m.shipmentId === requestBody.shipmentId ||
//               m.shipment_id === requestBody.shipmentId);
//           const matchDriver =
//             requestBody.driverId &&
//             (m.driverId === requestBody.driverId ||
//               m.driver_id === requestBody.driverId ||
//               m.senderId === requestBody.driverId);

//           if (
//             matchShipment ||
//             matchDriver ||
//             (!requestBody.shipmentId && !requestBody.driverId)
//           ) {
//             return { ...m, read: true, is_read: true };
//           }
//           return m;
//         }),
//       }));
//     } catch (err) {
//       console.error("Failed to mark messages as read:", err);
//       set({ error: "Failed to mark messages as read" });
//     }
//   },

//   deleteMessage: async (id) => {
//     try {
//       await axiosInstance.delete(`/messages/${id}`);
//       set((state) => ({
//         messages: state.messages.filter((m) => m.id !== id),
//       }));
//       toast.success("Message deleted");
//     } catch (err) {
//       console.error("Failed to delete message:", err);
//       toast.error("Failed to delete message");
//     }
//   },
// }));




import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";

export const useMessageStore = create((set) => ({
  messages: [],
  isLoading: false,
  error: null,

  /*
  ====================================
  FETCH MESSAGES
  ====================================
  */
  fetchMessages: async (params = {}) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axiosInstance.get("/messages", {
        params,
      });

      set({
        messages: response.data.messages || [],
        isLoading: false,
      });

      return response.data.messages || [];
    } catch (err) {
      console.error(err);

      set({
        isLoading: false,
        error: "Failed to fetch messages",
      });

      return [];
    }
  },

  /*
  ====================================
  SEND MESSAGE
  ====================================
  */
  sendMessage: async (message) => {
    try {
      const response = await axiosInstance.post("/messages", message);

      const newMessage = response.data.data;

      set((state) => ({
        messages: [...state.messages, newMessage],
      }));

      return newMessage;
    } catch (err) {
      console.error(err);

      toast.error("Failed to send message");
      throw err;
    }
  },

  /*
  ====================================
  MARK AS READ
  ====================================
  */
  markAsRead: async (messageIds) => {
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) return;
    try {
      set((state) => ({
        messages: state.messages.map((msg) =>
          messageIds.includes(msg.id)
            ? {
                ...msg,
                is_read: true,
                read_at: new Date().toISOString(),
              }
            : msg
        ),
      }));

      await axiosInstance.put("/messages/read", {
        messageIds,
      });
    } catch (err) {
      console.warn("Message read status sync handled:", err);
    }
  },

  /*
  ====================================
  DELETE MESSAGE
  ====================================
  */
  deleteMessage: async (id) => {
    try {
      await axiosInstance.delete(`/messages/${id}`);

      set((state) => ({
        messages: state.messages.filter((msg) => msg.id !== id),
      }));

      toast.success("Message deleted");
    } catch (err) {
      console.error(err);

      toast.error("Failed to delete message");
    }
  },
}));
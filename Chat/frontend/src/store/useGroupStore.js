import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import { showLocalNotification } from "../lib/notifications";
import { addToQueue } from "../lib/offlineQueue";

export const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  groupMessages: [],
  isGroupsLoading: false,
  isGroupMessagesLoading: false,
  isCreatingGroup: false,
  isUpdatingGroup: false,

  groupUnreadCounts: {},

  setSelectedGroup: async (selectedGroup) => {
    set({ selectedGroup });
    if (selectedGroup?._id) {
      // Reset unread count for this group channel
      set((state) => ({
        groupUnreadCounts: { ...state.groupUnreadCounts, [selectedGroup._id]: 0 },
      }));

      // Mark read on backend
      try {
        await axiosInstance.put("/messages/mark-read", {
          groupId: selectedGroup._id,
        });
      } catch (err) {
        console.error("Failed to mark group messages as read:", err);
      }
    }
  },

  getUserGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch group channels");
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  createGroup: async (groupData) => {
    set({ isCreatingGroup: true });
    try {
      const res = await axiosInstance.post("/groups", groupData);
      toast.success("Fleet group created!");
      set((state) => ({ groups: [res.data, ...state.groups] }));
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
      return false;
    } finally {
      set({ isCreatingGroup: false });
    }
  },

  updateGroupDetails: async (groupId, updateData) => {
    set({ isUpdatingGroup: true });
    try {
      const res = await axiosInstance.put(`/groups/${groupId}/update`, updateData);
      toast.success("Group name updated successfully!");

      set((state) => ({
        groups: state.groups.map((g) => (g._id === groupId ? res.data : g)),
        selectedGroup:
          state.selectedGroup?._id === groupId ? res.data : state.selectedGroup,
      }));
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update group name");
      return false;
    } finally {
      set({ isUpdatingGroup: false });
    }
  },

  addMembers: async (groupId, memberIds) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}/members`, { memberIds });
      set((state) => ({
        groups: state.groups.map((g) => (g._id === groupId ? res.data : g)),
        selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup,
      }));
      toast.success("Members added successfully");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add members");
      return false;
    }
  },

  removeMember: async (groupId, userId) => {
    try {
      const res = await axiosInstance.delete(`/groups/${groupId}/members/${userId}`);
      set((state) => ({
        groups: state.groups.map((g) => (g._id === groupId ? res.data : g)),
        selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup,
      }));
      toast.success("Member removed successfully");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove member");
      return false;
    }
  },

  getGroupMessages: async (groupId) => {
    set({ isGroupMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ groupMessages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch group messages");
    } finally {
      set({ isGroupMessagesLoading: false });
    }
  },

  sendGroupMessage: async (groupId, messageData) => {
    const { groups } = get();
    try {
      const res = await axiosInstance.post(
        `/groups/${groupId}/send-message`,
        messageData
      );

      // Re-sort groups list to move this channel to the top
      const targetGroup = groups.find((g) => g._id === groupId);
      const otherGroups = groups.filter((g) => g._id !== groupId);
      const updatedGroups = targetGroup ? [targetGroup, ...otherGroups] : groups;

      set((state) => ({
        groups: updatedGroups,
        groupMessages: [...state.groupMessages, res.data],
      }));
    } catch (error) {
      if (error.code === "ERR_NETWORK" || !navigator.onLine) {
        addToQueue(messageData, "group", groupId);
        toast("You are offline. Group message queued!", { icon: "📡" });
      } else {
        toast.error(error.response?.data?.message || "Failed to send group message");
      }
    }
  },

  subscribeToGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newGroupMessage");
    socket.off("groupUpdated");

    socket.on("newGroupMessage", (newMessage) => {
      const { selectedGroup, groups, groupUnreadCounts } = get();
      const groupId = newMessage.groupId;

      // Auto-unarchive locally
      useAuthStore.getState().removeArchivedId(groupId);

      const now = Date.now();

      // Update groups list with latest message timestamp
      const updatedGroups = groups.map(g =>
        g._id === groupId ? { ...g, lastMessageAt: now } : g
      );

      const isCurrentGroup = selectedGroup?._id === groupId;
      const newUnreadCount = isCurrentGroup ? 0 : (groupUnreadCounts[groupId] || 0) + 1;

      set({
        groups: updatedGroups,
        groupUnreadCounts: {
          ...groupUnreadCounts,
          [groupId]: newUnreadCount,
        },
      });

      if (isCurrentGroup) {
        set((state) => ({ groupMessages: [...state.groupMessages, newMessage] }));
      } else {
        // Show notification if not in current group
        const groupName = groups.find(g => g._id === groupId)?.name || "Fleet Channel";
        const senderName = typeof newMessage.senderId === "object"
          ? newMessage.senderId.fullName
          : "Someone";
        showLocalNotification(`#${groupName}`, `${senderName}: ${newMessage.text || "📷 Sent a photo"}`);
      }
    });

    socket.on("groupUpdated", (updatedGroup) => {
      const { selectedGroup, groups } = get();
      set({
        groups: groups.map((g) => (g._id === updatedGroup._id ? updatedGroup : g)),
        selectedGroup:
          selectedGroup?._id === updatedGroup._id ? updatedGroup : selectedGroup,
      });
    });
  },

  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newGroupMessage");
    socket.off("groupUpdated");
  },
}));

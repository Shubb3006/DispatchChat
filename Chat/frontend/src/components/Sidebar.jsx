import React, { useEffect, useState, useMemo } from "react";
import SideBarSkeleton from "../components/skeletons/SideBarSkeleton.jsx";
import Avatar from "./Avatar";
import { useAuthStore } from "../store/useAuthStore.js";
import { useChatStore } from "../store/useChatStore.js";
import { useGroupStore } from "../store/useGroupStore.js";
import { useLanguageStore } from "../store/useLanguageStore.js";
import {
  Users,
  Search,
  Plus,
  Truck,
  X,
  CheckCircle,
  Radio,
  MessageCircle,
  Archive,
  ArrowLeft,
} from "lucide-react";

const Sidebar = () => {
  const { t } = useLanguageStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [truckNumber, setTruckNumber] = useState("");
  const [driverNameInput, setDriverNameInput] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [showArchivedOnly, setShowArchivedOnly] = useState(false);

  const {
    isUsersLoading,
    users,
    getUserList,
    selectedUser,
    setSelectedUser,
    unreadCounts,
    subscribeToMessages,
  } = useChatStore();

  const {
    groups,
    getUserGroups,
    selectedGroup,
    setSelectedGroup,
    createGroup,
    isCreatingGroup,
    groupUnreadCounts,
    subscribeToGroupMessages,
  } = useGroupStore();

  const { authUser, onlineUsers, socket, toggleArchive } = useAuthStore();

  useEffect(() => {
    getUserList();
    getUserGroups();
    if (socket) {
      subscribeToMessages();
      subscribeToGroupMessages();
    }
  }, [getUserList, getUserGroups, socket, subscribeToMessages, subscribeToGroupMessages]);

  const safeUsers = Array.isArray(users) ? users : [];
  const safeGroups = Array.isArray(groups) ? groups : [];

  // Merge Users and Groups into one "Conversations" list
  const conversations = useMemo(() => {
    const isDriver = authUser?.role === "driver";
    const archivedIds = authUser?.archivedChatIds || [];

    let list = [];

    // 1. Add Groups (Channels)
    list = [
      ...safeGroups.map(g => ({ ...g, type: 'group', sortTime: g.lastMessageAt || 0 }))
    ];

    // 2. Add Users (Direct Chats) - HIDDEN for Drivers
    if (!isDriver) {
      list = [
        ...list,
        ...safeUsers.map(u => ({ ...u, type: 'user', sortTime: u.lastMessageAt || 0 }))
      ];
    }

    // Sort by latest message first (new message goes on top)
    list.sort((a, b) => b.sortTime - a.sortTime);

    // Filter by archived status
    list = list.filter(item => {
        const isArchived = archivedIds.includes(item._id);
        return showArchivedOnly ? isArchived : !isArchived;
    });

    // Filter by search
    return list.filter(item => {
      const name = item.type === 'user' ? (item.fullName || "") : (item.name || "");
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [safeUsers, safeGroups, searchQuery, authUser, showArchivedOnly]);

  const [driverSupabaseUid, setDriverSupabaseUid] = useState("");

  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    const success = await createGroup({
      name: groupName.trim(),
      description: groupDesc.trim(),
      driverSupabaseUid: driverSupabaseUid.trim(),
      memberIds: selectedMemberIds,
    });

    if (success) {
      setGroupName("");
      setGroupDesc("");
      setDriverSupabaseUid("");
      setSelectedMemberIds([]);
      setShowGroupModal(false);
    }
  };

  const toggleMemberSelection = (userId) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  if (isUsersLoading) return <SideBarSkeleton />;

  return (
    <div className="flex flex-col h-full bg-base-100">
      {/* Search & Actions Header */}
      <div className="p-4 space-y-3">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/40 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder={authUser?.role === "driver" ? "Search your channels..." : t("searchContacts")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-base-200 border-none pl-10 pr-4 py-2.5 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>

        {["super_user", "admin", "dispatch", "hr"].includes(authUser?.role) && (
          <button
            onClick={() => setShowGroupModal(true)}
            className="w-full btn btn-sm btn-ghost bg-primary/5 hover:bg-primary/10 text-primary border border-primary/10 rounded-xl gap-2 h-10"
          >
            <Plus className="size-4" />
            <span className="font-bold text-xs uppercase tracking-wider">New Fleet Channel</span>
          </button>
        )}

        {/* Archived Chats Toggle */}
        {!showArchivedOnly && authUser?.archivedChatIds?.length > 0 && (
          <button
            onClick={() => setShowArchivedOnly(true)}
            className="w-full flex items-center gap-3 px-1 py-2 text-primary hover:bg-primary/5 rounded-xl transition-all"
          >
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Archive className="size-4" />
            </div>
            <span className="text-sm font-bold">Archived Chats</span>
            <span className="ml-auto badge badge-sm bg-primary/20 text-primary border-none font-bold">
              {authUser.archivedChatIds.length}
            </span>
          </button>
        )}

        {showArchivedOnly && (
          <button
            onClick={() => setShowArchivedOnly(false)}
            className="w-full flex items-center gap-2 px-1 py-2 text-base-content/60 hover:text-primary transition-all"
          >
            <ArrowLeft className="size-4" />
            <span className="text-sm font-bold uppercase tracking-widest">Back to All Chats</span>
          </button>
        )}
      </div>

      {/* Unified Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-base-300/50">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center opacity-40">
            <MessageCircle className="size-12 mb-2" />
            <p className="text-sm">{t("noContactsFound")}</p>
          </div>
        ) : (
          conversations.map((item) => {
            const isGroup = item.type === 'group';
            const isSelected = isGroup
              ? selectedGroup?._id === item._id
              : selectedUser?._id === item._id;

            const isOnline = !isGroup && onlineUsers.includes(item._id);
            const unreadCount = isGroup
              ? (groupUnreadCounts[item._id] || 0)
              : (unreadCounts[item._id] || 0);

            return (
              <button
                key={item._id}
                onClick={() => {
                  if (isGroup) {
                    setSelectedGroup(item);
                    setSelectedUser(null);
                  } else {
                    setSelectedUser(item);
                    setSelectedGroup(null);
                  }
                }}
                className={`w-full px-4 py-3.5 flex items-center gap-4 hover:bg-base-200/50 transition-all border-b border-base-300/10 group ${
                  isSelected ? "bg-primary/10 border-l-4 border-primary" : "border-l-4 border-transparent"
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {isGroup ? (
                    <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-primary-content shadow-lg shadow-primary/20">
                      <Radio className="size-6" />
                    </div>
                  ) : (
                    <Avatar
                      src={item.profilePic}
                      name={item.fullName}
                      size="size-12"
                      isOnline={isOnline}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className={`text-[15px] truncate font-bold ${unreadCount > 0 ? "text-primary" : "text-base-content/80"}`}>
                      {isGroup ? item.name : item.fullName}
                    </h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <span className="badge badge-sm bg-primary border-none text-primary-content font-black shadow-lg shadow-primary/30 animate-bounce">
                          {unreadCount}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleArchive(item._id);
                        }}
                        className="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100 transition-opacity"
                        title={showArchivedOnly ? "Unarchive chat" : "Archive chat"}
                      >
                        <Archive className="size-3.5" />
                      </button>
                      <span className="text-[10px] opacity-40 font-mono">
                        {item.unitNumber ? `#${item.unitNumber}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {isGroup ? (
                      <p className={`text-xs truncate ${unreadCount > 0 ? "text-primary/70 font-semibold italic" : "text-base-content/40"}`}>
                         {item.description || "Fleet channel"}
                      </p>
                    ) : (
                      <p className={`text-xs truncate capitalize ${unreadCount > 0 ? "text-primary/70 font-semibold italic" : "text-base-content/40"}`}>
                        {item.role === 'driver' ? (item.dutyStatus?.replace('_', ' ') || 'Off Duty') : item.role}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Auth User Info (Mobile Optimized) */}
      {authUser && (
        <div className="p-3 border-t border-base-300 bg-base-200/30">
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-base-100 border border-base-300 shadow-sm">
            <Avatar
              src={authUser.profilePic}
              name={authUser.fullName}
              size="size-9"
              isOnline={true}
            />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs truncate">{authUser.fullName}</div>
              <div className="text-[9px] text-primary font-bold uppercase tracking-wider">{authUser.role}</div>
            </div>
          </div>
        </div>
      )}

      {/* Group Modal (Professional Design) */}
      {showGroupModal && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-base-100 p-6 rounded-[2rem] border border-base-300 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-primary uppercase tracking-tight">Create Channel</h3>
              <button onClick={() => setShowGroupModal(false)} className="btn btn-ghost btn-sm btn-circle"><X className="size-5" /></button>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Channel Name (e.g. 275 - HARNEEK)"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-base-200 border-none px-4 py-3 rounded-2xl font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Description (Optional)"
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  className="w-full bg-base-200 border-none px-4 py-3 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <input
                  type="text"
                  placeholder="Assigned Driver UID / Email / Unit # (Optional)"
                  value={driverSupabaseUid}
                  onChange={(e) => setDriverSupabaseUid(e.target.value)}
                  className="w-full bg-base-200 border-none px-4 py-3 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest opacity-40 ml-1">Select Members</label>
                <div className="max-h-48 overflow-y-auto bg-base-200 rounded-2xl p-2 divide-y divide-base-300/30">
                  {safeUsers.map((u) => (
                    <label key={u._id} className="flex items-center justify-between p-2.5 hover:bg-base-300/50 rounded-xl cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedMemberIds.includes(u._id)}
                          onChange={() => toggleMemberSelection(u._id)}
                          className="checkbox checkbox-primary checkbox-sm rounded-lg"
                        />
                        <div className="text-sm font-bold">{u.fullName}</div>
                      </div>
                      <span className="text-[10px] opacity-40 font-mono">#{u.unitNumber || 'OFFICE'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreatingGroup || !groupName.trim()}
                className="w-full btn btn-primary rounded-2xl font-black uppercase tracking-widest h-12"
              >
                {isCreatingGroup ? "Creating..." : "Launch Channel"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

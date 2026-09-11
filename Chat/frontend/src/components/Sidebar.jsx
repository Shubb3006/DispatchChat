import React, { useEffect, useState, useMemo, useRef } from "react";
import SideBarSkeleton from "../components/skeletons/SideBarSkeleton.jsx";
import Avatar from "./Avatar";
import { useAuthStore } from "../store/useAuthStore.js";
import { useChatStore } from "../store/useChatStore.js";
import { useGroupStore } from "../store/useGroupStore.js";
import { getRole, roleToneClass, getDuty, cleanName } from "../lib/roles.js";
import {
  Search,
  Plus,
  X,
  Radio,
  Archive,
  ArrowLeft,
  Inbox,
  Hash,
  Users2,
  Truck,
  SlidersHorizontal,
} from "lucide-react";

/** Sidebar filter lenses. Kept client-side over the already-merged list. */
const FILTERS = [
  { id: "all", label: "All", icon: Inbox },
  { id: "unread", label: "Unread", icon: SlidersHorizontal },
  { id: "channels", label: "Channels", icon: Hash },
  { id: "people", label: "People", icon: Users2 },
];

const Sidebar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [truckNumber, setTruckNumber] = useState("");
  const [driverNameInput, setDriverNameInput] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [showArchivedOnly, setShowArchivedOnly] = useState(false);
  const [driverSupabaseUid, setDriverSupabaseUid] = useState("");
  const searchRef = useRef(null);

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

  /* Ctrl/Cmd+K focuses search -- the list gets long once a fleet is loaded. */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const safeUsers = useMemo(() => (Array.isArray(users) ? users : []), [users]);
  const safeGroups = useMemo(() => (Array.isArray(groups) ? groups : []), [groups]);

  const unreadOf = (item) =>
    item.type === "group" ? groupUnreadCounts[item._id] || 0 : unreadCounts[item._id] || 0;

  /* Merge channels + people into one recency-sorted list. */
  const conversations = useMemo(() => {
    const isDriver = authUser?.role === "driver";
    const archivedIds = authUser?.archivedChatIds || [];

    let list = safeGroups.map((g) => ({ ...g, type: "group", sortTime: g.lastMessageAt || 0 }));

    // Drivers only ever see their assigned channels, never the team directory.
    if (!isDriver) {
      list = [
        ...list,
        ...safeUsers.map((u) => ({ ...u, type: "user", sortTime: u.lastMessageAt || 0 })),
      ];
    }

    list.sort((a, b) => b.sortTime - a.sortTime);

    list = list.filter((item) => {
      const isArchived = archivedIds.includes(item._id);
      return showArchivedOnly ? isArchived : !isArchived;
    });

    if (activeFilter === "channels") list = list.filter((i) => i.type === "group");
    if (activeFilter === "people") list = list.filter((i) => i.type === "user");
    if (activeFilter === "unread") {
      list = list.filter((i) =>
        i.type === "group" ? (groupUnreadCounts[i._id] || 0) > 0 : (unreadCounts[i._id] || 0) > 0
      );
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;

    // Match on name, role and unit number so "275" or "driver" both work.
    return list.filter((item) => {
      const name = item.type === "user" ? item.fullName || "" : item.name || "";
      const haystack = [
        name,
        item.unitNumber || "",
        item.type === "user" ? getRole(item.role).label : "channel",
        item.description || "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [
    safeUsers,
    safeGroups,
    searchQuery,
    authUser,
    showArchivedOnly,
    activeFilter,
    groupUnreadCounts,
    unreadCounts,
  ]);

  const totalUnread = useMemo(
    () =>
      Object.values(unreadCounts || {}).reduce((a, b) => a + b, 0) +
      Object.values(groupUnreadCounts || {}).reduce((a, b) => a + b, 0),
    [unreadCounts, groupUnreadCounts]
  );

  const archivedCount = authUser?.archivedChatIds?.length || 0;
  const canCreateChannel = ["super_user", "admin", "dispatch", "hr"].includes(authUser?.role);

  /* Keep the channel name in sync with the truck/driver helper fields. */
  const syncChannelName = (truck, driver) => {
    const next = [truck.trim(), driver.trim()].filter(Boolean).join(" - ");
    if (next) setGroupName(next);
  };

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
      setTruckNumber("");
      setDriverNameInput("");
      setSelectedMemberIds([]);
      setShowGroupModal(false);
    }
  };

  const toggleMemberSelection = (userId) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  if (isUsersLoading) return <SideBarSkeleton />;

  return (
    <div className="flex h-full flex-col bg-base-100">
      {/* ---------------- Header ---------------- */}
      <div className="space-y-3 border-b border-base-300 px-3 pb-3 pt-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold tracking-tight">Conversations</h2>
            {totalUnread > 0 && (
              <span className="nums rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-content">
                {totalUnread}
              </span>
            )}
          </div>
          {canCreateChannel && (
            <button
              onClick={() => setShowGroupModal(true)}
              className="btn btn-ghost btn-xs gap-1 rounded-lg font-semibold text-primary"
              title="Create a fleet channel"
            >
              <Plus className="size-3.5" />
              New
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/40" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, unit or role"
            className="input input-sm w-full rounded-lg border-base-300 bg-base-200 pl-9 pr-16 text-sm
              focus:border-primary focus:bg-base-100"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-base-content/50
                hover:bg-base-300 hover:text-base-content"
              title="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <kbd
              className="nums pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded
                border border-base-300 bg-base-100 px-1.5 py-0.5 text-[10px] text-base-content/40 sm:block"
            >
              Ctrl K
            </kbd>
          )}
        </div>

        {/* Filters */}
        {!showArchivedOnly && (
          <div className="flex items-center gap-1 rounded-lg bg-base-200 p-1">
            {FILTERS.map((f) => {
              const isActive = activeFilter === f.id;
              const count = f.id === "unread" ? totalUnread : null;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5
                    text-[11px] font-semibold transition-colors
                    ${isActive
                      ? "bg-base-100 text-primary shadow-sm ring-1 ring-inset ring-base-300"
                      : "text-base-content/55 hover:text-base-content"
                    }`}
                  title={f.label}
                >
                  <f.icon className="size-3.5" />
                  <span className="hidden xl:inline">{f.label}</span>
                  {count > 0 && (
                    <span className="nums rounded bg-primary/15 px-1 text-[9px] font-bold text-primary">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Archive switch */}
        {!showArchivedOnly && archivedCount > 0 && (
          <button
            onClick={() => setShowArchivedOnly(true)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold
              text-base-content/60 transition-colors hover:bg-base-200 hover:text-base-content"
          >
            <Archive className="size-3.5" />
            Archived
            <span className="nums ml-auto rounded bg-base-300 px-1.5 py-0.5 text-[10px]">
              {archivedCount}
            </span>
          </button>
        )}

        {showArchivedOnly && (
          <button
            onClick={() => setShowArchivedOnly(false)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold
              text-primary transition-colors hover:bg-primary/10"
          >
            <ArrowLeft className="size-3.5" />
            Back to all conversations
          </button>
        )}
      </div>

      {/* ---------------- List ---------------- */}
      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <div className="grid size-11 place-items-center rounded-xl bg-base-200 text-base-content/40">
              {searchQuery ? <Search className="size-5" /> : <Inbox className="size-5" />}
            </div>
            <p className="text-sm font-semibold">
              {searchQuery ? "No matches" : showArchivedOnly ? "Nothing archived" : "No conversations"}
            </p>
            <p className="max-w-[220px] text-xs text-base-content/50">
              {searchQuery
                ? `Nothing matches "${searchQuery}". Try a unit number or a role.`
                : activeFilter === "unread"
                  ? "You are all caught up."
                  : "Channels and teammates will appear here."}
            </p>
            {(searchQuery || activeFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("all");
                }}
                className="btn btn-ghost btn-xs mt-1 rounded-lg text-primary"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          conversations.map((item) => {
            const isGroup = item.type === "group";
            const isSelected = isGroup
              ? selectedGroup?._id === item._id
              : selectedUser?._id === item._id;
            const isOnline = !isGroup && onlineUsers.includes(item._id);
            const unreadCount = unreadOf(item);
            const role = getRole(item.role);
            const isDriverRow = !isGroup && item.role === "driver";
            const duty = isDriverRow ? getDuty(item.dutyStatus) : null;

            const selectConversation = () => {
              if (isGroup) {
                setSelectedGroup(item);
                setSelectedUser(null);
              } else {
                setSelectedUser(item);
                setSelectedGroup(null);
              }
            };

            return (
              /* A div rather than a button: the row holds its own <button>
                 controls, and nesting buttons is invalid HTML. */
              <div
                key={item._id}
                role="button"
                tabIndex={0}
                aria-current={isSelected ? "true" : undefined}
                onClick={selectConversation}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectConversation();
                  }
                }}
                className={`group convo-item ${isSelected ? "active" : ""}`}
              >
                {/* Avatar / channel glyph */}
                {isGroup ? (
                  <div
                    className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br
                      from-sky-500 to-indigo-600 text-white shadow-sm"
                  >
                    <Radio className="size-5" />
                  </div>
                ) : (
                  <Avatar
                    src={item.profilePic}
                    name={item.fullName}
                    size="size-11"
                    isOnline={isOnline}
                    showPresence
                  />
                )}

                {/* Text block */}
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-baseline gap-2">
                    <h3
                      className={`min-w-0 flex-1 truncate text-sm ${unreadCount > 0 ? "font-bold text-base-content" : "font-semibold text-base-content/90"
                        }`}
                    >
                      {isGroup ? item.name : cleanName(item.fullName)}
                    </h3>
                    {item.unitNumber && (
                      <span className="nums shrink-0 text-[10px] font-semibold text-base-content/40">
                        #{item.unitNumber}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-1.5">
                    {isGroup ? (
                      <span className="truncate text-xs text-base-content/50">
                        {item.description || "Fleet channel"}
                      </span>
                    ) : isDriverRow ? (
                      <>
                        <span className={`size-1.5 shrink-0 rounded-full ${duty.dot}`} />
                        <span className="truncate text-xs capitalize text-base-content/55">
                          {duty.label}
                        </span>
                      </>
                    ) : (
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5
                          text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset
                          ${roleToneClass(item.role)}`}
                      >
                        <role.icon className="size-2.5" />
                        {role.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Trailing: unread count, then archive on hover/focus */}
                <div className="flex shrink-0 items-center gap-1">
                  {unreadCount > 0 && (
                    <span
                      className="nums grid min-w-5 place-items-center rounded-full bg-primary px-1.5 py-0.5
                        text-[10px] font-bold text-primary-content"
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleArchive(item._id);
                    }}
                    className="rounded-md p-1.5 text-base-content/40 opacity-0 transition-all
                      hover:bg-base-300 hover:text-base-content focus-visible:opacity-100
                      group-hover:opacity-100"
                    title={showArchivedOnly ? "Unarchive chat" : "Archive chat"}
                  >
                    <Archive className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ---------------- Signed-in user ---------------- */}
      {authUser && (
        <div className="border-t border-base-300 bg-base-200/40 p-2.5">
          <div className="flex items-center gap-2.5 rounded-xl border border-base-300 bg-base-100 p-2">
            <Avatar
              src={authUser.profilePic}
              name={authUser.fullName}
              size="size-9"
              isOnline
              showPresence
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold">{cleanName(authUser.fullName)}</div>
              <div className="mt-0.5 flex items-center gap-1">
                {(() => {
                  const myRole = getRole(authUser.role);
                  return (
                    <span
                      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px]
                        font-bold uppercase tracking-wide ring-1 ring-inset ${roleToneClass(authUser.role)}`}
                    >
                      <myRole.icon className="size-2.5" />
                      {myRole.label}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Create channel ---------------- */}
      {showGroupModal && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="rise-in max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-5 elevated">
            <div className="mb-4 flex items-center justify-between border-b border-base-300 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white">
                  <Radio className="size-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Create fleet channel</h3>
                  <p className="text-[11px] text-base-content/50">
                    A live channel between dispatch and a driver
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGroupModal(false)}
                className="btn btn-ghost btn-sm btn-square rounded-lg"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
              {/* Quick-build helper */}
              <div className="space-y-2 rounded-xl border border-base-300 bg-base-200 p-3">
                <label className="label-caps flex items-center gap-1.5">
                  <Truck className="size-3" /> Quick build
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Truck # (275)"
                    value={truckNumber}
                    onChange={(e) => {
                      setTruckNumber(e.target.value);
                      syncChannelName(e.target.value, driverNameInput);
                    }}
                    className="input input-sm nums rounded-lg border-base-300 bg-base-100 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Driver (Harneek)"
                    value={driverNameInput}
                    onChange={(e) => {
                      setDriverNameInput(e.target.value);
                      syncChannelName(truckNumber, e.target.value);
                    }}
                    className="input input-sm rounded-lg border-base-300 bg-base-100 text-xs"
                  />
                </div>
                <p className="text-[11px] text-base-content/50">
                  Fills the channel name as <span className="nums">275 - Harneek</span>
                </p>
              </div>

              <div className="space-y-1">
                <label className="label-caps">Channel name</label>
                <input
                  type="text"
                  placeholder="275 - HARNEEK"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="input input-bordered w-full rounded-lg font-semibold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="label-caps">Description</label>
                <input
                  type="text"
                  placeholder="What is this channel for?"
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  className="input input-bordered w-full rounded-lg text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="label-caps flex items-center justify-between">
                  <span>Assigned driver UID / email / unit</span>
                  <span className="normal-case tracking-normal text-primary">
                    target for #load
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="driver101@fleet.com"
                  value={driverSupabaseUid}
                  onChange={(e) => setDriverSupabaseUid(e.target.value)}
                  className="input input-bordered nums w-full rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="label-caps flex items-center justify-between">
                  <span>Members</span>
                  {selectedMemberIds.length > 0 && (
                    <span className="text-primary">{selectedMemberIds.length} selected</span>
                  )}
                </label>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-base-300 bg-base-200 p-1.5">
                  {safeUsers.map((u) => {
                    const uRole = getRole(u.role);
                    const checked = selectedMemberIds.includes(u._id);
                    return (
                      <label
                        key={u._id}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-lg p-2 transition-colors
                          ${checked ? "bg-primary/10" : "hover:bg-base-300/60"}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMemberSelection(u._id)}
                          className="checkbox checkbox-primary checkbox-sm"
                        />
                        <Avatar src={u.profilePic} name={u.fullName} size="size-8" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">
                            {cleanName(u.fullName)}
                          </div>
                          <div className="text-[10px] text-base-content/50">{uRole.label}</div>
                        </div>
                        <span className="nums text-[10px] text-base-content/40">
                          #{u.unitNumber || "OFFICE"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-base-300 pt-3">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="btn btn-ghost btn-sm rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingGroup || !groupName.trim()}
                  className="btn btn-primary btn-sm rounded-lg px-4 font-semibold"
                >
                  {isCreatingGroup ? "Creating..." : "Create channel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

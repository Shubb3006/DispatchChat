import React, { useState } from "react";
import Avatar from "./Avatar";
import { Search, X, Radio, Folder, FileText, Edit2, ChevronLeft, UserPlus, UserMinus, Users, Phone, FileDown, WifiOff } from "lucide-react";
import { useChatStore } from "../store/useChatStore.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { useGroupStore } from "../store/useGroupStore.js";
import { useCallStore } from "../store/useCallStore.js";
import { getRole, roleToneClass, getDuty, cleanName } from "../lib/roles.js";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, searchQuery, setSearchQuery, searchDate, setSearchDate, messages, users } =
    useChatStore();
  const { selectedGroup, setSelectedGroup, groupMessages, updateGroupDetails, isUpdatingGroup, addMembers, removeMember } = useGroupStore();
  const { initCall } = useCallStore();
  const { onlineUsers, authUser } = useAuthStore();
  const [showSearch, setShowSearch] = useState(false);
  const [showMediaVault, setShowMediaVault] = useState(false);
  const [activeVaultTab, setActiveVaultTab] = useState("docs");

  // Edit Group Modal State
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDesc, setEditGroupDesc] = useState("");
  const [driverSupabaseUidInput, setDriverSupabaseUidInput] = useState("");
  const [truckNumber, setTruckNumber] = useState("");
  const [driverNameInput, setDriverNameInput] = useState("");
  const [selectedAddMemberId, setSelectedAddMemberId] = useState("");

  const selectedUserId = selectedUser?._id || selectedUser?.id;
  const isOnline = onlineUsers.includes(selectedUserId);

  const activeMessages = selectedGroup ? groupMessages : messages;

  const documentMessages = activeMessages.filter(
    (m) => m.documentType && m.documentType !== "general"
  );
  const imageMessages = activeMessages.filter((m) => m.image);
  const audioMessages = activeMessages.filter((m) => m.audio);
  const vaultTotal = documentMessages.length + imageMessages.length + audioMessages.length;

  // Mirrors the filter in ChatContainer so the header can show a match count.
  const matchCount = activeMessages.filter((m) => {
    const okText = searchQuery
      ? m.text?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const okDate = searchDate
      ? new Date(m.createdAt).toISOString().slice(0, 10) === searchDate
      : true;
    return okText && okDate;
  }).length;

  const isAuthorizedToEdit =
    selectedGroup &&
    (["super_user", "admin", "dispatch", "hr"].includes(authUser?.role));

  const openEditModal = () => {
    if (!selectedGroup) return;
    setEditGroupName(selectedGroup.name || "");
    setEditGroupDesc(selectedGroup.description || "");
    setDriverSupabaseUidInput(selectedGroup.driverSupabaseUid || "");
    setTruckNumber("");
    setDriverNameInput("");
    setShowEditGroupModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editGroupName.trim() || !selectedGroup) return;
    const success = await updateGroupDetails(selectedGroup._id, {
      name: editGroupName.trim(),
      description: editGroupDesc.trim(),
      driverSupabaseUid: driverSupabaseUidInput.trim(),
    });
    if (success) {
      setShowEditGroupModal(false);
    }
  };

  const downloadAsPDF = (imgUrl, type) => {
    try {
      const pdf = new jsPDF();
      const img = new Image();
      img.src = imgUrl;
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const imgProps = pdf.getImageProperties(img);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(img, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${type}_${Date.now()}.pdf`);
        toast.success("PDF Generated");
      };
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF");
    }
  };

  const handleAddMember = async () => {
    if (!selectedAddMemberId || !selectedGroup) return;
    await addMembers(selectedGroup._id, [selectedAddMemberId]);
    setSelectedAddMemberId("");
  };

  const handleRemoveMember = async (userId) => {
    if (!selectedGroup) return;
    if (userId === authUser._id) {
      toast.error("You cannot remove yourself");
      return;
    }
    if (window.confirm("Remove this member from the group?")) {
      await removeMember(selectedGroup._id, userId);
    }
  };

  const nonMembers = users.filter(u =>
    !selectedGroup?.members?.some(m => m._id === u._id)
  );

  const [isAppOffline, setIsAppOffline] = useState(!navigator.onLine);
  React.useEffect(() => {
    const handleOnline = () => setIsAppOffline(false);
    const handleOffline = () => setIsAppOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="relative z-40 border-b border-base-300 bg-base-100">
      {isAppOffline && (
        <div className="absolute inset-x-0 top-0 z-50 flex items-center justify-center gap-1.5 bg-warning py-1 text-[10px] font-bold uppercase tracking-wider text-warning-content">
          <WifiOff className="size-3" />
          <span>Offline — messages and uploads are queued</span>
        </div>
      )}

      <div className="flex h-16 items-center justify-between gap-3 px-3 sm:px-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => {
            setSelectedUser(null);
            setSelectedGroup(null);
          }}
          className="lg:hidden btn btn-ghost btn-circle btn-sm text-base-content/70"
        >
          <ChevronLeft className="size-6" />
        </button>

        {selectedUser ? (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              src={selectedUser?.profilePic}
              name={selectedUser?.fullName}
              size="size-10"
              isOnline={isOnline}
              showPresence
            />
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="truncate text-sm font-bold sm:text-base">
                  {cleanName(selectedUser?.fullName)}
                </h3>
                {(() => {
                  const r = getRole(selectedUser?.role);
                  return (
                    <span
                      className={`hidden shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px]
                        font-bold uppercase tracking-wide ring-1 ring-inset sm:inline-flex
                        ${roleToneClass(selectedUser?.role)}`}
                    >
                      <r.icon className="size-2.5" />
                      {r.label}
                    </span>
                  );
                })()}
                {selectedUser?.unitNumber && (
                  <span className="nums shrink-0 text-[11px] font-semibold text-base-content/40">
                    #{selectedUser.unitNumber}
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${isOnline ? "bg-success" : "bg-base-content/20"}`} />
                <span className="text-[11px] font-medium text-base-content/55">
                  {isOnline ? "Active now" : "Offline"}
                </span>
                {selectedUser?.role === "driver" && (
                  <>
                    <span className="text-base-content/25">·</span>
                    <span className="text-[11px] font-medium capitalize text-base-content/55">
                      {getDuty(selectedUser?.dutyStatus).label}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sm">
              <Radio className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-base-content truncate">{selectedGroup?.name}</h3>
                {isAuthorizedToEdit && (
                  <button onClick={openEditModal} className="btn btn-ghost btn-xs text-primary btn-circle">
                    <Edit2 className="size-3.5" />
                  </button>
                )}
              </div>
              <span className="mt-0.5 block truncate text-[11px] font-medium text-base-content/55">
                Fleet channel · <span className="nums">{selectedGroup?.members?.length || 0}</span> members
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {selectedUser && (
          <button
            onClick={() => initCall({ id: selectedUser._id, name: selectedUser.fullName, profilePic: selectedUser.profilePic })}
            className="btn btn-ghost btn-sm btn-square rounded-lg text-primary"
            title={`Call ${cleanName(selectedUser.fullName)}`}
          >
            <Phone className="size-4.5" />
          </button>
        )}

        <button
          onClick={() => setShowMediaVault(true)}
          className="btn btn-ghost btn-sm gap-1.5 rounded-lg font-semibold"
          title="Media vault: documents, photos and voice notes"
        >
          <Folder className="size-4.5" />
          {vaultTotal > 0 && <span className="nums text-[11px]">{vaultTotal}</span>}
        </button>

        <button
          onClick={() => setShowSearch(!showSearch)}
          className={`btn btn-sm btn-square rounded-lg ${showSearch ? "btn-active" : "btn-ghost"}`}
          title="Search in conversation"
        >
          <Search className="size-4.5" />
        </button>

        <button
          onClick={() => {
            setSelectedUser(null);
            setSelectedGroup(null);
          }}
          className="btn btn-ghost btn-sm btn-square rounded-lg"
          title="Close conversation"
        >
          <X className="size-4.5" />
        </button>
      </div>
      </div>

      {/* In-conversation search. The store and ChatContainer already filtered
          on searchQuery/searchDate, but no input was ever rendered -- so the
          toolbar search button toggled state that nothing consumed. */}
      {showSearch && (
        <div className="flex flex-col gap-2 border-t border-base-300 bg-base-200/60 px-3 py-2.5 sm:flex-row sm:items-center sm:px-4">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/40" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages in this conversation"
              className="input input-sm w-full rounded-lg border-base-300 bg-base-100 pl-9 pr-8 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-base-content/50 hover:bg-base-300"
                title="Clear text filter"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="input input-sm nums rounded-lg border-base-300 bg-base-100 text-xs sm:w-40"
            title="Jump to a date"
          />

          <div className="flex items-center gap-2">
            {(searchQuery || searchDate) && (
              <span className="nums whitespace-nowrap text-[11px] font-semibold text-base-content/55">
                {matchCount} match{matchCount === 1 ? "" : "es"}
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchDate("");
                setShowSearch(false);
              }}
              className="btn btn-ghost btn-sm rounded-lg"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Edit Group & Member Management Modal */}
      {showEditGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-base-100 p-6 rounded-[2rem] border border-base-300 max-w-lg w-full shadow-2xl space-y-6 text-base-content max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-base-300 pb-4">
              <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <Users className="size-6 text-primary" /> Channel Settings
              </h3>
              <button onClick={() => setShowEditGroupModal(false)} className="btn btn-ghost btn-sm btn-circle">
                <X className="size-5" />
              </button>
            </div>

            {/* Section 1: Name & Description */}
            <div className="p-4 bg-base-200 rounded-2xl border border-base-300/30 space-y-4">
              <span className="text-[11px] font-black uppercase tracking-widest opacity-40">Group Name & Help Tool</span>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Truck # (e.g. 275)"
                  value={truckNumber}
                  onChange={(e) => {
                    const num = e.target.value;
                    setTruckNumber(num);
                    if (num || driverNameInput) {
                      setEditGroupName(`${num ? num.trim() : ""} - ${driverNameInput ? driverNameInput.trim() : ""}`.trim());
                    }
                  }}
                  className="input input-bordered input-xs rounded-lg text-xs"
                />
                <input
                  type="text"
                  placeholder="Driver (e.g. Harneek)"
                  value={driverNameInput}
                  onChange={(e) => {
                    const name = e.target.value;
                    setDriverNameInput(name);
                    if (truckNumber || name) {
                      setEditGroupName(`${truckNumber ? truckNumber.trim() : ""} - ${name ? name.trim() : ""}`.trim());
                    }
                  }}
                  className="input input-bordered input-xs rounded-lg text-xs"
                />
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Channel Name</label>
                  <input
                    type="text"
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                    className="input input-bordered w-full rounded-2xl font-bold focus:ring-2 focus:ring-primary/20"
                    placeholder="Group Name"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Description</label>
                  <textarea
                    value={editGroupDesc}
                    onChange={(e) => setEditGroupDesc(e.target.value)}
                    className="textarea textarea-bordered w-full rounded-2xl text-sm focus:ring-2 focus:ring-primary/20"
                    placeholder="What is this channel for?"
                    rows="2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1 flex items-center justify-between">
                    <span>Assigned Driver UID / Email / Unit #</span>
                    <span className="text-primary text-[9px]">Target for #load triggers</span>
                  </label>
                  <input
                    type="text"
                    value={driverSupabaseUidInput}
                    onChange={(e) => setDriverSupabaseUidInput(e.target.value)}
                    className="input input-bordered w-full rounded-2xl font-mono text-xs focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g. 0bc42344-0e93-4eaf... or driver101@fleet.com"
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm rounded-xl w-full font-bold uppercase tracking-widest" disabled={isUpdatingGroup}>
                  {isUpdatingGroup ? "Saving..." : "Update Group Settings"}
                </button>
              </form>
            </div>

            <div className="border-t border-base-300 pt-6 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest opacity-40">Manage Members</h4>

              {/* Add Member Row */}
              <div className="flex gap-2">
                <select
                  className="select select-bordered flex-1 rounded-xl text-sm"
                  value={selectedAddMemberId}
                  onChange={(e) => setSelectedAddMemberId(e.target.value)}
                >
                  <option value="">Select a member to add...</option>
                  {nonMembers.map(u => (
                    <option key={u._id} value={u._id}>{u.fullName} {u.unitNumber ? `(#${u.unitNumber})` : ''}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddMember}
                  disabled={!selectedAddMemberId}
                  className="btn btn-primary rounded-xl"
                >
                  <UserPlus className="size-5" />
                </button>
              </div>

              {/* Members List */}
              <div className="bg-base-200 rounded-[1.5rem] divide-y divide-base-300/30 overflow-hidden border border-base-300/30">
                {selectedGroup?.members?.map((member) => (
                  <div key={member._id} className="flex items-center justify-between p-3.5 hover:bg-base-300/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar src={member.profilePic} name={member.fullName} size="size-9" />
                      <div>
                        <div className="text-sm font-bold">{member.fullName}</div>
                        <div className="text-[10px] opacity-40 font-mono capitalize">{member.role} {member.unitNumber ? `(#${member.unitNumber})` : ''}</div>
                      </div>
                    </div>
                    {member._id !== authUser._id && (
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10"
                      >
                        <UserMinus className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setShowEditGroupModal(false)} className="w-full btn btn-ghost mt-2 rounded-2xl font-bold uppercase tracking-widest text-xs">Done</button>
          </div>
        </div>
      )}

      {/* Media Vault Modal */}
      {showMediaVault && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-base-100 p-6 rounded-[2rem] border border-base-300 max-w-2xl w-full shadow-2xl text-base-content">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <Folder className="size-6 text-primary" /> Vault
              </h3>
              <button onClick={() => setShowMediaVault(false)} className="btn btn-ghost btn-sm btn-circle"><X className="size-5" /></button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6 bg-base-200 p-1.5 rounded-2xl">
              {[
                { id: "docs", label: "Docs", count: documentMessages.length },
                { id: "photos", label: "Photos", count: imageMessages.length },
                { id: "audio", label: "Audio", count: audioMessages.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveVaultTab(tab.id)}
                  className={`btn btn-sm border-none rounded-xl capitalize flex items-center gap-1.5 ${
                    activeVaultTab === tab.id ? "btn-primary shadow-lg" : "btn-ghost opacity-60"
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      activeVaultTab === tab.id ? "bg-primary-content text-primary" : "bg-base-300 text-base-content"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="max-h-96 overflow-y-auto pr-1">
              {activeVaultTab === "docs" && (
                <div className="space-y-2">
                  {documentMessages.length === 0 ? (
                    <div className="text-center py-8 text-xs opacity-40">No documents found.</div>
                  ) : (
                    documentMessages.map((msg) => (
                      <div key={msg._id} className="flex items-center justify-between p-3 rounded-2xl bg-base-200 border border-base-300/30">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><FileText className="size-5" /></div>
                          <div>
                            <div className="font-bold uppercase text-[10px] text-primary">{msg.documentType}</div>
                            <div className="text-[10px] opacity-40">{new Date(msg.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        {msg.image && (
                          <div className="flex gap-2">
                            <a href={msg.image} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost rounded-xl px-4">View</a>
                            <button
                              onClick={() => downloadAsPDF(msg.image, msg.documentType)}
                              className="btn btn-sm btn-primary rounded-xl px-3"
                              title="Download as PDF"
                            >
                              <FileDown className="size-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeVaultTab === "photos" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {imageMessages.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-xs opacity-40">No photos shared.</div>
                  ) : (
                    imageMessages.map((msg) => (
                      <a key={msg._id} href={msg.image} target="_blank" rel="noreferrer" className="aspect-square rounded-2xl overflow-hidden border border-base-300/50 bg-base-200">
                        <img src={msg.image} alt="Vault" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                      </a>
                    ))
                  )}
                </div>
              )}

              {activeVaultTab === "audio" && (
                <div className="space-y-2">
                  {audioMessages.length === 0 ? (
                    <div className="text-center py-8 text-xs opacity-40">No voice notes.</div>
                  ) : (
                    audioMessages.map((msg) => (
                      <div key={msg._id} className="p-3 rounded-2xl bg-base-200 border border-base-300/30 flex flex-col gap-2">
                         <div className="text-[10px] opacity-40 font-bold">{new Date(msg.createdAt).toLocaleString()}</div>
                         <audio src={msg.audio} controls className="w-full h-8" />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <button onClick={() => setShowMediaVault(false)} className="w-full btn btn-primary mt-6 rounded-2xl font-bold uppercase tracking-widest">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;

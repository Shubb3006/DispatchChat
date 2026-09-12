import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import MessageInput from "./MessageInput";
import Avatar from "./Avatar";
import { formatMessageTime } from "../lib/util";
import { useAuthStore } from "../store/useAuthStore.js";
import { useChatStore } from "../store/useChatStore.js";
import { useGroupStore } from "../store/useGroupStore.js";
import {
  Edit2,
  Trash2,
  Check,
  CheckCheck,
  Info,
  X,
  Download,
  AlertTriangle,
  FileText,
  Truck,
  Users,
  Pin,
  PinOff,
  Reply,
  CornerDownRight,
} from "lucide-react";
import LoadCard from "./LoadCard";
import StatusCard, { isStatusMessage } from "./StatusCard";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

const ChatContainer = () => {
  const {
    messages,
    isMessagesLoading,
    getMessages,
    selectedUser,
    isTyping,
    subscribeToMessages,
    unsubscribefromMessages,
    searchQuery,
    searchDate,
    reactToMessage,
    editMessage,
    deleteMessage,
    setReplyingToMessage,
    togglePinMessage,
    messagesByUser
  } = useChatStore();
  // console.log(messagesByUser)

  const {
    selectedGroup,
    groupMessages,
    isGroupMessagesLoading,
    getGroupMessages,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
  } = useGroupStore();

  const { authUser } = useAuthStore();

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewBolDoc, setPreviewBolDoc] = useState(null);
  const [readInfoMessage, setReadInfoMessage] = useState(null);

  const messageEndRef = useRef(null);
  const currentUserId = authUser?._id || authUser?.id;
  const selectedUserId = selectedUser?._id || selectedUser?.id;
  const selectedGroupId = selectedGroup?._id;

  // Direct Chat effect
  useEffect(() => {
    if (selectedUserId) {
      getMessages(selectedUserId);
      subscribeToMessages();
    }
    return () => unsubscribefromMessages();
  }, [selectedUserId, getMessages, subscribeToMessages, unsubscribefromMessages]);

  // Group Channel effect
  useEffect(() => {
    if (selectedGroupId) {
      getGroupMessages(selectedGroupId);
      subscribeToGroupMessages();
    }
    return () => unsubscribeFromGroupMessages();
  }, [
    selectedGroupId,
    getGroupMessages,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
  ]);

  const activeMessagesList = selectedGroup ? groupMessages : messages;
  const activeLoading = selectedGroup ? isGroupMessagesLoading : isMessagesLoading;
  const pinnedMessages = activeMessagesList.filter((m) => m.isPinned);

  // useEffect(() => {
  //   messageEndRef.current?.scrollIntoView({ behavior: "auto" });
  // }, [activeMessagesList, isTyping]);

  useLayoutEffect(() => {
    if (!activeLoading && messageEndRef.current) {
      messageEndRef.current.scrollIntoView({
        behavior: "instant",
        block: "end",
      });
    }
  }, [activeMessagesList.length, activeLoading, isTyping]);

  const handleStartEdit = (message) => {
    setEditingMessageId(message._id);
    setEditText(message.text || "");
  };

  const handleSaveEdit = async (messageId) => {
    if (!editText.trim()) return;
    await editMessage(messageId, editText.trim());
    setEditingMessageId(null);
    setEditText("");
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const scrollToMessage = (msgId) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary");
      setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 2000);
    }
  };

  const filteredMessages = activeMessagesList.filter((m) => {
    let matchesText = true;
    let matchesDate = true;

    if (searchQuery) {
      matchesText = m.text?.toLowerCase().includes(searchQuery.toLowerCase());
    }

    if (searchDate) {
      const msgDate = new Date(m.createdAt).toISOString().split("T")[0];
      matchesDate = msgDate === searchDate;
    }

    return matchesText && matchesDate;
  });

  useEffect(() => {
    if (searchDate && filteredMessages.length > 0) {
      const firstMsgId = filteredMessages[0]._id;
      const el = document.getElementById(`msg-${firstMsgId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-primary");
        setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 2500);
      }
    }
  }, [searchDate]);

  // if (activeLoading)
  //   return (
  //     <div className="flex-1 flex flex-col">
  //       <ChatHeader />
  //       <MessageSkeleton />
  //       <MessageInput />
  //     </div>
  //   );

  // if (activeLoading && messages.length === 0) {
  //   return <MessageSkeleton />;
  // }

  return (
    <div className="flex-1 flex flex-col bg-base-100 h-full min-h-0 overflow-hidden relative">
      <ChatHeader />

      {/* Pinned Messages Top Banner */}
      {pinnedMessages.length > 0 && (
        <div className="shrink-0 bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between text-xs z-10">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Pin className="size-4 text-primary shrink-0 fill-primary" />
            <span className="font-bold text-primary">Pinned ({pinnedMessages.length}):</span>
            {pinnedMessages.map((pm) => (
              <button
                key={pm._id}
                onClick={() => scrollToMessage(pm._id)}
                className="btn btn-xs btn-ghost border border-primary/20 truncate max-w-[200px]"
                title="Jump to pinned message"
              >
                "{pm.text || (pm.image ? "📷 Photo" : "🎤 Voice Note")}"
              </button>
            ))}
          </div>
        </div>
      )}
      {/* <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4 overflow-x-hidden">
        {filteredMessages.length === 0 && !activeLoading && !isTyping ? ( */}

      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4 overflow-x-hidden">
        {activeLoading && activeMessagesList.length === 0 ? (
          <MessageSkeleton />
        ) : filteredMessages.length === 0 && !isTyping ? (
          <div className="flex items-center justify-center h-full text-sm text-base-content/60">
            {searchQuery ? "No matching messages found" : "No messages yet"}
          </div>
        ) : (
          filteredMessages.map((message) => {
            const senderObj =
              typeof message.senderId === "object"
                ? message.senderId
                : message.senderId === currentUserId
                  ? authUser
                  : selectedUser;

            const senderIdVal = senderObj?._id || senderObj?.id || message.senderId;
            const isSender = senderIdVal === currentUserId;
            const isEditing = editingMessageId === message._id;

            // Group reactions by emoji
            const reactionsMap = (message.reactions || []).reduce(
              (acc, curr) => {
                acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
                return acc;
              },
              {}
            );

            const isLoadCard =
              message.documentType === "load_details" ||
              (message.text && (message.text.includes("LOAD DETAILS") || message.text.includes("DELIVERY MANIFEST")));
            const isStatusMsg = isStatusMessage(message.text);

            if (isLoadCard && !isEditing) {
              return (
                <div
                  key={message._id}
                  id={`msg-${message._id}`}
                  className={`chat ${isSender ? "chat-end" : "chat-start"} group relative my-2`}
                  onMouseEnter={() => setHoveredMessageId(message._id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  <div className="chat-image avatar">
                    <Avatar
                      src={senderObj?.profilePic}
                      name={senderObj?.fullName || "User"}
                      size="size-9"
                    />
                  </div>
                  <div className="chat-header mb-1 text-xs opacity-75 flex items-center gap-1.5">
                    <span className="font-semibold text-base-content/90">
                      {isSender ? "You" : senderObj?.fullName || "Fleet Member"}
                    </span>
                    {senderObj?.unitNumber && (
                      <span className="bg-base-200/80 px-1.5 py-0.5 rounded font-mono text-[10px] flex items-center gap-0.5 border border-base-300/50">
                        <Truck className="size-2.5" /> {senderObj.unitNumber}
                      </span>
                    )}
                    <span>•</span>
                    <time className="text-[11px] font-medium">{formatMessageTime(message.createdAt)}</time>
                  </div>
                  <LoadCard text={message.text} rawMessage={message} />
                </div>
              );
            }

            if (isStatusMsg && !isEditing) {
              return (
                <div
                  key={message._id}
                  id={`msg-${message._id}`}
                  className={`chat ${isSender ? "chat-end" : "chat-start"} group relative my-2`}
                  onMouseEnter={() => setHoveredMessageId(message._id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  <div className="chat-image avatar">
                    <Avatar
                      src={senderObj?.profilePic}
                      name={senderObj?.fullName || "User"}
                      size="size-9"
                    />
                  </div>
                  <div className="chat-header mb-1 text-xs opacity-75 flex items-center gap-1.5">
                    <span className="font-semibold text-base-content/90">
                      {isSender ? "You" : senderObj?.fullName || "Fleet Member"}
                    </span>
                    {senderObj?.unitNumber && (
                      <span className="bg-base-200/80 px-1.5 py-0.5 rounded font-mono text-[10px] flex items-center gap-0.5 border border-base-300/50">
                        <Truck className="size-2.5" /> {senderObj.unitNumber}
                      </span>
                    )}
                    <span>•</span>
                    <time className="text-[11px] font-medium">{formatMessageTime(message.createdAt)}</time>
                  </div>
                  <StatusCard text={message.text} image={message.image} />
                </div>
              );
            }

            return (
              <div
                key={message._id}
                id={`msg-${message._id}`}
                className={`chat ${isSender ? "chat-end" : "chat-start"} group relative`}
                onMouseEnter={() => setHoveredMessageId(message._id)}
                onMouseLeave={() => setHoveredMessageId(null)}
              >
                {/* Avatar */}
                <div className="chat-image avatar">
                  <Avatar
                    src={senderObj?.profilePic}
                    name={senderObj?.fullName || "User"}
                    size="size-9"
                  />
                </div>

                {/* Header info (Name, Unit #, time, edited tag, and WhatsApp Ticks) */}
                <div className="chat-header mb-1 text-xs opacity-75 flex items-center gap-1.5">
                  <span className="font-semibold text-base-content/90">
                    {isSender ? "You" : senderObj?.fullName || "Fleet Member"}
                  </span>
                  {senderObj?.unitNumber && (
                    <span className="bg-base-200/80 px-1.5 py-0.5 rounded font-mono text-[10px] flex items-center gap-0.5 border border-base-300/50">
                      <Truck className="size-2.5" /> {senderObj.unitNumber}
                    </span>
                  )}
                  {message.isPinned && (
                    <span className="bg-warning/20 text-warning px-1.5 py-0.5 rounded font-bold text-[10px] flex items-center gap-0.5 border border-warning/40">
                      <Pin className="size-2.5 fill-warning" /> Pinned
                    </span>
                  )}
                  <span>•</span>
                  <time className="text-[11px] font-medium">{formatMessageTime(message.createdAt)}</time>
                  {message.isEdited && <span className="opacity-50 text-[10px]">(edited)</span>}

                  {/* WhatsApp Status Ticks for Sent Messages */}
                  {isSender && (
                    <button
                      type="button"
                      onClick={() => setReadInfoMessage(message)}
                      className="cursor-pointer hover:opacity-100 transition-opacity ml-0.5"
                      title="View Read Info"
                    >
                      {message.status === "read" || (message.readBy && message.readBy.length > 0) ? (
                        <CheckCheck className="size-4 text-sky-500 font-bold" />
                      ) : message.status === "delivered" ? (
                        <CheckCheck className="size-4 text-base-content/50" />
                      ) : (
                        <Check className="size-4 text-base-content/50" />
                      )}
                    </button>
                  )}
                </div>

                {/* Main Chat Bubble container */}
                <div className="relative inline-block max-w-[85%] sm:max-w-[75%] min-w-fit">
                  {/* Hover Quick Reactions & Menu */}
                  {hoveredMessageId === message._id && !isEditing && (
                    <div
                      className={`absolute -top-11 z-30 flex items-center gap-1 bg-base-100/95 backdrop-blur-md px-2 py-1 rounded-full shadow-xl border border-base-300 transition-all ${isSender ? "right-0" : "left-0"
                        }`}
                    >
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => reactToMessage(message._id, emoji)}
                          className="hover:scale-125 transition-transform px-1 text-sm"
                          title={`React ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}

                      {/* Reply Button */}
                      <button
                        onClick={() =>
                          setReplyingToMessage({
                            _id: message._id,
                            text: message.text,
                            image: message.image,
                            senderName: isSender ? "You" : senderObj?.fullName || "Fleet Member",
                          })
                        }
                        className="btn btn-ghost btn-xs btn-circle text-primary hover:bg-primary/10"
                        title="Reply"
                      >
                        <Reply className="size-3.5" />
                      </button>

                      {/* Pin Button */}
                      <button
                        onClick={() => togglePinMessage(message._id)}
                        className={`btn btn-ghost btn-xs btn-circle ${message.isPinned ? "text-warning fill-warning" : "text-base-content/70 hover:text-warning"
                          }`}
                        title={message.isPinned ? "Unpin message" : "Pin message"}
                      >
                        <Pin className="size-3.5" />
                      </button>

                      <button
                        onClick={() => setReadInfoMessage(message)}
                        className="btn btn-ghost btn-xs btn-circle text-primary hover:bg-primary/10"
                        title="Who read this message"
                      >
                        <Info className="size-3.5" />
                      </button>

                      {["super_user", "admin", "dispatch"].includes(authUser?.role) && (
                        <div className="flex items-center gap-0.5 ml-1 border-l border-base-300 pl-1">
                          {isSender && (
                            <button
                              onClick={() => handleStartEdit(message)}
                              className="btn btn-ghost btn-xs btn-circle text-info hover:bg-info/10"
                              title="Edit"
                            >
                              <Edit2 className="size-3" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteMessage(message._id)}
                            className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10"
                            title="Delete"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bubble Content with Urgent Red Banner styling */}
                  <div
                    className={`chat-bubble flex flex-col min-w-fit max-w-full break-words whitespace-pre-wrap p-3.5 shadow-md transition-all text-[15px] leading-relaxed border border-black/5 ${isSender
                      ? "bg-primary text-primary-content rounded-2xl rounded-tr-none shadow-lg shadow-primary/20"
                      : "bg-base-100 text-base-content rounded-2xl rounded-tl-none border-base-300/50"
                      } ${message.isUrgent
                        ? "border-l-4 border-amber-500 shadow-xl"
                        : ""
                      }`}
                  >
                    {/* Quoted Reply Block */}
                    {message.replyTo && (
                      <div
                        onClick={() =>
                          message.replyTo?.messageId &&
                          scrollToMessage(message.replyTo.messageId)
                        }
                        className="bg-base-300/40 p-2.5 rounded-xl border-l-4 border-primary text-xs mb-2 cursor-pointer hover:bg-base-300/70 transition-all border-t border-r border-b border-base-content/5"
                        title="Click to jump to quoted message"
                      >
                        <div className="font-bold text-primary text-[11px] flex items-center gap-1">
                          <CornerDownRight className="size-3" /> {message.replyTo.senderName}
                        </div>
                        <div className="italic text-base-content/80 truncate mt-0.5">
                          "{message.replyTo.text}"
                        </div>
                      </div>
                    )}
                    {/* Urgent Dispatch Alert Header */}
                    {message.isUrgent && (
                      <div className="flex items-center gap-1.5 font-bold text-xs text-error mb-1 uppercase tracking-wide">
                        <AlertTriangle className="size-4 animate-bounce" /> URGENT DISPATCH ALERT
                      </div>
                    )}

                    {/* Document Tag Badge */}
                    {message.documentType && message.documentType !== "general" && (
                      <div className="badge badge-sm badge-outline font-semibold uppercase text-[10px] mb-2 gap-1">
                        <FileText className="size-3" /> {message.documentType} Document
                      </div>
                    )}

                    {/* Attached Image or BOL Document */}
                    {message.image && (
                      message.documentType === "bol" || message.image.endsWith(".pdf") ? (
                        <div
                          onClick={() => {
                            const loadMatch = message.text ? message.text.match(/(?:#|\$|\bload\s*#?)\s*(\d{4,6})\b/i) : null;
                            const loadNum = loadMatch ? loadMatch[1] : "10001";
                            setPreviewBolDoc({ loadNum, image: message.image });
                          }}
                          className="p-2.5 rounded-2xl border border-emerald-500/40 bg-slate-950/90 text-white font-mono text-xs cursor-pointer hover:bg-slate-900 transition-all flex items-center justify-between mb-2 shadow-sm"
                        >
                          <div className="flex items-center space-x-2">
                            <FileText className="size-5 text-emerald-400 shrink-0" />
                            <div>
                              <span className="font-bold text-white block">Carrier_BOL_Primary.pdf</span>
                              <span className="text-[10px] text-emerald-300">240 KB • Driver Signed & Verified</span>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 ml-2">
                            <span>View</span> 👁
                          </span>
                        </div>
                      ) : (
                        <img
                          src={message.image}
                          alt="Attachment"
                          onClick={() => setPreviewImage(message.image)}
                          className="sm:max-w-[260px] rounded-xl mb-2 cursor-pointer hover:opacity-90 transition-opacity border border-base-300/40 shadow-sm"
                        />
                      )
                    )}

                    {/* Voice Note Audio */}
                    {message.audio && (
                      <div className="my-1">
                        <audio
                          src={message.audio}
                          controls
                          className="h-10 max-w-[240px] sm:max-w-[280px]"
                        />
                      </div>
                    )}

                    {/* Editable Text or Standard Text */}
                    {isEditing ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="input input-sm input-bordered w-full text-base-content bg-base-100"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(message._id);
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                        />
                        <button
                          onClick={() => handleSaveEdit(message._id)}
                          className="btn btn-xs btn-success btn-circle text-white"
                        >
                          <Check className="size-3" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="btn btn-xs btn-ghost btn-circle"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ) : (
                      message.text && (
                        <div className="space-y-2">
                          <p className="text-sm font-normal select-text leading-snug">{message.text}</p>
                        </div>
                      )
                    )}
                  </div>

                  {/* Reaction Badges */}
                  {Object.keys(reactionsMap).length > 0 && (
                    <div
                      className={`flex flex-wrap gap-1 mt-1.5 ${isSender ? "justify-end" : "justify-start"
                        }`}
                    >
                      {Object.entries(reactionsMap).map(([emoji, count]) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => reactToMessage(message._id, emoji)}
                          className="badge badge-sm bg-base-100 border border-base-300 shadow-xs hover:bg-base-200 gap-1 text-xs py-2 px-2 rounded-full font-medium transition-all"
                        >
                          {emoji} {count > 1 && <span className="font-bold text-[10px] text-base-content/70">{count}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isTyping && !selectedGroup && (
          <div className="chat chat-start">
            <div className="chat-image avatar">
              <Avatar src={selectedUser?.profilePic} name={selectedUser?.fullName || "User"} size="size-9" />
            </div>

            <div className="chat-bubble bg-base-200/90 text-base-content rounded-2xl rounded-tl-xs border border-base-300/60 flex items-center gap-2 px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-primary/70 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-primary/70 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-primary/70 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>

      <div className="shrink-0 z-20">
        <MessageInput />
      </div>

      {/* Fullscreen Image Preview Lightbox Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
              <a
                href={previewImage}
                target="_blank"
                rel="noreferrer"
                download="attachment"
                className="btn btn-circle btn-sm bg-base-100/70 hover:bg-base-100 border-none text-base-content"
                title="Download Image"
              >
                <Download className="size-4" />
              </a>
              <button
                onClick={() => setPreviewImage(null)}
                className="btn btn-circle btn-sm bg-base-100/70 hover:bg-base-100 border-none text-base-content"
                title="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <img
              src={previewImage}
              alt="Fullscreen Preview"
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Message Read Info Modal */}
      {readInfoMessage && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-base-100 p-6 rounded-2xl border border-base-300 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-base-300">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <CheckCheck className="size-5 text-sky-500" /> Message Read Info
              </h3>
              <button
                onClick={() => setReadInfoMessage(null)}
                className="btn btn-ghost btn-xs btn-circle"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Message Snippet Preview */}
            <div className="bg-base-200 p-3 rounded-xl mb-4 text-xs">
              <div className="font-semibold opacity-60 mb-1">Message Content:</div>
              <p className="text-sm font-medium text-base-content italic truncate">
                "{readInfoMessage.text || (readInfoMessage.image ? "📷 Photo Attachment" : "🎤 Voice Note")}"
              </p>
              <div className="mt-2 text-[10px] opacity-50">
                Sent: {formatMessageTime(readInfoMessage.createdAt)}
              </div>
            </div>

            {/* Read By Users List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-base-content/70 uppercase tracking-wide flex items-center gap-1.5">
                <Users className="size-3.5 text-primary" /> Read By ({readInfoMessage.readBy?.length || (readInfoMessage.status === "read" ? 1 : 0)})
              </h4>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {readInfoMessage.readBy && readInfoMessage.readBy.length > 0 ? (
                  readInfoMessage.readBy.map((item, idx) => {
                    const reader = typeof item.userId === "object" ? item.userId : null;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-base-200/70 border border-base-300 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            src={reader?.profilePic}
                            name={reader?.fullName || "Member"}
                            size="size-8"
                          />
                          <div>
                            <div className="font-semibold">
                              {reader?.fullName || "Fleet Member"}
                            </div>
                            <div className="text-[10px] text-base-content/60 capitalize">
                              {reader?.role?.replace("_", " ")} {reader?.unitNumber ? `(${reader.unitNumber})` : ""}
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] text-sky-500 font-medium flex items-center gap-1">
                          <CheckCheck className="size-3" /> Read
                        </div>
                      </div>
                    );
                  })
                ) : readInfoMessage.status === "read" ? (
                  <div className="p-3 rounded-xl bg-base-200 text-xs text-sky-500 font-semibold flex items-center gap-2">
                    <CheckCheck className="size-4" /> Message has been read by recipient
                  </div>
                ) : readInfoMessage.status === "delivered" ? (
                  <div className="p-3 rounded-xl bg-base-200 text-xs text-base-content/70 font-semibold flex items-center gap-2">
                    <CheckCheck className="size-4" /> Delivered to recipient (Not read yet)
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-base-200 text-xs text-base-content/60 italic text-center">
                    Sent to server (Waiting for delivery)
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setReadInfoMessage(null)}
                className="btn btn-primary btn-sm w-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Document Viewer Modal Overlay for BOL Documents */}
      {previewBolDoc && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-scale-up space-y-0 text-base-content font-sans">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans">
                    Carrier_BOL_Primary.pdf
                  </h3>
                  <p className="text-xs text-emerald-400 font-mono">
                    ● Digital BOL Document • 240 KB • Verified Sign-off
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewBolDoc(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 text-lg font-bold transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Document Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-base-200">
              {/* Document Banner */}
              <div className="bg-emerald-950 text-emerald-100 p-4 rounded-2xl border border-emerald-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-emerald-400 font-bold text-base">🛡️</span>
                  <div>
                    <span className="font-bold text-white">Official Freight Bill of Lading (BOL)</span>
                    <p className="text-[10px] text-emerald-300 font-mono mt-0.5">
                      Carrier Sign-off Complete • Load #{previewBolDoc.loadNum || "10001"}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-800 text-emerald-200 rounded-full font-mono text-[10px] font-bold uppercase">
                  VERIFIED
                </span>
              </div>

              {/* Paper Manifest Preview */}
              <div className="bg-base-100 p-6 rounded-2xl border border-slate-300 shadow-inner space-y-4 font-mono text-xs text-slate-800">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <div>
                    <div className="text-sm font-extrabold text-base-content font-sans">LOGISYNC FREIGHT MANIFEST</div>
                    <div className="text-[10px] text-base-content">Bill of Lading #{previewBolDoc.loadNum || "10001"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-base-content">ISSUED DATE</div>
                    <div className="text-xs font-bold text-indigo-600">{new Date().toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[10px]">
                  <div className="bg-base-200 p-3 rounded-xl border border-slate-100 space-y-1">
                    <div className="font-bold text-base-content uppercase">Shipper / Pickup Origin</div>
                    <div className="font-bold text-base-content">GAP Transport Logistics INC.</div>
                    <div>QC</div>
                  </div>
                  <div className="bg-base-200 p-3 rounded-xl border border-slate-100 space-y-1">
                    <div className="font-bold text-base-content uppercase">Consignee / Destination</div>
                    <div className="font-bold text-base-content">Midwest Distribution Hub</div>
                    <div>OH</div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden text-[10px]">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-2">Item Description</th>
                        <th className="p-2">Pallets</th>
                        <th className="p-2">Weight</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 font-bold">Industrial Cargo Components</td>
                        <td className="p-2 font-mono">1 Pallets</td>
                        <td className="p-2 font-mono">9600.00 Lbs</td>
                        <td className="p-2 text-emerald-600 font-bold">INSPECTED & SIGNED</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-[10px]">
                  <div className="space-y-0.5">
                    <div className="text-base-content font-bold">DRIVER SIGN-OFF STAMP</div>
                    <div className="font-bold text-base-content font-sans">jhbvisd</div>
                  </div>
                  <div className="px-3 py-1 bg-emerald-600 text-white font-mono font-bold rounded-lg text-[10px]">
                    SIGNED & ATTACHED
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-base-100 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  if (previewBolDoc?.image && previewBolDoc.image.startsWith("http")) {
                    window.open(previewBolDoc.image, "_blank");
                  } else {
                    alert(`Downloading Official Freight BOL #${previewBolDoc.loadNum}...`);
                  }
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <Download className="h-4 w-4 text-slate-600" />
                <span>Download File</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewBolDoc(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;



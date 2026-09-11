import React, { useState, useRef, useEffect } from "react";
import {
  Image,
  Loader,
  Send,
  X,
  Smile,
  Mic,
  MicOff,
  Trash2,
  AlertTriangle,
  FileText,
  Lock,
  Camera,
} from "lucide-react";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import EmojiPicker from "emoji-picker-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { useLanguageStore } from "../store/useLanguageStore";
import { Reply, CornerDownRight } from "lucide-react";

const MessageInput = () => {
  const { t } = useLanguageStore();
  const { authUser, socket } = useAuthStore();
  const {
    sendMessage,
    isMessageSending,
    selectedUser,
    replyingToMessage,
    setReplyingToMessage,
  } = useChatStore();
  const { selectedGroup, sendGroupMessage } = useGroupStore();

  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [documentType, setDocumentType] = useState("general");

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);

  const fileRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const isReadOnly = authUser?.role === "office_staff";

  // Clipboard Paste listener for screenshots & copied images
  useEffect(() => {
    const handleWindowPaste = (e) => {
      if (isReadOnly) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;

          const reader = new FileReader();
          reader.onload = () => {
            setImagePreview(reader.result);
            toast.success("📋 Screenshot / Image pasted from clipboard!");
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    };

    window.addEventListener("paste", handleWindowPaste);
    return () => window.removeEventListener("paste", handleWindowPaste);
  }, [isReadOnly]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isReadOnly) return;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setImagePreview(reader.result);
          toast.success("🖼️ Image dropped into chat!");
        };
        reader.readAsDataURL(file);
      } else {
        toast.error("Please drop an image file");
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const handleTyping = () => {
    const senderId = authUser?._id || authUser?.id;
    const receiverId = selectedUser?._id || selectedUser?.id;
    if (!socket || !senderId || !receiverId) return;

    socket.emit("typing", {
      senderId,
      receiverId,
      isTyping: true,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        senderId,
        receiverId,
        isTyping: false,
      });
    }, 1500);
  };

  const startRecording = async () => {
    if (isReadOnly) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      toast.error("Microphone permission denied or not available");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setAudioBlob(null);
    setRecordingTime(0);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const onEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  async function handleSendMessage(e) {
    e.preventDefault();
    if (isReadOnly) {
      toast.error("Office Staff have read-only access and cannot send messages.");
      return;
    }

    if (!text.trim() && !imagePreview && !audioBlob) return;

    try {
      let audioBase64 = null;
      if (audioBlob) {
        audioBase64 = await blobToBase64(audioBlob);
      }

      const payload = {
        text: text.trim(),
        image: imagePreview,
        audio: audioBase64,
        documentType,
        isUrgent,
        replyTo: replyingToMessage
          ? {
            messageId: replyingToMessage._id,
            text: replyingToMessage.text || (replyingToMessage.image ? "📷 Photo" : "🎤 Voice Note"),
            senderName: replyingToMessage.senderName,
          }
          : null,
      };

      if (selectedGroup) {
        await sendGroupMessage(selectedGroup._id, payload);
      } else if (selectedUser) {
        await sendMessage(payload);
      }

      setText("");
      setImagePreview(null);
      setAudioBlob(null);
      setIsUrgent(false);
      setDocumentType("general");
      setShowEmojiPicker(false);
      setReplyingToMessage(null);

      const senderId = authUser?._id || authUser?.id;
      const receiverId = selectedUser?._id || selectedUser?.id;
      if (socket && senderId && receiverId) {
        socket.emit("typing", {
          senderId,
          receiverId,
          isTyping: false,
        });
      }
    } catch (error) {
      console.log("Failed to send message:", error);
    }
  }

  const handleImageChange = (e) => {
    if (isReadOnly) return;
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const takePhoto = async () => {
    if (isReadOnly) return;
    try {
      const image = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      setImagePreview(image.dataUrl);
    } catch (error) {
      console.log("Camera error:", error);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Render Read-Only banner for Office Staff
  if (isReadOnly) {
    return (
      <div className="p-3 w-full border-t border-base-300 bg-base-200 text-center">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-base-content/70">
          <Lock className="size-4 text-warning" /> Office Staff Access Mode: Read-Only (Messaging disabled)
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="p-3 w-full border-t border-base-300 relative bg-base-100 transition-colors"
    >
      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-20 left-4 z-50 shadow-2xl rounded-2xl overflow-hidden"
        >
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            theme="auto"
            searchDisabled={false}
            width={320}
            height={400}
          />
        </div>
      )}

      {/* Replying Preview Banner */}
      {replyingToMessage && (
        <div className="mb-2 flex items-center justify-between bg-primary/10 border-l-4 border-primary p-2.5 rounded-r-xl text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <CornerDownRight className="size-4 text-primary shrink-0" />
            <div className="truncate">
              <span className="font-bold text-primary">
                Replying to {replyingToMessage.senderName}:
              </span>{" "}
              <span className="opacity-80 italic">
                "{replyingToMessage.text || (replyingToMessage.image ? "📷 Photo Attachment" : "🎤 Voice Note")}"
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReplyingToMessage(null)}
            className="btn btn-ghost btn-xs btn-circle text-base-content/70 hover:text-error ml-2"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Attachments / Urgent Badges Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {/* Attached Image Preview */}
        {imagePreview && (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="size-16 object-cover rounded-lg border border-base-300"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-base-300 flex items-center justify-center text-base-content"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        )}

        {/* Document Type Selector (if image present) */}
        {imagePreview && (
          <div className="flex items-center gap-1 text-xs">
            <FileText className="size-3.5 text-base-content/60" />
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="select select-xs select-bordered text-xs"
            >
              <option value="general">Photo</option>
              <option value="bol">Bill of Lading (BOL)</option>
              <option value="pod">Proof of Delivery (POD)</option>
              <option value="receipt">Fuel Receipt</option>
            </select>
          </div>
        )}

        {/* Urgent Alert Toggle (for Dispatchers/Admins/Super User) */}
        {["super_user", "admin", "dispatch"].includes(authUser?.role) && (
          <label className="cursor-pointer flex items-center gap-1 text-xs ml-auto">
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="checkbox checkbox-xs checkbox-error"
            />
            <span className={`font-semibold ${isUrgent ? "text-error" : "text-base-content/60"}`}>
              🚨 Urgent Dispatch Alert
            </span>
          </label>
        )}
      </div>

      {/* Audio Recording Preview */}
      {audioBlob && (
        <div className="mb-2 flex items-center justify-between bg-base-200 p-2.5 rounded-lg border border-base-300">
          <div className="flex items-center gap-3">
            <span className="size-3 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-sm font-medium">Voice Note Ready</span>
            <audio
              src={URL.createObjectURL(audioBlob)}
              controls
              className="h-8 max-w-[200px]"
            />
          </div>
          <button
            onClick={() => setAudioBlob(null)}
            className="btn btn-ghost btn-xs btn-circle text-error"
            title="Discard Recording"
            type="button"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      )}

      {/* Live Recording UI */}
      {isRecording ? (
        <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 p-3 rounded-xl animate-pulse">
          <div className="flex items-center gap-3">
            <div className="size-3 rounded-full bg-red-500 animate-ping"></div>
            <span className="text-sm font-semibold text-red-500">
              Recording Voice Note ({formatTime(recordingTime)})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="btn btn-sm btn-ghost text-error"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="btn btn-sm btn-error text-white gap-1"
            >
              <MicOff className="size-4" /> Stop
            </button>
          </div>
        </div>
      ) : (
        <form className="flex items-center gap-2" onSubmit={handleSendMessage}>
          <div className="flex-1 flex items-center gap-2 bg-base-200/80 hover:bg-base-200 rounded-2xl px-3 border border-base-300/80 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-xs">
            {/* Emoji Toggle Button */}
            <button
              type="button"
              className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-primary"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
            >
              <Smile className="size-5" />
            </button>

            {/* Message Input Field */}
            <input
              type="text"
              className="w-full bg-transparent py-2.5 text-sm"
              placeholder={
                selectedGroup
                  ? `${t("messageChannel")} #${selectedGroup.name}...`
                  : `${t("typeMessage")} (Ctrl+V to paste screenshot)...`
              }
              title="Type a message or press Ctrl+V to paste a screenshot/image"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                handleTyping();
              }}
            />

            {/* Hidden File Input */}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileRef}
              onChange={handleImageChange}
            />

            {/* Image Upload Button */}
            <button
              type="button"
              className={`btn btn-ghost btn-circle btn-sm ${imagePreview ? "text-primary" : "text-base-content/70"
                }`}
              onClick={() => fileRef.current?.click()}
              title="Attach Image"
            >
              <Image className="size-5" />
            </button>

            {/* Camera Button */}
            <button
              type="button"
              className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-primary"
              onClick={takePhoto}
              title="Take Photo"
            >
              <Camera className="size-5" />
            </button>

            {/* Voice Mic Button */}
            <button
              type="button"
              className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-error"
              onClick={startRecording}
              title="Record Voice Note"
            >
              <Mic className="size-5" />
            </button>
          </div>

          {/* Send Button */}
          {!isMessageSending ? (
            <button
              type="submit"
              className="btn btn-primary btn-circle btn-sm"
              disabled={
                (!text.trim() && !imagePreview && !audioBlob) ||
                isMessageSending
              }
            >
              <Send className="size-4" />
            </button>
          ) : (
            <div className="btn btn-circle btn-sm btn-ghost">
              <Loader className="size-5 animate-spin" />
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default MessageInput;



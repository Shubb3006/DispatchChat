import React, { useState } from "react";
import { Radio, X, Send, Truck, Building2, Globe, AlertTriangle, Image as ImageIcon, CheckCircle } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

const BroadcastModal = ({ isOpen, onClose }) => {
  const { sendBroadcastAnnouncement } = useChatStore();

  const [targetAudience, setTargetAudience] = useState("drivers"); // "drivers" | "office" | "all"
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSending(true);
    const success = await sendBroadcastAnnouncement({
      targetAudience,
      title: title.trim(),
      text: text.trim(),
      isUrgent,
      image: imagePreview,
    });

    setIsSending(false);
    if (success) {
      setTitle("");
      setText("");
      setIsUrgent(false);
      setImagePreview(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-base-100 p-6 rounded-3xl border border-base-300 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-base-300 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Radio className="size-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Fleet Broadcast Announcement</h3>
              <p className="text-xs text-base-content/60">Send mass notification to Drivers or Office Staff</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-xs btn-circle">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Audience Selector */}
          <div>
            <label className="label text-xs font-bold uppercase tracking-wider text-base-content/70">
              Target Audience
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetAudience("drivers")}
                className={`p-3 rounded-2xl border text-xs flex flex-col items-center gap-1.5 transition-all ${
                  targetAudience === "drivers"
                    ? "bg-primary/10 border-primary text-primary font-bold shadow-sm"
                    : "bg-base-200 border-base-300 text-base-content/70 hover:bg-base-300"
                }`}
              >
                <Truck className="size-5" />
                <span>🚛 All Drivers</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience("office")}
                className={`p-3 rounded-2xl border text-xs flex flex-col items-center gap-1.5 transition-all ${
                  targetAudience === "office"
                    ? "bg-sky-500/10 border-sky-500 text-sky-600 font-bold shadow-sm"
                    : "bg-base-200 border-base-300 text-base-content/70 hover:bg-base-300"
                }`}
              >
                <Building2 className="size-5" />
                <span>🏢 Office Staff</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience("all")}
                className={`p-3 rounded-2xl border text-xs flex flex-col items-center gap-1.5 transition-all ${
                  targetAudience === "all"
                    ? "bg-amber-500/10 border-amber-500 text-amber-600 font-bold shadow-sm"
                    : "bg-base-200 border-base-300 text-base-content/70 hover:bg-base-300"
                }`}
              >
                <Globe className="size-5" />
                <span>🌐 Entire Fleet</span>
              </button>
            </div>
          </div>

          {/* Priority Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-base-200 border border-base-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`size-5 ${isUrgent ? "text-error" : "text-base-content/50"}`} />
              <div className="text-xs">
                <div className="font-bold">Mark as High Priority / Urgent</div>
                <div className="text-[10px] opacity-60">Pins alert and triggers urgent toast</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="toggle toggle-error toggle-sm"
            />
          </div>

          {/* Title Input */}
          <div>
            <label className="label text-xs font-semibold">Announcement Title / Topic</label>
            <input
              type="text"
              placeholder="e.g. Mandatory Safety Inspection Notice"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input input-bordered w-full text-sm rounded-xl"
            />
          </div>

          {/* Message Textarea */}
          <div>
            <label className="label text-xs font-semibold">Announcement Message Content *</label>
            <textarea
              placeholder="Write the full broadcast instructions for the selected team members..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="textarea textarea-bordered w-full text-sm rounded-xl"
              required
            />
          </div>

          {/* Optional Attachment */}
          <div>
            <label className="label text-xs font-semibold">Optional Image Attachment</label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input file-input-sm file-input-bordered w-full rounded-xl"
              />
              {imagePreview && (
                <div className="relative size-10 rounded-lg overflow-hidden border border-base-300 shrink-0">
                  <img src={imagePreview} alt="Preview" className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="absolute top-0 right-0 bg-red-500 text-white p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-base-300">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || !text.trim()}
              className="btn btn-primary btn-sm rounded-xl gap-2 px-5"
            >
              {isSending ? (
                "Broadcasting..."
              ) : (
                <>
                  <Send className="size-4" /> Send Broadcast
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BroadcastModal;

import React, { useState } from "react";
import { Radio, X, Send, Truck, Building2, Globe, AlertTriangle, ImagePlus } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import Modal from "./Modal";

const AUDIENCES = [
  { id: "drivers", label: "Drivers", hint: "On-road staff", icon: Truck },
  { id: "office", label: "Office", hint: "Dispatch & admin", icon: Building2 },
  { id: "all", label: "Entire fleet", hint: "Everyone", icon: Globe },
];

const BroadcastModal = ({ isOpen, onClose }) => {
  const { sendBroadcastAnnouncement } = useChatStore();

  const [targetAudience, setTargetAudience] = useState("drivers");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);

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

  const audienceLabel =
    AUDIENCES.find((a) => a.id === targetAudience)?.label.toLowerCase() ?? "the fleet";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Fleet broadcast"
      subtitle="Send one announcement to a whole group at once"
      icon={Radio}
      size="lg"
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="hidden text-[11px] text-base-content/55 sm:block">
            Sending to <span className="font-semibold">{audienceLabel}</span>
            {isUrgent && <span className="font-semibold text-error"> · urgent</span>}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              form="broadcast-form"
              disabled={isSending || !text.trim()}
              className="btn btn-primary btn-sm gap-2 rounded-lg px-4 font-semibold"
            >
              {isSending ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  Broadcasting
                </>
              ) : (
                <>
                  <Send className="size-4" /> Send broadcast
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <form id="broadcast-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Audience */}
        <fieldset className="space-y-2">
          <legend className="label-caps mb-1.5">Audience</legend>
          <div className="grid grid-cols-3 gap-2">
            {AUDIENCES.map((a) => {
              const active = targetAudience === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setTargetAudience(a.id)}
                  aria-pressed={active}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 transition-colors
                    ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-base-300 bg-base-200 text-base-content/70 hover:bg-base-300/60"
                    }`}
                >
                  <a.icon className="size-5" />
                  <span className="text-xs font-semibold">{a.label}</span>
                  <span className="text-[10px] opacity-60">{a.hint}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Priority */}
        <label
          className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition-colors
            ${isUrgent ? "border-error/40 bg-error/5" : "border-base-300 bg-base-200"}`}
        >
          <span className="flex items-center gap-2.5">
            <AlertTriangle className={`size-5 ${isUrgent ? "text-error" : "text-base-content/40"}`} />
            <span>
              <span className="block text-xs font-semibold">Mark as urgent</span>
              <span className="block text-[11px] text-base-content/55">
                Pins the alert and raises a priority notification
              </span>
            </span>
          </span>
          <input
            type="checkbox"
            checked={isUrgent}
            onChange={(e) => setIsUrgent(e.target.checked)}
            className="toggle toggle-error toggle-sm"
          />
        </label>

        {/* Title */}
        <div className="space-y-1.5">
          <label htmlFor="bc-title" className="label-caps block">
            Title <span className="font-normal normal-case tracking-normal opacity-70">(optional)</span>
          </label>
          <input
            id="bc-title"
            type="text"
            placeholder="Mandatory safety inspection notice"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input input-bordered w-full rounded-lg text-sm"
          />
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <label htmlFor="bc-text" className="label-caps flex items-center justify-between">
            <span>Message</span>
            <span className="nums font-normal tracking-normal opacity-60">{text.length}</span>
          </label>
          <textarea
            id="bc-text"
            placeholder="Write the full instructions for the selected team..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="textarea textarea-bordered w-full rounded-lg text-sm"
            required
          />
        </div>

        {/* Attachment */}
        <div className="space-y-1.5">
          <label className="label-caps block">
            Attachment{" "}
            <span className="font-normal normal-case tracking-normal opacity-70">(optional)</span>
          </label>
          <div className="flex items-center gap-3">
            <label
              className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-dashed
                border-base-300 bg-base-200 px-3 py-2.5 text-xs font-medium text-base-content/60
                transition-colors hover:border-primary/50 hover:text-base-content"
            >
              <ImagePlus className="size-4" />
              {imagePreview ? "Replace image" : "Attach an image"}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>

            {imagePreview && (
              <div className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-base-300">
                <img src={imagePreview} alt="Attachment preview" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="absolute right-0 top-0 grid size-4 place-items-center bg-error text-error-content"
                  aria-label="Remove attachment"
                >
                  <X className="size-2.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default BroadcastModal;

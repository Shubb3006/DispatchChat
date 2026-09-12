import { useEffect, useRef, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import { Loader2, Send, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Dispatcher side of the customer's per-load conversation.
 *
 * Same endpoints the portal uses — the backend decides which side you are on
 * from your session role, so a dispatcher's reply lands in the broker's thread
 * and fires their portal notification.
 */
export default function StaffLoadThread({ loadId, loadNumber }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef(null);

  const load = async ({ quiet = false } = {}) => {
    if (!loadId) return;
    if (!quiet) setIsLoading(true);
    try {
      const res = await axiosInstance.get(`/portal/loads/${loadId}/messages`);
      if (res.data?.success) {
        setMessages(res.data.messages);
        if (res.data.unread_count > 0) {
          await axiosInstance.post(`/portal/loads/${loadId}/messages/read`).catch(() => { });
        }
      }
    } catch (error) {
      if (!quiet) console.warn("load thread failed:", error.message);
    } finally {
      if (!quiet) setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(() => load({ quiet: true }), 20000);
    return () => clearInterval(interval);
  }, [loadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const send = async () => {
    const body = draft.trim();
    if (!body || isSending) return;
    setIsSending(true);
    try {
      const res = await axiosInstance.post(`/portal/loads/${loadId}/messages`, { body });
      if (res.data?.success) {
        setMessages((prev) => [...prev, res.data.message]);
        setDraft("");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Message could not be sent");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-base-content">Customer conversation</h3>
          <p className="text-xs text-base-content">
            Goes straight to the broker's portal for Load #{loadNumber || loadId}. They are notified immediately.
          </p>
        </div>
      </div>

      <div className="max-h-[26rem] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-base-200 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-base-content">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="py-10 text-center">
            <MessageSquare className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-2 text-sm text-base-content">
              No messages yet. Anything you send here is visible to the customer in their portal.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.side === "staff";
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${mine
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 bg-base-100 text-slate-800"
                    }`}
                >
                  {!mine && (
                    <p className="mb-0.5 text-[11px] font-semibold text-base-content">{m.sender_name}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-1 text-[10px] ${mine ? "text-indigo-100" : "text-slate-400"}`}>
                    {new Date(m.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          placeholder="Reply to the customer…"
          className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <button
          onClick={send}
          disabled={isSending || !draft.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send
        </button>
      </div>
    </div>
  );
}

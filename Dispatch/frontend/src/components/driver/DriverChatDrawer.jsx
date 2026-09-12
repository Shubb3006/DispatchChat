import React from "react";
import { MessageSquare, X, Send } from "lucide-react";

export default function DriverChatDrawer({
  isChatOpen,
  setIsChatOpen,
  unreadMessagesCount,
  messages,
  newMessageText,
  setNewMessageText,
  handleSendMessage,
  chatEndRef,
}) {
  return (
    <>
      {/* Floating Chat Trigger Button */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-40">
        <button
          type="button"
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="relative flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase font-mono tracking-wider rounded-2xl shadow-xl shadow-indigo-950/30 hover:shadow-indigo-600/30 transition-all cursor-pointer border border-indigo-400/30 active:scale-95"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Dispatch Chat</span>
          {unreadMessagesCount > 0 && (
            <span className="absolute -top-2 -right-2 h-5 w-5 bg-rose-500 text-white font-mono font-black text-3xs rounded-full flex items-center justify-center animate-bounce border-2 border-white shadow-md">
              {unreadMessagesCount}
            </span>
          )}
        </button>
      </div>

      {/* Slide-over Chat Drawer */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-base-100 shadow-2xl flex flex-col h-full border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xs font-mono">
                    DISP
                  </div>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
                </div>
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                    Dispatch Channel (Keith Lead)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    REAL-TIME SAMSARA COMMS • 24/7 ACTIVE
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Message Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-base-200">
              {messages.map((msg, idx) => {
                const isMe = msg.sender === "driver" || msg.sender === "me";
                return (
                  <div
                    key={msg.id || idx}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"
                      }`}
                  >
                    <div className="flex items-center space-x-1 mb-1 px-1">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">
                        {isMe ? "You (Driver)" : msg.senderName || "Dispatch"}
                      </span>
                      <span className="text-[9px] text-slate-400">•</span>
                      <span className="text-[9px] font-mono text-slate-400">
                        {new Date(
                          msg.timestamp || Date.now()
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-medium shadow-xs leading-relaxed ${isMe
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-base-100 text-slate-800 border border-slate-200 rounded-bl-none"
                        }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-200 bg-base-100">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder="Type message to dispatch..."
                  className="flex-1 bg-slate-100 hover:bg-slate-100/80 focus:bg-base-100 border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessageText.trim()}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

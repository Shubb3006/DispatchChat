import React from "react";
import {
  CheckCheck,
  FolderLock,
  Radio,
  ShieldCheck,
  Truck,
  Mic,
  FileText,
  WifiOff,
  Keyboard,
} from "lucide-react";
import { BrandMark } from "./BrandLogo";
import { useAuthStore } from "../store/useAuthStore";
import { getRole, cleanName } from "../lib/roles";

const CAPABILITIES = [
  {
    icon: Radio,
    title: "Fleet channels",
    body: "Per-truck channels linking dispatch, office and driver in one thread.",
    tone: "text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-400",
  },
  {
    icon: FileText,
    title: "Document capture",
    body: "Scan a BOL from the cab and export it straight to PDF.",
    tone: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400",
  },
  {
    icon: FolderLock,
    title: "Media vault",
    body: "Every photo, doc and voice note for a load, kept in one place.",
    tone: "text-teal-600 bg-teal-50 dark:bg-teal-500/10 dark:text-teal-400",
  },
  {
    icon: CheckCheck,
    title: "Delivery receipts",
    body: "Sent, delivered and read state on every dispatch message.",
    tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  {
    icon: Mic,
    title: "Voice notes",
    body: "Hands-free updates for drivers who should not be typing.",
    tone: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400",
  },
  {
    icon: WifiOff,
    title: "Offline queue",
    body: "Messages sent through dead zones deliver on reconnect.",
    tone: "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400",
  },
];

const NoSelectedUser = () => {
  const { authUser, onlineUsers } = useAuthStore();
  const role = getRole(authUser?.role);
  const peers = Math.max((onlineUsers?.length || 0) - 1, 0);

  return (
    <div className="grid-canvas flex w-full flex-1 items-center justify-center overflow-y-auto p-6 sm:p-10">
      <div className="fade-in w-full max-w-2xl space-y-8">
        {/* Masthead */}
        <div className="flex flex-col items-center text-center">
          <BrandMark className="size-16 rounded-[22%] elevated" detail />

          <h2 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Welcome back, {cleanName(authUser?.fullName)?.split(" ")[0] || "there"}
          </h2>

          <p className="mt-2 max-w-md text-sm text-base-content/55">
            Pick a channel or teammate on the left to open the thread. Everything you send is
            tracked, receipted and stored against the load.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-base-100 px-3 py-1 text-[11px] font-semibold ring-1 ring-inset ring-base-300">
              <role.icon className="size-3 text-primary" />
              Signed in as {role.label}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-base-100 px-3 py-1 text-[11px] font-semibold ring-1 ring-inset ring-base-300">
              <span className={`size-2 rounded-full ${peers > 0 ? "bg-emerald-500" : "bg-slate-300"}`} />
              <span className="nums">{peers}</span> teammate{peers === 1 ? "" : "s"} online
            </span>
            <span className="hidden items-center gap-1.5 rounded-full bg-base-100 px-3 py-1 text-[11px] font-semibold ring-1 ring-inset ring-base-300 sm:inline-flex">
              <Keyboard className="size-3 text-base-content/50" />
              <kbd className="nums">Ctrl K</kbd> to search
            </span>
          </div>
        </div>

        {/* Capability grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((cap) => (
            <div
              key={cap.title}
              className="surface-panel rounded-xl p-3.5 transition-shadow hover:shadow-md"
            >
              <div className={`grid size-8 place-items-center rounded-lg ${cap.tone}`}>
                <cap.icon className="size-4" />
              </div>
              <h3 className="mt-2.5 text-[13px] font-bold tracking-tight">{cap.title}</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-base-content/55">{cap.body}</p>
            </div>
          ))}
        </div>

        {/* Footer strip */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-base-300 pt-5 text-[11px] text-base-content/45">
          <span className="inline-flex items-center gap-1.5">
            <Truck className="size-3.5" /> Nishan Transport
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" /> Role-based access
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Radio className="size-3.5" /> Real-time over WebSocket
          </span>
        </div>
      </div>
    </div>
  );
};

export default NoSelectedUser;

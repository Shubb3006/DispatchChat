import {
  Crown,
  ShieldCheck,
  Radio,
  Truck,
  Users,
  Briefcase,
  ClipboardList,
  User,
} from "lucide-react";

/**
 * Single source of truth for how a role is presented (label, colour, icon).
 * Previously each component re-derived this from the raw role string, which is
 * why roles rendered as "Super_user" / "Driver_manager" in the UI.
 */
export const ROLES = {
  super_user: { label: "Super User", short: "SU", icon: Crown, tone: "violet" },
  admin: { label: "Admin", short: "ADM", icon: ShieldCheck, tone: "rose" },
  dispatch: { label: "Dispatch", short: "DSP", icon: Radio, tone: "sky" },
  driver: { label: "Driver", short: "DRV", icon: Truck, tone: "amber" },
  driver_manager: { label: "Driver Manager", short: "DM", icon: ClipboardList, tone: "teal" },
  hr: { label: "HR", short: "HR", icon: Users, tone: "fuchsia" },
  office_staff: { label: "Office Staff", short: "OFF", icon: Briefcase, tone: "slate" },
};

const TONES = {
  violet: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/25",
  rose: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/25",
  sky: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/25",
  amber: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25",
  teal: "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/25",
  fuchsia: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200 dark:bg-fuchsia-500/10 dark:text-fuchsia-300 dark:ring-fuchsia-500/25",
  slate: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-base-2000/10 dark:text-slate-300 dark:ring-slate-500/25",
};

const FALLBACK = { label: "Member", short: "—", icon: User, tone: "slate" };

export const getRole = (role) => ROLES[role] || FALLBACK;

export const roleToneClass = (role) => TONES[getRole(role).tone] || TONES.slate;

/** Duty status presentation for drivers. */
export const DUTY = {
  on_duty: { label: "On Duty", dot: "bg-emerald-500" },
  driving: { label: "Driving", dot: "bg-sky-500" },
  on_break: { label: "On Break", dot: "bg-amber-500" },
  off_duty: { label: "Off Duty", dot: "bg-slate-400" },
  sleeper: { label: "Sleeper", dot: "bg-indigo-400" },
};

export const getDuty = (status) =>
  DUTY[status] || { label: (status || "off duty").replace(/_/g, " "), dot: "bg-slate-400" };

/**
 * Display name without the trailing "(Role)" that the seed data embeds, e.g.
 * "Sarah Connor (Admin)" -> "Sarah Connor".
 */
export const cleanName = (name) =>
  typeof name === "string" ? name.replace(/\s*\([^)]*\)\s*$/, "").trim() || name : "";

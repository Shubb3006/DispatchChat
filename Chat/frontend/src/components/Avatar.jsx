import React, { useState } from "react";
import { cleanName } from "../lib/roles";

const GRADIENTS = [
  "from-sky-400 to-blue-600",
  "from-emerald-400 to-teal-600",
  "from-violet-400 to-purple-600",
  "from-rose-400 to-pink-600",
  "from-amber-400 to-orange-600",
  "from-cyan-400 to-sky-600",
  "from-indigo-400 to-indigo-700",
  "from-fuchsia-400 to-fuchsia-700",
];

/**
 * Initials from a display name. The seed data suffixes names with their role
 * -- "Sarah Connor (Admin)" -- so the parenthetical is stripped first;
 * otherwise the last token is "(Admin)" and the initials render as "S(".
 */
const getInitials = (name) => {
  const cleaned = cleanName(name);
  if (!cleaned) return "?";
  const parts = cleaned
    .split(/[\s._-]+/)
    .filter((p) => /[a-z0-9]/i.test(p));
  if (parts.length === 0) return "?";
  const first = parts[0].match(/[a-z0-9]/i)?.[0] ?? "";
  if (parts.length === 1) return first.toUpperCase();
  const last = parts[parts.length - 1].match(/[a-z0-9]/i)?.[0] ?? "";
  return (first + last).toUpperCase();
};

const getGradient = (name) => {
  const key = cleanName(name) || "user";
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
};

/** Pixel width encoded in a Tailwind `size-N` class (N * 0.25rem). */
const sizePx = (size) => Number(String(size).match(/size-(\d+(?:\.\d+)?)/)?.[1] ?? 10) * 4;

/** Presence dot and initials scale with the avatar rather than a fixed size. */
const dotSize = (size) => {
  const px = sizePx(size);
  if (px >= 48) return "size-3.5";
  if (px >= 40) return "size-3";
  return "size-2.5";
};

const initialsSize = (size) => {
  const px = sizePx(size);
  if (px >= 88) return "text-2xl";
  if (px >= 64) return "text-lg";
  if (px >= 48) return "text-sm";
  if (px >= 36) return "text-xs";
  return "text-[10px]";
};

const Avatar = ({
  src,
  name = "User",
  size = "size-10",
  isOnline = false,
  showPresence = false,
  ring = false,
  className = "",
}) => {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name);
  const gradient = getGradient(name);
  const hasValidImage = src && !imageError;

  return (
    <div className={`relative shrink-0 ${className}`}>
      <div
        className={`${size} overflow-hidden rounded-full grid place-items-center select-none
          ring-1 ring-black/5 dark:ring-white/10
          ${ring ? "outline outline-2 outline-offset-2 outline-sky-500" : ""}`}
      >
        {hasValidImage ? (
          <img
            src={src}
            alt={cleanName(name)}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={`h-full w-full bg-gradient-to-br ${gradient} grid place-items-center
              text-white font-bold tracking-tight ${initialsSize(size)}`}
          >
            {initials}
          </div>
        )}
      </div>

      {(showPresence || isOnline) && (
        <span
          className={`absolute -bottom-0 -right-0 ${dotSize(size)} rounded-full
            ring-2 ring-white dark:ring-slate-900
            ${isOnline ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
          title={isOnline ? "Online" : "Offline"}
        />
      )}
    </div>
  );
};

export default Avatar;

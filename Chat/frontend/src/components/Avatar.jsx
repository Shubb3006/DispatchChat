import React, { useState } from "react";

const GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-400 to-teal-600",
  "from-violet-500 to-purple-600",
  "from-rose-500 to-pink-600",
  "from-amber-400 to-orange-600",
  "from-sky-400 to-cyan-600",
];

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "U";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getGradient = (name) => {
  if (!name) return GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
};

const Avatar = ({ src, name = "User", size = "size-10", isOnline = false, className = "" }) => {
  const [imageError, setImageError] = useState(false);

  const initials = getInitials(name);
  const gradient = getGradient(name);

  const hasValidImage = src && !imageError;

  return (
    <div className={`relative shrink-0 ${className}`}>
      <div
        className={`${size} rounded-full overflow-hidden border border-base-300 shadow-sm flex items-center justify-center font-bold text-white uppercase select-none`}
      >
        {hasValidImage ? (
          <img
            src={src}
            alt={name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-tr ${gradient} flex items-center justify-center text-xs sm:text-sm font-semibold tracking-wider text-white`}>
            {initials}
          </div>
        )}
      </div>

      {isOnline && (
        <span className="absolute bottom-0 right-0 size-3 bg-emerald-500 rounded-full ring-2 ring-base-100 shadow-sm" />
      )}
    </div>
  );
};

export default Avatar;

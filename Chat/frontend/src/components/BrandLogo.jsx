import React, { useId } from "react";

/**
 * Nishan_teams app mark: a white comms bubble on the brand gradient.
 *
 * Deliberately low-detail. An earlier version drew a route line and two
 * waypoints inside a gradient bubble, then nested that in a dark square -- at
 * navbar size (20px) the interior strokes merged into a single diagonal and
 * the mark read as a checkmark. The silhouette now carries the identity, and
 * interior detail is opt-in via `detail` for large placements only.
 */
export const BrandMark = ({ className = "size-8", detail = false }) => {
  // Unique per instance. A shared literal id collided between the desktop and
  // mobile lockups, and the reference resolved to the hidden zero-size copy --
  // which paints nothing, leaving the mark an unfilled white square.
  const gradientId = `nsh-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="Nishan_teams">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="0.55" stopColor="#0284c7" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
      </defs>

      {/* App-icon field */}
      <rect width="32" height="32" rx="7.5" fill={`url(#${gradientId})`} />

      {/* Bubble tail, drawn first so it merges into the body with no seam */}
      <path d="M11.2 17.4 L11.2 25.4 L17.6 20.2 Z" fill="#fff" />

      {/* Bubble body */}
      <rect x="6.4" y="8" width="19.2" height="12.5" rx="4.3" fill="#fff" />

      {/* Dispatch link: two waypoints, only legible at large sizes */}
      {detail && (
        <g stroke="#0369a1" fill="#0369a1">
          <path d="M12.2 14.2 H19.8" strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="12.2" cy="14.2" r="1.9" strokeWidth="0" />
          <circle cx="19.8" cy="14.2" r="1.9" strokeWidth="0" />
        </g>
      )}
    </svg>
  );
};

/**
 * Mark + wordmark lockup. The mark is self-contained, so no outer container.
 */
const BrandLogo = ({
  markClass = "size-8",
  showWordmark = true,
  subtitle = null,
  detail = false,
  className = "",
}) => (
  <span className={`flex items-center gap-2.5 ${className}`}>
    <BrandMark className={`${markClass} shrink-0 rounded-[22%] shadow-sm`} detail={detail} />
    {showWordmark && (
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-extrabold tracking-tight text-base-content">
          Nishan<span className="text-primary">_teams</span>
        </span>
        {subtitle && (
          <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-base-content/45">
            {subtitle}
          </span>
        )}
      </span>
    )}
  </span>
);

export default BrandLogo;

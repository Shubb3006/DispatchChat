import React from "react";

const StatusSkeleton = () => {
  const skeletonStatuses = Array(6).fill(null);

  return (
    <div className="flex gap-4 pt-20 overflow-x-auto">
      {skeletonStatuses.map((_, idx) => (
        <div
          key={idx}
          className="flex flex-col items-center gap-2 min-w-[72px]"
        >
          {/* Avatar Skeleton */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full skeleton" />
            {/* Optional ring effect */}
            <div className="absolute inset-0 rounded-full border-2 border-green-500 opacity-30" />
          </div>

          {/* Name Skeleton */}
          <div className="skeleton h-3 w-14 rounded" />
        </div>
      ))}
    </div>
  );
};

export default StatusSkeleton;

// import { Users } from "lucide-react";
// import React from "react";
// const SidebarSkeleton = () => {
//   // Create 8 skeleton items
//   const skeletonContacts = Array(8).fill(null);

//   return (
//     <aside
//       className="h-full w-20 lg:w-72 border-r border-base-300 
//     flex flex-col transition-all duration-200"
//     >
//       {/* Header */}
//       <div className="border-b border-base-300 w-full p-5">
//         <div className="flex items-center gap-2">
//           <Users className="w-6 h-6" />
//           <span className="font-medium hidden lg:block">Contacts</span>
//         </div>
//       </div>

//       {/* Skeleton Contacts */}
//       <div className="overflow-y-auto w-full py-3">
//         {skeletonContacts.map((_, idx) => (
//           <div key={idx} className="w-full p-3 flex items-center gap-3">
//             {/* Avatar skeleton */}
//             <div className="relative mx-auto lg:mx-0">
//               <div className="skeleton size-12 rounded-full" />
//             </div>

//             {/* User info skeleton - only visible on larger screens */}
//             <div className="hidden lg:block text-left min-w-0 flex-1">
//               <div className="skeleton h-4 w-32 mb-2" />
//               <div className="skeleton h-3 w-16" />
//             </div>
//           </div>
//         ))}
//       </div>
//     </aside>
//   );
// };

// export default SidebarSkeleton;

import React from "react";
import { Plus, Search, Inbox, SlidersHorizontal, Hash, Users2 } from "lucide-react";

const SidebarSkeleton = () => {
  const skeletonContacts = Array(8).fill(null);

  return (
    <div className="flex h-full min-h-0 flex-col bg-base-100">
      {/* ---------------- Header Skeleton ---------------- */}
      <div className="space-y-3 border-b border-base-300 px-3 pb-3 pt-3">
        {/* Title + New */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="skeleton h-4 w-28 rounded" />
            <div className="skeleton h-4 w-5 rounded-full" />
          </div>

          <div className="flex items-center gap-1 rounded-lg px-2 py-1">
            <Plus className="size-3.5 opacity-30" />
            <div className="skeleton h-3 w-7 rounded" />
          </div>
        </div>

        {/* Search Skeleton */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/20" />

          <div className="skeleton h-8 w-full rounded-lg" />
        </div>

        {/* Filters Skeleton */}
        <div className="flex items-center gap-1 rounded-lg bg-base-200 p-1">
          {[Inbox, SlidersHorizontal, Hash, Users2].map((Icon, index) => (
            <div
              key={index}
              className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 ${index === 0 ? "bg-base-100 shadow-sm" : ""
                }`}
            >
              <Icon className="size-3.5 text-base-content/20" />

              <div
                className={`hidden xl:block skeleton h-2.5 rounded ${index === 0
                    ? "w-5"
                    : index === 1
                      ? "w-9"
                      : index === 2
                        ? "w-12"
                        : "w-10"
                  }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- Conversation List Skeleton ---------------- */}
      <div className="min-h-0 flex-1 overflow-hidden py-1">
        {skeletonContacts.map((_, idx) => (
          <div
            key={idx}
            className="flex w-full items-center gap-3 px-3 py-2.5"
          >
            {/* Avatar */}
            <div className="skeleton size-11 shrink-0 rounded-xl" />

            {/* Conversation text */}
            <div className="min-w-0 flex-1">
              {/* Name + unit */}
              <div className="flex items-center justify-between gap-2">
                <div
                  className={`skeleton h-3.5 rounded ${idx % 3 === 0
                      ? "w-28"
                      : idx % 3 === 1
                        ? "w-24"
                        : "w-32"
                    }`}
                />

                <div className="skeleton h-2.5 w-7 shrink-0 rounded" />
              </div>

              {/* Role / duty */}
              <div className="mt-2 flex items-center gap-1.5">
                <div className="skeleton size-1.5 rounded-full" />

                <div
                  className={`skeleton h-2.5 rounded ${idx % 3 === 0
                      ? "w-16"
                      : idx % 3 === 1
                        ? "w-20"
                        : "w-14"
                    }`}
                />
              </div>
            </div>

            {/* Unread / archive area */}
            <div className="flex shrink-0 items-center gap-1">
              {idx % 4 === 0 && (
                <div className="skeleton size-5 rounded-full" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ---------------- Signed-in User Skeleton ---------------- */}
      <div className="border-t border-base-300 bg-base-200/40 p-2.5">
        <div className="flex items-center gap-2.5 rounded-xl border border-base-300 bg-base-100 p-2">
          {/* Avatar */}
          <div className="skeleton size-9 shrink-0 rounded-full" />

          {/* User info */}
          <div className="min-w-0 flex-1">
            <div className="skeleton h-3 w-24 rounded" />

            <div className="mt-1.5">
              <div className="skeleton h-3 w-14 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarSkeleton;

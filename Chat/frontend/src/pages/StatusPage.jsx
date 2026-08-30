import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useStatusStore } from "../store/useStatusStore";
import { Camera, X } from "lucide-react";
import StatusSkeleton from "../components/skeletons/StatusSkeleton";

const StatusPage = () => {
  const [selectedImage, setSelectedImage] = useState(null);

  const [activeUserId, setActiveUserId] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { authUser, checkAuth } = useAuthStore();
  const { statuses, getStatuses, isLoading, isUploading, addStatus } =
    useStatusStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (authUser?._id) {
      getStatuses();
    }
  }, [authUser._id, getStatuses]);

  const handleStatusUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      setSelectedImage(reader.result);
      await addStatus({ image: reader.result });
      setSelectedImage(null);

      getStatuses();
    };
  };

  const groupedStatuses = statuses.reduce((acc, status) => {
    const userId = status.userId?._id;
    if (!userId) return acc;

    if (!acc[userId]) {
      acc[userId] = {
        user: status.userId,
        statuses: [],
      };
    }

    acc[userId].statuses.push(status);
    return acc;
  }, {});

  useEffect(() => {
    if (!activeUserId) return;
    const total = groupedStatuses[activeUserId]?.statuses.length || 0;
    if (total == 0) return;

    const timer = setTimeout(() => {
      setActiveIndex((prev) => {
        if (prev < total - 1) return prev + 1;
        setActiveUserId(null);

        return prev;
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [activeIndex, activeUserId, groupedStatuses]);

  const myStatuses = groupedStatuses[authUser._id]?.statuses || [];
  const hasStatus = myStatuses.length > 0;

  if (isLoading || !authUser._id) return <StatusSkeleton />;

  return (
    <div className="pt-20 bg-base-200 min-h-screen">
      {/* Status Row */}
      <div className="flex gap-4 px-4 py-3 overflow-x-auto">
        {/* My Status */}
        <div className="flex flex-col items-center w-20 shrink-0">
          <div className="relative">
            <button
              onClick={() => {
                if (hasStatus) {
                  setActiveIndex(0);
                  setActiveUserId(authUser._id);
                }
              }}
              className=""
            >
              <img
                src={selectedImage || authUser.profilePic || "/avatar.png"}
                alt="My Status"
                className={`w-20 h-20 rounded-full object-cover border-2 relative ${
                  hasStatus ? "border-green-500" : "border-gray-500"
                }`}
              />
            </button>

            <label
              htmlFor="status-upload"
              className={`absolute bottom-0 right-0 bg-primary p-1.5 rounded-full cursor-pointer
              ${isUploading ? "animate-pulse pointer-events-none" : ""}`}
            >
              <Camera className="w-4 h-4 text-white" />
              <input
                id="status-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleStatusUpload}
                disabled={isUploading}
              />
            </label>
          </div>

          <span className="text-xs mt-2 text-center">
            {isUploading ? "Uploading..." : "My Status"}
          </span>
        </div>

        {/* Other Users Status */}
        {Object.values(groupedStatuses)
          .filter(({ user }) => user._id !== authUser._id)
          .map(({ user, statuses }) => (
            <button
              key={user._id}
              onClick={() => {
                setActiveUserId(user._id);
                setActiveIndex(0);
              }}
              className={`flex flex-col items-center`}
            >
              <img
                src={
                  statuses[statuses.length - 1].image ||
                  statuses[0].userId.profilePic ||
                  "/avatar.png"
                }
                className="w-20 h-20 rounded-full border-2 border-green-500 object-cover"
              />

              <span className="text-xs mt-2 truncate w-20 text-center">
                {user.fullName}
              </span>
            </button>
          ))}

        {activeUserId && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
            {/* Status Image */}
            <img
              src={groupedStatuses[activeUserId].statuses[activeIndex].image}
              className="max-w-150 max-h-full object-contain"
            />

            {/* Close */}
            <button
              onClick={() => setActiveUserId(null)}
              className="absolute top-4 right-4 text-white"
            >
              <X size={28} />
            </button>

            {/* Next */}
            <button
              className="absolute right-4 text-white text-3xl"
              onClick={() => {
                const total = groupedStatuses[activeUserId].statuses.length;

                if (activeIndex < total - 1) {
                  setActiveIndex((i) => i + 1);
                } else {
                  setActiveUserId(null);
                }
              }}
            >
              ▶
            </button>

            {/* Previous */}
            {activeIndex > 0 && (
              <button
                className="absolute left-4 text-white text-3xl"
                onClick={() => setActiveIndex((i) => i - 1)}
              >
                ◀
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusPage;

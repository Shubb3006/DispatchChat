import React, { useState, useEffect } from "react";
import { Camera, Mail, User, Smile } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile, uploadImage } = useAuthStore();
  const [selectedImage, setSelectedImage] = useState(
    authUser?.profilePic || null
  );
  const [bio, setBio] = useState(authUser?.bio || "");
  const [isEditingBio, setIsEditingBio] = useState(false);

  useEffect(() => {
    if (authUser?.profilePic) {
      setSelectedImage(authUser.profilePic);
    }
    if (authUser?.bio) {
      setBio(authUser.bio);
    }
  }, [authUser]);

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImage(base64Image);
      await uploadImage({ profilePic: base64Image });
    };
  }

  async function handleSaveBio() {
    if (!bio.trim()) return;
    await updateProfile({ bio: bio.trim() });
    setIsEditingBio(false);
  }
  return (
    <div className="container mx-auto px-4 bg-base-100 rounded-lg shadow-cl w-full max-w-6xl min-h-[calc(100vh-64px)] ">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Profile</h2>
            <p className="mt-2"> Your Profile Information</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                className="size-30 rounded-full object-cover  border-5"
                src={selectedImage || authUser.profilePic || "/avatar.png"}
                alt="Profile"
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""
                  }
                `}
              >
                <Camera className="w-5 h-5 text-base-200" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile
                ? "Uploading..."
                : "Click the camera icon to update your photo"}
            </p>
          </div>
          {/* user info section */}
          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-base-content/70 flex items-center gap-2">
                <User className="size-4" />
                Full Name
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border border-base-300">
                {authUser?.fullName}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-base-content/70 flex items-center gap-2">
                <Mail className="size-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border border-base-300">
                {authUser?.email}
              </p>
            </div>

            {/* Bio Field */}
            <div className="space-y-1.5">
              <div className="text-sm text-base-content/70 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Smile className="size-4" />
                  About / Bio
                </span>
                {isEditingBio ? (
                  <button
                    onClick={handleSaveBio}
                    disabled={isUpdatingProfile}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>
              {isEditingBio ? (
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-2 bg-base-200 rounded-lg border border-primary text-sm focus:outline-none"
                  placeholder="Tell others about yourself..."
                />
              ) : (
                <p className="px-4 py-2.5 bg-base-200 rounded-lg border border-base-300 text-sm">
                  {authUser?.bio || "Hey there! I am using Chaty."}
                </p>
              )}
            </div>

            <div className="mt-6 bg-base-300 rounded-xl p-6">
              <h2 className="text-lg font-medium mb-4">Account Information</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-base-300">
                  <span>Member Since</span>
                  <span>{authUser?.createdAt?.split("T")[0]}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Account Status</span>
                  <span className="text-green-500 font-medium">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

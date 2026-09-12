import React, { useEffect, useState } from "react";
import { useAdminStore } from "../store/useAdminStore";
import { useAuthStore } from "../store/useAuthStore";
import {
  UserPlus,
  Shield,
  Key,
  Truck,
  Users,
  Search,
  CheckCircle,
  Loader2,
  Lock,
  UserCheck,
  Edit2,
  Trash2,
  X,
} from "lucide-react";

const AdminPage = () => {
  const { authUser } = useAuthStore();
  const {
    users,
    isLoadingUsers,
    getAllUsers,
    createUser,
    isCreatingUser,
    resetPassword,
    isResettingPassword,
    updateUserRole,
    updateUser,
    deleteUser,
  } = useAdminStore();

  // Create User Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "driver",
    unitNumber: "",
  });

  // Edit User Modal State
  const [editModalUser, setEditModalUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    email: "",
    role: "",
    unitNumber: "",
  });

  // Password Reset Modal State
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");

  // Search Filter State
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getAllUsers();
  }, [getAllUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) return;

    const success = await createUser(formData);
    if (success) {
      setFormData({
        fullName: "",
        email: "",
        password: "",
        role: "driver",
        unitNumber: "",
      });
    }
  };

  const handleEditUserClick = (u) => {
    setEditModalUser(u);
    setEditFormData({
      fullName: u.fullName || "",
      email: u.email || "",
      role: u.role || "",
      unitNumber: u.unitNumber || "",
    });
  };

  const handleUpdateUserSubmit = async (e) => {
    e.preventDefault();
    if (!editModalUser) return;

    // First update the role/unit if changed
    await updateUserRole(editModalUser._id, editFormData.role, editFormData.unitNumber);

    // Then update personal details (name/email)
    const success = await updateUser(editModalUser._id, {
      fullName: editFormData.fullName,
      email: editFormData.email
    });

    if (success) {
      setEditModalUser(null);
    }
  };

  const handleDeleteUserClick = async (userId, name) => {
    if (window.confirm(`Are you sure you want to permanently delete user: ${name}?`)) {
      await deleteUser(userId);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetModalUser || !newPasswordInput) return;

    const success = await resetPassword(resetModalUser._id, newPasswordInput);
    if (success) {
      setResetModalUser(null);
      setNewPasswordInput("");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.unitNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAuthorized = ["super_user", "admin", "hr"].includes(authUser?.role);

  if (!isAuthorized) {
    return (
      <div className="container mx-auto px-4 pt-24 min-h-screen flex items-center justify-center">
        <div className="text-center bg-base-200 p-8 rounded-2xl border border-base-300 max-w-md">
          <Shield className="size-12 text-error mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-sm text-base-content/70">
            Only Super Users, Admins, and HR Managers have permission to access User Management.
          </p>
        </div>
      </div>
    );
  }

  return (
    // <div className="container mx-auto px-4 pt-5 pb-10 min-h-screen max-w-6xl">
    <div className="min-h-[calc(100vh-64px)] container mx-auto px-4 pt-5 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3">
            <Shield className="size-8 text-primary" /> Management Control Center
          </h1>
          <p className="text-sm text-base-content/70 mt-1">
            Manage Fleet Users, Roles, Credentials & Passwords
          </p>
        </div>
        <div className="badge badge-primary badge-lg gap-2 py-3 px-4 font-semibold capitalize">
          <UserCheck className="size-4" /> Logged as {authUser?.role?.replace("_", " ")}
        </div>
      </div>

      {/* <div className="min-h-[500px] overflow-x-auto overflow-y-auto grid grid-cols-1 lg:grid-cols-1 gap-8"> */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create User Card */}
        <div className="bg-base-200 p-6 rounded-2xl border border-base-300 shadow-xl h-fit">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <UserPlus className="size-5 text-primary" /> Create New User Account
          </h2>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="label text-xs font-semibold">Full Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                className="input input-bordered w-full text-sm"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="label text-xs font-semibold">
                User ID / Email Address
              </label>
              <input
                type="text"
                placeholder="driver101@fleet.com or driver101"
                className="input input-bordered w-full text-sm"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="label text-xs font-semibold">Initial Password</label>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                className="input input-bordered w-full text-sm"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="label text-xs font-semibold">Assign Role</label>
              <select
                className="select select-bordered w-full text-sm capitalize"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              >
                {/* Super User option is ONLY available to Super Users */}
                {authUser?.role === "super_user" && (
                  <option value="super_user">👑 Super User</option>
                )}
                <option value="admin">⚙️ System Admin</option>
                <option value="dispatch">🏢 Dispatcher</option>
                <option value="hr">👔 HR Manager</option>
                <option value="office_staff">💼 Office Staff (Read-Only)</option>
                <option value="driver_manager">🚛 Driver Manager</option>
                <option value="driver">🚚 Driver</option>
              </select>
            </div>

            <div>
              <label className="label text-xs font-semibold">
                Truck / Unit Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Truck #104"
                className="input input-bordered w-full text-sm"
                value={formData.unitNumber}
                onChange={(e) =>
                  setFormData({ ...formData, unitNumber: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              disabled={isCreatingUser}
              className="btn btn-primary w-full mt-2 gap-2"
            >
              {isCreatingUser ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <UserPlus className="size-4" /> Create User Account
                </>
              )}
            </button>
          </form>
        </div>

        {/* Users Directory Table */}
        {/* <div className="lg:col-span-2 bg-base-200 p-6 rounded-2xl border border-base-300 shadow-xl max-h-[700px] overflow-y-hidden"> */}
        <div className="lg:col-span-2 bg-base-200 p-6 rounded-2xl border border-base-300 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users className="size-5 text-primary" /> Fleet User Directory (
              {users.length})
            </h2>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="size-4 absolute left-3 top-3 text-base-content/50" />
              <input
                type="text"
                placeholder="Search name, unit, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-sm input-bordered w-full pl-9"
              />
            </div>
          </div>

          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : (
            // <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
            //   <table className="table table-zebra w-full text-sm">
            //     <thead>
            //       <tr>
            //         <th>User</th>
            //         <th>Role</th>
            //         <th>Unit #</th>
            //         <th>Duty Status</th>
            //         <th>Actions</th>
            //       </tr>
            //     </thead>
            //     <tbody>
            //       {filteredUsers.map((u) => (
            //         <tr key={u._id}>
            //           <td>
            //             <div className="flex items-center gap-3">
            //               <img
            //                 src={u.profilePic || "/avatar.png"}
            //                 alt={u.fullName}
            //                 className="size-9 rounded-full object-cover border border-base-300"
            //               />
            //               <div>
            //                 <div className="font-semibold">{u.fullName}</div>
            //                 <div className="text-xs text-base-content/60">
            //                   {u.email}
            //                 </div>
            //               </div>
            //             </div>
            //           </td>
            //           <td>
            //             <span
            //               className={`badge badge-sm font-semibold capitalize ${u.role === "super_user"
            //                 ? "badge-warning text-black font-extrabold"
            //                 : u.role === "admin"
            //                   ? "badge-error text-white"
            //                   : u.role === "dispatch"
            //                     ? "badge-primary"
            //                     : u.role === "hr"
            //                       ? "badge-accent text-white"
            //                       : u.role === "office_staff"
            //                         ? "badge-info text-white"
            //                         : u.role === "driver_manager"
            //                           ? "badge-secondary"
            //                           : "badge-ghost"
            //                 }`}
            //             >
            //               {u.role?.replace("_", " ")}
            //             </span>
            //           </td>
            //           <td>
            //             {u.unitNumber ? (
            //               <span className="flex items-center gap-1 text-xs font-mono bg-base-300 px-2 py-1 rounded">
            //                 <Truck className="size-3" /> {u.unitNumber}
            //               </span>
            //             ) : (
            //               <span className="text-xs text-base-content/40">--</span>
            //             )}
            //           </td>
            //           <td>
            //             <span
            //               className={`badge badge-xs font-medium ${u.dutyStatus === "driving"
            //                 ? "badge-info"
            //                 : u.dutyStatus === "on_duty"
            //                   ? "badge-success text-white"
            //                   : u.dutyStatus === "break"
            //                     ? "badge-warning"
            //                     : "badge-ghost"
            //                 }`}
            //             >
            //               {u.dutyStatus?.replace("_", " ") || "off duty"}
            //             </span>
            //           </td>
            //           <td>
            //             <div className="flex items-center gap-1">
            //               {/* Only Super Users can reset a Super User password */}
            //               {u.role === "super_user" && authUser?.role !== "super_user" ? (
            //                 <span className="text-[10px] opacity-40">Protected</span>
            //               ) : (
            //                 <>
            //                   <button
            //                     onClick={() => handleEditUserClick(u)}
            //                     className="btn btn-ghost btn-xs text-info"
            //                     title="Edit User"
            //                   >
            //                     <Edit2 className="size-3" />
            //                   </button>
            //                   <button
            //                     onClick={() => setResetModalUser(u)}
            //                     className="btn btn-ghost btn-xs text-primary"
            //                     title="Reset Password"
            //                   >
            //                     <Key className="size-3" />
            //                   </button>
            //                   {u._id !== authUser?._id && (
            //                     <button
            //                       onClick={() => handleDeleteUserClick(u._id, u.fullName)}
            //                       className="btn btn-ghost btn-xs text-error"
            //                       title="Delete User"
            //                     >
            //                       <Trash2 className="size-3" />
            //                     </button>
            //                   )}
            //                 </>
            //               )}
            //             </div>
            //           </td>
            //         </tr>
            //       ))}

            //       {filteredUsers.length === 0 && (
            //         <tr>
            //           <td colSpan="5" className="text-center py-8 text-base-content/60">
            //             No users found
            //           </td>
            //         </tr>
            //       )}
            //     </tbody>
            //   </table>
            // </div>

            <div className="w-full overflow-x-auto">
              <table className="table w-full min-w-[700px] text-sm">
                <thead>
                  <tr>
                    <th className="whitespace-nowrap">User</th>
                    <th className="whitespace-nowrap">Role</th>
                    <th className="whitespace-nowrap">Unit #</th>
                    <th className="whitespace-nowrap">Duty Status</th>
                    <th className="whitespace-nowrap">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u._id}>

                      {/* User */}
                      <td className="max-w-[260px]">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={u.profilePic || "/avatar.png"}
                            alt={u.fullName}
                            className="size-9 shrink-0 rounded-full object-cover border border-base-300"
                          />

                          <div className="min-w-0">
                            <div className="font-semibold truncate">
                              {u.fullName}
                            </div>

                            <div className="text-xs text-base-content/60 break-all">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      {/* <td>
                        <span
                          className={`badge badge-sm font-semibold capitalize whitespace-normal text-center leading-tight ${u.role === "super_user"
                              ? "badge-warning text-black font-extrabold"
                              : u.role === "admin"
                                ? "badge-error text-white"
                                : u.role === "dispatch"
                                  ? "badge-primary"
                                  : u.role === "hr"
                                    ? "badge-accent text-white"
                                    : u.role === "office_staff"
                                      ? "badge-info text-white"
                                      : u.role === "driver_manager"
                                        ? "badge-secondary"
                                        : "badge-ghost"
                            }`}
                        >
                          {u.role?.replace("_", " ")}
                        </span>
                      </td> */}
                      <td>
                        <span
                          className={`inline-flex items-center justify-center min-h-6 px-2 py-1 rounded-full
      text-[11px] font-semibold capitalize text-center leading-tight
      max-w-[110px] whitespace-normal break-words
      ${u.role === "super_user"
                              ? "bg-warning text-black font-extrabold"
                              : u.role === "admin"
                                ? "bg-error text-white"
                                : u.role === "dispatch"
                                  ? "bg-primary text-primary-content"
                                  : u.role === "hr"
                                    ? "bg-accent text-accent-content"
                                    : u.role === "office_staff"
                                      ? "bg-info text-info-content"
                                      : u.role === "driver_manager"
                                        ? "bg-secondary text-secondary-content"
                                        : u.role === "driver"
                                          ? "bg-success text-success-content"
                                          : "bg-base-300 text-base-content"
                            }`}
                        >
                          {u.role?.replace("_", " ")}
                        </span>
                      </td>

                      {/* Unit */}
                      <td>
                        {u.unitNumber ? (
                          <span className="inline-flex items-center gap-1 text-xs font-mono bg-base-300 px-2 py-1 rounded whitespace-nowrap">
                            <Truck className="size-3 shrink-0" />
                            <span className="break-all">
                              {u.unitNumber}
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-base-content/40">
                            --
                          </span>
                        )}
                      </td>

                      {/* Duty Status */}
                      <td>
                        <span
                          className={`badge badge-xs font-medium whitespace-nowrap ${u.dutyStatus === "driving"
                            ? "badge-info"
                            : u.dutyStatus === "on_duty"
                              ? "badge-success text-white"
                              : u.dutyStatus === "break"
                                ? "badge-warning"
                                : "badge-ghost"
                            }`}
                        >
                          {u.dutyStatus?.replace("_", " ") || "off duty"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="flex items-center gap-1 flex-wrap">
                          {u.role === "super_user" &&
                            authUser?.role !== "super_user" ? (
                            <span className="text-[10px] opacity-40 whitespace-nowrap">
                              Protected
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditUserClick(u)}
                                className="btn btn-ghost btn-xs text-info shrink-0"
                                title="Edit User"
                              >
                                <Edit2 className="size-3" />
                              </button>

                              <button
                                onClick={() => setResetModalUser(u)}
                                className="btn btn-ghost btn-xs text-primary shrink-0"
                                title="Reset Password"
                              >
                                <Key className="size-3" />
                              </button>

                              {u._id !== authUser?._id && (
                                <button
                                  onClick={() =>
                                    handleDeleteUserClick(
                                      u._id,
                                      u.fullName
                                    )
                                  }
                                  className="btn btn-ghost btn-xs text-error shrink-0"
                                  title="Delete User"
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-8 text-base-content/60"
                      >
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Password Reset Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-base-100 p-6 rounded-2xl border border-base-300 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
              <Lock className="size-5 text-warning" /> Reset Password for{" "}
              {resetModalUser.fullName}
            </h3>
            <p className="text-xs text-base-content/70 mb-4">
              Enter a new password for user ID: <strong>{resetModalUser.email}</strong>
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="label text-xs font-semibold">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password (min 6 chars)"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="input input-bordered w-full text-sm"
                  autoFocus
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetModalUser(null);
                    setNewPasswordInput("");
                  }}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResettingPassword || !newPasswordInput}
                  className="btn btn-primary btn-sm gap-2"
                >
                  {isResettingPassword ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle className="size-4" />
                  )}
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModalUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-base-100 p-6 rounded-2xl border border-base-300 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Edit2 className="size-5 text-primary" /> Edit User: {editModalUser.fullName}
              </h3>
              <button onClick={() => setEditModalUser(null)} className="btn btn-ghost btn-xs btn-circle"><X className="size-4" /></button>
            </div>

            <form onSubmit={handleUpdateUserSubmit} className="space-y-4">
              <div>
                <label className="label text-xs font-semibold">Full Name</label>
                <input
                  type="text"
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="input input-bordered w-full text-sm"
                  required
                />
              </div>

              <div>
                <label className="label text-xs font-semibold">User ID / Email</label>
                <input
                  type="text"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="input input-bordered w-full text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs font-semibold">Role</label>
                  <select
                    className="select select-bordered w-full text-sm"
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  >
                    {authUser?.role === "super_user" && <option value="super_user">Super User</option>}
                    <option value="admin">Admin</option>
                    <option value="dispatch">Dispatch</option>
                    <option value="hr">HR</option>
                    <option value="office_staff">Office Staff</option>
                    <option value="driver">Driver</option>
                  </select>
                </div>
                <div>
                  <label className="label text-xs font-semibold">Unit #</label>
                  <input
                    type="text"
                    value={editFormData.unitNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, unitNumber: e.target.value })}
                    className="input input-bordered w-full text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setEditModalUser(null)} className="btn btn-ghost btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Update User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;

import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import HRDashboard from "../components/HRDashboard";
import { useEffect } from "react";

export default function HRPage() {
  const { fetchUsers, users, currentUser, deleteUser } = useAuthStore();

  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = async (id) => {
    await deleteUser(id);
    if (currentUser && currentUser.id === id) {
      const currentUsersList = useAuthStore.getState().users;
      const fallback =
        currentUsersList.find((u) => u.id !== id) || currentUsersList[0];
      if (fallback) {
        useAuthStore.setState({ currentUser: fallback });
        const isSuperOrAdmin =
          fallback.role === "super_admin" || fallback.role === "admin";
        const target = isSuperOrAdmin
          ? "reporting"
          : fallback.allowedModules[0] || "customer";
        navigate("/" + target);
      } else {
        useAuthStore.setState({ currentUser: null, isLoggedIn: false });
        navigate("/login");
      }
    }
  };
  return (
    <HRDashboard
      users={users}
      currentUser={currentUser}
      onDeleteUser={handleDeleteUser}
    />
  );
}

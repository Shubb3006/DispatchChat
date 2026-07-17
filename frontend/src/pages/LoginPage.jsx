import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import Login from "../components/Login";

export default function LoginPage() {
  const users = useAuthStore((state) => state.users);
  const navigate = useNavigate();

  const handleLoginSuccess = (user) => {
    const isSuperOrAdmin = user.role === "super_admin" || user.role === "admin";
    const target = isSuperOrAdmin ? "reporting" : user.allowedModules[0] || "customer";
    navigate("/" + target);
  };

  return <Login users={users} onLoginSuccess={handleLoginSuccess} />;
}

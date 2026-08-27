import { Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/useAuthStore";

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuthStore();
  console.log(isLoggedIn);

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;

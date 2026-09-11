import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import HomePage from "./pages/HomePage";
import Navbar from "./components/Navbar";
import SigninPage from "./pages/SigninPage";
import SignupPage from "./pages/SignupPage";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";
import { initNotifications } from "./lib/notifications";
import { useCallStore } from "./store/useCallStore";
import { useChatStore } from "./store/useChatStore";
import { listenToNetwork } from "./lib/offlineQueue";
import ProfilePage from "./pages/ProfilePage";
import { Loader2 } from "lucide-react";
import NotFoundPage from "./pages/NotFound";
import StatusPage from "./pages/StatusPage";
import CallOverlay from "./components/CallOverlay";
import AdminPage from "./pages/AdminPage";

function App() {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();
  const { syncQueue } = useChatStore();

  useEffect(() => {
    checkAuth();
    initNotifications();
  }, [checkAuth]);

  useEffect(() => {
    if (authUser) {
      listenToNetwork(() => {
        syncQueue();
      });
    }
  }, [authUser, syncQueue]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  if (isCheckingAuth && !authUser) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] w-screen bg-base-100 flex flex-col">
      <Toaster />
      <CallOverlay />
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to="/signin" />}
        />
        <Route
          path="/signin"
          element={!authUser ? <SigninPage /> : <Navigate to="/" />}
        />
        <Route
          path="/signup"
          element={!authUser ? <SignupPage /> : <Navigate to="/" />}
        />
        <Route
          path="/admin"
          element={
            authUser ? (
              <AdminPage />
            ) : (
              <Navigate to="/signin" />
            )
          }
        />
        <Route
          path="/profile"
          element={authUser ? <ProfilePage /> : <Navigate to="/signin" />}
        />
        <Route
          path="/status"
          element={authUser ? <StatusPage /> : <Navigate to="/signin" />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;

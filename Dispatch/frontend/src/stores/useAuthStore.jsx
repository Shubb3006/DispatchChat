// import { create } from "zustand";
// import toast from "react-hot-toast";
// import { axiosInstance } from "../../lib/axios";

// export const useAuthStore = create((set, get) => ({
//   authUser: null,
//   isCheckingAuth: false,
//   isSigningUp: false,
//   isSigningIn: false,
//   isLoggedIn: false,

//   checkAuth: async () => {
//     set({ isCheckingAuth: true });
//     try {
//       const res = await axiosInstance.get("/auth/check");
//       set({ authUser: res.data.user });
//     } catch (error) {
//       console.log(error.message);
//       set({ authUser: null });
//     } finally {
//       set({ isCheckingAuth: false });
//     }
//   },

//   signup: async (data) => {
//     console.log(data);
//     set({ isSigningUp: true });
//     try {
//       const res = await axiosInstance.post("/auth/signup", data);
//       toast.success("Signup succesfull");
//       set({ authUser: res.data.user });
//       set({ isLoggedIn: true });
//       return true;
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Signup failed");
//       return false;
//     } finally {
//       set({ isSigningUp: false });
//     }
//   },

//   login: async (data) => {
//     console.log(data);
//     set({ isSigningIn: true });
//     try {
//       const res = await axiosInstance.post("/auth/login", data);
//       toast.success("Sign in succesfull");
//       set({ authUser: res.data.user });
//       set({ isLoggedIn: true });
//       return true;
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Login failed");
//       return false;
//     } finally {
//       set({ isSigningIn: false });
//     }
//   },

//   logout: async () => {
//     try {
//       const res = await axiosInstance.post("/auth/logout");
//       toast.success("Logout succesfull");
//       set({ authUser: null });
//       set({ isLoggedIn: false });
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Logout failed");
//     }
//   },
// }));

import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";

// const INITIAL_SANDBOX_USERS = [
//   {
//     id: "USR001",
//     name: "Sophia Chen",
//     username: "superadmin",
//     password: "password",
//     role: "super_admin",
//     allowedModules: [
//       "reporting",
//       "data_entry",
//       "dispatcher",
//       "driver_manager",
//       "customs",
//       "safety",
//       "invoicing",
//       "customer",
//       "driver",
//       "hr",
//     ],
//     createdAt: "2026-01-10",
//   },
//   {
//     id: "DRV001",
//     name: "Marcus Vance",
//     username: "marcus_drv",
//     password: "password",
//     role: "driver",
//     allowedModules: ["driver"],
//     createdAt: "2026-01-11",
//   },
// ];

export const useAuthStore = create((set, get) => ({
  // User's custom state fields
  authUser: null,
  isCheckingAuth: false,
  isSigningUp: false,
  isSigningIn: false,

  // App-compatibility state fields
  isLoggedIn: false,
  currentUser: null,
  users: [],
  isLoading: false,
  error: null,

  checkAuth: async () => {
    set({ isCheckingAuth: true, isLoading: true });
    try {
      const res = await axiosInstance.get("/auth/check", { timeout: 2000 });
      const user = res.data;
      // Single batched set — one render instead of three
      set({
        authUser: user,
        currentUser: user,
        isLoggedIn: true,
        isCheckingAuth: false,
        isLoading: false,
      });
    } catch (error) {
      console.log("Auth check response:", error.message);
      set({
        authUser: null,
        currentUser: null,
        isLoggedIn: false,
        isCheckingAuth: false,
        isLoading: false,
      });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true, isLoading: true, error: null });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      const user = res.data;
      toast.success("Signup successful");
      set((state) => ({
        authUser: user,
        currentUser: user,
        isLoggedIn: !!user,
        users: [user, ...state.users],
        isLoading: false,
      }));
      return true;
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Signup failed";
      toast.error(msg);
      set({ error: msg, isLoading: false });
      return false;
    } finally {
      set({ isSigningUp: false, isLoading: false });
    }
  },

  // Alias for backward compatibility
  signUp: async (data) => {
    return get().signup(data);
  },

  login: async (usernameOrData, password) => {
    console.log("BACKEND URL:", process.env.VITE_API_URL);
    console.log("Logging in user via store...");
    set({ isSigningIn: true, isLoading: true, error: null });
    // Normalize data if it's passed as separate arguments (like login(username, password))
    let payload = usernameOrData;
    if (typeof usernameOrData === "string") {
      payload = { username: usernameOrData, password: password || "password" };
    }

    try {
      const res = await axiosInstance.post("/auth/login", payload);
      const user = res.data?.user || res.data;
      console.log(res.data);
      toast.success("Sign in successful");
      set({
        authUser: user,
        currentUser: user,
        isLoggedIn: !!user,
        isLoading: false,
      });
      return true;
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Login failed";

      // Local fallback check if API is not fully configured yet
      const localMatch = get().users.find(
        (u) =>
          u.username ===
            (payload.username || payload.email || "").trim().toLowerCase() &&
          u.password === (payload.password || "password")
      );
      if (localMatch) {
        toast.success("Sign in successful (Sandbox Offline Mode)");
        set({
          authUser: localMatch,
          currentUser: localMatch,
          isLoggedIn: true,
          isLoading: false,
        });
        return true;
      }

      toast.error(msg);
      set({ error: msg, isLoading: false });
      return false;
    } finally {
      set({ isSigningIn: false, isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await axiosInstance.post("/auth/logout");
      toast.success("Logout successful");
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    } finally {
      set({
        authUser: null,
        currentUser: null,
        isLoggedIn: false,
        isLoading: false,
      });
    }
  },

  // Extended CRUD methods for system users
  fetchUsers: async () => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get("/user");
      set({ users: response.data.users, isLoading: false });
    } catch (err) {
      console.warn("Fetch users failed, keeping mock:", err.message);
    } finally {
      set({ isLoading: false });
    }
  },

  addUser: async (user) => {
    set({ isLoading: true, error: null });
    console.log(user);
    try {
      const res = await axiosInstance.post("/user/create", user);

      // Your signup API may return { user } or just user
      const savedUser = res.data.user || res.data;
      console.log(savedUser);
      set((state) => ({
        users: [...state.users, savedUser],
        isLoading: false,
      }));

      toast.success("User created successfully");
      return true;
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to create user";

      set({
        error: msg,
        isLoading: false,
      });

      toast.error(msg);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteUser: async (id) => {
    console.log("Deleting");
    set({ isLoading: true });
    try {
      await axiosInstance.delete(`/user/${id}`);
      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
        isLoading: false,
      }));
      toast.success("User profile removed");
    } catch (err) {
      set({ error: "Failed to delete user", isLoading: false });
      toast.error("Failed to delete user");
    }
  },

  setCurrentUser: (user) => {
    set({
      currentUser: user,
      authUser: user,
      isLoggedIn: !!user,
    });
  },
}));

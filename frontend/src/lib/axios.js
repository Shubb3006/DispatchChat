import axios from "axios";

const API_BASE_URL = process.env.VITE_API_URL || process.env.REACT_APP_API_URL || "http://localhost:5555/api";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add any auth tokens or headers here
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

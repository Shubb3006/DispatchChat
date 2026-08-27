import axios from "axios";
import { getApiUrl } from "./config";

export const axiosInstance = axios.create({
  withCredentials: true,
  timeout: 15000, // 15 second timeout to handle network latencies comfortably
});


// Interceptor: Dynamically resolve baseURL and attach Authorization token
axiosInstance.interceptors.request.use((config) => {
  config.baseURL = getApiUrl();
  const token = localStorage.getItem("jwt_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: Save token received from server response & handle 401
axiosInstance.interceptors.response.use(
  (response) => {
    if (response.data && response.data.token) {
      localStorage.setItem("jwt_token", response.data.token);
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("jwt_token");
    }
    return Promise.reject(error);
  }
);

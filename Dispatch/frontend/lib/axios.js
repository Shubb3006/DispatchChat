import axios from "axios";
import { API_BASE_URL } from "./apiBase";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  // Render's free tier spins the service down when idle, and the cold start can
  // take the better part of a minute — a short timeout turns that into a failure.
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Mobile fallback: iOS Safari blocks the cross-site auth cookie (Vercel
// frontend → Render API), so the token saved at login is also sent as a
// Bearer header. The backend accepts either.
axiosInstance.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("jwt_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // localStorage unavailable (private mode) — cookie auth still applies
  }
  return config;
});

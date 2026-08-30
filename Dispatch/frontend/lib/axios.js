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

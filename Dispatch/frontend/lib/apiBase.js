// Single source of truth for the backend origin.
//
// VITE_API_URL always wins (set it in the Vercel dashboard, or in a local .env),
// but the fallbacks below keep the app working when it is not set: a browser on
// localhost talks to the local backend, anything else talks to the deployed one.
const PROD_API_URL = "https://ozack-dispatch-backend.onrender.com";
const LOCAL_API_URL = "http://localhost:5555";

const resolveApiUrl = () => {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();

  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") return LOCAL_API_URL;
  }

  return PROD_API_URL;
};

// Origin only, no trailing slash: "https://ozack-dispatch-backend.onrender.com"
export const API_URL = resolveApiUrl().replace(/\/+$/, "");

// Origin + "/api", the prefix every route in the backend is mounted under.
export const API_BASE_URL = `${API_URL}/api`;

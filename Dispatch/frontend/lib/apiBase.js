// Single source of truth for the backend origin.
//
// VITE_API_URL always wins (set it in the Vercel dashboard, or in a local .env),
// but the fallbacks below keep the app working when it is not set: a browser on
// localhost talks to the local backend, anything else talks to the deployed one.
const PROD_API_URL = "https://ozack-dispatch-backend.onrender.com";
const LOCAL_API_URL = "http://localhost:5555";

const resolveApiUrl = () => {
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    // Always use localhost backend when running locally
    if (hostname === "localhost" || hostname === "127.0.0.1") return LOCAL_API_URL;
    // Always use production backend when on Vercel or any non-local domain
    // (ignore VITE_API_URL if it points to a local dev server)
  }

  // Prefer explicit VITE_API_URL only if it's a valid production URL (https://)
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv && fromEnv.trim() && fromEnv.trim().startsWith("https://")) {
    return fromEnv.trim();
  }

  return PROD_API_URL;
};

// Origin only, no trailing slash: "https://ozack-dispatch-backend.onrender.com"
export const API_URL = resolveApiUrl().replace(/\/+$/, "");

// Origin + "/api", the prefix every route in the backend is mounted under.
export const API_BASE_URL = `${API_URL}/api`;

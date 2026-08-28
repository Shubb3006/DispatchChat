// Single source of truth for the backend origin.
// On localhost: connect to local backend
// On Vercel or any other domain: connect to production Render backend
const PROD_API_URL = "https://ozack-dispatch-backend.onrender.com";
const LOCAL_API_URL = "http://localhost:5555";

const resolveApiUrl = () => {
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return LOCAL_API_URL;
    }
  }
  return PROD_API_URL;
};

export const API_URL = resolveApiUrl().replace(/\/+$/, "");
export const API_BASE_URL = `${API_URL}/api`;

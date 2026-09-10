// Centralized Network & Server Host Configuration

// Default local Wi-Fi IP address of the backend server machine
export const DEFAULT_SERVER_IP = "172.20.10.2";
export const DEFAULT_PORT = "5500";

// Temporary Free Tunnel URL (e.g. Cloudflare Tunnel / Pinggy / Ngrok URL)
// Set this to your live tunnel URL when testing on mobile devices over 4G/5G or outside home Wi-Fi!
export const TUNNEL_SERVER_URL = ""; // e.g. "https://xxxx.trycloudflare.com"

/**
 * Deployed backend origin, injected at build time.
 *
 * Required for any hosted deployment (Vercel, Netlify, ...). Vercel is static
 * hosting and cannot run this app's Express + socket.io server, so the API has
 * to live on its own host (Render, Fly, Railway, ...) and be named here.
 *
 * Set it in the Vercel dashboard: Settings -> Environment Variables ->
 *   VITE_API_URL = https://your-chat-backend.onrender.com
 * then redeploy (Vite inlines VITE_* vars at build time, so a rebuild is
 * required -- changing the var alone does nothing to an existing deployment).
 */
const BUILD_TIME_API_URL = (import.meta.env?.VITE_API_URL || "").trim();

const stripTrailingSlash = (url) => url.replace(/\/$/, "");

export const getServerBaseHost = () => {
  // 0. Explicit tunnel URL hardcoded above
  if (TUNNEL_SERVER_URL && TUNNEL_SERVER_URL.trim()) {
    return stripTrailingSlash(TUNNEL_SERVER_URL.trim());
  }

  // 1. Runtime override from the in-app Connection Settings dialog
  const customUrl =
    typeof localStorage !== "undefined" ? localStorage.getItem("custom_server_url") : null;
  if (customUrl && customUrl.trim()) {
    return stripTrailingSlash(customUrl.trim());
  }

  // 2. Free tunnel hostname in the browser (Cloudflare, Localtunnel, Pinggy, ...)
  if (
    typeof window !== "undefined" &&
    (window.location.hostname.includes("lhr.life") ||
      window.location.hostname.includes("trycloudflare.com") ||
      window.location.hostname.includes("pinggy.link") ||
      window.location.hostname.includes("loca.lt"))
  ) {
    return `https://${window.location.hostname}`;
  }

  // 3. Build-time backend origin. Takes precedence over host guessing, so a
  //    deployed build talks to the real API instead of port 5500 of itself.
  if (BUILD_TIME_API_URL) {
    return stripTrailingSlash(BUILD_TIME_API_URL);
  }

  // 4. Native mobile app (Capacitor) with no build-time URL: dev LAN machine
  const isCapacitor =
    typeof window !== "undefined" &&
    (Boolean(window.Capacitor) ||
      window.location.protocol === "capacitor:" ||
      window.location.protocol === "file:");

  if (isCapacitor) {
    return `http://${DEFAULT_SERVER_IP}:${DEFAULT_PORT}`;
  }

  // 5. Browser
  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://localhost:${DEFAULT_PORT}`;
    }

    // A hosted HTTPS page with no VITE_API_URL cannot work: the guess below is
    // http:// (blocked as mixed content) on a port the host does not serve.
    // Fail loudly here rather than as an opaque axios "Network Error".
    if (protocol === "https:") {
      console.error(
        `[config] VITE_API_URL is not set. This build is served from ${protocol}//${hostname} ` +
          `and has no backend origin configured, so API calls cannot succeed. ` +
          `Set VITE_API_URL to your deployed backend and rebuild. ` +
          `See src/lib/config.js.`
      );
    }

    // Mobile browser reaching the dev machine by LAN IP (e.g. 172.20.10.2)
    return `http://${hostname}:${DEFAULT_PORT}`;
  }

  return `http://${DEFAULT_SERVER_IP}:${DEFAULT_PORT}`;
};

export const getApiUrl = () => {
  const base = getServerBaseHost();
  return base.endsWith("/api") ? base : `${base}/api`;
};

export const getSocketUrl = () => {
  const base = getServerBaseHost();
  return base.replace(/\/api$/, "");
};

/** True when the app has an explicitly configured backend origin. */
export const hasConfiguredBackend = () =>
  Boolean(TUNNEL_SERVER_URL.trim() || BUILD_TIME_API_URL);

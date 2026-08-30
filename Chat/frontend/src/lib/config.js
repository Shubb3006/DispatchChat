// Centralized Network & Server Host Configuration

// Default local Wi-Fi IP address of the backend server machine
export const DEFAULT_SERVER_IP = "172.20.10.2";
export const DEFAULT_PORT = "5500";

// Temporary Free Tunnel URL (e.g., Cloudflare Tunnel / Pinggy / Ngrok URL)
// Set this to your live tunnel URL when testing on mobile devices over 4G/5G or outside home Wi-Fi!
export const TUNNEL_SERVER_URL = ""; // e.g. "https://xxxx.trycloudflare.com"

export const getServerBaseHost = () => {
  // 0. Check if temporary tunnel URL is explicitly set above
  if (TUNNEL_SERVER_URL && TUNNEL_SERVER_URL.trim()) {
    return TUNNEL_SERVER_URL.trim().replace(/\/$/, "");
  }

  // 1. Check if user configured a custom server URL in app settings
  const customUrl = typeof localStorage !== "undefined" ? localStorage.getItem("custom_server_url") : null;
  if (customUrl && customUrl.trim()) {
    return customUrl.trim().replace(/\/$/, "");
  }

  // 2. Detect free tunnel hostname in browser (Cloudflare, Localtunnel, Pinggy, etc.)
  if (
    typeof window !== "undefined" &&
    (window.location.hostname.includes("lhr.life") ||
      window.location.hostname.includes("trycloudflare.com") ||
      window.location.hostname.includes("pinggy.link") ||
      window.location.hostname.includes("loca.lt"))
  ) {
    return `https://${window.location.hostname}`;
  }

  // 3. Detect Capacitor Native Mobile App (Android/iOS)
  const isCapacitor =
    typeof window !== "undefined" &&
    (Boolean(window.Capacitor) ||
      window.location.protocol === "capacitor:" ||
      window.location.protocol === "file:");

  if (isCapacitor) {
    return `http://${DEFAULT_SERVER_IP}:${DEFAULT_PORT}`;
  }

  // 4. Browser environment (Mobile browser or Desktop browser)
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://localhost:${DEFAULT_PORT}`;
    }
    // If accessed via mobile phone browser using computer IP address (e.g. 172.20.10.2)
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

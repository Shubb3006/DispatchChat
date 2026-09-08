/**
 * Real Border Wait Times from CBP (U.S. Customs and Border Protection)
 * API: https://bwt.cbp.gov/api/waittimes
 * In-memory cache: 5 minutes
 */

let cachedBorderData = null;
let cacheExpiresAt = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Map CBP port names/codes to our internal port definitions
 */
const CBP_TO_LOCAL_MAPPING = {
  // Detroit Ambassador Bridge
  "detroit": { localName: "Detroit Ambassador Bridge", portCode: "3801" },
  "ambassador": { localName: "Detroit Ambassador Bridge", portCode: "3801" },
  "windsor": { localName: "Detroit Ambassador Bridge", portCode: "3801" },

  // Port Huron Blue Water Bridge
  "port huron": { localName: "Port Huron Blue Water Bridge", portCode: "3802" },
  "sarnia": { localName: "Port Huron Blue Water Bridge", portCode: "3802" },
  "bluewater": { localName: "Port Huron Blue Water Bridge", portCode: "3802" },

  // Buffalo Peace Bridge
  "buffalo": { localName: "Buffalo Peace Bridge", portCode: "0901" },
  "peace bridge": { localName: "Buffalo Peace Bridge", portCode: "0901" },
  "fort erie": { localName: "Buffalo Peace Bridge", portCode: "0901" },

  // Niagara Lewiston-Queenston
  "lewiston": { localName: "Niagara Lewiston-Queenston Bridge", portCode: "0902" },
  "queenston": { localName: "Niagara Lewiston-Queenston Bridge", portCode: "0902" },

  // Champlain - St. Bernard de Lacolle
  "champlain": { localName: "Champlain - St. Bernard de Lacolle", portCode: "0712" },
  "lacolle": { localName: "Champlain - St. Bernard de Lacolle", portCode: "0712" },

  // Blaine Pacific Highway
  "blaine": { localName: "Blaine Pacific Highway", portCode: "3004" },
  "pacific highway": { localName: "Blaine Pacific Highway", portCode: "3004" },

  // Pembina / Emerson
  "pembina": { localName: "Pembina / Emerson", portCode: "3401" },
  "emerson": { localName: "Pembina / Emerson", portCode: "3401" },
};

/**
 * Normalize port name for matching
 */
const normalizePortName = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "");
};

/**
 * Find local port mapping from CBP data
 */
const findLocalPort = (cbpPortName) => {
  const normalized = normalizePortName(cbpPortName);

  for (const [key, mapping] of Object.entries(CBP_TO_LOCAL_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return mapping;
    }
  }

  // Fallback: default to Detroit
  return { localName: "Detroit Ambassador Bridge", portCode: "3801" };
};

/**
 * Convert CBP wait time delay status to our status
 */
const mapDelayStatus = (cbpStatus) => {
  if (!cbpStatus) return "NORMAL";
  const upper = String(cbpStatus).toUpperCase();
  if (upper.includes("SEVERE") || upper.includes("CRITICAL")) return "SEVERE";
  if (upper.includes("MODERATE") || upper.includes("WARNING")) return "MODERATE";
  return "NORMAL";
};

/**
 * Fetch real border wait times from CBP API
 */
export async function fetchRealBorderWaitTimes() {
  // Return cached data if still valid
  if (cachedBorderData && cacheExpiresAt && Date.now() < cacheExpiresAt) {
    return cachedBorderData;
  }

  try {
    console.log("[BORDER_WAIT] Fetching from CBP API...");
    const res = await fetch("https://bwt.cbp.gov/api/waittimes", {
      method: "GET",
      headers: { Accept: "application/json" },
      timeout: 8000,
    });

    if (!res.ok) {
      throw new Error(`CBP API HTTP ${res.status}`);
    }

    const data = await res.json();

    // Transform CBP data to our format
    const ports = (data.ports || [])
      .map((cbpPort) => {
        const local = findLocalPort(cbpPort.name || cbpPort.port || "");

        // Parse commercial and FAST lane wait times
        const commercialWait = Math.max(
          0,
          parseInt(cbpPort.commercialLaneWait || cbpPort.wait || "0", 10)
        );
        const fastWait = Math.max(
          0,
          parseInt(cbpPort.fastLaneWait || "0", 10)
        );

        return {
          portCode: local.portCode,
          portName: local.localName,
          jurisdiction: cbpPort.jurisdiction || `US CBP / CBSA (${cbpPort.state || "US"})`,
          highwayCorridor: cbpPort.highwayCorridor || "Commercial Border Route",
          commercialLanesOpen: parseInt(cbpPort.commercialLanesOpen || "4", 10),
          fastLanesOpen: parseInt(cbpPort.fastLanesOpen || "1", 10),
          currentWaitMinutes: commercialWait,
          fastLaneWaitMinutes: fastWait,
          delayStatus: mapDelayStatus(cbpPort.delayStatus),
          delayTrend: cbpPort.delayTrend || "STABLE",
          peakHours: cbpPort.peakHours || "Variable",
          fastLaneEligible: true,
          lastUpdated: new Date().toISOString(),
          source: "CBP",
        };
      });

    // If CBP provides empty or partial list, fill gaps with zeros + unavailable source
    const localCodes = new Set(ports.map((p) => p.portCode));
    const CORE_PORTS = ["3801", "3802", "0901", "0902", "0712", "3004", "3401"];

    for (const portCode of CORE_PORTS) {
      if (!localCodes.has(portCode)) {
        const fallback = {
          "3801": { portName: "Detroit Ambassador Bridge", jurisdiction: "US CBP / CBSA (Detroit, MI / Windsor, ON)", highwayCorridor: "I-75 / Highway 401" },
          "3802": { portName: "Port Huron Blue Water Bridge", jurisdiction: "US CBP / CBSA (Port Huron, MI / Point Edward, ON)", highwayCorridor: "I-94 / I-69 / Highway 402" },
          "0901": { portName: "Buffalo Peace Bridge", jurisdiction: "US CBP / CBSA (Buffalo, NY / Fort Erie, ON)", highwayCorridor: "I-190 / Queen Elizabeth Way (QEW)" },
          "0902": { portName: "Niagara Lewiston-Queenston Bridge", jurisdiction: "US CBP / CBSA (Lewiston, NY / Queenston, ON)", highwayCorridor: "I-190 / Highway 405" },
          "0712": { portName: "Champlain - St. Bernard de Lacolle", jurisdiction: "US CBP / CBSA (Champlain, NY / Lacolle, QC)", highwayCorridor: "Interstate 87 / Autoroute 15" },
          "3004": { portName: "Blaine Pacific Highway", jurisdiction: "US CBP / CBSA (Blaine, WA / Surrey, BC)", highwayCorridor: "Interstate 5 / Highway 99" },
          "3401": { portName: "Pembina / Emerson", jurisdiction: "US CBP / CBSA (Pembina, ND / Emerson, MB)", highwayCorridor: "Interstate 29 / Highway 75" },
        };

        const info = fallback[portCode] || {};
        ports.push({
          portCode,
          portName: info.portName || "Border Crossing",
          jurisdiction: info.jurisdiction || "US CBP / CBSA",
          highwayCorridor: info.highwayCorridor || "Commercial Route",
          commercialLanesOpen: 0,
          fastLanesOpen: 0,
          currentWaitMinutes: 0,
          fastLaneWaitMinutes: 0,
          delayStatus: "NORMAL",
          delayTrend: "STABLE",
          peakHours: "N/A",
          fastLaneEligible: false,
          lastUpdated: new Date().toISOString(),
          source: "unavailable",
        });
      }
    }

    cachedBorderData = ports;
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;

    console.log(`[BORDER_WAIT] Cached ${ports.length} ports for 5 minutes`);
    return ports;
  } catch (error) {
    console.warn(`[BORDER_WAIT] Fetch failed: ${error.message}. Using zero-wait fallback.`);

    // Return empty list with unavailable source marker
    const fallbackPorts = [
      {
        portCode: "3801",
        portName: "Detroit Ambassador Bridge",
        jurisdiction: "US CBP / CBSA (Detroit, MI / Windsor, ON)",
        highwayCorridor: "I-75 / Highway 401",
        commercialLanesOpen: 0,
        fastLanesOpen: 0,
        currentWaitMinutes: 0,
        fastLaneWaitMinutes: 0,
        delayStatus: "NORMAL",
        delayTrend: "STABLE",
        peakHours: "N/A",
        fastLaneEligible: false,
        lastUpdated: new Date().toISOString(),
        source: "unavailable",
      },
      {
        portCode: "3802",
        portName: "Port Huron Blue Water Bridge",
        jurisdiction: "US CBP / CBSA (Port Huron, MI / Point Edward, ON)",
        highwayCorridor: "I-94 / I-69 / Highway 402",
        commercialLanesOpen: 0,
        fastLanesOpen: 0,
        currentWaitMinutes: 0,
        fastLaneWaitMinutes: 0,
        delayStatus: "NORMAL",
        delayTrend: "STABLE",
        peakHours: "N/A",
        fastLaneEligible: false,
        lastUpdated: new Date().toISOString(),
        source: "unavailable",
      },
      {
        portCode: "0901",
        portName: "Buffalo Peace Bridge",
        jurisdiction: "US CBP / CBSA (Buffalo, NY / Fort Erie, ON)",
        highwayCorridor: "I-190 / Queen Elizabeth Way (QEW)",
        commercialLanesOpen: 0,
        fastLanesOpen: 0,
        currentWaitMinutes: 0,
        fastLaneWaitMinutes: 0,
        delayStatus: "NORMAL",
        delayTrend: "STABLE",
        peakHours: "N/A",
        fastLaneEligible: false,
        lastUpdated: new Date().toISOString(),
        source: "unavailable",
      },
      {
        portCode: "0902",
        portName: "Niagara Lewiston-Queenston Bridge",
        jurisdiction: "US CBP / CBSA (Lewiston, NY / Queenston, ON)",
        highwayCorridor: "I-190 / Highway 405",
        commercialLanesOpen: 0,
        fastLanesOpen: 0,
        currentWaitMinutes: 0,
        fastLaneWaitMinutes: 0,
        delayStatus: "NORMAL",
        delayTrend: "STABLE",
        peakHours: "N/A",
        fastLaneEligible: false,
        lastUpdated: new Date().toISOString(),
        source: "unavailable",
      },
      {
        portCode: "0712",
        portName: "Champlain - St. Bernard de Lacolle",
        jurisdiction: "US CBP / CBSA (Champlain, NY / Lacolle, QC)",
        highwayCorridor: "Interstate 87 / Autoroute 15",
        commercialLanesOpen: 0,
        fastLanesOpen: 0,
        currentWaitMinutes: 0,
        fastLaneWaitMinutes: 0,
        delayStatus: "NORMAL",
        delayTrend: "STABLE",
        peakHours: "N/A",
        fastLaneEligible: false,
        lastUpdated: new Date().toISOString(),
        source: "unavailable",
      },
      {
        portCode: "3004",
        portName: "Blaine Pacific Highway",
        jurisdiction: "US CBP / CBSA (Blaine, WA / Surrey, BC)",
        highwayCorridor: "Interstate 5 / Highway 99",
        commercialLanesOpen: 0,
        fastLanesOpen: 0,
        currentWaitMinutes: 0,
        fastLaneWaitMinutes: 0,
        delayStatus: "NORMAL",
        delayTrend: "STABLE",
        peakHours: "N/A",
        fastLaneEligible: false,
        lastUpdated: new Date().toISOString(),
        source: "unavailable",
      },
      {
        portCode: "3401",
        portName: "Pembina / Emerson",
        jurisdiction: "US CBP / CBSA (Pembina, ND / Emerson, MB)",
        highwayCorridor: "Interstate 29 / Highway 75",
        commercialLanesOpen: 0,
        fastLanesOpen: 0,
        currentWaitMinutes: 0,
        fastLaneWaitMinutes: 0,
        delayStatus: "NORMAL",
        delayTrend: "STABLE",
        peakHours: "N/A",
        fastLaneEligible: false,
        lastUpdated: new Date().toISOString(),
        source: "unavailable",
      },
    ];

    cachedBorderData = fallbackPorts;
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;

    return fallbackPorts;
  }
}

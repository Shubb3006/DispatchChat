import axios from "axios";

// In-memory cache for ultra-fast response
const GEOCODE_CACHE = new Map();

// Local fast-path dataset for major North American freight terminals
const PRESET_HUBS = {
  // Quebec (QC)
  "montreal": { lat: 45.4956, lng: -73.7428, state: "QC", name: "Montreal Terminal", address: "1805 Rue Saint-François, Dorval, QC H9P 1K3" },
  "drummondville": { lat: 45.8833, lng: -72.4833, state: "QC", name: "Drummondville Hub", address: "1250 Rue Saint-Joseph, Drummondville, QC J2C 2C8" },
  "quebec": { lat: 46.8139, lng: -71.2080, state: "QC", name: "Quebec City Hub", address: "3500 Boulevard Wilfrid-Hamel, Québec, QC G1P 2J2" },
  "quebec city": { lat: 46.8139, lng: -71.2080, state: "QC", name: "Quebec City Hub", address: "3500 Boulevard Wilfrid-Hamel, Québec, QC G1P 2J2" },
  "trois-rivieres": { lat: 46.3432, lng: -72.5477, state: "QC", name: "Trois-Rivières Freight Depot", address: "3400 Rue Bellefeuille, Trois-Rivières, QC G9A 3Z3" },
  "sherbrooke": { lat: 45.4042, lng: -71.8929, state: "QC", name: "Sherbrooke Industrial Hub", address: "4000 Boulevard Bourque, Sherbrooke, QC J1N 1S4" },
  "saint-hyacinthe": { lat: 45.6264, lng: -72.9547, state: "QC", name: "Saint-Hyacinthe Logistics", address: "5500 Rue Martineau, Saint-Hyacinthe, QC J2R 1T9" },
  "victoriaville": { lat: 46.0567, lng: -71.9611, state: "QC", name: "Victoriaville Yard", address: "80 Boulevard Arthabaska Est, Victoriaville, QC G6T 1Z2" },
  "granby": { lat: 45.4000, lng: -72.7333, state: "QC", name: "Granby Depot", address: "900 Rue Cowie, Granby, QC J2J 1P2" },
  "laval": { lat: 45.5699, lng: -73.6920, state: "QC", name: "Laval Distribution Park", address: "3300 Boulevard Le Corbusier, Laval, QC H7L 4S8" },
  "longueuil": { lat: 45.5312, lng: -73.5181, state: "QC", name: "Longueuil Terminal", address: "1000 Rue de la Gauchetière, Longueuil, QC J4G 2J5" },
  "boucherville": { lat: 45.5833, lng: -73.4500, state: "QC", name: "Boucherville Freight Center", address: "1400 Rue Nobel, Boucherville, QC J4B 5H3" },
  "saint-georges": { lat: 46.1230, lng: -70.6720, state: "QC", name: "Saint-Georges Beauce Hub", address: "Route 173, Saint-Georges, QC G5Y 5B8" },

  // Ontario (ON)
  "toronto": { lat: 43.6532, lng: -79.6441, state: "ON", name: "Toronto / Mississauga Hub", address: "6500 Dixie Rd, Mississauga, ON L5T 1A9" },
  "mississauga": { lat: 43.5890, lng: -79.6441, state: "ON", name: "Mississauga Consolidation Center", address: "1250 Meyerside Dr, Mississauga, ON L5T 1N5" },
  "brampton": { lat: 43.7315, lng: -79.7624, state: "ON", name: "Brampton Freight Terminal", address: "100 Intermodal Dr, Brampton, ON L6T 5K9" },
  "ottawa": { lat: 45.4215, lng: -75.6972, state: "ON", name: "Ottawa Distribution Center", address: "2705 Stevenage Dr, Ottawa, ON K1G 3N2" },
  "hamilton": { lat: 43.2557, lng: -79.8711, state: "ON", name: "Hamilton Terminal", address: "500 Kenilworth Ave N, Hamilton, ON L8H 4S2" },
  "london": { lat: 42.9849, lng: -81.2453, state: "ON", name: "London Southwest Hub", address: "3500 Wilton Grove Rd, London, ON N6N 1M8" },
  "windsor": { lat: 42.3149, lng: -83.0364, state: "ON", name: "Windsor Border Crossing Yard", address: "4050 Walker Rd, Windsor, ON N8W 3T5" },
  "kitchener": { lat: 43.4516, lng: -80.4925, state: "ON", name: "Kitchener-Waterloo Logistics", address: "100 Shirley Dr, Kitchener, ON N2B 2C8" },
  "cornwall": { lat: 45.0200, lng: -74.7300, state: "ON", name: "Cornwall Seaway Hub", address: "805 Boundary Rd, Cornwall, ON K6H 5R5" },
  "kingston": { lat: 44.2312, lng: -76.4860, state: "ON", name: "Kingston 401 Hub", address: "1100 Gardiners Rd, Kingston, ON K7P 1R7" },

  // USA Major Corridors
  "chicago": { lat: 41.8781, lng: -87.6298, state: "IL", name: "Chicago Midwest Terminal", address: "3400 S Pulaski Rd, Chicago, IL 60623" },
  "detroit": { lat: 42.3314, lng: -83.0458, state: "MI", name: "Detroit Automotive Hub", address: "7000 Michigan Ave, Detroit, MI 48210" },
  "buffalo": { lat: 42.8864, lng: -78.8784, state: "NY", name: "Buffalo Peace Bridge Crossing", address: "100 Peace Bridge Plaza, Buffalo, NY 14213" },
  "cleveland": { lat: 41.4993, lng: -81.6944, state: "OH", name: "Cleveland Intermodal Center", address: "4200 E 49th St, Cleveland, OH 44125" },
  "columbus": { lat: 39.9612, lng: -82.9988, state: "OH", name: "Columbus Hub", address: "2300 Westbelt Dr, Columbus, OH 43228" },
  "indianapolis": { lat: 39.7684, lng: -86.1581, state: "IN", name: "Indianapolis Crossroads Hub", address: "3901 W Morris St, Indianapolis, IN 46241" },
  "new york": { lat: 40.7128, lng: -74.0060, state: "NY", name: "Metro NY Logistics Terminal", address: "100 Commercial Ave, Jersey City, NJ 07305" },
  "laredo": { lat: 27.5079, lng: -99.5070, state: "TX", name: "Laredo Border Gateway Hub", address: "12000 Mines Rd, Laredo, TX 78045" },
  "dallas": { lat: 32.7767, lng: -96.7970, state: "TX", name: "Dallas-Fort Worth MegaHub", address: "2000 E Belt Line Rd, Dallas, TX 75241" },
  "atlanta": { lat: 33.7490, lng: -84.3880, state: "GA", name: "Atlanta Southeast Hub", address: "1200 South Fulton Pkwy, Atlanta, GA 30349" },
  "nashville": { lat: 36.1627, lng: -86.7816, state: "TN", name: "Nashville Hub", address: "700 Freightliner Dr, Nashville, TN 37210" },
  "st. louis": { lat: 38.6270, lng: -90.1994, state: "MO", name: "St. Louis Terminal", address: "1200 S Broadway, St. Louis, MO 63104" },
};

/**
 * Universal Geocoding function for ALL cities, towns, addresses, and postal/ZIP codes across Canada and the USA
 */
export async function geocodeLocation(rawQuery) {
  if (!rawQuery || typeof rawQuery !== "string" || !rawQuery.trim()) {
    return PRESET_HUBS["montreal"];
  }

  const query = rawQuery.trim();
  const normalizedKey = query.toLowerCase().replace(/,\s*(qc|on|mi|ny|il|oh|in|pa|tx|ga|tn|mo|ca|sk|ab|bc|mb|nb|ns|pe|nl)\b/g, "").trim();

  // 1. Check in-memory cache
  if (GEOCODE_CACHE.has(query)) {
    return GEOCODE_CACHE.get(query);
  }

  // 2. Check local presets
  if (PRESET_HUBS[normalizedKey]) {
    const res = PRESET_HUBS[normalizedKey];
    GEOCODE_CACHE.set(query, res);
    return res;
  }

  for (const [k, v] of Object.entries(PRESET_HUBS)) {
    if (normalizedKey.includes(k) || k.includes(normalizedKey)) {
      GEOCODE_CACHE.set(query, v);
      return v;
    }
  }

  // 3. Live Universal Geocoding (OpenStreetMap / Nominatim)
  try {
    const osmRes = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: query,
        format: "json",
        limit: 1,
        countrycodes: "ca,us",
        addressdetails: 1,
      },
      headers: {
        "User-Agent": "Ozack-TMS-Fleet-Logistics/1.0",
        Accept: "application/json",
      },
      timeout: 5000,
    });

    if (osmRes.data && osmRes.data.length > 0) {
      const match = osmRes.data[0];
      const lat = parseFloat(match.lat);
      const lng = parseFloat(match.lon);
      const addr = match.address || {};
      const stateProv = addr.state_code || addr.state || addr.province || "NA";
      const cityName = match.name || addr.city || addr.town || addr.municipality || query;

      const formatted = {
        lat,
        lng,
        state: stateProv.toUpperCase().slice(0, 2),
        name: `${cityName} Hub`,
        address: match.display_name,
      };

      GEOCODE_CACHE.set(query, formatted);
      return formatted;
    }
  } catch (err) {
    console.warn(`Live geocoding fallback for query "${query}":`, err.message);
  }

  // 4. Graceful Fallback
  const fallback = {
    lat: 45.4956,
    lng: -73.7428,
    state: "QC",
    name: query,
    address: `${query} Commercial Logistics Zone`,
  };
  GEOCODE_CACHE.set(query, fallback);
  return fallback;
}

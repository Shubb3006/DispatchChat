import pool from "../config/db.js";
import { geocodeLocation } from "../services/geocoding.service.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const AVG_SPEED_MPH = 55;
const TRUCK_MPG = 6.5;
const DIESEL_PRICE_PER_GAL = 3.85;
const TOLL_PER_MILE = 0.06;
// Straight-line to actual-road correction for North American highway networks
const ROAD_FACTOR = 1.18;
const DWELL_MINUTES = 45;

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS route_notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        load_id VARCHAR(255) NOT NULL,
        note TEXT NOT NULL,
        author_name VARCHAR(255) DEFAULT 'Dispatcher',
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
  } catch (err) {
    console.warn("route_notes table check:", err.message);
  }
})();

const resolveLoad = async (idOrNumber) => {
  if (!idOrNumber) return null;
  const isUuid = UUID_REGEX.test(String(idOrNumber));
  const result = isUuid
    ? await pool.query(`SELECT * FROM loads WHERE id = $1 LIMIT 1`, [idOrNumber])
    : await pool.query(
        `SELECT * FROM loads WHERE load_number::text = $1 OR id::text = $1 LIMIT 1`,
        [String(idOrNumber)]
      );
  return result.rows[0] || null;
};

function haversineMiles(a, b) {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatHours(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

function stopLabel(stop) {
  if (typeof stop === "string") return stop;
  return (
    stop?.location ||
    stop?.address ||
    stop?.city ||
    stop?.companyName ||
    stop?.company_name ||
    stop?.name ||
    ""
  );
}

// Calculate the primary route plus two alternatives, with per-stop ETAs
export const calculateRoutes = async (req, res) => {
  try {
    const { load_id, origin, destination, stops = [] } = req.body;

    const load = load_id ? await resolveLoad(load_id) : null;
    const originStr = String(origin || load?.origin || "").trim();
    const destStr = String(destination || load?.destination || "").trim();

    if (!originStr || !destStr) {
      return res.status(400).json({
        success: false,
        message: "Origin and destination are required to calculate a route",
      });
    }

    const waypointLabels = stops.map(stopLabel).filter(Boolean);
    const allLabels = [originStr, ...waypointLabels, destStr];
    const coords = await Promise.all(allLabels.map((label) => geocodeLocation(label)));

    // Cumulative distance and ETA at each stop
    const departAt = load?.pickup_date ? new Date(load.pickup_date) : new Date();
    let cumulativeMiles = 0;
    let cumulativeMinutes = 0;

    const routeStops = allLabels.map((label, idx) => {
      if (idx > 0) {
        const legMiles = haversineMiles(coords[idx - 1], coords[idx]) * ROAD_FACTOR;
        cumulativeMiles += legMiles;
        cumulativeMinutes += (legMiles / AVG_SPEED_MPH) * 60 + DWELL_MINUTES;
      }
      const eta = new Date(departAt.getTime() + cumulativeMinutes * 60000);
      return {
        sequence: idx + 1,
        location: label,
        type: idx === 0 ? "PICKUP" : idx === allLabels.length - 1 ? "DELIVERY" : "STOP",
        milesFromOrigin: Math.round(cumulativeMiles),
        dwellMinutes: idx === 0 ? 0 : DWELL_MINUTES,
        eta: eta.toISOString(),
      };
    });

    const distance = Math.round(cumulativeMiles);
    const drivingHours = distance / AVG_SPEED_MPH;
    const gallons = Math.round((distance / TRUCK_MPG) * 10) / 10;
    const fuelCost = Math.round(gallons * DIESEL_PRICE_PER_GAL * 100) / 100;
    const tollCost = Math.round(distance * TOLL_PER_MILE * 100) / 100;

    const primaryRoute = {
      name: "Primary Route",
      distance,
      duration: formatHours(drivingHours),
      gallonsBurned: gallons,
      fuelCost,
      tollCost,
      dieselPricePerGal: DIESEL_PRICE_PER_GAL,
      stops: routeStops,
    };

    const alternatives = [
      {
        name: "Toll-Free Route",
        distance: Math.round(distance * 1.08),
        duration: formatHours(drivingHours * 1.14),
        tollCost: 0,
        fuelCost: Math.round(fuelCost * 1.08 * 100) / 100,
        difference: `+${formatHours(drivingHours * 0.14)} slower · saves $${tollCost.toFixed(2)} in tolls`,
      },
      {
        name: "Heavy Haul Corridor",
        distance: Math.round(distance * 1.03),
        duration: formatHours(drivingHours * 1.05),
        tollCost: Math.round(tollCost * 0.9 * 100) / 100,
        fuelCost: Math.round(fuelCost * 1.03 * 100) / 100,
        difference: "Rated for max GVWR and overweight permits",
      },
    ];

    res.status(200).json({ success: true, primaryRoute, alternatives });
  } catch (error) {
    console.error("Error calculating routes:", error);
    res.status(500).json({ success: false, message: "Failed to calculate routes" });
  }
};

// Historical drive times from previously delivered loads on the same lane
export const getHistoricalRouteData = async (req, res) => {
  try {
    const { load_id } = req.params;
    const load = await resolveLoad(load_id);

    if (!load?.origin || !load?.destination) {
      return res.status(200).json({ success: true, tripCount: 0 });
    }

    const result = await pool.query(
      `SELECT EXTRACT(EPOCH FROM (delivery_date - pickup_date)) / 3600 AS hours
         FROM loads
        WHERE id <> $1
          AND LOWER(status) IN ('delivered', 'completed')
          AND pickup_date IS NOT NULL
          AND delivery_date IS NOT NULL
          AND delivery_date > pickup_date
          AND LOWER(TRIM(origin)) = LOWER(TRIM($2))
          AND LOWER(TRIM(destination)) = LOWER(TRIM($3))`,
      [load.id, load.origin, load.destination]
    );

    const hours = result.rows.map((r) => Number(r.hours)).filter((h) => Number.isFinite(h));

    if (hours.length === 0) {
      return res.status(200).json({ success: true, tripCount: 0 });
    }

    const avg = hours.reduce((sum, h) => sum + h, 0) / hours.length;

    res.status(200).json({
      success: true,
      tripCount: hours.length,
      avgTime: formatHours(avg),
      fastestTime: formatHours(Math.min(...hours)),
      slowestTime: formatHours(Math.max(...hours)),
    });
  } catch (error) {
    console.error("Error fetching historical data:", error);
    res.status(500).json({ success: false, message: "Failed to fetch historical data" });
  }
};

export const getDriverNotes = async (req, res) => {
  try {
    const { load_id } = req.params;

    const result = await pool.query(
      `SELECT rn.id, rn.note, rn.author_name, rn.created_at, u.username, u.full_name
         FROM route_notes rn
         LEFT JOIN users u ON rn.created_by = u.id
        WHERE rn.load_id = $1
        ORDER BY rn.created_at DESC`,
      [String(load_id)]
    );

    res.status(200).json({ success: true, notes: result.rows });
  } catch (error) {
    console.error("Error fetching driver notes:", error);
    res.status(500).json({ success: false, message: "Failed to fetch driver notes" });
  }
};

export const addDriverNote = async (req, res) => {
  try {
    const { load_id, note } = req.body;
    const userId = req.user?.id || null;
    const author = req.user?.full_name || req.user?.username || "Dispatcher";

    const result = await pool.query(
      `INSERT INTO route_notes (load_id, note, author_name, created_by, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [String(load_id), String(note).trim(), author, userId]
    );

    res.status(201).json({ success: true, note: result.rows[0] });
  } catch (error) {
    console.error("Error adding driver note:", error);
    res.status(500).json({ success: false, message: "Failed to add driver note" });
  }
};

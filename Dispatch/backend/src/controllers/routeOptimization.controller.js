import pool from "../config/db.js";

// Calculate primary route and alternatives
export const calculateRoutes = async (req, res) => {
  try {
    const { load_id, origin, destination, stops } = req.body;

    // Primary route calculation (simplified)
    const primaryRoute = {
      distance: calculateDistance(origin, destination),
      duration: calculateDuration(origin, destination),
      stops: formatStops([origin, ...stops, destination]),
      tollCost: Math.random() * 50 + 10, // Placeholder
      fuelCost: (calculateDistance(origin, destination) / 6 * 3.5).toFixed(2), // 6 mpg avg, $3.50/gal
    };

    // Alternative routes (simplified variations)
    const alternatives = [
      {
        distance: (primaryRoute.distance * 0.95).toFixed(1),
        duration: calculateDuration(origin, destination, 0.95),
        time_saved: '15 min',
        tollCost: (primaryRoute.tollCost * 0.8).toFixed(2),
      },
      {
        distance: (primaryRoute.distance * 1.05).toFixed(1),
        duration: calculateDuration(origin, destination, 1.05),
        time_saved: null,
        tollCost: (primaryRoute.tollCost * 0.6).toFixed(2),
      },
    ];

    res.status(200).json({
      success: true,
      primaryRoute,
      alternatives,
    });
  } catch (error) {
    console.error("Error calculating routes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate routes"
    });
  }
};

// Get historical data for a route
export const getHistoricalRouteData = async (req, res) => {
  try {
    const { load_id } = req.params;

    // Query historical trips with same origin/destination
    const result = await pool.query(
      `SELECT
        AVG(EXTRACT(EPOCH FROM (ended_at - started_at))/3600) as avg_hours,
        MIN(EXTRACT(EPOCH FROM (ended_at - started_at))/3600) as min_hours,
        MAX(EXTRACT(EPOCH FROM (ended_at - started_at))/3600) as max_hours,
        COUNT(*) as trip_count
       FROM trips
       WHERE origin_city = (SELECT origin FROM loads WHERE id = $1)
       AND destination_city = (SELECT destination FROM loads WHERE id = $1)
       AND ended_at IS NOT NULL
       AND status = 'delivered'`,
      [load_id]
    );

    const data = result.rows[0];

    res.status(200).json({
      success: true,
      avgTime: data.avg_hours ? `${Math.round(data.avg_hours)}h` : 'N/A',
      fastestTime: data.min_hours ? `${Math.round(data.min_hours)}h` : 'N/A',
      slowestTime: data.max_hours ? `${Math.round(data.max_hours)}h` : 'N/A',
      tripCount: parseInt(data.trip_count) || 0,
    });
  } catch (error) {
    console.error("Error fetching historical data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch historical data"
    });
  }
};

// Get driver notes for a load
export const getDriverNotes = async (req, res) => {
  try {
    const { load_id } = req.params;

    const result = await pool.query(
      `SELECT rn.id, rn.note, rn.created_at, u.username as driver_name
       FROM route_notes rn
       LEFT JOIN users u ON rn.created_by = u.id
       WHERE rn.load_id = $1
       ORDER BY rn.created_at DESC`,
      [load_id]
    );

    res.status(200).json({
      success: true,
      notes: result.rows
    });
  } catch (error) {
    console.error("Error fetching driver notes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch driver notes"
    });
  }
};

// Add driver note
export const addDriverNote = async (req, res) => {
  try {
    const { load_id, note } = req.body;
    const userId = req.user?.id;

    const result = await pool.query(
      `INSERT INTO route_notes (load_id, note, created_by, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [load_id, note, userId]
    );

    res.status(201).json({
      success: true,
      note: result.rows[0]
    });
  } catch (error) {
    console.error("Error adding driver note:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add driver note"
    });
  }
};

// Helper functions
function calculateDistance(origin, destination) {
  // Placeholder - would use real mapping API
  const distanceMatrix = {
    'brampton': { 'houston': 1850, 'mississauga': 25 },
    'houston': { 'mississauga': 1875, 'brampton': 1850 },
    'mississauga': { 'houston': 1875, 'brampton': 25 },
  };

  const from = origin.split(',')[0].toLowerCase();
  const to = destination.split(',')[0].toLowerCase();

  return distanceMatrix[from]?.[to] || Math.random() * 2000 + 500;
}

function calculateDuration(origin, destination, factor = 1) {
  const distance = calculateDistance(origin, destination);
  const hours = Math.round((distance / 65) * factor); // 65 mph avg
  return `${hours}h ${Math.round((distance % 65) / 65 * 60)}m`;
}

function formatStops(locations) {
  return locations.map((loc, idx) => ({
    location: loc,
    eta: calculateETA(idx),
    dwellTime: idx === 0 || idx === locations.length - 1 ? null : 30,
  }));
}

function calculateETA(stopIndex) {
  const now = new Date();
  now.setHours(now.getHours() + (stopIndex * 5)); // Simplified
  return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

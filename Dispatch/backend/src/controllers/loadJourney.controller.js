import pool from "../config/db.js";

export const recordLoadMovement = async (req, res) => {
  try {
    const { load_id, from_location, to_location, driver_id, status, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO load_journey (load_id, from_location, to_location, driver_id, status, notes, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [load_id, from_location, to_location, driver_id, status, notes || null]
    );

    res.status(201).json({
      success: true,
      journey: result.rows[0]
    });
  } catch (error) {
    console.error("Error recording load movement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record load movement"
    });
  }
};

export const getLoadJourney = async (req, res) => {
  try {
    const { load_id } = req.params;

    const result = await pool.query(
      `SELECT lj.*, d.driver_code, d.user_id
       FROM load_journey lj
       LEFT JOIN drivers d ON lj.driver_id = d.id
       WHERE lj.load_id = $1
       ORDER BY lj.timestamp ASC`,
      [load_id]
    );

    res.status(200).json({
      success: true,
      journey: result.rows
    });
  } catch (error) {
    console.error("Error fetching load journey:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch load journey"
    });
  }
};

export const getLoadsAtFreightForce = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT lj.load_id, l.load_number, l.origin, l.destination,
              COUNT(*) as stops_count, MAX(lj.timestamp) as last_update
       FROM load_journey lj
       JOIN loads l ON lj.load_id = l.id
       WHERE lj.status = 'at_freight_force'
       GROUP BY lj.load_id, l.load_number, l.origin, l.destination
       ORDER BY lj.timestamp DESC`
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      loads: result.rows
    });
  } catch (error) {
    console.error("Error fetching freight force loads:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch freight force loads"
    });
  }
};

export const updateLoadStatus = async (req, res) => {
  try {
    const { load_id, status } = req.body;

    const result = await pool.query(
      `INSERT INTO load_journey (load_id, status, notes, timestamp)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [load_id, status, `Status updated to ${status}`]
    );

    res.status(200).json({
      success: true,
      journey: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating load status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update load status"
    });
  }
};

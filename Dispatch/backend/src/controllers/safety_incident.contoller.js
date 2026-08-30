import pool from "../config/db.js";

// Ensure table exists helper
const ensureSafetyTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS safety_incidents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
          driver_name VARCHAR(100),
          truck_number VARCHAR(50),
          type VARCHAR(50) DEFAULT 'emergency_sos',
          severity VARCHAR(30) DEFAULT 'high',
          description TEXT,
          location TEXT,
          coordinates JSONB,
          status VARCHAR(50) DEFAULT 'pending_review',
          resolved_at TIMESTAMP,
          resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
          resolution_notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.warn("Safety incidents table check:", err.message);
  }
};

// Get Safety Incidents
export const getSafetyIncidents = async (req, res) => {
  await ensureSafetyTable();
  try {
    const { driver_id, status, severity, type } = req.query;

    let query = `SELECT * FROM safety_incidents WHERE 1=1`;
    const params = [];

    if (driver_id) {
      params.push(driver_id);
      query += ` AND driver_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (severity) {
      params.push(severity);
      query += ` AND severity = $${params.length}`;
    }
    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ success: true, incidents: result.rows });
  } catch (error) {
    console.error("Error fetching safety incidents:", error);
    res.status(500).json({ success: false, message: "Server Error fetching safety incidents" });
  }
};

// Get single Safety Incident
export const getSafetyIncidentById = async (req, res) => {
  await ensureSafetyTable();
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM safety_incidents WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Incident record not found" });
    }
    res.json({ success: true, incident: result.rows[0] });
  } catch (error) {
    console.error("Error fetching safety incident:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Create / Report Safety Incident or Trigger SOS
export const createSafetyIncident = async (req, res) => {
  await ensureSafetyTable();
  try {
    const {
      driver_id,
      driverId,
      driver_name,
      driverName,
      truck_number,
      truckNumber,
      type,
      severity,
      description,
      location,
      coordinates
    } = req.body;

    const resolvedDriverId = driver_id || driverId || null;
    const resolvedDriverName = driver_name || driverName || "Marcus Vance";
    const resolvedTruckNum = truck_number || truckNumber || "TRK-102";
    const resolvedType = type || "emergency_sos";
    const resolvedSeverity = severity || "high";

    const result = await pool.query(
      `INSERT INTO safety_incidents (
        driver_id, driver_name, truck_number, type, severity, description, location, coordinates
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        resolvedDriverId,
        resolvedDriverName,
        resolvedTruckNum,
        resolvedType,
        resolvedSeverity,
        description || "Emergency SOS Distress Beacon Triggered by Driver.",
        location || "Active GPS position",
        coordinates ? JSON.stringify(coordinates) : null
      ]
    );

    res.status(201).json({
      success: true,
      message: "Safety incident / SOS distress recorded successfully",
      incident: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating safety incident:", error);
    res.status(500).json({ success: false, message: "Server Error creating safety incident" });
  }
};

// Resolve or Update Safety Incident Status
export const updateSafetyIncidentStatus = async (req, res) => {
  await ensureSafetyTable();
  try {
    const { id } = req.params;
    const { status, resolution_notes, resolutionNotes } = req.body;

    const resolvedNotes = resolution_notes || resolutionNotes || null;
    const isResolved = status === "resolved";

    const result = await pool.query(
      `UPDATE safety_incidents
       SET status = COALESCE($1, status),
           resolution_notes = COALESCE($2, resolution_notes),
           resolved_at = CASE WHEN $3 = true THEN CURRENT_TIMESTAMP ELSE resolved_at END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status || null, resolvedNotes, isResolved, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Incident not found" });
    }

    res.json({
      success: true,
      message: "Safety incident status updated successfully",
      incident: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating safety incident:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Delete Safety Incident
export const deleteSafetyIncident = async (req, res) => {
  await ensureSafetyTable();
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM safety_incidents WHERE id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Incident not found" });
    }
    res.json({ success: true, message: "Safety incident deleted successfully" });
  } catch (error) {
    console.error("Error deleting safety incident:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

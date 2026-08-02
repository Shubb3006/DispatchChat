// import pool from "../config/db.js";

// // Ensure tables exist helper
// const ensureHOSTables = async () => {
//   try {
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS hos_logs (
//           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//           driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
//           current_status VARCHAR(30) DEFAULT 'OFF',
//           drive_time_remaining_sec INT DEFAULT 39600,
//           shift_time_remaining_sec INT DEFAULT 50400,
//           cycle_time_remaining_sec INT DEFAULT 252000,
//           break_time_remaining_sec INT DEFAULT 28800,
//           cycle_type VARCHAR(50) DEFAULT 'US_70_8',
//           last_status_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//           updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );

//       CREATE TABLE IF NOT EXISTS hos_events (
//           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//           hos_log_id UUID REFERENCES hos_logs(id) ON DELETE CASCADE,
//           driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
//           status VARCHAR(30) NOT NULL,
//           start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//           end_time TIMESTAMP,
//           location TEXT,
//           odometer INT,
//           notes TEXT,
//           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);
//   } catch (err) {
//     console.warn("HOS tables auto-init check:", err.message);
//   }
// };

// // Get HOS Logs for all drivers (or filter by driver_id)
// export const getHOSLogs = async (req, res) => {
//   await ensureHOSTables();
//   try {
//     const { driver_id } = req.query;
//     let query = `
//       SELECT 
//         h.*,
//         d.license_number,
//         d.status as driver_status,
//         u.full_name as driver_name,
//         u.username
//       FROM hos_logs h
//       JOIN drivers d ON h.driver_id = d.id
//       JOIN users u ON d.user_id = u.id
//     `;
//     const params = [];

//     if (driver_id) {
//       query += ` WHERE h.driver_id = $1`;
//       params.push(driver_id);
//     }

//     query += ` ORDER BY h.updated_at DESC`;

//     const result = await pool.query(query, params);
//     res.json({ success: true, logs: result.rows });
//   } catch (error) {
//     console.error("Error fetching HOS logs:", error);
//     res.status(500).json({ success: false, message: "Server Error fetching HOS logs" });
//   }
// };

// // Get single driver HOS Log by Driver ID
// export const getHOSLogByDriverId = async (req, res) => {
//   await ensureHOSTables();
//   try {
//     const { driverId } = req.params;

//     let result = await pool.query(
//       `SELECT h.*, u.full_name as driver_name 
//        FROM hos_logs h
//        JOIN drivers d ON h.driver_id = d.id
//        JOIN users u ON d.user_id = u.id
//        WHERE h.driver_id = $1 OR d.id = $1`,
//       [driverId]
//     );

//     if (result.rows.length === 0) {
//       // Return default mock/initial HOS data structure if non-existent
//       return res.json({
//         success: true,
//         log: {
//           driverId,
//           currentStatus: "OFF",
//           driveTimeRemainingSec: 39600,
//           shiftTimeRemainingSec: 50400,
//           cycleTimeRemainingSec: 252000,
//           breakTimeRemainingSec: 28800,
//           cycleType: "US_70_8",
//           lastStatusChange: new Date().toISOString()
//         }
//       });
//     }

//     res.json({ success: true, log: result.rows[0] });
//   } catch (error) {
//     console.error("Error fetching HOS log by driver:", error);
//     res.status(500).json({ success: false, message: "Server Error" });
//   }
// };

// // Update Duty Status for Driver
// export const updateHOSStatus = async (req, res) => {
//   await ensureHOSTables();
//   try {
//     const { driverId } = req.params;
//     const { status, location, notes } = req.body;

//     if (!["OFF", "SB", "D", "ON"].includes(status)) {
//       return res.status(400).json({ success: false, message: "Invalid duty status. Must be OFF, SB, D, or ON" });
//     }

//     // Check if HOS Log exists for this driver
//     const existing = await pool.query(`SELECT id FROM hos_logs WHERE driver_id = $1`, [driverId]);

//     let logId;
//     if (existing.rows.length === 0) {
//       const insertResult = await pool.query(
//         `INSERT INTO hos_logs (driver_id, current_status, last_status_change)
//          VALUES ($1, $2, CURRENT_TIMESTAMP)
//          RETURNING *`,
//         [driverId, status]
//       );
//       logId = insertResult.rows[0].id;
//     } else {
//       logId = existing.rows[0].id;
//       await pool.query(
//         `UPDATE hos_logs 
//          SET current_status = $1, last_status_change = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
//          WHERE driver_id = $2`,
//         [status, driverId]
//       );
//     }

//     // Record HOS Event entry
//     await pool.query(
//       `INSERT INTO hos_events (hos_log_id, driver_id, status, location, notes)
//        VALUES ($1, $2, $3, $4, $5)`,
//       [logId, driverId, status, location || "Active GPS Position", notes || "Duty status update"]
//     );

//     // Sync status into drivers table duty_status field if column exists
//     try {
//       await pool.query(`UPDATE drivers SET duty_status = $1 WHERE id = $2`, [status, driverId]);
//     } catch (e) {
//       // Ignored if column missing
//     }

//     res.json({
//       success: true,
//       message: `HOS status updated to ${status}`,
//       driverId,
//       currentStatus: status,
//       lastStatusChange: new Date().toISOString()
//     });
//   } catch (error) {
//     console.error("Error updating HOS status:", error);
//     res.status(500).json({ success: false, message: "Server Error updating HOS status" });
//   }
// };

// import pool from "../config/db.js";

// // Ensure tables exist helper
// // const ensureHOSTables = async () => {
// //   try {
// //     await pool.query(`
// //       CREATE TABLE IF NOT EXISTS hos_logs (
// //           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
// //           driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
// //           current_status VARCHAR(30) DEFAULT 'OFF',
// //           drive_time_remaining_sec INT DEFAULT 39600,
// //           shift_time_remaining_sec INT DEFAULT 50400,
// //           cycle_time_remaining_sec INT DEFAULT 252000,
// //           break_time_remaining_sec INT DEFAULT 28800,
// //           cycle_type VARCHAR(50) DEFAULT 'US_70_8',
// //           last_status_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
// //           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
// //           updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// //       );

// //       CREATE TABLE IF NOT EXISTS hos_events (
// //           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
// //           hos_log_id UUID REFERENCES hos_logs(id) ON DELETE CASCADE,
// //           driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
// //           status VARCHAR(30) NOT NULL,
// //           start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
// //           end_time TIMESTAMP,
// //           location TEXT,
// //           odometer INT,
// //           notes TEXT,
// //           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// //       );
// //     `);
// //   } catch (err) {
// //     console.warn("HOS tables auto-init check:", err.message);
// //   }
// // };

// // Get HOS Logs for all drivers (or filter by driver_id)
// export const getHOSLogs = async (req, res) => {
//   try {
//     const { driver_id } = req.query;
//     let query = `
//       SELECT 
//         h.*,
//         d.id as driver_table_id,
//         d.license_number,
//         d.status as driver_status,
//         u.full_name as driver_name,
//         u.username
//       FROM hos_logs h
//       JOIN drivers d ON h.driver_id = d.id
//       JOIN users u ON d.user_id = u.id
//     `;
//     const params = [];

//     if (driver_id) {
//       query += ` WHERE h.driver_id = $1`;
//       params.push(driver_id);
//     }

//     query += ` ORDER BY h.updated_at DESC`;

//     let result = await pool.query(query, params);

//     // Fallback: If no logs exist yet, query drivers directly to present active driver status
//     if (result.rows.length === 0) {
//       const driversResult = await pool.query(`
//         SELECT d.id as driver_id, d.duty_status, d.license_number, d.status as driver_status, u.full_name as driver_name
//         FROM drivers d
//         LEFT JOIN users u ON d.user_id = u.id
//       `);
      
//       result.rows = driversResult.rows.map(d => ({
//         id: d.driver_id,
//         driver_id: d.driver_id,
//         driver_name: d.driver_name || 'Marcus Vance',
//         current_status: d.duty_status || 'OFF',
//         drive_time_remaining_sec: 39600,
//         shift_time_remaining_sec: 50400,
//         cycle_time_remaining_sec: 252000,
//         break_time_remaining_sec: 28800,
//         cycle_type: 'US_70_8',
//         last_status_change: new Date().toISOString()
//       }));
//     }

//     const formattedLogs = result.rows.map(row => ({
//       ...row,
//       driverId: row.driver_id,
//       driverName: row.driver_name,
//       currentStatus: row.current_status,
//       driveTimeRemainingSec: row.drive_time_remaining_sec,
//       shiftTimeRemainingSec: row.shift_time_remaining_sec,
//       cycleTimeRemainingSec: row.cycle_time_remaining_sec,
//       breakTimeRemainingSec: row.break_time_remaining_sec,
//       cycleType: row.cycle_type,
//       lastStatusChange: row.last_status_change
//     }));

//     res.json({ success: true, logs: formattedLogs });
//   } catch (error) {
//     console.error("Error fetching HOS logs:", error);
//     res.status(500).json({ success: false, message: "Server Error fetching HOS logs" });
//   }
// };

// // Get single driver HOS Log by Driver ID
// export const getHOSLogByDriverId = async (req, res) => {
//   await ensureHOSTables();
//   try {
//     const { driverId } = req.params;

//     let result = await pool.query(
//       `SELECT h.*, u.full_name as driver_name 
//        FROM hos_logs h
//        JOIN drivers d ON h.driver_id = d.id
//        JOIN users u ON d.user_id = u.id
//        WHERE h.driver_id = $1 OR d.id = $1`,
//       [driverId]
//     );

//     if (result.rows.length === 0) {
//       // Return default mock/initial HOS data structure if non-existent
//       return res.json({
//         success: true,
//         log: {
//           driverId,
//           currentStatus: "OFF",
//           driveTimeRemainingSec: 39600,
//           shiftTimeRemainingSec: 50400,
//           cycleTimeRemainingSec: 252000,
//           breakTimeRemainingSec: 28800,
//           cycleType: "US_70_8",
//           lastStatusChange: new Date().toISOString()
//         }
//       });
//     }

//     res.json({ success: true, log: result.rows[0] });
//   } catch (error) {
//     console.error("Error fetching HOS log by driver:", error);
//     res.status(500).json({ success: false, message: "Server Error" });
//   }
// };

// // Update Duty Status for Driver
// export const updateHOSStatus = async (req, res) => {
//   await ensureHOSTables();
//   try {
    
//     const { driverId } = req.params;
//     const { status, location, notes } = req.body;
//     console.log(driverId)
//     console.log(status)

//     if (!["OFF", "SB", "D", "ON"].includes(status)) {
//       return res.status(400).json({ success: false, message: "Invalid duty status. Must be OFF, SB, D, or ON" });
//     }

//     // Check if HOS Log exists for this driver
//     const existing = await pool.query(`SELECT id FROM hos_logs WHERE driver_id = $1`, [driverId]);

//     let logId;
//     if (existing.rows.length === 0) {
//       const insertResult = await pool.query(
//         `INSERT INTO hos_logs (driver_id, current_status, last_status_change)
//          VALUES ($1, $2, CURRENT_TIMESTAMP)
//          RETURNING *`,
//         [driverId, status]
//       );
//       logId = insertResult.rows[0].id;
//     } else {
//       logId = existing.rows[0].id;
//       await pool.query(
//         `UPDATE hos_logs 
//          SET current_status = $1, last_status_change = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
//          WHERE driver_id = $2`,
//         [status, driverId]
//       );
//     }

//     // Record HOS Event entry
//     await pool.query(
//       `INSERT INTO hos_events (hos_log_id, driver_id, status, location, notes)
//        VALUES ($1, $2, $3, $4, $5)`,
//       [logId, driverId, status, location || "Active GPS Position", notes || "Duty status update"]
//     );

//     // Sync status into drivers table duty_status field if column exists
//     try {
//       await pool.query(`UPDATE drivers SET duty_status = $1 WHERE id = $2`, [status, driverId]);
//     } catch (e) {
//       // Ignored if column missing
//     }

//     res.json({
//       success: true,
//       message: `HOS status updated to ${status}`,
//       driverId,
//       currentStatus: status,
//       lastStatusChange: new Date().toISOString()
//     });
//   } catch (error) {
//     console.error("Error updating HOS status:", error);
//     res.status(500).json({ success: false, message: "Server Error updating HOS status" });
//   }
// };






import pool from "../config/db.js";

/*
====================================================
GET CURRENT DRIVER HOS
GET /api/hos-logs/me
====================================================
*/
export const getMyHOSLog = async (req, res) => {
  try {
    // req.user.driver_id comes from your auth middleware
    const driverId = req.user.driver.id

    if (!driverId) {
      return res.status(403).json({
        success: false,
        message: "Current user is not a driver",
      });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM hos_logs
      WHERE driver_id = $1
      `,
      [driverId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "HOS log not found",
      });
    }

    res.json({
      success: true,
      log: result.rows[0],
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/*
====================================================
UPDATE DRIVER HOS STATUS
PUT /api/hos-logs/me
====================================================
*/
export const updateMyHOSStatus = async (req, res) => {
  try {
    const driverId = req.user.driver.id
    const { status } = req.body;
    console.log(status)

    if (!driverId) {
      return res.status(403).json({
        success: false,
        message: "Current user is not a driver",
      });
    }

    const validStatuses = ["OFF", "SB", "ON", "D"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid HOS status",
      });
    }

    const result = await pool.query(
      `
      UPDATE hos_logs
      SET
          current_status=$1,
          last_status_change_at=CURRENT_TIMESTAMP,
          updated_at=CURRENT_TIMESTAMP
      WHERE driver_id=$2
      RETURNING *
      `,
      [status, driverId]
      );
      
      if (result.rows.length === 0) {
      
          const insertResult = await pool.query(
          `
          INSERT INTO hos_logs
          (driver_id, current_status)
          VALUES ($1,$2)
          RETURNING *
          `,
          [driverId, status]
          );
      
          result.rows = insertResult.rows;
      }
    console.log(result.rows)

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "HOS log not found",
      });
    }

    await pool.query(
      `
      INSERT INTO hos_events
      (
          hos_log_id,
          driver_id,
          status
      )
      VALUES ($1,$2,$3)
      `,
      [
        result.rows[0].id,
        driverId,
        status,
      ]
    );

    res.json({
      success: true,
      message: "HOS updated",
      log: result.rows[0],
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


export const getAllHOSLogs = async (req, res) => {
  console.log("Sas")
  try {
    const result = await pool.query(
      `
      SELECT
          h.*,
          d.id AS driver_id,
          d.driver_code,
          d.assigned_truck_number,
          d.assigned_trailer_number,

          u.id AS user_id,
         
          u.username

      FROM hos_logs h

      JOIN drivers d
      ON h.driver_id = d.id

      JOIN users u
      ON d.user_id = u.id

      ORDER BY u.full_name
      `
    );

    res.json({
      success: true,
      logs: result.rows,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


export const getDriverHOSLog = async (req, res) => {
  try {
    const { driverId } = req.params;

    const result = await pool.query(
      `
      SELECT
          h.*,
          d.driver_code,
          d.assigned_truck_number,
          d.assigned_trailer_number,
          u.full_name,
          u.username
      FROM hos_logs h
      JOIN drivers d
      ON h.driver_id=d.id
      JOIN users u
      ON d.user_id=u.id
      WHERE h.driver_id=$1
      `,
      [driverId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "HOS not found",
      });
    }

    res.json({
      success: true,
      log: result.rows[0],
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
import pool from "../config/db.js";

// Create Driver
// export const createDriver = async (req, res) => {
//     try {

//         const {
//             user_id,
//             license_number,
//             license_expiry,
//             eld_id
//         } = req.body;

//         // Check if user exists
//         const user = await pool.query(
//             `
//             SELECT id, role
//             FROM users
//             WHERE id=$1
//             `,
//             [user_id]
//         );

//         if (user.rows.length === 0) {
//             return res.status(404).json({
//                 message: "User not found"
//             });
//         }

//         if (user.rows[0].role !== "driver") {
//             return res.status(400).json({
//                 message: "Selected user is not a driver"
//             });
//         }

//         // Check if driver profile already exists
//         const existingDriver = await pool.query(
//             `
//             SELECT id
//             FROM drivers
//             WHERE user_id=$1
//             `,
//             [user_id]
//         );

//         if (existingDriver.rows.length > 0) {
//             return res.status(400).json({
//                 message: "Driver already exists"
//             });
//         }

//         const result = await pool.query(
//             `
//             INSERT INTO drivers
//             (
//                 user_id,
//                 license_number,
//                 license_expiry,
//                 eld_id
//             )

//             VALUES
//             ($1,$2,$3,$4)

//             RETURNING *
//             `,
//             [
//                 user_id,
//                 license_number,
//                 license_expiry,
//                 eld_id
//             ]
//         );

//         res.status(201).json({
//             success: true,
//             message: "Driver created successfully",
//             driver: result.rows[0]
//         });

//     } catch (error) {

//         console.log(error);

//         res.status(500).json({
//             message: "Server Error"
//         });

//     }
// };
export const createDriver = async (req, res) => {
    try {
      const {
        user_id,
        license_number,
        license_expiry,
        eld_id,
      } = req.body;
  
      const user = await pool.query(
        `
        SELECT id, role
        FROM users
        WHERE id=$1
        `,
        [user_id]
      );
  
      if (user.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
  
      if (user.rows[0].role !== "driver") {
        return res.status(400).json({
          success: false,
          message: "Selected user is not a driver",
        });
      }
  
      const exists = await pool.query(
        `
        SELECT id
        FROM drivers
        WHERE user_id=$1
        `,
        [user_id]
      );
  
      if (exists.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Driver already exists",
        });
      }
  
      const result = await pool.query(
        `
        INSERT INTO drivers
        (
          user_id,
          license_number,
          license_expiry,
          eld_id
        )
        VALUES($1,$2,$3,$4)
        RETURNING *
        `,
        [
          user_id,
          license_number,
          license_expiry,
          eld_id,
        ]
      );
  
      res.status(201).json({
        success: true,
        message: "Driver created successfully",
        driver: result.rows[0],
      });
    } catch (err) {
      console.error(err);
  
      res.status(500).json({
        success: false,
        message: "Server Error",
      });
    }
  };
// Get All Drivers
// export const getDrivers = async (req, res) => {

//     try {

//         const result = await pool.query(
//             `
//             SELECT
//                 d.id,
//                 d.license_number,
//                 d.license_expiry,
//                 d.eld_id,
//                 d.status,
               
//                 u.username
//             FROM drivers d
//             JOIN users u
//             ON d.user_id=u.id
//             ORDER BY d.created_at DESC
//             `
//         );

//         res.json({
//             success: true,
//             drivers: result.rows
//         });

//     } catch (error) {

//         console.log(error);

//         res.status(500).json({
//             message: "Server Error"
//         });

//     }

// };
export const getDrivers = async (req, res) => {
    try {
  
      const result = await pool.query(`
        SELECT
  
          d.id,
          d.driver_code,
  
          d.user_id,
  
          d.license_number,
          d.license_expiry,
          d.license_state,
  
          d.eld_id,
  
          d.phone_number,
          d.emergency_contact_phone,
  
          d.assigned_truck_number,
          d.assigned_trailer_number,
  
          d.current_duty_status,
  
          d.current_lat,
          d.current_lng,
          d.last_gps_updated_at,
  
          d.status,
  
          d.created_at,
          d.updated_at,
  
          u.username,
          u.full_name

  
        FROM drivers d
  
        INNER JOIN users u
        ON d.user_id=u.id
  
        ORDER BY u.username ASC
      `);
  
      res.json({
        success: true,
        drivers: result.rows,
      });
  
    } catch (err) {
  
      console.error(err);
  
      res.status(500).json({
        success: false,
        message: "Server Error",
      });
  
    }
  };

// Get Single Driver
// export const getDriver = async (req, res) => {

//     try {

//         const { id } = req.params;

//         const result = await pool.query(
//             `
//             SELECT
//                 d.*,
//                 u.first_name,
//                 u.last_name,
//                 u.email,
//                 u.phone
//             FROM drivers d
//             JOIN users u
//             ON d.user_id=u.id
//             WHERE d.id=$1
//             `,
//             [id]
//         );

//         if (result.rows.length === 0) {
//             return res.status(404).json({
//                 message: "Driver not found"
//             });
//         }

//         res.json({
//             success: true,
//             driver: result.rows[0]
//         });

//     } catch (error) {

//         console.log(error);

//         res.status(500).json({
//             message: "Server Error"
//         });

//     }

// };

export const getDriver = async (req, res) => {
    try {
  
      const { id } = req.params;
  
      const result = await pool.query(
        `
        SELECT
  
          d.*,
  
          u.username,
          u.first_name,
          u.last_name,
          u.email,
          u.phone
  
        FROM drivers d
  
        INNER JOIN users u
        ON d.user_id=u.id
  
        WHERE d.id=$1
        `,
        [id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Driver not found",
        });
      }
  
      res.json({
        success: true,
        driver: result.rows[0],
      });
  
    } catch (err) {
  
      console.error(err);
  
      res.status(500).json({
        success: false,
        message: "Server Error",
      });
  
    }
  };

// Update Driver
// export const updateDriver = async (req, res) => {

//     try {

//         const { id } = req.params;

//         const {
//             license_number,
//             license_expiry,
//             eld_id,
//             status
//         } = req.body;

//         const result = await pool.query(
//             `
//             UPDATE drivers
//             SET
//                 license_number=$1,
//                 license_expiry=$2,
//                 eld_id=$3,
//                 status=$4
//             WHERE id=$5
//             RETURNING *
//             `,
//             [
//                 license_number,
//                 license_expiry,
//                 eld_id,
//                 status,
//                 id
//             ]
//         );

//         if (result.rows.length === 0) {
//             return res.status(404).json({
//                 message: "Driver not found"
//             });
//         }

//         res.json({
//             success: true,
//             message: "Driver updated successfully",
//             driver: result.rows[0]
//         });

//     } catch (error) {

//         console.log(error);

//         res.status(500).json({
//             message: "Server Error"
//         });

//     }

// };

export const updateDriver = async (req, res) => {

    try {
  
      const { id } = req.params;
  
      const {
  
        license_number,
        license_expiry,
        license_state,
  
        eld_id,
  
        phone_number,
        emergency_contact_phone,
  
        assigned_truck_number,
        assigned_trailer_number,
  
        current_duty_status,
  
        current_lat,
        current_lng,
  
        status,
  
      } = req.body;
  
      const result = await pool.query(
        `
        UPDATE drivers
  
        SET
  
        license_number=$1,
        license_expiry=$2,
        license_state=$3,
  
        eld_id=$4,
  
        phone_number=$5,
        emergency_contact_phone=$6,
  
        assigned_truck_number=$7,
        assigned_trailer_number=$8,
  
        current_duty_status=$9,
  
        current_lat=$10,
        current_lng=$11,
  
        status=$12,
  
        updated_at=CURRENT_TIMESTAMP
  
        WHERE id=$13
  
        RETURNING *
        `,
        [
  
          license_number,
          license_expiry,
          license_state,
  
          eld_id,
  
          phone_number,
          emergency_contact_phone,
  
          assigned_truck_number,
          assigned_trailer_number,
  
          current_duty_status,
  
          current_lat,
          current_lng,
  
          status,
  
          id,
  
        ]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Driver not found",
        });
      }
  
      res.json({
        success: true,
        message: "Driver updated successfully",
        driver: result.rows[0],
      });
  
    } catch (err) {
  
      console.error(err);
  
      res.status(500).json({
        success: false,
        message: "Server Error",
      });
  
    }
  };

// Delete Driver
export const deleteDriver = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM drivers
            WHERE id=$1
            RETURNING *
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Driver not found"
            });
        }

        res.json({
            success: true,
            message: "Driver deleted successfully"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};
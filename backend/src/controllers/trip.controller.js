import pool from "../config/db.js";

export const createTrip = async (req, res) => {
  try {
    const {
      trip_number,
      driver_id,
      status,
      totalWeightLbs,
      totalPallets,
      shipmentIds,
    } = req.body;
    console.log(req.body)

    const tripResult = await pool.query(
      `
      INSERT INTO trips
      (
        trip_number,
        driver_id,
        status,
        total_weight_lbs,
        total_pallets
      )
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *;
      `,
      [
        trip_number,
        driver_id,
        status,
        totalWeightLbs,
        totalPallets,
      ]
    );

    const trip = tripResult.rows[0];

// insert into trip_loads...

for (const shipmentId of shipmentIds) {
    await pool.query(
      `
      INSERT INTO trip_loads
      (
        trip_id,
        load_id
      )
      VALUES ($1,$2)
      `,
      [trip.id, shipmentId]
    );

    await pool.query(
      `
      UPDATE loads
      SET status = 'assigned'
      WHERE id = $1
      `,
      [shipmentId]
    );
  }

const finalTrip = await pool.query(
  `
  SELECT
      t.*,
      u.username AS driver_name,
      COALESCE(
          ARRAY_AGG(tl.load_id)
          FILTER (WHERE tl.load_id IS NOT NULL),
          '{}'
      ) AS shipment_ids
  FROM trips t
  LEFT JOIN drivers d
      ON t.driver_id = d.id
  LEFT JOIN users u
      ON d.user_id = u.id
  LEFT JOIN trip_loads tl
      ON t.id = tl.trip_id
  WHERE t.id = $1
  GROUP BY t.id, u.username;
  `,
  [trip.id]
);

    

    res.status(201).json({
      success: true,
      trip:finalTrip.rows[0],
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllTrips = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                t.*,
                u.username AS driver_name,
                COALESCE(
                    ARRAY_AGG(tl.load_id)
                    FILTER (WHERE tl.load_id IS NOT NULL),
                    '{}'
                ) AS shipment_ids
            FROM trips t
            LEFT JOIN drivers d
                ON t.driver_id = d.id
            LEFT JOIN users u
                ON d.user_id = u.id
            LEFT JOIN trip_loads tl
                ON t.id = tl.trip_id
            GROUP BY
                t.id,
                u.username
            ORDER BY
                t.created_at DESC;
            `);
  
      res.json({
        success: true,
        trips: result.rows,
      });
    } catch (error) {
      res.status(500).json({
        message: "Server Error",
      });
    }
  };

  export const getTripById = async (req, res) => {
    try {
      const { id } = req.params;
  
      const tripResult = await pool.query(
        `
        SELECT
          t.*,
          u.username AS driver_name
        FROM trips t
        LEFT JOIN drivers d
          ON t.driver_id = d.id
        LEFT JOIN users u
          ON d.user_id = u.id
        WHERE t.id = $1;
        `,
        [id]
      );
  
      if (tripResult.rows.length === 0) {
        return res.status(404).json({
          message: "Trip not found",
        });
      }
  
      const shipmentResult = await pool.query(
        `
        SELECT l.*
        FROM trip_loads tl
        JOIN loads l
          ON tl.load_id = l.id
        WHERE tl.trip_id = $1;
        `,
        [id]
      );
  
      res.json({
        success: true,
        trip: {
          ...tripResult.rows[0],
          shipments: shipmentResult.rows,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Server Error",
      });
    }
  };

  export const updateTrip = async (req, res) => {
    try {
      const { id } = req.params;
      console.log(req.body)
      const {
        driver_id,
        status,
        total_weight_lbs,
        total_pallets,
        shipment_ids,
      } = req.body;
  
      const tripResult = await pool.query(
        `
        WITH updated_trip AS (
          UPDATE trips
          SET
            driver_id = $1,
            status = $2,
            total_weight_lbs = $3,
            total_pallets = $4
          WHERE id = $5
          RETURNING *
        )
        SELECT
          ut.*,
          u.username AS driver_name
        FROM updated_trip ut
        LEFT JOIN drivers d
          ON ut.driver_id = d.id
        LEFT JOIN users u
          ON d.user_id = u.id;
        `,
        [
          driver_id,
          status,
          total_weight_lbs,
          total_pallets,
          id,
        ]
      );
  
      if (tripResult.rows.length === 0) {
        return res.status(404).json({
          message: "Trip not found",
        });
      }
  
      // Remove old shipments from this trip
      await pool.query(
        `
        DELETE FROM trip_loads
        WHERE trip_id = $1
        `,
        [id]
      );
  
      // Add the new shipments
      for (const shipmentId of shipment_ids) {
        await pool.query(
          `
          INSERT INTO trip_loads
          (
            trip_id,
            load_id
          )
          VALUES ($1, $2)
          `,
          [id, shipmentId]
        );
      }

    //  const updateLoadsResult=await pool.query(
    //     `
    //     UPDATE loads
    //     SET status = $1
    //     WHERE id IN (
    //         SELECT load_id
    //         FROM trip_loads
    //         WHERE trip_id = $2
    //     )
    //     `,
    //     [status, id]
    //   );
    const result=await pool.query(
      `
      
          SELECT load_id
          FROM trip_loads
          WHERE trip_id = $1
      
      `,
      [ id]
    );

    for (const row of result.rows) {
      console.log(row)
      await pool.query(
        `
        UPDATE loads
        SET status = $1
        WHERE id = $2
        `,
        [status, row.load_id]
      );
    }

      console.log(result.rows);

      const finalTrip = await pool.query(
        `
        SELECT
            t.*,
            u.username AS driver_name,
            COALESCE(
                ARRAY_AGG(tl.load_id)
                FILTER (WHERE tl.load_id IS NOT NULL),
                '{}'
            ) AS shipment_ids
        FROM trips t
        LEFT JOIN drivers d
            ON t.driver_id = d.id
        LEFT JOIN users u
            ON d.user_id = u.id
        LEFT JOIN trip_loads tl
            ON t.id = tl.trip_id
        WHERE t.id = $1
        GROUP BY t.id, u.username;
        `,
        [id]
      );
  
      res.json({
        success: true,
        trip: finalTrip.rows[0],
      });
    } catch (error) {
      console.log(error);
  
      res.status(500).json({
        message: "Server Error",
      });
    }
  };
//   export const deleteTrip = async (req, res) => {

//   try {
//     const { id } = req.params;

//     const result = await pool.query(
//       `
//       DELETE FROM trips
//       WHERE id = $1
//       RETURNING *;
//       `,
//       [id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Trip not found",
//       });
//     }

//     res.json({
//       success: true,
//       message: "Trip deleted successfully",
//     });
//   } catch (error) {
//     console.log(error);

//     res.status(500).json({
//       success: false,
//       message: "Server Error",
//     });
//   }
// };

export const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;

    // Get all loads belonging to this trip
    const loadsResult = await pool.query(
      `
      SELECT load_id
      FROM trip_loads
      WHERE trip_id = $1
      `,
      [id]
    );

    // Remove mappings
    await pool.query(
      `
      DELETE FROM trip_loads
      WHERE trip_id = $1
      `,
      [id]
    );

    // (Optional) Reset load status
    for (const row of loadsResult.rows) {
      await pool.query(
        `
        UPDATE loads
        SET status = 'pending'
        WHERE id = $1
        `,
        [row.load_id]
      );
    }

    // Delete trip
    const result = await pool.query(
      `
      DELETE FROM trips
      WHERE id = $1
      RETURNING *;
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    res.json({
      success: true,
      message: "Trip deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
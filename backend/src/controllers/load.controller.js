import pool from "../config/db";


// CREATE LOAD

// export const createLoad = async(req,res)=>{

//     try{
//         console.log(req.body)

//         const {
//             load_number,
//             dispatcher_id,
//             driver_id,
//             truck_id,
//             trailer_id,
          
//             customer_name,
//             customer_email,
//             customer_phone,
//             customer_billing_address,
          
//             shipper_name,
//             shipper_phone,
//             shipper_address,
//             origin,
          
//             consignee_name,
//             consignee_phone,
//             consignee_address,
//             destination,
          
//             pickup_date,
//             delivery_date,
          
//             commodity,
//             weight,
//             pieces,
//             rate
//         } = req.body;



//         const result = await pool.query(
//         `
//         INSERT INTO loads
//         (
//             load_number,
//   dispatcher_id,
//   driver_id,
//   truck_id,
//   trailer_id,

//   customer_name,
//   customer_email,
//   customer_phone,
//   customer_billing_address,

//   shipper_name,
//   shipper_phone,
//   shipper_address,
//   origin,

//   consignee_name,
//   consignee_phone,
//   consignee_address,
//   destination,

//   pickup_date,
//   delivery_date,

//   commodity,
//   weight,
//   pieces,
//   rate
//         )

//         VALUES
//         (
//             $1,$2,$3,$4,$5,
//             $6,$7,$8,$9,$10,
//             $11,$12,$13,$14,$15
//         )

//         RETURNING *
//         `,
//         [
//             load_number,
//             pb_num,
//             customer_id,
//             dispatcher_id,
//             driver_id,
//             truck_id,
//             trailer_id,
//             origin,
//             destination,
//             pickup_date,
//             delivery_date,
//             commodity,
//             weight,
//             pieces,
//             rate
//         ]
//         );


//         res.status(201).json({
//             success:true,
//             load:result.rows[0]
//         });



//     }catch(error){

//         console.log(error);

//         res.status(500).json({
//             message:"Server error"
//         });

//     }

// };

export const createLoad = async (req, res) => {
  try {
    console.log(req.body);

    const {
      load_number,
      dispatcher_id,
      driver_id,
      truck_id,
      trailer_id,

      customer_name,
      customer_email,
      customer_phone,
      customer_billing_address,

      shipper_name,
      shipper_phone,
      shipper_address,
      origin,

      consignee_name,
      consignee_phone,
      consignee_address,
      destination,

      pickup_date,
      delivery_date,

      commodity,
      weight,
      pieces,
      rate,
      status
   } = req.body;

    const result = await pool.query(
      `
      INSERT INTO loads
      (
        load_number,
        dispatcher_id,
        driver_id,
        truck_id,
        trailer_id,

        customer_name,
        customer_email,
        customer_phone,
        customer_billing_address,

        shipper_name,
        shipper_phone,
        shipper_address,
        origin,

        consignee_name,
        consignee_phone,
        consignee_address,
        destination,

        pickup_date,
        delivery_date,

        commodity,
        weight,
        pieces,
        rate,
        status
      )
      VALUES
      (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,
        $10,$11,$12,$13,
        $14,$15,$16,$17,
        $18,$19,
        $20,$21,$22,$23,$24
      )
      RETURNING *;
      `,
      [
        load_number,
        dispatcher_id,
        driver_id,
        truck_id,
        trailer_id,

        customer_name,
        customer_email,
        customer_phone,
        customer_billing_address,

        shipper_name,
        shipper_phone,
        shipper_address,
        origin,

        consignee_name,
        consignee_phone,
        consignee_address,
        destination,

        pickup_date,
        delivery_date,

        commodity,
        weight,
        pieces,
        rate,
        status
      ]
    );

    res.status(201).json({
      success: true,
      load: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllLoads = async (req, res) => {
    try {

//         const result = await pool.query(`
//             SELECT
//     l.*,
//     u.username AS driver_name
// FROM loads l
// LEFT JOIN drivers d
//     ON l.driver_id = d.id
// LEFT JOIN users u
//     ON d.user_id = u.id;
//         `);

const result=await pool.query(`
    SELECT
    l.*,
    u.username AS driver_name
FROM loads l
LEFT JOIN drivers d
    ON l.driver_id = d.id
LEFT JOIN users u
    ON d.user_id = u.id
LEFT JOIN trip_loads tl
    ON l.id = tl.load_id
ORDER BY l.created_at DESC;`)

        res.json({
            success: true,
            loads: result.rows
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error"
        });

    }
};

export const getLoadById = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            `
           SELECT
    l.*,
    u.username AS driver_name
FROM loads l
LEFT JOIN drivers d
    ON l.driver_id = d.id
LEFT JOIN users u
    ON d.user_id = u.id
WHERE l.id = $1;
            `,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "Load not found"
            });

        }

        res.json({
            success: true,
            load: result.rows[0]
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};

export const updateLoad = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            origin,
            destination,
            pickup_date,
            delivery_date,
            commodity,
            weight,
            pieces,
            rate,
            status,
            driver_id,
        } = req.body;

        const result = await pool.query(`
            WITH updated_load AS (
    UPDATE loads
    SET
        origin = $1,
        destination = $2,
        pickup_date = $3,
        delivery_date = $4,
        commodity = $5,
        weight = $6,
        pieces = $7,
        rate = $8,
        status = $9,
        driver_id = $10
    WHERE id = $11
    RETURNING *
)
SELECT
    ul.*,
    u.username AS driver_name
FROM updated_load ul
LEFT JOIN drivers d
    ON ul.driver_id = d.id
LEFT JOIN users u
    ON d.user_id = u.id;`,
            [
                origin,
                destination,
                pickup_date,
                delivery_date,
                commodity,
                weight,
                pieces,
                rate,
                status,
                driver_id, // $10
                id         // $11
            ]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "Load not found"
            });

        }

        // Find the trip this load belongs to
const tripResult = await pool.query(
    `
    SELECT trip_id
    FROM trip_loads
    WHERE load_id = $1
    `,
    [id]
  );
  
  if (tripResult.rows.length > 0) {
    const tripId = tripResult.rows[0].trip_id;
  
    // Get status of every load in this trip
    const loadsResult = await pool.query(
      `
      SELECT l.status
      FROM trip_loads tl
      JOIN loads l
        ON tl.load_id = l.id
      WHERE tl.trip_id = $1
      `,
      [tripId]
    );
  
    const statuses = loadsResult.rows.map(r => r.status);
  
    let tripStatus = "pending";

if (statuses.every(s => s === "delivered")) {
    tripStatus = "completed";
}
else if (statuses.some(s => s === "in_transit")) {
    tripStatus = "in_transit";
}
else if (statuses.some(s => s === "dispatched")) {
    tripStatus = "dispatched";
}
else if (statuses.every(s => s === "assigned")) {
    tripStatus = "pending";
}
  
    await pool.query(
      `
      UPDATE trips
      SET status = $1
      WHERE id = $2
      `,
      [tripStatus, tripId]
    );
  }

        res.json({
            success: true,
            load: result.rows[0]
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};

// export const updateLoadStatus = async (req, res) => {

//     try {

//         const { id } = req.params;

//         const { status } = req.body;

//         const result = await pool.query(
//             `
//             UPDATE loads
//             SET status=$1
//             WHERE id=$2
//             RETURNING *
//             `,
//             [
//                 status,
//                 id
//             ]
//         );

//         if (result.rows.length === 0) {

//             return res.status(404).json({
//                 message: "Load not found"
//             });

//         }

//         res.json({
//             success: true,
//             load: result.rows[0]
//         });

//     } catch (error) {

//         console.log(error);

//         res.status(500).json({
//             message: "Server Error"
//         });

//     }

// };

export const updateLoadStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
  
      // Update load status
      const result = await pool.query(
        `
        UPDATE loads
        SET status = $1
        WHERE id = $2
        RETURNING *;
        `,
        [status, id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Load not found",
        });
      }
  
      // Find the trip this load belongs to
      const tripResult = await pool.query(
        `
        SELECT trip_id
        FROM trip_loads
        WHERE load_id = $1
        `,
        [id]
      );
  
      // If load is not assigned to any trip, we're done
      if (tripResult.rows.length > 0) {
        const tripId = tripResult.rows[0].trip_id;
  
        // Get all statuses of loads in this trip
        const loadsResult = await pool.query(
          `
          SELECT l.status
          FROM trip_loads tl
          JOIN loads l
            ON tl.load_id = l.id
          WHERE tl.trip_id = $1
          `,
          [tripId]
        );
  
        const statuses = loadsResult.rows.map((row) => row.status);
  
        let tripStatus = "pending";
  
        if (statuses.every((s) => s === "delivered")) {
          tripStatus = "completed";
        } else if (statuses.some((s) => s === "in_transit")) {
          tripStatus = "in_transit";
        } else if (statuses.some((s) => s === "dispatched")) {
          tripStatus = "dispatched";
        } else if (statuses.every((s) => s === "assigned")) {
          tripStatus = "pending";
        }

        console.log("Trip Status Updated:", tripId, tripStatus);

const updatedTrip = await pool.query(
  `
  SELECT *
  FROM trips
  WHERE id = $1
  `,
  [tripId]
);

console.log(updatedTrip.rows[0]);
  
        await pool.query(
          `
          UPDATE trips
          SET status = $1
          WHERE id = $2
          `,
          [tripStatus, tripId]
        );
      }
  
      res.json({
        success: true,
        load: result.rows[0],
      });
    } catch (error) {
      console.log(error);
  
      res.status(500).json({
        success: false,
        message: "Server Error",
      });
    }
  };
export const deleteLoad = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM loads
            WHERE id=$1
            RETURNING *
            `,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "Load not found"
            });

        }

        res.json({
            success: true,
            message: "Load deleted successfully"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};



// (            `
//             UPDATE loads
//             SET
//                 origin=$1,
//                 destination=$2,
//                 pickup_date=$3,
//                 delivery_date=$4,
//                 commodity=$5,
//                 weight=$6,
//                 pieces=$7,
//                 rate=$8,
//                 status=$9,
//                 driver_id=$10
//             WHERE id=$11
//             RETURNING *
//             `,)
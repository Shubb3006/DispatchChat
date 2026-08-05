import pool from "../config/db.js";

import { createClient } from '@supabase/supabase-js';
// import pool from '../config/db.js';

// Initialize Supabase Client using environment variables
// const supabase = createClient(process.env.DATABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabaseUrl = process.env.PROJECT_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = (supabaseUrl.startsWith('http'))
  ? createClient(supabaseUrl, supabaseKey)
  : null;

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

// export const createLoad = async (req, res) => {
//   try {
//     console.log(req.body);

//     const {
//       load_number,
//       dispatcher_id,
//       driver_id,
//       truck_id,
//       trailer_id,

//       customer_name,
//       customer_email,
//       customer_phone,
//       customer_billing_address,

//       shipper_name,
//       shipper_phone,
//       shipper_address,
//       origin,

//       consignee_name,
//       consignee_phone,
//       consignee_address,
//       destination,

//       pickup_date,
//       delivery_date,

//       commodity,
//       weight,
//       pieces,
//       rate,
//       status
//    } = req.body;

//     const result = await pool.query(
//       `
//       INSERT INTO loads
//       (
//         load_number,
//         dispatcher_id,
//         driver_id,
//         truck_id,
//         trailer_id,

//         customer_name,
//         customer_email,
//         customer_phone,
//         customer_billing_address,

//         shipper_name,
//         shipper_phone,
//         shipper_address,
//         origin,

//         consignee_name,
//         consignee_phone,
//         consignee_address,
//         destination,

//         pickup_date,
//         delivery_date,

//         commodity,
//         weight,
//         pieces,
//         rate,
//         status
//       )
//       VALUES
//       (
//         $1,$2,$3,$4,$5,
//         $6,$7,$8,$9,
//         $10,$11,$12,$13,
//         $14,$15,$16,$17,
//         $18,$19,
//         $20,$21,$22,$23,$24
//       )
//       RETURNING *;
//       `,
//       [
//         load_number,
//         dispatcher_id,
//         driver_id,
//         truck_id,
//         trailer_id,

//         customer_name,
//         customer_email,
//         customer_phone,
//         customer_billing_address,

//         shipper_name,
//         shipper_phone,
//         shipper_address,
//         origin,

//         consignee_name,
//         consignee_phone,
//         consignee_address,
//         destination,

//         pickup_date,
//         delivery_date,

//         commodity,
//         weight,
//         pieces,
//         rate,
//         status
//       ]
//     );

//     const messageText = `New Load Assigned! Load #: ${load_number}\nPickup: ${pickup_address}\nDelivery: ${delivery_address}`;

//       await db.query(
//         `INSERT INTO messages (sender_id, recipient_id, driver_id, shipment_id, text) 
//          VALUES ($1, $2, $3, $4, $5)`,
//         [
//           dispatcher_id, // Dispatcher's user ID
//           driver_id, // Target recipient user ID (or mapped driver user id)
//           driver_id, 
//           newLoad.id, 
//           messageText
//         ]
//       );
//     res.status(201).json({
//       success: true,
//       load: result.rows[0],
//     });
//   } catch (error) {
//     console.error(error);

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

export const createLoad = async (req, res) => {
  try {
    const dispatcher_id = req.body.dispatcher_id || (req.user ? req.user.id : null);
    const {
      load_number,
      // driver_id,
      // truck_id,
      // trailer_id,
      commitment,

      customer_name,
      customer_email,
      customer_phone,
      customer_billing_address,

      shipper_name,
      shipper_zipcode,
      shipper_street_address,
      shipper_district,
      shipper_state,
      shipper_country,

      consignee_name,
      consignee_zipcode,
      consignee_street_address,
      consignee_district,
      consignee_state,
      consignee_country,

      pickup_date,
      delivery_date,

      commodity,
      weight,
      pieces,
      rate
      // status is intentionally omitted here to force PENDING
    } = req.body;

    // Enforce initial status to 'PENDING'
    const status = 'Entered';

    const result = await pool.query(
      `
      INSERT INTO loads
      (
        load_number,
        dispatcher_id,
        commitment,

        customer_name,
        customer_email,
        customer_phone,
        customer_billing_address,

        shipper_name,
        shipper_zipcode,
        shipper_street_address,
        shipper_district,
        shipper_state,
        shipper_country,

        consignee_name,
        consignee_zipcode,
        consignee_street_address,
        consignee_district,
        consignee_state,
        consignee_country,

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
        $20,$21,$22,$23,$24,$25,$26
      )
      RETURNING *;
      `,
      [
        load_number,
        dispatcher_id,
        commitment,

        customer_name,
        customer_email,
        customer_phone,
        customer_billing_address,

        shipper_name,
        shipper_zipcode,
        shipper_street_address,
        shipper_district,
        shipper_state,
        shipper_country,

        consignee_name,
        consignee_zipcode,
        consignee_street_address,
        consignee_district,
        consignee_state,
        consignee_country,

        pickup_date,
        delivery_date,

        commodity,
        weight,
        pieces,
        rate,
        status
      ]
    );

    const newLoad = result.rows[0];

    // Send automated message if a driver is assigned
    // if (driver_id) {

    //   const driverUserQuery = await pool.query(
    //     `SELECT user_id FROM drivers WHERE id = $1`,
    //     [driver_id]
    //   );

    //   const recipientUserId = driverUserQuery.rows[0]?.user_id || driver_id;
    //   const messageText = `New Load Assigned! Load #: ${load_number}\nPickup: ${shipper_address}`;

    //   // Note: Make sure you use your connection pool (pool or db depending on your setup)
    //   await pool.query(
    //     `INSERT INTO messages (sender_id, recipient_id, driver_id, shipment_id, text) 
    //      VALUES ($1, $2, $3, $4, $5)`,
    //     [
    //       dispatcher_id, // Dispatcher's user ID
    //       recipientUserId,     // Target recipient user ID
    //       driver_id,     // Driver ID reference
    //       newLoad.id,    // Fixed reference from result.rows[0]
    //       messageText
    //     ]
    //   );
    // }

    res.status(201).json({
      success: true,
      load: newLoad,
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

        const result = await pool.query(`
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

// export const getLoadById = async (req, res) => {

//     try {

//         const { id } = req.params;

//         const result = await pool.query(
//             `
//            SELECT
//     l.*,
//     u.username AS driver_name
// FROM loads l
// LEFT JOIN drivers d
//     ON l.driver_id = d.id
// LEFT JOIN users u
//     ON d.user_id = u.id
// WHERE l.id = $1;
//             `,
//             [id]
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

export const updateLoad = async (req, res) => {
  try {
    console.log("Load statu")
    console.log(req.body)
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
      driver_notes
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
        driver_id = $10,
        driver_notes = $11
    WHERE id = $12
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
        driver_notes,
        id         // $11
      ]
    );
    console.log("Updated load:", result.rows[0].status);


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

      const statuses = loadsResult.rows.map(r => r.status?.toLowerCase());

      let tripStatus = "pending";

      if (statuses.every(s => s === "delivered")) {
        tripStatus = "completed";
      } else if (statuses.some(s => s === "in_transit")) {
        tripStatus = "in_transit";
      } else if (statuses.some(s => s === "dispatched")) {
        tripStatus = "dispatched";
      } else if (statuses.every(s => s === "at_warehouse")) {
        tripStatus = "at_warehouse";
      } else if (statuses.some(s => s === "picked_up")) {
        tripStatus = "picked_up";
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

      const statuses = loadsResult.rows.map((row) => row.status?.toLowerCase());

      // Full lifecycle cascade:
      // All delivered           → completed
      // Any in_transit          → in_transit
      // Any dispatched          → dispatched
      // All at_warehouse        → at_warehouse (ready to be dispatched)
      // Any picked_up           → picked_up (BOL approved, heading to warehouse)
      // Default (all assigned)  → pending
      let tripStatus = "pending";

      if (statuses.every((s) => s === "delivered")) {
        tripStatus = "completed";
      } else if (statuses.some((s) => s === "in_transit")) {
        tripStatus = "in_transit";
      } else if (statuses.some((s) => s === "dispatched")) {
        tripStatus = "dispatched";
      } else if (statuses.every((s) => s === "at_warehouse")) {
        tripStatus = "at_warehouse";
      } else if (statuses.some((s) => s === "picked_up")) {
        tripStatus = "picked_up";
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


export const getPendingBOLs = async (req, res) => {
  try {
    console.log("ssss")
    const result = await pool.query(
      `SELECT d.*, l.load_number FROM documents d 
       JOIN loads l ON d.load_id = l.id 
       WHERE d.document_type = 'BOL' AND d.is_approved = false 
       ORDER BY d.created_at DESC`
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// 1. Driver uploads BOL
// export const uploadBOL = async (req, res) => {
//   try {
//     console.log(req.body)
//     const { load_id } = req.body;
//     const driver_id = req.user ? req.user.id : req.body.driver_id;
//     // Assuming you use multer middleware for file uploads, req.file.path gives the file URL/path
//     const filePath = req.file ? `/uploads/documents/${req.file.filename}` : null;

//     if (!filePath) {
//       return res.status(400).json({ success: false, message: "BOL image/document is required." });
//     }

//     // Insert document record into database
//     const docQuery = await pool.query(
//       `INSERT INTO documents (load_id, file_path, document_type, is_approved) 
//        VALUES ($1, $2, 'BOL', false) RETURNING *`,
//       [load_id, filePath]
//     );

//     // Optional: Notify dispatcher via notifications table or message
//     // await pool.query(
//     //   `INSERT INTO notifications (message, type) VALUES ($1, 'BOL_PENDING_APPROVAL')`,
//     //   [`New Bill of Lading (BOL) uploaded for Load ID ${load_id} awaiting your approval.`]
//     // );

//     res.status(201).json({
//       success: true,
//       message: "BOL uploaded successfully. Awaiting dispatcher approval.",
//       document: docQuery.rows[0],
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };




export const uploadBOL = async (req, res) => {
  try {
    const { load_id } = req.body;
    const file = req.file;

    if (!load_id || !file) {
      return res.status(400).json({ success: false, message: "Load ID and BOL file are required." });
    }

    // Generate a unique filename
    const originalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `bol_${load_id}_${Date.now()}_${originalName}`;

    // 1. Upload directly to Supabase Storage bucket named 'documents'
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 2. Get the permanent public URL
    const { data: publicURLData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    const publicUrl = publicURLData.publicUrl;

    // 3. Save the public URL in your database table
    const docQuery = await pool.query(
      `INSERT INTO documents (load_id, file_path, document_type, is_approved) 
       VALUES ($1, $2, 'BOL', false) RETURNING *`,
      [load_id, publicUrl]
    );

    // 4. Notify Dispatcher
    // await pool.query(
    //   `INSERT INTO notifications (message, type) VALUES ($1, 'BOL_PENDING_APPROVAL')`,
    //   [`New BOL uploaded for Load ID ${load_id} awaiting approval.`]
    // );

    res.status(201).json({
      success: true,
      message: "BOL uploaded successfully to cloud storage.",
      document: docQuery.rows[0],
    });
  } catch (error) {
    console.error("BOL Upload Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Dispatcher approves BOL -> Status becomes PICKED_UP
export const approveBOL = async (req, res) => {
  try {
    const { load_id, document_id } = req.body;
    const dispatcher_id = req.user ? req.user.id : null;

    // 1. Mark document as approved
    await pool.query(
      `UPDATE documents SET is_approved = true, approved_by = $1 WHERE id = $2`,
      [dispatcher_id, document_id]
    );

    // 2. Update load status to 'PICKED_UP'
    const updatedLoad = await pool.query(
      `UPDATE loads SET status = 'picked_up' WHERE id = $1 RETURNING *`,
      [load_id]
    );

    const loadData = updatedLoad.rows[0];

    // 3. Trigger notification/message to customer
    // if (loadData && loadData.customer_email) {
    //   await pool.query(
    //     `INSERT INTO notifications (message, type) VALUES ($1, 'CUSTOMER_ALERT')`,
    //     [`Your load ${loadData.load_number} has been verified and picked up from the location.`]
    //   );
    // }

    res.status(200).json({
      success: true,
      message: "BOL approved successfully. Load status updated to PICKED_UP.",
      load: loadData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
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
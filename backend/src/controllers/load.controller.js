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
        rate
      )
      VALUES
      (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,
        $10,$11,$12,$13,
        $14,$15,$16,$17,
        $18,$19,
        $20,$21,$22,$23
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

        const result = await pool.query(`
            SELECT *
            FROM loads
            ORDER BY created_at DESC
        `);

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
            SELECT *
            FROM loads
            WHERE id=$1
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
            status
        } = req.body;

        const result = await pool.query(
            `
            UPDATE loads
            SET
                origin=$1,
                destination=$2,
                pickup_date=$3,
                delivery_date=$4,
                commodity=$5,
                weight=$6,
                pieces=$7,
                rate=$8,
                status=$9
            WHERE id=$10
            RETURNING *
            `,
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
                id
            ]
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

export const updateLoadStatus = async (req, res) => {

    try {

        const { id } = req.params;

        const { status } = req.body;

        const result = await pool.query(
            `
            UPDATE loads
            SET status=$1
            WHERE id=$2
            RETURNING *
            `,
            [
                status,
                id
            ]
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
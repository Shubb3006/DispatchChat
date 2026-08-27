import pool from "../config/db.js";
import {
  extractLoadTenderWithGemini,
  generateNextLoadNumber,
} from "../services/aiLoadTender.service.js";
import { processLoadConfirmationPipeline } from "../services/loadConfirmationPipeline.service.js";
import {
  getAutomationWorkerStatus,
  runIntakeCycle,
} from "../workers/automationWorker.js";
import {
  rankDriversForLoad,
  autoAssignDriverToLoad,
} from "../services/aiDispatcherOptimizer.service.js";
import { recordAuditLog, computeFieldDiff } from "../services/auditLogger.service.js";


import { createClient } from '@supabase/supabase-js';

import WebSocket from 'ws';

if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket;
}

// Initialize Supabase Client using environment variables
// const supabase = createClient(process.env.DATABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabaseUrl = process.env.PROJECT_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = (supabaseUrl.startsWith('http'))
  ? createClient(supabaseUrl, supabaseKey, {
    realtime: {
      transport: WebSocket,
    },
  })
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
        $20,$21,$22,$23,$24,$25
      )
      RETURNING *;
      `,
      [
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

    // --- AUTOMATED CROSS-BORDER PAPS / PARS GENERATION ---
    try {
      const isCanada = (country = "", state = "", addr = "", dist = "") => {
        const text = `${country} ${state} ${addr} ${dist}`.toUpperCase();
        if (text.includes("CANADA") || text.includes(" CA ") || text.endsWith(" CA")) return true;
        const caProvs = ["ON", "QC", "BC", "AB", "MB", "SK", "NB", "NS", "NL", "PE", "ONTARIO", "QUEBEC", "TORONTO", "MONTREAL", "VANCOUVER", "WINDSOR"];
        return caProvs.some(p => new RegExp(`\\b${p}\\b`, "i").test(text));
      };

      const isUSA = (country = "", state = "", addr = "", dist = "") => {
        const text = `${country} ${state} ${addr} ${dist}`.toUpperCase();
        if (text.includes("USA") || text.includes("UNITED STATES") || text.includes(" US ") || text.endsWith(" US")) return true;
        const usStates = ["MI", "IL", "NY", "OH", "IN", "PA", "NJ", "WA", "TX", "CA", "KY", "TN", "GA", "FL", "CHICAGO", "DETROIT", "BUFFALO", "SEATTLE"];
        return usStates.some(s => new RegExp(`\\b${s}\\b`, "i").test(text));
      };

      const originIsCA = isCanada(shipper_country, shipper_state, shipper_street_address, shipper_district);
      const destIsCA = isCanada(consignee_country, consignee_state, consignee_street_address, consignee_district);
      const originIsUS = isUSA(shipper_country, shipper_state, shipper_street_address, shipper_district);
      const destIsUS = isUSA(consignee_country, consignee_state, consignee_street_address, consignee_district);

      const loadNumClean = String(newLoad.load_number || newLoad.id || "1000").replace(/\D/g, "").padStart(6, "0").slice(-6);

      if ((originIsCA && destIsUS) || (originIsCA && !destIsCA)) {
        // SOUTHBOUND / OUTBOUND FROM CANADA: Inbound US -> Generate PAPS (SCAC: NISD)
        const leadNumber = `NISD${loadNumClean}`;
        const entryNumber = `CUST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        
        let portCode = "3801";
        let portName = "Detroit Ambassador Bridge";
        if (String(consignee_state).toUpperCase() === "NY" || String(consignee_state).toUpperCase() === "NJ") {
          portCode = "0901";
          portName = "Buffalo Peace Bridge";
        } else if (String(consignee_state).toUpperCase() === "WA" || String(shipper_state).toUpperCase() === "BC") {
          portCode = "3004";
          portName = "Blaine Pacific Highway";
        }

        await pool.query(
          `INSERT INTO customs_entries (
            load_id, entry_number, border_direction, lead_number_type, lead_number,
            scac_or_carrier_code, port_of_entry_code, port_of_entry_name, port_country,
            customs_status, irs_number, customs_broker_name, customs_broker_filer_code,
            commercial_invoice_number, invoice_total_value, currency, country_of_origin,
            hts_items, ace_trip_number
          ) VALUES (
            $1, $2, 'INBOUND_US', 'PAPS', $3,
            'NISD', $4, $5, 'US',
            'PAPS_PARS_ACTIVE', '36-4928174', 'Livingston International', 'LVN-9021',
            $6, $7, 'USD', 'CA',
            $8, $9
          ) ON CONFLICT DO NOTHING;`,
          [
            newLoad.id,
            entryNumber,
            leadNumber,
            portCode,
            portName,
            `INV-US-${loadNumClean}`,
            parseFloat(rate) || 45000,
            JSON.stringify([{
              hts_code: "8708.29.5060",
              description: commodity || "Automotive vehicle stampings",
              quantity: parseInt(pieces) || 100,
              unit: "PCS",
              unit_price: 45.0,
              total_value: parseFloat(rate) || 45000,
              weight_lbs: parseFloat(weight) || 5000,
              duty_rate_pct: 2.5
            }]),
            `ACE-TRIP-${loadNumClean}`
          ]
        );

        newLoad.customs_direction = "INBOUND_US";
        newLoad.lead_number_type = "PAPS";
        newLoad.lead_number = leadNumber;
        newLoad.paps_number = leadNumber;
      } else if ((originIsUS && destIsCA) || (!originIsCA && destIsCA)) {
        // NORTHBOUND / INBOUND TO CANADA: Generate PARS (CBSA Carrier Code: 22GY)
        const leadNumber = `22GY${loadNumClean}`;
        const entryNumber = `CUST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        let portCode = "441";
        let portName = "Sarnia Blue Water Bridge (CBSA)";
        if (String(consignee_state).toUpperCase() === "BC" || String(shipper_state).toUpperCase() === "WA") {
          portCode = "813";
          portName = "Pacific Highway Crossing (CBSA)";
        }

        await pool.query(
          `INSERT INTO customs_entries (
            load_id, entry_number, border_direction, lead_number_type, lead_number,
            scac_or_carrier_code, port_of_entry_code, port_of_entry_name, port_country,
            customs_status, ins_number, customs_broker_name, customs_broker_filer_code,
            commercial_invoice_number, invoice_total_value, currency, country_of_origin,
            hts_items, aci_cargo_control_number
          ) VALUES (
            $1, $2, 'INBOUND_CA', 'PARS', $3,
            '22GY', $4, $5, 'CA',
            'PAPS_PARS_ACTIVE', '123456789RM0001', 'Willson International', 'WIL-4402',
            $6, $7, 'CAD', 'US',
            $8, $9
          ) ON CONFLICT DO NOTHING;`,
          [
            newLoad.id,
            entryNumber,
            leadNumber,
            portCode,
            portName,
            `INV-CA-${loadNumClean}`,
            parseFloat(rate) || 52000,
            JSON.stringify([{
              hts_code: "8471.30.0100",
              description: commodity || "Industrial computer processing units",
              quantity: parseInt(pieces) || 50,
              unit: "UNITS",
              unit_price: 1040.0,
              total_value: parseFloat(rate) || 52000,
              weight_lbs: parseFloat(weight) || 6000,
              duty_rate_pct: 0.0
            }]),
            leadNumber
          ]
        );

        newLoad.customs_direction = "INBOUND_CA";
        newLoad.lead_number_type = "PARS";
        newLoad.lead_number = leadNumber;
        newLoad.pars_number = leadNumber;
      }
    } catch (customsErr) {
      console.warn("Auto customs creation notice:", customsErr.message);
    }

    // Record Audit Log for Load Creation
    await recordAuditLog({
      req,
      userId: dispatcher_id,
      action: "LOAD_CREATED",
      entityType: "LOAD",
      entityId: newLoad.id,
      entityIdentifier: `Load #${newLoad.load_number}`,
      changeSummary: `Created freight load #${newLoad.load_number} for customer ${customer_name || "Commercial Shipper"} (${commodity || "General Freight"}, $${rate || 0})`,
      details: {
        load_number: newLoad.load_number,
        customer: customer_name,
        shipper: shipper_name,
        consignee: consignee_name,
        rate: rate,
        weight: weight,
        status: status
      }
    });

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
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;

    const countResult = await pool.query(`SELECT COUNT(*) FROM loads`);
    const totalCount = parseInt(countResult.rows[0]?.count || 0);

    const result = await pool.query(
      `
      SELECT
        l.*,
        u.username AS driver_name
      FROM loads l
      LEFT JOIN drivers d ON l.driver_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT $1 OFFSET $2;
      `,
      [limit, offset]
    );

    res.json({
      success: true,
      loads: result.rows,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error("getAllLoads error:", error);
    res.status(500).json({
      success: false,
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
        origin = COALESCE($1, origin),
        destination = COALESCE($2, destination),
        pickup_date = COALESCE($3, pickup_date),
        delivery_date = COALESCE($4, delivery_date),
        commodity = COALESCE($5, commodity),
        weight = COALESCE($6, weight),
        pieces = COALESCE($7, pieces),
        rate = COALESCE($8, rate),
        status = COALESCE($9, status),
        driver_id = COALESCE($10, driver_id),
        driver_notes = COALESCE($11, driver_notes)
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
        origin || null,
        destination || null,
        pickup_date || null,
        delivery_date || null,
        commodity || null,
        weight || null,
        pieces || null,
        rate || null,
        status || null,
        driver_id || null,
        driver_notes || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Load not found"
      });
    }

    console.log("Updated load status:", result.rows[0].status);

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

      const statuses = loadsResult.rows.map(r => (r.status || "").toLowerCase());

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

    const updatedLoad = result.rows[0];

    // Record Audit Log for Load Update
    await recordAuditLog({
      req,
      action: status ? "STATUS_CHANGED" : (driver_id ? "DRIVER_ASSIGNED" : "LOAD_UPDATED"),
      entityType: "LOAD",
      entityId: updatedLoad.id,
      entityIdentifier: `Load #${updatedLoad.load_number || id}`,
      changeSummary: status
        ? `Updated load #${updatedLoad.load_number} status to ${status.toUpperCase()}`
        : (driver_id
            ? `Assigned driver ${updatedLoad.driver_name || 'Driver'} to load #${updatedLoad.load_number}`
            : `Updated load #${updatedLoad.load_number} specifications (Rate: $${rate || updatedLoad.rate}, Weight: ${weight || updatedLoad.weight} lbs)`),
      details: {
        status: status || updatedLoad.status,
        rate: rate || updatedLoad.rate,
        weight: weight || updatedLoad.weight,
        driver_id: driver_id || updatedLoad.driver_id,
        driver_name: updatedLoad.driver_name,
        driver_notes: driver_notes
      }
    });

    res.json({
      success: true,
      load: updatedLoad
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

    const updatedLoad = result.rows[0];

    // Record Audit Log for status change
    await recordAuditLog({
      req,
      action: "STATUS_CHANGED",
      entityType: "LOAD",
      entityId: updatedLoad.id,
      entityIdentifier: `Load #${updatedLoad.load_number || id}`,
      changeSummary: `Changed load #${updatedLoad.load_number} status to ${status.toUpperCase()}`,
      details: {
        new_status: status,
        updated_at: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      load: updatedLoad,
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

    const deletedLoad = result.rows[0];

    // Record Audit Log for deletion
    await recordAuditLog({
      req,
      action: "LOAD_DELETED",
      entityType: "LOAD",
      entityId: id,
      entityIdentifier: `Load #${deletedLoad.load_number || id}`,
      changeSummary: `Deleted load #${deletedLoad.load_number} from dispatch system`,
      details: {
        deleted_load_number: deletedLoad.load_number,
        customer: deletedLoad.customer_name
      }
    });

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

    if (document_id) {
      await pool.query(
        `UPDATE documents SET is_approved = true, approved_by = $1 WHERE id = $2`,
        [dispatcher_id, document_id]
      ).catch(() => { });
      await pool.query(
        `UPDATE driver_documents SET status = 'approved' WHERE id = $1`,
        [document_id]
      ).catch(() => { });
    }

    if (load_id) {
      await pool.query(
        `UPDATE documents SET is_approved = true, approved_by = $1 WHERE load_id = $2 AND document_type = 'BOL'`,
        [dispatcher_id, load_id]
      ).catch(() => { });
      await pool.query(
        `UPDATE driver_documents SET status = 'approved' WHERE shipment_id = $1 OR tracking_number = $1`,
        [load_id]
      ).catch(() => { });
    }

    const targetLoadId = load_id || document_id;
    let loadData = null;
    if (targetLoadId) {
      const updatedLoad = await pool.query(
        `UPDATE loads SET status = 'picked_up' WHERE id = $1 OR load_number = $1 RETURNING *`,
        [targetLoadId]
      );
      loadData = updatedLoad.rows[0];

      // Also patch Supabase loads table via REST
      const supabaseUrl = process.env.PROJECT_URL || process.env.SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && serviceKey) {
        const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
        axios.patch(`${supabaseUrl}/rest/v1/loads?id=eq.${targetLoadId}`, { status: "picked_up" }, { headers }).catch(() => { });
        axios.patch(`${supabaseUrl}/rest/v1/loads?load_number=eq.${targetLoadId}`, { status: "picked_up" }, { headers }).catch(() => { });
      }
    }

    res.status(200).json({
      success: true,
      message: "BOL approved successfully. Load status updated to PICKED_UP.",
      load: loadData,
    });
  } catch (error) {
    console.error("approveBOL error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectBOL = async (req, res) => {
  try {
    const { load_id, document_id } = req.body;

    if (document_id) {
      await pool.query(`DELETE FROM documents WHERE id = $1`, [document_id]);
    } else if (load_id) {
      await pool.query(`DELETE FROM documents WHERE load_id = $1 AND document_type = 'BOL'`, [load_id]);
    }

    const targetLoadId = load_id || document_id;
    if (targetLoadId) {
      await pool.query(
        `UPDATE loads SET status = 'pickup_assigned' WHERE id = $1`,
        [targetLoadId]
      );
    }

    res.status(200).json({
      success: true,
      message: "BOL rejected successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/loads/parse-tender
 * Parses raw email text / load tender with Gemini AI without creating a load yet (for UI preview)
 */
export const parseInboundTender = async (req, res) => {
  try {
    const { emailText, emailSubject, senderEmail } = req.body || {};

    if (!emailText && !emailSubject) {
      return res.status(400).json({
        success: false,
        message: "Please provide emailText or emailSubject to parse.",
      });
    }

    const extractionResult = await extractLoadTenderWithGemini({
      emailText: emailText || "",
      emailSubject: emailSubject || "",
      senderEmail: senderEmail || "",
    });

    const suggestedLoadNumber = await generateNextLoadNumber();

    res.status(200).json({
      success: true,
      source: extractionResult.source,
      suggestedLoadNumber,
      tender: extractionResult.data,
    });
  } catch (error) {
    console.error("parseInboundTender error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/loads/inbound-tender
 * Automated Ingestion Webhook / Direct API replacing Make.com
 */
export const ingestInboundTenderWebhook = async (req, res) => {
  try {
    const rawBody = req.body || {};
    const emailText = rawBody.emailText || rawBody.body || rawBody.text || rawBody.html || rawBody.content || "";
    const emailSubject = rawBody.emailSubject || rawBody.subject || "Load Confirmation";
    const senderEmail = rawBody.senderEmail || rawBody.from || rawBody.sender || "customer@logistics.com";

    const result = await processLoadConfirmationPipeline({
      emailText,
      emailSubject,
      senderEmail,
      explicitTender: rawBody.tender || null,
      fileName: rawBody.fileName || "load-confirmation.pdf",
    });

    res.status(201).json({
      success: true,
      message: `Load #${result.load_number} created from tender & dispatched to ${result.assigned_team}`,
      ...result,
    });
  } catch (error) {
    console.error("ingestInboundTenderWebhook error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/loads/automation/status
 * Get telemetry for autonomous background Gmail worker
 */
export const getAutomationStatus = async (req, res) => {
  try {
    const status = getAutomationWorkerStatus();
    res.status(200).json({ success: true, ...status });
  } catch (error) {
    console.error("getAutomationStatus error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/loads/automation/trigger
 * Manually trigger an immediate background intake cycle
 */
export const triggerAutomationCycle = async (req, res) => {
  try {
    const cycleResult = await runIntakeCycle();
    res.status(200).json(cycleResult);
  } catch (error) {
    console.error("triggerAutomationCycle error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/loads/automation/upload-pdf
 * Upload a PDF Rate Confirmation directly in UI and run through 12-step pipeline
 */
export const uploadAndProcessPdfTender = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "No PDF file uploaded" });
    }

    const emailSubject = req.body.subject || file.originalname || "Load Confirmation PDF";
    const senderEmail = req.body.sender || "dispatch@customerlogistics.com";

    const result = await processLoadConfirmationPipeline({
      emailText: `Attached PDF Rate Confirmation: ${file.originalname}`,
      emailSubject,
      senderEmail,
      pdfBuffer: file.buffer,
      fileName: file.originalname,
    });

    res.status(201).json({
      success: true,
      message: `PDF parsed with Gemini AI! Load #${result.load_number} assigned to ${result.assigned_team}`,
      ...result,
    });
  } catch (error) {
    console.error("uploadAndProcessPdfTender error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/loads/ai-match-drivers
 * Evaluates fleet drivers against a load and returns ranked candidates
 */
export const aiMatchDrivers = async (req, res) => {
  try {
    const loadData = req.body || {};
    const result = await rankDriversForLoad(loadData);
    res.json({ success: true, ...result });
  } catch (error) {

    console.error("aiMatchDrivers error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/loads/auto-assign
 * 1-Click assigns driver to load and dispatches
 */
export const autoAssignDriver = async (req, res) => {
  try {
    const { loadId, driverId } = req.body;
    if (!loadId || !driverId) {
      return res.status(400).json({ success: false, message: "loadId and driverId are required" });
    }
    const result = await autoAssignDriverToLoad(loadId, driverId);
    res.json(result);
  } catch (error) {
    console.error("autoAssignDriver error:", error);
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
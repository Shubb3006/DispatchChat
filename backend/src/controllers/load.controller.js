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
import {
  updateLoadStatus as updateLoadStatusService,
  cascadeTripStatus,
  ensureLoadTrackingColumns,
  ensureTrackingToken,
  buildPublicTrackingUrl,
  findLoadByIdOrNumber,
  isUuid,
  resolveCustomerForLoad,
  notifyPrefEnabled,
  notifyMilestoneIfNeeded,
} from "../services/loadStatus.service.js";
import { notify } from "../services/notification.service.js";
import { buildPodDeliveryEmail } from "../services/emailNotifier.service.js";
import {
  getCustomerScope,
  buildLoadScopeClause,
  parseListParams,
  buildSearchClause,
  resolveSortClause,
} from "./customer.controller.js";
import { getVehicleDetails } from "../services/samsara.service.js";


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
      cube_volume,
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
        status,
        cube_volume
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
        status,
        cube_volume
      ]
    );

    const newLoad = result.rows[0];

    // --- PUBLIC TRACKING TOKEN + OPTIONAL CUSTOMER LINK ---
    try {
      await ensureLoadTrackingColumns();
      const customerId = req.body.customer_id && isUuid(req.body.customer_id) ? req.body.customer_id : null;
      await pool.query(
        `UPDATE loads SET customer_id = COALESCE($1, customer_id) WHERE id = $2`,
        [customerId, newLoad.id]
      );
      newLoad.customer_id = customerId || newLoad.customer_id || null;
      newLoad.tracking_token = await ensureTrackingToken(newLoad);
    } catch (tokenErr) {
      console.warn("Tracking token generation notice:", tokenErr.message);
    }

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
    const { hasListParams, limit, offset, q, sort } = parseListParams(req.query);

    // Customer-scoped access: users with role=customer only see their loads
    const scope = await getCustomerScope(req);
    if (scope.restricted && !scope.customerId) {
      return hasListParams
        ? res.json({ data: [], total: 0, limit, offset })
        : res.json({ success: true, loads: [] });
    }
    if (scope.restricted) {
      await ensureLoadTrackingColumns();
    }

    const params = [];
    const where = [];

    if (scope.restricted) {
      where.push(buildLoadScopeClause(scope.customerId, params));
    }

    // Legacy shape when no list params are present (backward compatible)
    if (!hasListParams) {
      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
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
${whereSql}
ORDER BY l.created_at DESC;`, params);

      return res.json({
        success: true,
        loads: result.rows
      });
    }

    if (q) {
      where.push(
        buildSearchClause(
          q,
          [
            "l.load_number",
            "l.customer_name",
            "l.customer_email",
            "l.origin",
            "l.destination",
            "l.status",
            "l.commodity",
            "l.shipper_name",
            "l.consignee_name",
            "u.username",
          ],
          params
        )
      );
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const orderSql = resolveSortClause(
      sort,
      {
        created_at: "l.created_at",
        pickup_date: "l.pickup_date",
        delivery_date: "l.delivery_date",
        load_number: "l.load_number",
        status: "l.status",
        rate: "l.rate",
        customer_name: "l.customer_name",
      },
      "ORDER BY l.created_at DESC"
    );

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT
         l.*,
         u.username AS driver_name,
         COUNT(*) OVER() AS __total
       FROM loads l
       LEFT JOIN drivers d ON l.driver_id = d.id
       LEFT JOIN users u ON d.user_id = u.id
       ${whereSql}
       ${orderSql}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const total = result.rows.length ? Number(result.rows[0].__total) : 0;
    const data = result.rows.map(({ __total, ...row }) => row);

    res.json({ data, total, limit, offset });
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
      driver_notes,
      cube_volume
    } = req.body;

    // Previous status (for milestone-change detection through loadStatus.service)
    let previousStatus = null;
    if (status) {
      try {
        await ensureLoadTrackingColumns();
        const prev = await pool.query(`SELECT status FROM loads WHERE id = $1`, [id]);
        previousStatus = prev.rows[0]?.status ?? null;
      } catch (prevErr) {
        console.warn("Previous status lookup notice:", prevErr.message);
      }
    }

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
        driver_notes = COALESCE($11, driver_notes),
        cube_volume = COALESCE($12, cube_volume)
    WHERE id = $13
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
        cube_volume || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Load not found"
      });
    }

    console.log("Updated load status:", result.rows[0].status);

    const updatedLoad = result.rows[0];

    // Trip lifecycle cascade + delivered_at stamp + customer milestone email —
    // all shared through loadStatus.service (the single status choke point).
    if (status) {
      try {
        if (String(updatedLoad.status).trim().toLowerCase() === "delivered") {
          const stamped = await pool.query(
            `UPDATE loads SET delivered_at = COALESCE(delivered_at, CURRENT_TIMESTAMP)
             WHERE id = $1 RETURNING delivered_at`,
            [updatedLoad.id]
          );
          updatedLoad.delivered_at = stamped.rows[0]?.delivered_at ?? updatedLoad.delivered_at;
        }
        await cascadeTripStatus(updatedLoad.id);
        await notifyMilestoneIfNeeded(updatedLoad, previousStatus, { source: "load_update" });
      } catch (statusErr) {
        console.error("Status side-effects failed:", statusErr.message);
      }
    } else {
      try {
        await cascadeTripStatus(updatedLoad.id);
      } catch (cascadeErr) {
        console.error("Trip status cascade failed:", cascadeErr.message);
      }
    }

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

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "status is required",
      });
    }

    // Single choke point for status transitions: update + trip cascade +
    // audit log + customer milestone notification.
    const result = await updateLoadStatusService(id, status, {
      actor: req.user || null,
      source: "api",
      req,
    });

    if (!result.ok) {
      if (result.error === "not_found") {
        return res.status(404).json({
          success: false,
          message: "Load not found",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Server Error",
      });
    }

    res.json({
      success: true,
      load: result.load,
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
    // Customer-scoped access: customer users only see their own documents
    const scope = await getCustomerScope(req);
    if (scope.restricted && !scope.customerId) {
      return res.status(200).json({ success: true, data: [] });
    }

    const params = [];
    let scopeSql = "";
    if (scope.restricted) {
      await ensureLoadTrackingColumns();
      scopeSql = ` AND ${buildLoadScopeClause(scope.customerId, params)}`;
    }

    const result = await pool.query(
      `SELECT d.*, l.load_number FROM documents d
       JOIN loads l ON d.load_id = l.id
       WHERE d.document_type = 'BOL' AND d.is_approved = false${scopeSql}
       ORDER BY d.created_at DESC`,
      params
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

    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Document storage is not configured (PROJECT_URL / SUPABASE_SERVICE_ROLE_KEY missing).",
      });
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

// Automatic POD delivery (Task E): email the customer the approved document
// links, honoring customers.notify_prefs.pod (default true).
const sendPodDeliveryEmail = async (load, approvedDocs) => {
  if (!load) return { sent: false, reason: "load_not_found" };

  const documents = (approvedDocs || [])
    .filter((doc) => doc && doc.file_path)
    .map((doc) => ({
      name: doc.file_name || `Signed ${doc.document_type || "Document"}`,
      url: doc.file_path,
    }));

  if (documents.length === 0) {
    return { sent: false, reason: "no_document_urls" };
  }

  const customer = await resolveCustomerForLoad(load);
  const recipientEmail = customer?.email || load.customer_email || null;

  if (!recipientEmail) {
    return { sent: false, reason: "no_customer_email" };
  }
  if (!notifyPrefEnabled(customer, "pod", true)) {
    return { sent: false, reason: "customer_opted_out" };
  }

  const token = await ensureTrackingToken(load);
  const trackingUrl = buildPublicTrackingUrl(token || load.load_number || load.id);
  const emailContent = buildPodDeliveryEmail({ load, documents, trackingUrl });

  const result = await notify({
    customerId: customer?.id || null,
    email: recipientEmail,
    type: "POD_DELIVERED",
    title: emailContent.subject,
    body: emailContent.text,
    html: emailContent.html,
    meta: {
      load_id: load.id,
      load_number: load.load_number || null,
      documents: documents.map((d) => d.url),
      tracking_url: trackingUrl,
    },
    channels: ["email", "inapp"],
  });

  return { sent: Boolean(result.channels?.email?.sent), to: recipientEmail, channels: result.channels };
};

// 2. Dispatcher approves BOL -> Status becomes PICKED_UP
export const approveBOL = async (req, res) => {
  try {
    const { load_id, document_id } = req.body;
    const dispatcher_id = req.user ? req.user.id : null;

    const approvedDocs = [];

    if (document_id && isUuid(document_id)) {
      const docResult = await pool.query(
        `UPDATE documents SET is_approved = true, approved_by = $1 WHERE id = $2 RETURNING *`,
        [dispatcher_id, document_id]
      ).catch(() => ({ rows: [] }));
      approvedDocs.push(...docResult.rows);

      await pool.query(
        `UPDATE driver_documents SET status = 'approved' WHERE id = $1`,
        [document_id]
      ).catch(() => { });
    }

    if (load_id) {
      // documents.load_id is a UUID column: resolve a load_number to its id
      // instead of the old "load_id = $1" pattern that throws on non-uuid input.
      const docsByLoad = await pool.query(
        isUuid(load_id)
          ? `UPDATE documents SET is_approved = true, approved_by = $1 WHERE load_id = $2 AND document_type = 'BOL' RETURNING *`
          : `UPDATE documents SET is_approved = true, approved_by = $1
             WHERE load_id IN (SELECT id FROM loads WHERE load_number = $2) AND document_type = 'BOL' RETURNING *`,
        [dispatcher_id, load_id]
      ).catch(() => ({ rows: [] }));
      approvedDocs.push(...docsByLoad.rows);

      // driver_documents.shipment_id is a UUID column: only compare it when the
      // input is a uuid, otherwise match on tracking_number alone.
      await pool.query(
        isUuid(load_id)
          ? `UPDATE driver_documents SET status = 'approved' WHERE shipment_id = $1::uuid OR tracking_number = $1::text`
          : `UPDATE driver_documents SET status = 'approved' WHERE tracking_number = $1`,
        [load_id]
      ).catch(() => { });
    }

    // Prefer the approved document's own load_id when the caller only sent a
    // document_id (the old fallback of treating a document uuid as a load id
    // never matched a load).
    const targetLoadId = load_id || approvedDocs.find((doc) => doc.load_id)?.load_id || document_id;
    let loadData = null;
    if (targetLoadId) {
      // Single choke point: status update + trip cascade + audit + milestone email.
      // findLoadByIdOrNumber/updateLoadStatusService query id OR load_number on
      // the correct column depending on uuid format (fixes the old
      // "WHERE id = $1 OR load_number = $1" uuid cast error).
      const statusResult = await updateLoadStatusService(targetLoadId, "picked_up", {
        actor: req.user || null,
        source: "bol_approval",
        meta: { document_id: document_id || null },
        req,
      });
      if (statusResult.ok) {
        loadData = statusResult.load;
      }

      // Keep the Supabase-side sync, but through the supabase client instead of
      // the previously unimported axios reference.
      if (supabase && loadData) {
        try {
          const { error: sbError } = await supabase
            .from("loads")
            .update({ status: "picked_up" })
            .eq("id", loadData.id);
          if (sbError) console.warn("Supabase loads sync notice:", sbError.message);
        } catch (sbErr) {
          console.warn("Supabase loads sync notice:", sbErr.message);
        }
      }
    }

    // Automatic POD delivery to the customer (never fails the approval)
    let podDelivery = { sent: false, reason: "not_attempted" };
    try {
      const loadForEmail = loadData || (targetLoadId ? await findLoadByIdOrNumber(targetLoadId) : null);
      podDelivery = await sendPodDeliveryEmail(loadForEmail, approvedDocs);
    } catch (podErr) {
      console.error("POD delivery email failed:", podErr.message);
      podDelivery = { sent: false, reason: podErr.message };
    }

    res.status(200).json({
      success: true,
      message: "BOL approved successfully. Load status updated to PICKED_UP.",
      load: loadData,
      pod_delivery: podDelivery,
    });
  } catch (error) {
    console.error("approveBOL error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectBOL = async (req, res) => {
  try {
    const { load_id, document_id } = req.body;

    if (document_id && isUuid(document_id)) {
      await pool.query(`DELETE FROM documents WHERE id = $1`, [document_id]);
    } else if (load_id) {
      await pool.query(
        isUuid(load_id)
          ? `DELETE FROM documents WHERE load_id = $1 AND document_type = 'BOL'`
          : `DELETE FROM documents WHERE load_id IN (SELECT id FROM loads WHERE load_number = $1) AND document_type = 'BOL'`,
        [load_id]
      );
    }

    const targetLoadId = load_id || document_id;
    if (targetLoadId) {
      // Route the rollback status through the shared choke point too
      // (uuid/load_number safe, keeps trip cascade + audit trail).
      await updateLoadStatusService(targetLoadId, "pickup_assigned", {
        actor: req.user || null,
        source: "bol_rejection",
        meta: { document_id: document_id || null },
        req,
      });
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

// ---------------------------------------------------------------------------
// PUBLIC LOAD TRACKING (Task F)
// GET /api/public-track/:token — no auth, lightly rate limited.
// Frozen response contract:
// { ok:true, load:{ load_number, status, status_history:[{status,at}],
//   origin:{city,state}, destination:{city,state},
//   stops:[{type,city,state,scheduled_at,arrived_at,departed_at}],
//   eta, last_position:{lat,lng,recorded_at}|null, delivered_at } }
// or { ok:false, error:'not_found' } / { ok:false, error:'expired' }
// ---------------------------------------------------------------------------

const publicTrackBuckets = new Map();
const PUBLIC_TRACK_WINDOW_MS = 60 * 1000;
const PUBLIC_TRACK_MAX_PER_WINDOW = parseInt(process.env.PUBLIC_TRACK_RATE_LIMIT, 10) || 60;

export const publicTrackRateLimiter = (req, res, next) => {
  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown";
  const now = Date.now();

  // Opportunistic cleanup so the map cannot grow unbounded
  if (publicTrackBuckets.size > 5000) {
    for (const [key, bucket] of publicTrackBuckets) {
      if (now - bucket.start > PUBLIC_TRACK_WINDOW_MS) publicTrackBuckets.delete(key);
    }
  }

  const bucket = publicTrackBuckets.get(ip);
  if (!bucket || now - bucket.start > PUBLIC_TRACK_WINDOW_MS) {
    publicTrackBuckets.set(ip, { start: now, count: 1 });
    return next();
  }

  bucket.count += 1;
  if (bucket.count > PUBLIC_TRACK_MAX_PER_WINDOW) {
    return res.status(429).json({ ok: false, error: "rate_limited" });
  }
  next();
};

// Parse "City, ST" style free-text into { city, state }
const splitCityState = (text) => {
  if (!text || typeof text !== "string") return { city: null, state: null };
  const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { city: null, state: null };
  if (parts.length === 1) return { city: parts[0], state: null };
  return { city: parts[0], state: parts[1] };
};

export const publicTrackLoad = async (req, res) => {
  try {
    const token = String(req.params.token || "").trim();
    if (!token) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }

    await ensureLoadTrackingColumns();

    // Resolve as tracking_token first, then exact load_number
    let result = await pool.query(`SELECT * FROM loads WHERE tracking_token = $1 LIMIT 1`, [token]);
    if (result.rows.length === 0) {
      result = await pool.query(`SELECT * FROM loads WHERE load_number = $1 LIMIT 1`, [token]);
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }

    const load = result.rows[0];

    // Lazy backfill of tracking_token for rows created before migration 101
    if (!load.tracking_token) {
      await ensureTrackingToken(load);
    }

    // Public links expire 7 days after delivery
    if (load.delivered_at) {
      const deliveredAtMs = new Date(load.delivered_at).getTime();
      if (Number.isFinite(deliveredAtMs) && Date.now() - deliveredAtMs > 7 * 24 * 60 * 60 * 1000) {
        return res.status(410).json({ ok: false, error: "expired" });
      }
    }

    // Status history from the audit trail, else minimal current status
    let statusHistory = [];
    try {
      const history = await pool.query(
        `SELECT details, created_at
         FROM audit_logs
         WHERE entity_type = 'LOAD' AND entity_id = $1 AND action = 'STATUS_CHANGED'
         ORDER BY created_at ASC`,
        [String(load.id)]
      );
      statusHistory = history.rows
        .map((row) => ({
          status: row.details?.new_status || row.details?.status || null,
          at: row.created_at,
        }))
        .filter((entry) => entry.status);
    } catch (historyErr) {
      console.warn("public-track status history notice:", historyErr.message);
    }
    if (statusHistory.length === 0) {
      statusHistory = [{ status: load.status, at: load.created_at || null }];
    }

    // Stops (load_stops holds scheduled appointment times; actual
    // arrival/departure stamping arrives with the geofence worker)
    let stops = [];
    try {
      const stopsResult = await pool.query(
        `SELECT stop_type, city, state, arrival_time, departure_time
         FROM load_stops
         WHERE load_id = $1
         ORDER BY stop_order ASC NULLS LAST, id ASC`,
        [load.id]
      );
      stops = stopsResult.rows.map((stop) => ({
        type: stop.stop_type || null,
        city: stop.city || null,
        state: stop.state || null,
        scheduled_at: stop.arrival_time || null,
        arrived_at: null,
        departed_at: null,
      }));
    } catch (stopsErr) {
      console.warn("public-track stops notice:", stopsErr.message);
    }

    const originParsed = splitCityState(load.origin);
    const destinationParsed = splitCityState(load.destination);
    const origin = {
      city: load.shipper_district || originParsed.city || null,
      state: load.shipper_state || originParsed.state || null,
    };
    const destination = {
      city: load.consignee_district || destinationParsed.city || null,
      state: load.consignee_state || destinationParsed.state || null,
    };

    // Live position: only when Samsara is actually configured and the load has
    // an assigned truck. Any failure returns null — never fabricated.
    let lastPosition = null;
    if (process.env.SAMSARA_API_TOKEN && load.truck_id) {
      try {
        const truckResult = await pool.query(`SELECT truck_number FROM trucks WHERE id = $1`, [load.truck_id]);
        const truckNumber = truckResult.rows[0]?.truck_number;
        if (truckNumber) {
          const vehicleResult = await getVehicleDetails(truckNumber);
          const vehicle = vehicleResult?.success ? vehicleResult.vehicle : null;
          if (
            vehicle &&
            Number.isFinite(Number(vehicle.latitude)) &&
            Number.isFinite(Number(vehicle.longitude))
          ) {
            lastPosition = {
              lat: Number(vehicle.latitude),
              lng: Number(vehicle.longitude),
              recorded_at: vehicle.last_reported_time || null,
            };
          }
        }
      } catch (samsaraErr) {
        console.warn("public-track Samsara position notice:", samsaraErr.message);
        lastPosition = null;
      }
    }

    return res.json({
      ok: true,
      load: {
        load_number: load.load_number || null,
        status: load.status || null,
        status_history: statusHistory,
        origin,
        destination,
        stops,
        eta: load.eta || load.delivery_date || null,
        last_position: lastPosition,
        delivered_at: load.delivered_at || null,
      },
    });
  } catch (error) {
    console.error("publicTrackLoad error:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
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
 * POST /api/load/ai-match-drivers  { loadId }
 * Ranks active fleet drivers against a load from live Samsara GPS/HOS,
 * geocoded pickup coordinates, real cross-border compliance fields, and
 * on-time delivery history. Factors that cannot be computed are omitted
 * (never fabricated) — see aiDispatcherOptimizer.service.js.
 */
export const aiMatchDrivers = async (req, res) => {
  try {
    const loadId = req.body?.loadId || req.body?.load_id || req.body?.id;
    if (!loadId) {
      return res.status(400).json({ ok: false, error: "load_id_required" });
    }
    const result = await rankDriversForLoad(loadId);
    if (!result.ok) {
      const codes = {
        load_id_required: 400,
        not_found: 404,
        samsara_not_configured: 503,
        samsara_unavailable: 503,
      };
      return res.status(codes[result.error] || 500).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error("aiMatchDrivers error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

/**
 * POST /api/load/auto-assign  { loadId, driverId }
 * Validates the driver, writes loads.driver_id/truck_id/assigned_at, and
 * dispatches through loadStatus.service. Returns real errors with proper
 * HTTP codes — never a fake success.
 */
export const autoAssignDriver = async (req, res) => {
  try {
    const { loadId, driverId } = req.body || {};
    if (!loadId || !driverId) {
      return res.status(400).json({ ok: false, error: "load_id_and_driver_id_required" });
    }
    const result = await autoAssignDriverToLoad(loadId, driverId, {
      actor: req.user || null,
      req,
    });
    if (!result.ok) {
      const codes = {
        load_id_and_driver_id_required: 400,
        load_not_found: 404,
        driver_not_found: 404,
        driver_not_active: 409,
      };
      return res.status(codes[result.error] || 500).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error("autoAssignDriver error:", error);
    res.status(500).json({ ok: false, error: error.message });
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
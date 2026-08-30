import pool from "../config/db.js";
import { ensureLoadLegsTable } from "../services/settlement.service.js";

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
      SET status = 'trip_assigned'
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
      trip: finalTrip.rows[0],
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
    // Map trip status → the correct load status to propagate.
    // Only advance loads that are at or below the new trip status in the pipeline.
    // picked_up / at_warehouse are pre-trip stages set by other flows — don't touch those.
    const TRIP_STATUS_TO_LOAD_STATUS = {
      dispatched: "dispatched",
      in_transit: "in_transit",
      completed: "delivered",
    };
    const loadStatusToSet = TRIP_STATUS_TO_LOAD_STATUS[status] || null;

    const result = await pool.query(
      `SELECT load_id FROM trip_loads WHERE trip_id = $1`,
      [id]
    );

    if (loadStatusToSet) {
      for (const row of result.rows) {
        await pool.query(
          `UPDATE loads SET status = $1 WHERE id = $2`,
          [loadStatusToSet, row.load_id]
        );
      }
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

// ---------------------------------------------------------------------------
// Relay legs (split loads) — a load driven by multiple drivers in ordered legs
// ---------------------------------------------------------------------------

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LEG_STATUSES = ["pending", "assigned", "in_progress", "completed"];

const normalizeLegRateType = (t) => {
  const s = String(t || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (["PERCENT", "PERCENTAGE", "PERCENT_OF_GROSS", "PERCENTAGE_OF_GROSS"].includes(s)) {
    return "PERCENT_OF_GROSS";
  }
  if (s === "FLAT") return "FLAT";
  if (["PER_MILE", "MILEAGE"].includes(s)) return "PER_MILE";
  return null;
};

// Validates { rate_type, rate }. Returns { ok, value?, error? }.
const validatePayOverride = (raw) => {
  if (raw === undefined || raw === null) return { ok: true, value: null };
  let obj = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      return { ok: false, error: "pay_override must be valid JSON" };
    }
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { ok: false, error: "pay_override must be an object like { rate_type, rate }" };
  }
  const rate_type = normalizeLegRateType(obj.rate_type);
  const rate = Number(obj.rate);
  if (!rate_type) {
    return {
      ok: false,
      error: "pay_override.rate_type must be PER_MILE, FLAT or PERCENT_OF_GROSS",
    };
  }
  if (!Number.isFinite(rate) || rate < 0) {
    return { ok: false, error: "pay_override.rate must be a non-negative number" };
  }
  return { ok: true, value: { rate_type, rate } };
};

// GET /api/load/:loadId/legs
export const getLoadLegs = async (req, res) => {
  try {
    await ensureLoadLegsTable();
    const { loadId } = req.params;

    if (!UUID_REGEX.test(String(loadId))) {
      return res.status(400).json({ success: false, message: "Invalid load id" });
    }

    const result = await pool.query(
      `
      SELECT ll.*, l.load_number
      FROM load_legs ll
      LEFT JOIN loads l ON ll.load_id = l.id
      WHERE ll.load_id = $1
      ORDER BY ll.seq ASC;
      `,
      [loadId]
    );

    res.json({ success: true, load_id: loadId, legs: result.rows });
  } catch (error) {
    console.error("Error fetching load legs:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// POST /api/load/:loadId/legs — create/REPLACE the whole ordered leg set for a load.
export const replaceLoadLegs = async (req, res) => {
  let client;
  let began = false;
  try {
    await ensureLoadLegsTable();
    const { loadId } = req.params;

    if (!UUID_REGEX.test(String(loadId))) {
      return res.status(400).json({ success: false, message: "Invalid load id" });
    }

    const legs = Array.isArray(req.body?.legs)
      ? req.body.legs
      : Array.isArray(req.body)
      ? req.body
      : null;

    if (!legs) {
      return res.status(400).json({
        success: false,
        message: "Body must be { legs: [...] } (an ordered array of legs)",
      });
    }

    const loadRes = await pool.query(`SELECT id, load_number FROM loads WHERE id = $1`, [loadId]);
    if (loadRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Load not found" });
    }

    // ---- Validate the leg set before touching the DB ----
    const prepared = [];
    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i] || {};
      const seq = Number(leg.seq);
      if (!Number.isInteger(seq)) {
        return res.status(400).json({
          success: false,
          message: `Leg at index ${i}: seq must be an integer`,
        });
      }
      if (!leg.origin_city || !leg.destination_city) {
        return res.status(400).json({
          success: false,
          message: `Leg at index ${i}: origin_city and destination_city are required`,
        });
      }
      if (leg.driver_id != null && !UUID_REGEX.test(String(leg.driver_id))) {
        return res.status(400).json({
          success: false,
          message: `Leg at index ${i}: driver_id must be a valid driver UUID`,
        });
      }
      const miles = leg.miles === undefined || leg.miles === null ? null : Number(leg.miles);
      if (miles !== null && (!Number.isFinite(miles) || miles < 0)) {
        return res.status(400).json({
          success: false,
          message: `Leg at index ${i}: miles must be a non-negative number`,
        });
      }
      const overrideCheck = validatePayOverride(leg.pay_override);
      if (!overrideCheck.ok) {
        return res.status(400).json({
          success: false,
          message: `Leg at index ${i}: ${overrideCheck.error}`,
        });
      }
      let status = leg.status ? String(leg.status).toLowerCase() : null;
      if (status && !LEG_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Leg at index ${i}: status must be one of ${LEG_STATUSES.join(", ")}`,
        });
      }
      if (!status) status = leg.driver_id ? "assigned" : "pending";

      prepared.push({
        seq,
        origin_city: String(leg.origin_city).trim(),
        origin_state: leg.origin_state ? String(leg.origin_state).trim() : null,
        destination_city: String(leg.destination_city).trim(),
        destination_state: leg.destination_state ? String(leg.destination_state).trim() : null,
        origin_lat: leg.origin_lat != null ? Number(leg.origin_lat) : null,
        origin_lng: leg.origin_lng != null ? Number(leg.origin_lng) : null,
        dest_lat: leg.dest_lat != null ? Number(leg.dest_lat) : null,
        dest_lng: leg.dest_lng != null ? Number(leg.dest_lng) : null,
        driver_id: leg.driver_id || null,
        truck_id: leg.truck_id || null,
        trip_id: leg.trip_id || null,
        miles,
        pay_override: overrideCheck.value,
        status,
      });
    }

    // seq contiguity: unique, ordered, no gaps (starting at 1, or 0 for 0-based callers)
    prepared.sort((a, b) => a.seq - b.seq);
    const seqs = prepared.map((p) => p.seq);
    if (new Set(seqs).size !== seqs.length) {
      return res.status(400).json({ success: false, message: "Leg seq values must be unique" });
    }
    if (seqs.length > 0) {
      if (seqs[0] !== 1 && seqs[0] !== 0) {
        return res.status(400).json({ success: false, message: "Leg seq must start at 1" });
      }
      for (let i = 1; i < seqs.length; i++) {
        if (seqs[i] !== seqs[i - 1] + 1) {
          return res.status(400).json({
            success: false,
            message: `Leg seq values must be contiguous (gap between ${seqs[i - 1]} and ${seqs[i]})`,
          });
        }
      }
    }

    // Chain check: each leg must start where the previous one ended.
    for (let i = 1; i < prepared.length; i++) {
      const prev = prepared[i - 1];
      const cur = prepared[i];
      const cityMatches =
        prev.destination_city.trim().toLowerCase() === cur.origin_city.trim().toLowerCase();
      const stateMatches =
        !prev.destination_state ||
        !cur.origin_state ||
        prev.destination_state.trim().toLowerCase() === cur.origin_state.trim().toLowerCase();
      if (!cityMatches || !stateMatches) {
        return res.status(400).json({
          success: false,
          message: `Leg ${cur.seq} origin (${cur.origin_city}${
            cur.origin_state ? ", " + cur.origin_state : ""
          }) must match leg ${prev.seq} destination (${prev.destination_city}${
            prev.destination_state ? ", " + prev.destination_state : ""
          })`,
        });
      }
    }

    // ---- Replace the leg set atomically ----
    client = await pool.connect();
    await client.query("BEGIN");
    began = true;

    await client.query(`DELETE FROM load_legs WHERE load_id = $1`, [loadId]);

    const inserted = [];
    for (const p of prepared) {
      const insertRes = await client.query(
        `
        INSERT INTO load_legs (
          load_id, trip_id, seq,
          origin_city, origin_state, destination_city, destination_state,
          origin_lat, origin_lng, dest_lat, dest_lng,
          driver_id, truck_id, miles, pay_override, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) RETURNING *;
        `,
        [
          loadId,
          p.trip_id,
          p.seq,
          p.origin_city,
          p.origin_state,
          p.destination_city,
          p.destination_state,
          p.origin_lat,
          p.origin_lng,
          p.dest_lat,
          p.dest_lng,
          p.driver_id,
          p.truck_id,
          p.miles,
          p.pay_override ? JSON.stringify(p.pay_override) : null,
          p.status,
        ]
      );
      inserted.push(insertRes.rows[0]);
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      load_id: loadId,
      load_number: loadRes.rows[0].load_number,
      legs: inserted,
    });
  } catch (error) {
    if (client && began) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackErr) {
        console.error("Rollback failed:", rollbackErr.message);
      }
    }
    console.error("Error replacing load legs:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  } finally {
    if (client) client.release();
  }
};

// PATCH /api/legs/:id — assign driver/truck, set miles, update status, pay override.
export const updateLoadLeg = async (req, res) => {
  try {
    await ensureLoadLegsTable();
    const { id } = req.params;

    if (!UUID_REGEX.test(String(id))) {
      return res.status(400).json({ success: false, message: "Invalid leg id" });
    }

    const existingRes = await pool.query(`SELECT * FROM load_legs WHERE id = $1`, [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Leg not found" });
    }
    const existing = existingRes.rows[0];

    const sets = [];
    const params = [];
    const setField = (column, value) => {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    };

    const body = req.body || {};

    if ("driver_id" in body) {
      if (body.driver_id != null && !UUID_REGEX.test(String(body.driver_id))) {
        return res
          .status(400)
          .json({ success: false, message: "driver_id must be a valid driver UUID" });
      }
      setField("driver_id", body.driver_id || null);
    }

    if ("truck_id" in body) setField("truck_id", body.truck_id || null);
    if ("trip_id" in body) setField("trip_id", body.trip_id || null);

    if ("miles" in body) {
      const miles = body.miles === null ? null : Number(body.miles);
      if (miles !== null && (!Number.isFinite(miles) || miles < 0)) {
        return res
          .status(400)
          .json({ success: false, message: "miles must be a non-negative number" });
      }
      setField("miles", miles);
    }

    if ("pay_override" in body) {
      const overrideCheck = validatePayOverride(body.pay_override);
      if (!overrideCheck.ok) {
        return res.status(400).json({ success: false, message: overrideCheck.error });
      }
      setField("pay_override", overrideCheck.value ? JSON.stringify(overrideCheck.value) : null);
    }

    if ("status" in body) {
      const status = String(body.status || "").toLowerCase();
      if (!LEG_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `status must be one of ${LEG_STATUSES.join(", ")}`,
        });
      }
      setField("status", status);
    } else if ("driver_id" in body && body.driver_id && existing.status === "pending") {
      // Assigning a driver moves a pending leg to assigned unless the caller says otherwise.
      setField("status", "assigned");
    }

    if (sets.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No updatable fields provided (driver_id, truck_id, trip_id, miles, status, pay_override)",
      });
    }

    sets.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const result = await pool.query(
      `UPDATE load_legs SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *;`,
      params
    );

    res.json({ success: true, leg: result.rows[0] });
  } catch (error) {
    console.error("Error updating load leg:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// DELETE /api/legs/:id — remove one leg and re-number the remaining legs contiguously.
export const deleteLoadLeg = async (req, res) => {
  try {
    await ensureLoadLegsTable();
    const { id } = req.params;

    if (!UUID_REGEX.test(String(id))) {
      return res.status(400).json({ success: false, message: "Invalid leg id" });
    }

    const result = await pool.query(`DELETE FROM load_legs WHERE id = $1 RETURNING *;`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Leg not found" });
    }
    const deleted = result.rows[0];

    // Keep the remaining legs contiguous (1..n) so the chain stays valid.
    await pool.query(
      `
      UPDATE load_legs ll
      SET seq = renumbered.new_seq,
          updated_at = CURRENT_TIMESTAMP
      FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY seq ASC) AS new_seq
        FROM load_legs
        WHERE load_id = $1
      ) AS renumbered
      WHERE ll.id = renumbered.id
        AND ll.seq IS DISTINCT FROM renumbered.new_seq;
      `,
      [deleted.load_id]
    );

    res.json({ success: true, message: "Leg deleted", leg: deleted });
  } catch (error) {
    console.error("Error deleting load leg:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
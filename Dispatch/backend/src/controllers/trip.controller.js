import pool from "../config/db.js";
import { calculatePcMilerRoute, geocodeAddress } from "../services/pcmiler.service.js";

let schemaReady = false;

// Applied lazily so a fresh boot works without running migrations by hand,
// matching the pattern used elsewhere in this codebase. See
// databases/129_trip_number_sequence_and_route.sql for the rationale.
const ensureTripSchema = async () => {
  if (schemaReady) return;
  await pool.query(`
    CREATE SEQUENCE IF NOT EXISTS trip_number_seq
      AS BIGINT START WITH 10000 MINVALUE 10000 INCREMENT BY 1 NO CYCLE;
  `);
  // Only reposition past existing numeric trips; a new sequence already starts
  // at 10000 and setval(9999) would breach its MINVALUE.
  await pool.query(`
    SELECT setval('trip_number_seq', existing.max_num)
      FROM (SELECT MAX(trip_number::BIGINT) AS max_num FROM trips
             WHERE trip_number ~ '^[0-9]+$') AS existing
     WHERE existing.max_num IS NOT NULL AND existing.max_num >= 10000;
  `);
  await pool.query(`
    ALTER TABLE trips
      ADD COLUMN IF NOT EXISTS origin_address      TEXT,
      ADD COLUMN IF NOT EXISTS destination_address TEXT,
      ADD COLUMN IF NOT EXISTS total_miles         NUMERIC(10,1),
      ADD COLUMN IF NOT EXISTS drive_hours         NUMERIC(6,2),
      ADD COLUMN IF NOT EXISTS route_provider      VARCHAR(50),
      ADD COLUMN IF NOT EXISTS is_truck_profile    BOOLEAN,
      ADD COLUMN IF NOT EXISTS fuel_gallons        NUMERIC(10,1),
      ADD COLUMN IF NOT EXISTS fuel_cost           NUMERIC(10,2),
      ADD COLUMN IF NOT EXISTS total_tolls         NUMERIC(10,2),
      ADD COLUMN IF NOT EXISTS border_crossing     TEXT,
      ADD COLUMN IF NOT EXISTS route_json          JSONB,
      ADD COLUMN IF NOT EXISTS routed_at           TIMESTAMP,
      ADD COLUMN IF NOT EXISTS route_error         TEXT;
  `);
  schemaReady = true;
};

const haversineMiles = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const clean = (v) => {
  const s = v == null ? "" : String(v).trim();
  return s && s !== "-" ? s : null;
};

const COUNTRY_NAMES = { USA: "USA", US: "USA", CAN: "Canada", CA: "Canada" };

// Placeholder junk ("5", "N/A", "0") is common in imported rows. Such a value
// still geocodes — to somewhere arbitrary — so it has to be rejected here rather
// than handed to the router, which would return a confident, wrong lane.
const isPlaceName = (s) => Boolean(s) && s.length >= 2 && /[A-Za-z]{2}/.test(s);

const US_ZIP = /^\d{5}(-\d{4})?$/;
const CA_POSTAL = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
const isPostalCode = (s) => Boolean(s) && (US_ZIP.test(s) || CA_POSTAL.test(s.trim()));

/* Build a routable address from the columns loads actually populate.

   `shipper_city` / `consignee_city` exist (migration 127) but nothing writes
   them — they are null on every row — so they are only a preference here, not a
   requirement. What IS populated is state (100%), zipcode (~99.6%) and street
   address (~99.9%), and a postal code is the single most precise geocoding
   input available. `origin` / `destination` are already formatted as
   "CITY, STATE, COUNTRY" on the rows that have them, so they win outright.

   Returns null when nothing narrower than a state is present: a bare state
   geocodes to a province centroid and would silently produce a plausible but
   meaningless leg. */
const loadAddress = (load, side) => {
  const preformatted = clean(load[side === "shipper" ? "origin" : "destination"]);
  if (isPlaceName(preformatted)) return preformatted;

  const cityRaw = clean(load[`${side}_city`]) || clean(load[`${side}_district`]);
  const zipRaw = clean(load[`${side}_zipcode`]);

  const city = isPlaceName(cityRaw) ? cityRaw : null;
  const zip = isPostalCode(zipRaw) ? zipRaw : null;
  const state = clean(load[`${side}_state`]);
  const country = COUNTRY_NAMES[clean(load[`${side}_country`])?.toUpperCase()] || null;

  // Deliberately city/state level — the street address is not included. Trip
  // mileage is planned between towns, and a street number only adds geocoding
  // noise (a bad street match can throw the point kilometres off).
  //
  // A state on its own resolves to a province centroid, so a usable city name
  // or a well-formed postal code is the minimum this will route on.
  if (!city && !zip) return null;

  return [city, [state, zip].filter(Boolean).join(" "), country]
    .filter(Boolean)
    .join(", ");
};

/* Order the stops of a consolidated trip.

   Taking every pickup in load order and then every delivery produces nonsense
   as soon as the loads are geographically spread: a Brampton→Florida load
   consolidated with a California→Ontario load routed as
   Ontario → California → Florida → Ontario, roughly 6,700 miles of zig-zag.

   This is a nearest-neighbour ordering under the one hard constraint that
   matters: a load's pickup must precede its own delivery. It is a heuristic,
   not an optimal TSP solution, but it produces the sequence a dispatcher would
   actually drive. */
const nearestNeighbourFrom = (entries, start) => {
  const remaining = entries.filter((e) => e !== start);
  const ordered = [start];
  const pickedUp = new Set([start.loadId]);
  let cursor = start;
  let total = 0;

  while (remaining.length) {
    // A delivery only becomes available once its own load has been picked up.
    const available = remaining.filter(
      (e) => e.type === "PICKUP" || pickedUp.has(e.loadId)
    );
    const pool = available.length ? available : remaining;

    let best = pool[0];
    let bestDist = Infinity;
    for (const cand of pool) {
      const d = haversineMiles(cursor.lat, cursor.lon, cand.lat, cand.lon);
      if (d < bestDist) {
        bestDist = d;
        best = cand;
      }
    }

    ordered.push(best);
    total += bestDist;
    if (best.type === "PICKUP") pickedUp.add(best.loadId);
    remaining.splice(remaining.indexOf(best), 1);
    cursor = best;
  }

  return { ordered, total };
};

/* Nearest-neighbour is very sensitive to where it starts, and the first load in
   the list is an arbitrary place to begin. For the Brampton→Florida plus
   California→Ontario pair, starting at Brampton yields ON→FL→CA→ON (~5,500 mi)
   while starting at Fullerton yields CA→ON→ON→FL (3,893 mi) — the same stops
   for 1,600 fewer miles. So every pickup is tried as the origin and the
   cheapest ordering wins. With a handful of loads this is trivially cheap. */
const orderStops = (entries) => {
  const candidates = entries.filter((e) => e.type === "PICKUP");
  let best = null;

  for (const start of candidates.length ? candidates : entries.slice(0, 1)) {
    const attempt = nearestNeighbourFrom(entries, start);
    if (!best || attempt.total < best.total) best = attempt;
  }

  return best.ordered;
};

const routeConsolidation = async (loads) => {
  const entries = [];
  const unroutable = [];

  for (const load of loads) {
    const label = load.load_number || load.id;
    const p = loadAddress(load, "shipper");
    const d = loadAddress(load, "consignee");
    if (p) entries.push({ address: p, type: "PICKUP", loadId: load.id, label });
    else unroutable.push(`${label} (pickup)`);
    if (d) entries.push({ address: d, type: "DELIVERY", loadId: load.id, label });
    else unroutable.push(`${label} (delivery)`);
  }

  // Routing a subset would report mileage that silently omits a real stop, so
  // the whole consolidation is refused until the address data is fixed. The
  // trip itself is still created; the dispatcher corrects the load and reroutes.
  if (unroutable.length) {
    throw Object.assign(
      new Error(
        `Cannot route: no usable city or postal code on ${unroutable.join(", ")}. ` +
          `Fix the address on these loads, then reroute the trip.`
      ),
      { code: "UNROUTABLE_LOADS", unroutable }
    );
  }

  // Ordering by proximity needs coordinates, so each distinct address is
  // geocoded once up front (the service caches, so routing reuses these).
  const coords = new Map();
  const notFound = [];
  for (const e of entries) {
    if (coords.has(e.address)) continue;
    try {
      coords.set(e.address, await geocodeAddress(e.address));
    } catch {
      notFound.push(`load ${e.label} ${e.type.toLowerCase()} "${e.address}"`);
    }
  }

  if (notFound.length) {
    throw Object.assign(
      new Error(
        `Cannot route: could not find ${notFound.join(", ")} in the US or Canada. ` +
          `Correct the location on these loads, then reroute the trip.`
      ),
      { code: "UNROUTABLE_LOADS", unroutable: notFound }
    );
  }

  const located = entries.map((e) => ({
    ...e,
    lat: coords.get(e.address).lat,
    lon: coords.get(e.address).lon,
  }));

  const sequence = orderStops(located).filter(
    (stop, i, arr) => i === 0 || arr[i - 1].address !== stop.address
  );

  if (sequence.length < 2) {
    throw Object.assign(
      new Error("Trip needs at least two distinct locations to route."),
      { code: "INSUFFICIENT_STOPS" }
    );
  }

  return calculatePcMilerRoute({
    origin: sequence[0].address,
    destination: sequence[sequence.length - 1].address,
    stops: sequence.slice(1, -1),
    routingProfile: "PRACTICAL",
  });
};

export const createTrip = async (req, res) => {
  try {
    await ensureTripSchema();

    const { driver_id, status, totalWeightLbs, totalPallets, shipmentIds } = req.body;

    if (!Array.isArray(shipmentIds) || shipmentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one load is required to build a trip",
      });
    }

    // The sequence is the single source of truth. Any trip_number in the request
    // body is ignored: a client-computed number races other dispatchers and
    // collides on the unique constraint.
    const seq = await pool.query(`SELECT nextval('trip_number_seq') AS n`);
    const trip_number = String(seq.rows[0].n);

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
      [trip_number, driver_id || null, status, totalWeightLbs, totalPallets]
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

    // Route the consolidation and keep the result on the trip. A routing failure
    // must not lose the trip the dispatcher just built, so it is recorded on the
    // row and surfaced in the response rather than thrown.
    const loadsResult = await pool.query(
      `SELECT l.* FROM trip_loads tl
         JOIN loads l ON l.id = tl.load_id
        WHERE tl.trip_id = $1
        ORDER BY tl.id`,
      [trip.id]
    );

    try {
      const route = await routeConsolidation(loadsResult.rows);
      await pool.query(
        `UPDATE trips SET
            origin_address = $1, destination_address = $2,
            total_miles = $3, drive_hours = $4,
            route_provider = $5, is_truck_profile = $6,
            fuel_gallons = $7, fuel_cost = $8,
            total_tolls = $9, border_crossing = $10,
            route_json = $11, routed_at = NOW(), route_error = NULL
          WHERE id = $12`,
        [
          route.origin,
          route.destination,
          route.officialMiles,
          route.driveHours,
          route.provider,
          route.isTruckProfile,
          route.fuel.gallons,
          route.fuel.cost,
          route.totalTolls,
          route.borderCrossing,
          JSON.stringify(route),
          trip.id,
        ]
      );
    } catch (routeErr) {
      console.warn(`Trip ${trip_number} created but routing failed:`, routeErr.message);
      await pool.query(`UPDATE trips SET route_error = $1 WHERE id = $2`, [
        routeErr.message,
        trip.id,
      ]);
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
        SET status = 'at_warehouse'
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
/* Printable trip sheet: the route stored at consolidation time, joined to the
   loads on the trip. Reprinting reuses the stored route so mileage on a
   reprinted sheet always matches the original and costs no provider quota.
   Pass ?refresh=true to deliberately re-route (e.g. after the stops changed). */
export const getTripRoute = async (req, res) => {
  try {
    await ensureTripSchema();
    const { id } = req.params;

    const tripResult = await pool.query(
      `SELECT t.*, u.username AS driver_name
         FROM trips t
         LEFT JOIN drivers d ON t.driver_id = d.id
         LEFT JOIN users u ON d.user_id = u.id
        WHERE t.id = $1`,
      [id]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const trip = tripResult.rows[0];

    const loadsResult = await pool.query(
      `SELECT l.* FROM trip_loads tl
         JOIN loads l ON l.id = tl.load_id
        WHERE tl.trip_id = $1
        ORDER BY tl.id`,
      [id]
    );

    const shouldRoute =
      req.query.refresh === "true" || (!trip.route_json && !trip.route_error);

    if (shouldRoute) {
      try {
        const route = await routeConsolidation(loadsResult.rows);
        const updated = await pool.query(
          `UPDATE trips SET
              origin_address = $1, destination_address = $2,
              total_miles = $3, drive_hours = $4,
              route_provider = $5, is_truck_profile = $6,
              fuel_gallons = $7, fuel_cost = $8,
              total_tolls = $9, border_crossing = $10,
              route_json = $11, routed_at = NOW(), route_error = NULL
            WHERE id = $12
            RETURNING *`,
          [
            route.origin, route.destination,
            route.officialMiles, route.driveHours,
            route.provider, route.isTruckProfile,
            route.fuel.gallons, route.fuel.cost,
            route.totalTolls, route.borderCrossing,
            JSON.stringify(route), id,
          ]
        );
        Object.assign(trip, updated.rows[0]);
      } catch (routeErr) {
        await pool.query(`UPDATE trips SET route_error = $1 WHERE id = $2`, [
          routeErr.message, id,
        ]);
        trip.route_error = routeErr.message;
      }
    }

    res.json({
      success: true,
      trip: {
        ...trip,
        tripLabel: `TRIP-${trip.trip_number}`,
      },
      loads: loadsResult.rows,
      route: trip.route_json || null,
      routeError: trip.route_error || null,
    });
  } catch (error) {
    console.error("Error getting trip route:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

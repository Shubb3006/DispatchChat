import pool from "../config/db.js";
import { parseListParams, buildSearchClause, resolveSortClause } from "./customer.controller.js";

// Create Trailer
export const createTrailer = async (req, res) => {
  try {
    const {
      trailer_number,
      trailer_type,
      capacity,
      plate_number,
    } = req.body;

    const existingTrailer = await pool.query(
      `
      SELECT id
      FROM trailers
      WHERE trailer_number=$1
      `,
      [trailer_number]
    );

    if (existingTrailer.rows.length > 0) {
      return res.status(400).json({
        message: "Trailer already exists",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO trailers
      (
        trailer_number,
        trailer_type,
        capacity,
        plate_number
      )

      VALUES
      ($1,$2,$3,$4)

      RETURNING *
      `,
      [
        trailer_number,
        trailer_type,
        capacity,
        plate_number,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Trailer created successfully",
      trailer: result.rows[0],
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// Get All Trailers
export const getTrailers = async (req, res) => {
  try {
    const { hasListParams, limit, offset, q, sort } = parseListParams(req.query);

    // Paginated/searchable shape when list params are present
    if (hasListParams) {
      const params = [];
      const where = [];

      if (q) {
        where.push(
          buildSearchClause(
            q,
            ["trailer_number", "trailer_type", "plate_number", "status"],
            params
          )
        );
      }

      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
      const orderSql = resolveSortClause(
        sort,
        {
          created_at: "created_at",
          trailer_number: "trailer_number",
          trailer_type: "trailer_type",
          status: "status",
        },
        "ORDER BY created_at DESC"
      );

      params.push(limit, offset);
      const result = await pool.query(
        `SELECT *, COUNT(*) OVER() AS __total
         FROM trailers
         ${whereSql}
         ${orderSql}
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );

      const total = result.rows.length ? Number(result.rows[0].__total) : 0;
      const data = result.rows.map(({ __total, ...row }) => row);

      return res.json({ data, total, limit, offset });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM trailers
      ORDER BY created_at DESC
      `
    );

    res.json({
      success: true,
      trailers: result.rows,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// Get Single Trailer
export const getTrailerById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM trailers
      WHERE id=$1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Trailer not found",
      });
    }

    res.json({
      success: true,
      trailer: result.rows[0],
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// Update Trailer
export const updateTrailer = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      trailer_number,
      trailer_type,
      capacity,
      plate_number,
      status,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE trailers

      SET
      trailer_number=$1,
      trailer_type=$2,
      capacity=$3,
      plate_number=$4,
      status=$5

      WHERE id=$6

      RETURNING *
      `,
      [
        trailer_number,
        trailer_type,
        capacity,
        plate_number,
        status,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Trailer not found",
      });
    }

    res.json({
      success: true,
      message: "Trailer updated successfully",
      trailer: result.rows[0],
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// Delete Trailer
export const deleteTrailer = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM trailers
      WHERE id=$1

      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Trailer not found",
      });
    }

    res.json({
      success: true,
      message: "Trailer deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};
// POST /api/users

import pool from "../config/db.js";
import  bcrypt  from 'bcrypt';
import { parseListParams, buildSearchClause, resolveSortClause } from "./customer.controller.js";

// export const createUser = async (req, res) => {
//     try {
//         console.log(req.body)
//       const {
//         username,
//         name,
//         role,
//         password,
//         allowedModules
//       } = req.body;
  
//       const usernameExists = await pool.query(
//         "SELECT id FROM users WHERE username = $1",
//         [username]
//       );
  
//       if (usernameExists.rows.length > 0) {
//         return res.status(400).json({
//           success: false,
//           message: "Username already exists",
//         });
//       }
//   const hashedPassword = await bcrypt.hash(password, 10);
//       const result = await pool.query(
//         `
//         INSERT INTO users
//         (
//           username,
//           full_name,
//           password,
//           role,
//           allowed_modules
//         )
//         VALUES ($1,$2,$3,$4,$5)
//         RETURNING id, username, full_name, role, allowed_modules
//         `,
//         [
//           username,
//           name,
//           hashedPassword,
//           role || "DISPATCHER",
//           allowedModules || []
//         ]
//       );
  
//     console.log("user")
  
//       return res.status(201).json({
//         success: true,
//         message: "User created successfully",
//         user: result.rows[0],
//       });
//     } catch (err) {
//         console.log(err.message)
//       res.status(500).json({
//         message: err.message,
//       });
//     }
//   };

export const createUser = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      username,
      name,
      role,
      password,
      allowedModules,
      license_number,
      license_expiry,
      eld_id,
    } = req.body;

    await client.query("BEGIN");

    // Check username
    const usernameExists = await client.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );

    if (usernameExists.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await client.query(
      `
      INSERT INTO users
      (
        username,
        full_name,
        password,
        role,
        allowed_modules
      )
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id, username, full_name, role, allowed_modules
      `,
      [
        username,
        name,
        hashedPassword,
        role || "DISPATCHER",
        allowedModules || [],
      ]
    );

    const user = userResult.rows[0];

    // If user is a driver, create driver record
    console.log(user.role)
    if (user.role === "driver") {
      await client.query(
        `
        INSERT INTO drivers
        (
          user_id,
          license_number,
          license_expiry,
          eld_id
        )
        VALUES ($1,$2,$3,$4)
        `,
        [
          user.id,
          license_number || null,
          license_expiry || null,
          eld_id || null,
        ]
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.log(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  } finally {
    client.release();
  }
};
export const getUsers = async (req, res) => {
  try {
    const { hasListParams, limit, offset, q, sort } = parseListParams(req.query);

    // Paginated/searchable shape when list params are present
    if (hasListParams) {
      const params = [];
      const where = [];

      if (q) {
        where.push(buildSearchClause(q, ["username", "full_name", "role"], params));
      }

      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
      const orderSql = resolveSortClause(
        sort,
        {
          created_at: "created_at",
          username: "username",
          full_name: "full_name",
          role: "role",
        },
        "ORDER BY created_at DESC"
      );

      params.push(limit, offset);
      const result = await pool.query(
        `SELECT
           id,
           username,
           full_name,
           role,
           allowed_modules,
           created_at,
           COUNT(*) OVER() AS __total
         FROM users
         ${whereSql}
         ${orderSql}
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );

      const total = result.rows.length ? Number(result.rows[0].__total) : 0;
      const data = result.rows.map(({ __total, ...row }) => row);

      return res.status(200).json({ data, total, limit, offset });
    }

    const result = await pool.query(`
      SELECT
        id,
        username,
        full_name,
        role,
        allowed_modules,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);

    return res.status(200).json({
      success: true,
      users: result.rows,
    });
  } catch (err) {
    console.error("Get Users Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ---------------------------------------------------------------------------
// Saved filters (/api/user/saved-filters) — per-user saved list filters
// ---------------------------------------------------------------------------

let savedFiltersTableEnsured = false;

const ensureSavedFiltersTable = async () => {
  if (savedFiltersTableEnsured) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_filters (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          page_key VARCHAR(100) NOT NULL,
          name VARCHAR(150) NOT NULL,
          params JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_saved_filters_user_page ON saved_filters(user_id, page_key);
    `);
    savedFiltersTableEnsured = true;
  } catch (err) {
    console.warn("saved_filters table verification warning:", err.message);
  }
};

// GET /api/user/saved-filters?page_key=
export const getSavedFilters = async (req, res) => {
  try {
    await ensureSavedFiltersTable();

    const { page_key } = req.query;
    const params = [req.user.id];
    let query = `SELECT * FROM saved_filters WHERE user_id = $1`;

    if (page_key) {
      params.push(page_key);
      query += ` AND page_key = $2`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);

    return res.json({
      success: true,
      filters: result.rows,
    });
  } catch (err) {
    console.error("Get Saved Filters Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// POST /api/user/saved-filters  { page_key, name, params }
export const createSavedFilter = async (req, res) => {
  try {
    await ensureSavedFiltersTable();

    const { page_key, name, params } = req.body || {};

    if (!page_key || typeof page_key !== "string" || !name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "page_key and name are required",
      });
    }
    if (params !== undefined && (typeof params !== "object" || params === null || Array.isArray(params))) {
      return res.status(400).json({
        success: false,
        message: "params must be an object",
      });
    }

    const result = await pool.query(
      `INSERT INTO saved_filters (user_id, page_key, name, params)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        req.user.id,
        page_key.trim().slice(0, 100),
        name.trim().slice(0, 150),
        JSON.stringify(params || {}),
      ]
    );

    return res.status(201).json({
      success: true,
      filter: result.rows[0],
    });
  } catch (err) {
    console.error("Create Saved Filter Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// DELETE /api/user/saved-filters/:id (owner-only)
export const deleteSavedFilter = async (req, res) => {
  try {
    await ensureSavedFiltersTable();

    const { id } = req.params;

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id || ""))) {
      return res.status(404).json({
        success: false,
        message: "Saved filter not found",
      });
    }

    const result = await pool.query(
      `DELETE FROM saved_filters WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Saved filter not found",
      });
    }

    return res.json({
      success: true,
      message: "Saved filter deleted successfully",
    });
  } catch (err) {
    console.error("Delete Saved Filter Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



export const deleteUser = async (req, res) => {


  try {
    const { id } = req.params;
    // Check if user exists
    const userExists = await pool.query(
      "SELECT id FROM users WHERE id = $1",
      [id]
    );

    if (userExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete user
    await pool.query(
      "DELETE FROM users WHERE id = $1",
      [id]
    );

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("Delete User Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// export const deleteUser = async (req, res) => {
//   const client = await pool.connect();

//   try {
//     const { id } = req.params;

//     await client.query("BEGIN");

//     const userExists = await client.query(
//       "SELECT id FROM users WHERE id = $1",
//       [id]
//     );

//     if (userExists.rows.length === 0) {
//       await client.query("ROLLBACK");

//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     // Delete driver record if it exists
//     await client.query(
//       "DELETE FROM drivers WHERE user_id = $1",
//       [id]
//     );

//     // Delete user
//     await client.query(
//       "DELETE FROM users WHERE id = $1",
//       [id]
//     );

//     await client.query("COMMIT");

//     return res.status(200).json({
//       success: true,
//       message: "User deleted successfully",
//     });

//   } catch (err) {

//     await client.query("ROLLBACK");

//     console.log(err);

//     return res.status(500).json({
//       success: false,
//       message: err.message,
//     });

//   } finally {
//     client.release();
//   }
// };
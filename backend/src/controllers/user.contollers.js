// POST /api/users

import pool from "../config/db.js";

export const createUser = async (req, res) => {
    try {
        console.log(req.body)
      const {
        username,
        name,
        role,
        allowedModules
      } = req.body;
  
      const usernameExists = await pool.query(
        "SELECT id FROM users WHERE username = $1",
        [username]
      );
  
      if (usernameExists.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Username already exists",
        });
      }
  
      const result = await pool.query(
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
          "password",
          role || "DISPATCHER",
          allowedModules || []
        ]
      );
  
    console.log("user")
  
      return res.status(201).json({
        success: true,
        message: "User created successfully",
        user: result.rows[0],
      });
    } catch (err) {
        console.log(err.message)
      res.status(500).json({
        message: err.message,
      });
    }
  };


export const getUsers = async (req, res) => {
  try {
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
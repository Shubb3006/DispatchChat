// POST /api/users

import pool from "../config/db.js";
import bcrypt from 'bcrypt';

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

// export const createUser = async (req, res) => {
//   const client = await pool.connect();

//   try {
//     const {
//       username,
//       name,
//       role,
//       password,
//       allowedModules,
//       license_number,
//       license_expiry,
//       eld_id,
//     } = req.body;

//     await client.query("BEGIN");

//     // Check username
//     const usernameExists = await client.query(
//       "SELECT id FROM users WHERE username = $1",
//       [username]
//     );

//     if (usernameExists.rows.length > 0) {
//       await client.query("ROLLBACK");
//       return res.status(400).json({
//         success: false,
//         message: "Username already exists",
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create user
//     const userResult = await client.query(
//       `
//       INSERT INTO users
//       (
//         username,
//         full_name,
//         password,
//         role,
//         allowed_modules
//       )
//       VALUES ($1,$2,$3,$4,$5)
//       RETURNING id, username, full_name, role, allowed_modules
//       `,
//       [
//         username,
//         name,
//         hashedPassword,
//         role || "DISPATCHER",
//         allowedModules || [],
//       ]
//     );

//     const user = userResult.rows[0];

//     // If user is a driver, create driver record
//     console.log(user.role)
//     if (user.role === "driver") {
//       await client.query(
//         `
//         INSERT INTO drivers
//         (
//           user_id,
//           license_number,
//           license_expiry,
//           eld_id
//         )
//         VALUES ($1,$2,$3,$4)
//         `,
//         [
//           user.id,
//           license_number || null,
//           license_expiry || null,
//           eld_id || null,
//         ]
//       );
//     }

//     await client.query("COMMIT");

//     return res.status(201).json({
//       success: true,
//       message: "User created successfully",
//       user,
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
// export const createUser = async (req, res) => {
//   const client = await pool.connect();
//   try {
//     const {
//       username,
//       name,
//       role,
//       password,
//       allowedModules,

//       // Driver
//       license_number,
//       license_expiry,
//       eld_id,

//       // Customer
//       companyName,
//       brokerContactNumber,
//       brokerEmail
//     } = req.body;

//     await client.query("BEGIN");

//     // Check username
//     const usernameExists = await client.query(
//       "SELECT id FROM users WHERE username = $1",
//       [username]
//     );

//     if (usernameExists.rows.length > 0) {
//       await client.query("ROLLBACK");

//       return res.status(400).json({
//         success: false,
//         message: "Username already exists",
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Generate customer ID
//     let customerId = null;

//     // if (role === "customer") {
//     //   const result = await client.query(`
//     //     SELECT COUNT(*) + 1 AS next_number
//     //     FROM users
//     //     WHERE customer_id IS NOT NULL
//     //   `);

//     //   const nextNumber = Number(result.rows[0].next_number);

//     //   customerId = `CUST-${String(nextNumber).padStart(5, "0")}`;
//     // }

//     // Create user
//     let customerId = null;

//     if (role === "customer") {
//       const customerResult = await client.query(
//         `
//     INSERT INTO customers
//     (
//       company_name,
//       broker_contact_number,
//       broker_email
//     )
//     VALUES ($1, $2, $3)
//     RETURNING id
//     `,
//         [
//           companyName || null,
//           brokerContactNumber || null,
//           brokerEmail || null,
//         ]
//       );

//       customerId = customerResult.rows[0].id;
//     }

//     const user = userResult.rows[0];

//     console.log("Created user:", user);

//     // Driver
//     if (user.role === "driver") {
//       await client.query(
//         `
//         INSERT INTO drivers
//         (
//           user_id,
//           license_number,
//           license_expiry,
//           eld_id
//         )
//         VALUES ($1,$2,$3,$4)
//         `,
//         [
//           user.id,
//           license_number || null,
//           license_expiry || null,
//           eld_id || null,
//         ]
//       );
//     }

//     await client.query("COMMIT");

//     return res.status(201).json({
//       success: true,
//       message: "User created successfully",
//       user,
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
export const createUser = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      username,
      name,
      role,
      password,
      allowedModules,

      // Driver
      license_number,
      license_expiry,
      eld_id,

      // Customer
      companyName,
      brokerContactNumber,
      brokerEmail,
    } = req.body;

    await client.query("BEGIN");

    // --------------------------------------------------
    // 1. Check username
    // --------------------------------------------------
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

    // --------------------------------------------------
    // 2. Hash password
    // --------------------------------------------------
    const hashedPassword = await bcrypt.hash(password, 10);

    // --------------------------------------------------
    // 3. Create customer record if role is customer
    // --------------------------------------------------
    let customerId = null;

    if (role === "customer") {
      const customerResult = await client.query(
        `
        INSERT INTO customers
        (
          company_name,
          broker_contact_number,
          broker_email,
          broker_name
        )
        VALUES ($1, $2, $3, $4)
        RETURNING id
        `,
        [
          companyName || null,
          brokerContactNumber || null,
          brokerEmail || null,
          name || null
        ]
      );

      // UUID generated by customers.id
      customerId = customerResult.rows[0].id;
    }

    // --------------------------------------------------
    // 4. Create user
    // --------------------------------------------------
    const userResult = await client.query(
      `
      INSERT INTO users
      (
        username,
        full_name,
        password,
        role,
        allowed_modules,
        customer_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        username,
        full_name,
        role,
        allowed_modules,
        customer_id
      `,
      [
        username,
        name,
        hashedPassword,
        role || "DISPATCHER",
        allowedModules || [],

        // Customer UUID
        customerId,

      ]
    );

    const user = userResult.rows[0];

    console.log("Created user:", user);

    // --------------------------------------------------
    // 5. Create driver record if role is driver
    // --------------------------------------------------
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
        VALUES ($1, $2, $3, $4)
        `,
        [
          user.id,
          license_number || null,
          license_expiry || null,
          eld_id || null,
        ]
      );
    }

    // --------------------------------------------------
    // 6. Commit transaction
    // --------------------------------------------------
    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    });

  } catch (err) {
    await client.query("ROLLBACK");

    console.error("Create user error:", err);

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
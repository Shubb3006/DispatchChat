
import  bcrypt  from 'bcrypt';
import { generateToken } from "../lib/utils.js";
import pool from '../config/db.js';


export const login = async (req, res) => {
  try {
    console.log(req.body)
    const { username, password } = req.body;

    // const result = await pool.query(
    //   "SELECT * FROM users WHERE username=$1",
    //   [username]
    // );

    const result = await pool.query(
      `
      SELECT
          u.id,
          u.username,
          u.role,
          u.allowed_modules,
          u.password,
    
          d.id AS driver_id,
          d.driver_code,
          d.license_number,
          d.license_expiry,
          d.assigned_truck_number,
          d.assigned_trailer_number,
          d.current_duty_status,
          d.status AS driver_status,
          d.current_lat,
          d.current_lng
    
      FROM users u
      LEFT JOIN drivers d
          ON d.user_id = u.id
      WHERE u.username = $1
      `,
      [username]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid username"
      });
    }

    const user = result.rows[0];

    const compare=await bcrypt.compare(password,user.password)
    if(!compare){
        return res.status(401).json({
            message:"Password is wrong"
        })
    }

    // We'll add bcrypt in the next step.
    // if (password !== user.password_hash) {
    //   return res.status(401).json({
    //     message: "Invalid password"
    //   });
    // }

    generateToken(user.id, res);
    
    
    return res.json({
        success:true,
        // user:{
        //     id:user.id,
        //     username:user.username,
        //     role:user.role,
        //     email:user.email,
        //     allowed_modules:user.allowed_modules,
        // }
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
         
          allowed_modules: user.allowed_modules,
      
          driver: user.driver_id
              ? {
                  id: user.driver_id,
                  driver_code: user.driver_code,
                  license_number: user.license_number,
                  license_expiry: user.license_expiry,
                  assigned_truck_number: user.assigned_truck_number,
                  assigned_trailer_number: user.assigned_trailer_number,
                  current_duty_status: user.current_duty_status,
                  status: user.driver_status,
                  current_lat: user.current_lat,
                  current_lng: user.current_lng,
              }
              : null,
      }


    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Server Error"
    });
  }
};

// export const signup = async (req, res) => {

//     try {
//       const {
//         firstName,
//         lastName,
//         username,
//         email,
//         password,
//         phone,
//         role
//       } = req.body;
  
//       // Check username
//       const usernameExists = await pool.query(
//         "SELECT id FROM users WHERE username=$1",
//         [username]
//       );
  
//       if (usernameExists.rows.length > 0) {
//         return res.status(400).json({
//           message: "Username already exists"
//         });
//       }
  
//       // Check email
//       const emailExists = await pool.query(
//         "SELECT id FROM users WHERE email=$1",
//         [email]
//       );
  
//       if (emailExists.rows.length > 0) {
//         return res.status(400).json({
//           message: "Email already exists"
//         });
//       }
  
//       // Encrypt password
//       const hashedPassword = await bcrypt.hash(password, 10);
  
//       const result = await pool.query(
//         `
//         INSERT INTO users
//         (
//           first_name,
//           last_name,
//           username,
//           email,
//           password,
//           phone,
//           role
//         )
//         VALUES
//         ($1,$2,$3,$4,$5,$6,$7)
//         RETURNING *
//         `,
//         [
//           firstName,
//           lastName,
//           username,
//           email,
//           hashedPassword,
//           phone,
//           role || "DISPATCHER"
//         ]
//       );


//    generateToken(result.rows[0].id,res)
  
//     return res.status(201).json({
//         success: true,
//         message: "User created successfully",
    
    
//         user:{
//             id:result.rows[0].id,
//             username:result.rows[0].username,
//             role:result.rows[0].role,
//             email:result.rows[0].email
//         }
//     });
  
//     } catch (err) {
//       console.log(err);
  
//       res.status(500).json({
//         message: "Server Error"
//       });
//     }
//   };

export const signup = async (req, res) => {
  try {
    const {
      username,
      fullName,
      password,
      role,
      allowedModules
    } = req.body;

    // Username already exists
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
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
        fullName,
        hashedPassword,
        role || "DISPATCHER",
        allowedModules || []
      ]
    );

    generateToken(result.rows[0].id, res);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: result.rows[0],
    });

  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const check = async (req, res) => {
  try {
    console.log(req.user)
    return res.status(200).json(req.user);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "internal server error" });
  }
};
export const logout = async (req, res) => {
  try {
    // Clear with the same attributes the cookie was set with, otherwise some
    // browsers won't remove it (attribute mismatch).
    res.clearCookie("jwt_token", {
      httpOnly: true,
      sameSite: process.env.COOKIE_SAMESITE || "lax",
      secure: process.env.NODE_ENV === "production",
    });
    res.status(200).json({ message: "Logged Out Succesfully" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "internal server error" });
  }
};
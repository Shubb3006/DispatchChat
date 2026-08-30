import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const protectedRoute = async (req,res,next) => {

    try {

        const token = req.cookies.jwt_token;


        if (!token) {
            return res.status(401).json({
                message: "Unauthorized - No Token Available"
            });
        }


        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        if(!decoded){
            return res.status(401).json({
                message:"Invalid Token"
            });
        }


        const result = await pool.query(
            `
           SELECT
    u.id,
    u.username,
    u.role,
    u.allowed_modules,

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
ON u.id = d.user_id

WHERE u.id = $1
            `,
            [
                decoded.userId
            ]
        );



        if(result.rows.length === 0){

            return res.status(404).json({
                message:"User not found"
            });

        }


        const user = result.rows[0];

req.user = {
  id: user.id,
  username: user.username,
  email: user.email,
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
};


        next();



    } catch(error){

        console.log(error.message);

        return res.status(401).json({
            message:"Invalid or expired token"
        });

    }

};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "Forbidden - No user role" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: `Forbidden - Required role: ${allowedRoles.join(" or ")}` });
    }
    next();
  };
};
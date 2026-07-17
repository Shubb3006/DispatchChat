import jwt from "jsonwebtoken";
import pool from "../config/db";

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
                id,
                username,
                role
            FROM users
            WHERE id=$1
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


        req.user = result.rows[0];


        next();



    } catch(error){

        console.log(error.message);

        return res.status(401).json({
            message:"Invalid or expired token"
        });

    }

};
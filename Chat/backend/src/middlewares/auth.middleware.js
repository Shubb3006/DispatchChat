import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../modals/auth.modal.js";

export const protectedRoute = async (req, res, next) => {
  try {
    let token = req.cookies?.jwt_token;

    // Fallback to Bearer token header if cookie is blocked by cross-origin policies
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token)
      return res
        .status(401)
        .json({ message: "Unauthorized - No Token Available" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId || !mongoose.Types.ObjectId.isValid(decoded.userId))
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) return res.status(404).json({ message: "User Not found" });
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(500).json({ message: "Internal server Error" });
  }
};

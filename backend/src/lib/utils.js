import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt_token", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    httpOnly: true,
    // "lax" works for same-site dev (localhost:5174 -> localhost:5555) and normal use.
    // For a cross-site HTTPS deployment (separate frontend domain), set COOKIE_SAMESITE=none.
    sameSite: process.env.COOKIE_SAMESITE || "lax",
    // Only mark Secure in production (HTTPS). In dev over http://localhost a Secure
    // cookie is silently dropped by the browser, which breaks the whole auth flow.
    secure: process.env.NODE_ENV === "production",
  });

  return token;
};

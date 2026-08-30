import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // The frontend (Vercel) and this API (Render) are on different sites, so the
  // browser only sends the cookie back when it is SameSite=None, which in turn
  // requires Secure. Locally both are on localhost, where Lax is fine and Secure
  // would stop the cookie being stored over plain http.
  const isProd = process.env.NODE_ENV !== "development";

  res.cookie("jwt_token", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000 , //milliesecond;
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
  });

  return token;
};

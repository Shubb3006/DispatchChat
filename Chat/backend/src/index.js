import express from "express";
import dotenv from "dotenv";
import dns from "dns";

// Fix Windows DNS SRV lookup issues for MongoDB Atlas clusters
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  // Ignore if not supported in environment
}

import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route.js";
import statusRoutes from "./routes/status.route.js";
import messageRoutes from "./routes/message.route.js";
import groupRoutes from "./routes/group.route.js";
import utilRoutes from "./routes/util.route.js";
import loadRoutes from "./routes/load.route.js";
import { connectDB } from "./lib/db.js";
import cors from "cors";
import path from "path";
import { app, io, server } from "./lib/socket.js";
dotenv.config();

const PORT = process.env.PORT;

const __dirname = path.resolve();

// This will allow us to extract json data out of the body
app.use(cookieParser()); //
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));
app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  })
);

app.use("/api/auth", authRoutes); // for api calls it will go to auth.route.js
app.use("/api/messages", messageRoutes); // for api calls about messages it will go to auth.route.js
app.use("/api/status", statusRoutes); // for api calls about messages it will go to auth.route.js
app.use("/api/groups", groupRoutes);
app.use("/api/util", utilRoutes);
app.use("/api/load", loadRoutes);

if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "../frontend/dist");

  app.use(express.static(distPath));

  app.use((req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server is running at PORT:" + PORT);
  connectDB();
});

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";


import authRoutes from "./routes/auth.routes.js";
import loadRoutes from "./routes/load.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import ratesRoutes from "./routes/rates.routes.js";
import driverRoutes from "./routes/driver.routes.js"
import trailorRoutes from "./routes/trailor.routes.js"
import truckRoutes from "./routes/trucks.routes.js"
import locationRoutes from "./routes/location.routes.js"
import loadStopsRoutes from "./routes/load_stop.route.js"
import userRoutes from "./routes/user.routes.js"
import tripRoutes from "./routes/trip.routes.js"
import hosLogRoutes from "./routes/hos.route.js";
import driverDocumentRoutes from "./routes/driver_document.route.js";
import safetyIncidentRoutes from "./routes/safety_incident.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import customsRoutes from "./routes/customs.routes.js";
import telematicsRoutes from "./routes/telematics.routes.js";
import messageRoutes from "./routes/message.routes.js";
import detentionRoutes from "./routes/detention.routes.js";
import maintenanceRoutes from "./routes/maintenance.routes.js";
import etaRadarRoutes from "./routes/etaRadar.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import settlementRoutes from "./routes/settlement.routes.js";
import portalRoutes from "./routes/portal.routes.js";
import { publicTrackByToken } from "./controllers/portalLoad.controller.js";
import pcmilerRoutes from "./routes/pcmiler.routes.js";
import loadJourneyRoutes from "./routes/loadJourney.routes.js";
import routeOptimizationRoutes from "./routes/routeOptimization.routes.js";
import { startAutomationWorker } from "./workers/automationWorker.js";
import { ensurePortalSchema } from "./services/portalSchema.service.js";


import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const PORT = process.env.PORT || 5500;

// Local Vite dev servers, plus any extra origins named in CLIENT_URLS
// (comma-separated, e.g. CLIENT_URLS="https://tms.example.com").
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  ...(process.env.CLIENT_URLS || process.env.CLIENT_URL || "")
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean),
];

// The Vercel frontend, which a fixed list cannot cover: alongside the stable
// production domain, every push publishes a preview under a generated hostname.
// The second pattern is scoped to our own Vercel account slug.
const allowedOriginPatterns = [
  /^https:\/\/dispatch-app-gamma-eight\.vercel\.app$/,
  /^https:\/\/[a-z0-9-]+-shubb3006s-projects\.vercel\.app$/,
];

app.use(
  cors({
    origin: (origin, callback) => {
      // No Origin header: curl, the native mobile app, server-to-server.
      if (!origin) return callback(null, true);

      const ok =
        allowedOrigins.includes(origin) ||
        allowedOriginPatterns.some((re) => re.test(origin));

      return ok
        ? callback(null, true)
        : callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
); //
app.use(cookieParser());

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/api/auth", authRoutes);
// Customer/broker portal surface (see routes/portal.routes.js).
app.use("/api/portal", portalRoutes);
// Public, token-only shipment tracking — the link a broker forwards on.
app.get("/api/track/:token", publicTrackByToken);
app.use("/api/load", loadRoutes);
app.use("/api/loads", loadRoutes);
app.use("/api/v1/loads", loadRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/customers", customerRoutes)
app.use("/api/rates", ratesRoutes);
app.use("/api/v1/rates", ratesRoutes);
app.use("/api/drivers", driverRoutes)
app.use("/api/trailors", trailorRoutes);
app.use("/api/trucks", truckRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/load_stops", loadStopsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/hos-logs", hosLogRoutes);
app.use("/api/driver-documents", driverDocumentRoutes);
app.use("/api/safety-incidents", safetyIncidentRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/customs", customsRoutes);
app.use("/api/telematics", telematicsRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/detention", detentionRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/v1/maintenance", maintenanceRoutes);
app.use("/api/eta-radar", etaRadarRoutes);
app.use("/api/v1/eta-radar", etaRadarRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/v1/audit-logs", auditRoutes);
app.use("/api/settlements", settlementRoutes);
app.use("/api/v1/settlements", settlementRoutes);
app.use("/api/pcmiler", pcmilerRoutes);
app.use("/api/v1/pcmiler", pcmilerRoutes);
app.use("/api/load-journey", loadJourneyRoutes);
app.use("/api/route-optimization", routeOptimizationRoutes);




app.get("/hi", (req, res) => {
  res.send("Hello")
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start autonomous background load confirmation intake worker
  startAutomationWorker();
  // Apply the customer-portal schema (idempotent) so users.customer_id and
  // rate_requests exist before any portal traffic arrives.
  ensurePortalSchema().catch((err) =>
    console.error("Portal schema startup ensure failed (will retry on first portal request):", err.message)
  );
});
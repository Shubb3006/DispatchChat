import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";


import authRoutes from "./routes/auth.routes.js";
import loadRoutes from "./routes/load.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import customerRoutes from "./routes/customer.routes.js";
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

import messageRoutes from "./routes/message.routes.js";

dotenv.config();


const app = express();
const PORT = process.env.PORT || 5500;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
    ],
    credentials: true,
  })
); //
app.use(cookieParser());

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/load",loadRoutes)
app.use("/api/upload",uploadRoutes)
app.use("/api/customers",customerRoutes)
app.use("/api/drivers",driverRoutes)
app.use("/api/trailors",trailorRoutes);
app.use("/api/trucks",truckRoutes);
app.use("/api/locations",locationRoutes);
app.use("/api/load_stops",loadStopsRoutes);
app.use("/api/user",userRoutes);
app.use("/api/trips",tripRoutes);
app.use("/api/hos-logs", hosLogRoutes);
app.use("/api/driver-documents", driverDocumentRoutes);
app.use("/api/safety-incidents", safetyIncidentRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/messages", messageRoutes);


app.get("/hi",(req,res)=>{
  res.send("Hello")
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
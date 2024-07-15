import mongoose from "mongoose";
import express from "express";
import cookieParser from "cookie-parser";

import scheduleRoutes from "./routes/schedule.route.js";
import stationRoutes from "./routes/station.route.js";
import userRoutes from "./routes/user.route.js";
import bookingRoutes from "./routes/booking.route.js";
import adminRoutes from "./routes/admin.route.js";

import { releaseExpiredPendingBookings } from "./controllers/helpers/booking.helper.js";

import cors from "cors";
import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

// import { releaseExpiredHolds } from "./controllers/allControllers.js";
const app = express();

// const dbUrl = process.env.DB_URL;
const dbUrl = "mongodb://127.0.0.1:27017/RailWise";

mongoose
  .connect(dbUrl)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB", err);
  });

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173", // Your frontend URL
    credentials: true, // Allow credentials (cookies) to be included in requests
  })
);
app.use("/api/stations", stationRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

// Periodic task to release expired booking holds
setInterval(releaseExpiredPendingBookings, 60 * 1000); // Run every minute

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  //in ES6 if var and key are the same, you can just write the key
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});

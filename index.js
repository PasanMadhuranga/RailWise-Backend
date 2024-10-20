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

const app = express();

const dbUrl = process.env.DB_URL;
// const dbUrl = "mongodb://127.0.0.1:27017/RailWise";

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
    origin: [
      "https://railwise-web.onrender.com",
      "https://railwise-admin.onrender.com",
    ],
    credentials: true,
  })
);

app.use("/api/stations", stationRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

setInterval(releaseExpiredPendingBookings, 60 * 1000);

app.get('/', (req, res) => {
  res.status(200).send('OK');
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

app.listen(3000, () => {
  console.log(`Server listening on http://localhost:3000`);
});

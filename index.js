import mongoose from "mongoose";
import express from "express";
import allRoutes from "./routes/allRoutes.js";
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
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true, // Allow credentials (cookies) to be included in requests
}));
app.use("/api", allRoutes);

// Periodic task to release expired booking holds
// setInterval(releaseExpiredHolds, 60 * 1000); // Run every minute

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

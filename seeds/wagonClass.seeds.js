import mongoose from "mongoose";
import wagonClass from "../models/wagonClass.model.js";

const dbUrl = "mongodb://127.0.0.1:27017/train-booking-test";

// Connect to MongoDB
mongoose
  .connect(dbUrl)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB", err);
  });

const wagonClasses = [
  { name: "first", fareMultiplier: 4 },
  { name: "second", fareMultiplier: 2 },
  { name: "third", fareMultiplier: 1 },
];

const createWagonClasses = async () => {
  try {
    // Check if WagonClasses already exist
    const existingWagonClasses = await wagonClass.find({});
    if (existingWagonClasses.length > 0) {
      console.log("wagonClasses already populated");
      return;
    }

    // Create wagonType instances
    await wagonClass.insertMany(wagonClasses);

    console.log("WagonClasses successfully populated");
  } catch (error) {
    console.error("Error populating wagonClasses:", error);
  } finally {
    mongoose.connection.close();
  }
};

createWagonClasses();

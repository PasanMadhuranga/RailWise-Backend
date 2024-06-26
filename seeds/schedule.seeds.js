import mongoose from "mongoose";
import Train from "../models/train.model.js";
import Schedule from "../models/schedule.model.js";
import Station from "../models/station.model.js";

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

const journeys = [
  { source: "Beliaththa", destination: "Maradana" },
  { source: "Beliaththa", destination: "Anuradhapura" },
  { source: "Colombo Fort", destination: "Kankesanthurai" },
];

const returnJourneys = [
  { source: "Maradana", destination: "Beliaththa" },
  { source: "Anuradhapura", destination: "Beliaththa" },
  { source: "Kankesanthurai", destination: "Colombo Fort" },
];

// Function to create schedule data
const createSchedules = async () => {
  try {
    // Get the train data
    const trains = await Train.find({});

    // Check if schedules already exist
    const existingSchedules = await Schedule.find({});
    if (existingSchedules.length > 0) {
      console.log("Schedules already populated");
      return;
    }

    // Create schedule instances
    const schedules = [];
    const scheduleDays = [
      {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: false,
      },
      {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true,
      },
      {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
      },
    ];

    for (let i = 0; i < trains.length; i++) {
      const randomSchedule =
        scheduleDays[Math.floor(Math.random() * scheduleDays.length)];
        const srcStation = await Station.findOne({ name: journeys[i].source });
        const destStation = await Station.findOne({ name: journeys[i].destination });
        schedules.push({
          trainRef: trains[i]._id,
          sourceRef: srcStation._id,
          destinationRef: destStation._id,
          ...randomSchedule,
        });

        const returnSrcStation = await Station.findOne({ name: returnJourneys[i].source });
        const returnDestStation = await Station.findOne({ name: returnJourneys[i].destination });
        schedules.push({
          trainRef: trains[i]._id,
          sourceRef: returnSrcStation._id,
          destinationRef: returnDestStation._id,
          ...randomSchedule,
        });
    }

    // Insert schedule data into the database
    await Schedule.insertMany(schedules);

    console.log("Schedules successfully populated");
  } catch (error) {
    console.error("Error populating schedules:", error);
  } finally {
    mongoose.connection.close();
  }
};

createSchedules();

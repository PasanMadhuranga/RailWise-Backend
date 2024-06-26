import mongoose from "mongoose";
import Wagon from "../models/wagon.model.js";
import Seat from "../models/seat.model.js";

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

async function populateWagons() {

  const seatsArr = await Seat.find();

  await Wagon.insertMany([
    { wagonNumber: 1, wagonClass: "first class", seats: seatsArr.slice(0, 20).map(seat => seat._id) },
    { wagonNumber: 2, wagonClass: "second class", seats: seatsArr.slice(20, 40).map(seat => seat._id) },
    { wagonNumber: 3, wagonClass: "second class", seats: seatsArr.slice(40, 60).map(seat => seat._id) },
    { wagonNumber: 4, wagonClass: "third class", seats: seatsArr.slice(60, 80).map(seat => seat._id) },
    { wagonNumber: 5, wagonClass: "third class", seats: seatsArr.slice(80, 100).map(seat => seat._id) },

    { wagonNumber: 1, wagonClass: "first class", seats: seatsArr.slice(100, 120).map(seat => seat._id) },
    { wagonNumber: 2, wagonClass: "second class", seats: seatsArr.slice(120, 140).map(seat => seat._id) },
    { wagonNumber: 3, wagonClass: "second class", seats: seatsArr.slice(140, 160).map(seat => seat._id) },

    { wagonNumber: 1, wagonClass: "second class", seats: seatsArr.slice(160, 180).map(seat => seat._id) },
    { wagonNumber: 2, wagonClass: "third class", seats: seatsArr.slice(180, 200).map(seat => seat._id) },
  ]);
  console.log("Wagons populated successfully");
  // Close the connection
  await mongoose.connection.close();
}

populateWagons().catch((err) => console.error(err));

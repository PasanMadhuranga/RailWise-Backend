import Wagon from "../models/wagon.model.js";
import WagonClass from "../models/wagonClass.model.js";
import Seat from "../models/seat.model.js";

async function populateWagons() {
  try {
  // Find all Wagon types
  const wagonClasses = await WagonClass.find();
  const seatsArr = await Seat.find();

  // Assuming Wagon types are named 'First Class', 'Second Class', and 'Third Class'
  const firstClassType = wagonClasses.find((type) => type.name === "first");
  const secondClassType = wagonClasses.find(
    (type) => type.name === "second"
  );
  const thirdClassType = wagonClasses.find((type) => type.name === "third");

  await Wagon.insertMany([
    { wagonNumber: 1, wagonClassRef: firstClassType._id, seats: seatsArr.slice(0, 20).map(seat => seat._id) },
    { wagonNumber: 2, wagonClassRef: secondClassType._id, seats: seatsArr.slice(20, 40).map(seat => seat._id) },
    { wagonNumber: 3, wagonClassRef: secondClassType._id, seats: seatsArr.slice(40, 60).map(seat => seat._id) },
    { wagonNumber: 4, wagonClassRef: thirdClassType._id, seats: seatsArr.slice(60, 80).map(seat => seat._id) },
    { wagonNumber: 5, wagonClassRef: thirdClassType._id, seats: seatsArr.slice(80, 100).map(seat => seat._id) },

    { wagonNumber: 1, wagonClassRef: firstClassType._id, seats: seatsArr.slice(100, 120).map(seat => seat._id) },
    { wagonNumber: 2, wagonClassRef: secondClassType._id, seats: seatsArr.slice(120, 140).map(seat => seat._id) },
    { wagonNumber: 3, wagonClassRef: secondClassType._id, seats: seatsArr.slice(140, 160).map(seat => seat._id) },

    { wagonNumber: 1, wagonClassRef: secondClassType._id, seats: seatsArr.slice(160, 180).map(seat => seat._id) },
    { wagonNumber: 2, wagonClassRef: thirdClassType._id, seats: seatsArr.slice(180, 200).map(seat => seat._id) },
  ]);

  console.log("Wagones successfully populated");

  const wagons = await Wagon.find().populate("seats");

  for (const wagon of wagons) {
    for (const seat of wagon.seats) {
      seat.wagonRef = wagon._id;
      await seat.save();
    }
  }

  console.log("respectively populated seat references");
} catch (error) {
  console.error("Error populating wagons:", error);
}
}

export default populateWagons;

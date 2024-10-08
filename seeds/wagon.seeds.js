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
    // wagons of Galu Kumari
    { wagonNumber: 1, wagonClassRef: firstClassType._id, seats: seatsArr.slice(0, 32).map(seat => seat._id) },
    { wagonNumber: 2, wagonClassRef: secondClassType._id, seats: seatsArr.slice(32, 72).map(seat => seat._id) },
    { wagonNumber: 3, wagonClassRef: secondClassType._id, seats: seatsArr.slice(72, 112).map(seat => seat._id) },
    { wagonNumber: 4, wagonClassRef: thirdClassType._id, seats: seatsArr.slice(112, 172).map(seat => seat._id) },
    { wagonNumber: 5, wagonClassRef: thirdClassType._id, seats: seatsArr.slice(172, 232).map(seat => seat._id) },

    // wagons of Rajarata Rajina
    { wagonNumber: 1, wagonClassRef: firstClassType._id, seats: seatsArr.slice(232, 264).map(seat => seat._id) },
    { wagonNumber: 2, wagonClassRef: secondClassType._id, seats: seatsArr.slice(264, 304).map(seat => seat._id) },
    { wagonNumber: 3, wagonClassRef: secondClassType._id, seats: seatsArr.slice(304, 344).map(seat => seat._id) },

    // wagons of Uttara Devi
    { wagonNumber: 1, wagonClassRef: secondClassType._id, seats: seatsArr.slice(344, 384).map(seat => seat._id) },
    { wagonNumber: 2, wagonClassRef: thirdClassType._id, seats: seatsArr.slice(384, 444).map(seat => seat._id) },

    // wagons of Ruhunu Kumari
    { wagonNumber: 1, wagonClassRef: firstClassType._id, seats: seatsArr.slice(444, 476).map(seat => seat._id) },
    { wagonNumber: 2, wagonClassRef: firstClassType._id, seats: seatsArr.slice(476, 508).map(seat => seat._id) },
    { wagonNumber: 3, wagonClassRef: secondClassType._id, seats: seatsArr.slice(508, 548).map(seat => seat._id) },
    { wagonNumber: 4, wagonClassRef: secondClassType._id, seats: seatsArr.slice(548, 588).map(seat => seat._id) },
    { wagonNumber: 5, wagonClassRef: thirdClassType._id, seats: seatsArr.slice(588, 648).map(seat => seat._id) },
    { wagonNumber: 6, wagonClassRef: thirdClassType._id, seats: seatsArr.slice(648, 708).map(seat => seat._id) },
    { wagonNumber: 7, wagonClassRef: thirdClassType._id, seats: seatsArr.slice(708, 768).map(seat => seat._id) },
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

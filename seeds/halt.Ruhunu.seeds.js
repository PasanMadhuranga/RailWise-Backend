import Halt from "../models/halt.model.js";
import Station from "../models/station.model.js";
import Schedule from "../models/schedule.model.js";
import Train from "../models/train.model.js";

const stationsData = [
  { name: "Matara", arrival: "06:05 am", departure: "06:07 am" },
  { name: "Weligama", arrival: "06:20 am", departure: "06:21 am" },
  { name: "Ahangama", arrival: "06:30 am", departure: "06:31 am" },
  { name: "Habaraduwa", arrival: "06:38 am", departure: "06:39 am" },
  { name: "Galle", arrival: "06:53 am", departure: "07:03 am" },
  { name: "Hikkaduwa", arrival: "07:20 am", departure: "07:22 am" },
  { name: "Ambalangoda", arrival: "07:33 am", departure: "07:34 am" },
  { name: "Kosgoda", arrival: "07:46 am", departure: "07:44 am" },
  { name: "Aluthgama", arrival: "07:58 am", departure: "08:00 am" },
  { name: "Kalutara South", arrival: "08:19 am", departure: "08:21 am" },
  { name: "Colombo Fort", arrival: "09:16 am", departure: "09:18 am" },
  { name: "Maradana", arrival: "09:23 am", departure: "09:23 am" },
];

const populateRuhunuHalts = async () => {
  try {
    const train = await Train.findOne({ name: "Ruhunu Kumari" }); // Replace with your train name
    const relevantSchedules = await Schedule.find({ trainRef: train._id });
    const schedule = relevantSchedules[0];
    let price = 0; // Starting fare price

    for (let i = 0; i < stationsData.length; i++) {
      const stationData = stationsData[i];
      const station = await Station.findOne({ name: stationData.name });

      if (!station) {
        console.log(`Station not found: ${stationData.name}`);
        continue;
      }

      const halt = new Halt({
        scheduleRef: schedule._id,
        stationRef: station._id,
        arrivalTime: stationData.arrival,
        departureTime: stationData.departure,
        haltOrder: i + 1,
        platform: Math.floor(Math.random() * 5) + 1,
        price: price,
      });
      price += Math.floor(Math.random() * (50 - 10 + 1)) + 10;
      await halt.save();
    }
    console.log("Ruhunu Kumari halts populated successfully");
  } catch (error) {
    console.error("Error populating Ruhunu Kumari halts:", error);
  }
};

export default populateRuhunuHalts;

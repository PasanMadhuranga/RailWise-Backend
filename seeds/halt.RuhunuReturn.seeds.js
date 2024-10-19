import Halt from "../models/halt.model.js";
import Station from "../models/station.model.js";
import Schedule from "../models/schedule.model.js";
import Train from "../models/train.model.js";

const stationsData = [
  { name: "Maradana", arrival: "03:40 pm", departure: "03:40 pm" },
  { name: "Colombo Fort", arrival: "03:44 pm", departure: "03:50 pm" },
  { name: "Kalutara South", arrival: "04:31 pm", departure: "04:33 pm" },
  { name: "Aluthgama", arrival: "04:47 pm", departure: "04:48 pm" },
  { name: "Kosgoda", arrival: "04:57 pm", departure: "04:58 pm" },
  { name: "Ambalangoda", arrival: "05:08 pm", departure: "05:09 pm" },
  { name: "Hikkaduwa", arrival: "05:19 pm", departure: "05:20 pm" },
  { name: "Galle", arrival: "05:34 pm", departure: "05:40 pm" },
  { name: "Ahangama", arrival: "05:59 pm", departure: "06:00 pm" },
  { name: "Weligama", arrival: "06:07 pm", departure: "06:08 pm" },
  { name: "Matara", arrival: "06:21 pm", departure: "06:21 pm" },
];

const populateRuhunuReturnHalts = async () => {
  try {
    const train = await Train.findOne({ name: "Ruhunu Kumari" }); 
    const relevantSchedules = await Schedule.find({ trainRef: train._id });
    const schedule = relevantSchedules[1]; 
    let price = 0; 

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

export default populateRuhunuReturnHalts;

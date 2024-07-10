import Train from "../models/train.model.js";
import Schedule from "../models/schedule.model.js";

const scheduleTypes = ["express", "slow"];

// Function to create schedule data
const populateSchedules = async () => {
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

        schedules.push({
          trainRef: trains[i]._id,
          ...randomSchedule,
          scheduleType: scheduleTypes[Math.floor(Math.random() * scheduleTypes.length)],
        });

        schedules.push({
          trainRef: trains[i]._id,
          ...randomSchedule,
          scheduleType: scheduleTypes[Math.floor(Math.random() * scheduleTypes.length)],
        });
    }

    // Insert schedule data into the database
    await Schedule.insertMany(schedules);

    console.log("Schedules successfully populated");
  } catch (error) {
    console.error("Error populating schedules:", error);
  }
};

export default populateSchedules;

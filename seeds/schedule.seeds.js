import Train from "../models/train.model.js";
import Schedule from "../models/schedule.model.js";

const scheduleTypes = ["express", "slow"];
const names = [
  "Beliatta - Maradana",
  "Beliatta - Anuradhapura",
  "Colombo Fort - Kankesanthurai",
  "Matara - Maradana",
]

const returnNmaes = [
  "Maradana - Beliatta",
  "Anuradhapura - Beliatta",
  "Kankesanthurai - Colombo Fort",
  "Maradana - Matara",
]

const populateSchedules = async () => {
  try {
    const trains = await Train.find({});

    const existingSchedules = await Schedule.find({});
    if (existingSchedules.length > 0) {
      console.log("Schedules already populated");
      return;
    }

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
          name: names[i],
          trainRef: trains[i]._id,
          ...randomSchedule,
          scheduleType: scheduleTypes[Math.floor(Math.random() * scheduleTypes.length)],
        });

        schedules.push({
          name: returnNmaes[i],
          trainRef: trains[i]._id,
          ...randomSchedule,
          scheduleType: scheduleTypes[Math.floor(Math.random() * scheduleTypes.length)],
        });
    }

    await Schedule.insertMany(schedules);

    console.log("Schedules successfully populated");
  } catch (error) {
    console.error("Error populating schedules:", error);
  }
};

export default populateSchedules;

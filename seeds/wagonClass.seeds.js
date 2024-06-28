import wagonClass from "../models/wagonClass.model.js";

const wagonClasses = [
  { name: "first", fareMultiplier: 4 },
  { name: "second", fareMultiplier: 2 },
  { name: "third", fareMultiplier: 1 },
];

const populateWagonClasses = async () => {
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
  }
};

export default populateWagonClasses;

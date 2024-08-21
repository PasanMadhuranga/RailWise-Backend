import mongoose from "mongoose";
import populateWagonClasses from "./wagonClass.seeds.js";
import populateSeats from "./seat.seeds.js";
import populateWagons from "./wagon.seeds.js";
import populateTrains from "./train.seeds.js";
import populateStations from "./station.seeds.js";
import populateSchedules from "./schedule.seeds.js";
import populateGaluHalts from "./halt.Galu.seeds.js";
import populateGaluReturnHalts from "./halt.GaluReturn.seeds.js";
import populateRajaRataHalts from "./halt.RajaRata.seeds.js";
import populateRajaRataReturnHalts from "./halt.RajaRataReturn.seeds.js";
import populateUttaraHalts from "./halt.Uttara.seeds.js";
import populateUttaraReturnHalts from "./halt.UttaraReturn.seeds.js";
import populateUsersAndCardDetails from "./user.seeds.js";
import populateBookings from "./booking.seeds.js";
import populateAdmins from "./admin.seeds.js";

// const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/RailWise";
// const dbUrl = "mongodb://localhost:27017/RailWise";
const dbUrl = "mongodb://127.0.0.1:27017/RailWise";

// Connect to MongoDB
mongoose
  .connect(dbUrl)
  .then(() => {
    console.log("----- Connected to MongoDB -----");
    populateDatabase();
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB", err);
  });

const populateDatabase = async () => {
  try {
    await populateWagonClasses();
    await populateSeats();
    await populateWagons();
    await populateTrains();
    await populateStations();
    await populateSchedules();
    await populateGaluHalts();
    await populateGaluReturnHalts();
    await populateRajaRataHalts();
    await populateRajaRataReturnHalts();
    await populateUttaraHalts();
    await populateUttaraReturnHalts();
    await populateUsersAndCardDetails();
    await populateBookings();
    await populateAdmins();

    console.log("----- Database successfully populated -----");
  } catch (error) {
    console.error("Error populating database:", error);
  } finally {
    mongoose.connection.close();
  }
};
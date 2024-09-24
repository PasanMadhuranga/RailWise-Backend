import cron from "node-cron";
import Booking from "../models/booking.model.js";

// Schedule the task to run at midnight (00:00) every day
cron.schedule("0 0 * * *", async () => {
  try {
    const result = await Booking.deleteMany({ status: "expired" });
    console.log(`Expired bookings deleted: ${result.deletedCount}`);
  } catch (error) {
    console.error("Error deleting expired bookings:", error);
  }
});

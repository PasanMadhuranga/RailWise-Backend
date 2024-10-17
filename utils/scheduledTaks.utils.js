import cron from "node-cron";
import Booking from "../models/booking.model.js";

// Schedule to delete expired bookings every day at midnight
cron.schedule("0 0 * * *", async () => {
  try {
    const result = await Booking.deleteMany({ status: "expired" });
    console.log(`Expired bookings deleted: ${result.deletedCount}`);
  } catch (error) {
    console.error("Error deleting expired bookings:", error);
  }
});

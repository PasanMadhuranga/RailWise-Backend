import express from "express";
import { catchAsync } from "../utils/catchAsync.utils.js";
import {
  getBookingsCount,
  getTotalFare,
  getUserRegistrations,
  getBookingClassDistribution,
  getBookings,
  getSchedules,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.get(
  "/bookingsCount/:status/:scheduleId/:timeFrame",
  catchAsync(getBookingsCount)
);
router.get("/totalFare/:scheduleId/:timeFrame", catchAsync(getTotalFare));
router.get("/userRegistrations/:timeFrame", catchAsync(getUserRegistrations));
router.get(
  "/bookingClassDistribution/:scheduleId/:timeFrame",
  catchAsync(getBookingClassDistribution)
);
router.get("/bookings/:status/:scheduleId", catchAsync(getBookings));
router.get("/schedules", catchAsync(getSchedules));

export default router;

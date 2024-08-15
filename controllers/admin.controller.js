import mongoose from "mongoose";

import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";
import ExpressError from "../utils/ExpressError.utils.js";
import {generatePeriods, performAggregation} from "./helpers/admin.helper.js";


export const getBookingsCount = async (req, res, next) => {
  const { scheduleId, timeFrame } = req.params;

  const { periods, groupBy } = generatePeriods(timeFrame);

  // Prepare the match stage for aggregation
  let matchStage = { status: "approved" }; // Default match stage with confirmed bookings
  if (scheduleId !== "all") {
    // Validate scheduleId if it's not 'all'
    if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
      return new ExpressError("Invalid schedule ID", 400);
    }
    matchStage = { scheduleRef: new mongoose.Types.ObjectId(scheduleId) };
  }

  // Perform aggregation to get the booking count for each period
  const result = await performAggregation(
    Booking,
    matchStage,
    groupBy,
    periods,
    timeFrame,
    { value: { $sum: 1 } },
    "count"
  );

  // Return the result
  res
    .status(200)
    .json({ success: true, scheduleId, timeFrame, bookingsBreakdown: result });
};

export const getTotalFare = async (req, res, next) => {
  const { scheduleId, timeFrame } = req.params;

  const { periods, groupBy } = generatePeriods(timeFrame);

  // Prepare the match stage for aggregation
  let matchStage = { status: "approved" }; // Default match stage with confirmed bookings
  if (scheduleId !== "all") {
    // Validate scheduleId if it's not 'all'
    if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
      return next(new ExpressError("Invalid schedule ID", 400));
    }
    matchStage.scheduleRef = new mongoose.Types.ObjectId(scheduleId);
  }

  // Perform aggregation to get the total fare for each period
  const result = await performAggregation(
    Booking,
    matchStage,
    groupBy,
    periods,
    timeFrame,
    { value: { $sum: "$totalFare" } },
    "totalFare"
  );

  res
    .status(200)
    .json({ success: true, scheduleId, timeFrame, fareBreakdown: result });
};

export const getUserRegistrations = async (req, res, next) => {
  const { timeFrame } = req.params;
  const { periods, groupBy } = generatePeriods(timeFrame);

  // Perform aggregation to get the user registration count for each period
  const result = await performAggregation(
    User,
    {},
    groupBy,
    periods,
    timeFrame,
    { value: { $sum: 1 } },
    "registrations"
  );

  res
    .status(200)
    .json({ success: true, timeFrame, registrationBreakdown: result });
};

import mongoose from "mongoose";

import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";
import ExpressError from "../utils/ExpressError.utils.js";
import Schedule from "../models/schedule.model.js";
import Admin from "../models/admin.model.js";

import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

import {
  generatePeriods,
  performAggregation,
  monthNames,
} from "./helpers/admin.helper.js";

export const getBookingsCount = async (req, res, next) => {
  const { scheduleId, timeFrame, status } = req.params;

  const { periods, groupBy } = generatePeriods(timeFrame);

  // Prepare the match stage for aggregation
  let matchStage = { status }; // Default match stage with confirmed bookings
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

export const getBookingClassDistribution = async (req, res, next) => {
  try {
    const { scheduleId, timeFrame } = req.params;

    const { periods, groupBy } = generatePeriods(timeFrame);

    let matchStage = { status: "approved" };
    if (scheduleId !== "all") {
      if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
        throw new ExpressError("Invalid schedule ID", 400);
      }
      matchStage.scheduleRef = new mongoose.Types.ObjectId(scheduleId);
    }

    // Perform aggregation to get booking class distribution for each period
    const classDistribution = await Booking.aggregate([
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: "seats",
          localField: "seats",
          foreignField: "_id",
          as: "seatsInfo",
        },
      },
      {
        $lookup: {
          from: "wagons",
          localField: "seatsInfo.wagonRef",
          foreignField: "_id",
          as: "wagonsInfo",
        },
      },
      {
        $lookup: {
          from: "wagonclasses",
          localField: "wagonsInfo.wagonClassRef",
          foreignField: "_id",
          as: "classesInfo",
        },
      },
      {
        $unwind: "$classesInfo",
      },
      {
        $group: {
          _id: {
            ...groupBy,
            className: "$classesInfo.name",
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1 },
      },
    ]);

    // Create a map from the aggregated results
    const breakdownMap = new Map(
      classDistribution.map((item) => [JSON.stringify(item._id), item.count])
    );

    // Generate the final result array including periods with zero bookings
    const result = periods.map((period) => {
      let periodLabel;
      if (timeFrame === "yearly") {
        periodLabel = `${period.year}`;
      } else if (timeFrame === "monthly") {
        periodLabel = `${period.year % 100}/${monthNames[period.month - 1]}`;
      } else if (timeFrame === "weekly") {
        periodLabel = `${period.year % 100}/w${period.week}`;
      }

      // For each period, return the counts for each class
      return {
        period: periodLabel,
        first:
          breakdownMap.get(JSON.stringify({ ...period, className: "first" })) ||
          0,
        second:
          breakdownMap.get(
            JSON.stringify({ ...period, className: "second" })
          ) || 0,
        third:
          breakdownMap.get(JSON.stringify({ ...period, className: "third" })) ||
          0,
      };
    });

    // Return the result
    res.status(200).json({
      success: true,
      scheduleId,
      timeFrame,
      classDistribution: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingsDetails = async (req, res, next) => {
  const { scheduleId, status } = req.params;
  const startIndex = parseInt(req.query.startIndex) || 0;
  const matchStage = {};

  // Validate and set scheduleRef if a specific scheduleId is provided
  if (scheduleId !== "all") {
    if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
      return next(new ExpressError("Invalid schedule ID", 400));
    }
    matchStage.scheduleRef = new mongoose.Types.ObjectId(scheduleId);
  }

  // Set status if a specific status is provided
  if (status !== "all") {
    matchStage.status = status;
  }

  // Count the total number of bookings matching the criteria
  const totalBookingsCount = await Booking.countDocuments(matchStage);

  // Retrieve the booking details with pagination
  const bookingsDetails = await Booking.find(matchStage)
    .populate({
      path: "scheduleRef",
      select: "trainRef",
      populate: {
        path: "trainRef",
        select: "name",
      },
    })
    .populate("userRef", "email")
    .populate("seats", "name")
    .populate({
      path: "startHalt",
      select: "stationRef",
      populate: {
        path: "stationRef",
        select: "name",
      },
    })
    .populate({
      path: "endHalt",
      select: "stationRef",
      populate: {
        path: "stationRef",
        select: "name",
      },
    })
    .sort({ date: -1 })
    .limit(50)
    .skip(startIndex);

  // Send the response with both the booking details and total count
  res.status(200).json({ totalBookingsCount, bookingsDetails });
};

export const getSchedulesDetails = async (req, res, next) => {
  const schedulesDetails = await Schedule.find().populate("trainRef", "name");

  const transformedDetails = schedulesDetails.map((schedule) => ({
    _id: schedule._id,
    name: schedule.name,
    trainRef: schedule.trainRef,
    monday: schedule.monday ? "✔️" : "❌",
    tuesday: schedule.tuesday ? "✔️" : "❌",
    wednesday: schedule.wednesday ? "✔️" : "❌",
    thursday: schedule.thursday ? "✔️" : "❌",
    friday: schedule.friday ? "✔️" : "❌",
    saturday: schedule.saturday ? "✔️" : "❌",
    sunday: schedule.sunday ? "✔️" : "❌",
    scheduleType: schedule.scheduleType,
    __v: schedule.__v,
  }));

  res.status(200).json({ schedulesDetails: transformedDetails });
};

export const getSchedules = async (req, res, next) => {
  const schedules = await Schedule.find().select("name").sort({ name: 1 });

  res.status(200).json({ schedules });
};

export const login = async (req, res, next) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username });
  if (!admin) {
    return next(new ExpressError("Invalid username or password", 401));
  }

  const isMatch = await bcryptjs.compare(password, admin.password);
  if (!isMatch) {
    return next(new ExpressError("Invalid username or password", 401));
  }

  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);

  const { password: hashed, ...restOfAdmin } = admin._doc;

  res
    .cookie("access_token", token, { httpOnly: true })
    .status(200)
    .json(restOfAdmin);
};

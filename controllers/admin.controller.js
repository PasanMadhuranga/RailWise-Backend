import mongoose from "mongoose";

import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";
import ExpressError from "../utils/ExpressError.utils.js";
import Schedule from "../models/schedule.model.js";
import Admin from "../models/admin.model.js";
import Halt from "../models/halt.model.js";

import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

import {
  generatePeriods,
  performAggregation,
  monthNames,
  sendPlatformReschedule,
  sendTimeReschedule,
  getDayRange,
  buildUserScheduleData,
  getRelevantBookings,
  getAffectedHalts,
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
  const currentYear = new Date().getFullYear();
  let groupBy;
  let periods = [];

  // Determine the grouping and periods based on the timeFrame
  switch (timeFrame) {
    case "yearly":
      groupBy = { year: { $year: { $toDate: "$_id" } } };
      for (let year = currentYear - 5; year <= currentYear; year++) {
        periods.push({ year });
      }
      break;
    case "monthly":
      groupBy = {
        year: { $year: { $toDate: "$_id" } },
        month: { $month: { $toDate: "$_id" } },
      };
      for (let year = currentYear - 1; year <= currentYear; year++) {
        for (let month = 1; month <= 12; month++) {
          periods.push({ year, month });
        }
      }
      break;
    case "weekly":
      groupBy = {
        year: { $year: { $toDate: "$_id" } },
        week: { $week: { $toDate: "$_id" } },
      };
      const firstDate = new Date(2023, 0, 1);
      const firstWeek = Math.ceil(
        ((firstDate - new Date(firstDate.getFullYear(), 0, 1)) / 86400000 +
          firstDate.getDay() +
          1) /
          7
      );
      for (let year = currentYear - 1; year <= currentYear; year++) {
        for (let week = firstWeek; week <= 52; week++) {
          periods.push({ year, week });
        }
      }
      break;
    default:
      return next(new ExpressError("Invalid time frame", 400));
  }

  // Perform aggregation to get the user registration count for each period
  const registrationBreakdown = await User.aggregate([
    {
      $group: {
        _id: groupBy,
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1 },
    },
  ]);

  // Create a map from the aggregated results
  const breakdownMap = new Map(
    registrationBreakdown.map((item) => [JSON.stringify(item._id), item.count])
  );

  // Generate the final result array including periods with zero registrations
  const result = periods.map((period) => {
    let periodLabel;
    if (timeFrame === "yearly") {
      periodLabel = `${period.year}`;
    } else if (timeFrame === "monthly") {
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      periodLabel = `${period.year} ${monthNames[period.month - 1]}`;
    } else if (timeFrame === "weekly") {
      periodLabel = `${period.year} W${period.week}`;
    }
    return {
      period: periodLabel,
      registrations: breakdownMap.get(JSON.stringify(period)) || 0,
    };
  });

  // Return the result
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

export const getHalts = async (req, res, next) => {
  const { scheduleId } = req.params;

  try {
    const halts = await Halt.find({ scheduleRef: scheduleId }).populate(
      "stationRef",
      "name"
    );
    res.status(200).json({ halts });
  } catch (error) {
    console.error("Error fetching halts:", error);

    res.status(500).json({ error: "An error occurred while fetching halts" });
  }
};

export const changePlatform = async (req, res, next) => {
  const { haltId, haltName, platform, date } = req.body;

  try {
    const { startOfDay, endOfDay } = getDayRange(date);
    const relevantBookings = await getRelevantBookings([haltId], startOfDay, endOfDay);
    const userScheduleData = buildUserScheduleData(relevantBookings, {[haltId]:haltName}, [haltId]);
    await sendPlatformReschedule(userScheduleData, platform);
    res
      .status(200)
      .json({ message: "Passengers have been notified successfully." });
  } catch (error) {
    console.error("Error changing platform:", error);
    res.status(500).json({ error: "Failed to notify passengers." });
  }
};


export const timeChange = async (req, res, next) => {
  const { scheduleId, haltOrder, haltId, date, time, notifyAll } = req.body;

  try {
    const { startOfDay, endOfDay } = getDayRange(date);
    const haltOrderNumber = Number(haltOrder);

    const { affectedHaltIds, haltIdToNameMap } = await getAffectedHalts(notifyAll, { scheduleId: scheduleId, haltOrderNumber: haltOrderNumber, haltId:haltId });
    const relevantBookings = await getRelevantBookings(affectedHaltIds, startOfDay, endOfDay);
    const userScheduleData = buildUserScheduleData(relevantBookings, haltIdToNameMap, affectedHaltIds);

    // Send reschedule email
    await sendTimeReschedule(userScheduleData, time);
    res.status(200).json({ message: "Passengers have been notified successfully." });
  } catch (error) {
    console.error("Error changing time:", error);
    res.status(500).json({ error: "Failed to notify passengers." });
  }
};

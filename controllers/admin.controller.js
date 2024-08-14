import mongoose from "mongoose";

import Booking from "../models/booking.model.js";
import ExpressError from "../utils/ExpressError.utils.js";

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const getBookingsCount = async (req, res, next) => {
  const { scheduleId, timeFrame } = req.params;

  const currentDate = new Date(); // Get the current date
  let groupBy; // Variable to hold the group criteria for aggregation
  let periods = []; // Array to hold all periods (years, months, weeks)

  // Determine the grouping and periods based on the timeFrame
  switch (timeFrame) {
    case "yearly":
      groupBy = { year: { $year: "$date" } };
      // Generate a list of years from 2023 to the current year
      for (let year = 2023; year <= currentDate.getFullYear(); year++) {
        periods.push({ year });
      }
      break;
    case "monthly":
      groupBy = { year: { $year: "$date" }, month: { $month: "$date" } };
      // Generate a list of months for each year from 2023 to the current year
      for (let year = 2023; year <= currentDate.getFullYear(); year++) {
        for (let month = 1; month <= 12; month++) {
          periods.push({ year, month });
        }
      }
      break;
    case "weekly":
      groupBy = { year: { $year: "$date" }, week: { $week: "$date" } };
      // Generate a list of weeks for each year from 2023 to the current year
      const firstDate = new Date(2023, 0, 1); // Start from January 1, 2023
      const firstWeek = Math.ceil(
        ((firstDate - new Date(firstDate.getFullYear(), 0, 1)) / 86400000 +
          firstDate.getDay() +
          1) /
          7
      );
      for (let year = 2023; year <= currentDate.getFullYear(); year++) {
        for (let week = firstWeek; week <= 52; week++) {
          periods.push({ year, week });
        }
      }
      break;
    default:
      // Return an error if the timeFrame is not valid
      return new ExpressError("Invalid time frame", 400);
  }

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
  const bookingsBreakdown = await Booking.aggregate([
    {
      $match: matchStage,
    },
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
    bookingsBreakdown.map((item) => [JSON.stringify(item._id), item.count])
  );

  // Generate the final result array including periods with zero bookings
  const result = periods.map((period) => {
    let periodLabel;
    if (timeFrame === "yearly") {
      periodLabel = `${period.year}`;
    } else if (timeFrame === "monthly") {
      periodLabel = `${period.year} ${monthNames[period.month - 1]}`;
    } else if (timeFrame === "weekly") {
      periodLabel = `${period.year} W${period.week}`;
    }
    return {
      period: periodLabel,
      count: breakdownMap.get(JSON.stringify(period)) || 0,
    };
  });

  // Return the result
  res
    .status(200)
    .json({ success: true, scheduleId, timeFrame, bookingsBreakdown: result });
};


export const getTotalFare = async (req, res, next) => {
  const { scheduleId, timeFrame } = req.params;

  const currentDate = new Date(); // Get the current date
  let groupBy; // Variable to hold the group criteria for aggregation
  let periods = []; // Array to hold all periods (years, months, weeks)

  // Determine the grouping and periods based on the timeFrame
  switch (timeFrame) {
    case "yearly":
      groupBy = { year: { $year: "$date" } };
      // Generate a list of years from 2023 to the current year
      for (let year = 2023; year <= currentDate.getFullYear(); year++) {
        periods.push({ year });
      }
      break;
    case "monthly":
      groupBy = { year: { $year: "$date" }, month: { $month: "$date" } };
      // Generate a list of months for each year from 2023 to the current year
      for (let year = 2023; year <= currentDate.getFullYear(); year++) {
        for (let month = 1; month <= 12; month++) {
          periods.push({ year, month });
        }
      }
      break;
    case "weekly":
      groupBy = { year: { $year: "$date" }, week: { $week: "$date" } };
      // Generate a list of weeks for each year from 2023 to the current year
      const firstDate = new Date(2023, 0, 1); // Start from January 1, 2023
      const firstWeek = Math.ceil(
        ((firstDate - new Date(firstDate.getFullYear(), 0, 1)) / 86400000 +
          firstDate.getDay() +
          1) /
          7
      );
      for (let year = 2023; year <= currentDate.getFullYear(); year++) {
        for (let week = firstWeek; week <= 52; week++) {
          periods.push({ year, week });
        }
      }
      break;
    default:
      // Return an error if the timeFrame is not valid
      return next(new ExpressError("Invalid time frame", 400));
  }

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
  const fareBreakdown = await Booking.aggregate([
    {
      $match: matchStage,
    },
    {
      $group: {
        _id: groupBy,
        totalFare: { $sum: "$totalFare" },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1 },
    },
  ]);

  // Create a map from the aggregated results
  const breakdownMap = new Map(
    fareBreakdown.map((item) => [JSON.stringify(item._id), item.totalFare])
  );

  // Generate the final result array including periods with zero total fare
  const result = periods.map((period) => {
    let periodLabel;
    if (timeFrame === "yearly") {
      periodLabel = `${period.year}`;
    } else if (timeFrame === "monthly") {
      periodLabel = `${period.year} ${monthNames[period.month - 1]}`;
    } else if (timeFrame === "weekly") {
      periodLabel = `${period.year} W${period.week}`;
    }
    return {
      period: periodLabel,
      totalFare: breakdownMap.get(JSON.stringify(period)) || 0,
    };
  });

  // Return the result
  res
    .status(200)
    .json({ success: true, scheduleId, timeFrame, fareBreakdown: result });
};

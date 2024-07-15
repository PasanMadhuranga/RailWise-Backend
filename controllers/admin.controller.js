import Booking from "../models/booking.model.js";
import mongoose from "mongoose";

export const getBookingsCount = async (req, res, next) => {
  const { scheduleId, timeFrame } = req.params;

  if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
    return res.status(400).json({ message: "Invalid schedule ID" });
  }


  let groupBy;

  switch (timeFrame) {
    case "yearly":
      groupBy = { year: { $year: "$date" } };
      break;
    case "monthly":
      groupBy = { year: { $year: "$date" }, month: { $month: "$date" } };
      break;
    case "weekly":
      groupBy = { year: { $year: "$date" }, week: { $week: "$date" } };
      break;
    default:
      return res
        .status(400)
        .json({
          message: "Invalid period. Use 'yearly', 'monthly', or 'weekly'.",
        });
  }

  const bookingsBreakdown = await Booking.aggregate([
    {
      $match: {
        scheduleRef: new mongoose.Types.ObjectId(scheduleId),
        status: "approved",
      },
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

  res.status(200).json({ scheduleId, period: timeFrame, bookingsBreakdown });
};

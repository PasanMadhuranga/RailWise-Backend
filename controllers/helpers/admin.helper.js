import Booking from "../../models/booking.model.js";
import User from "../../models/user.model.js";
import ExpressError from "../../utils/ExpressError.utils.js";
import nodemailer from "nodemailer";
import axios from "axios";
import Halt from "../../models/halt.model.js";

export const monthNames = [
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

export const generatePeriods = (timeFrame) => {
  const currentYear = new Date().getFullYear();
  let periods = [];
  let groupBy;
  switch (timeFrame) {
    case "yearly":
      groupBy = { year: { $year: "$date" } };
      for (let year = currentYear - 5; year <= currentYear; year++) {
        periods.push({ year });
      }
      break;
    case "monthly":
      groupBy = { year: { $year: "$date" }, month: { $month: "$date" } };
      for (let year = currentYear - 1; year <= currentYear; year++) {
        for (let month = 1; month <= 12; month++) {
          periods.push({ year, month });
        }
      }
      break;
    case "weekly":
      groupBy = { year: { $year: "$date" }, week: { $week: "$date" } };
      const firstDate = new Date(currentYear - 1, 0, 1);
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
      throw new ExpressError("Invalid time frame", 400);
  }
  return { periods, groupBy };
};

export const performAggregation = async (
  Model,
  matchStage,
  groupBy,
  periods,
  timeFrame,
  valueField,
  name
) => {
  const aggregationResult = await Model.aggregate([
    {
      $match: matchStage,
    },
    {
      $group: {
        _id: groupBy,
        ...valueField,
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1 },
    },
  ]);

  console.log("aggregationResult: ", aggregationResult);

  const breakdownMap = new Map(
    aggregationResult.map((item) => [JSON.stringify(item._id), item.value])
  );

  return periods.map((period) => {
    let periodLabel;
    if (timeFrame === "yearly") {
      periodLabel = `${period.year}`;
    } else if (timeFrame === "monthly") {
      periodLabel = `${period.year % 100}/${monthNames[period.month - 1]}`;
    } else if (timeFrame === "weekly") {
      periodLabel = `${period.year % 100}/w${period.week}`;
    }
    return {
      period: periodLabel,
      [name]: breakdownMap.get(JSON.stringify(period)) || 0,
    };
  });
};


export const sendPlatformReschedule = async (
  userScheduleData,
  platform,
) => {
  // Create a transporter
  let transporter = nodemailer.createTransport({
    service: "gmail", // Specify the email service provider
    auth: {
      user: process.env.EMAIL, // Your email
      pass: process.env.APP_PASSWORD, // Your app-specific password
    },
  });
  // Loop through each user data and send the notification
  for (let { username, email, schedule, phone, haltNames, train } of userScheduleData) {
    // Email content
    const message = `Hello ${username},\n\nPlease note that for the schedule "${schedule}" of the train "${train}", the platform has been updated to ${platform} at the station ${haltNames[0]}.\n\nBest regards,\nRailWise Team`;
    // const message = `For schedule "${schedule}", the platform has been changed to ${platform} on ${haltName}.`;
    let mailOptions = {
      from: process.env.EMAIL,
      to: email, // Send to each user email
      subject: "Platform Change Notification",
      text: message,
    };
    
    try {
      // Send the email
      await transporter.sendMail(mailOptions);
      // await sendRescheduleSMS("94" + phone, message);
      console.log(`Email and SMS sent to: ${email} for schedule: ${schedule}`);
    } catch (error) {
      console.error(
        `Failed to send email to: ${email} for schedule: ${schedule}`,
        error
      );
    }
  }
};

export const sendTimeReschedule = async (userScheduleData, time) => {
  // Create a transporter
  let transporter = nodemailer.createTransport({
    service: "gmail", // Specify the email service provider
    auth: {
      user: process.env.EMAIL, // Your email
      pass: process.env.APP_PASSWORD, // Your app-specific password
    },
  });

  // Loop through each user data and send the notification
  for (let { username, email, schedule, haltNames, phone, train } of userScheduleData) {
    let message;
    if (haltNames.length === 1) {
      message = `Hello ${username},\n\nPlease be informed that the schedule "${schedule}" of train "${train}" has been delayed by ${time} minutes at ${haltNames[0]}. However, this delay will not affect all subsequent stations.\n\nBest regards,\nRailWise Team`;
    } else {
      message = `Hello ${username},\n\nPlease be advised that the schedule "${schedule}" of train "${train}" has been delayed by ${time} minutes at ${haltNames[0]}. This delay will affect all upcoming stations, including your destination at ${haltNames[1]}.\n\nBest regards,\nRailWise Team`;
    }
    // Email content
    let mailOptions = {
      from: process.env.EMAIL,
      to: email, // Send to each user email
      subject: "Time Change Notification",
      text: message,
    };

    try {
      // Send the email
      await transporter.sendMail(mailOptions);
      console.log(`Email sent to: ${email} for schedule: ${schedule}`);
      // await sendRescheduleSMS("94" + phone, message);
    } catch (error) {
      console.error(
        `Failed to send email to: ${email} for schedule: ${schedule}`,
        error
      );
    }
  }
};

export const sendRescheduleSMS = async (phoneNumber, message) => {

  const response = await axios.post("https://app.notify.lk/api/v1/send", {
    user_id: process.env.SMS_USER_ID,
    api_key: process.env.SMS_API_KEY,
    sender_id: "NotifyDEMO",
    to: phoneNumber,
    message: message,
  });
  
  if (response.status === 200) {
    console.log(`SMS sent to: ${phoneNumber}`);
  } else {
    console.error(`Failed to send SMS to: ${phoneNumber}`);
  }
};

export const getDayRange = (date) => {
  const startOfDay = new Date(date);
  // startOfDay.setDate(startOfDay.getDate() + 1);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  // endOfDay.setDate(endOfDay.getDate() + 1);
  endOfDay.setUTCHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
};



export const getAffectedHalts = async (notifyAll, { scheduleId, haltOrderNumber, haltId }) => {
  let affectedHalts = [];

  if (notifyAll) {
    if (!scheduleId || !haltOrderNumber) {
      throw new Error("scheduleId and haltOrderNumber are required when notifyAll is true.");
    }
    
    // Find all halts when notifyAll is true
    affectedHalts = await Halt.find({
      scheduleRef: scheduleId,
      haltOrder: { $gte: haltOrderNumber },
    })
      .populate("stationRef", "name")
      .sort({ haltOrder: 1 });
  } else {
    if (!haltId) {
      throw new Error("haltId is required when notifyAll is false.");
    }
    
    // Find a single halt by its haltId when notifyAll is false
    const affectedHalt = await Halt.findById(haltId).populate("stationRef", "name");

    // Convert the single halt to an array to keep the result consistent
    if (affectedHalt) {
      affectedHalts.push(affectedHalt);
    }
  }

  // Create a map from haltId to station name
  const haltIdToNameMap = affectedHalts.reduce((map, halt) => {
    map[halt._id] = halt.stationRef.name;
    return map;
  }, {});

  const affectedHaltIds = affectedHalts.map(halt => halt._id.toString());

  return { affectedHaltIds, haltIdToNameMap };
};

export const getRelevantBookings = async (affectedHaltIds, startOfDay, endOfDay) => {
  return Booking.find({
    $and: [
      {
        $or: [
          { startHalt: { $in: affectedHaltIds } },
          { endHalt: { $in: affectedHaltIds } },
        ],
      },
      {
        date: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
      },
    ],
  })
    .populate("userRef", "email phone username")
    .populate(
      {
        path: "scheduleRef",
        select: "name",
      }
    );
};

export const buildUserScheduleData = (bookings, haltIdToNameMap, affectedHaltIds) => {
  return bookings.map((booking) => {
    const userHaltNames = [];
    if (affectedHaltIds.includes(booking.startHalt.toString())) {
      userHaltNames.push(haltIdToNameMap[booking.startHalt.toString()]);
    }
    if (affectedHaltIds.includes(booking.endHalt.toString())) {
      userHaltNames.push(haltIdToNameMap[booking.endHalt.toString()]);
    }
    return {
      username: booking.userRef.username,
      email: booking.userRef.email,
      schedule: booking.scheduleRef.name,
      haltNames: userHaltNames,
      phone: booking.userRef.phone,
      train: booking.scheduleRef.name,
    };
  });
};
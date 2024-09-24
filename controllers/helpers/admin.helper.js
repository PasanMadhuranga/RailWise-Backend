import Booking from "../../models/booking.model.js";
import User from "../../models/user.model.js";
import ExpressError from "../../utils/ExpressError.utils.js";
import nodemailer from 'nodemailer';

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

  console.log("aggregationResult: ",aggregationResult);

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

export const sendRescheduleEmail = async (userScheduleData,platform,haltName) => {
  // Create a transporter
  let transporter = nodemailer.createTransport({
    service: "gmail", // Specify the email service provider
    auth: {
      user: process.env.EMAIL, // Your email
      pass: process.env.APP_PASSWORD, // Your app-specific password
    },
  });

  // Loop through each user data and send the notification
  for (let { email, schedule } of userScheduleData) {
    // Email content
    let mailOptions = {
      from: process.env.EMAIL,
      to: email, // Send to each user email
      subject: 'Platform Change Notification',
      text: `Dear User,\n\nFor schedule "${schedule}", the platform has been changed to ${platform} on ${haltName}.\n\nRegards,\nYour Train Service Team`,
    };

    try {
      // Send the email
      await transporter.sendMail(mailOptions);
      console.log(`Email sent to: ${email} for schedule: ${schedule}`);
    } catch (error) {
      console.error(`Failed to send email to: ${email} for schedule: ${schedule}`, error);
    }
  }
};

export const sendRescheduleEmailTime = async (userScheduleData, time) => {
  // Create a transporter
  let transporter = nodemailer.createTransport({
    service: 'gmail', // Specify the email service provider
    auth: {
      user: process.env.EMAIL, // Your email
      pass: process.env.APP_PASSWORD, // Your app-specific password
    },
  });

  // Loop through each user data and send the notification
  for (let { email, schedule, haltNames } of userScheduleData) {
    // Construct halt names string
    const haltNamesText = haltNames.join(' and ');

    // Email content
    let mailOptions = {
      from: process.env.EMAIL,
      to: email, // Send to each user email
      subject: 'Time Change Notification',
      text: `Dear User,\n\nFor schedule "${schedule}", the time has been delayed by ${time} minutes at ${haltNamesText}.\n\nRegards,\nYour Train Service Team`,
    };

    try {
      // Send the email
      await transporter.sendMail(mailOptions);
      console.log(`Email sent to: ${email} for schedule: ${schedule}`);
    } catch (error) {
      console.error(`Failed to send email to: ${email} for schedule: ${schedule}`, error);
    }
  }
};
// Importing the required modules
import Schedule from "../models/schedule.model.js";
import Halt from "../models/halt.model.js";
import Station from "../models/station.model.js";
import Booking from "../models/booking.model.js";
import WagonClass from "../models/wagonClass.model.js";
import Train from "../models/train.model.js";

import ExpressError from "../utils/ExpressError.utils.js";

import { getTotalSeatsofEachClass, getBookedSeatsofEachClass } from "./helpers/schedules.helper.js";

// get all the schedules that run on the given date and have the given from and to stations
export const getSchedules = async (req, res, next) => {
  // get the fromName, toName and date that user has entered in the search bar
  const { fromStationId, toStationId, date } = req.query;

  // Find the station with the given fromName
  const fromStation = await Station.findById(fromStationId);
  // Find the station with the given toName
  const toStation = await Station.findById(toStationId);

  // If the fromStation or toStation is not found, throw an error
  if (!fromStation || !toStation) {
    throw new ExpressError("Invalid Station Name", 400);
  }

  // Create a Date object
  const dateObj = new Date(date);

  // Get the day of the week as a number (0-6)
  const dayOfWeekNumber = dateObj.getDay();

  // Array of day names
  const daysOfWeek = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  // Get the day name
  const dayName = daysOfWeek[dayOfWeekNumber];

  // Find all schedules that run on the given date
  // populate only the name field of the trainRef field
  const dateSchedules = await Schedule.find({ [dayName]: true })
    .populate({
      path: "trainRef",
      select: "name",
    })
    .select("-monday -tuesday -wednesday -thursday -friday -saturday -sunday"); // Select all fields except the days of the week

  const finalSchedules = [];
  // from all the schedules, filter out the schedules that have the fromStation before the toStation
  for (let schedule of dateSchedules) {
    // from all schedules filter the schedules that have both fromStation and toStation as stops
    const fromHalt = await Halt.findOne({
      stationRef: fromStation._id,
      scheduleRef: schedule._id,
    }).populate("stationRef"); // Populate the stationRef field with the station details
    const toHalt = await Halt.findOne({
      stationRef: toStation._id,
      scheduleRef: schedule._id,
    }).populate("stationRef"); // Populate the stationRef field with the station details

    // if the startHalt is before the endHalt, add the schedule to the finalSchedules array
    if (fromHalt && toHalt && fromHalt.haltOrder < toHalt.haltOrder) {
      finalSchedules.push({ schedule, fromHalt, toHalt });
    }
  }

  // for each schedule in the finalSchedules array, get the number of booked seats of each class
  for (let i = 0; i < finalSchedules.length; i++) {
    const { schedule, fromHalt, toHalt } = finalSchedules[i];
    const totalSeatsCount = await getTotalSeatsofEachClass(schedule.trainRef);
    const bookedSeatsCount = await getBookedSeatsofEachClass(
      schedule._id,
      date,
      fromHalt,
      toHalt
    );
    finalSchedules[i].firstClassSeats =
      totalSeatsCount.firstClass - bookedSeatsCount.firstClass;
    finalSchedules[i].secondClassSeats =
      totalSeatsCount.secondClass - bookedSeatsCount.secondClass;
    finalSchedules[i].thirdClassSeats =
      totalSeatsCount.thirdClass - bookedSeatsCount.thirdClass;
  }

  return res.status(200).json(finalSchedules); // Send the finalSchedules array as the response
};

// get the number of seats of each class of the given train
export const getDetailsOfSchedule = async (req, res, next) => {
  const { scheduleId, fromHaltId, toHaltId, date } = req.query;
  const fromHalt = await Halt.findById(fromHaltId).populate("stationRef");
  const toHalt = await Halt.findById(toHaltId).populate("stationRef");
  const schedule = await Schedule.findById(scheduleId)
    .populate({
      path: "trainRef",
      select: "name",
    })
    .select("-monday -tuesday -wednesday -thursday -friday -saturday -sunday");
  const totalSeatsCount = await getTotalSeatsofEachClass(schedule.trainRef);
  const bookedSeatsCount = await getBookedSeatsofEachClass(
    scheduleId,
    date,
    fromHalt,
    toHalt
  );
  const firstClassSeats =
    totalSeatsCount.firstClass - bookedSeatsCount.firstClass;
  const secondClassSeats =
    totalSeatsCount.secondClass - bookedSeatsCount.secondClass;
  const thirdClassSeats =
    totalSeatsCount.thirdClass - bookedSeatsCount.thirdClass;

  const classesDetails = await WagonClass.find().lean();

  classesDetails.forEach((classDetail) => {
    switch (classDetail.name) {
      case "first":
        classDetail.availableSeats = firstClassSeats;
        break;
      case "second":
        classDetail.availableSeats = secondClassSeats;
        break;
      case "third":
        classDetail.availableSeats = thirdClassSeats;
        break;
    }
  });

  return res.status(200).json({
    schedule,
    fromHalt,
    toHalt,
    classesDetails,
  });
};

// get the details of the wagons of the requested class of the train
export const getWagonsOfClass = async (req, res, next) => {
  const {
    trainId,
    scheduleId,
    fromHaltId,
    toHaltId,
    date,
    requestedClassId,
  } = req.query;

  // get the train with the given trainId
  // populate the wagons field and the wagonClassRef field of each wagon
  const train = await Train.findById(trainId)
    .populate({
      path: "wagons",
      populate: {
        path: "seats",
      }
    })
    .lean(); // Use lean() to get plain JavaScript objects instead of Mongoose documents


  // from all the wagons in the train, filter out the wagons that have the requested coach type
  const requestedClassWagons = [];
  train.wagons.forEach((wagon) => {
    if (wagon.wagonClassRef.equals(requestedClassId)) {
      requestedClassWagons.push(wagon);
    }
  });

  // get all the bookings of that schedule on that date
  const AllbookingsOnDate = await Booking.find({
    scheduleRef: scheduleId,
    date: {
      $gte: new Date(date),
      $lt: new Date(date).setDate(new Date(date).getDate() + 1),
    },
    status: { $ne: "cancelled" }, // exclude the cancelled bookings. that means only confirmed and hold bookings are considered
  }).populate("startHalt endHalt seats");

  // get the from halt and to halt details
  const fromHalt = await Halt.findById(fromHaltId);
  const toHalt = await Halt.findById(toHaltId);

  // filter out the bookings that have a to stop number greater than the from stop number.
  // that is, the bookings that are relevant to the journey from the from stop to the to stop
  let relevantBookingsOnDate = [];
  AllbookingsOnDate.forEach((booking) => {
    if (
      !(
        (fromHalt.haltOrder < booking.startHalt.haltOrder &&
          toHalt.haltOrder < booking.startHalt.haltOrder) ||
        (fromHalt.haltOrder > booking.endHalt.haltOrder &&
          toHalt.haltOrder > booking.endHalt.haltOrder)
      )
    ) {
      relevantBookingsOnDate.push(booking);
    }
  });

  // from all the relevant bookings, get all the booked seats
  const relevantBookedSeats = relevantBookingsOnDate
    .map((booking) => booking.seats)
    .flat();

  // for each coach, filter out the booked seats that belong to that coach
  for (let i = 0; i < requestedClassWagons.length; i++) {
    const allSeatsofCurrWagon = requestedClassWagons[i].seats.map((seat) =>
      seat._id.toString()
    );
    const bookedSeatsofCurrWagon = relevantBookedSeats.filter((seat) =>
      allSeatsofCurrWagon.includes(seat._id.toString())
    );
    // add the booked seats to the coach object
    requestedClassWagons[i].alreadyBookedSeats = bookedSeatsofCurrWagon;
  }

  res.status(200).json({
    requestedClassWagons,
  });
};


// get popular routes
export const getPopularRoutes = async (req, res, next) => {
  const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const popularRoutes = await Booking.aggregate([
      {
        $match: { // filter out the bookings that are made in the last 30 days
          date: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: { // group the bookings by the startHalt and endHalt
          _id: {
            startHalt: "$startHalt",
            endHalt: "$endHalt",
          },
          count: { $sum: 1 }, // count the number of bookings for each group
        },
      },
      {
        $sort: { count: -1 }, // sort the groups in descending order of the count
      },
      {
        $limit: 5, // get only the top 5 groups
      },
      {
        $lookup: { // get the details of the startHalt from the halts collection
          from: "halts", // collection name where we are looking for the details
          localField: "_id.startHalt", // field in the current collection
          foreignField: "_id", // field in the halts collection
          as: "startHaltDetails", // name of the field where the details will be stored
        },
      },
      {
        $lookup: { // get the details of the endHalt from the halts collection
          from: "halts", // collection name where we are looking for the details
          localField: "_id.endHalt", // field in the current collection
          foreignField: "_id", // field in the halts collection
          as: "endHaltDetails", // name of the field where the details will be stored
        },
      },
      {
        $unwind: "$startHaltDetails", // destructure the startHaltDetails array. this is necessary because $lookup returns an array of results even if there is only one result
      },
      {
        $unwind: "$endHaltDetails", // destructure the endHaltDetails array. this is necessary because $lookup returns an array of results even if there is only one result
      },
      {
        $lookup: {
          from: "stations",
          localField: "startHaltDetails.stationRef",
          foreignField: "_id",
          as: "startHaltStation",
        },
      },
      {
        $lookup: {
          from: "stations",
          localField: "endHaltDetails.stationRef",
          foreignField: "_id",
          as: "endHaltStation",
        },
      },
      {
        $lookup: {
          from: "schedules",
          localField: "startHaltDetails.scheduleRef",
          foreignField: "_id",
          as: "scheduleDetails",
        },
      },
      {
        $unwind: "$scheduleDetails",
      },
      {
        $lookup: {
          from: "trains",
          localField: "scheduleDetails.trainRef",
          foreignField: "_id",
          as: "trainDetails",
        },
      },
      {
        $unwind: "$trainDetails",
      },
      {
        $project: { // project the fields that we want in the final result
          _id: 0, // exclude the _id field from the result
          startHaltStation: { $arrayElemAt: ["$startHaltStation", 0] }, // get the first element of the startHaltStation array
          endHaltStation: { $arrayElemAt: ["$endHaltStation", 0] }, // get the first element of the endHaltStation array
          train: { // create a train object with the train details
            _id: "$trainDetails._id",
            name: "$trainDetails.name",
          },
          count: 1, // include the count field in the result
        },
      },
    ]);

    res.status(200).json({ popularRoutes });
};
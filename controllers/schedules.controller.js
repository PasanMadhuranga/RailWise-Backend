import Schedule from "../models/schedule.model.js";
import Halt from "../models/halt.model.js";
import Train from "../models/train.model.js";
import Booking from "../models/booking.model.js";
import WagonClass from "../models/wagonClass.model.js";

import ExpressError from "../utils/ExpressError.js";


// get all the stations
export const getAllStations = async (req, res, next) => {
    const stations = await Station.find();
    res.status(200).json(stations);
  };
  
  // get all the schedules that run on the given date and have the given from and to stations
  export const getSchedules = async (req, res, next) => {
    // get the fromName, toName and date that user has entered in the search bar
    const { fromName, toName, date, pax } = req.query;
  
    // Find the station with the given fromName
    const fromStation = await Station.findOne({ name: fromName });
    // Find the station with the given toName
    const toStation = await Station.findOne({ name: toName });
  
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
      .populate({
        path: "sourceRef",
      })
      .populate({
        path: "destinationRef",
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
    return res.status(200).json(finalSchedules); // Send the finalSchedules array as the response
  };
  
  // get the details of the schedule that the user has selected
  export const getScheduleDetails = async (req, res, next) => {
    const { scheduleId, trainId, fromHalt, toHalt } = req.body;
  
    const trainDetails = await Train.findById(trainId).populate({
      path: "wagons",
      select: "wagonClassRef",
      populate: {
        path: "wagonClassRef",
        select: "name",
      },
    });
    let firstClassCount = 0;
    let secondClassCount = 0;
    let thirdClassCount = 0;
    for (let wagon of trainDetails.wagons) {
      if (wagon.wagonClassRef.name === "first") {
        firstClassCount++;
      } else if (wagon.wagonClassRef.name === "second") {
        secondClassCount++;
      } else {
        thirdClassCount++;
      }
    }
    const classesAndMultipliers = await WagonClass.find();
    return res.status(200).json({
      scheduleId,
      train: {
        id: trainDetails._id,
        name: trainDetails.name,
        firstClassCount,
        secondClassCount,
        thirdClassCount,
      },
      fromHalt,
      toHalt,
      classesAndMultipliers,
    });
    // return res.status(200).json(trainDetails);
  };
  
  // get the details of the wagons of the requested class of the train
  export const getWagonsOfClass = async (req, res, next) => {
    const {
      trainId,
      scheduleId,
      fromHalt,
      toHalt,
      date,
      requestedWagonClass,
      fareMultiplier,
    } = req.body;
  
    // get the train with the given trainId
    // populate the wagons field and the wagonClassRef field of each wagon
    const train = await Train.findById(trainId)
      .populate({
        path: "wagons",
        populate: [
          {
            path: "wagonClassRef",
            select: "name",
          },
          {
            path: "seats",
          },
        ],
      })
      .lean(); // Use lean() to get plain JavaScript objects instead of Mongoose documents
  
    // from all the wagons in the train, filter out the wagons that have the requested coach type
    const requestedClassWagons = [];
    train.wagons.forEach((wagon) => {
      if (wagon.wagonClassRef.name === requestedWagonClass) {
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
  
    res
      .status(200)
      .json({
        requestedClassWagons,
        fromHalt,
        toHalt,
        fareMultiplier,
        date,
      });
  };
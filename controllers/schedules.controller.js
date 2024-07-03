import Schedule from "../models/schedule.model.js";
import Station from "../models/station.model.js";
import Halt from "../models/halt.model.js";
import Booking from "../models/booking.model.js";
import Train from "../models/train.model.js";
import WagonClass from "../models/wagonClass.model.js";
import Wagon from "../models/wagon.model.js";
import ExpressError from "../utils/ExpressError.js";
import Seat from "../models/seat.model.js";
import Ticket from "../models/ticket.model.js";

// get all the stations
export const getAllStations = async (req, res, next) => {
  const stations = await Station.find();
  res.status(200).json(stations);
};

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
    .populate("destinationRef sourceRef")
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
    finalSchedules[i].firstClassSeats = totalSeatsCount.firstClass - bookedSeatsCount.firstClass;
    finalSchedules[i].secondClassSeats = totalSeatsCount.secondClass - bookedSeatsCount.secondClass;
    finalSchedules[i].thirdClassSeats = totalSeatsCount.thirdClass - bookedSeatsCount.thirdClass;
  }

  return res.status(200).json(finalSchedules); // Send the finalSchedules array as the response
};


// get the total number of seats of each class of the given train
const getTotalSeatsofEachClass = async (trainId) => {
  const trainDetails = await Train.findById(trainId).populate({
    path: "wagons",
    select: "wagonClassRef seats",
    populate: {
      path: "wagonClassRef",
      select: "name",
    },
  })
  let firstClass = 0;
  let secondClass = 0;
  let thirdClass = 0;

  for (let wagon of trainDetails.wagons) {
    if (wagon.wagonClassRef.name === "first") {
      firstClass += wagon.seats.length;
    } else if (wagon.wagonClassRef.name === "second") {
      secondClass += wagon.seats.length;
    } else {
      thirdClass += wagon.seats.length;
    }
  }
  return { firstClass, secondClass, thirdClass };
};

// get the number of booked seats of each class of the given schedule on the given date
const getBookedSeatsofEachClass = async (scheduleId, date, fromHalt, toHalt) => {
  // get all the bookings of that schedule on that date
  const AllbookingsOnDate = await Booking.find({
    scheduleRef: scheduleId,
    date: {
      $gte: new Date(date),
      $lt: new Date(date).setDate(new Date(date).getDate() + 1),
    },
    status: { $ne: "cancelled" }, // exclude the cancelled bookings. that means only confirmed and hold bookings are considered
  })
  .populate("startHalt endHalt")
  .populate({
    path: "seats",
    populate: {
      path: "wagonRef",
      select: "wagonClassRef",
      populate: {
        path: "wagonClassRef",
        select: "name",
      },
    },
  });

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
  
  const bookedSeatsCount = {
    firstClass: 0,
    secondClass: 0,
    thirdClass: 0,
  };
  
  // for each booked seat, increment the count of the respective class
  relevantBookedSeats.forEach((seat) => {
    if (seat.wagonRef.wagonClassRef.name === "first") {
      bookedSeatsCount.firstClass++;
    } else if (seat.wagonRef.wagonClassRef.name === "second") {
      bookedSeatsCount.secondClass++;
    } else {
      bookedSeatsCount.thirdClass++;
    }
  });
  return bookedSeatsCount;
};


export const getDetailsOfSchedule = async (req, res, next) => {
  const { scheduleId, fromHaltId, toHaltId, date } = req.query;
  const fromHalt = await Halt.findById(fromHaltId).populate("stationRef");
  const toHalt = await Halt.findById(toHaltId).populate("stationRef");
  const schedule = await Schedule.findById(scheduleId).populate("sourceRef destinationRef").populate({
    path: "trainRef",
    select: "name",
  });
  const totalSeatsCount = await getTotalSeatsofEachClass(schedule.trainRef);
  const bookedSeatsCount = await getBookedSeatsofEachClass(scheduleId, date, fromHalt, toHalt);
  const firstClassSeats = totalSeatsCount.firstClass - bookedSeatsCount.firstClass;
  const secondClassSeats = totalSeatsCount.secondClass - bookedSeatsCount.secondClass;
  const thirdClassSeats = totalSeatsCount.thirdClass - bookedSeatsCount.thirdClass;

  const classesAndMultipliers = await WagonClass.find();

  return res.status(200).json({
    schedule,
    fromHalt,
    toHalt,
    firstClassSeats,
    secondClassSeats,
    thirdClassSeats,
    classesAndMultipliers,
  });
};
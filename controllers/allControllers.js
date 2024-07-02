import Schedule from "../models/schedule.model.js";
import Halt from "../models/halt.model.js";
import Train from "../models/train.model.js";
import Ticket from "../models/ticket.model.js";
import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";
import Station from "../models/station.model.js";
import Wagon from "../models/wagon.model.js";
import Seat from "../models/seat.model.js";
import WagonClass from "../models/wagonClass.model.js";

import ExpressError from "../utils/ExpressError.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { get } from "mongoose";

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

  res.status(200).json({
    requestedClassWagons,
    fromHalt,
    toHalt,
    fareMultiplier,
    date,
  });
};

// create a pending booking until the user makes the payment
export const createPendingBooking = async (req, res, next) => {
  const {
    userId,
    scheduleId,
    fromHalt,
    toHalt,
    passengerDetails,
    date,
    fareMultiplier,
  } = req.body;
  const tripFare = fareMultiplier * (toHalt.price - fromHalt.price);
  const pendingTime = new Date(Date.now() + 12 * 60 * 1000); // 12 minutes from now
  const booking = new Booking({
    userRef: userId,
    scheduleRef: scheduleId,
    date,
    startHalt: fromHalt._id,
    endHalt: toHalt._id,
    totalAmount: tripFare * passengerDetails.length,
    status: "pending",
    seats: selectedSeatIds,
    pendingTime, // store the expiry time of the hold
  });
  await booking.save();
  for (let passenger of passengerDetails) {
    const ticket = new Ticket({
      bookingRef: booking._id,
      name: passenger.name,
      age: passenger.age,
      seatRef: passenger.seatId,
      ticketPrice: tripFare,
    });
    await ticket.save();
  }
  return res
    .status(200)
    .json({ bookingId: booking._id, expireTime: pendingTime });
};

export const confirmBooking = async (req, res, next) => {
  const { bookingId, userId } = req.body;
  const booking = await Booking.findById(bookingId);

  booking.status = "approved";
  booking.pendingTime = undefined;
  await booking.save();

  // // Find the user by ID
  // const user = await User.findById(userId);
  // if (!user) {
  //   return res.status(404).json({ message: "User not found" });
  // }

  //   // Generate PDFs for each seat
  //   const pdfBuffers = await generateETickets(booking);

  //   // Send email to the user with e-tickets
  //   await sendConfirmationEmail(user.email, pdfBuffers);

  return res.status(200).json({ message: "Booking confirmed" });
};

export const cancelBooking = async (req, res, next) => {
  const { bookingId } = req.body;
  const booking = await Booking.findById(bookingId);
  if (booking.date - Date.now() <= 0) {
    throw new ExpressError("Cannot cancel past bookings", 400);
  }
  booking.status = "cancelled";
  booking.pendingTime = undefined;
  await booking.save();
  return res.status(200).json({ message: "Booking cancelled" });
};

export async function releaseExpiredPendingBookings() {
  const now = new Date();
  const bookings = await Booking.find({
    status: "pending",
    pendingTime: { $lt: now },
  });
  for (let booking of bookings) {
    booking.status = "cancelled";
    await booking.save();
  }
}

export const register = async (req, res, next) => {
  const { username, firstName, lastName, email, phone, password, gender } =
    req.body;
  const hashedPassword = await bcryptjs.hash(password, 12);
  try {
    const newUser = new User({
      username,
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      gender,
    });
    await newUser.save();
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);
    const { password: hashed, ...restOfUser } = newUser._doc;
    res
      .cookie("access_token", token, { httpOnly: true })
      .status(200)
      .json(restOfUser);
  } catch (error) {
    if (error.keyValue.email) {
      return res.status(400).json({ message: "Email already exists" });
    } else if (error.keyValue.username) {
      return res.status(400).json({ message: "Username already exists" });
    }
    next(error);
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "Invalid email or password" });
  }
  const isMatch = await bcryptjs.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid email or password" });
  }
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  const { password: hashed, ...restOfUser } = user._doc;
  res
    .cookie("access_token", token, { httpOnly: true })
    .status(200)
    .json(restOfUser);
};

export const logout = async (req, res, next) => {
  res.clearCookie("access_token").json({ message: "Logged out" });
};

export const getProfile = async (req, res, next) => {
  const user = await User.findById(req.user.id).select("-password");
  res.status(200).json(user);
};

export const getBookingHistory = async (req, res, next) => {
  const bookings = await Booking.find({ userRef: req.params.id })
    .populate({
      path: "scheduleRef",
      select: "trainRef",
      populate: {
        path: "trainRef",
        select: "name",
      },
    })
    .populate({
      path: "startHalt",
      populate: {
        path: "stationRef",
      },
    })
    .populate({
      path: "endHalt",
      populate: {
        path: "stationRef",
      },
    })
    .sort({ date: -1 });

  res.status(200).json(bookings);
};

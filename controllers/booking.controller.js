import Booking from "../models/booking.model.js";
import ExpressError from "../utils/ExpressError.utils.js";
import Halt from "../models/halt.model.js";
import WagonClass from "../models/wagonClass.model.js";

import {
  getBookedSeatsofSchedule,
  generateETickets,
  sendConfirmationEmail,
  sendCancellationEmail,
} from "./helpers/booking.helper.js";

import Stripe from "stripe";

// create a pending booking until the user makes the payment
export const createPendingBooking = async (req, res, next) => {
  const {
    userId = undefined,
    scheduleId,
    date,
    fromHaltId,
    toHaltId,
    selectedSeatIds,
    selectedClassId,
  } = req.body;

  // get fromHalt and toHalt
  const fromHalt = await Halt.findById(fromHaltId).select("price");
  const toHalt = await Halt.findById(toHaltId).select("price");

  // get the fare multiplier for the selected class
  const selectedClass = await WagonClass.findById(selectedClassId).select(
    "fareMultiplier"
  );
  const fareMultiplier = selectedClass.fareMultiplier;

  // I want to check if the selected seats are available
  const bookedSeats = await getBookedSeatsofSchedule(
    scheduleId,
    date,
    fromHalt,
    toHalt
  );
  const bookedSeatStrings = bookedSeats.map((seatId) => seatId.toString());
  const allAvailable = selectedSeatIds.every(
    (seatId) => !bookedSeatStrings.includes(seatId.toString())
  );

  if (!allAvailable) {
    throw new ExpressError("One or more selected seats are not available", 400);
  }

  const totalFare =
    fareMultiplier * (toHalt.price - fromHalt.price) * selectedSeatIds.length;
  const pendingTime = new Date(Date.now() + 5 * 60 * 1000); // select pending time as 5 minutes from now
  const booking = new Booking({
    userRef: userId,
    scheduleRef: scheduleId,
    date,
    startHalt: fromHalt._id,
    endHalt: toHalt._id,
    totalFare,
    status: "pending",
    seats: selectedSeatIds,
    pendingTime, // store the expiry time of the hold
  });
  await booking.save();
  return res
    .status(200)
    .json({ bookingId: booking._id, expireTime: pendingTime });
};

export const confirmBooking = async (req, res, next) => {
  const { bookingId, email, id } = req.body;
  console.log("body: ", req.body);

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const booking = await Booking.findById(bookingId)
    .populate({
      path: "startHalt",
      select: "stationRef platform departureTime",
      populate: {
        path: "stationRef",
        select: "name",
      },
    })
    .populate({
      path: "endHalt",
      select: "stationRef arrivalTime",
      populate: {
        path: "stationRef",
        select: "name",
      },
    })
    .populate({
      path: "scheduleRef",
      select: "trainRef",
      populate: {
        path: "trainRef",
        select: "name",
      },
    })
    .populate({
      path: "seats",
      select: "name wagonRef",
      populate: {
        path: "wagonRef",
        select: "wagonClassRef wagonNumber",
        populate: {
          path: "wagonClassRef",
          select: "name",
        },
      },
    });

  if (!booking) {
    throw new ExpressError("Booking not found", 404);
  }

  if (booking.status !== "pending") {
    throw new ExpressError("Booking is not pending", 400);
  }

  const payment = await stripe.paymentIntents.create({
    amount: booking.totalFare * 100, // Amount in the smallest currency unit (e.g., 500 means $5.00)
    currency: "usd",
    description: `Train booking payment: ${booking._id}`,
    payment_method: id,
    confirm: true,
    automatic_payment_methods: {
      enabled: true, // Enable automatic payment methods
      allow_redirects: "never", // Prevent redirect-based payment methods
    },
  });

  if (payment.status !== "succeeded") {
    throw new ExpressError("Payment failed", 400);
  }

  booking.status = "approved";
  booking.pendingTime = undefined;
  await booking.save();

  // Generate PDFs for each seat
  const pdfBuffers = await generateETickets(booking);

  // Send email to the user with e-tickets
  await sendConfirmationEmail(email, pdfBuffers);

  return res.status(200).json({ message: "Booking confirmed" });
};

export const cancelBooking = async (req, res, next) => {
  const { bookingId } = req.params;
  console.log("userId: ", req.userId);
  const booking = await Booking.findById(bookingId)
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
    .populate({
      path: "scheduleRef",
      select: "trainRef",
      populate: {
        path: "trainRef",
        select: "name",
      },
    })
    .populate({
      path: "userRef",
      select: "email username",
    });

  if (!booking) {
    throw new ExpressError("Booking not found", 404);
  }
  if (booking.date - Date.now() <= 0) {
    throw new ExpressError("Cannot cancel past bookings", 400);
  }
  booking.status = "cancelled";
  booking.pendingTime = undefined;
  await booking.save();

  await sendCancellationEmail(
    booking.userRef.email,
    booking.userRef.username,
    booking.startHalt.stationRef.name,
    booking.endHalt.stationRef.name,
    booking.scheduleRef.trainRef.name,
    booking.date
  );

  return res.status(200).json({ message: "Booking cancelled" });
};

export const getBookingDetails = async (req, res, next) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId)
    .populate({
      path: "startHalt",
      select: "stationRef platform departureTime",
      populate: {
        path: "stationRef",
        select: "name",
      },
    })
    .populate({
      path: "endHalt",
      select: "stationRef arrivalTime platform",
      populate: {
        path: "stationRef",
        select: "name",
      },
    })
    .populate({
      path: "scheduleRef",
      select: "trainRef",
      populate: {
        path: "trainRef",
        select: "name",
      },
    })
    .select("-pendingTime -seats");

  res.status(200).json({ booking });
};

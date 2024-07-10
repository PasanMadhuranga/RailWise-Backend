import Booking from "../models/booking.model.js";
import ExpressError from "../utils/ExpressError.utils.js";


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
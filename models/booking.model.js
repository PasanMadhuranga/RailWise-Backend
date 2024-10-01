import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  userRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  scheduleRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Schedule",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  startHalt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Halt",
    required: true,
  },
  endHalt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Halt",
    required: true,
  },
  totalFare: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    required: true,
    enum: ["approved", "cancelled", "pending", "expired"],
  },
  seats: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
    },
  ],
  paymentId: String,
  pendingTime: {
    type: Date,
  },
});

bookingSchema.virtual('ticketPrice').get(function() {
  return this.totalFare / this.seats.length;
});

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;

import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  bookingRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
    enum: ["male", "female"],
  },
  seatRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Seat",
    required: true,
  },
  ticketPrice: {
    type: Number,
    required: true,
    min: 0,
  },
});

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;

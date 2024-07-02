import mongoose from "mongoose";

const seat = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  position: {
    type: [Number, Number],
    required: true,
  },
  wagonRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Wagon",
  }
});

const Seat = mongoose.model("Seat", seat);

export default Seat;

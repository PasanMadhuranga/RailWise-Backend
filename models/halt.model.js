import mongoose from "mongoose";

const haltSchema = new mongoose.Schema({
  scheduleRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Schedule",
    required: true,
  },
  stationRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Station",
    required: true,
  },
  arrivalTime: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^(0[1-9]|1[0-2]):([0-5]\d) (AM|PM|am|pm)$/.test(v);
      },
      message: (props) => `${props.value} is not a valid time format!`,
    },
  },
  departureTime: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^(0[1-9]|1[0-2]):([0-5]\d) (AM|PM|am|pm)$/.test(v);
      },
      message: (props) => `${props.value} is not a valid time format!`,
    },
  },
  haltOrder: {
    type: Number,
    required: true,
    min: 1,
  },
  platform: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
});

const Halt = mongoose.model("Halt", haltSchema);

export default Halt;

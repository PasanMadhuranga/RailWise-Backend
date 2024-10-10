import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  trainRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Train",
    required: true,
  },
  monday: {
    type: Boolean,
    default: false,
  },
  tuesday: {
    type: Boolean,
    default: false,
  },
  wednesday: {
    type: Boolean,
    default: false,
  },
  thursday: {
    type: Boolean,
    default: false,
  },
  friday: {
    type: Boolean,
    default: false,
  },
  saturday: {
    type: Boolean,
    default: false,
  },
  sunday: {
    type: Boolean,
    default: false,
  },
  scheduleType: {
    type: String,
    required: true,
    enum: ["express", "slow"],
  },
});

const Schedule = mongoose.model("Schedule", scheduleSchema);

export default Schedule;

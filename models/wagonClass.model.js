import mongoose from "mongoose";

const wagonClassSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  fareMultiplier: {
    type: Number,
    required: true,
  },
  features: {
    type: [String], 
    required: true,
  },
});

const WagonClass = mongoose.model("WagonClass", wagonClassSchema);
export default WagonClass;

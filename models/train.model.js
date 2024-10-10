import mongoose from "mongoose";

const trainSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  wagons: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wagon",
    },
  ],
});

const Train = mongoose.model("Train", trainSchema);

export default Train;
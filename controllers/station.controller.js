import Station from "../models/station.model.js";

// get all the stations
export const getAllStations = async (req, res, next) => {
    const stations = await Station.find().sort({ name: 1 });
    res.status(200).json(stations);
  };
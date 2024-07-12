import User from "../models/user.model.js";
import Booking from "../models/booking.model.js";
import Train from "../models/train.model.js";
import Halt from "../models/halt.model.js";
import Schedule from "../models/schedule.model.js";
import Station from "../models/station.model.js";

import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import ExpressError from "../utils/ExpressError.utils.js";


export const register = async (req, res, next) => {
  const { username, email, phone, password, } =
    req.body;
  const hashedPassword = await bcryptjs.hash(password, 12);
  try {
    const newUser = new User({
      username,
      email,
      phone,
      password: hashedPassword,
    });
    await newUser.save();
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    const { password: hashed, ...restOfUser } = newUser._doc;
    res
      .cookie("access_token", token, { httpOnly: true })
      .status(200)
      .json(restOfUser);
  } catch (error) {
    if (error.keyValue.email) {
      throw new ExpressError("Email already exists", 400);
    } else if (error.keyValue.username) {
      throw new ExpressError("Username already exists", 400);
    }
    next(error);
  }
};

export const login = async (req, res, next) => {
  const { emailOrUsername, password } = req.body;
  const user = await User.findOne({
    $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
  });
  if (!user) {
    return res.status(400).json({ message: "Invalid email or password" });
  }
  const isMatch = await bcryptjs.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid email or password" });
  }
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  const { password: hashed, ...restOfUser } = user._doc;
  res
    .cookie("access_token", token, { httpOnly: true })
    .status(200)
    .json(restOfUser);
};

export const logout = async (req, res, next) => {
  res.clearCookie("access_token").json({ message: "Logged out" });
};

export const getProfile = async (req, res, next) => {
  const user = await User.findById(req.user.id).select("-password");
  res.status(200).json(user);
};

export const getBookingHistory = async (req, res, next) => {
  const bookings = await Booking.find({ userRef: req.params.id })
    .populate({
      path: "scheduleRef",
      select: "trainRef",
      populate: {
        path: "trainRef",
        select: "name",
      },
    })
    .populate({
      path: "startHalt",
      populate: {
        path: "stationRef",
      },
    })
    .populate({
      path: "endHalt",
      populate: {
        path: "stationRef",
      },
    })
    .sort({ date: -1 });

  res.status(200).json(bookings);
};
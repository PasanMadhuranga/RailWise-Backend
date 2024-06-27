import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";

import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";


export const register = async (req, res, next) => {
    const { username, firstName, lastName, email, phone, password, gender } =
      req.body;
    const hashedPassword = await bcryptjs.hash(password, 12);
    try {
      const newUser = new User({
        username,
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        gender,
      });
      await newUser.save();
      const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);
      const { password: hashed, ...restOfUser } = newUser._doc;
      res
        .cookie("access_token", token, { httpOnly: true })
        .status(200)
        .json(restOfUser);
    } catch (error) {
      if (error.keyValue.email) {
        return res.status(400).json({ message: "Email already exists" });
      } else if (error.keyValue.username) {
        return res.status(400).json({ message: "Username already exists" });
      }
      next(error);
    }
  };
  
  
  export const login = async (req, res, next) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
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
  
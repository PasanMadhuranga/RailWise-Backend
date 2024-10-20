import User from "../models/user.model.js";
import Booking from "../models/booking.model.js";
import Train from "../models/train.model.js";
import Halt from "../models/halt.model.js";
import Schedule from "../models/schedule.model.js";
import Station from "../models/station.model.js";
import ExpressError from "../utils/ExpressError.utils.js";
import { sendForgotPassEmail } from "./helpers/user.helper.js";

import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export const register = async (req, res, next) => {
  const { username, email, phone, password } = req.body;
  try {
    const newUser = new User({
      username,
      email,
      phone,
      password,
    });
    await newUser.save();
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);

    const { password: hashed, ...restOfUser } = newUser._doc;
    res
      .cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
      })
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
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  const { password: hashed, ...restOfUser } = user._doc;
  res
    .cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    })
    .status(200)
    .json(restOfUser);
};

export const logout = async (req, res, next) => {
  res.clearCookie("access_token").json({ message: "Logged out" });
};

export const updateProfile = async (req, res, next) => {
  const { username, email, phone, oldPassword, newPassword } = req.body;
  const user = await User.findById(req.userId);
  const isMatch = await bcryptjs.compare(oldPassword, user.password);

  if (!isMatch) {
    throw new ExpressError("Invalid password", 400);
  }

  if (newPassword) {
    user.password = newPassword;
  }
  user.username = username;
  user.email = email;
  user.phone = phone;
  await user.save();

  const { password: hashed, ...restOfUser } = user._doc;
  res.status(200).json(restOfUser);
};

export const getBookingHistory = async (req, res, next) => {
  const bookings = await Booking.find({
    userRef: req.userId,
    $or: [{ status: "approved" }, { status: "cancelled" }],
  })
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

export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new ExpressError("User not found", 404);
  }
  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetToken = resetToken;
  user.resetTokenExpiry = Date.now() + 3600000;
  await user.save();

  await sendForgotPassEmail(email, resetToken);

  res.status(200).json({ message: "Email sent" });
};

export const resetPassword = async (req, res, next) => {
  const { resetToken, newPassword } = req.body;

  const user = await User.findOne({
    resetToken,
    resetTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ExpressError("Invalid or expired token", 400);
  }

  user.password = newPassword;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;

  await user.save();

  res.status(200).json({ message: "Password reset" });
};

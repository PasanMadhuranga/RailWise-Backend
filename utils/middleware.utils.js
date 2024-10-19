import jwt from "jsonwebtoken";
import ExpressError from "./ExpressError.utils.js";
import { pendingSchema, userRegistrationSchema } from "./validationSchema.utils.js";

export const verifyToken = (req, res, next) => {
  const token = req.cookies.access_token;
  if (!token) {
    throw new ExpressError("Unauthorized", 401);
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      throw new ExpressError("Unauthorized", 401);
    }
    req.userId = decoded.id;
    next();
  });
};

export const verifyAdminToken = (req, res, next) => {
  const token = req.cookies.access_token;
  if (!token) {
    throw new ExpressError("Unauthorized", 401);
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      throw new ExpressError("Unauthorized", 401);
    }
    req.adminId = decoded.id;
    next();
  });
};

export const validatePendingBooking = (req,res,next) => {
  const {error} = pendingSchema.validate(req.body);
  if(error){
    throw new ExpressError(error.details[0].message, 400);
  }
  next();
}

export const validateUserRegistration = (req,res,next) => {
  const {error} = userRegistrationSchema.validate(req.body);
  if(error){
    throw new ExpressError(error.details[0].message, 400);
  }
  next();
}


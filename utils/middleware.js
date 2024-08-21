import jwt from "jsonwebtoken";
import ExpressError from "./ExpressError.utils.js";

export const verifyToken = (req, res, next) => {
  const token = req.cookies.access_token;
  if (!token) {
    throw new ExpressError("Unauthorized", 401);
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      throw new ExpressError("Unauthorized", 401);
    }
    req.userId = decoded.id; // decoded is the payload that is provided when creating the token, in this case, the user id
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
    req.adminId = decoded.id; // decoded is the payload that is provided when creating the token, in this case, the admin id
    next();
  });
};

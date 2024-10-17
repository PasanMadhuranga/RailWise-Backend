import express from "express";
import { catchAsync } from "../utils/catchAsync.utils.js";
import {
  verifyToken,
  validatePendingBooking,
} from "../utils/middleware.utils.js";
import {
  createPendingBooking,
  confirmBooking,
  cancelBooking,
  getBookingDetails,
  validateETicket,
} from "../controllers/booking.controller.js";

const router = express.Router();

router.post(
  "/createPendingBooking",
  validatePendingBooking,
  catchAsync(createPendingBooking)
);
router.post("/confirmBooking", catchAsync(confirmBooking));

router
  .route("/:bookingId")
  .get(catchAsync(getBookingDetails))
  .delete(verifyToken, catchAsync(cancelBooking));

router.get("/validateTicket/:bookingId/:seatId/:signature", validateETicket);

export default router;

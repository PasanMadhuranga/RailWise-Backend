import express from 'express';
import { catchAsync } from '../utils/catchAsync.utils.js';
import { verifyToken,validatePendingBooking } from '../utils/middleware.js';
import { createPendingBooking, confirmBooking, cancelBooking, getBookingDetails } from "../controllers/booking.controller.js";

const router = express.Router();

router.post('/createPendingBooking', verifyToken, validatePendingBooking, catchAsync(createPendingBooking)); // apply validatePendingBooking middleware before creating a pending booking
router.post('/confirmBooking', verifyToken, catchAsync(confirmBooking));
router.route('/:bookingId')
    .get(catchAsync(getBookingDetails))
    .delete(catchAsync(cancelBooking));

// to validate pendingBooking
router.post('/validatePendingBooking', validatePendingBooking, verifyToken, (req, res) => {
    
    res.status(200).json({message: "Booking is valid"});
}); 

export default router;
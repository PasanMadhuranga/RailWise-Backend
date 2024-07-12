import express from 'express';
import { catchAsync } from '../utils/catchAsync.utils.js';
import { verifyToken } from '../utils/middleware.js';
import { createPendingBooking, confirmBooking, cancelBooking } from "../controllers/booking.controller.js";

const router = express.Router();

router.post('/createPendingBooking', catchAsync(createPendingBooking));
router.post('/confirmBooking', catchAsync(confirmBooking));
router.delete('/:bookingId', verifyToken, catchAsync(cancelBooking));

export default router;
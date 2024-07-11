import express from 'express';
import { catchAsync } from '../utils/catchAsync.utils.js';
import { createPendingBooking, confirmBooking } from "../controllers/booking.controller.js";

const router = express.Router();

router.post('/createPendingBooking', catchAsync(createPendingBooking));
router.post('/confirmBooking', catchAsync(confirmBooking));

export default router;
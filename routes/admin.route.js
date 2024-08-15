import express from 'express';
import { catchAsync } from '../utils/catchAsync.utils.js';
import { getBookingsCount, getCancelledBookingsCount,getTotalFare, getUserRegistrations, getBookingClassDistribution } from '../controllers/admin.controller.js';

const router = express.Router();

router.get('/bookingsCount/:scheduleId/:timeFrame', catchAsync(getBookingsCount));
router.get('/totalFare/:scheduleId/:timeFrame', catchAsync(getTotalFare));
router.get('/userRegistrations/:timeFrame', catchAsync(getUserRegistrations));
router.get('/cancelledBookingsCount/:scheduleId/:timeFrame', catchAsync(getCancelledBookingsCount));
router.get('/bookingClassDistribution/:scheduleId/:timeFrame', catchAsync(getBookingClassDistribution));

export default router;
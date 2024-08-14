import express from 'express';
import { catchAsync } from '../utils/catchAsync.utils.js';
import { getBookingsCount, getTotalFare, getUserRegistrations } from '../controllers/admin.controller.js';

const router = express.Router();

router.get('/bookingsCount/:scheduleId/:timeFrame', catchAsync(getBookingsCount));
router.get('/totalFare/:scheduleId/:timeFrame', catchAsync(getTotalFare));
router.get('/userRegistrations/:timeFrame', catchAsync(getUserRegistrations));

export default router;
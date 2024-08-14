import express from 'express';
import { catchAsync } from '../utils/catchAsync.utils.js';
import { getBookingsCount, getTotalFare } from '../controllers/admin.controller.js';

const router = express.Router();

router.get('/bookingsCount/:scheduleId/:timeFrame', catchAsync(getBookingsCount));
router.get('/totalFare/:scheduleId/:timeFrame', catchAsync(getTotalFare));

export default router;
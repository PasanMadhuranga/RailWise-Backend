import express from 'express';
import { catchAsync } from '../utils/catchAsync.utils.js';
import { getBookingsCount } from '../controllers/admin.controller.js';

const router = express.Router();

router.get('/bookingsCount/:scheduleId/:timeFrame', catchAsync(getBookingsCount));

export default router;
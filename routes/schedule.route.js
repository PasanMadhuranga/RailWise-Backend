import express from 'express';
import { catchAsync } from '../utils/catchAsync.utils.js';
import { getSchedules, getDetailsOfSchedule, getWagonsOfClass, getPopularRoutes } from "../controllers/schedule.controller.js";

const router = express.Router();

router.get('/', catchAsync(getSchedules));
router.get('/scheduleDetails', catchAsync(getDetailsOfSchedule));
router.get('/wagonsOfClass', catchAsync(getWagonsOfClass))
router.get('/popularRoutes', catchAsync(getPopularRoutes));

export default router;
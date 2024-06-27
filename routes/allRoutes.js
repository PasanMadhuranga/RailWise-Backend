import express from 'express';
import { asyncWrapper } from '../utils/AsyncWrapper.js';
import { getAllStations, getSchedules, getScheduleDetails, getWagonsOfClass } from "../controllers/allControllers.js";
 
const router = express.Router();

router.get('/stations', asyncWrapper(getAllStations));
router.get('/schedules', asyncWrapper(getSchedules));
router.get('/scheduleDetails', asyncWrapper(getScheduleDetails));
router.get('/wagonsOfClass', asyncWrapper(getWagonsOfClass));
export default router;
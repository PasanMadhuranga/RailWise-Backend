import express from 'express';
import { asyncWrapper } from '../utils/AsyncWrapper.js';
import { getAllStations, getSchedules, getWagonsOfClass, getDetailsOfSchedule, register, login, logout } from "../controllers/allControllers.js";
 
const router = express.Router();

router.get('/stations', asyncWrapper(getAllStations));
router.get('/schedules', asyncWrapper(getSchedules));
router.get('/scheduleDetails', asyncWrapper(getDetailsOfSchedule));
// router.get('/scheduleDetails', asyncWrapper(getScheduleDetails));
router.get('/wagonsOfClass', asyncWrapper(getWagonsOfClass));

router.post('/user/register', asyncWrapper(register));
router.post('/user/login', asyncWrapper(login));
router.get('/user/logout', asyncWrapper(logout));
export default router;
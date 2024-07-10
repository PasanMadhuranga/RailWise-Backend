import express from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { getAllStations, getSchedules, getWagonsOfClass, getDetailsOfSchedule, register, login, logout, getPopularRoutes} from "../controllers/allControllers.js";
 
const router = express.Router();




export default router;
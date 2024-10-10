import express from 'express';
import { catchAsync } from '../utils/catchAsync.utils.js';
import { getAllStations } from '../controllers/station.controller.js'

const router = express.Router();

router.get('/', catchAsync(getAllStations));

export default router;

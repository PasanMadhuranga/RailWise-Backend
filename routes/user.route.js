import express from 'express';
import { catchAsync } from '../utils/catchAsync.utils.js';
import { verifyToken } from '../utils/middleware.js';
import { register, login, logout, getBookingHistory, updateProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.post('/register', catchAsync(register));
router.post('/login', catchAsync(login));
router.get('/logout', verifyToken, catchAsync(logout));
router.get('/bookingHistory', verifyToken, catchAsync(getBookingHistory));
router.put('/updateProfile', verifyToken, catchAsync(updateProfile));

export default router;
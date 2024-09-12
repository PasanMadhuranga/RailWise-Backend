import express from 'express';
import { catchAsync } from '../utils/catchAsync.utils.js';
import { verifyToken, validateUserRegistration } from '../utils/middleware.utils.js';
import { register, login, logout, getBookingHistory, updateProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.post('/register', validateUserRegistration, catchAsync(register)); //validate before registering
router.post('/login', catchAsync(login));
router.get('/logout', verifyToken, catchAsync(logout));
router.get('/bookingHistory', verifyToken, catchAsync(getBookingHistory));
router.put('/updateProfile', verifyToken, catchAsync(updateProfile));

// to validate user registration
router.post('/validateUserRegistration', validateUserRegistration, (req, res) => {
    res.send(200).json({message: "User registration is valid"});
});

export default router;
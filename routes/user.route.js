import express from 'express';
import { catchAsync } from '../utils/catchAsync.utils.js';
import { register, login, logout } from "../controllers/user.controller.js";

const router = express.Router();

router.post('/register', catchAsync(register));
router.post('/login', catchAsync(login));
router.get('/logout', catchAsync(logout));

export default router;
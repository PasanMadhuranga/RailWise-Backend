const Joi = require('joi');


// pendingBooking   schema
const pendingSchema = Joi.object({
    userId: Joi.string().required(),
    scheduleId: Joi.string().required(),
    date: Joi.date().min(now).required(),
    fromHaltId: Joi.string().required(),
    toHaltId: Joi.string().required(),
    selectedSeatIds: Joi.array().items(Joi.string()).required(),
    selectedClassId: Joi.string().required(),
});

// for user registration
const userRegistrationSchema = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    password: Joi.string().min(6).required(),
});

module.exports = {
    pendingSchema,
    userRegistrationSchema,
};